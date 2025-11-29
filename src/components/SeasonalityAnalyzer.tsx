import React, { useEffect, useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useConversation } from '../contexts/ConversationContext.js';
import { useRAG } from '@/hooks/useRAG';
import { classifyIntent } from '@/lib/intent-router';

// Define interfaces
interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string | Date;
}

interface SeasonalityAnalyzerProps {
  agentId?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  onError?: (error: string) => void;
}

/**
 * SeasonalityAnalyzer - A component that processes meta-prompts for seasonality analysis
 * This component does NOT handle intent detection (that's the intent router's job)
 * It only processes meta-prompts that have already been identified by the intent router
 */
export const SeasonalityAnalyzer: React.FC<SeasonalityAnalyzerProps> = ({
  agentId = 'seasonality-agent',
  supabaseUrl,
  supabaseKey,
  onError
}) => {
  // Get conversation context and RAG capabilities
  const { messages } = useConversation();
  const { searchSemantic } = useRAG();
  
  // Use the centralized Supabase client instead of creating a new one
  const [supabase] = useState<SupabaseClient | null>(supabase);

  // Logging functions
  const log = useCallback((category: string, message: string, data?: any) => {
    console.log(`[SeasonalityAnalyzer:${category}] ${message}`, data || '');
  }, []);

  // Initialize auth check only once on mount (no dependency on props to avoid loops)
  useEffect(() => {
    // Only perform auth check if we have the centralized client
    if (!supabase) {
      return;
    }

    // Set up authentication check - but only once on mount
    const setupAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // Only log actual errors, not missing sessions
          if (sessionError.message !== 'Invalid session') {
            console.log(`[SeasonalityAnalyzer:Auth] Session error: ${sessionError.message}`);
          }
          return;
        }
        
        if (!session) {
          // Skip anonymous sign-in for now to avoid auth loops
          // console.log('[SeasonalityAnalyzer:Auth] No active session, skipping anonymous sign-in');
          return;
        } else {
          // Only log if we actually have a valid session - but only once per initialization
          if (session.user) {
            console.log(`[SeasonalityAnalyzer:Auth] Active session found`, session.user.id);
          }
        }
      } catch (error) {
        // Silently handle auth errors to avoid console spam
        const err = error as Error;
        if (err.message.includes('Invalid') || err.message.includes('session')) {
          // Skip logging common session errors
          return;
        }
        console.log(`[SeasonalityAnalyzer:Auth] Authentication error: ${err.message}`);
        if (onError) onError(`Authentication error: ${err.message}`);
      }
    };
    
    setupAuth();
  }, []); // Empty dependency array - only run once on mount

  // This component no longer handles intent detection or message processing
  // It only provides Supabase client initialization for seasonality-related operations
  // The intent router should handle all intent detection and meta-prompt retrieval

  // This is a non-visual component
  return null;
};

/**
 * Higher-order component that wraps a component with SeasonalityAnalyzer
 * This enables automatic integration with seasonality analysis capabilities
 */
export const withSeasonalityAnalyzer = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & SeasonalityAnalyzerProps> => {
  return (props: P & SeasonalityAnalyzerProps) => {
    const { agentId, supabaseUrl, supabaseKey, onError, ...componentProps } = props;
    
    return (
      <>
        <SeasonalityAnalyzer
          agentId={agentId}
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          onError={onError}
        />
        <Component {...(componentProps as P)} />
      </>
    );
  };
};

export default SeasonalityAnalyzer;
