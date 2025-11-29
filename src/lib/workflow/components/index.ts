/**
 * Workflow Components Registry
 * Exports all workflow components and provides registration functions
 */

import { WorkflowComponentRegistry } from '../workflow-component-registry.ts';
import { registerAlgorithmRetrievalComponent } from './algorithm-retrieval.ts';
import { registerAlgorithmExecutionComponent } from './algorithm-execution.ts';
import { registerResultsProcessingComponent } from './results-processing.ts';
import { registerInterpretationComponent } from './interpretation-service.ts';

// Data components (previously implemented)
import { 
  registerDataReceiptComponents,
  registerDataNormalizationComponents,
  registerDataValidationComponents,
  registerDataTransformationComponents,
  registerDataEnrichmentComponents
} from './data-components.ts';

/**
 * Register all workflow components with the registry
 */
export function registerAllWorkflowComponents(registry: WorkflowComponentRegistry): void {
  // Register algorithm components
  registerAlgorithmRetrievalComponent(registry);
  registerAlgorithmExecutionComponent(registry);
  registerResultsProcessingComponent(registry);
  registerInterpretationComponent(registry);
  
  // Register data components
  registerDataReceiptComponents(registry);
  registerDataNormalizationComponents(registry);
  registerDataValidationComponents(registry);
  registerDataTransformationComponents(registry);
  registerDataEnrichmentComponents(registry);
}

/**
 * Initialize the workflow component registry with all components
 */
export function initializeWorkflowComponentRegistry(): WorkflowComponentRegistry {
  const registry = new WorkflowComponentRegistry();
  registerAllWorkflowComponents(registry);
  return registry;
}

// Export all component modules for direct access
export * from './algorithm-retrieval.ts';
export * from './algorithm-execution.ts';
export * from './results-processing.ts';
export * from './interpretation-service.ts';
export * from './data-components.ts';
