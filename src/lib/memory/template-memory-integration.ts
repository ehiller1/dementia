/**
 * Template Memory Integration
 * Connects templates with the hierarchical memory system
 */

import { supabase } from '../../integrations/supabase/client.ts';
import { MemoryIntegrationService, UserActivationContext, UserSessionContext } from './memory-integration-service.ts';
import { MemoryType, MemorySourceType, MemoryContext } from './types.ts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Template execution context
 */
export interface TemplateExecutionContext {
  executionId: string;
  templateId: string;
  userId: string;
  tenantId: string;
  sessionId: string;
  conversationId?: string;
  queryText: string;
  intent?: string;
  metadata?: Record<string, any>;
}

/**
 * Template Memory Integration Service
 * Connects template execution to hierarchical memory system
 */
export class TemplateMemoryIntegration {
  private memoryService: MemoryIntegrationService;
  
  constructor(memoryService?: MemoryIntegrationService) {
    this.memoryService = memoryService || new MemoryIntegrationService();
  }
  
  /**
   * Initializes template execution memory
   * @param context Template execution context
   * @returns The activation ID
   */
  async initializeTemplateExecution(
    context: TemplateExecutionContext
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
      activationType: 'template',
      sourceType: 'user',
      timestamp: new Date(),
      metadata: {
        template_id: context.templateId,
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
      context.templateId,
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
        const topicName = `Topic: ${keywords.slice(0, 3).join(', ')}`;
        
        // Create topic
        const topicId = await this.memoryService.createOrUpdateTopic(
          context.sessionId,
          {
            name: topicName,
            description: `Topic related to ${context.queryText}`,
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
   * Tracks template execution step
   * @param executionId Template execution ID
   * @param step Step number
   * @param stepData Step execution data
   * @param context Memory context
   * @returns Success status
   */
  async trackExecutionStep(
    executionId: string,
    step: number,
    stepData: any,
    context: MemoryContext
  ): Promise<boolean> {
    try {
      // Get current execution from working memory
      const { data: execution } = await supabase
        .from('memory_entries')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .eq('memory_type', MemoryType.WORKING)
        .eq('source_type', MemorySourceType.TEMPLATE_EXECUTION)
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
        current_step: step,
        steps: {
          ...(execution.content.steps || {}),
          [step]: {
            data: stepData,
            timestamp: new Date()
          }
        }
      };
      
      // Update working memory
      const { error } = await supabase
        .from('memory_entries')
        .update({ content: updatedContent })
        .eq('id', execution.id)
        .eq('tenant_id', context.tenantId);
        
      return !error;
    } catch (error) {
      console.error('Error tracking execution step:', error);
      return false;
    }
  }
  
  /**
   * Completes template execution and promotes to short-term memory
   * @param executionId Template execution ID
   * @param result Execution result
   * @param context Memory context
   * @returns Success status
   */
  async completeTemplateExecution(
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
        .eq('source_type', MemorySourceType.TEMPLATE_EXECUTION)
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
      
      return true;
    } catch (error) {
      console.error('Error completing template execution:', error);
      return false;
    }
  }
  
  /**
   * Stores template adaptation in long-term memory
   * @param templateId ID of the template
   * @param adaptation Adaptation details
   * @param context Memory context
   * @returns Adaptation ID
   */
  async storeTemplateAdaptation(
    templateId: string,
    adaptation: {
      type: 'schema' | 'task' | 'prompt' | 'flow',
      originalValue: any,
      adaptedValue: any,
      rationale: string,
      source: string
    },
    context: MemoryContext
  ): Promise<string> {
    try {
      // Generate unique ID for this adaptation
      const adaptationId = `adapt_${uuidv4()}`;
      
      // Create memory entry
      const { data, error } = await supabase
        .from('memory_entries')
        .insert({
          tenant_id: context.tenantId,
          memory_type: MemoryType.LONG_TERM,
          source_type: MemorySourceType.TEMPLATE_ADAPTATION,
          source_id: templateId,
          content: {
            ...adaptation,
            adaptation_id: adaptationId,
            created_at: new Date()
          },
          metadata: {
            template_adaptation: true,
            adaptation_type: adaptation.type,
            source: adaptation.source
          },
          importance: 0.9,
          created_by: context.userId
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to store adaptation: ${error.message}`);
      }
      
      return adaptationId;
    } catch (error) {
      console.error('Error storing template adaptation:', error);
      throw error;
    }
  }
  
  /**
   * Retrieves contextually relevant knowledge for template enhancement
   * @param templateId Template ID
   * @param query Enhancement query or context
   * @param context Memory context
   * @returns Knowledge base for template enhancement
   */
  async retrieveKnowledgeForEnhancement(
    templateId: string,
    query: string,
    context: MemoryContext
  ): Promise<{
    adaptations: any[],
    similarTemplates: any[],
    businessRules: any[],
    userFeedback: any[]
  }> {
    // First, check if this template has any previous adaptations
    const { data: adaptations } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('memory_type', MemoryType.LONG_TERM)
      .eq('source_type', MemorySourceType.TEMPLATE_ADAPTATION)
      .eq('source_id', templateId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Find similar templates based on embeddings
    const { data: templateDetails } = await supabase
      .from('decision_templates')
      .select('name, description, industry, schema')
      .eq('id', templateId)
      .single();
    
    let similarTemplates = [];
    if (templateDetails) {
      const templateQuery = `${templateDetails.name} ${templateDetails.description || ''} ${templateDetails.industry || ''}`;
      
      const { data: similarTemps } = await supabase.rpc(
        'match_templates_by_embedding',
        {
          p_query_text: templateQuery,
          p_match_threshold: 0.7,
          p_match_count: 5
        }
      );
      
      similarTemplates = similarTemps || [];
    }
    
    // Get business rules
    const { data: businessRules } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('memory_type', MemoryType.LONG_TERM)
      .eq('source_type', MemorySourceType.SYSTEM_LEARNING)
      .eq('metadata->>business_rule', 'true')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get user feedback
    const { data: userFeedback } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .eq('memory_type', MemoryType.LONG_TERM)
      .eq('source_type', MemorySourceType.USER_FEEDBACK)
      .eq('source_id', templateId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return {
      adaptations: adaptations || [],
      similarTemplates: similarTemplates || [],
      businessRules: businessRules || [],
      userFeedback: userFeedback || []
    };
  }
  
  /**
   * Finds similar template executions
   * @param templateId Template ID
   * @param query User query
   * @param context Memory context
   * @returns Array of similar executions
   */
  private async findSimilarExecutions(
    templateId: string,
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
          p_filter: JSON.stringify({ template_id: templateId }),
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
