/**
 * Prompt Memory Integration
 * Connects prompts with the hierarchical memory system
 */

import { supabase } from '@/integrations/supabase/client';
import { MemoryIntegrationService, UserActivationContext, UserSessionContext } from './memory-integration-service.ts';
import { MemoryType, MemorySourceType, MemoryContext } from './types.ts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Prompt execution context
 */
export interface PromptExecutionContext {
  executionId: string;
  promptId: string;
  userId: string;
  tenantId: string;
  sessionId: string;
  conversationId?: string;
  queryText: string;
  intent?: string;
  metadata?: Record<string, any>;
}

/**
 * Prompt Memory Integration Service
 * Connects prompt execution to hierarchical memory system
 */
export class PromptMemoryIntegration {
  private memoryService: MemoryIntegrationService;
  
  constructor(memoryService?: MemoryIntegrationService) {
    this.memoryService = memoryService || new MemoryIntegrationService();
  }
  
  /**
   * Initializes prompt execution memory
   * @param context Prompt execution context
   * @returns The activation ID
   */
  async initializePromptExecution(
    context: PromptExecutionContext
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
      activationType: 'prompt',
      sourceType: 'user',
      timestamp: new Date(),
      metadata: {
        prompt_id: context.promptId,
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
    const similarExecutions = await this.findSimilarPromptExecutions(
      context.promptId,
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
        const topicName = `Prompt Topic: ${keywords.slice(0, 3).join(', ')}`;
        
        // Create topic
        const topicId = await this.memoryService.createOrUpdateTopic(
          context.sessionId,
          {
            name: topicName,
            description: `Prompt topic related to ${context.queryText}`,
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
   * Stores prompt variables in working memory
   * @param executionId Prompt execution ID
   * @param variables Prompt variables
   * @param context Memory context
   * @returns Success status
   */
  async storePromptVariables(
    executionId: string,
    variables: Record<string, any>,
    context: MemoryContext
  ): Promise<boolean> {
    try {
      // Get current execution from working memory
      const { data: execution } = await supabase
        .from('memory_entries')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .eq('memory_type', MemoryType.WORKING)
        .eq('source_type', MemorySourceType.PROMPT_ACTIVATION)
        .eq('source_id', executionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!execution) {
        return false;
      }
      
      // Update execution content
      const updatedContent = {
        ...execution.content,
        variables
      };
      
      // Update working memory
      const { error } = await supabase
        .from('memory_entries')
        .update({ content: updatedContent })
        .eq('id', execution.id)
        .eq('tenant_id', context.tenantId);
        
      return !error;
    } catch (error) {
      console.error('Error storing prompt variables:', error);
      return false;
    }
  }
  
  /**
   * Completes prompt execution and promotes to short-term memory
   * @param executionId Prompt execution ID
   * @param result Execution result
   * @param context Memory context
   * @returns Success status
   */
  async completePromptExecution(
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
        .eq('source_type', MemorySourceType.PROMPT_ACTIVATION)
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
      
      // If this execution contains valuable patterns, store in long-term memory
      await this.considerLongTermPatterns(
        executionId,
        execution.content,
        result,
        context
      );
      
      return true;
    } catch (error) {
      console.error('Error completing prompt execution:', error);
      return false;
    }
  }
  
  /**
   * Retrieves contextually relevant prompt memories
   * @param promptId Prompt ID
   * @param query User query
   * @param context Memory context
   * @returns Relevant memories
   */
  async retrievePromptMemories(
    promptId: string,
    query: string,
    context: MemoryContext
  ): Promise<{
    recentActivations: any[],
    relatedPatterns: any[],
    variables: Record<string, any>
  }> {
    // Get recent activations from short-term memory
    const { data: recentActivations } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('memory_type', MemoryType.SHORT_TERM)
      .eq('source_type', MemorySourceType.PROMPT_ACTIVATION)
      .eq('metadata->>prompt_id', promptId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get related patterns from long-term memory
    const { data: relatedPatterns } = await supabase.rpc(
      'match_memories_by_embedding',
      {
        p_tenant_id: context.tenantId,
        p_query_text: query,
        p_memory_type: MemoryType.LONG_TERM,
        p_source_type: MemorySourceType.SYSTEM_LEARNING,
        p_filter: JSON.stringify({ prompt_id: promptId }),
        p_match_threshold: 0.7,
        p_match_count: 5
      }
    );
    
    // Extract variables from recent activations
    const variables: Record<string, any> = {};
    
    // Combine variables from recent activations (most recent ones override older ones)
    if (recentActivations && recentActivations.length > 0) {
      for (const activation of recentActivations) {
        if (activation.content && activation.content.variables) {
          Object.assign(variables, activation.content.variables);
        }
      }
    }
    
    return {
      recentActivations: recentActivations || [],
      relatedPatterns: relatedPatterns || [],
      variables
    };
  }
  
  /**
   * Stores prompt enhancement in long-term memory
   * @param promptId ID of the prompt
   * @param enhancement Enhancement details
   * @param context Memory context
   * @returns Enhancement ID
   */
  async storePromptEnhancement(
    promptId: string,
    enhancement: {
      type: 'content' | 'variable' | 'instruction',
      originalValue: any,
      enhancedValue: any,
      rationale: string,
      source: string
    },
    context: MemoryContext
  ): Promise<string> {
    try {
      // Generate unique ID for this enhancement
      const enhancementId = `enhance_${uuidv4()}`;
      
      // Create memory entry
      const { data, error } = await supabase
        .from('memory_entries')
        .insert({
          tenant_id: context.tenantId,
          user_id: context.userId,
          memory_type: MemoryType.LONG_TERM,
          source_type: MemorySourceType.SYSTEM_LEARNING,
          source_id: promptId,
          content: {
            ...enhancement,
            enhancement_id: enhancementId,
            created_at: new Date()
          },
          metadata: {
            prompt_enhancement: true,
            enhancement_type: enhancement.type,
            source: enhancement.source
          },
          importance: 0.85,
          created_by: context.userId
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to store enhancement: ${error.message}`);
      }
      
      return enhancementId;
    } catch (error) {
      console.error('Error storing prompt enhancement:', error);
      throw error;
    }
  }
  
  /**
   * Considers patterns for long-term memory storage
   * @param executionId Execution ID
   * @param executionData Execution data
   * @param result Execution result
   * @param context Memory context
   * @returns Success status
   */
  private async considerLongTermPatterns(
    executionId: string,
    executionData: any,
    result: any,
    context: MemoryContext
  ): Promise<boolean> {
    // Skip if not valuable
    if (!this.isValuableForLongTerm(executionData, result)) {
      return false;
    }
    
    try {
      // Extract pattern
      const pattern = {
        prompt_id: executionData.prompt_id,
        query_pattern: this.generalizeQuery(executionData.query_text),
        variables: this.generalizeVariables(executionData.variables),
        result_pattern: this.extractResultPattern(result),
        examples: [{
          query: executionData.query_text,
          variables: executionData.variables,
          result: result
        }]
      };
      
      // Store pattern
      await supabase
        .from('memory_entries')
        .insert({
          tenant_id: context.tenantId,
          user_id: context.userId,
          memory_type: MemoryType.LONG_TERM,
          source_type: MemorySourceType.SYSTEM_LEARNING,
          source_id: `pattern_${uuidv4()}`,
          content: pattern,
          metadata: {
            pattern_type: 'prompt_usage',
            prompt_id: executionData.prompt_id,
            created_from: executionId
          },
          importance: 0.7,
          created_by: context.userId
        });
      
      return true;
    } catch (error) {
      console.error('Error storing pattern in long-term memory:', error);
      return false;
    }
  }
  
  /**
   * Finds similar prompt executions
   * @param promptId Prompt ID
   * @param query User query
   * @param context Memory context
   * @returns Array of similar executions
   */
  private async findSimilarPromptExecutions(
    promptId: string,
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
          p_filter: JSON.stringify({ prompt_id: promptId }),
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
   * Determines if execution data is valuable for long-term memory
   * @param executionData Execution data
   * @param result Execution result
   * @returns True if valuable
   */
  private isValuableForLongTerm(executionData: any, result: any): boolean {
    // Skip if missing core data
    if (!executionData || !result) {
      return false;
    }
    
    // Check for variables - more variables means more valuable pattern
    if (executionData.variables && Object.keys(executionData.variables).length > 2) {
      return true;
    }
    
    // Check for complex result
    if (typeof result === 'object' && Object.keys(result).length > 3) {
      return true;
    }
    
    // Check for long text result (likely significant)
    if (typeof result === 'string' && result.length > 200) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Generalizes a query to extract patterns
   * @param query User query
   * @returns Generalized query pattern
   */
  private generalizeQuery(query: string): string {
    if (!query) return '';
    
    // Simple pattern extraction - replace specific values with placeholders
    return query
      .replace(/\b\d+\b/g, '{NUMBER}')
      .replace(/\b[A-Z][a-z]{2,}\b/g, '{NAME}')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '{EMAIL}')
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '{DATE}');
  }
  
  /**
   * Generalizes variables to extract patterns
   * @param variables Variables
   * @returns Generalized variable pattern
   */
  private generalizeVariables(variables: Record<string, any>): Record<string, string> {
    if (!variables) return {};
    
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string') {
        result[key] = '{STRING}';
      } else if (typeof value === 'number') {
        result[key] = '{NUMBER}';
      } else if (typeof value === 'boolean') {
        result[key] = '{BOOLEAN}';
      } else if (Array.isArray(value)) {
        result[key] = '{ARRAY}';
      } else if (typeof value === 'object') {
        result[key] = '{OBJECT}';
      }
    }
    
    return result;
  }
  
  /**
   * Extracts result pattern
   * @param result Execution result
   * @returns Result pattern
   */
  private extractResultPattern(result: any): any {
    if (!result) return null;
    
    if (typeof result === 'string') {
      // For string results, extract length category
      const length = result.length;
      if (length < 50) return '{SHORT_TEXT}';
      if (length < 500) return '{MEDIUM_TEXT}';
      return '{LONG_TEXT}';
    }
    
    if (typeof result === 'object') {
      // For objects, extract structure
      if (Array.isArray(result)) {
        return '{ARRAY}';
      }
      
      const pattern: Record<string, string> = {};
      for (const key of Object.keys(result)) {
        pattern[key] = typeof result[key];
      }
      return pattern;
    }
    
    return typeof result;
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
