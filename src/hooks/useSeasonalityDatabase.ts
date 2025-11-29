import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SeasonalityTemplate {
  id: string;
  name: string;
  description: string;
  template_content: string;
  metadata: any;
  stage: 'discernment' | 'analysis' | 'decision' | 'action';
  tags: string[];
}

export interface SeasonalityPrompt {
  id: string;
  name: string;
  content: string;
  metadata: any;
  stage: 'discernment' | 'analysis' | 'decision' | 'action';
  tags: string[];
}

export interface VectorSearchOptions {
  query: string;
  limit?: number;
  threshold?: number;
  filterByTags?: string[];
  filterByStage?: 'discernment' | 'analysis' | 'decision' | 'action';
  teamId?: string;
}

export const useSeasonalityDatabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Find the most relevant decision templates based on vector similarity
   */
  const findRelevantTemplates = useCallback(async (options: VectorSearchOptions) => {
    setLoading(true);
    setError(null);
    try {
      // Call the vector similarity search function in Supabase
      const { data: templates, error: searchError } = await supabase.rpc('match_decision_templates', {
        query_embedding: options.query, // This will be converted to an embedding by the RPC function
        match_threshold: options.threshold || 0.5,
        match_count: options.limit || 5
      });

      if (searchError) {
        throw new Error(`Template search error: ${searchError.message}`);
      }

      // Apply additional filters if needed
      let filtered = templates || [];
      
      if (options.filterByStage) {
        filtered = filtered.filter(t => t.stage === options.filterByStage);
      }
      
      if (options.filterByTags && options.filterByTags.length > 0) {
        filtered = filtered.filter(t => 
          t.tags && options.filterByTags?.some(tag => t.tags.includes(tag))
        );
      }

      return filtered as SeasonalityTemplate[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error in template search';
      setError(errorMessage);
      console.error('Template search error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Find the most relevant prompts based on vector similarity
   */
  const findRelevantPrompts = useCallback(async (options: VectorSearchOptions) => {
    setLoading(true);
    setError(null);
    try {
      // Use the similarity_search_prompts RPC function to find matching prompts
      const { data: prompts, error: searchError } = await supabase.rpc('similarity_search_prompts', {
        query_text: options.query,
        match_threshold: options.threshold || 0.5,
        match_count: options.limit || 5
      });

      if (searchError) {
        throw new Error(`Prompt search error: ${searchError.message}`);
      }

      // Apply additional filters if needed
      let filtered = prompts || [];
      
      if (options.filterByStage) {
        filtered = filtered.filter(p => p.stage === options.filterByStage);
      }
      
      if (options.filterByTags && options.filterByTags.length > 0) {
        filtered = filtered.filter(p => 
          p.tags && options.filterByTags?.some(tag => p.tags.includes(tag))
        );
      }

      return filtered as SeasonalityPrompt[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error in prompt search';
      setError(errorMessage);
      console.error('Prompt search error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get contextual knowledge based on a query
   */
  const getContextualKnowledge = useCallback(async (query: string, limit = 3) => {
    setLoading(true);
    setError(null);
    try {
      const { data: knowledge, error: knowledgeError } = await supabase.rpc('similarity_search_knowledge', {
        query_text: query,
        match_count: limit
      });

      if (knowledgeError) {
        throw new Error(`Knowledge search error: ${knowledgeError.message}`);
      }

      return knowledge || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error in knowledge search';
      setError(errorMessage);
      console.error('Knowledge search error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    findRelevantTemplates,
    findRelevantPrompts,
    getContextualKnowledge,
    loading,
    error
  };
};
