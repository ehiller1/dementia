/**
 * Agent Feedback Loop
 * 
 * Implements a feedback loop system for improving dynamically generated agent code.
 * Collects execution metrics, user feedback, and validation results to provide
 * to OpenAI for iterative improvement of agent implementations.
 */

import { supabase } from '@/integrations/supabase/client';
import { AgentValidationResult } from './agentValidator.ts';
import { SandboxExecutionResult } from './codeSandbox.ts';
import { nanoid } from 'nanoid';

// Types for feedback loop
export interface AgentFeedback {
  agentId: string;
  executionId: string;
  userId: string;
  rating?: number; // 1-5 scale
  feedback?: string;
  successful: boolean;
  tags?: string[];
}

export interface AgentExecutionMetrics {
  agentId: string;
  executionId: string;
  executionTimeMs: number;
  memoryUsageMb?: number;
  errorCount: number;
  outputSize: number;
  timestamp: string;
}

export interface AgentImprovementRequest {
  agentId: string;
  originalCode: string;
  validationResults: AgentValidationResult[];
  executionMetrics: AgentExecutionMetrics[];
  userFeedback: AgentFeedback[];
  improvementFocus?: string[];
}

export interface AgentImprovementResult {
  agentId: string;
  improvedCode: string;
  improvements: string[];
  suggestedTests: any[];
}

/**
 * Agent Feedback Loop class for collecting feedback and improving agent code
 */
export class AgentFeedbackLoop {
  /**
   * Store user feedback for an agent execution
   */
  async storeFeedback(feedback: AgentFeedback): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('agent_feedback')
        .insert({
          agent_id: feedback.agentId,
          execution_id: feedback.executionId,
          user_id: feedback.userId,
          rating: feedback.rating,
          feedback: feedback.feedback,
          successful: feedback.successful,
          tags: feedback.tags
        });
        
      if (error) {
        console.error('Error storing agent feedback:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Exception storing agent feedback:', err);
      return false;
    }
  }
  
  /**
   * Store execution metrics for an agent run
   */
  async storeExecutionMetrics(metrics: AgentExecutionMetrics): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('agent_execution_metrics')
        .insert({
          agent_id: metrics.agentId,
          execution_id: metrics.executionId,
          execution_time_ms: metrics.executionTimeMs,
          memory_usage_mb: metrics.memoryUsageMb,
          error_count: metrics.errorCount,
          output_size: metrics.outputSize,
          timestamp: metrics.timestamp
        });
        
      if (error) {
        console.error('Error storing agent metrics:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Exception storing agent metrics:', err);
      return false;
    }
  }
  
  /**
   * Get aggregated feedback for an agent
   */
  async getAgentFeedback(agentId: string, limit: number = 10): Promise<AgentFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('agent_feedback')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('Error fetching agent feedback:', error);
        return [];
      }
      
      return data.map(item => ({
        agentId: item.agent_id,
        executionId: item.execution_id,
        userId: item.user_id,
        rating: item.rating,
        feedback: item.feedback,
        successful: item.successful,
        tags: item.tags
      }));
    } catch (err) {
      console.error('Exception fetching agent feedback:', err);
      return [];
    }
  }
  
  /**
   * Get execution metrics for an agent
   */
  async getAgentMetrics(agentId: string, limit: number = 20): Promise<AgentExecutionMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('agent_execution_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .order('timestamp', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('Error fetching agent metrics:', error);
        return [];
      }
      
      return data.map(item => ({
        agentId: item.agent_id,
        executionId: item.execution_id,
        executionTimeMs: item.execution_time_ms,
        memoryUsageMb: item.memory_usage_mb,
        errorCount: item.error_count,
        outputSize: item.output_size,
        timestamp: item.timestamp
      }));
    } catch (err) {
      console.error('Exception fetching agent metrics:', err);
      return [];
    }
  }
  
  /**
   * Request code improvements from OpenAI based on feedback and metrics
   */
  async requestCodeImprovement(request: AgentImprovementRequest): Promise<AgentImprovementResult> {
    try {
      // Prepare the improvement request for the OpenAI function
      const { data, error } = await supabase.functions.invoke('improve-agent-code', {
        body: request
      });
      
      if (error) {
        console.error('Error requesting code improvement:', error);
        throw new Error(`Failed to improve agent code: ${error.message}`);
      }
      
      return {
        agentId: request.agentId,
        improvedCode: data.improvedCode,
        improvements: data.improvements,
        suggestedTests: data.suggestedTests
      };
    } catch (err) {
      console.error('Exception requesting code improvement:', err);
      throw new Error(`Failed to improve agent code: ${err.message}`);
    }
  }
  
  /**
   * Create a comprehensive improvement request based on agent ID
   */
  async createImprovementRequest(
    agentId: string, 
    originalCode: string,
    focus?: string[]
  ): Promise<AgentImprovementRequest> {
    // Get recent validation results
    const { data: validationData, error: validationError } = await supabase
      .from('agent_validation_results')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (validationError) {
      console.error('Error fetching validation results:', validationError);
    }
    
    // Get metrics
    const metrics = await this.getAgentMetrics(agentId);
    
    // Get feedback
    const feedback = await this.getAgentFeedback(agentId);
    
    return {
      agentId,
      originalCode,
      validationResults: validationData || [],
      executionMetrics: metrics,
      userFeedback: feedback,
      improvementFocus: focus
    };
  }
  
  /**
   * Complete feedback loop cycle: collect data, request improvements, and store results
   */
  async runFeedbackLoop(
    agentId: string, 
    originalCode: string,
    focus?: string[]
  ): Promise<AgentImprovementResult> {
    // Create the improvement request
    const request = await this.createImprovementRequest(agentId, originalCode, focus);
    
    // Request improvements from OpenAI
    const result = await this.requestCodeImprovement(request);
    
    // Store the improved code and results
    const { data, error } = await supabase
      .from('agent_code_versions')
      .insert({
        agent_id: agentId,
        code: result.improvedCode,
        improvements: result.improvements,
        suggested_tests: result.suggestedTests,
        version: new Date().toISOString(),
        created_by: 'feedback_loop'
      });
      
    if (error) {
      console.error('Error storing improved code:', error);
    }
    
    return result;
  }
}

// Export singleton instance
export const agentFeedbackLoop = new AgentFeedbackLoop();
