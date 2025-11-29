/**
 * Robust JSON Extraction and Validation
 * 
 * Replaces fragile "JSON fence" parsing with tolerant extraction + AJV validation.
 * Routes validation failures to review queue instead of Executive formatter.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { batchEmailClassificationSchema } from './schemas/batchEmailClassification';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Compile validators for known schemas
const validators = {
  batchEmailClassification: ajv.compile(batchEmailClassificationSchema)
};

export type SchemaType = keyof typeof validators;

export interface ValidationResult {
  valid: boolean;
  data?: any;
  errors?: any[];
  errorCode?: 'NO_VALID_JSON' | 'SCHEMA_VALIDATION_FAILED' | 'UNKNOWN_SCHEMA';
}

/**
 * Tolerant JSON extraction
 * 
 * Handles:
 * - Raw JSON objects
 * - JSON strings
 * - JSON wrapped in prose
 * - JSON in code fences
 */
export function tryParseJSON(input: unknown): any | null {
  // Already an object
  if (typeof input === 'object' && input !== null) {
    return input;
  }
  
  // Convert to string
  const txt = String(input || '');
  
  // Try direct parse first
  try {
    return JSON.parse(txt);
  } catch {
    // Continue to extraction
  }
  
  // Try to extract from code fence
  const fenceMatch = txt.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      // Continue to bracket extraction
    }
  }
  
  // Try to extract first {...} object
  const start = txt.indexOf('{');
  const end = txt.lastIndexOf('}');
  
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  
  try {
    return JSON.parse(txt.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Validate JSON against schema
 */
export function validateJSON(data: any, schemaType: SchemaType): ValidationResult {
  const validator = validators[schemaType];
  
  if (!validator) {
    return {
      valid: false,
      errorCode: 'UNKNOWN_SCHEMA',
      errors: [{ message: `Unknown schema type: ${schemaType}` }]
    };
  }
  
  const valid = validator(data);
  
  if (valid) {
    return {
      valid: true,
      data
    };
  }
  
  return {
    valid: false,
    errorCode: 'SCHEMA_VALIDATION_FAILED',
    errors: validator.errors || []
  };
}

/**
 * Extract and validate JSON in one step
 */
export function extractAndValidate(
  input: unknown,
  schemaType: SchemaType
): ValidationResult {
  // Step 1: Extract JSON
  const parsed = tryParseJSON(input);
  
  if (!parsed) {
    return {
      valid: false,
      errorCode: 'NO_VALID_JSON',
      errors: [{ message: 'Could not extract valid JSON from input' }]
    };
  }
  
  // Step 2: Validate against schema
  return validateJSON(parsed, schemaType);
}

/**
 * Format validation errors for logging
 */
export function formatValidationErrors(errors: any[]): string {
  return errors
    .map(err => {
      const path = err.instancePath || err.dataPath || 'root';
      const message = err.message || 'validation failed';
      return `${path}: ${message}`;
    })
    .join('; ');
}
