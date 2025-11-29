/**
 * Enhanced Process Message with Quality Gates
 * 
 * Integrates runEnhancedTurn with existing processMessage API.
 * Provides backward compatibility while adding quality validation.
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';
import type { ProcessMessageRequest, ProcessMessageResult } from '@/hooks/useMessageProcessor';
import { runEnhancedTurn, createProductionEngine } from '../../orchestrator/turnOrchestratorEnhanced';
import { MemoryIntegrationService } from '../../services/memory-integration/MemoryIntegrationService';
import { CrossFunctionalMemoryCoordination } from '../../services/memory-coordination/CrossFunctionalMemoryCoordination';
import { ContractRegistry } from '../../services/interoperability/ContractRegistry';

/**
 * Process message with enhanced orchestrator and quality gates
 */
export async function processMessageEnhanced(
  request: ProcessMessageRequest
): Promise<ProcessMessageResult> {
  console.log('[processMessageEnhanced] Starting with quality gates');
  
  const conversationId = request.conversationId || uuidv4();
  const sessionId = request.sessionId || uuidv4();
  const userId = request.userId || 'anonymous';
  const tenantId = request.tenantId || 'default';
  
  try {
    // 1. Create production engine with existing services
    const engine = await createProductionEngine({
      tenantId,
      userId,
      conversationId,
      sessionId
    });
    
    // 2. Load previous state from conversation history
    const previousState = await loadPreviousState(conversationId);
    
    // 3. Run enhanced turn with quality gates
    console.log('[processMessageEnhanced] Running enhanced turn...');
    const { turn, validated, quality } = await runEnhancedTurn(
      request.query,
      engine,
      previousState
    );
    
    // 4. Convert to ProcessMessageResult format (backward compatible)
    const result: ProcessMessageResult = {
      success: true,
      conversationId,
      sessionId,
      
      // Core response data
      messages: convertTurnToMessages(turn, validated, quality),
      parsedMessages: convertTurnToMessages(turn, validated, quality),
      
      // Canonical data (for existing UI components)
      canonicalData: {
        roleDetection: turn.state.slots.context?.role || 'Executive',
        templateSnapline: turn.state.template_version || 'Business Analysis',
        executiveSummary: turn.state.working_memory.insights.slice(0, 3),
        whatImSeeing: turn.state.working_memory.observations.slice(0, 3),
        recommendation: turn.state.working_memory.recommendations.slice(0, 3),
        nextActions: turn.state.procedural.tasks.slice(0, 5).map(t => ({
          action: t.description,
          status: t.status,
          deadline: t.deadline,
          owner: t.owner
        })),
        crossFunctionalImpact: validated.crossFunctionalImpact || {},
        agentMarketplaceResults: turn.state.working_memory.agent_results || [],
        timeline: turn.state.procedural.tasks.map(t => ({
          label: t.id,
          date: t.deadline
        })),
        _metadata: {
          averageConfidence: quality.accuracy,
          totalAgents: turn.state.working_memory.agent_results?.length || 0,
          totalPhases: turn.plan.procedural.length + turn.plan.declarative.length,
          stakeholderCount: Object.keys(validated.crossFunctionalImpact || {}).length
        }
      },
      
      // NEW: Quality metrics
      quality: {
        mode: quality.mode,
        completeness: quality.completeness,
        accuracy: quality.accuracy,
        reasons: quality.reasons,
        gates: quality.gates
      },
      
      // NEW: Citations (evidence)
      citations: validated.citations || [],
      
      // NEW: Pending approvals
      pendingApprovals: validated.pendingApprovals || [],
      
      // NEW: Warnings
      warnings: validated.warnings || [],
      
      // Backward compatibility
      conversationalResponse: turn.view?.text || '',
      workflowData: {
        slots: turn.state.slots,
        declarative: turn.state.declarative,
        procedural: turn.state.procedural,
        working_memory: turn.state.working_memory,
        metacognition: turn.state.metacognition
      }
    };
    
    // 5. Save conversation turn to database
    await saveConversationTurn(conversationId, userId, request.query, result);
    
    console.log('[processMessageEnhanced] Complete:', {
      mode: quality.mode,
      completeness: quality.completeness,
      citations: validated.citations?.length || 0,
      approvals: validated.pendingApprovals?.length || 0
    });
    
    return result;
    
  } catch (error) {
    console.error('[processMessageEnhanced] Error:', error);
    
    // Fallback to error response
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      conversationId,
      sessionId,
      messages: [],
      parsedMessages: [],
      canonicalData: null as any
    };
  }
}

/**
 * Convert turn output to message format for UI
 */
function convertTurnToMessages(turn: any, validated: any, quality: any): any[] {
  const messages: any[] = [];
  
  // Message 1: Acknowledgement + Summary
  messages.push({
    id: `msg_${Date.now()}_summary`,
    type: 'summary',
    content: [turn.ack, ...(turn.state.working_memory.insights?.slice(0, 2) || [])],
    meta: {
      roleDetection: turn.state.slots.context?.role || 'Executive',
      templateSnapline: turn.state.template_version || 'Business Analysis',
      badges: [
        { type: 'mode', text: quality.mode === 'confident' ? 'Confident' : 'Explore' },
        { type: 'completeness', text: `${(quality.completeness * 100).toFixed(0)}%` },
        { type: 'accuracy', text: `${(quality.accuracy * 100).toFixed(0)}%` }
      ]
    }
  });
  
  // Message 2: Insights/Observations
  if (turn.state.working_memory.observations?.length > 0) {
    messages.push({
      id: `msg_${Date.now()}_insights`,
      type: 'insights',
      content: turn.state.working_memory.observations.slice(0, 3),
      badges: [
        { type: 'citations', text: `${validated.citations?.length || 0} sources` }
      ]
    });
  }
  
  // Message 3: Recommendations (only in confident mode)
  if (quality.mode === 'confident' && turn.state.working_memory.recommendations?.length > 0) {
    messages.push({
      id: `msg_${Date.now()}_recommendations`,
      type: 'recommendations',
      content: turn.state.working_memory.recommendations.slice(0, 3),
      cta: {
        label: 'Review recommendations',
        action: 'review_recommendations'
      }
    });
  }
  
  // Message 4: Questions (always, but emphasized in explore mode)
  if (turn.ask?.length > 0) {
    messages.push({
      id: `msg_${Date.now()}_questions`,
      type: quality.mode === 'explore' ? 'questions_primary' : 'questions',
      content: turn.ask,
      badges: quality.mode === 'explore' ? [
        { type: 'warning', text: 'More information needed' }
      ] : []
    });
  }
  
  // Message 5: Actions (with approval status)
  if (turn.state.procedural.tasks?.length > 0) {
    messages.push({
      id: `msg_${Date.now()}_actions`,
      type: 'actions',
      checklist: turn.state.procedural.tasks.slice(0, 5).map((t: any) => ({
        action: t.description,
        status: t.status,
        deadline: t.deadline,
        owner: t.owner,
        requires_approval: turn.plan.hitl.includes(t.id)
      }))
    });
  }
  
  // Message 6: Cross-functional Impact
  if (validated.crossFunctionalImpact && Object.keys(validated.crossFunctionalImpact).length > 0) {
    messages.push({
      id: `msg_${Date.now()}_impact`,
      type: 'impact',
      crossFunctionalImpact: validated.crossFunctionalImpact
    });
  }
  
  // Message 7: Provenance (citations + agent results)
  messages.push({
    id: `msg_${Date.now()}_provenance`,
    type: 'provenance',
    agentMarketplaceResults: turn.state.working_memory.agent_results || [],
    citations: validated.citations || [],
    timeline: turn.state.procedural.tasks?.map((t: any) => ({
      label: t.id,
      date: t.deadline
    })) || []
  });
  
  // Message 8: Warnings (if any)
  if (validated.warnings?.length > 0) {
    messages.push({
      id: `msg_${Date.now()}_warnings`,
      type: 'warnings',
      content: validated.warnings,
      badges: [
        { type: 'alert', text: `${validated.warnings.length} warnings` }
      ]
    });
  }
  
  return messages;
}

/**
 * Load previous conversation state
 */
async function loadPreviousState(conversationId: string): Promise<any | undefined> {
  try {
    const { data, error } = await supabase
      .from('conversation_turns')
      .select('state')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return undefined;
    
    return data.state;
  } catch (error) {
    console.warn('[loadPreviousState] Failed to load state:', error);
    return undefined;
  }
}

/**
 * Save conversation turn to database
 */
async function saveConversationTurn(
  conversationId: string,
  userId: string,
  query: string,
  result: ProcessMessageResult
): Promise<void> {
  try {
    await supabase.from('conversation_turns').insert({
      id: uuidv4(),
      conversation_id: conversationId,
      user_id: userId,
      query,
      response: result,
      state: result.workflowData,
      quality_metrics: result.quality,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[saveConversationTurn] Failed to save:', error);
    // Don't throw - saving is optional
  }
}

/**
 * Feature flag: Use enhanced or legacy processor
 */
export function shouldUseEnhancedProcessor(): boolean {
  // Check environment variable
  if (process.env.USE_ENHANCED_PROCESSOR === 'true') return true;
  if (process.env.USE_ENHANCED_PROCESSOR === 'false') return false;
  
  // Default: use enhanced for new conversations, legacy for existing
  return true;
}
