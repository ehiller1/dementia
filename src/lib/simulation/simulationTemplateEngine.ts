import { v4 as uuidv4 } from 'uuid';
import { 
  SimulationResult, 
  RecommendedAction,
  SimulationActionPlan
} from './types';
import { MemoryService } from '../memory/memoryService';
import { SimulationAdapter } from './simulationAdapter';
import { SimulationActionProcessor } from './simulationActionProcessor';
import { SimulationAgentDiscoveryService } from './simulationAgentDiscoveryService';
import { DynamicTemplateEngine } from '../templates/dynamicTemplateEngine';
import { Template, Function } from '../templates/types';
import { supabase } from '../supabase';

/**
 * Extension of the DynamicTemplateEngine to handle simulation results
 * and integrate them into the template-driven workflow
 */
export class SimulationTemplateEngine {
  private dynamicTemplateEngine: DynamicTemplateEngine;
  private memoryService: MemoryService;
  private simulationAdapter: SimulationAdapter;
  private simulationActionProcessor: SimulationActionProcessor;
  private simulationAgentDiscoveryService: SimulationAgentDiscoveryService;

  constructor(
    dynamicTemplateEngine: DynamicTemplateEngine,
    memoryService: MemoryService,
    simulationAdapter: SimulationAdapter,
    simulationActionProcessor: SimulationActionProcessor,
    simulationAgentDiscoveryService: SimulationAgentDiscoveryService
  ) {
    this.dynamicTemplateEngine = dynamicTemplateEngine;
    this.memoryService = memoryService;
    this.simulationAdapter = simulationAdapter;
    this.simulationActionProcessor = simulationActionProcessor;
    this.simulationAgentDiscoveryService = simulationAgentDiscoveryService;
  }

  /**
   * Process raw simulation data and integrate it with the template engine
   */
  async processSimulationResults(
    rawSimulationData: any, 
    templateId?: string,
    confidenceThreshold: number = 0.7
  ): Promise<SimulationResult> {
    try {
      console.log(`[📝 SimulationTemplateEngine] ORCHESTRATING simulation processing workflow...`);
      console.log(`[📝 SimulationTemplateEngine] Template ID: ${templateId || 'New template will be generated'}`);
      console.log(`[📝 SimulationTemplateEngine] Confidence threshold set to: ${confidenceThreshold}`);
      
      // 1. Process raw simulation data into structured format
      console.log(`[📝 SimulationTemplateEngine] Step 1: Delegating to SimulationAdapter for data processing...`);
      const simulationResult = await this.simulationAdapter.processSimulationData(
        rawSimulationData,
        templateId
      );
      
      // 2. Generate action plan from simulation
      console.log(`[📝 SimulationTemplateEngine] Step 2: Delegating to SimulationActionProcessor to generate action plan...`);
      await this.simulationActionProcessor.processSimulationForActions(
        simulationResult,
        confidenceThreshold
      );
      console.log(`[📝 SimulationTemplateEngine] Action plan generation complete with ${simulationResult.aggregateMetrics.recommendedActions.length} recommended actions`);
      
      // 3. Store simulation in template context
      if (templateId) {
        console.log(`[📝 SimulationTemplateEngine] Step 3: Updating existing template ${templateId} with simulation results...`);
        await this.updateTemplateWithSimulationResults(templateId, simulationResult);
        console.log(`[📝 SimulationTemplateEngine] Template updated successfully`);
      } else {
        console.log(`[📝 SimulationTemplateEngine] Step 3: Skipping template update as no templateId provided`);
      }
      
      // 4. Update memory with simulation learnings
      console.log(`[📝 SimulationTemplateEngine] Step 4: Storing simulation learnings in memory system...`);
      await this.storeSimulationLearning(simulationResult);
      console.log(`[📝 SimulationTemplateEngine] Simulation learnings stored in memory successfully`);
      
      console.log(`[📝 SimulationTemplateEngine] Simulation processing workflow COMPLETE. Ready for agent delegation.`);
      return simulationResult;
    } catch (error) {
      console.error(`[📝 SimulationTemplateEngine] ERROR processing simulation results:`, error);
      throw new Error('Failed to process simulation results');
    }
  }

  /**
   * Update existing template with simulation results
   */
  private async updateTemplateWithSimulationResults(
    templateId: string,
    simulationResult: SimulationResult
  ): Promise<void> {
    try {
      // 1. Get current template
      const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();
        
      if (error || !template) {
        console.error('Error fetching template:', error);
        return;
      }
      
      // 2. Update template metadata with simulation insights
      const updatedTemplate = {
        ...template,
        metadata: {
          ...template.metadata,
          last_simulation_id: simulationResult.id,
          last_simulation_date: simulationResult.createdAt.toISOString(),
          simulation_confidence: this.calculateSimulationConfidence(simulationResult),
          key_simulation_findings: this.extractKeyFindings(simulationResult)
        },
        updated_at: new Date().toISOString()
      };
      
      // 3. Save updated template
      await supabase
        .from('templates')
        .update(updatedTemplate)
        .eq('id', templateId);
        
      // 4. Update template state in working memory
      await this.memoryService.updateWorkingMemory({
        key: 'template_state',
        value: {
          templateId,
          simulationIntegrated: true,
          simulationId: simulationResult.id,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating template with simulation results:', error);
    }
  }

  /**
   * Generate functions from simulation results and incorporate them into a template
   */
  async incorporateSimulationResults(
    templateId: string,
    simulationResults: SimulationResult
  ): Promise<Template> {
    try {
      // 1. Get current template
      const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();
        
      if (error || !template) {
        console.error('Error fetching template:', error);
        throw new Error('Template not found');
      }
      
      // 2. Generate action plan with functions
      const actionPlan = await this.simulationActionProcessor.generateActionPlan(
        simulationResults,
        templateId
      );
      
      // 3. Save updated template with action functions
      const updatedTemplate = actionPlan.template;
      
      await supabase
        .from('templates')
        .update(updatedTemplate)
        .eq('id', templateId);
        
      // 4. Update working memory with current template state
      await this.memoryService.updateWorkingMemory({
        key: 'template_state',
        value: {
          templateId,
          functionCount: updatedTemplate.functions.length,
          simulationId: simulationResults.id,
          timestamp: new Date().toISOString()
        }
      });
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error incorporating simulation results:', error);
      throw new Error('Failed to incorporate simulation results');
    }
  }

  /**
   * Generate new action functions from simulation results
   */
  async generateActionsFromSimulation(
    simulationResults: SimulationResult,
    templateContext: any
  ): Promise<SimulationActionPlan> {
    try {
      // 1. Generate action plan
      let actionPlan: SimulationActionPlan;
      
      if (templateContext?.templateId) {
        // Use existing template if available
        actionPlan = await this.simulationActionProcessor.generateActionPlan(
          simulationResults,
          templateContext.templateId
        );
      } else {
        // Create new template if none provided
        actionPlan = await this.simulationActionProcessor.generateActionPlan(
          simulationResults
        );
        
        // Save the new template
        await supabase
          .from('templates')
          .insert(actionPlan.template);
      }
      
      // 2. Update working memory with action plan
      await this.memoryService.updateWorkingMemory({
        key: 'current_action_plan',
        value: {
          templateId: actionPlan.template.id,
          actionCount: actionPlan.actionFunctions.length,
          simulationId: simulationResults.id,
          timestamp: new Date().toISOString()
        }
      });
      
      return actionPlan;
    } catch (error) {
      console.error('Error generating actions from simulation:', error);
      throw new Error('Failed to generate actions from simulation');
    }
  }

  /**
   * Execute a simulation-generated function with an agent
   */
  async executeSimulationFunction(
    functionId: string,
    simulationId: string,
    parameters: any = {}
  ): Promise<any> {
    try {
      console.log(`[📝 SimulationTemplateEngine] EXECUTING function ${functionId} from simulation ${simulationId}...`);
      // 1. Get function details from the database
      console.log(`[📝 SimulationTemplateEngine] Step 1: Retrieving function details from database...`);
      const { data: functionData, error: functionError } = await supabase
        .from('simulation_functions')
        .select('*')
        .eq('id', functionId)
        .single();
        
      if (functionError || !functionData) {
        console.error(`[📝 SimulationTemplateEngine] ERROR fetching function data:`, functionError);
        throw new Error('Function not found');
      }
      
      // 2. Get the simulation result
      const { data: simulationData, error: simError } = await supabase
        .from('simulation_results')
        .select('*')
        .eq('id', simulationId)
        .single();
        
      if (simError || !simulationData) {
        console.error('Error fetching simulation:', simError);
        throw new Error('Simulation not found');
      }
      
      const simulationResult = simulationData as unknown as SimulationResult;
      
      // 3. Execute the function with the appropriate agent
      console.log(`[📝 SimulationTemplateEngine] Step 3: Identifying action to execute...`);
      const actionToExecute = simulationResult.aggregateMetrics.recommendedActions.find(
        (action: any) => action.actionId === functionId
      );
      
      if (!actionToExecute) {
        console.error(`[📝 SimulationTemplateEngine] ERROR: Action not found in simulation results`);
        throw new Error('Action not found in simulation results');
      }
      
      // Discover appropriate agent for this action
      console.log(`[📝 SimulationTemplateEngine] Step 4: DELEGATING TO AGENT DISCOVERY to find appropriate agent for action...`);
      const agent = await this.simulationAgentDiscoveryService.selectAgentForSimulationAction(
        actionToExecute,
        simulationResult
      );
      
      if (!agent) {
        console.error(`[📝 SimulationTemplateEngine] ERROR: No suitable agent found for action: ${actionToExecute.actionName}`);
        throw new Error('No suitable agent found for this action');
      }
      
      // 4. Execute action with the agent
      console.log(`[📝 SimulationTemplateEngine] Step 5: DELEGATING TO AGENT "${agent.name}" (${agent.agentType}) to execute action "${actionToExecute.actionName}"`);
      const executionResult = await agent.executeAction(actionToExecute, simulationId);
      
      // 5. Store execution results in memory
      console.log(`[📝 SimulationTemplateEngine] Step 6: Storing execution results in memory...`);
      await this.storeExecutionInMemory(executionResult, simulationResult);
      console.log(`[📝 SimulationTemplateEngine] Execution results stored in memory successfully`);
      
      // 6. Update execution status in database
      await supabase
        .from('simulation_actions')
        .update({
          status: 'COMPLETED',
          executed_at: new Date().toISOString(),
          executed_by_agent_id: agent.id,
          execution_result: executionResult
        })
        .eq('action_id', actionToExecute.actionId)
        .eq('simulation_id', simulationId);
        
      // 6. Return execution results
      console.log(`[📝 SimulationTemplateEngine] Function execution COMPLETE. Results ready for template state persistence.`);
      return executionResult;
    } catch (error) {
      console.error(`[📝 SimulationTemplateEngine] ERROR executing simulation function:`, error);
      throw error;
    }
  }

  private async storeSimulationLearning(simulationResult: SimulationResult): Promise<void> {
    try {
      // Extract key learnings from simulation
      const keyLearnings = this.extractKeyLearnings(simulationResult);
      
      // Store in long-term memory for future reference
      await this.memoryService.storeInLongTermMemory({
        type: 'simulation_learning',
        content: {
          simulationId: simulationResult.id,
          simulationType: simulationResult.simulationType,
          timestamp: new Date().toISOString(),
          keyLearnings,
          confidence: this.calculateSimulationConfidence(simulationResult)
        },
        metadata: {
          simulationId: simulationResult.id,
          simulationType: simulationResult.simulationType,
          learningCount: keyLearnings.length,
          confidence: this.calculateSimulationConfidence(simulationResult)
        }
      });
      
      // Update working memory with latest learnings
      await this.memoryService.updateWorkingMemory({
        key: 'simulation_learnings',
        value: {
          simulationId: simulationResult.id,
          timestamp: new Date().toISOString(),
          recentLearnings: keyLearnings.slice(0, 3)
        }
      });
    } catch (error) {
      console.error('Error storing simulation learning:', error);
    }
  }

  /**
   * Store function execution results in memory
   */
  private async storeExecutionInMemory(
    executionResult: any,
    simulationResult: SimulationResult
  ): Promise<void> {
    try {
      // Store in short-term memory for immediate context
      await this.memoryService.storeInShortTermMemory({
        type: 'simulation_action_execution',
        content: {
          ...executionResult,
          simulationId: simulationResult.id,
          simulationType: simulationResult.simulationType
        },
        metadata: {
          actionId: executionResult.actionId,
          actionName: executionResult.actionName,
          agentId: executionResult.agentId,
          success: executionResult.success,
          simulationId: simulationResult.id
        }
      });
      
      // Store in long-term memory for learning
      await this.memoryService.storeInLongTermMemory({
        type: 'simulation_action_outcome',
        content: {
          simulationId: simulationResult.id,
          simulationType: simulationResult.simulationType,
          actionId: executionResult.actionId,
          actionName: executionResult.actionName,
          success: executionResult.success,
          agentId: executionResult.agentId,
          timestamp: executionResult.executionTime,
          insights: executionResult.result.insights
        },
        metadata: {
          simulationId: simulationResult.id,
          actionId: executionResult.actionId,
          success: executionResult.success
        }
      });
      
      // Update working memory with execution result
      await this.memoryService.updateWorkingMemory({
        key: 'recent_execution',
        value: {
          actionName: executionResult.actionName,
          agentName: executionResult.agentName,
          success: executionResult.success,
          timestamp: executionResult.executionTime,
          insights: executionResult.result.insights
        }
      });
    } catch (error) {
      console.error('Error storing execution in memory:', error);
    }
  }

  /**
   * Calculate overall confidence in the simulation
   */
  private calculateSimulationConfidence(simulationResult: SimulationResult): number {
    if (!simulationResult.aggregateMetrics.recommendedActions ||
        simulationResult.aggregateMetrics.recommendedActions.length === 0) {
      return 0.5; // Default confidence if no actions
    }
    
    // Average confidence across all recommended actions
    const totalConfidence = simulationResult.aggregateMetrics.recommendedActions
      .reduce((sum, action) => sum + action.confidenceScore, 0);
      
    return totalConfidence / simulationResult.aggregateMetrics.recommendedActions.length;
  }

  /**
   * Extract key findings from the simulation
   */
  private extractKeyFindings(simulationResult: SimulationResult): string[] {
    const rawResult = simulationResult.rawResult;
    const findings: string[] = [];
    
    // Extract from key_insights if available
    if (rawResult.key_insights) {
      const insights = rawResult.key_insights;
      
      if (insights.marketing?.primary_finding) {
        findings.push(insights.marketing.primary_finding);
      }
      
      if (insights.inventory?.primary_finding) {
        findings.push(insights.inventory.primary_finding);
      }
      
      if (insights.strategic_recommendation?.action) {
        findings.push(insights.strategic_recommendation.action);
      }
      
      if (insights.strategic_recommendation?.expected_outcome) {
        findings.push(insights.strategic_recommendation.expected_outcome);
      }
    }
    
    // Add findings from recommended actions
    simulationResult.aggregateMetrics.recommendedActions.forEach(action => {
      findings.push(`${action.actionName}: ${action.expectedOutcome} (${Math.round(action.successProbability * 100)}% probability)`);
    });
    
    return findings;
  }

  /**
   * Extract key learnings from simulation for memory
   */
  private extractKeyLearnings(simulationResult: SimulationResult): any[] {
    const rawResult = simulationResult.rawResult;
    const learnings: any[] = [];
    
    // Marketing learnings
    if (rawResult.marketing_simulation) {
      const marketing = rawResult.marketing_simulation;
      
      // Extract ROI consistency pattern
      if (marketing.risk_metrics?.roi_consistency) {
        learnings.push({
          category: 'marketing',
          type: 'pattern',
          description: `Marketing campaigns show ${marketing.risk_metrics.roi_consistency * 100}% ROI consistency`,
          confidence: marketing.risk_metrics.roi_consistency,
          actionRelevance: ['increase_marketing_investment', 'optimize_campaign_budget']
        });
      }
      
      // Extract optimal marketing spend ratio
      if (marketing.risk_metrics?.optimal_marketing_spend_ratio) {
        learnings.push({
          category: 'marketing',
          type: 'optimization',
          description: `Optimal marketing spend ratio is ${marketing.risk_metrics.optimal_marketing_spend_ratio * 100}% of revenue`,
          confidence: marketing.risk_metrics.roi_consistency || 0.8,
          actionRelevance: ['budget_allocation', 'marketing_planning']
        });
      }
    }
    
    // Inventory learnings
    if (rawResult.inventory_simulation) {
      const inventory = rawResult.inventory_simulation;
      
      // Extract safety stock optimization
      if (inventory.risk_metrics?.optimal_safety_stock_days) {
        learnings.push({
          category: 'inventory',
          type: 'optimization',
          description: `Optimal safety stock is ${inventory.risk_metrics.optimal_safety_stock_days} days`,
          confidence: inventory.risk_metrics.capital_efficiency_score || 0.7,
          actionRelevance: ['reduce_safety_stock', 'inventory_optimization']
        });
      }
      
      // Extract stockout risk pattern
      if (inventory.risk_metrics?.current_stockout_risk) {
        const stockoutRisk = this.convertRiskToNumber(inventory.risk_metrics.current_stockout_risk);
        learnings.push({
          category: 'inventory',
          type: 'risk_assessment',
          description: `Current inventory levels have ${stockoutRisk * 100}% stockout risk`,
          confidence: 0.9,
          actionRelevance: ['inventory_planning', 'risk_management']
        });
      }
    }
    
    // Cross-functional learnings
    if (rawResult.combined_scenario_analysis) {
      const scenarios = rawResult.combined_scenario_analysis;
      
      Object.entries(scenarios).forEach(([key, value]: [string, any]) => {
        learnings.push({
          category: 'cross_functional',
          type: 'scenario_insight',
          scenario: key,
          description: `${value.description}: ${value.revenue_potential} revenue potential with ${value.risk_level} risk`,
          probability: value.probability,
          roi: value.roi_estimate,
          actionRelevance: ['strategic_planning', 'cross_functional_coordination']
        });
      });
    }
    
    return learnings;
  }

  /**
   * Convert risk level string to number
   */
  private convertRiskToNumber(risk: string): number {
    const riskMap: Record<string, number> = {
      'extremely_low': 0.01,
      'very_low': 0.05,
      'low': 0.1,
      'moderate': 0.3,
      'medium': 0.5,
      'high': 0.7,
      'very_high': 0.9
    };
    
    return riskMap[risk.toLowerCase()] || 0.5;
  }
}
