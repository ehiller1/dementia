/**
 * Decision Inbox SSE Hook
 * Subscribes to server-sent events for real-time decision updates
 * Replaces polling with event-driven updates from read model
 */

import { useState, useEffect, useCallback } from 'react';

interface DecisionUpdate {
  decision_id: string;
  event_type: string;
  version: number;
  status?: string;
  timestamp: string;
}

interface UseDecisionInboxSSEOptions {
  userId?: string;
  conversationId?: string;
  enabled?: boolean;
}

interface UseDecisionInboxSSEReturn {
  updates: DecisionUpdate[];
  latestUpdate: DecisionUpdate | null;
  isConnected: boolean;
  reconnect: () => void;
  clearUpdates: () => void;
}

export function useDecisionInboxSSE(options: UseDecisionInboxSSEOptions = {}): UseDecisionInboxSSEReturn {
  const { userId, conversationId, enabled = true } = options;
  
  const [updates, setUpdates] = useState<DecisionUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<DecisionUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connect = useCallback(() => {
    // DISABLED: SSE connections removed for frontend-only build
    if (!enabled) return;
    
    console.log('[useDecisionInboxSSE] SSE disabled - frontend-only mode');
    setIsConnected(false);
    setEventSource(null);
    
    return () => {
      // No cleanup needed - SSE disabled
    };
  }, [userId, conversationId, enabled]);

  const handleUpdate = (update: DecisionUpdate) => {
    console.log('[useDecisionInboxSSE] Received update:', update);
    
    setLatestUpdate(update);
    setUpdates(prev => [...prev, update].slice(-50)); // Keep last 50 updates
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('decision:update', { detail: update }));
  };

  const reconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close();
    }
    connect();
  }, [eventSource, connect]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setLatestUpdate(null);
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

  return {
    updates,
    latestUpdate,
    isConnected,
    reconnect,
    clearUpdates
  };
}
