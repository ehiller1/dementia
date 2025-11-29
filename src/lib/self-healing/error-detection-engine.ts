/**
 * Error Detection Engine
 * 
 * Detects anomalies or failures in the workflow execution pipeline.
 * Monitors for:
 * - Null/missing inputs
 * - API/agent failures
 * - Divergences from expected schema
 * - Timeouts or stalls
 * - Contradictory intermediate values
 * - Semantic mismatches
 * - Probabilistic thresholds (e.g., model confidence < 70%)
 */

import { supabase } from '../../integrations/supabase/client.ts';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Error types
export enum ErrorType {
  MISSING_INPUT = 'missing_input',
  NULL_VALUE = 'null_value',
  SCHEMA_VIOLATION = 'schema_violation',
  API_FAILURE = 'api_failure',
  AGENT_FAILURE = 'agent_failure',
  TIMEOUT = 'timeout',
  CONTRADICTORY_VALUES = 'contradictory_values',
  SEMANTIC_MISMATCH = 'semantic_mismatch',
  LOW_CONFIDENCE = 'low_confidence',
  EXECUTION_FAILURE = 'execution_failure',
  UNKNOWN = 'unknown'
}

// Error categories
export enum ErrorCategory {
  RECOVERABLE = 'recoverable',
  INPUT_GAP = 'input_gap',
  UNRESOLVABLE = 'unresolvable'
}

// Source types
export enum SourceType {
  TEMPLATE = 'template',
  WORKFLOW = 'workflow',
  ALGORITHM = 'algorithm',
  AGENT = 'agent',
  COMPONENT = 'component',
  PROMPT = 'prompt'
}

// Severity levels
export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Error interface
export interface DetectedError {
  errorType: ErrorType;
  errorCategory: ErrorCategory;
  sourceType: SourceType;
  sourceId?: string;
  stepId?: string;
  componentId?: string;
  errorMessage: string;
  errorDetails?: any;
  stackTrace?: string;
  context?: any;
  inputData?: any;
  confidence?: number;
  severity: ErrorSeverity;
  isRecoverable: boolean;
}

/**
 * Error Detection Engine
 */
export class ErrorDetectionEngine {
  private watchdogTimers: Map<string, NodeJS.Timeout> = new Map();
  private schemaValidators: Map<string, z.ZodType<any>> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    // Initialize schema validators
    this.initializeSchemaValidators();
  }
  
  /**
   * Initialize schema validators
   */
  private initializeSchemaValidators(): void {
    // Example schema validators - these would be expanded based on actual data models
    this.schemaValidators.set('workflow_input', z.object({
      workflowId: z.string().uuid(),
      templateId: z.string().uuid().optional(),
      parameters: z.record(z.any()).optional(),
      context: z.record(z.any()).optional()
    }));
    
    this.schemaValidators.set('algorithm_input', z.object({
      algorithmId: z.string().uuid().optional(),
      algorithmName: z.string().optional(),
      algorithmType: z.string(),
      data: z.any(),
      parameters: z.record(z.any()).optional()
    }));
    
    this.schemaValidators.set('agent_input', z.object({
      agentId: z.string().uuid().optional(),
      agentName: z.string().optional(),
      prompt: z.string(),
      parameters: z.record(z.any()).optional(),
      context: z.record(z.any()).optional()
    }));
  }
  
  /**
   * Detect errors in input data
   */
  public detectInputErrors(
    inputData: any,
    schemaKey: string,
    sourceType: SourceType,
    sourceId?: string,
    componentId?: string
  ): DetectedError | null {
    // Check for null or undefined input
    if (!inputData) {
      return {
        errorType: ErrorType.NULL_VALUE,
        errorCategory: ErrorCategory.INPUT_GAP,
        sourceType,
        sourceId,
        componentId,
        errorMessage: 'Input data is null or undefined',
        severity: ErrorSeverity.HIGH,
        isRecoverable: true
      };
    }
    
    // Check for missing required fields
    const missingFields = this.detectMissingFields(inputData, schemaKey);
    if (missingFields.length > 0) {
      return {
        errorType: ErrorType.MISSING_INPUT,
        errorCategory: ErrorCategory.INPUT_GAP,
        sourceType,
        sourceId,
        componentId,
        errorMessage: `Missing required fields: ${missingFields.join(', ')}`,
        errorDetails: { missingFields },
        context: { inputData },
        severity: ErrorSeverity.MEDIUM,
        isRecoverable: true
      };
    }
    
    // Validate against schema
    const schemaValidator = this.schemaValidators.get(schemaKey);
    if (schemaValidator) {
      const validationResult = schemaValidator.safeParse(inputData);
      if (!validationResult.success) {
        return {
          errorType: ErrorType.SCHEMA_VIOLATION,
          errorCategory: ErrorCategory.RECOVERABLE,
          sourceType,
          sourceId,
          componentId,
          errorMessage: 'Input data violates schema',
          errorDetails: validationResult.error,
          context: { inputData },
          severity: ErrorSeverity.MEDIUM,
          isRecoverable: true
        };
      }
    }
    
    return null;
  }
  
  /**
   * Detect missing fields in input data
   */
  private detectMissingFields(inputData: any, schemaKey: string): string[] {
    const missingFields: string[] = [];
    const schemaValidator = this.schemaValidators.get(schemaKey);
    
    if (!schemaValidator) {
      return missingFields;
    }
    
    // Extract required fields from schema
    const shape = (schemaValidator as any)._def.shape();
    const requiredFields = Object.entries(shape)
      .filter(([_, def]: [string, any]) => !def.isOptional())
      .map(([key, _]: [string, any]) => key);
    
    // Check for missing fields
    for (const field of requiredFields) {
      if (inputData[field] === undefined || inputData[field] === null) {
        missingFields.push(field);
      }
    }
    
    return missingFields;
  }
  
  /**
   * Detect execution errors
   */
  public detectExecutionError(
    error: Error,
    sourceType: SourceType,
    sourceId?: string,
    stepId?: string,
    componentId?: string,
    context?: any,
    inputData?: any
  ): DetectedError {
    // Determine error type based on error message or class
    let errorType = ErrorType.EXECUTION_FAILURE;
    let errorCategory = ErrorCategory.RECOVERABLE;
    let isRecoverable = true;
    let severity = ErrorSeverity.HIGH;
    
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      errorType = ErrorType.TIMEOUT;
    } else if (error.message.includes('API') || error.message.includes('api')) {
      errorType = ErrorType.API_FAILURE;
    } else if (error.message.includes('agent')) {
      errorType = ErrorType.AGENT_FAILURE;
    } else if (error.message.includes('schema') || error.message.includes('type')) {
      errorType = ErrorType.SCHEMA_VIOLATION;
    }
    
    // Check if error is likely unresolvable
    if (
      error.message.includes('permission denied') ||
      error.message.includes('not authorized') ||
      error.message.includes('invalid credentials') ||
      error.message.includes('rate limit')
    ) {
      errorCategory = ErrorCategory.UNRESOLVABLE;
      isRecoverable = false;
      severity = ErrorSeverity.CRITICAL;
    }
    
    return {
      errorType,
      errorCategory,
      sourceType,
      sourceId,
      stepId,
      componentId,
      errorMessage: error.message,
      stackTrace: error.stack,
      context,
      inputData,
      severity,
      isRecoverable
    };
  }
  
  /**
   * Detect semantic mismatches
   */
  public detectSemanticMismatch(
    expectedType: string,
    actualValue: any,
    fieldName: string,
    sourceType: SourceType,
    sourceId?: string,
    componentId?: string
  ): DetectedError | null {
    let mismatch = false;
    let actualType = typeof actualValue;
    
    // Check for type mismatches
    if (expectedType === 'number' && actualType !== 'number') {
      mismatch = true;
    } else if (expectedType === 'string' && actualType !== 'string') {
      mismatch = true;
    } else if (expectedType === 'boolean' && actualType !== 'boolean') {
      mismatch = true;
    } else if (expectedType === 'array' && !Array.isArray(actualValue)) {
      mismatch = true;
    } else if (expectedType === 'object' && (actualType !== 'object' || Array.isArray(actualValue) || actualValue === null)) {
      mismatch = true;
    } else if (expectedType === 'date' && !(actualValue instanceof Date) && isNaN(Date.parse(actualValue))) {
      mismatch = true;
    }
    
    if (mismatch) {
      return {
        errorType: ErrorType.SEMANTIC_MISMATCH,
        errorCategory: ErrorCategory.RECOVERABLE,
        sourceType,
        sourceId,
        componentId,
        errorMessage: `Semantic mismatch for field '${fieldName}': expected ${expectedType}, got ${actualType}`,
        errorDetails: { expectedType, actualType, fieldName, actualValue },
        severity: ErrorSeverity.MEDIUM,
        isRecoverable: true
      };
    }
    
    return null;
  }
  
  /**
   * Detect contradictory values
   */
  public detectContradictoryValues(
    values: Record<string, any>,
    rules: Array<{
      fields: string[];
      condition: (values: any[]) => boolean;
      message: string;
    }>,
    sourceType: SourceType,
    sourceId?: string,
    componentId?: string
  ): DetectedError | null {
    for (const rule of rules) {
      const fieldValues = rule.fields.map(field => values[field]);
      
      // Skip if any value is undefined
      if (fieldValues.some(v => v === undefined)) {
        continue;
      }
      
      // Check if condition is violated
      if (!rule.condition(fieldValues)) {
        return {
          errorType: ErrorType.CONTRADICTORY_VALUES,
          errorCategory: ErrorCategory.RECOVERABLE,
          sourceType,
          sourceId,
          componentId,
          errorMessage: rule.message,
          errorDetails: {
            fields: rule.fields,
            values: rule.fields.reduce((obj, field) => {
              obj[field] = values[field];
              return obj;
            }, {} as Record<string, any>)
          },
          severity: ErrorSeverity.MEDIUM,
          isRecoverable: true
        };
      }
    }
    
    return null;
  }
  
  /**
   * Detect low confidence
   */
  public detectLowConfidence(
    confidence: number,
    threshold: number,
    sourceType: SourceType,
    sourceId?: string,
    componentId?: string,
    context?: any
  ): DetectedError | null {
    if (confidence < threshold) {
      return {
        errorType: ErrorType.LOW_CONFIDENCE,
        errorCategory: ErrorCategory.RECOVERABLE,
        sourceType,
        sourceId,
        componentId,
        errorMessage: `Low confidence: ${confidence} is below threshold ${threshold}`,
        errorDetails: { confidence, threshold },
        context,
        confidence,
        severity: ErrorSeverity.LOW,
        isRecoverable: true
      };
    }
    
    return null;
  }
  
  /**
   * Create an error object from an Error or string
   */
  public createError(
    error: Error | string,
    sourceType: SourceType,
    sourceId?: string,
    stepId?: string,
    componentId?: string,
    context?: any,
    inputData?: any
  ): DetectedError {
    // Convert string error to Error object if needed
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    return this.detectExecutionError(
      errorObj,
      sourceType,
      sourceId,
      stepId,
      componentId,
      context,
      inputData
    );
  }
  
  /**
   * Log an error to the database
   */
  public async logError(error: DetectedError): Promise<string> {
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
   * Start a watchdog timer for execution
   */
  public startWatchdog(
    id: string,
    timeoutMs: number,
    sourceType: SourceType,
    sourceId?: string,
    stepId?: string,
    componentId?: string
  ): void {
    // Clear existing timer if any
    this.stopWatchdog(id);
    
    // Start new timer
    const timer = setTimeout(() => {
      const error: DetectedError = {
        errorType: ErrorType.TIMEOUT,
        errorCategory: ErrorCategory.RECOVERABLE,
        sourceType,
        sourceId,
        stepId,
        componentId,
        errorMessage: `Execution timed out after ${timeoutMs}ms`,
        errorDetails: { timeoutMs },
        severity: ErrorSeverity.HIGH,
        isRecoverable: true
      };
      
      this.logError(error);
    }, timeoutMs);
    
    this.watchdogTimers.set(id, timer);
  }
  
  /**
   * Stop a watchdog timer
   */
  public stopWatchdog(id: string): void {
    const timer = this.watchdogTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.watchdogTimers.delete(id);
    }
  }
  
  /**
   * Log an error to the database
   */
  public async logError(error: DetectedError): Promise<string> {
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
   * Register a custom schema validator
   */
  public registerSchemaValidator(key: string, schema: z.ZodType<any>): void {
    this.schemaValidators.set(key, schema);
  }
  
  /**
   * Get a schema validator
   */
  public getSchemaValidator(key: string): z.ZodType<any> | undefined {
    return this.schemaValidators.get(key);
  }
}

// Export singleton instance
export const errorDetectionEngine = new ErrorDetectionEngine();
