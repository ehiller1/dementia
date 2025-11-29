/**
 * Simple Conversation Hook
 * 
 * React hook for the simplified Intent → Slots conversation flow.
 * Replaces complex orchestration with a clean, predictable API.
 */

import { useState, useCallback } from 'react';
import type { IntentSlots } from '../intent/fillSlots';

export interface SimpleMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: string;
    title?: string;
    badges?: Array<{ label: string; variant: string }>;
  };
}

export interface SimpleConversationState {
  messages: SimpleMessage[];
  isProcessing: boolean;
  error: string | null;
  currentSlots: IntentSlots | null;
  confidence: number;
}

export interface UseSimpleConversationReturn {
  messages: SimpleMessage[];
  isProcessing: boolean;
  error: string | null;
  currentSlots: IntentSlots | null;
  confidence: number;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

/**
 * Hook for simplified conversation management
 */
export function useSimpleConversation(
  conversationId: string = 'default',
  apiBaseUrl: string = '/api'
): UseSimpleConversationReturn {
  const [state, setState] = useState<SimpleConversationState>({
    messages: [],
    isProcessing: false,
    error: null,
    currentSlots: null,
    confidence: 0
  });

  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  /**
   * Send a message and process the response
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      return;
    }

    setLastUserMessage(content);
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null
    }));

    // Add user message immediately
    const userMessage: SimpleMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    try {
      // Call the simplified conversation API
      const response = await fetch(`${apiBaseUrl}/simple-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          conversationId,
          userId: 'user_123' // TODO: Get from auth context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process message');
      }

      const data = await response.json();
      const { response: conversationResponse } = data;

      // Convert structured messages to simple messages
      const assistantMessages: SimpleMessage[] = conversationResponse.messages.map((msg: any) => ({
        id: msg.id,
        role: 'assistant' as const,
        content: Array.isArray(msg.content) ? msg.content.join('\n') : msg.content,
        timestamp: new Date(),
        metadata: {
          type: msg.type,
          title: msg.title,
          badges: msg.badges
        }
      }));

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, ...assistantMessages],
        isProcessing: false,
        currentSlots: conversationResponse.slots,
        confidence: conversationResponse.metadata.confidence
      }));

    } catch (error: any) {
      console.error('[useSimpleConversation] Error:', error);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'An error occurred while processing your message'
      }));

      // Add error message to conversation
      const errorMessage: SimpleMessage = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `Error: ${error.message || 'Failed to process message'}`,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    }
  }, [conversationId, apiBaseUrl]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      isProcessing: false,
      error: null,
      currentSlots: null,
      confidence: 0
    });
    setLastUserMessage('');
  }, []);

  /**
   * Retry the last user message
   */
  const retryLastMessage = useCallback(async () => {
    if (lastUserMessage) {
      // Remove the last error message if present
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => !m.id.startsWith('error_'))
      }));
      
      await sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, sendMessage]);

  return {
    messages: state.messages,
    isProcessing: state.isProcessing,
    error: state.error,
    currentSlots: state.currentSlots,
    confidence: state.confidence,
    sendMessage,
    clearMessages,
    retryLastMessage
  };
}
