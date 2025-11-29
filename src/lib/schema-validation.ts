/**
 * Schema Validation Helpers
 * Provides validation at producer and consumer edges using existing SchemaRegistry
 */

import { SchemaRegistry, ValidationResult } from '../infrastructure/SchemaRegistry';

// Singleton instance
let registryInstance: SchemaRegistry | null = null;

export function getSchemaRegistry(): SchemaRegistry {
  if (!registryInstance) {
    registryInstance = new SchemaRegistry();
  }
  return registryInstance;
}

/**
 * Validate message at producer (before publishing to Redis)
 */
export async function validateProducer(
  schemaName: string,
  schemaVersion: string,
  data: any
): Promise<ValidationResult> {
  const registry = getSchemaRegistry();
  
  try {
    const schemaUri = `https://schemas.acme.com/${schemaName}/${schemaVersion}`;
    const result = await registry.validatePayload(schemaUri, data);

    if (!result.valid) {
      console.error(`[Producer Validation] Schema: ${schemaName}/${schemaVersion}`, result.errors);
    }

    return result;
  } catch (error) {
    console.error(`[Producer Validation] Error:`, error);
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Validate message at consumer (after reading from Redis)
 */
export async function validateConsumer(
  schemaName: string,
  schemaVersion: string,
  data: any
): Promise<ValidationResult> {
  const registry = getSchemaRegistry();
  
  try {
    const schemaUri = `https://schemas.acme.com/${schemaName}/${schemaVersion}`;
    const result = await registry.validatePayload(schemaUri, data);

    if (!result.valid) {
      console.error(`[Consumer Validation] Schema: ${schemaName}/${schemaVersion}`, result.errors);
    }

    return result;
  } catch (error) {
    console.error(`[Consumer Validation] Error:`, error);
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Validate workflow envelope (most common use case)
 */
export async function validateWorkflowEnvelope(data: any): Promise<ValidationResult> {
  return validateProducer('WorkflowEnvelope', '1', data);
}

/**
 * Validate evidence envelope
 */
export async function validateEvidenceEnvelope(data: any): Promise<ValidationResult> {
  return validateProducer('EvidenceEnvelope', '1', data);
}

/**
 * Validate telemetry envelope
 */
export async function validateTelemetryEnvelope(data: any): Promise<ValidationResult> {
  return validateProducer('TelemetryEnvelope', '1', data);
}

/**
 * Validate capability contract
 */
export async function validateCapabilityContract(data: any): Promise<ValidationResult> {
  return validateProducer('CapabilityContract', '1', data);
}

/**
 * Validate and throw if invalid (for strict validation)
 */
export async function validateOrThrow(
  schemaName: string,
  schemaVersion: string,
  data: any,
  context?: string
): Promise<void> {
  const result = await validateProducer(schemaName, schemaVersion, data);
  
  if (!result.valid) {
    const errorMsg = `Schema validation failed${context ? ` (${context})` : ''}: ${result.errors.join(', ')}`;
    throw new Error(errorMsg);
  }
}
