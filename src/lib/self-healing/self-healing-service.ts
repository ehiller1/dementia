/**
 * Self-Healing Service
 * 
 * Main integration point for the self-healing mechanism.
 * Provides a clean API for other parts of the system to use.
 */

import { supabase } from '../../integrations/supabase/client.ts';

import { errorDetectionEngine, DetectedError, ErrorType, ErrorCategory, SourceType, ErrorSeverity } from './error-detection-engine.ts';
import { errorClassificationLayer } from './error-classification-layer.ts';
import { remediationPlanningModule } from './remediation-planning-module.ts';
import { recoveryExecutionEngine } from './recovery-execution-engine.ts';
import { learningAdaptationLayer } from './learning-adaptation-layer.ts';

import { 
  ErrorClassification, 
  RemediationPlan, 
  RecoveryResult, 
  RecoveryAction,
  RecoveryStatus,
  AdaptationSuggestion
} from './types.ts';

/**
 * Self-Healing Service
 */
export class SelfHealingService {
  /**
   * Handle an error
   */
  public async handleError(
    error: Error | string,
    sourceType: SourceType,
    sourceId?: string,
    stepId?: string,
    componentId?: string,
    context?: any,
    inputData?: any,
    isAutonomous: boolean = false
  ): Promise<{
    errorId: string;
    classification: ErrorClassification;
    plan?: RemediationPlan;
    result?: RecoveryResult;
  }> {
    try {
      // 1. Detect and log the error
      const detectedError = await this.detectError(
        error,
        sourceType,
        sourceId,
        stepId,
        componentId,
        context,
        inputData
      );
      
      // 2. Classify the error
      const classification = await errorClassificationLayer.classifyError(
        detectedError,
        detectedError.errorId
      );
      
      // Add classification journal entry
      await errorClassificationLayer.addClassificationJournal(
        sourceType === SourceType.WORKFLOW ? sourceId : null,
        sourceType === SourceType.TEMPLATE ? sourceId : null,
        detectedError.errorId,
        classification
      );
      
      // If not recoverable, return early
      if (!classification.isRecoverable) {
        return {
          errorId: detectedError.errorId,
          classification
        };
      }
      
      // 3. Create a remediation plan
      const plan = await remediationPlanningModule.createPlan(
        classification,
        detectedError as DetectedError & { errorId: string },
        context
      );
      
      // Save plan to database
      const recoveryAttemptId = await remediationPlanningModule.savePlan(
        plan,
        detectedError.errorId
      );
      
      // Add planning journal entry
      await remediationPlanningModule.addPlanningJournal(
        sourceType === SourceType.WORKFLOW ? sourceId : null,
        sourceType === SourceType.TEMPLATE ? sourceId : null,
        detectedError.errorId,
        recoveryAttemptId,
        plan
      );
      
      // If not autonomous or requires user input, return the plan
      if (!isAutonomous || plan.requiresUserInput) {
        return {
          errorId: detectedError.errorId,
          classification,
          plan
        };
      }
      
      // 4. Execute the plan
      const result = await recoveryExecutionEngine.executePlan(
        {
          ...plan,
          errorId: (detectedError as DetectedError & { errorId: string }).errorId
        },
        context
      );
      
      // 5. Learn from the result
      await learningAdaptationLayer.processRecoveryResult(
        result,
        detectedError,
        plan
      );
      
      return {
        errorId: detectedError.errorId,
        classification,
        plan,
        result
      };
    } catch (err) {
      console.error('Error in self-healing service:', err);
      
      // Return minimal information
      return {
        errorId: 'error',
        classification: {
          errorId: 'error',
          errorType: ErrorType.EXECUTION_FAILURE,
          errorCategory: ErrorCategory.UNRESOLVABLE,
          sourceType: sourceType,
          errorMessage: 'Self-healing service failed',
          isRecoverable: false,
          recoveryStrategies: [],
          recommendedStrategy: '',
          confidenceScore: 0,
          requiresUserInput: true
        }
      };
    }
  }
  
  /**
   * Detect and log an error
   */
  private async detectError(
    error: Error | string,
    sourceType: SourceType,
    sourceId?: string,
    stepId?: string,
    componentId?: string,
    context?: any,
    inputData?: any
  ): Promise<DetectedError & { errorId: string }> {
    // Convert string error to Error object if needed
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Create error details
    const detectedError = errorDetectionEngine.createError(
      errorObj,
      sourceType,
      sourceId,
      stepId,
      componentId,
      context,
      inputData
    );
    
    // Log error
    const errorId = await errorDetectionEngine.logError(detectedError);
    
    // Return detected error with ID
    return {
      ...detectedError,
      errorId
    } as DetectedError & { errorId: string };
  }
  
  /**
   * Process user input for recovery
   */
  public async processUserInput(
    recoveryId: string,
    userInput: any,
    context?: any
  ): Promise<RecoveryResult> {
    try {
      // Update recovery with user input
      const success = await recoveryExecutionEngine.processUserInput(
        recoveryId,
        userInput
      );
      
      if (!success) {
        throw new Error('Failed to process user input');
      }
      
      // Get recovery plan using stored procedure
      // This ensures compatibility with the database schema
      const { data: recoveryData, error } = await supabase
        .from('recovery_attempts_view')
        .select('error_id, recovery_plan')
        .eq('id', recoveryId)
        .single();
      
      if (error || !recoveryData) {
        throw new Error('Failed to get recovery plan');
      }
      
      // Execute plan with user input
      const plan = {
        ...(recoveryData?.recovery_plan as Record<string, any> || {}),
        planId: recoveryId,
        errorId: recoveryData?.error_id as string,
        requiresUserInput: false
      };
      
      const result = await recoveryExecutionEngine.executePlan(
        plan,
        context
      );
      
      // Learn from the result
      await learningAdaptationLayer.processRecoveryResult(
        result,
        { errorId: recoveryData?.error_id as string },
        plan
      );
      
      return result;
    } catch (err) {
      console.error('Error processing user input:', err);
      
      // Return recovery result
      return {
        success: false,
        recoveryId: recoveryId,
        errorId: '',
        recoveryActions: [],
        requiresUserInput: true,
        userInputPrompt: 'An error occurred while processing your input. Please try again.',
        userInputOptions: ['Try again', 'Cancel']
      } as RecoveryResult;
    }
  }
  
  /**
   * Get adaptation suggestions
   */
  public async getAdaptationSuggestions(
    status: 'suggested' | 'approved' | 'rejected' | 'implemented' = 'suggested',
    limit: number = 10
  ): Promise<AdaptationSuggestion[]> {
    return learningAdaptationLayer.getAdaptationSuggestions(status, limit);
  }
  
  /**
   * Update adaptation suggestion status
   */
  public async updateSuggestionStatus(
    suggestionId: string,
    status: 'approved' | 'rejected' | 'implemented'
  ): Promise<boolean> {
    return learningAdaptationLayer.updateSuggestionStatus(suggestionId, status);
  }
}

// Export singleton instance
export const selfHealingService = new SelfHealingService();
