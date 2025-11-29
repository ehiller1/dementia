/**
 * Error Classification Layer
 * 
 * Categorizes failures to determine the resolution path.
 * Categories:
 * - Recoverable Errors: Can be fixed through retry, re-prompt, or value substitution.
 * - Input Gaps: Missing required inputs that can be requested from the user or inferred.
 * - Unresolvable Errors: Logic bugs, external system downtime, etc.
 */

import { supabase } from '../../integrations/supabase/client.ts';
import OpenAI from 'openai';
import { 
  ErrorType, 
  ErrorCategory, 
  SourceType, 
  ErrorSeverity,
  DetectedError
} from './error-detection-engine.ts';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Error classification result
export interface ErrorClassification {
  errorId: string;
  errorType: ErrorType;
  errorCategory: ErrorCategory;
  sourceType: SourceType;
  errorMessage: string;
  isRecoverable: boolean;
  recoveryStrategies: string[];
  recommendedStrategy: string;
  confidenceScore: number;
  requiresUserInput: boolean;
  suggestedPrompt?: string;
  patternId?: string;
}

/**
 * Error Classification Layer
 */
export class ErrorClassificationLayer {
  /**
   * Classify an error
   */
  public async classifyError(
    error: DetectedError,
    errorId?: string
  ): Promise<ErrorClassification> {
    try {
      // Log error if not already logged
      if (!errorId) {
        errorId = await this.logError(error);
      }
      
      // First, check for known error patterns
      const matchingPatterns = await this.findMatchingPatterns(
        error.errorType,
        error.errorCategory,
        error.errorMessage,
        error.sourceType,
        error.componentId
      );
      
      // If we have a matching pattern with high success rate, use it
      if (matchingPatterns.length > 0 && matchingPatterns[0].success_rate > 0.7) {
        return this.classifyFromPattern(errorId, error, matchingPatterns[0]);
      }
      
      // Otherwise, use rule-based classification first
      const ruleBasedClassification = this.classifyWithRules(errorId, error);
      
      // For complex errors or if confidence is low, use LLM-based classification
      if (
        ruleBasedClassification.confidenceScore < 0.8 ||
        error.errorType === ErrorType.SEMANTIC_MISMATCH ||
        error.errorType === ErrorType.CONTRADICTORY_VALUES ||
        error.errorMessage.length > 100
      ) {
        return await this.classifyWithLLM(errorId, error, ruleBasedClassification);
      }
      
      return ruleBasedClassification;
    } catch (err) {
      console.error('Error classifying error:', err);
      
      // Return a default classification
      return {
        errorId: errorId || uuidv4(),
        errorType: error.errorType,
        errorCategory: error.errorCategory,
        sourceType: error.sourceType,
        errorMessage: error.errorMessage,
        isRecoverable: error.isRecoverable,
        recoveryStrategies: ['retry'],
        recommendedStrategy: 'retry',
        confidenceScore: 0.5,
        requiresUserInput: true
      };
    }
  }
  
  /**
   * Log an error to the database
   */
  private async logError(error: DetectedError): Promise<string> {
    try {
      const { data, error: dbError } = await supabase.rpc('log_error', {
        p_error_type: error.errorType,
        p_error_category: error.errorCategory,
        p_source_type: error.sourceType,
        p_source_id: error.sourceId,
        p_step_id: error.stepId,
        p_component_id: error.componentId,
        p_error_message: error.errorMessage,
        p_error_details: error.errorDetails || {},
        p_stack_trace: error.stackTrace || '',
        p_context: error.context || {},
        p_input_data: error.inputData || {},
        p_confidence: error.confidence || null,
        p_severity: error.severity,
        p_is_recoverable: error.isRecoverable,
        p_created_by: null // Set to appropriate user ID if available
      });
      
      if (dbError) {
        console.error('Error logging error to database:', dbError);
        return uuidv4(); // Return a temporary ID
      }
      
      return data;
    } catch (err) {
      console.error('Exception logging error to database:', err);
      return uuidv4(); // Return a temporary ID
    }
  }
  
  /**
   * Find matching error patterns in the database
   */
  private async findMatchingPatterns(
    errorType: ErrorType,
    errorCategory: ErrorCategory,
    errorMessage: string,
    sourceType: SourceType,
    componentId?: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('find_matching_error_patterns', {
        p_error_type: errorType,
        p_error_category: errorCategory,
        p_error_message: errorMessage,
        p_source_type: sourceType,
        p_component_type: componentId
      });
      
      if (error) {
        console.error('Error finding matching error patterns:', error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception finding matching error patterns:', err);
      return [];
    }
  }
  
  /**
   * Classify error from a known pattern
   */
  private classifyFromPattern(
    errorId: string,
    error: DetectedError,
    pattern: any
  ): ErrorClassification {
    // Extract recovery strategies from pattern
    const recoveryStrategies = pattern.recovery_strategies || ['retry'];
    
    // Determine if user input is required
    const requiresUserInput = recoveryStrategies.includes('user_input') || 
                             recoveryStrategies.includes('prompt');
    
    return {
      errorId,
      errorType: error.errorType,
      errorCategory: error.errorCategory,
      sourceType: error.sourceType,
      errorMessage: error.errorMessage,
      isRecoverable: error.isRecoverable,
      recoveryStrategies,
      recommendedStrategy: recoveryStrategies[0],
      confidenceScore: pattern.success_rate,
      requiresUserInput,
      patternId: pattern.id
    };
  }
  
  /**
   * Classify error using rule-based approach
   */
  private classifyWithRules(
    errorId: string,
    error: DetectedError
  ): ErrorClassification {
    // Default values
    let recoveryStrategies: string[] = ['retry'];
    let recommendedStrategy = 'retry';
    let confidenceScore = 0.7;
    let requiresUserInput = false;
    let suggestedPrompt: string | undefined;
    
    // Classification based on error type
    switch (error.errorType) {
      case ErrorType.MISSING_INPUT:
        recoveryStrategies = ['user_input', 'default_value', 'infer'];
        recommendedStrategy = 'user_input';
        confidenceScore = 0.9;
        requiresUserInput = true;
        suggestedPrompt = `Please provide the missing ${error.errorDetails?.missingFields?.join(', ')}`;
        break;
        
      case ErrorType.NULL_VALUE:
        recoveryStrategies = ['user_input', 'default_value'];
        recommendedStrategy = 'default_value';
        confidenceScore = 0.8;
        break;
        
      case ErrorType.SCHEMA_VIOLATION:
        recoveryStrategies = ['transform', 'user_input', 'retry'];
        recommendedStrategy = 'transform';
        confidenceScore = 0.75;
        break;
        
      case ErrorType.API_FAILURE:
        recoveryStrategies = ['retry', 'backoff_retry', 'alternative_api'];
        recommendedStrategy = 'backoff_retry';
        confidenceScore = 0.8;
        break;
        
      case ErrorType.AGENT_FAILURE:
        recoveryStrategies = ['retry', 'alternative_agent', 'modify_parameters'];
        recommendedStrategy = 'modify_parameters';
        confidenceScore = 0.7;
        break;
        
      case ErrorType.TIMEOUT:
        recoveryStrategies = ['retry', 'increase_timeout', 'simplify_request'];
        recommendedStrategy = 'increase_timeout';
        confidenceScore = 0.85;
        break;
        
      case ErrorType.CONTRADICTORY_VALUES:
        recoveryStrategies = ['user_input', 'resolve_contradiction', 'use_most_recent'];
        recommendedStrategy = 'resolve_contradiction';
        confidenceScore = 0.6; // Lower confidence, might need LLM
        requiresUserInput = true;
        break;
        
      case ErrorType.SEMANTIC_MISMATCH:
        recoveryStrategies = ['transform', 'user_input', 'default_value'];
        recommendedStrategy = 'transform';
        confidenceScore = 0.65; // Lower confidence, might need LLM
        break;
        
      case ErrorType.LOW_CONFIDENCE:
        recoveryStrategies = ['retry', 'user_input', 'alternative_approach'];
        recommendedStrategy = 'user_input';
        confidenceScore = 0.8;
        requiresUserInput = true;
        suggestedPrompt = 'The system is not confident about this result. Would you like to provide more information?';
        break;
        
      case ErrorType.EXECUTION_FAILURE:
        recoveryStrategies = ['retry', 'debug', 'alternative_approach'];
        recommendedStrategy = 'retry';
        confidenceScore = 0.6; // Lower confidence, might need LLM
        break;
        
      default:
        // For unknown error types
        recoveryStrategies = ['retry', 'user_input', 'log_and_continue'];
        recommendedStrategy = 'user_input';
        confidenceScore = 0.5;
        requiresUserInput = true;
        break;
    }
    
    // Adjust based on error category
    if (error.errorCategory === ErrorCategory.UNRESOLVABLE) {
      recoveryStrategies = ['log_and_skip', 'user_input', 'abort'];
      recommendedStrategy = 'user_input';
      confidenceScore = 0.9;
      requiresUserInput = true;
      suggestedPrompt = 'An unresolvable error occurred. How would you like to proceed?';
    } else if (error.errorCategory === ErrorCategory.INPUT_GAP) {
      recoveryStrategies = ['user_input', 'infer', 'default_value'];
      recommendedStrategy = 'user_input';
      confidenceScore = 0.9;
      requiresUserInput = true;
    }
    
    // Adjust based on severity
    if (error.severity === ErrorSeverity.CRITICAL) {
      if (!requiresUserInput) {
        requiresUserInput = true;
        suggestedPrompt = 'A critical error occurred. How would you like to proceed?';
      }
    }
    
    return {
      errorId,
      errorType: error.errorType,
      errorCategory: error.errorCategory,
      sourceType: error.sourceType,
      errorMessage: error.errorMessage,
      isRecoverable: error.isRecoverable,
      recoveryStrategies,
      recommendedStrategy,
      confidenceScore,
      requiresUserInput,
      suggestedPrompt
    };
  }
  
  /**
   * Classify error using LLM
   */
  private async classifyWithLLM(
    errorId: string,
    error: DetectedError,
    ruleBasedClassification: ErrorClassification
  ): Promise<ErrorClassification> {
    try {
      // Construct the prompt for the LLM
      const prompt = this.constructClassificationPrompt(error, ruleBasedClassification);
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      // Parse the LLM response
      const llmClassification = this.parseLLMResponse(response.choices[0].message.content || '');

      // Merge rule-based and LLM classifications
      return {
        ...ruleBasedClassification,
        ...llmClassification,
        errorId,
        errorType: error.errorType,
        errorCategory: llmClassification.errorCategory || error.errorCategory,
        sourceType: error.sourceType,
        errorMessage: error.errorMessage,
        confidenceScore: Math.max(llmClassification.confidenceScore || 0, ruleBasedClassification.confidenceScore)
      };
    } catch (err) {
      console.error('Error classifying with LLM:', err);
      return ruleBasedClassification;
    }
  }
  
  /**
   * Construct a prompt for LLM-based classification
   */
  private constructClassificationPrompt(
    error: DetectedError,
    ruleBasedClassification: ErrorClassification
  ): string {
    return `
You are an AI error classification system. Given the following error details, classify the error and suggest recovery strategies.

Error Type: ${error.errorType}
Error Message: ${error.errorMessage}
Source Type: ${error.sourceType}
${error.componentId ? `Component ID: ${error.componentId}` : ''}
${error.stackTrace ? `Stack Trace: ${error.stackTrace}` : ''}
${error.context ? `Context: ${JSON.stringify(error.context)}` : ''}
${error.inputData ? `Input Data: ${JSON.stringify(error.inputData)}` : ''}

Initial Classification:
- Error Category: ${ruleBasedClassification.errorCategory}
- Is Recoverable: ${ruleBasedClassification.isRecoverable}
- Recovery Strategies: ${ruleBasedClassification.recoveryStrategies.join(', ')}
- Recommended Strategy: ${ruleBasedClassification.recommendedStrategy}
- Requires User Input: ${ruleBasedClassification.requiresUserInput}

Please analyze this error and provide:
1. The most appropriate error category (recoverable, input_gap, unresolvable)
2. Whether the error is recoverable (true/false)
3. A list of recovery strategies in order of preference
4. The recommended recovery strategy
5. Whether user input is required (true/false)
6. A suggested prompt for the user if input is required
7. Your confidence score (0.0 to 1.0)

Format your response as JSON:
{
  "errorCategory": "category",
  "isRecoverable": true/false,
  "recoveryStrategies": ["strategy1", "strategy2", ...],
  "recommendedStrategy": "strategy",
  "requiresUserInput": true/false,
  "suggestedPrompt": "prompt",
  "confidenceScore": 0.9
}
`;
  }
  
  /**
   * Parse LLM response
   */
  private parseLLMResponse(response: string): Partial<ErrorClassification> {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        
        return {
          errorCategory: parsedResponse.errorCategory as ErrorCategory,
          isRecoverable: parsedResponse.isRecoverable,
          recoveryStrategies: parsedResponse.recoveryStrategies || [],
          recommendedStrategy: parsedResponse.recommendedStrategy,
          requiresUserInput: parsedResponse.requiresUserInput,
          suggestedPrompt: parsedResponse.suggestedPrompt,
          confidenceScore: parsedResponse.confidenceScore
        };
      }
    } catch (err) {
      console.error('Error parsing LLM response:', err);
    }
    
    return {};
  }
  
  /**
   * Add a journal entry for classification
   */
  public async addClassificationJournal(
    workflowId: string | null,
    templateId: string | null,
    errorId: string,
    classification: ErrorClassification
  ): Promise<void> {
    try {
      await supabase.rpc('add_recovery_journal', {
        p_workflow_id: workflowId,
        p_template_id: templateId,
        p_error_id: errorId,
        p_recovery_attempt_id: null,
        p_journal_entry: `Classified error as ${classification.errorCategory}. ` +
                        `Recommended strategy: ${classification.recommendedStrategy}. ` +
                        `Confidence: ${classification.confidenceScore}.`,
        p_entry_type: 'classification',
        p_entry_data: classification
      });
    } catch (err) {
      console.error('Error adding classification journal entry:', err);
    }
  }
}

// Export singleton instance
export const errorClassificationLayer = new ErrorClassificationLayer();
