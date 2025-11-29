import { useEffect, useRef, useState, useCallback } from 'react';
import { SSE_CONFIG } from '@/presentation/config';

export interface StreamEvent<T = any> {
  type: string;
  data: T;
  receivedAt: number;
}

export function useEventStream(url: string = '/api/events/stream') {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queuedEventsRef = useRef<StreamEvent[]>([]);

  const calculateBackoff = useCallback((attempt: number) => {
    const delay = Math.min(
      SSE_CONFIG.INITIAL_RETRY_DELAY * Math.pow(SSE_CONFIG.BACKOFF_MULTIPLIER, attempt),
      SSE_CONFIG.MAX_RETRY_DELAY
    );
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }, []);

  const connect = useCallback(() => {
    // DISABLED: SSE connections removed for frontend-only build
    console.log(`[SSE] SSE disabled - frontend-only mode (would connect to ${url})`);
    setConnected(false);
    
    return () => {
      // No cleanup needed - SSE disabled
    };
  }, [url]);

  useEffect(() => {
    const cleanup = connect();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setConnected(false);
      cleanup?.();
    };
  }, [connect]);

  return { events, connected, retryCount };
}
