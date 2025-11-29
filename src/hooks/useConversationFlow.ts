/**
 * Conversation Flow Orchestrator Hook
 * 
 * OPTION C: Windsurf-Style Orchestrator (Active)
 * - Minimal backward compatibility wrapper
 * - New code should use useWindsurfConversation directly
 */

import { useState, useCallback } from 'react';
import { processMessage } from '@/lib/api/processMessage';

export interface ExecOutputMessage {
  id: string;
  type: 'summary' | 'insights' | 'recommendations' | 'actions' | 'impact' | 'provenance';
  content: string;
  meta?: Record<string, any>;
}

interface ConversationFlowState {
  phase: 'init' | 'complete';
  execMessages: ExecOutputMessage[];
  turnEnvelope?: any;
}

export function useConversationFlow(conversationId: string) {
  const [state, setState] = useState<ConversationFlowState>({
    phase: 'init',
    execMessages: [],
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const startConversationFlow = useCallback(async (query: string) => {
    console.log('🚀 [ConversationFlow] DEPRECATED: Use useWindsurfConversation instead');
    
    setIsProcessing(true);
    
    try {
      const result = await processMessage({
        query,
        conversationId,
        context: 'Windsurf-style orchestration'
      });
      
      const execMessages: ExecOutputMessage[] = (result.parsedMessages || []).map((msg: any) => ({
        id: msg.id || `msg_${Date.now()}`,
        type: msg.type || 'summary',
        content: msg.content || '',
        meta: msg.meta || {}
      }));
      
      setState({ 
        phase: 'complete',
        turnEnvelope: result.turnEnvelope,
        execMessages
      });
      
      return { execMessages, turnEnvelope: result.turnEnvelope, intent: { type: 'windsurf' } };
    } catch (error) {
      console.error('❌ [ConversationFlow] Error:', error);
      setState({ phase: 'complete', execMessages: [] });
      return { execMessages: [], turnEnvelope: null, intent: { type: 'error' } };
    } finally {
      setIsProcessing(false);
    }
  }, [conversationId]);

  return {
    state,
    isProcessing,
    startConversationFlow
  };
}
