/**
 * CrewAI Integration for Algorithm Instantiation
 * 
 * This module connects the algorithm generation and execution framework
 * with the CrewAI agent system, enabling agents to generate and run
 * algorithms based on user queries.
 */
import { generateAlgorithm } from './generator.ts';
import { executeAlgorithm } from './executor.ts';
import { AlgorithmDefinition, AlgorithmExecutionResult } from './types.ts';
import { 
  storeAlgorithm, 
  recordAlgorithmExecution, 
  updateAlgorithmExecution, 
  updateAlgorithmMetrics
} from '../api/algorithms.ts';
import { supabase } from '@/integrations/supabase/client';

// Define types locally since we can't use the import path
interface Agent {
  id?: string;
  name?: string;
  description?: string;
  capabilities?: string[];
}

interface AgentExecutionParams {
  executionId?: string;
  conversationId?: string;
  [key: string]: any;
}

/**
 * Interface for algorithm-specific execution parameters
 */
export interface AlgorithmAgentParams extends AgentExecutionParams {
  datasetId?: string;
  problem: string;
  language?: 'python' | 'javascript' | 'sql';
  constraints?: string[];
}

/**
 * Define a CrewAI agent that can generate and run algorithms
 */
export async function createAlgorithmAgent(
  agentDefinition: Agent,
  params: AlgorithmAgentParams
): Promise<any> {
  // Use CrewAI to create an agent with algorithm generation capabilities
  return {
    id: `algorithm-agent-${Date.now()}`,
    name: agentDefinition.name || "Algorithm Agent",
    description: agentDefinition.description || "An agent that generates and runs algorithms",
    
    // This execute method will be called by CrewAI
    async execute(input: any): Promise<AlgorithmExecutionResult> {
      // 1. Retrieve dataset
      const dataset = await getDataset(params.datasetId);
      if (!dataset && !input.sampleData) {
        throw new Error("No dataset or sample data provided for algorithm generation");
      }
      
      const sampleData = dataset?.data || input.sampleData || {};
      const datasetDescription = dataset?.description || input.datasetDescription || "Dataset for analysis";
      
      // 2. Generate algorithm based on problem description and dataset
      console.log(`Generating ${params.language || 'python'} algorithm for problem: ${params.problem}`);
      const algorithm: AlgorithmDefinition = await generateAlgorithm(
        params.problem,
        datasetDescription,
        sampleData,
        params.constraints || [],
        params.language || 'python'
      );
      
      // 3. Store algorithm definition and record execution start
      let algorithmId: string | null = null;
      let executionRecordId: string | null = null;
      
      if (params.executionId) {
        // Store the algorithm and get its ID
        algorithmId = await storeAlgorithmWithCrewAI(
          algorithm, 
          params.executionId, 
          agentDefinition.id
        );
        
        // Record the execution start if algorithm was stored successfully
        if (algorithmId) {
          executionRecordId = await recordAlgorithmExecution(
            algorithmId,
            params.executionId,
            { dataset: sampleData, ...input },
            'in_progress',
            { 
              conversationId: params.conversationId,
              problem: params.problem,
              startedAt: new Date().toISOString()
            }
          );
        }
      }
      
      // 4. Execute the algorithm with the dataset
      console.log(`Executing algorithm: ${algorithm.name}`);
      const startTime = Date.now();
      
      const executionResult = await executeAlgorithm({
        algorithmDefinition: algorithm,
        inputs: { dataset: sampleData, ...input },
        executionId: params.executionId,
      });
      
      const executionTime = Date.now() - startTime;
      
      // 5. Update execution record with results
      if (algorithmId && executionRecordId) {
        // Update the execution record with results
        await updateAlgorithmExecution(
          executionRecordId,
          executionResult.success ? 'completed' : 'failed',
          executionResult.output,
          executionTime,
          executionResult.error
        );
        
        // Update algorithm performance metrics
        await updateAlgorithmMetrics(algorithmId, {
          lastExecutionTime: executionTime,
          lastExecutionSuccess: executionResult.success,
          executionCount: 1, // This would be incremented in a real implementation
          lastExecutedAt: new Date().toISOString()
        });
      }
      
      return {
        ...executionResult,
        algorithm,
        algorithmId,
        executionRecordId,
        executionTime
      };
    }
  };
}

/**
 * Store algorithm in database using the algorithms API
 */
async function storeAlgorithmWithCrewAI(algorithm: AlgorithmDefinition, executionId: string, agentId?: string): Promise<string | null> {
  try {
    // Use the algorithms API to store the algorithm in the database
    const storedAlgorithm = await storeAlgorithm(
      algorithm,
      executionId,
      agentId,
      false, // Not public by default
      algorithm.tags || []
    );
    
    if (!storedAlgorithm) {
      console.error('Failed to store algorithm');
      return null;
    }
    
    return storedAlgorithm.id;
  } catch (error) {
    console.error('Error storing algorithm:', error);
    // Non-critical, we continue execution even if storage fails
    return null;
  }
}

/**
 * Get dataset from database
 */
async function getDataset(datasetId?: string): Promise<{ data: any; description: string } | null> {
  if (!datasetId) return null;
  
  // For now, return mock dataset since we don't have the datasets table yet
  // In a real implementation, we would fetch from the database
  return {
    data: {
      monthly_sales: [
        { month: 'Jan', sales: 4200, region: 'North' },
        { month: 'Feb', sales: 4800, region: 'North' },
        { month: 'Mar', sales: 5100, region: 'North' },
        { month: 'Apr', sales: 4900, region: 'North' },
        { month: 'Jan', sales: 3800, region: 'South' },
        { month: 'Feb', sales: 4100, region: 'South' },
        { month: 'Mar', sales: 5200, region: 'South' },
        { month: 'Apr', sales: 5600, region: 'South' },
      ]
    },
    description: 'Monthly sales data by region'
  };
}

/**
 * Register algorithm-specific capabilities with the agent registry
 */
export function registerAlgorithmCapabilities(): void {
  // In a real implementation, this would register the algorithm
  // capabilities in the agent registry
  console.log('Registering algorithm capabilities');
}

/**
 * Process agent execution results into a user-friendly format
 */
export function processAlgorithmResults(result: AlgorithmExecutionResult): string {
  if (!result.success) {
    return `Algorithm execution failed: ${result.error}`;
  }
  
  // Format the results for display to the user
  const output = result.output;
  let formattedResult = 'Algorithm executed successfully.\n\n';
  
  if (typeof output === 'object') {
    // Try to create a meaningful summary
    if (output.summary) {
      formattedResult += `Summary: ${output.summary}\n\n`;
    }
    
    if (output.result) {
      formattedResult += `Result: ${JSON.stringify(output.result, null, 2)}\n\n`;
    } else {
      formattedResult += `Output: ${JSON.stringify(output, null, 2)}\n\n`;
    }
  } else {
    formattedResult += `Result: ${output}\n\n`;
  }
  
  if (result.executionTime) {
    formattedResult += `Execution time: ${result.executionTime}ms\n`;
  }
  
  return formattedResult;
}
