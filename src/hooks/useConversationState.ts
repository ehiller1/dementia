/**
 * Conversation State Tracker
 * 
 * Maintains conversation context to enable action continuity
 * Tracks recommendations, pending actions, and continuation state
 */

import { useState, useCallback } from 'react';

export interface ConversationState {
  lastRecommendations: string[];
  lastActions: string[];
  lastQuery: string;
  canContinue: boolean;
  activeWorkflow: string | null;
  pendingActions: PendingAction[];
  lastExecutiveSummary: string;
  conversationHistory: ConversationTurn[];
}

export interface PendingAction {
  id: string;
  description: string;
  source: 'recommendation' | 'decision' | 'manual';
  status: 'pending' | 'approved' | 'executing' | 'completed';
  createdAt: string;
}

export interface ConversationTurn {
  query: string;
  intent: string;
  response: any;
  timestamp: string;
}

const INITIAL_STATE: ConversationState = {
  lastRecommendations: [],
  lastActions: [],
  lastQuery: '',
  canContinue: false,
  activeWorkflow: null,
  pendingActions: [],
  lastExecutiveSummary: '',
  conversationHistory: []
};

export function useConversationState(conversationId: string) {
  const [state, setState] = useState<ConversationState>(INITIAL_STATE);

  /**
   * Update state after executive response
   */
  const updateAfterExecutiveResponse = useCallback((execMessages: any[]) => {
    console.log('📝 [ConversationState] Updating after executive response');
    
    // Extract recommendations
    const recommendationMsg = execMessages.find(m => m.type === 'recommendations');
    const actionsMsg = execMessages.find(m => m.type === 'actions');
    const summaryMsg = execMessages.find(m => m.type === 'summary');
    
    const recommendations = recommendationMsg?.content 
      ? extractListItems(recommendationMsg.content)
      : [];
      
    const actions = actionsMsg?.content
      ? extractListItems(actionsMsg.content)
      : [];

    setState(prev => ({
      ...prev,
      lastRecommendations: recommendations,
      lastActions: actions,
      lastExecutiveSummary: summaryMsg?.content || '',
      canContinue: recommendations.length > 0 || actions.length > 0,
      pendingActions: actions.map((action, idx) => ({
        id: `action_${Date.now()}_${idx}`,
        description: action,
        source: 'recommendation' as const,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      }))
    }));

    console.log('✅ [ConversationState] State updated:', {
      recommendations: recommendations.length,
      actions: actions.length,
      canContinue: true
    });
  }, []);

  /**
   * Update state after action execution
   */
  const updateAfterActionExecution = useCallback(() => {
    console.log('📝 [ConversationState] Clearing continuation state after action');
    
    setState(prev => ({
      ...prev,
      canContinue: false,
      activeWorkflow: null,
      pendingActions: prev.pendingActions.map(a => ({
        ...a,
        status: 'completed' as const
      }))
    }));
  }, []);

  /**
   * Set active workflow
   */
  const setActiveWorkflow = useCallback((workflowName: string | null) => {
    setState(prev => ({
      ...prev,
      activeWorkflow: workflowName
    }));
  }, []);

  /**
   * Add to conversation history
   */
  const addToHistory = useCallback((turn: Omit<ConversationTurn, 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      lastQuery: turn.query,
      conversationHistory: [
        ...prev.conversationHistory,
        { ...turn, timestamp: new Date().toISOString() }
      ].slice(-10)  // Keep last 10 turns
    }));
  }, []);

  /**
   * Check if context is available for action
   */
  const hasContextFor = useCallback((contextKeys: string[]): boolean => {
    return contextKeys.every(key => {
      switch (key) {
        case 'lastRecommendations':
          return state.lastRecommendations.length > 0;
        case 'pendingActions':
          return state.pendingActions.length > 0;
        case 'activeWorkflow':
          return state.activeWorkflow !== null;
        case 'lastQuery':
          return state.lastQuery !== '';
        default:
          return false;
      }
    });
  }, [state]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    updateAfterExecutiveResponse,
    updateAfterActionExecution,
    setActiveWorkflow,
    addToHistory,
    hasContextFor,
    reset
  };
}

/**
 * Helper: Extract list items from text
 */
function extractListItems(text: string | string[] | any): string[] {
  // If input is already an array, return it directly
  if (Array.isArray(text)) {
    return text.filter(item => typeof item === 'string' && item.length > 0);
  }

  // Handle non-string input
  if (typeof text !== 'string') {
    console.warn('[extractListItems] Received non-string input:', typeof text);
    return [];
  }

  // Match numbered lists (1., 2., 3.) or bullet points (-, *, •)
  const patterns = [
    /^\d+\.\s+(.+)$/gm,  // Numbered: "1. Item"
    /^[-*•]\s+(.+)$/gm,  // Bullets: "- Item"
    /^[A-Z][^.]+\.$/gm   // Sentences ending with period
  ];

  for (const pattern of patterns) {
    try {
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length > 0) {
        return matches.map(m => m[1] || m[0]).filter(Boolean);
      }
    } catch (e) {
      console.warn('[extractListItems] Pattern matching error:', e);
    }
  }

  // Fallback: Split by newlines and filter
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 10 && !line.startsWith('Based on'));
}
