/**
 * Contextual Retrieval System
 * 
 * This module implements multi-faceted search capabilities across the hierarchical memory system.
 * It provides contextual retrieval functions that can search across working memory, short-term memory,
 * and long-term memory based on various search criteria and relevance factors.
 * 
 * All memory types are stored in the knowledge_base table with appropriate type prefixes.
 */

import { supabase } from '@/integrations/supabase/client';
import { KnowledgeGraphService } from '@/services/knowledgeGraphService';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { Json } from '@/types/supabase';
import { useState, useCallback } from 'react';

// Types for contextual retrieval
export interface ContextualSearchParams {
  query: string;
  userId?: string;
  sessionId?: string;
  conversationId?: string;
  topicId?: string;
  memoryTypes?: ('working' | 'short-term' | 'long-term')[];
  contentTypes?: string[];
  maxResults?: number;
  minRelevance?: number;
  includeKnowledgeGraph?: boolean;
  includeMetadata?: boolean;
  timeframe?: {
    start?: Date;
    end?: Date;
  };
}

export interface MemoryStoreParams {
  content: string;
  contentType: string;
  memoryType: 'working' | 'short-term' | 'long-term';
  userId?: string;
  sessionId?: string;
  conversationId?: string;
  topicId?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface ContextualSearchResult {
  id: string;
  content: string;
  contentType: string;
  memoryType: 'working' | 'short-term' | 'long-term';
  relevance: number;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
  knowledgeContext?: any;
}

export interface ContextualRetrievalResponse {
  results: ContextualSearchResult[];
  totalCount: number;
  searchParams: ContextualSearchParams;
  executionTime: number;
  facets?: {
    memoryTypes: { [key: string]: number };
    contentTypes: { [key: string]: number };
    timeDistribution: { [key: string]: number };
  };
}

/**
 * Contextual Retrieval Service
 * 
 * Provides multi-faceted search capabilities across the hierarchical memory system.
 * All memory types are stored in the knowledge_base table with appropriate type prefixes.
 */
export class ContextualRetrievalService {
  /**
   * Stores a memory item in the knowledge base with appropriate memory type tagging
   */
  static async storeMemory(params: MemoryStoreParams): Promise<string> {
    const {
      content,
      contentType,
      memoryType,
      userId,
      sessionId,
      conversationId,
      topicId,
      metadata,
      expiresAt
    } = params;
    
    try {
      // Create memory record with consistent field structure
      // Use prefixes to distinguish memory types in the knowledge_base table
      const memoryTypePrefix = memoryType === 'working' ? 'wm' : 
                              memoryType === 'short-term' ? 'stm' : 'ltm';
      
      const fullContentType = `${memoryTypePrefix}:${contentType}`;
      
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          title: fullContentType, // Use title field to store content type with memory type prefix
          content: content,
          user_id: userId,
          metadata: {
            session_id: sessionId,
            conversation_id: conversationId,
            topic_id: topicId,
            expires_at: expiresAt?.toISOString(),
            original_metadata: metadata || {},
            memory_type: memoryType
          },
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error storing ${memoryType} memory:`, error);
        throw new Error(`Failed to store memory: ${error.message}`);
      }
      
      return data?.id;
    } catch (error) {
      console.error(`Error in storeMemory:`, error);
      throw error;
    }
  }

  /**
   * Performs a contextual search across the hierarchical memory system
   * Uses a unified approach with the knowledge_base table for all memory types
   */
  static async search(params: ContextualSearchParams): Promise<ContextualRetrievalResponse> {
    const startTime = Date.now();
    
    // Default parameters
    const {
      query,
      userId,
      sessionId,
      conversationId,
      topicId,
      memoryTypes = ['working', 'short-term', 'long-term'],
      contentTypes = [],
      maxResults = 10,
      minRelevance = 0.6,
      includeKnowledgeGraph = true,
      includeMetadata = true,
      timeframe = {}
    } = params;
    
    try {
      // Build memory type prefixes for filtering
      const memoryTypePrefixes: string[] = [];
      if (memoryTypes.includes('working')) {
        memoryTypePrefixes.push('wm:');
      }
      if (memoryTypes.includes('short-term')) {
        memoryTypePrefixes.push('stm:');
      }
      if (memoryTypes.includes('long-term')) {
        memoryTypePrefixes.push('ltm:');
      }
      
      // Build the base query
      let queryBuilder = supabase
        .from('knowledge_base')
        .select('*')
        .textSearch('content', query, {
          type: 'websearch',
          config: 'english'
        });
      
      // Apply memory type filters using title field prefixes
      if (memoryTypePrefixes.length > 0) {
        queryBuilder = queryBuilder.or(
          memoryTypePrefixes.map(prefix => `title.ilike.${prefix}%`).join(',')
        );
      }
      
      // Apply user filter if provided
      if (userId) {
        queryBuilder = queryBuilder.eq('user_id', userId);
      }
      
      // Apply content type filters if provided
      if (contentTypes.length > 0) {
        const contentTypePatterns = contentTypes.map(type => {
          // For each content type, match any memory type prefix with this content type
          const patterns = memoryTypePrefixes.map(prefix => `${prefix}${type}`);
          return patterns;
        }).flat();
        
        if (contentTypePatterns.length > 0) {
          queryBuilder = queryBuilder.or(
            contentTypePatterns.map(pattern => `title.eq.${pattern}`).join(',')
          );
        }
      }
      
      // Apply timeframe filters if provided
      if (timeframe.start) {
        queryBuilder = queryBuilder.gte('created_at', timeframe.start.toISOString());
      }
      
      if (timeframe.end) {
        queryBuilder = queryBuilder.lte('created_at', timeframe.end.toISOString());
      }
      
      // Apply session, conversation, or topic filters from metadata
      if (sessionId || conversationId || topicId) {
        // We need to filter on metadata JSON fields
        if (sessionId) {
          queryBuilder = queryBuilder.filter('metadata->session_id', 'eq', sessionId);
        }
        
        if (conversationId) {
          queryBuilder = queryBuilder.filter('metadata->conversation_id', 'eq', conversationId);
        }
        
        if (topicId) {
          queryBuilder = queryBuilder.filter('metadata->topic_id', 'eq', topicId);
        }
      }
      
      // Execute the query
      const { data, error } = await queryBuilder;
      
      if (error) {
        console.error('Error in contextual retrieval search:', error);
        throw new Error(`Contextual retrieval search failed: ${error.message}`);
      }
      
      // Process the results
      const results: ContextualSearchResult[] = [];
      const facets = {
        memoryTypes: {} as { [key: string]: number },
        contentTypes: {} as { [key: string]: number },
        timeDistribution: {} as { [key: string]: number }
      };
      
      // Map database results to ContextualSearchResult format
      for (const item of data || []) {
        // Extract memory type and content type from title field
        const titleParts = item.title.split(':');
        let memoryType: 'working' | 'short-term' | 'long-term';
        let contentType: string;
        
        if (titleParts.length >= 2) {
          const prefix = titleParts[0];
          memoryType = prefix === 'wm' ? 'working' : 
                      prefix === 'stm' ? 'short-term' : 'long-term';
          contentType = titleParts.slice(1).join(':'); // Rejoin in case content type itself contains colons
        } else {
          // Fallback if title format is unexpected
          memoryType = 'long-term';
          contentType = item.title;
        }
        
        // Calculate relevance score for this item
        const relevance = this.calculateRelevance(item.content, query);
        
        // Only include items that meet minimum relevance threshold
        if (relevance >= minRelevance) {
          const result: ContextualSearchResult = {
            id: item.id,
            content: item.content,
            contentType: contentType,
            memoryType: memoryType,
            relevance: relevance,
            timestamp: new Date(item.created_at),
            source: 'knowledge_base',
            metadata: includeMetadata ? (item.metadata as Record<string, any>) : undefined
          };
          
          results.push(result);
          
          // Update facet counters
          facets.memoryTypes[memoryType] = (facets.memoryTypes[memoryType] || 0) + 1;
          facets.contentTypes[contentType] = (facets.contentTypes[contentType] || 0) + 1;
          
          const month = result.timestamp.toISOString().substring(0, 7); // YYYY-MM format
          facets.timeDistribution[month] = (facets.timeDistribution[month] || 0) + 1;
        }
      }
      
      // Enhance with knowledge graph if requested
      if (includeKnowledgeGraph && results.length > 0) {
        await this.enhanceResultsWithKnowledgeGraph(results, query);
      }
      
      // Sort by relevance and limit results
      const sortedResults = results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxResults);
      
      return {
        results: sortedResults,
        totalCount: results.length,
        searchParams: params,
        executionTime: Date.now() - startTime,
        facets
      };
    } catch (error) {
      console.error('Error in contextual retrieval search:', error);
      throw new Error(`Contextual retrieval search failed: ${error}`);
    }
  }
  
  /**
   * Enhances search results with knowledge graph context
   */
  private static async enhanceResultsWithKnowledgeGraph(
    results: ContextualSearchResult[],
    query: string
  ): Promise<void> {
    try {
      // Get knowledge graph context for the query
      const enhancedContext = await KnowledgeGraphService.enhanceQueryWithKnowledge(query);
      
      if (!enhancedContext || !enhancedContext.enhancedContext) {
        return;
      }
      
      // Add knowledge context to each result
      results.forEach(result => {
        result.knowledgeContext = {
          relatedConcepts: enhancedContext.enhancedContext.relatedConcepts,
          conceptPaths: enhancedContext.enhancedContext.conceptPaths
        };
        
        // Boost relevance if content contains any of the related concepts
        const relatedConcepts = enhancedContext.enhancedContext.relatedConcepts || [];
        for (const concept of relatedConcepts) {
          if (result.content.toLowerCase().includes(concept.name.toLowerCase())) {
            // Boost relevance based on concept depth (direct matches get higher boost)
            const boostFactor = 1 - (concept.depth * 0.1);
            result.relevance = Math.min(1.0, result.relevance + (0.1 * boostFactor));
          }
        }
      });
    } catch (error) {
      console.error('Error enhancing results with knowledge graph:', error);
    }
  }
  
  /**
   * Calculates relevance score for a content item based on query
   */
  private static calculateRelevance(content: string, query: string): number {
    // Simple relevance calculation based on term frequency
    const contentLower = content.toLowerCase();
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    let matchCount = 0;
    for (const term of queryTerms) {
      if (term.length > 2 && contentLower.includes(term)) {
        matchCount++;
      }
    }
    
    // Calculate relevance score (0.0 to 1.0)
    const baseRelevance = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
    
    // Apply length penalty for very short or very long content
    const lengthFactor = Math.min(1.0, Math.max(0.5, content.length / 1000));
    
    return Math.min(1.0, baseRelevance * lengthFactor);
  }
  
  /**
   * Retrieves context for a specific topic
   */
  static async getTopicContext(
    topicId: string,
    includeWorkingMemory: boolean = true,
    includeShortTermMemory: boolean = true,
    includeLongTermMemory: boolean = false
  ): Promise<ContextualSearchResult[]> {
    try {
      // Get topic details first
      const { data: topicData, error: topicError } = await supabase
        .from('knowledge_base')
        .select('*')
        .filter('metadata->topic_id', 'eq', topicId)
        .single();
      
      if (topicError || !topicData) {
        console.error('Error retrieving topic:', topicError);
        return [];
      }
      
      // Build memory types array based on inclusion flags
      const memoryTypes: ('working' | 'short-term' | 'long-term')[] = [];
      if (includeWorkingMemory) memoryTypes.push('working');
      if (includeShortTermMemory) memoryTypes.push('short-term');
      if (includeLongTermMemory) memoryTypes.push('long-term');
      
      // Search for content related to this topic
      const searchParams: ContextualSearchParams = {
        query: topicData.content || '',
        topicId: topicId,
        memoryTypes: memoryTypes,
        maxResults: 50,
        minRelevance: 0.3,
        includeKnowledgeGraph: true
      };
      
      const response = await this.search(searchParams);
      return response.results;
    } catch (error) {
      console.error('Error retrieving topic context:', error);
      return [];
    }
  }
  
  /**
   * Retrieves context for a specific conversation
   */
  static async getConversationContext(
    conversationId: string,
    maxResults: number = 20
  ): Promise<ContextualSearchResult[]> {
    try {
      const searchParams: ContextualSearchParams = {
        query: '', // Empty query to match all items
        conversationId: conversationId,
        memoryTypes: ['working', 'short-term'],
        maxResults: maxResults,
        minRelevance: 0.0 // No relevance filtering since we're retrieving by conversation ID
      };
      
      const response = await this.search(searchParams);
      return response.results;
    } catch (error) {
      console.error('Error retrieving conversation context:', error);
      return [];
    }
  }
}

/**
 * React hook for using contextual retrieval in components
 */
export function useContextualRetrieval() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<ContextualSearchResult[]>([]);
  const [response, setResponse] = useState<ContextualRetrievalResponse | null>(null);
  
  const searchMemory = useCallback(async (params: ContextualSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchResponse = await ContextualRetrievalService.search(params);
      setResults(searchResponse.results);
      setResponse(searchResponse);
      return searchResponse;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const storeMemory = useCallback(async (params: MemoryStoreParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const id = await ContextualRetrievalService.storeMemory(params);
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    searchMemory,
    storeMemory,
    loading,
    error,
    results,
    response
  };
}
