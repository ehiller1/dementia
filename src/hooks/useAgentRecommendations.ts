/**
 * Hook to fetch agent recommendations based on conversation context
 * 
 * Uses the CrewAI agent factory to suggest agents that can help
 * with the current conversation
 */

import { useState, useEffect, useCallback } from 'react';

interface AgentRecommendation {
  id: string;
  name: string;
  capabilities: string[];
  confidence: number;
  suggestedFor: string;
  description: string;
  estimatedTime?: string;
}

interface ConversationContext {
  conversationId: string;
  recentMessages?: string[];
  currentTask?: string;
  detectedIntent?: string;
  keywords?: string[];
}

interface UseAgentRecommendationsOptions {
  enabled?: boolean;
  refreshInterval?: number;
  maxRecommendations?: number;
}

export function useAgentRecommendations(
  context: ConversationContext,
  options: UseAgentRecommendationsOptions = {}
) {
  const {
    enabled = true,
    refreshInterval = 30000, // 30 seconds
    maxRecommendations = 5
  } = options;

  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!enabled || !context.conversationId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the agent recommendations API
      const response = await fetch('/api/agent-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: context.conversationId,
          recentMessages: context.recentMessages?.slice(-5) || [],
          currentTask: context.currentTask,
          detectedIntent: context.detectedIntent,
          keywords: context.keywords,
          maxRecommendations
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);

    } catch (err) {
      console.error('[useAgentRecommendations] Error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Fallback to mock recommendations for development
      if (process.env.NODE_ENV === 'development') {
        setRecommendations(getMockRecommendations(context));
      }
    } finally {
      setIsLoading(false);
    }
  }, [context, enabled, maxRecommendations]);

  // Initial fetch
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Periodic refresh
  useEffect(() => {
    if (!enabled || !refreshInterval) {
      return;
    }

    const interval = setInterval(fetchRecommendations, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, fetchRecommendations]);

  const refresh = useCallback(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh
  };
}

/**
 * Mock recommendations for development/testing
 */
function getMockRecommendations(context: ConversationContext): AgentRecommendation[] {
  const mockRecommendations: AgentRecommendation[] = [
    {
      id: 'rec-1',
      name: 'Inventory Optimization Agent',
      capabilities: ['inventory_analysis', 'forecasting', 'replenishment'],
      confidence: 0.92,
      suggestedFor: 'Analyzing inventory levels',
      description: 'I can analyze your current inventory position, forecast demand, and suggest optimal replenishment quantities to minimize stockouts and excess inventory.',
      estimatedTime: '2-3 min'
    },
    {
      id: 'rec-2',
      name: 'Pricing Strategy Agent',
      capabilities: ['pricing', 'elasticity', 'markdown_optimization'],
      confidence: 0.87,
      suggestedFor: 'Optimizing pricing decisions',
      description: 'I can analyze price elasticity, competitive positioning, and suggest optimal pricing and markdown strategies to maximize revenue and margin.',
      estimatedTime: '3-4 min'
    },
    {
      id: 'rec-3',
      name: 'Campaign Performance Agent',
      capabilities: ['campaign_analysis', 'attribution', 'media_mix'],
      confidence: 0.81,
      suggestedFor: 'Evaluating marketing performance',
      description: 'I can analyze campaign performance across channels, measure incrementality, and optimize budget allocation for maximum ROAS.',
      estimatedTime: '4-5 min'
    },
    {
      id: 'rec-4',
      name: 'Data Analysis Agent',
      capabilities: ['sql_analysis', 'data_retrieval', 'reporting'],
      confidence: 0.75,
      suggestedFor: 'Querying and analyzing data',
      description: 'I can write SQL queries, retrieve data from multiple sources, and generate comprehensive reports with insights and visualizations.',
      estimatedTime: '1-2 min'
    },
    {
      id: 'rec-5',
      name: 'Demand Forecasting Agent',
      capabilities: ['forecasting', 'time_series', 'seasonality'],
      confidence: 0.68,
      suggestedFor: 'Predicting future demand',
      description: 'I can analyze historical sales patterns, account for seasonality and trends, and generate accurate demand forecasts to support planning.',
      estimatedTime: '3-5 min'
    }
  ];

  // Filter based on context keywords if available
  if (context.keywords && context.keywords.length > 0) {
    const keywords = context.keywords.map(k => k.toLowerCase());
    return mockRecommendations.filter(rec => {
      const capLower = rec.capabilities.map(c => c.toLowerCase());
      const nameLower = rec.name.toLowerCase();
      const descLower = rec.description.toLowerCase();
      
      return keywords.some(kw => 
        capLower.some(c => c.includes(kw)) ||
        nameLower.includes(kw) ||
        descLower.includes(kw)
      );
    });
  }

  return mockRecommendations;
}
