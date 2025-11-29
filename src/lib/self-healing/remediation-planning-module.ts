/**
 * Remediation Planning Module
 * 
 * Plans and proposes next actions based on error type and context.
 * Strategies:
 * - Re-prompt with more specificity
 * - Rerun previous agent with modified parameters
 * - Substitute defaults or past successful values
 * - Add intermediate diagnostic steps
 */

import { supabase } from '../../integrations/supabase/client.ts';
import OpenAI from 'openai';
import { 
  ErrorType, 
  ErrorCategory, 
  SourceType, 
  DetectedError 
} from './error-detection-engine.ts';
import { ErrorClassification } from './error-classification-layer.ts';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Remediation plan
export interface RemediationPlan {
  planId: string;
  errorId: string;
  strategy: string;
  steps: RemediationStep[];
  requiresUserInput: boolean;
  userPrompt?: string;
  parameters?: Record<string, any>;
  confidence: number;
  estimatedSuccessRate: number;
  fallbackPlan?: RemediationPlan;
}

// Remediation step
export interface RemediationStep {
  stepId: string;
  action: string;
  parameters?: Record<string, any>;
  description: string;
  isOptional: boolean;
  order: number;
}

/**
 * Remediation Planning Module
 */
export class RemediationPlanningModule {
  /**
   * Create a remediation plan
   */
  public async createPlan(
    errorClassification: ErrorClassification,
    error: DetectedError,
    context?: any
  ): Promise<RemediationPlan> {
    try {
      // First, check if we have a pattern-based plan
      if (errorClassification.patternId) {
        const patternPlan = await this.createPatternBasedPlan(
          errorClassification,
          error,
          context
        );
        
        if (patternPlan) {
          return patternPlan;
        }
      }
      
      // If no pattern-based plan, use rule-based planning
      const ruleBasedPlan = this.createRuleBasedPlan(
        errorClassification,
        error,
        context
      );
      
      // For complex errors or if confidence is low, use LLM-based planning
      if (
        ruleBasedPlan.confidence < 0.8 ||
        error.errorType === ErrorType.SEMANTIC_MISMATCH ||
        error.errorType === ErrorType.CONTRADICTORY_VALUES ||
        error.errorMessage.length > 100
      ) {
        return await this.createLLMBasedPlan(
          errorClassification,
          error,
          context,
          ruleBasedPlan
        );
      }
      
      return ruleBasedPlan;
    } catch (err) {
      console.error('Error creating remediation plan:', err);
      
      // Return a simple retry plan as fallback
      return this.createFallbackPlan(errorClassification.errorId);
    }
  }
  
  /**
   * Create a pattern-based remediation plan
   */
  private async createPatternBasedPlan(
    errorClassification: ErrorClassification,
    error: DetectedError,
    context?: any
  ): Promise<RemediationPlan | null> {
    try {
      if (!errorClassification.patternId) {
        return null;
      }
      
      // Get pattern details
      const { data, error: dbError } = await supabase
        .from('error_patterns')
        .select('default_recovery_plan, success_rate')
        .eq('id', errorClassification.patternId)
        .single();
      
      if (dbError || !data || !data.default_recovery_plan) {
        return null;
      }
      
      // Convert stored plan to RemediationPlan
      const planData = data.default_recovery_plan;
      
      return {
        planId: uuidv4(),
        errorId: errorClassification.errorId,
        strategy: planData.strategy || errorClassification.recommendedStrategy,
        steps: planData.steps || [],
        requiresUserInput: planData.requiresUserInput || errorClassification.requiresUserInput,
        userPrompt: planData.userPrompt || errorClassification.suggestedPrompt,
        parameters: planData.parameters || {},
        confidence: data.success_rate || 0.7,
        estimatedSuccessRate: data.success_rate || 0.7
      };
    } catch (err) {
      console.error('Error creating pattern-based plan:', err);
      return null;
    }
  }
  
  /**
   * Create a rule-based remediation plan
   */
  private createRuleBasedPlan(
    errorClassification: ErrorClassification,
    error: DetectedError,
    context?: any
  ): RemediationPlan {
    const planId = uuidv4();
    const strategy = errorClassification.recommendedStrategy;
    const steps: RemediationStep[] = [];
    
    // Create steps based on strategy
    switch (strategy) {
      case 'retry':
        steps.push({
          stepId: uuidv4(),
          action: 'retry_execution',
          parameters: {},
          description: 'Retry the failed execution with the same parameters',
          isOptional: false,
          order: 1
        });
        break;
        
      case 'backoff_retry':
        steps.push({
          stepId: uuidv4(),
          action: 'wait',
          parameters: { durationMs: 1000 },
          description: 'Wait for 1 second before retrying',
          isOptional: false,
          order: 1
        });
        steps.push({
          stepId: uuidv4(),
          action: 'retry_execution',
          parameters: {},
          description: 'Retry the failed execution with the same parameters',
          isOptional: false,
          order: 2
        });
        break;
        
      case 'user_input':
        steps.push({
          stepId: uuidv4(),
          action: 'request_user_input',
          parameters: { 
            prompt: errorClassification.suggestedPrompt || 'Please provide additional information'
          },
          description: 'Request input from the user',
          isOptional: false,
          order: 1
        });
        steps.push({
          stepId: uuidv4(),
          action: 'retry_with_user_input',
          parameters: {},
          description: 'Retry execution with user-provided input',
          isOptional: false,
          order: 2
        });
        break;
        
      case 'default_value':
        steps.push({
          stepId: uuidv4(),
          action: 'substitute_default',
          parameters: { 
            field: error.errorDetails?.missingFields?.[0] || 'unknown',
            value: this.determineDefaultValue(error)
          },
          description: 'Substitute with default value',
          isOptional: false,
          order: 1
        });
        steps.push({
          stepId: uuidv4(),
          action: 'retry_execution',
          parameters: {},
          description: 'Retry execution with default value',
          isOptional: false,
          order: 2
        });
        break;
        
      case 'transform':
        steps.push({
          stepId: uuidv4(),
          action: 'transform_data',
          parameters: { 
            field: error.errorDetails?.fieldName || 'unknown',
            transformation: this.determineTransformation(error)
          },
          description: 'Transform data to correct format',
          isOptional: false,
          order: 1
        });
        steps.push({
          stepId: uuidv4(),
          action: 'retry_execution',
          parameters: {},
          description: 'Retry execution with transformed data',
          isOptional: false,
          order: 2
        });
        break;
        
      case 'increase_timeout':
        steps.push({
          stepId: uuidv4(),
          action: 'modify_parameters',
          parameters: { 
            timeoutMs: 30000 // 30 seconds
          },
          description: 'Increase execution timeout',
          isOptional: false,
          order: 1
        });
        steps.push({
          stepId: uuidv4(),
          action: 'retry_execution',
          parameters: {},
          description: 'Retry execution with increased timeout',
          isOptional: false,
          order: 2
        });
        break;
        
      case 'alternative_agent':
        steps.push({
          stepId: uuidv4(),
          action: 'find_alternative',
          parameters: { 
            type: 'agent'
          },
          description: 'Find alternative agent',
          isOptional: false,
          order: 1
        });
        steps.push({
          stepId: uuidv4(),
          action: 'execute_alternative',
          parameters: {},
          description: 'Execute alternative agent',
          isOptional: false,
          order: 2
        });
        break;
        
      case 'resolve_contradiction':
        steps.push({
          stepId: uuidv4(),
          action: 'analyze_contradiction',
          parameters: { 
            fields: error.errorDetails?.fields || []
          },
          description: 'Analyze contradictory values',
          isOptional: false,
          order: 1
        });
        steps.push({
          stepId: uuidv4(),
          action: 'resolve_values',
          parameters: {},
          description: 'Resolve contradictory values',
          isOptional: false,
          order: 2
        });
        steps.push({
          stepId: uuidv4(),
          action: 'retry_execution',
          parameters: {},
          description: 'Retry execution with resolved values',
          isOptional: false,
          order: 3
        });
        break;
        
      default:
        // Default to retry
        steps.push({
          stepId: uuidv4(),
          action: 'retry_execution',
          parameters: {},
          description: 'Retry the failed execution',
          isOptional: false,
          order: 1
        });
        break;
    }
    
    // Create the plan
    return {
      planId,
      errorId: errorClassification.errorId,
      strategy,
      steps,
      requiresUserInput: errorClassification.requiresUserInput,
      userPrompt: errorClassification.suggestedPrompt,
      confidence: errorClassification.confidenceScore,
      estimatedSuccessRate: 0.7
    };
  }
  
  /**
   * Create an LLM-based remediation plan
   */
  private async createLLMBasedPlan(
    errorClassification: ErrorClassification,
    error: DetectedError,
    context: any,
    ruleBasedPlan: RemediationPlan
  ): Promise<RemediationPlan> {
    try {
      // Construct the prompt for the LLM
      const prompt = this.constructPlanningPrompt(
        errorClassification,
        error,
        context,
        ruleBasedPlan
      );
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });
      
      // Parse the LLM response
      const planText = response.choices[0].message.content?.trim() || '';
      const llmPlan = this.parseLLMResponse(planText);
      
      // If parsing failed, return the rule-based plan
      if (!llmPlan) {
        return ruleBasedPlan;
      }
      
      // Merge with rule-based plan
      return {
        ...ruleBasedPlan,
        ...llmPlan,
        planId: ruleBasedPlan.planId,
        errorId: errorClassification.errorId,
        fallbackPlan: ruleBasedPlan
      };
    } catch (err) {
      console.error('Error creating LLM-based plan:', err);
      return ruleBasedPlan;
    }
  }
  
  /**
   * Create a fallback remediation plan
   */
  private createFallbackPlan(errorId: string): RemediationPlan {
    return {
      planId: uuidv4(),
      errorId,
      strategy: 'retry',
      steps: [
        {
          stepId: uuidv4(),
          action: 'retry_execution',
          parameters: {},
          description: 'Retry the failed execution',
          isOptional: false,
          order: 1
        }
      ],
      requiresUserInput: false,
      confidence: 0.5,
      estimatedSuccessRate: 0.5
    };
  }
  
  /**
   * Determine a default value for a missing field
   */
  private determineDefaultValue(error: DetectedError): any {
    const field = error.errorDetails?.missingFields?.[0] || 'unknown';
    
    // Simple heuristics for common fields
    if (field.toLowerCase().includes('date')) {
      return new Date().toISOString();
    } else if (field.toLowerCase().includes('count') || field.toLowerCase().includes('amount')) {
      return 0;
    } else if (field.toLowerCase().includes('name')) {
      return 'Unknown';
    } else if (field.toLowerCase().includes('id')) {
      return uuidv4();
    } else if (field.toLowerCase().includes('enabled') || field.toLowerCase().includes('active')) {
      return true;
    } else if (field.toLowerCase().includes('list') || field.toLowerCase().includes('array')) {
      return [];
    } else if (field.toLowerCase().includes('object')) {
      return {};
    }
    
    return null;
  }
  
  /**
   * Determine a transformation for a field
   */
  private determineTransformation(error: DetectedError): string {
    const expectedType = error.errorDetails?.expectedType;
    const actualType = error.errorDetails?.actualType;
    
    if (!expectedType || !actualType) {
      return 'toString';
    }
    
    if (expectedType === 'number') {
      return 'toNumber';
    } else if (expectedType === 'string') {
      return 'toString';
    } else if (expectedType === 'boolean') {
      return 'toBoolean';
    } else if (expectedType === 'array') {
      return 'toArray';
    } else if (expectedType === 'object') {
      return 'toObject';
    } else if (expectedType === 'date') {
      return 'toDate';
    }
    
    return 'toString';
  }
  
  /**
   * Construct a prompt for LLM-based planning
   */
  private constructPlanningPrompt(
    errorClassification: ErrorClassification,
    error: DetectedError,
    context: any,
    ruleBasedPlan: RemediationPlan
  ): string {
    return `
You are an AI remediation planning system. Given the following error details and initial plan, create a detailed remediation plan.

Error Type: ${error.errorType}
Error Message: ${error.errorMessage}
Error Category: ${errorClassification.errorCategory}
Source Type: ${error.sourceType}
${error.componentId ? `Component ID: ${error.componentId}` : ''}
${error.errorDetails ? `Error Details: ${JSON.stringify(error.errorDetails)}` : ''}
${context ? `Context: ${JSON.stringify(context)}` : ''}

Initial Remediation Plan:
- Strategy: ${ruleBasedPlan.strategy}
- Steps: ${JSON.stringify(ruleBasedPlan.steps)}
- Requires User Input: ${ruleBasedPlan.requiresUserInput}
${ruleBasedPlan.userPrompt ? `- User Prompt: ${ruleBasedPlan.userPrompt}` : ''}

Please create a more detailed remediation plan with:
1. The most appropriate remediation strategy
2. A sequence of steps to execute the strategy
3. Whether user input is required
4. A suggested prompt for the user if input is required
5. Any parameters needed for the steps
6. Your confidence in this plan (0.0 to 1.0)
7. Estimated success rate (0.0 to 1.0)

Format your response as JSON:
{
  "strategy": "strategy_name",
  "steps": [
    {
      "stepId": "unique_id",
      "action": "action_name",
      "parameters": { key: value },
      "description": "description",
      "isOptional": false,
      "order": 1
    }
  ],
  "requiresUserInput": true/false,
  "userPrompt": "prompt",
  "parameters": { key: value },
  "confidence": 0.9,
  "estimatedSuccessRate": 0.8
}
`;
  }
  
  /**
   * Parse LLM response
   */
  private parseLLMResponse(response: string): Partial<RemediationPlan> | null {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        
        // Ensure steps have valid UUIDs
        if (parsedResponse.steps) {
          parsedResponse.steps = parsedResponse.steps.map((step: any) => ({
            ...step,
            stepId: step.stepId || uuidv4()
          }));
        }
        
        return {
          strategy: parsedResponse.strategy,
          steps: parsedResponse.steps || [],
          requiresUserInput: parsedResponse.requiresUserInput,
          userPrompt: parsedResponse.userPrompt,
          parameters: parsedResponse.parameters,
          confidence: parsedResponse.confidence,
          estimatedSuccessRate: parsedResponse.estimatedSuccessRate
        };
      }
    } catch (err) {
      console.error('Error parsing LLM response:', err);
    }
    
    return null;
  }
  
  /**
   * Save remediation plan to database
   */
  public async savePlan(
    plan: RemediationPlan,
    errorId: string
  ): Promise<string> {
    try {
      // Create recovery attempt
      const { data, error } = await supabase.rpc('create_recovery_attempt', {
        p_error_id: errorId,
        p_recovery_strategy: plan.strategy,
        p_recovery_plan: plan,
        p_recovery_prompt: plan.userPrompt || '',
        p_recovery_parameters: plan.parameters || {},
        p_is_autonomous: !plan.requiresUserInput,
        p_created_by: null // Set to appropriate user ID if available
      });
      
      if (error) {
        console.error('Error saving remediation plan:', error);
        return plan.planId;
      }
      
      return data;
    } catch (err) {
      console.error('Exception saving remediation plan:', err);
      return plan.planId;
    }
  }
  
  /**
   * Add a journal entry for planning
   */
  public async addPlanningJournal(
    workflowId: string | null,
    templateId: string | null,
    errorId: string,
    recoveryAttemptId: string,
    plan: RemediationPlan
  ): Promise<void> {
    try {
      await supabase.rpc('add_recovery_journal', {
        p_workflow_id: workflowId,
        p_template_id: templateId,
        p_error_id: errorId,
        p_recovery_attempt_id: recoveryAttemptId,
        p_journal_entry: `Created remediation plan with strategy: ${plan.strategy}. ` +
                        `${plan.steps.length} steps. ` +
                        `${plan.requiresUserInput ? 'Requires user input.' : 'Autonomous recovery.'}`,
        p_entry_type: 'planning',
        p_entry_data: plan
      });
    } catch (err) {
      console.error('Error adding planning journal entry:', err);
    }
  }
}

// Export singleton instance
export const remediationPlanningModule = new RemediationPlanningModule();
