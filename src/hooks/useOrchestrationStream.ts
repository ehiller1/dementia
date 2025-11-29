import { useEffect, useState, useCallback } from 'react';

/**
 * Hook for consuming orchestration SSE stream
 * Provides real-time updates for:
 * - Action status changes (pending → in_progress → completed)
 * - Proactive executive observations
 * - Signal detection events
 * - Agent execution completions
 * - Results synthesis
 */

export interface OrchestrationUpdate {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export interface ActionStatusUpdate {
  type: 'action_status';
  actionId: string;
  previousStatus: string;
  newStatus: string;
  action: any;
  timestamp: string;
}

export const useOrchestrationStream = (options: { 
  apiUrl?: string; 
  enabled?: boolean;
  conversationId?: string;
  userId?: string;
} = {}) => {
  const { 
    apiUrl = '', // Use relative URL to go through Vite proxy
    enabled = true,
    conversationId,
    userId = 'anonymous'
  } = options;
  
  const [updates, setUpdates] = useState<OrchestrationUpdate[]>([]);
  const [actionUpdates, setActionUpdates] = useState<ActionStatusUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setActionUpdates([]);
  }, []);

  useEffect(() => {
    // DISABLED: SSE connections removed for frontend-only build
    if (!enabled) {
      console.log('[useOrchestrationStream] Disabled, not connecting');
      return;
    }

    console.log('[useOrchestrationStream] SSE disabled - frontend-only mode');
    setIsConnected(false);
    setError('SSE connections disabled - frontend-only mode');
    
    // Cleanup on unmount
    return () => {
      console.log('📡 [useOrchestrationStream] Disconnecting...');
      setEventSource(null);
      setIsConnected(false);
    };
  }, [apiUrl, enabled]);

  return {
    // Connection state
    isConnected,
    error,
    eventSource,
    
    // All updates
    updates,
    
    // Action-specific updates (filtered for convenience)
    actionUpdates,
    
    // Latest update
    latestUpdate: updates[updates.length - 1] || null,
    
    // Latest action update
    latestActionUpdate: actionUpdates[actionUpdates.length - 1] || null,
    
    // Utility
    clearUpdates
  };
};
