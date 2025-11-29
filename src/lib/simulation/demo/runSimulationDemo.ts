#!/usr/bin/env node
/**
 * Monte Carlo Simulation Agent Integration Demo
 * 
 * Demonstrates the end-to-end flow:
 * 1. Template Engine (central orchestrator)
 * 2. Simulation processing
 * 3. Action extraction and agent discovery
 * 4. SimulationAgent execution
 * 5. Memory integration (bidirectional)
 */

import fs from 'fs';
import path from 'path';
import { supabase } from '../../supabase';
import { createSimulationServices } from '../index';
import { MemoryService } from '../../memory/memoryService';
import { DynamicTemplateEngine } from '../../templates/dynamicTemplateEngine';
import { SimulationAgent } from '../agents/simulationAgent';
import { RecommendedAction } from '../types';

async function runDemo() {
  console.log('====================================================');
  console.log('Monte Carlo Simulation Agent Integration Demo');
  console.log('====================================================');
  
  try {
    // 1. Initialize core services (following the proper architecture flow)
    console.log('\n📚 Initializing services...');
    const memoryService = new MemoryService(supabase);
    const templateEngine = new DynamicTemplateEngine(memoryService);
    
    // 2. Initialize simulation services using factory function
    const {
      simulationAdapter,
      simulationActionProcessor,
      simulationTemplateEngine
    } = createSimulationServices(memoryService, templateEngine);
    
    // 3. Initialize the simulation agent
    console.log('Creating SimulationAgent instance...');
    const simulationAgent = new SimulationAgent(memoryService);
    
    // 4. Load sample simulation data
    console.log('Loading sample simulation data...');
    const sampleData = await loadSampleData();
    
    // 5. Process simulation through adapter
    console.log('Processing simulation data...');
    const simulationResult = await simulationAdapter.processSimulationData(sampleData);
    console.log(`Processed simulation: ${simulationResult.id}`);
    console.log(`Type: ${simulationResult.simulationType}`);
    console.log(`Recommended actions: ${simulationResult.aggregateMetrics.recommendedActions.length}`);
    
    // 6. Process for actions (template engine orchestrates this flow)
    console.log('\nExtracting actions through template engine...');
    const confidenceThreshold = 0.6;
    await simulationTemplateEngine.processSimulationResults(
      simulationResult,
      confidenceThreshold
    );
    
    // 7. Generate action plan (template)
    console.log('Generating action plan template...');
    const actionPlan = await simulationActionProcessor.generateActionPlan(simulationResult);
    console.log(`Created template with ID: ${actionPlan.template.id}`);
    console.log(`Template has ${actionPlan.actionFunctions.length} action functions`);
    
    // 8. Demonstrate executing a high-confidence action
    if (simulationResult.aggregateMetrics.recommendedActions.length > 0) {
      console.log('\nSelecting high-confidence action for execution...');
      // Find an action with high confidence
      const highConfidenceActions = simulationResult.aggregateMetrics.recommendedActions
        .filter(action => action.confidenceScore > 0.7)
        .sort((a, b) => b.confidenceScore - a.confidenceScore);
      
      if (highConfidenceActions.length > 0) {
        const actionToExecute = highConfidenceActions[0];
        
        console.log(`Selected action: "${actionToExecute.actionName}"`);
        console.log(`Description: ${actionToExecute.actionDescription}`);
        console.log(`Confidence: ${actionToExecute.confidenceScore}`);
        
        // Execute action with our simulation agent
        console.log('\nExecuting action with SimulationAgent...');
        const executionResult = await simulationAgent.executeAction(
          actionToExecute,
          simulationResult.id
        );
        
        // Output results
        console.log('\nExecution Result:');
        console.log(`Status: ${executionResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Confidence: ${executionResult.result.confidence}`);
        console.log('Insights:');
        executionResult.result.insights.forEach((insight: string, i: number) => {
          console.log(`  ${i + 1}. ${insight}`);
        });
        console.log(`Metrics: ${Object.keys(executionResult.result.metrics).length} metrics collected`);
        
        // Demonstrate memory integration
        console.log('\nVerifying memory integration...');
        const memoryResults = await memoryService.queryShortTermMemory({
          type: 'simulation_action_execution',
          filters: { actionId: actionToExecute.actionId },
          limit: 1
        });
        
        console.log(`Memory items found: ${memoryResults.length}`);
        if (memoryResults.length > 0) {
          console.log('Memory integration confirmed - execution recorded in memory system');
        }
        
        // Show database state change
        console.log('\nChecking database state...');
        const { data: dbAction } = await supabase
          .from('simulation_actions')
          .select('*')
          .eq('action_id', actionToExecute.actionId)
          .single();
          
        if (dbAction) {
          console.log(`Action status in database: ${dbAction.status}`);
          console.log(`Execution timestamp: ${dbAction.executed_at}`);
          console.log(`Executed by agent: ${dbAction.executed_by_agent_id}`);
        }
        
        return {
          success: true,
          simulationId: simulationResult.id,
          actionId: actionToExecute.actionId,
          templateId: actionPlan.template.id
        };
      } else {
        console.log('No high-confidence actions found');
        return { success: false, error: 'No high-confidence actions found' };
      }
    } else {
      console.log('No recommended actions found in simulation data');
      return { success: false, error: 'No recommended actions in simulation data' };
    }
  } catch (error) {
    console.error('Error running simulation demo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load sample simulation data from the provided JSON
 */
async function loadSampleData(): Promise<any> {
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

// Run the demo if executed directly
if (require.main === module) {
  runDemo()
    .then(result => {
      console.log('\n====================================================');
      console.log('Demo Complete!');
      console.log('====================================================');
      console.log('Results:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { runDemo };
