/**
 * Hardened validation system using Ajv for strict JSON Schema validation
 * Replaces minimal validation with comprehensive schema enforcement
 */

import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import {
  ForecastPublishedSchema,
  ForecastDeltaDetectedSchema,
  PlanDeclaredSchema,
  ImplicationsDerivedSchema,
  RecommendedActionsSchema,
  PlanVarianceDetectedSchema,
  SimulatedOutcomeSchema,
  PolicyViolationRiskSchema,
  ReplanRequestedSchema,
  ActionCommittedSchema,
  ApprovalRequestedSchema,
  ApprovalGrantedSchema,
  ApprovalRejectedSchema,
} from '../events/schemas';
import {
  ForecastPublished,
  ForecastDeltaDetected,
  PlanDeclared,
  ImplicationsDerived,
  RecommendedActions,
  PlanVarianceDetected,
  SimulatedOutcome,
  PolicyViolationRisk,
  ReplanRequested,
  ActionCommitted,
  ApprovalRequested,
  ApprovalGranted,
  ApprovalRejected,
} from '../events/types';

// Initialize Ajv with strict validation
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  verbose: true,
  removeAdditional: false,
});

// Add format validation (dates, etc.)
addFormats(ajv);

// Compile validators for all event schemas
const validators = {
  ForecastPublished: ajv.compile(ForecastPublishedSchema),
  ForecastDeltaDetected: ajv.compile(ForecastDeltaDetectedSchema),
  PlanDeclared: ajv.compile(PlanDeclaredSchema),
  ImplicationsDerived: ajv.compile(ImplicationsDerivedSchema),
  RecommendedActions: ajv.compile(RecommendedActionsSchema),
  PlanVarianceDetected: ajv.compile(PlanVarianceDetectedSchema),
  SimulatedOutcome: ajv.compile(SimulatedOutcomeSchema),
  PolicyViolationRisk: ajv.compile(PolicyViolationRiskSchema),
  ReplanRequested: ajv.compile(ReplanRequestedSchema),
  ActionCommitted: ajv.compile(ActionCommittedSchema),
  ApprovalRequested: ajv.compile(ApprovalRequestedSchema),
  ApprovalGranted: ajv.compile(ApprovalGrantedSchema),
  ApprovalRejected: ajv.compile(ApprovalRejectedSchema),
};

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  errorDetails?: any[];
}

export class EventValidator {
  /**
   * Validate any event payload against its schema
   */
  static validate(eventType: string, payload: any): ValidationResult {
    const validator = validators[eventType as keyof typeof validators];
    if (!validator) {
      return {
        valid: false,
        errors: [`Unknown event type: ${eventType}`],
      };
    }

    const valid = validator(payload);
    if (valid) {
      return { valid: true };
    }

    const errors = validator.errors?.map(err => {
      const path = err.instancePath || 'root';
      const message = err.message || 'validation failed';
      return `${path}: ${message}`;
    }) || ['Unknown validation error'];

    return {
      valid: false,
      errors,
      errorDetails: validator.errors,
    };
  }

  /**
   * Validate ForecastPublished event
   */
  static validateForecastPublished(payload: any): ValidationResult {
    return this.validate('ForecastPublished', payload);
  }

  /**
   * Validate ForecastDeltaDetected event
   */
  static validateForecastDeltaDetected(payload: any): ValidationResult {
    return this.validate('ForecastDeltaDetected', payload);
  }

  /**
   * Validate PlanDeclared event
   */
  static validatePlanDeclared(payload: any): ValidationResult {
    return this.validate('PlanDeclared', payload);
  }

  /**
   * Validate ImplicationsDerived event
   */
  static validateImplicationsDerived(payload: any): ValidationResult {
    return this.validate('ImplicationsDerived', payload);
  }

  /**
   * Validate RecommendedActions event
   */
  static validateRecommendedActions(payload: any): ValidationResult {
    return this.validate('RecommendedActions', payload);
  }

  /**
   * Validate PlanVarianceDetected event
   */
  static validatePlanVarianceDetected(payload: any): ValidationResult {
    return this.validate('PlanVarianceDetected', payload);
  }

  /**
   * Throw detailed validation error if payload is invalid
   */
  static validateOrThrow(eventType: string, payload: any): void {
    const result = this.validate(eventType, payload);
    if (!result.valid) {
      const errorMsg = `${eventType} validation failed: ${result.errors?.join(', ')}`;
      const error = new Error(errorMsg);
      (error as any).validationErrors = result.errorDetails;
      throw error;
    }
  }

  /**
   * Get all available event types for validation
   */
  static getAvailableEventTypes(): string[] {
    return Object.keys(validators);
  }
}

// Export individual validators for direct use
export const validateForecastPublished = (payload: any) => 
  EventValidator.validateForecastPublished(payload);

export const validateForecastDeltaDetected = (payload: any) => 
  EventValidator.validateForecastDeltaDetected(payload);

export const validatePlanDeclared = (payload: any) => 
  EventValidator.validatePlanDeclared(payload);

export const validateImplicationsDerived = (payload: any) => 
  EventValidator.validateImplicationsDerived(payload);

export const validateRecommendedActions = (payload: any) => 
  EventValidator.validateRecommendedActions(payload);

export const validatePlanVarianceDetected = (payload: any) => 
  EventValidator.validatePlanVarianceDetected(payload);
