/**
 * Agent Memory Integration
 * Connects agents with the hierarchical memory system
 */

import { supabase } from '../../integrations/supabase/client.ts';
import { MemoryIntegrationService, UserActivationContext, UserSessionContext } from './memory-integration-service';
import { MemoryType, MemorySourceType, MemoryContext } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
  executionId: string;
  agentId: string;
  userId: string;
  tenantId: string;
  sessionId: string;
  conversationId?: string;
  queryText: string;
  intent?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent Memory Integration Service
 * Connects agent execution to hierarchical memory system
 */
export class AgentMemoryIntegration {
  private memoryService: MemoryIntegrationService;
  
  constructor(memoryService?: MemoryIntegrationService) {
    this.memoryService = memoryService || new MemoryIntegrationService();
  }
  
  /**
   * Initializes agent execution memory
   * @param context Agent execution context
   * @returns The activation ID
   */
  async initializeAgentExecution(
    context: AgentExecutionContext
  ): Promise<string> {
    // Create activation context
    const activationContext: UserActivationContext = {
      userId: context.userId,
      tenantId: context.tenantId,
      sessionId: context.sessionId,
      conversationId: context.conversationId,
      activationId: context.executionId,
      queryText: context.queryText,
      intent: context.intent,
      activationType: 'agent',
      sourceType: 'user',
      timestamp: new Date(),
      metadata: {
        agent_id: context.agentId,
        ...context.metadata
      }
    };
    
    // Store in working memory
    await this.memoryService.storeUserActivation(activationContext);
    
    // Convert to memory context
    const memoryContext: MemoryContext = {
      userId: context.userId,
      tenantId: context.tenantId,
      contextId: context.conversationId || context.sessionId,
      contextType: context.conversationId ? 'conversation' : 'session'
    };
    
    // Look for similar executions in parallel sessions (short-term memory)
    const similarExecutions = await this.findSimilarExecutions(
      context.agentId,
      context.queryText,
      memoryContext
    );
    
    // If we found similar executions, associate them
    if (similarExecutions.length > 0) {
      // Check if there's an active topic
      const sessionContext = await this.memoryService.getOrCreateSession({
        userId: context.userId,
        tenantId: context.tenantId,
        sessionId: context.sessionId
      });
      
      // If no topic exists but we have similar executions, create one
      if (!sessionContext.topicId && similarExecutions.length > 0) {
        // Extract keywords for topic name
        const keywords = this.extractKeywords(context.queryText);
        const topicName = `Agent Topic: ${keywords.slice(0, 3).join(', ')}`;
        
        // Create topic
        const topicId = await this.memoryService.createOrUpdateTopic(
          context.sessionId,
          {
            name: topicName,
            description: `Agent topic related to ${context.queryText}`,
            keywords
          },
          memoryContext
        );
        
        // Link current execution with similar ones
        await this.memoryService.linkTopicActivations(
          topicId,
          [context.executionId, ...similarExecutions.map(e => e.executionId)],
          memoryContext
        );
      }
    }
    
    return context.executionId;
  }
  
  /**
   * Tracks agent execution step
   * @param executionId Agent execution ID
   * @param step Step information
   * @param context Memory context
   * @returns Success status
   */
  async trackExecutionStep(
    executionId: string,
    step: {
      name: string;
      status: 'started' | 'in_progress' | 'completed' | 'failed';
      data?: any;
    },
    context: MemoryContext
  ): Promise<boolean> {
    try {
      // Get current execution from working memory
      const { data: execution } = await supabase
        .from('memory_entries')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .eq('memory_type', MemoryType.WORKING)
        .eq('source_type', MemorySourceType.AGENT_ACTIVATION)
        .eq('source_id', executionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!execution) {
        return false;
      }
      
      // Update execution content
      const steps = execution.content.steps || {};
      const stepId = `step_${Object.keys(steps).length + 1}`;
      
      steps[stepId] = {
        name: step.name,
        status: step.status,
        data: step.data,
        timestamp: new Date()
      };
      
      const updatedContent = {
        ...execution.content,
        current_step: stepId,
        steps
      };
      
      // Update working memory
      const { error } = await supabase
        .from('memory_entries')
        .update({ content: updatedContent })
        .eq('id', execution.id)
        .eq('tenant_id', context.tenantId);
        
      // Store important step results in short-term memory if completed
      if (step.status === 'completed' && step.data) {
        await this.storeStepResult(
          executionId,
          step.name,
          step.data,
          context
        );
      }
      
      return !error;
    } catch (error) {
      console.error('Error tracking execution step:', error);
      return false;
    }
  }
  
  /**
   * Stores an important step result in short-term memory
   * @param executionId Execution ID
   * @param stepName Step name
   * @param result Step result
   * @param context Memory context
   * @returns Memory entry ID
   */
  async storeStepResult(
    executionId: string,
    stepName: string,
    result: any,
    context: MemoryContext
  ): Promise<string> {
    try {
      // Get execution to check for session and topic
      const { data: execution } = await supabase
        .from('memory_entries')
        .select('content')
        .eq('tenant_id', context.tenantId)
        .eq('memory_type', MemoryType.WORKING)
        .eq('source_id', executionId)
        .single();
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }
      
      // Get session
      const sessionId = execution.content.session_id;
      const session = await this.memoryService.getOrCreateSession({
        sessionId,
        userId: context.userId,
        tenantId: context.tenantId
      });
      
      // Determine significance of this result
      const isSignificant = this.isSignificantResult(result);
      
      // If significant, store in short-term memory
      if (isSignificant) {
        const { data: memoryEntry } = await supabase
          .from('memory_entries')
          .insert({
            tenant_id: context.tenantId,
            user_id: context.userId,
            memory_type: MemoryType.SHORT_TERM,
            source_type: MemorySourceType.AGENT_RESULT,
            source_id: executionId,
            content: {
              step_name: stepName,
              result,
              execution_id: executionId,
              session_id: sessionId,
              topic_id: session.topicId,
              stored_at: new Date()
            },
            metadata: {
              step_name: stepName,
              significant_result: true,
              session_id: sessionId,
              topic_id: session.topicId
            }
          })
          .select()
          .single();
          
        return memoryEntry?.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error storing step result:', error);
      return null;
    }
  }
  
  /**
   * Completes agent execution and promotes to short-term memory
   * @param executionId Agent execution ID
   * @param result Execution result
   * @param context Memory context
   * @returns Success status
   */
  async completeAgentExecution(
    executionId: string,
    result: any,
    context: MemoryContext
  ): Promise<boolean> {
    try {
      // Store result in working memory
      await this.memoryService.storeActivationResult(
        executionId,
        result,
        context
      );
      
      // Get session for this execution
      const { data: execution } = await supabase
        .from('memory_entries')
        .select('content')
        .eq('tenant_id', context.tenantId)
        .eq('memory_type', MemoryType.WORKING)
        .eq('source_type', MemorySourceType.AGENT_ACTIVATION)
        .eq('source_id', executionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!execution) {
        return false;
      }
      
      const sessionId = execution.content.session_id;
      
      // Get session to check for topic
      const session = await this.memoryService.getOrCreateSession({
        sessionId,
        userId: context.userId,
        tenantId: context.tenantId
      });
      
      // Promote to short-term memory
      await this.memoryService.promoteToShortTermMemory(
        executionId,
        context,
        sessionId,
        session.topicId
      );
      
      // If this was a significant execution, consider promoting to long-term memory
      if (this.isSignificantExecution(result)) {
        await this.considerLongTermPromotion(
          executionId,
          execution.content,
          result,
          context
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error completing agent execution:', error);
      return false;
    }
  }
  
  /**
   * Considers promoting execution to long-term memory
   * @param executionId Execution ID
   * @param executionData Execution data
   * @param result Execution result
   * @param context Memory context
   * @returns Success status
   */
  private async considerLongTermPromotion(
    executionId: string,
    executionData: any,
    result: any,
    context: MemoryContext
  ): Promise<boolean> {
    try {
      // Determine if this execution should be promoted to long-term memory
      // This could be based on uniqueness, impact, or explicit flagging
      
      const shouldPromote = 
        this.isSignificantExecution(result) || 
        (executionData.metadata?.promote_to_longterm === true);
      
      if (!shouldPromote) {
        return false;
      }
      
      // Generate a knowledge entry for long-term memory
      const knowledgeEntry = {
        agent_id: executionData.agent_id,
        query_text: executionData.query_text,
        intent: executionData.intent,
        execution_summary: {
          steps: executionData.steps,
          result
        },
        insights: this.extractInsights(executionData, result),
        promoted_at: new Date()
      };
      
      // Store in long-term memory
      const { data: memoryEntry } = await supabase
        .from('memory_entries')
        .insert({
          tenant_id: context.tenantId,
          user_id: context.userId,
          memory_type: MemoryType.LONG_TERM,
          source_type: MemorySourceType.AGENT_KNOWLEDGE,
          source_id: executionId,
          content: knowledgeEntry,
          metadata: {
            agent_id: executionData.agent_id,
            intent: executionData.intent,
            promoted_from: 'agent_execution'
          },
          importance: 0.8
        })
        .select()
        .single();
        
      return !!memoryEntry;
    } catch (error) {
      console.error('Error promoting to long-term memory:', error);
      return false;
    }
  }
  
  /**
   * Retrieves contextually relevant agent memories
   * @param agentId Agent ID
   * @param query User query
   * @param context Memory context
   * @returns Relevant memories
   */
  async retrieveAgentMemories(
    agentId: string,
    query: string,
    context: MemoryContext
  ): Promise<{
    recentActivations: any[],
    relatedKnowledge: any[],
    significantResults: any[]
  }> {
    // Get recent activations from short-term memory
    const { data: recentActivations } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('memory_type', MemoryType.SHORT_TERM)
      .eq('source_type', MemorySourceType.AGENT_ACTIVATION)
      .eq('metadata->>agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get related knowledge from long-term memory using vector search
    const { data: relatedKnowledge } = await supabase.rpc(
      'match_memories_by_embedding',
      {
        p_tenant_id: context.tenantId,
        p_query_text: query,
        p_memory_type: MemoryType.LONG_TERM,
        p_source_type: MemorySourceType.AGENT_KNOWLEDGE,
        p_filter: JSON.stringify({ agent_id: agentId }),
        p_match_threshold: 0.7,
        p_match_count: 5
      }
    );
    
    // Get significant results
    const { data: significantResults } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('memory_type', MemoryType.SHORT_TERM)
      .eq('source_type', MemorySourceType.AGENT_RESULT)
      .eq('metadata->>significant_result', 'true')
      .eq('metadata->>agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    return {
      recentActivations: recentActivations || [],
      relatedKnowledge: relatedKnowledge || [],
      significantResults: significantResults || []
    };
  }
  
  /**
   * Finds similar agent executions
   * @param agentId Agent ID
   * @param query User query
   * @param context Memory context
   * @returns Array of similar executions
   */
  private async findSimilarExecutions(
    agentId: string,
    query: string,
    context: MemoryContext
  ): Promise<Array<{executionId: string, similarity: number}>> {
    try {
      const { data } = await supabase.rpc(
        'search_memories',
        {
          p_tenant_id: context.tenantId,
          p_query_text: query,
          p_memory_type: MemoryType.SHORT_TERM,
          p_filter: JSON.stringify({ agent_id: agentId }),
          p_match_threshold: 0.7,
          p_limit: 5
        }
      );
      
      if (!data || data.length === 0) {
        return [];
      }
      
      return data.map(item => ({
        executionId: item.source_id,
        similarity: item.similarity
      }));
    } catch (error) {
      console.error('Error finding similar executions:', error);
      return [];
    }
  }
  
  /**
   * Determines if a result is significant enough to store separately
   * @param result Step result
   * @returns True if significant
   */
  private isSignificantResult(result: any): boolean {
    // Simple heuristic: if it's complex or has explicit significance flag
    if (result === null || result === undefined) {
      return false;
    }
    
    if (result.significant === true) {
      return true;
    }
    
    // If it's an object with multiple properties
    if (typeof result === 'object' && Object.keys(result).length > 3) {
      return true;
    }
    
    // If it's a long string
    if (typeof result === 'string' && result.length > 200) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Determines if an execution is significant enough for long-term memory
   * @param result Execution result
   * @returns True if significant
   */
  private isSignificantExecution(result: any): boolean {
    // If explicitly marked
    if (result?.promote_to_longterm === true) {
      return true;
    }
    
    // If has insights or learnings
    if (result?.insights || result?.learnings) {
      return true;
    }
    
    // If it involved complex processing
    if (result?.processing_steps && result.processing_steps.length > 5) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Extracts insights from execution data and result
   * @param executionData Execution data
   * @param result Execution result
   * @returns Extracted insights
   */
  private extractInsights(executionData: any, result: any): any {
    // Start with explicitly provided insights
    const insights = result?.insights || {};
    
    // Add execution pattern if multiple steps
    if (executionData.steps && Object.keys(executionData.steps).length > 3) {
      insights.execution_pattern = {
        step_sequence: Object.keys(executionData.steps).map(key => 
          executionData.steps[key].name
        ),
        complexity: Object.keys(executionData.steps).length
      };
    }
    
    // Add intent pattern if available
    if (executionData.intent) {
      insights.intent_pattern = {
        intent: executionData.intent,
        query_variation: executionData.query_text
      };
    }
    
    return insights;
  }
  
  /**
   * Extracts keywords from text for topic identification
   * @param text Text to extract keywords from
   * @returns Array of keywords
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - remove stop words and get unique words
    const stopWords = ['a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'of', 'with', 'by', 'as', 'and', 'or', 'but'];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .filter((word, index, self) => self.indexOf(word) === index)
      .slice(0, 10);
  }
}
