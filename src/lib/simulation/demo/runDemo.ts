#!/usr/bin/env node
import { runSimulationDemo } from './simulationDemo';
import { createSimulationServices } from '../index';
import { MemoryService } from '../../memory/memoryService';
import { DynamicTemplateEngine } from '../../templates/dynamicTemplateEngine';
import { supabase } from '../../supabase';

// Main function to run the demo with proper logging
async function main() {
  console.log('====================================================');
  console.log('Monte Carlo Simulation Integration Demo');
  console.log('====================================================');
  console.log('This demo demonstrates the complete integration of:');
  console.log('1. Simulation data processing');
  console.log('2. Action extraction and classification');
  console.log('3. Template generation and enhancement');
  console.log('4. Agent discovery and execution');
  console.log('5. Memory integration and persistence');
  console.log('====================================================\n');
  
  try {
    // Initialize core services required by simulation components
    const memoryService = new MemoryService(supabase);
    const dynamicTemplateEngine = new DynamicTemplateEngine(memoryService);
    
    // Create simulation services
    console.log('Initializing simulation services...');
    const simulationServices = createSimulationServices(
      memoryService,
      dynamicTemplateEngine
    );
    
    console.log('Services initialized successfully.\n');
    
    // Run the simulation demo
    console.log('Starting simulation integration demo...');
    const result = await runSimulationDemo();
    
    if (result.success) {
      console.log('\n✅ Demo completed successfully!');
      console.log(`Simulation ID: ${result.simulationId}`);
      console.log(`Template ID: ${result.templateId}`);
      console.log(`Executed Action ID: ${result.executedActionId}`);
      
      // Print a summary of what happened
      console.log('\n📋 Demo Summary:');
      console.log('1. Loaded sample Monte Carlo simulation data');
      console.log('2. Processed data through SimulationAdapter');
      console.log('3. Extracted and classified actions with SimulationActionProcessor');
      console.log('4. Generated a template with action functions');
      console.log('5. Discovered and executed an action with SimulationAgent');
      console.log('6. Stored execution results in memory and database');
      
      // Display the URL to view results (assuming frontend is running)
      console.log('\n🔗 To view results in the UI:');
      console.log('1. Ensure the frontend is running');
      console.log(`2. Navigate to: http://localhost:8081/simulations/${result.simulationId}`);
      console.log(`3. View action details at: http://localhost:8081/actions/${result.executedActionId}`);
    } else {
      console.error('\n❌ Demo failed:');
      console.error(result.error);
    }
  } catch (error) {
    console.error('Error running demo:', error);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\nDemo process complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
