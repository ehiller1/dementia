/**
 * Agent Discovery Hook
 * Provides functionality to discover appropriate agents for templates,
 * based on capabilities, context, and requirements.
 * 
 * Enhanced with semantic search capabilities for more accurate agent matching.
 */

import { supabase } from '../integrations/supabase/client.ts';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Types
interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  suitability: number;
  metadata?: Record<string, any>;
}

interface AgentDiscoveryParams {
  templateId: string;
  context: {
    query: string;
    user: {
      id: string;
      name?: string;
      role?: string;
    };
  };
  capabilities?: string[];
  description?: string;
  similarityThreshold?: number;
  limit?: number;
}

export function useAgentDiscovery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEmbeddingCache, setLastEmbeddingCache] = useState<Record<string, number[]>>({});

  /**
   * Generate embeddings for text using OpenAI's API
   */
  const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
      // Check if we have this embedding cached
      if (lastEmbeddingCache[text]) {
        return lastEmbeddingCache[text];
      }
      
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text }
      });
      
      if (error) throw new Error(`Error generating embedding: ${error.message}`);
      
      // Cache the embedding
      setLastEmbeddingCache(prev => ({ ...prev, [text]: data.embedding }));
      
      return data.embedding;
    } catch (err: any) {
      console.error('Error generating embedding:', err);
      throw new Error(`Failed to generate embedding: ${err.message}`);
    }
  };
  
  /**
   * Calculate cosine similarity between two vectors
   */
  const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  /**
   * Discover agents suitable for a specific template using semantic search
   */
  const discoverAgents = async (params: AgentDiscoveryParams): Promise<Agent[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // First, try to find agents from the database using vector search
      if (params.capabilities?.length || params.description) {
        try {
          const searchText = params.description || params.capabilities?.join(', ') || '';
          if (searchText) {
            const embedding = await generateEmbedding(searchText);
            
            // Query the agent_capability_embeddings table
            const { data: dbAgents, error: dbError } = await supabase
              .rpc('match_agents_by_capability', {
                query_embedding: embedding,
                similarity_threshold: params.similarityThreshold || 0.7,
                match_count: params.limit || 10
              });
            
            if (!dbError && dbAgents && dbAgents.length > 0) {
              // Transform database results to Agent interface
              const transformed = dbAgents.map((agent: any) => ({
                id: agent.id,
                name: agent.name,
                description: agent.description,
                capabilities: agent.capabilities || [],
                suitability: agent.similarity,
                metadata: agent.metadata || {}
              }));
              // Emit discovery telemetry via RPC (client-side safe)
              try {
                await supabase.rpc('log_agent_event', {
                  p_event_type: 'agent_discovery',
                  p_agent_id: null,
                  p_payload: {
                    template_id: params.templateId,
                    query: params.context?.query,
                    user_id: params.context?.user?.id,
                    candidate_count: transformed.length,
                    candidates: transformed.slice(0, 10).map(a => ({ id: a.id, name: a.name, suitability: a.suitability }))
                  },
                  p_source: 'useAgentDiscovery'
                });
              } catch (_) {}
              return transformed;
            }
          }
        } catch (err) {
          console.warn('Vector search failed, falling back to simulated agents', err);
        }
      }
      
      // Fallback to simulated agents if DB search fails or returns no results
      const agents: Agent[] = [
        {
          id: 'seasonality-analyst',
          name: 'Seasonality Analysis Agent',
          description: 'Specialized in detecting and analyzing seasonal patterns in time series data',
          capabilities: ['seasonality_analysis', 'trend_detection', 'data_visualization'],
          suitability: 0.95,
          metadata: {
            requiredData: ['time_series'],
            outputFormats: ['insights', 'charts']
          }
        },
        {
          id: 'procurement-specialist',
          name: 'Procurement Specialist Agent',
          description: 'Expertise in optimizing procurement processes based on demand forecasts',
          capabilities: ['procurement_optimization', 'supplier_management', 'cost_analysis'],
          suitability: 0.87,
          metadata: {
            requiredData: ['supplier_data', 'cost_history'],
            outputFormats: ['recommendations', 'action_plans']
          }
        },
        {
          id: 'inventory-manager',
          name: 'Inventory Management Agent',
          description: 'Specializes in inventory level optimization and management',
          capabilities: ['inventory_optimization', 'stock_level_prediction', 'reorder_point_calculation'],
          suitability: 0.82,
          metadata: {
            requiredData: ['inventory_levels', 'sales_history'],
            outputFormats: ['inventory_plan', 'reorder_schedule']
          }
        },
        {
          id: 'data-processor',
          name: 'Data Processing Agent',
          description: 'Cleans, validates and preprocesses data for analysis',
          capabilities: ['data_cleaning', 'anomaly_detection', 'seasonality_analysis'],
          suitability: 0.78,
          metadata: {
            requiredData: ['raw_data'],
            outputFormats: ['processed_data', 'data_quality_report']
          }
        },
        {
          id: 'visualization-specialist',
          name: 'Data Visualization Agent',
          description: 'Creates compelling visualizations of seasonality and trends',
          capabilities: ['data_visualization', 'chart_generation', 'report_creation'],
          suitability: 0.72,
          metadata: {
            requiredData: ['analysis_results'],
            outputFormats: ['charts', 'dashboards', 'reports']
          }
        }
      ];
      
      // For seasonality-procurement-analysis template, return all agents with seasonality_analysis
      // This simulates the template-agent matching logic
      const templateAgentMap: Record<string, string[]> = {
        'seasonality-procurement-analysis': ['seasonality-analyst', 'data-processor'],
        'inventory-optimization': ['inventory-manager', 'seasonality-analyst'],
        'purchase-order-generator': ['procurement-specialist', 'inventory-manager']
      };
      
      const matchedAgentIds = templateAgentMap[params.templateId] || [];
      
      // Filter agents based on template mapping
      let filteredAgents = agents;
      if (matchedAgentIds.length > 0) {
        filteredAgents = agents.filter(agent => matchedAgentIds.includes(agent.id));
      }
      
      // Sort by suitability
      const sortedAgents = filteredAgents.sort((a, b) => b.suitability - a.suitability);
      
      // Limit results
      const limitedAgents = params.limit ? sortedAgents.slice(0, params.limit) : sortedAgents;
      
      // Emit fallback discovery telemetry via RPC
      try {
        await supabase.rpc('log_agent_event', {
          p_event_type: 'agent_discovery',
          p_agent_id: null,
          p_payload: {
            template_id: params.templateId,
            query: params.context?.query,
            user_id: params.context?.user?.id,
            candidate_count: limitedAgents.length,
            candidates: limitedAgents.slice(0, 10).map(a => ({ id: a.id, name: a.name, suitability: a.suitability })),
            path: 'fallback'
          },
          p_source: 'useAgentDiscovery'
        });
      } catch (_) {}
      return limitedAgents;
    } catch (err: any) {
      const errorMsg = err.message || 'Error discovering agents';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search for agents by semantic similarity to query text
   */
  const searchAgentsBySimilarity = async (queryText: string, limit: number = 5): Promise<Agent[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const queryEmbedding = await generateEmbedding(queryText);
      
      const { data, error } = await supabase
        .rpc('match_agents_by_capability', {
          query_embedding: queryEmbedding,
          similarity_threshold: 0.7,
          match_count: limit
        });
      
      if (error) throw new Error(`Error searching agents: ${error.message}`);
      
      return data.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities || [],
        suitability: agent.similarity,
        metadata: agent.metadata || {}
      }));
    } catch (err: any) {
      const errorMsg = err.message || 'Error searching agents';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    discoverAgents,
    searchAgentsBySimilarity,
    loading,
    error
  };
}
