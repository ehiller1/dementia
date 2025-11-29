import { v4 as uuidv4 } from 'uuid';
import { 
  SimulationResult, 
  RecommendedAction, 
  SimulationDecision,
  SimulationActionPlan
} from './types';
import { MemoryService } from '../memory/memoryService';
import { AgentDiscoveryService } from '../agent/agentDiscoveryService';
import { Template, Function } from '../templates/types';
import { supabase } from '../supabase';

/**
 * Processes simulation results to extract, classify, and execute recommended actions
 */
export class SimulationActionProcessor {
  private memoryService: MemoryService;
  private agentDiscoveryService: AgentDiscoveryService;

  constructor(
    memoryService: MemoryService,
    agentDiscoveryService: AgentDiscoveryService
  ) {
    this.memoryService = memoryService;
    this.agentDiscoveryService = agentDiscoveryService;
  }

  /**
   * Extract actions from simulation results that meet confidence threshold
   */
  extractActionsFromSimulation(
    simulationResult: SimulationResult,
    confidenceThreshold: number = 0.7
  ): RecommendedAction[] {
    if (!simulationResult?.aggregateMetrics?.recommendedActions) {
      return [];
    }

    // Filter actions by confidence threshold and sort by probability
    return simulationResult.aggregateMetrics.recommendedActions
      .filter(action => action.successProbability >= confidenceThreshold)
      .sort((a, b) => b.successProbability - a.successProbability);
  }

  /**
   * Classify actions by automation level based on risk and confidence
   */
  classifyActionsByAutomationLevel(
    actions: RecommendedAction[]
  ): { automatedActions: RecommendedAction[], humanApprovalActions: RecommendedAction[] } {
    const automatedActions = actions.filter(
      a => a.riskLevel === 'low' && a.confidenceScore > 0.85
    );
    
    const humanApprovalActions = actions.filter(
      a => a.riskLevel !== 'low' || a.confidenceScore <= 0.85
    );
    
    return { automatedActions, humanApprovalActions };
  }

  /**
   * Generate a simulation action plan from simulation results
   * This creates or enhances templates with functions based on simulation recommendations
   */
  async generateActionPlan(
    simulationResult: SimulationResult,
    templateId?: string
  ): Promise<SimulationActionPlan> {
    // Get original template if available
    let template: Template | null = null;
    
    if (templateId) {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('id', templateId)
          .single();
          
        if (data && !error) {
          template = data as Template;
        }
      } catch (error) {
        console.error('Error fetching template:', error);
      }
    }
    
    // Create a new template if none exists
    if (!template) {
      template = {
        id: uuidv4(),
        name: `${simulationResult.name} Action Plan`,
        description: `Action plan generated from ${simulationResult.name}`,
        template_type: 'simulation_action',
        functions: [],
        metadata: {
          simulation_id: simulationResult.id,
          simulation_type: simulationResult.simulationType,
          confidence_score: this.calculateOverallConfidence(simulationResult),
          creation_date: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      // Update existing template metadata
      template.metadata = {
        ...template.metadata,
        simulation_id: simulationResult.id,
        last_simulation_date: new Date().toISOString()
      };
      template.updated_at = new Date().toISOString();
    }
    
    // Generate functions from recommended actions
    const actionFunctions: Function[] = this.createFunctionsFromActions(
      simulationResult.aggregateMetrics.recommendedActions
    );
    
    // Add or update functions in template
    this.updateTemplateFunctions(template, actionFunctions);
    
    // Create success probability mapping
    const successProbabilities = new Map<string, number>();
    simulationResult.aggregateMetrics.recommendedActions.forEach(action => {
      successProbabilities.set(action.actionId, action.successProbability);
    });
    
    // Create the action plan
    const actionPlan: SimulationActionPlan = {
      template,
      actionFunctions,
      originalSimulationId: simulationResult.id,
      successProbabilities
    };
    
    // Store action plan in memory
    await this.storeActionPlanInMemory(actionPlan, simulationResult);
    
    return actionPlan;
  }

  /**
   * Create template functions from recommended actions
   */
  private createFunctionsFromActions(actions: RecommendedAction[]): Function[] {
    return actions.map(action => {
      // Determine function type based on action characteristics
      const functionType = this.determineFunctionType(action);
      
      return {
        id: action.actionId,
        name: action.actionName,
        description: action.actionDescription,
        function_type: functionType,
        required_capabilities: this.determineRequiredCapabilities(action),
        parameters: this.createParametersFromAction(action),
        expected_output: {
          type: "object",
          description: action.expectedOutcome
        },
        implementation_steps: action.implementationSteps || [],
        metadata: {
          success_probability: action.successProbability,
          risk_level: action.riskLevel,
          confidence_score: action.confidenceScore,
          simulation_derived: true
        }
      };
    });
  }

  /**
   * Determine function type based on action characteristics
   */
  private determineFunctionType(action: RecommendedAction): string {
    // Mapping strategy: higher risk/complexity actions are procedural
    // Simple actions with clear outcomes are declarative
    // Analysis actions are informational
    
    const actionNameLower = action.actionName.toLowerCase();
    
    if (actionNameLower.includes('increase') || 
        actionNameLower.includes('reduce') || 
        actionNameLower.includes('optimize')) {
      return 'declarative_function';
    }
    
    if (actionNameLower.includes('strategic') || 
        actionNameLower.includes('implement') || 
        action.implementationSteps?.length > 0) {
      return 'procedural_function';
    }
    
    if (actionNameLower.includes('analyze') || 
        actionNameLower.includes('review') || 
        actionNameLower.includes('assess')) {
      return 'informational_function';
    }
    
    // Default to declarative if no clear indicators
    return 'declarative_function';
  }

  /**
   * Determine required capabilities based on action
   */
  private determineRequiredCapabilities(action: RecommendedAction): string[] {
    const capabilities: string[] = [];
    const actionNameLower = action.actionName.toLowerCase();
    
    // Base capabilities on action domain
    if (actionNameLower.includes('marketing') || 
        actionNameLower.includes('campaign') ||
        actionNameLower.includes('promotion')) {
      capabilities.push('marketing_strategy', 'campaign_management');
    }
    
    if (actionNameLower.includes('inventory') || 
        actionNameLower.includes('stock') ||
        actionNameLower.includes('supply chain')) {
      capabilities.push('inventory_management', 'supply_chain_optimization');
    }
    
    if (actionNameLower.includes('strategic') || 
        actionNameLower.includes('optimize')) {
      capabilities.push('strategic_planning', 'cross_functional_coordination');
    }
    
    // Add risk-related capability
    if (action.riskLevel === 'high') {
      capabilities.push('high_risk_action_execution');
    }
    
    // Add simulation capability
    capabilities.push('simulation_result_interpretation');
    
    return capabilities;
  }

  /**
   * Create function parameters from action
   */
  private createParametersFromAction(action: RecommendedAction): any {
    const parameters: any = {
      type: "object",
      properties: {
        action_id: {
          type: "string",
          description: "The ID of the action to execute",
          default: action.actionId
        },
        confidence_threshold: {
          type: "number",
          description: "Minimum confidence required to proceed with action",
          default: 0.7
        }
      },
      required: ["action_id"]
    };
    
    // Add action-specific parameters based on action characteristics
    const actionNameLower = action.actionName.toLowerCase();
    
    if (actionNameLower.includes('increase') || actionNameLower.includes('budget')) {
      parameters.properties.increase_percentage = {
        type: "number",
        description: "Percentage increase to apply",
        default: this.extractPercentageFromAction(action)
      };
      parameters.required.push("increase_percentage");
    }
    
    if (actionNameLower.includes('reduce') || actionNameLower.includes('decrease')) {
      parameters.properties.reduction_percentage = {
        type: "number",
        description: "Percentage reduction to apply",
        default: this.extractPercentageFromAction(action)
      };
      parameters.required.push("reduction_percentage");
    }
    
    return parameters;
  }

  /**
   * Extract percentage value from action description or name
   */
  private extractPercentageFromAction(action: RecommendedAction): number {
    // Try to find percentage in action description or name
    const percentageRegex = /(\d+)%/;
    
    const actionText = `${action.actionName} ${action.actionDescription} ${action.expectedOutcome}`;
    const match = actionText.match(percentageRegex);
    
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    return 0;
  }

  /**
   * Update template functions with new action functions
   */
  private updateTemplateFunctions(template: Template, actionFunctions: Function[]): void {
    if (!template.functions) {
      template.functions = [];
    }
    
    // For each action function, either add it or update existing
    actionFunctions.forEach(actionFunc => {
      const existingFuncIndex = template.functions.findIndex(
        f => f.id === actionFunc.id
      );
      
      if (existingFuncIndex >= 0) {
        // Update existing function
        template.functions[existingFuncIndex] = {
          ...template.functions[existingFuncIndex],
          ...actionFunc,
          // Preserve any existing metadata and enhance with simulation data
          metadata: {
            ...template.functions[existingFuncIndex].metadata,
            ...actionFunc.metadata
          }
        };
      } else {
        // Add new function
        template.functions.push(actionFunc);
      }
    });
  }

  /**
   * Store action plan in memory system
   */
  private async storeActionPlanInMemory(
    actionPlan: SimulationActionPlan, 
    simulationResult: SimulationResult
  ): Promise<void> {
    // Extract action plan summary for memory
    const actionSummary = actionPlan.actionFunctions.map(func => {
      const probability = actionPlan.successProbabilities.get(func.id) || 0;
      return {
        id: func.id,
        name: func.name,
        type: func.function_type,
        probability,
        description: func.description
      };
    });
    
    // Store in short-term memory
    await this.memoryService.storeInShortTermMemory({
      type: 'simulation_action_plan',
      content: {
        simulationId: simulationResult.id,
        simulationName: simulationResult.name,
        templateId: actionPlan.template.id,
        actions: actionSummary,
        createdAt: new Date().toISOString()
      },
      metadata: {
        simulationId: simulationResult.id,
        templateId: actionPlan.template.id,
        actionCount: actionSummary.length,
        simulationType: simulationResult.simulationType
      }
    });
    
    // Update working memory with current action plan
    await this.memoryService.updateWorkingMemory({
      key: 'current_action_plan',
      value: {
        simulationId: simulationResult.id,
        templateId: actionPlan.template.id,
        actionCount: actionSummary.length,
        topActions: actionSummary
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 3)
      }
    });
  }

  /**
   * Create simulation decisions in the decision inbox
   */
  async createSimulationDecisions(
    simulationResult: SimulationResult,
    actions: RecommendedAction[]
  ): Promise<SimulationDecision[]> {
    const decisions: SimulationDecision[] = [];
    
    for (const action of actions) {
      const decisionId = uuidv4();
      
      const decision: SimulationDecision = {
        id: decisionId,
        actionId: action.actionId,
        actionName: action.actionName,
        simulationContext: simulationResult,
        successProbability: action.successProbability,
        expectedOutcome: action.expectedOutcome,
        decisionType: 'SIMULATION_ACTION_APPROVAL',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store in database
      try {
        await supabase
          .from('simulation_actions')
          .insert({
            id: decisionId,
            simulation_id: simulationResult.id,
            action_id: action.actionId,
            action_name: action.actionName,
            action_description: action.actionDescription,
            expected_outcome: action.expectedOutcome,
            success_probability: action.successProbability,
            risk_level: action.riskLevel,
            confidence_score: action.confidenceScore,
            status: 'PENDING'
          });
          
        decisions.push(decision);
      } catch (error) {
        console.error('Error creating simulation decision:', error);
      }
    }
    
    return decisions;
  }

  /**
   * Process a simulation for action execution
   */
  async processSimulationForActions(
    simulationResult: SimulationResult,
    confidenceThreshold: number = 0.7
  ): Promise<void> {
    // 1. Extract actions from simulation
    const recommendedActions = this.extractActionsFromSimulation(
      simulationResult,
      confidenceThreshold
    );
    
    if (recommendedActions.length === 0) {
      console.log('No recommended actions meet the confidence threshold');
      return;
    }
    
    // 2. Generate action plan with template functions
    const actionPlan = await this.generateActionPlan(
      simulationResult,
      simulationResult.templateId
    );
    
    // 3. Classify actions by automation level
    const { automatedActions, humanApprovalActions } = 
      this.classifyActionsByAutomationLevel(recommendedActions);
    
    // 4. Process actions requiring human approval
    if (humanApprovalActions.length > 0) {
      await this.createSimulationDecisions(simulationResult, humanApprovalActions);
      
      // Log to working memory that human decisions are pending
      await this.memoryService.updateWorkingMemory({
        key: 'pending_simulation_decisions',
        value: {
          count: humanApprovalActions.length,
          simulationId: simulationResult.id,
          actionIds: humanApprovalActions.map(a => a.actionId)
        }
      });
    }
    
    // 5. Process automated actions
    for (const action of automatedActions) {
      try {
        // Find corresponding function in the action plan
        const actionFunction = actionPlan.actionFunctions
          .find(func => func.id === action.actionId);
        
        if (actionFunction) {
          // Discover appropriate agent for this action
          const agent = await this.agentDiscoveryService
            .selectAgentForFunction(actionFunction);
          
          if (agent) {
            // Create a record for the automated action
            const actionId = uuidv4();
            
            await supabase
              .from('simulation_actions')
              .insert({
                id: actionId,
                simulation_id: simulationResult.id,
                action_id: action.actionId,
                action_name: action.actionName,
                action_description: action.actionDescription,
                expected_outcome: action.expectedOutcome,
                success_probability: action.successProbability,
                risk_level: action.riskLevel,
                confidence_score: action.confidenceScore,
                status: 'COMPLETED',
                executed_at: new Date().toISOString(),
                executed_by_agent_id: agent.id
              });
              
            // Record execution in memory
            await this.storeActionExecutionInMemory(
              simulationResult,
              action,
              agent.id,
              'automated'
            );
          }
        }
      } catch (error) {
        console.error(`Error executing automated action ${action.actionName}:`, error);
      }
    }
  }

  /**
   * Execute a human-approved action
   */
  async executeApprovedAction(
    decisionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // 1. Get the decision details
      const { data: actionData, error: actionError } = await supabase
        .from('simulation_actions')
        .select('*, simulation_results(*)')
        .eq('id', decisionId)
        .single();
        
      if (actionError || !actionData) {
        console.error('Error fetching decision:', actionError);
        return false;
      }
      
      // 2. Update the decision status
      await supabase
        .from('simulation_actions')
        .update({
          status: 'APPROVED',
          approved_at: new Date().toISOString(),
          approved_by: userId
        })
        .eq('id', decisionId);
        
      // 3. Generate action plan to get the function
      const simulationResult = actionData.simulation_results;
      const actionPlan = await this.generateActionPlan(
        simulationResult,
        simulationResult.template_id
      );
      
      // 4. Find the function for this action
      const actionFunction = actionPlan.actionFunctions
        .find(func => func.id === actionData.action_id);
        
      if (!actionFunction) {
        console.error('Action function not found');
        return false;
      }
      
      // 5. Discover agent for execution
      const agent = await this.agentDiscoveryService
        .selectAgentForFunction(actionFunction);
        
      if (!agent) {
        console.error('No suitable agent found for action execution');
        return false;
      }
      
      // 6. Execute the function with the agent
      // This would call agent.executeFunction in a real implementation
      console.log(`Agent ${agent.id} executing function ${actionFunction.name}`);
      
      // 7. Update the action status to completed
      await supabase
        .from('simulation_actions')
        .update({
          status: 'COMPLETED',
          executed_at: new Date().toISOString(),
          executed_by_agent_id: agent.id,
          execution_result: { success: true, timestamp: new Date().toISOString() }
        })
        .eq('id', decisionId);
        
      // 8. Store execution in memory
      await this.storeActionExecutionInMemory(
        simulationResult,
        {
          actionId: actionData.action_id,
          actionName: actionData.action_name,
          actionDescription: actionData.action_description,
          expectedOutcome: actionData.expected_outcome,
          successProbability: actionData.success_probability,
          riskLevel: actionData.risk_level,
          confidenceScore: actionData.confidence_score
        },
        agent.id,
        'human_approved',
        userId
      );
      
      return true;
    } catch (error) {
      console.error('Error executing approved action:', error);
      return false;
    }
  }

  /**
   * Store action execution details in memory
   */
  private async storeActionExecutionInMemory(
    simulationResult: any,
    action: RecommendedAction,
    agentId: string,
    executionType: 'automated' | 'human_approved',
    userId?: string
  ): Promise<void> {
    // Add to long-term memory for learning
    await this.memoryService.storeInLongTermMemory({
      type: 'simulation_action_execution',
      content: {
        simulationId: simulationResult.id,
        simulationName: simulationResult.name,
        simulationType: simulationResult.simulationType,
        actionId: action.actionId,
        actionName: action.actionName,
        executionType,
        agentId,
        successProbability: action.successProbability,
        executedAt: new Date().toISOString(),
        approvedBy: userId,
        expectedOutcome: action.expectedOutcome
      },
      metadata: {
        simulationId: simulationResult.id,
        actionId: action.actionId,
        executionType,
        successProbability: action.successProbability,
        riskLevel: action.riskLevel
      }
    });
    
    // Update working memory with execution
    await this.memoryService.updateWorkingMemory({
      key: 'recent_action_executions',
      value: {
        simulationId: simulationResult.id,
        actionName: action.actionName,
        executionType,
        agentId,
        executedAt: new Date().toISOString(),
        expectedOutcome: action.expectedOutcome
      }
    });
  }

  /**
   * Calculate overall confidence score for a simulation
   */
  private calculateOverallConfidence(simulationResult: SimulationResult): number {
    if (simulationResult.aggregateMetrics.recommendedActions.length === 0) {
      return 0.5;
    }
    
    const confidenceSum = simulationResult.aggregateMetrics.recommendedActions
      .reduce((sum, action) => sum + action.confidenceScore, 0);
      
    return confidenceSum / simulationResult.aggregateMetrics.recommendedActions.length;
  }
}
