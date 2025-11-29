/**
 * Agent Matching
 * 
 * This module handles matching user intents and queries to appropriate agents
 * using embedding-based semantic matching.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Basic agent interface
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities?: string[];
}

/**
 * Find the best matching agent for a given action and query
 * 
 * @param action The classified action from the intent router
 * @param query The original user query
 * @returns The best matching agent
 */
export async function findBestAgentMatch(
  action: string,
  query: string
): Promise<Agent> {
  try {
    // In a real implementation, this would use embedding search against agent_capability_embeddings
    
    // For testing, we return a simulated agent
    const dataAnalysisActions = ['analyze_data', 'calculate_statistics', 'visualize_data'];
    
    if (dataAnalysisActions.includes(action)) {
      return {
        id: 'algorithm-agent-1',
        name: 'Data Analysis Agent',
        description: 'Analyzes datasets using algorithms generated from user queries',
        capabilities: [
          'Analyze time series data',
          'Calculate statistics on datasets',
          'Generate visualizations from data',
          'Identify trends and patterns',
          'Perform forecasting on time series'
        ]
      };
    }
    
    // Default agent if no match found
    return {
      id: 'general-agent',
      name: 'General Purpose Agent',
      description: 'Handles a variety of general tasks',
      capabilities: ['Answer questions', 'Process data', 'Assist with tasks']
    };
  } catch (error) {
    console.error('Error finding agent match:', error);
    // Return a fallback agent on error
    return {
      id: 'fallback-agent',
      name: 'Fallback Agent',
      description: 'Handles requests when other agents are unavailable',
      capabilities: ['Basic task processing']
    };
  }
}
