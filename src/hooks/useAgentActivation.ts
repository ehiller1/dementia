/**
 * Agent Activation Hook
 * 
 * This hook provides functionality to activate and execute agents using the CrewAI framework,
 * integrating with the agent registry and intent classification system.
 */

import { useState } from 'react';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useAgentRegistry } from './useAgentRegistry';
import { AgentDefinition, AgentExecutionRecord } from '../types/agentRegistry';
import { IntentClassificationResult } from './useIntentRouter';

export interface AgentActivationParams {
  agentId?: string;
  query: string;
  conversationId: string;
  parameters?: Record<string, any>;
  context?: string;
  intentClassification?: IntentClassificationResult;
}

export interface AgentExecutionResult {
  executionId: string;
  status: 'success' | 'error' | 'cancelled' | 'in_progress';
  results?: Record<string, any>;
  error?: string;
  executionTime?: number;
}

export const useAgentActivation = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const { getAgentById, activateAgent, getAgentExecutionStatus } = useAgentRegistry();

  /**
   * Activates and executes an agent using the CrewAI framework
   */
  const executeAgent = async (params: AgentActivationParams): Promise<AgentExecutionResult> => {
    setIsExecuting(true);
    const startTime = Date.now();

    try {
      // Step 1: Get the agent definition from registry if agentId is provided
      let agent: AgentDefinition | null = null;
      
      if (params.agentId) {
        agent = await getAgentById(params.agentId);
        if (!agent) {
          throw new Error(`Agent with ID ${params.agentId} not found in registry`);
        }
      } else {
        // If no agent ID provided, we'll need to discover an appropriate agent
        // For now, we'll create a placeholder for future implementation
        throw new Error('Agent discovery not yet implemented');
      }

      // Step 2: Prepare parameters for agent execution
      // Merge with explicitly provided parameters
      const executionParams = {
        ...(params.parameters || {}),
        query: params.query,
        context: params.context || ''
      };

      // Step 3: Create agent execution record and activate the agent
      const activationResult = await activateAgent({
        agent_id: agent.id!,
        conversation_id: params.conversationId,
        parameters: executionParams
      });

      if (!activationResult) {
        throw new Error('Failed to activate agent');
      }

      // Step 4: Poll for execution completion
      let status = 'in_progress';
      let executionResult: AgentExecutionResult = {
        executionId: activationResult.execution_id,
        status: 'in_progress'
      };
      
      // Initial wait time for polling (in ms)
      let waitTime = 1000;
      const maxWaitTime = 5000; // Maximum wait time between polls (5s)
      const totalTimeout = 300000; // Total timeout (5 minutes)
      const startPollTime = Date.now();
      
      while (status === 'in_progress' && Date.now() - startPollTime < totalTimeout) {
        // Wait before polling
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Exponential backoff for polling
        waitTime = Math.min(waitTime * 1.5, maxWaitTime);
        
        // Check execution status
        const statusResult = await getAgentExecutionStatus({ 
          execution_id: activationResult.execution_id 
        });
        
        if (!statusResult) continue;
        
        if (statusResult.status === 'completed') {
          executionResult = {
            executionId: activationResult.execution_id,
            status: 'success',
            results: statusResult.results,
            executionTime: Date.now() - startTime
          };
          break;
        } else if (statusResult.status === 'failed') {
          executionResult = {
            executionId: activationResult.execution_id,
            status: 'error',
            error: statusResult.error || 'Unknown error during execution',
            executionTime: Date.now() - startTime
          };
          break;
        } else if (statusResult.status === 'cancelled') {
          executionResult = {
            executionId: activationResult.execution_id,
            status: 'cancelled',
            executionTime: Date.now() - startTime
          };
          break;
        }
      }
      
      // If still in progress after timeout
      if (executionResult.status === 'in_progress') {
        executionResult = {
          executionId: activationResult.execution_id,
          status: 'error',
          error: 'Execution timed out',
          executionTime: Date.now() - startTime
        };
      }

      return executionResult;
    } catch (error) {
      console.error('Agent execution error:', error);
      toast({
        title: "Execution Error",
        description: `Failed to execute agent: ${error.message}`,
        variant: "destructive"
      });
      
      return {
        executionId: '',
        status: 'error',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Creates a CrewAI-based agent from a registry agent definition
   */
  const createCrewAgent = async (agentDef: AgentDefinition, parameters: Record<string, any>) => {
    // Import CrewAI components
    const { Agent } = await import('crewai');
    
    // Create agent configuration from definition
    const agentConfig = {
      name: agentDef.name,
      goal: `Execute ${agentDef.name} with the given parameters and return results`,
      backstory: agentDef.description,
      allowDelegation: true,
      verbose: true
    };
    
    // Create the agent
    return new Agent(agentConfig);
  };

  /**
   * Execute a CrewAI agent with specialized tasks based on the agent definition
   */
  const executeCrewAIAgent = async (
    agentDef: AgentDefinition, 
    parameters: Record<string, any>,
    executionId: string
  ) => {
    try {
      // Import required CrewAI components
      const { Crew, Task } = await import('crewai');
      
      // Create agent
      const agent = await createCrewAgent(agentDef, parameters);
      
      // Create appropriate task based on agent capabilities
      const task = new Task({
        description: `Execute ${agentDef.name} with the following parameters: ${JSON.stringify(parameters)}`,
        agent: agent,
        expectedOutput: 'Structured JSON result with analysis and recommendations'
      });
      
      // Create crew with single agent
      const crew = new Crew({
        agents: [agent],
        tasks: [task],
        verbose: true
      });
      
      // Execute crew
      const result = await crew.run();
      
      // Update execution record with results
      await supabase
        .from('agent_performance')
        .update({
          performance_score: 1.0,
          metrics: { output: result, status: 'completed' },
          recorded_at: new Date().toISOString()
        })
        .eq('id', executionId);
      
      return result;
    } catch (error) {
      console.error('CrewAI execution error:', error);
      
      // Update execution record with error
      await supabase
        .from('agent_performance')
        .update({
          performance_score: 0.0,
          metrics: { error: error.message, status: 'failed' },
          recorded_at: new Date().toISOString()
        })
        .eq('id', executionId);
        
      throw error;
    }
  };

  /**
   * Cancels an active agent execution
   */
  const cancelExecution = async (executionId: string): Promise<boolean> => {
    try {
      await supabase
        .from('agent_performance')
        .update({
          performance_score: 0.0,
          metrics: { status: 'cancelled' },
          recorded_at: new Date().toISOString()
        })
        .eq('id', executionId);
      
      return true;
    } catch (error) {
      console.error('Error canceling execution:', error);
      return false;
    }
  };

  return {
    executeAgent,
    cancelExecution,
    isExecuting
  };
};
