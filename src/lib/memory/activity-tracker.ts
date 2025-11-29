import { supabase } from '@/integrations/supabase/client';

// Minimal types matching Memory Fabric schema
export type MemoryRetention = 'working' | 'short_term' | 'long_term' | 'event';

export interface MemoryCardInput {
  tenant_id?: string | null;
  user_id?: string | null;
  conversation_id?: string | null;
  type: string; // e.g., 'event', 'agent', 'template', 'knowledge'
  title: string;
  content?: string | null;
  tags?: string[] | null;
  importance?: number | null;
  retention?: MemoryRetention | null;
  sources?: any | null;
  cross_functional?: boolean | null;
  metadata?: Record<string, any> | null;
}

export interface MemoryLinkInput {
  tenant_id?: string | null;
  user_id?: string | null;
  conversation_id?: string | null;
  source_id: string;
  target_id: string;
  relation: string; // e.g., 'caused_by', 'references', 'part_of'
  weight?: number | null;
  tags?: string[] | null;
  metadata?: Record<string, any> | null;
}

export interface SessionScope {
  tenantId?: string | null;
  userId?: string | null;
  conversationId?: string | null;
}

export interface ActivityScope {
  tenantId?: string | null;
  userId?: string | null;
  conversationId?: string | null;
}

// Heuristic mapping from event type -> retention tier
function retentionForEvent(type: string): MemoryRetention {
  const t = (type || '').toLowerCase();
  if (t.includes('connected') || t.includes('agent.status') || t.includes('action.created')) return 'working';
  if (t.includes('intent.classified') || t.includes('action.status') || t.includes('decision.created')) return 'short_term';
  if (t.includes('decision.accepted') || t.includes('orchestration.complete')) return 'long_term';
  return 'event';
}

export async function insertMemoryCard(card: MemoryCardInput) {
  try {
    // Generate valid UUIDs for tenant_id and user_id if not provided
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Ensure tenant_id and user_id are valid UUIDs
    const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
    const validTenantId = card.tenant_id && isValidUUID(card.tenant_id)
      ? card.tenant_id 
      : generateUUID();
    const validUserId = card.user_id && isValidUUID(card.user_id)
      ? card.user_id 
      : generateUUID();

    const { data, error } = await supabase
      .from('memory_cards')
      .insert({
        ...card,
        tenant_id: validTenantId,
        user_id: validUserId
      })
      .select('id')
      .single();
    
    if (error) {
      console.warn('Memory card insertion failed:', error.message);
      return 'temp_id_' + Date.now();
    }
    
    return data.id;
  } catch (err) {
    console.error('Memory card insertion error:', err);
    return 'temp_id_' + Date.now();
  }
}

async function insertMemoryLink(link: MemoryLinkInput) {
  try {
    const { error } = await supabase.from('memory_links').insert(link);
    if (error) {
      console.warn('Memory link insertion failed (table may not exist):', error.message);
      return;
    }
  } catch (error) {
    console.warn('Memory link insertion failed:', error);
  }
}

export async function getMemoryCards(
  tenantId: string,
  options: {
    limit?: number;
    offset?: number;
    types?: string[];
    tags?: string[];
    userId?: string;
    conversationId?: string;
  } = {}
) {
  try {
    let query = supabase
      .from('memory_cards')
      .select('*')
      .eq('tenant_id', tenantId);

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.conversationId) {
      query = query.eq('conversation_id', options.conversationId);
    }

    if (options.types && options.types.length > 0) {
      query = query.in('type', options.types);
    }

    if (options.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.warn('Memory cards retrieval failed:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Memory cards retrieval error:', err);
    return [];
  }
}

export async function recordEventCard(
  scope: ActivityScope,
  card: Omit<MemoryCardInput, 'tenant_id' | 'user_id' | 'conversation_id'>
): Promise<string> {
  // Generate valid UUID for conversation_id if it's not a UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const validConversationId = scope.conversationId && 
    scope.conversationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    ? scope.conversationId 
    : generateUUID();

  const cardId = await insertMemoryCard({
    ...card,
    tenant_id: scope.tenantId,
    user_id: scope.userId,
    conversation_id: validConversationId
  });

  // Note: links property removed from MemoryCardInput interface
  // Memory links are now handled separately through insertMemoryLink function

  return cardId;
}

// Enhanced template execution tracking with theme extraction
export async function recordTemplateExecution(
  scope: SessionScope,
  templateId: string,
  executionContext: Record<string, any>,
  executionResult: any
) {
  console.log(`🎯 Recording template execution with theme extraction: ${templateId}`);

  try {
    // Import theme extraction service
    const { ThemeExtractionService } = await import('./theme-extraction-service');
    const themeService = new ThemeExtractionService();

    // Extract themes from the execution
    const templateTheme = await themeService.extractTemplateThemes(
      templateId,
      {
        ...executionContext,
        executionResult,
        userIntent: executionContext.intent,
        agentResults: executionContext.agentActivations,
        decisions: executionContext.decisionPoints,
        metrics: executionContext.businessMetrics
      },
      scope.conversationId || 'default'
    );

    // Find connections to institutional memory
    const connections = await themeService.findInstitutionalConnections(templateTheme);
    
    // Create memory links
    if (connections.length > 0) {
      await themeService.createInstitutionalMemoryLinks(connections);
      console.log(`🔗 Created ${connections.length} institutional memory connections`);
    }

    // Record the template execution as a memory card
    const cardId = await insertMemoryCard({
      tenant_id: scope.tenantId ?? null,
      user_id: scope.userId ?? null,
      conversation_id: scope.conversationId ?? null,
      type: 'template_execution',
      title: `Template Execution: ${templateId}`,
      content: JSON.stringify({
        templateId,
        executionContext,
        executionResult,
        extractedThemes: templateTheme.themes,
        businessEntities: templateTheme.entities,
        solutionPattern: templateTheme.solutionPattern,
        institutionalConnections: connections.length
      }),
      tags: [
        'template_execution',
        templateId,
        ...templateTheme.themes,
        ...templateTheme.entities,
        templateTheme.solutionPattern
      ],
      importance: templateTheme.confidence,
      retention: 'short_term', // Promote to long-term based on usage patterns
      sources: [templateId],
      cross_functional: {
        theme_extraction: templateTheme,
        institutional_connections: connections.map(c => ({
          type: c.connectionType,
          similarity: c.similarity,
          target: c.historicalMemoryId
        }))
      }
    });

    return {
      cardId,
      themeId: templateTheme.id,
      connectionsCount: connections.length,
      extractedThemes: templateTheme.themes,
      institutionalBridges: connections
    };

  } catch (error) {
    console.error('Enhanced template execution recording failed:', error);
    
    // Fallback to basic recording
    return await recordEventCard(scope, {
      type: 'template_execution',
      title: `Template Execution: ${templateId}`,
      content: JSON.stringify({ templateId, executionContext, executionResult }),
      tags: ['template_execution', templateId],
      importance: 0.5,
      retention: 'short_term'
    });
  }
}

// React-friendly tracker hook

export function useActivityTracker(sessionScope?: SessionScope) {
  const trackSSEEvent = async (evt: { type: string; data: any }, overrideScope?: SessionScope) => {
    const s = overrideScope || sessionScope || {};

    const { type, data } = evt;
    const title = `SSE: ${type}`;

    // tag mapping and metadata capture
    const tags = [type, 'sse', 'runtime'];

    try {
      const retention = retentionForEvent(type);
      // Console visibility for devs
      // eslint-disable-next-line no-console
      console.debug('[MemoryActivity] Record SSE', { type, retention, data });
      await recordEventCard(
        { tenantId: s.tenantId ?? null, userId: s.userId ?? null, conversationId: s.conversationId ?? null },
        {
          type: 'event',
          title,
          content: typeof data === 'string' ? data : JSON.stringify(data),
          tags,
          importance: 0.3,
          retention,
        }
      );
    } catch (error) {
      console.warn('Failed to record SSE event:', error);
    }
  };

  const trackTemplateExecution = async (templateId: string, context: any, result: any, overrideScope?: SessionScope) => {
    const s = overrideScope || sessionScope || {};
    await recordTemplateExecution(
      { tenantId: s.tenantId ?? null, userId: s.userId ?? null, conversationId: s.conversationId ?? null },
      templateId,
      context,
      result
    );
  };

  return { trackSSEEvent, trackTemplateExecution };
}
