
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SeasonalityContext {
  agentId: string;
  conversationId?: string;
  currentPhase: 'discovery' | 'planning' | 'reasoning' | 'execution' | 'interpretation';
  conversationHistory: any[];
  dataContext: any;
  analysisScope: any;
  activeMethod: string | null;
  planState: any;
}

export const useSeasonalityContext = (agentId: string, conversationId?: string) => {
  const [context, setContext] = useState<SeasonalityContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (agentId) {
      loadContext();
    }
  }, [agentId, conversationId]);

  const loadContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get existing context from database with conversation filter
      let query = supabase
        .from('agent_performance')
        .select('*')
        .eq('agent_id', agentId)
        .order('recorded_at', { ascending: false });

      if (conversationId) {
        // Filter by conversation ID if provided
        query = query.filter('metrics->>conversationId', 'eq', conversationId);
      }

      const { data: existingContext } = await query
        .limit(1)
        .maybeSingle();

      if (existingContext?.metrics) {
        // Safe type conversion with validation
        const metrics = existingContext.metrics as unknown;
        if (typeof metrics === 'object' && metrics && 'agentId' in metrics) {
          setContext(metrics as SeasonalityContext);
        } else {
          // Initialize new context if invalid data
          const newContext: SeasonalityContext = {
            agentId,
            conversationId,
            currentPhase: 'discovery',
            conversationHistory: [],
            dataContext: null,
            analysisScope: null,
            activeMethod: null,
            planState: {
              currentMethod: null,
              requiredSteps: [],
              executionStatus: 'pending',
              parameters: {},
              intermediateResults: {}
            }
          };
          setContext(newContext);
        }
      } else {
        // Initialize new context
        const newContext: SeasonalityContext = {
          agentId,
          conversationId,
          currentPhase: 'discovery',
          conversationHistory: [],
          dataContext: null,
          analysisScope: null,
          activeMethod: null,
          planState: {
            currentMethod: null,
            requiredSteps: [],
            executionStatus: 'pending',
            parameters: {},
            intermediateResults: {}
          }
        };
        setContext(newContext);
      }
    } catch (error) {
      console.error('Error loading seasonality context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContext = async (newContext: Partial<SeasonalityContext>) => {
    if (!context) return;

    const updatedContext = { ...context, ...newContext };
    setContext(updatedContext);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save to database with conversation context
      await supabase
        .from('agent_performance')
        .insert({
          agent_id: agentId,
          metrics: updatedContext,
          performance_score: 100, // Placeholder
          feedback: `Context switch to ${updatedContext.currentPhase} phase${
            conversationId ? ` (Session: ${conversationId.slice(-8)})` : ''
          }`
        });

    } catch (error) {
      console.error('Error saving seasonality context:', error);
    }
  };

  const switchContext = async (newPhase: SeasonalityContext['currentPhase'], additionalData?: any) => {
    await saveContext({
      currentPhase: newPhase,
      ...additionalData
    });
  };

  const updatePlan = async (planUpdates: any) => {
    if (!context) return;

    const updatedPlanState = {
      ...context.planState,
      ...planUpdates
    };

    await saveContext({
      planState: updatedPlanState
    });
  };

  return {
    context,
    isLoading,
    switchContext,
    updatePlan,
    saveContext
  };
};
