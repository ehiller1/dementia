import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DynamicTemplateEngine } from '../../templates/dynamicTemplateEngine';
import { MemoryService } from '../../memory/memoryService';
import { OpenAIEmbeddingService } from '../../embedding/openAIEmbeddingService';
import { SimulationAdapter } from '../simulationAdapter';
import { SimulationActionProcessor } from '../simulationActionProcessor';
import { SimulationAgentDiscoveryService } from '../simulationAgentDiscoveryService';
import { SimulationTemplateEngine } from '../simulationTemplateEngine';
import { SimulationAgent } from '../agents/simulationAgent';
import { RecommendedAction, SimulationResult } from '../types';
import { supabase } from '../../supabase';

/**
 * Simulation Demo that demonstrates the end-to-end flow of:
 * 1. Loading sample simulation data
 * 2. Processing through adapter
 * 3. Extracting actions
 * 4. Executing with SimulationAgent
 * 5. Storing results in memory
 */
export class SimulationDemo {
  private memoryService: MemoryService;
  private embeddingService: OpenAIEmbeddingService;
  private simulationAdapter: SimulationAdapter;
  private simulationActionProcessor: SimulationActionProcessor;
  private simulationAgentDiscoveryService: SimulationAgentDiscoveryService;
  private simulationTemplateEngine: SimulationTemplateEngine;
  private dynamicTemplateEngine: DynamicTemplateEngine;
  private simulationAgent: SimulationAgent;

  constructor() {
    // Initialize services
    this.memoryService = new MemoryService(supabase);
    this.embeddingService = new OpenAIEmbeddingService();
    this.dynamicTemplateEngine = new DynamicTemplateEngine(this.memoryService);
    
    // Initialize simulation services
    this.simulationAgentDiscoveryService = new SimulationAgentDiscoveryService(
      this.memoryService,
      this.embeddingService
    );
    
    this.simulationAdapter = new SimulationAdapter(
      this.memoryService,
      this.embeddingService
    );
    
    this.simulationActionProcessor = new SimulationActionProcessor(
      this.memoryService,
      this.embeddingService,
      this.simulationAgentDiscoveryService
    );
    
    this.simulationTemplateEngine = new SimulationTemplateEngine(
      this.dynamicTemplateEngine,
      this.memoryService,
      this.simulationAdapter,
      this.simulationActionProcessor,
      this.simulationAgentDiscoveryService
    );
    
    // Create simulation agent
    this.simulationAgent = new SimulationAgent(this.memoryService);
    
    // Register agent with discovery service
    this.registerSimulationAgent();
  }
  
  /**
   * Register the simulation agent with the discovery service
   */
  private async registerSimulationAgent() {
    const agentInfo = this.simulationAgent.getAgentInfo();
    
    try {
      // Check if agent already exists
      const { data: existingAgents } = await supabase
        .from('agents')
        .select('id')
        .eq('id', agentInfo.id);
        
      if (!existingAgents || existingAgents.length === 0) {
        // Add agent to database
        await supabase
          .from('agents')
          .insert({
            id: agentInfo.id,
            name: agentInfo.name,
            description: agentInfo.description,
            capabilities: agentInfo.capabilities,
            expertise: agentInfo.expertise,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        console.log(`Registered agent: ${agentInfo.name} (${agentInfo.id})`);
      }
    } catch (error) {
      console.error('Error registering simulation agent:', error);
    }
  }
  
  /**
   * Run the full simulation demo
   */
  async runDemo() {
    console.log('==========================================');
    console.log('Starting Simulation Integration Demo');
    console.log('==========================================');
    
    try {
      // 1. Load sample data
      console.log('\n1. Loading sample simulation data...');
      const sampleData = await this.loadSampleData();
      console.log(`Loaded simulation data with ${Object.keys(sampleData).length} top-level keys`);
      
      // 2. Process simulation data through adapter
      console.log('\n2. Processing simulation data through adapter...');
      const simulationResult = await this.simulationAdapter.processSimulationData(
        sampleData
      );
      console.log(`Processed simulation: ${simulationResult.id}`);
      console.log(`Type: ${simulationResult.simulationType}`);
      console.log(`Recommended Actions: ${simulationResult.aggregateMetrics.recommendedActions.length}`);
      
      // 3. Process simulation actions
      console.log('\n3. Processing simulation for actions...');
      const confidenceThreshold = 0.6;
      await this.simulationActionProcessor.processSimulationForActions(
        simulationResult,
        confidenceThreshold
      );
      console.log(`Processed actions with confidence threshold: ${confidenceThreshold}`);
      
      // 4. Create a template from simulation
      console.log('\n4. Creating template from simulation...');
      const actionPlan = await this.simulationActionProcessor.generateActionPlan(
        simulationResult
      );
      console.log(`Created template with ID: ${actionPlan.template.id}`);
      console.log(`Template has ${actionPlan.actionFunctions.length} action functions`);
      
      // 5. Retrieve actions from database
      console.log('\n5. Retrieving actions from database...');
      const { data: actions } = await supabase
        .from('simulation_actions')
        .select('*')
        .eq('simulation_id', simulationResult.id)
        .order('confidence_score', { ascending: false });
        
      if (!actions || actions.length === 0) {
        throw new Error('No actions found in database');
      }
      
      console.log(`Retrieved ${actions.length} actions from database`);
      
      // 6. Execute high-confidence action with simulation agent
      console.log('\n6. Executing high-confidence action with simulation agent...');
      
      // Find a high-confidence action
      const highConfidenceAction = actions.find(a => 
        a.confidence_score > 0.8 && a.status === 'PENDING'
      );
      
      if (!highConfidenceAction) {
        console.log('No high-confidence pending actions found, using first available action');
        
        if (actions.length === 0) {
          throw new Error('No actions available to execute');
        }
      }
      
      const actionToExecute = highConfidenceAction || actions[0];
      
      // Convert db action to RecommendedAction type
      const recommendedAction: RecommendedAction = {
        actionId: actionToExecute.action_id,
        actionName: actionToExecute.action_name,
        actionDescription: actionToExecute.action_description,
        expectedOutcome: actionToExecute.expected_outcome,
        successProbability: actionToExecute.success_probability,
        confidenceScore: actionToExecute.confidence_score,
        riskLevel: actionToExecute.risk_level,
        impactScore: actionToExecute.impact_score || 0.7,
        requiresApproval: actionToExecute.requires_approval
      };
      
      // Execute the action
      const executionResult = await this.simulationAgent.executeAction(
        recommendedAction,
        simulationResult.id
      );
      
      console.log(`Executed action: ${actionToExecute.action_name}`);
      console.log(`Execution result: ${executionResult.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (executionResult.success) {
        console.log('Insights:');
        executionResult.result.insights.forEach((insight: string) => {
          console.log(`  - ${insight}`);
        });
      }
      
      // 7. Check updated action status
      console.log('\n7. Checking updated action status...');
      const { data: updatedAction } = await supabase
        .from('simulation_actions')
        .select('*')
        .eq('action_id', actionToExecute.action_id)
        .single();
        
      console.log(`Action status: ${updatedAction.status}`);
      console.log(`Executed by agent: ${updatedAction.executed_by_agent_id}`);
      console.log(`Execution time: ${updatedAction.executed_at}`);
      
      // 8. Query memory for execution record
      console.log('\n8. Querying memory for execution record...');
      const memoryItems = await this.memoryService.queryShortTermMemory({
        type: 'simulation_action_execution',
        filters: {
          actionId: actionToExecute.action_id
        },
        limit: 1
      });
      
      console.log(`Found ${memoryItems.length} memory records for execution`);
      
      if (memoryItems.length > 0) {
        console.log('Memory content:');
        console.log(JSON.stringify(memoryItems[0].content, null, 2));
      }
      
      console.log('\n==========================================');
      console.log('Simulation Integration Demo Completed');
      console.log('==========================================');
      
      return {
        success: true,
        simulationId: simulationResult.id,
        templateId: actionPlan.template.id,
        executedActionId: actionToExecute.action_id,
        executionResult
      };
      
    } catch (error) {
      console.error('Error running simulation demo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Load sample simulation data
   */
  private async loadSampleData(): Promise<any> {
    try {
      const sampleDataPath = path.join(
        process.cwd(),
        'src/lib/simulation/sample-simulation-data.json'
      );
      
      const data = await fs.promises.readFile(sampleDataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading sample data:', error);
      throw new Error('Failed to load sample simulation data');
    }
  }
}

// Export a function to run the demo
export const runSimulationDemo = async () => {
  const demo = new SimulationDemo();
  return await demo.runDemo();
};

// Allow running directly from command line
if (require.main === module) {
  runSimulationDemo()
    .then(result => {
      console.log('Demo result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Demo error:', error);
      process.exit(1);
    });
}
