import express from 'express';
import { createSimulationServices } from './index';
import { MemoryService } from '../memory/memoryService';
import { DynamicTemplateEngine } from '../templates/dynamicTemplateEngine';
import { IntentRouter } from '../intent/intentRouter';
import { SimulationAgent } from './agents/simulationAgent';

/**
 * Integrates simulation components with the server architecture
 * following the proper flow: Intent Router -> Template Engine -> Agent Delegation
 */
export const integrateSimulationWithServer = (
  app: express.Application,
  memoryService: MemoryService,
  dynamicTemplateEngine: DynamicTemplateEngine,
  intentRouter: IntentRouter
) => {
  console.log('Integrating Monte Carlo simulation components...');
  
  try {
    // 1. Create all simulation services
    const {
      simulationAdapter,
      simulationActionProcessor,
      simulationTemplateEngine,
      simulationAgentDiscoveryService,
      simulationIntentHandler,
      simulationAPIService
    } = createSimulationServices(
      memoryService,
      dynamicTemplateEngine
    );
    
    // 2. Register the generic simulation agent
    const simulationAgent = new SimulationAgent(memoryService);
    registerSimulationAgent(simulationAgent);
    
    // 3. Register simulation intent handler with the intent router
    intentRouter.registerIntentHandler('simulation', simulationIntentHandler);
    intentRouter.registerIntentHandler('process_simulation', simulationIntentHandler);
    intentRouter.registerIntentHandler('execute_simulation_action', simulationIntentHandler);
    
    // 4. Mount simulation API routes
    app.use('/api/simulation', simulationAPIService.getRouter());
    
    // 5. Add simulation template capabilities to template engine
    enhanceTemplateEngine(
      dynamicTemplateEngine,
      simulationTemplateEngine,
      simulationActionProcessor
    );
    
    console.log('✅ Monte Carlo simulation components successfully integrated!');
    
    return {
      simulationAdapter,
      simulationActionProcessor,
      simulationTemplateEngine,
      simulationAgentDiscoveryService,
      simulationIntentHandler,
      simulationAPIService
    };
  } catch (error) {
    console.error('Error integrating simulation components:', error);
    throw error;
  }
};

/**
 * Register the simulation agent with the discovery service
 */
const registerSimulationAgent = async (simulationAgent: SimulationAgent) => {
  try {
    // In a real implementation, we would register with agent registry
    console.log('Registering simulation agent:', simulationAgent.getAgentInfo().name);
    
    // This is where we'd add the agent to the registry in a full implementation
    // The demo script handles the actual registration with the database
  } catch (error) {
    console.error('Error registering simulation agent:', error);
  }
};

/**
 * Enhance the DynamicTemplateEngine with simulation capabilities
 */
const enhanceTemplateEngine = (
  dynamicTemplateEngine: DynamicTemplateEngine,
  simulationTemplateEngine: any,
  simulationActionProcessor: any
) => {
  try {
    // In a production implementation, we would add methods to the template engine
    // or use composition to enhance its capabilities
    
    // For now, we establish the connection points that show the correct architecture
    
    // 1. Enable template engine to handle simulation-derived functions
    if (!dynamicTemplateEngine.hasOwnProperty('processSimulationResults')) {
      (dynamicTemplateEngine as any).processSimulationResults = 
        simulationTemplateEngine.processSimulationResults.bind(simulationTemplateEngine);
    }
    
    // 2. Enable template engine to incorporate simulation results into templates
    if (!dynamicTemplateEngine.hasOwnProperty('incorporateSimulationResults')) {
      (dynamicTemplateEngine as any).incorporateSimulationResults = 
        simulationTemplateEngine.incorporateSimulationResults.bind(simulationTemplateEngine);
    }
    
    // 3. Register function types for simulation-derived actions
    (dynamicTemplateEngine as any).registerFunctionTypes({
      'simulation_action': {
        execute: async (func: any, context: any) => {
          return simulationActionProcessor.executeFunction(func, context);
        },
        validate: (func: any) => {
          return true; // Simplified validation
        }
      }
    });
    
    console.log('Enhanced template engine with simulation capabilities');
  } catch (error) {
    console.error('Error enhancing template engine:', error);
  }
};

/**
 * Helper function to set up and run the demo
 */
export const setupAndRunSimulationDemo = async (
  memoryService: MemoryService,
  dynamicTemplateEngine: DynamicTemplateEngine
) => {
  try {
    // Dynamic import of the demo runner to avoid circular dependencies
    const { runSimulationDemo } = await import('./demo/simulationDemo');
    return await runSimulationDemo();
  } catch (error) {
    console.error('Error running simulation demo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
