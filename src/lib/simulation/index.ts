import { OpenAIEmbeddingService } from '../embedding/openAIEmbeddingService';
import { MemoryService } from '../memory/memoryService';
import { SimulationAdapter } from './simulationAdapter';
import { SimulationActionProcessor } from './simulationActionProcessor';
import { SimulationTemplateEngine } from './simulationTemplateEngine';
import { SimulationAgentDiscoveryService } from './simulationAgentDiscoveryService';
import { SimulationIntentHandler } from './simulationIntentHandler';
import { SimulationAPIService } from './simulationAPIService';
import { DynamicTemplateEngine } from '../templates/dynamicTemplateEngine';

/**
 * Create and configure all simulation-related services
 */
export const createSimulationServices = (
  memoryService: MemoryService,
  dynamicTemplateEngine: DynamicTemplateEngine
) => {
  // Initialize embedding service
  const embeddingService = new OpenAIEmbeddingService();

  // Create agent discovery service
  const simulationAgentDiscoveryService = new SimulationAgentDiscoveryService(
    memoryService,
    embeddingService
  );

  // Create simulation adapter
  const simulationAdapter = new SimulationAdapter(
    memoryService,
    embeddingService
  );

  // Create action processor
  const simulationActionProcessor = new SimulationActionProcessor(
    memoryService, 
    embeddingService,
    simulationAgentDiscoveryService
  );

  // Create template engine
  const simulationTemplateEngine = new SimulationTemplateEngine(
    dynamicTemplateEngine,
    memoryService,
    simulationAdapter,
    simulationActionProcessor,
    simulationAgentDiscoveryService
  );

  // Create intent handler
  const simulationIntentHandler = new SimulationIntentHandler(
    simulationTemplateEngine,
    simulationAdapter,
    memoryService
  );

  // Create API service
  const simulationAPIService = new SimulationAPIService(
    simulationTemplateEngine,
    simulationIntentHandler,
    simulationActionProcessor
  );

  return {
    simulationAdapter,
    simulationActionProcessor,
    simulationTemplateEngine,
    simulationAgentDiscoveryService,
    simulationIntentHandler,
    simulationAPIService
  };
};

export {
  SimulationAdapter,
  SimulationActionProcessor,
  SimulationTemplateEngine,
  SimulationAgentDiscoveryService,
  SimulationIntentHandler,
  SimulationAPIService
};

export * from './types';
