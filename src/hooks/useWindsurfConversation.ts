/**
 * React Hook for Windsurf-Style Conversation
 * 
 * Implements Windsurf's autonomous execution pattern with:
 * - Terse, direct communication
 * - Task state machine visibility
 * - Event-driven agent coordination
 * - Clean completion status
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { WindsurfStyleOrchestrator, WindsurfMessage, ConversationPlan } from '@/services/conversation/WindsurfStyleOrchestrator';

interface UseWindsurfConversationResult {
  messages: WindsurfMessage[];
  plan: ConversationPlan | null;
  isExecuting: boolean;
  startConversation: (query: string) => Promise<void>;
  stop: () => void;
  clearMessages: () => void;
}

export function useWindsurfConversation(conversationId: string): UseWindsurfConversationResult {
  const [messages, setMessages] = useState<WindsurfMessage[]>([]);
  const [plan, setPlan] = useState<ConversationPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const orchestratorRef = useRef<WindsurfStyleOrchestrator | null>(null);

  // Initialize orchestrator
  useEffect(() => {
    const orchestrator = new WindsurfStyleOrchestrator(conversationId);
    
    // Set message callback to stream messages to UI
    orchestrator.setMessageCallback((msg: WindsurfMessage) => {
      setMessages(prev => [...prev, msg]);
      
      // Update plan state when tasks change
      const currentPlan = orchestrator.getPlan();
      if (currentPlan) {
        setPlan({ ...currentPlan }); // Spread to trigger re-render
      }
    });

    orchestratorRef.current = orchestrator;

    // Cleanup on unmount
    return () => {
      orchestrator.cleanup();
    };
  }, [conversationId]);

  /**
   * Start conversation with autonomous execution
   */
  const startConversation = useCallback(async (query: string) => {
    if (!orchestratorRef.current || isExecuting) return;

    setIsExecuting(true);
    
    // Add user message immediately
    const userMessage: WindsurfMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Execute autonomous loop until completion
      await orchestratorRef.current.startConversation(query);
    } catch (error) {
      console.error('[useWindsurfConversation] Error:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        type: 'system',
        content: `**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting]);

  /**
   * Stop autonomous execution
   */
  const stop = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.stop();
      setIsExecuting(false);
    }
  }, []);

  /**
   * Clear conversation messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setPlan(null);
  }, []);

  return {
    messages,
    plan,
    isExecuting,
    startConversation,
    stop,
    clearMessages
  };
}
