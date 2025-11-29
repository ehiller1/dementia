/**
 * Self-Healing Types
 * 
 * Common types used across the self-healing mechanism components.
 */

import { ErrorType, ErrorCategory, SourceType, ErrorSeverity, DetectedError } from './error-detection-engine.ts';

/**
 * Recovery strategy types
 */
export enum RecoveryStrategyType {
  RETRY = 'retry',
  REPROMPT = 'reprompt',
  VALUE_SUBSTITUTION = 'value_substitution',
  DIAGNOSTICS = 'diagnostics',
  FALLBACK = 'fallback',
  HUMAN_INTERVENTION = 'human_intervention',
  ABORT = 'abort'
}

/**
 * Recovery strategy
 */
export interface RecoveryStrategy {
  type: RecoveryStrategyType;
  confidence: number;
  description: string;
  steps: RecoveryStep[];
}

/**
 * Recovery step
 */
export interface RecoveryStep {
  stepId: string;
  action: string;
  parameters?: Record<string, any>;
  requiresUserInput?: boolean;
  userInputPrompt?: string;
  userInputOptions?: string[];
}

/**
 * Error classification
 */
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
 * Remediation step
 */
export interface RemediationStep {
  stepId: string;
  action: string;
  parameters?: Record<string, any>;
  description: string;
  isOptional: boolean;
  order: number;
}

/**
 * Remediation plan
 */
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

/**
 * Recovery action
 */
export interface RecoveryAction {
  actionId: string;
  stepId: string;
  action: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  timestamp: string;
}

/**
 * Recovery status
 */
export enum RecoveryStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REQUIRES_INPUT = 'requires_input'
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  recoveryId: string;
  errorId: string;
  successful: boolean;
  executedSteps: number;
  totalSteps: number;
  userInputProvided?: boolean;
  outputData?: Record<string, any>;
  errorMessage?: string;
  executionTime: number;
}

/**
 * Learning entry
 */
export interface LearningEntry {
  id: string;
  errorType: ErrorType;
  errorCategory: ErrorCategory;
  sourceType: SourceType;
  recoveryStrategy: RecoveryStrategyType;
  successful: boolean;
  pattern: string;
  frequency: number;
  lastOccurred: string;
  suggestedImprovement?: string;
}

/**
 * Adaptation suggestion
 */
export interface AdaptationSuggestion {
  id: string;
  errorPattern: string;
  sourceType: SourceType;
  suggestion: string;
  confidence: number;
  implementationHint?: string;
  createdAt: string;
  appliedAt?: string;
  successful?: boolean;
}
