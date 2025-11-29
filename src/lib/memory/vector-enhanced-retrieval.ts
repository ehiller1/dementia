/**
 * Vector-Enhanced Contextual Retrieval System
 * 
 * This module extends the base contextual retrieval system to add vector-based
 * semantic similarity search capabilities using embeddings.
 * 
 * It provides hybrid search functions that combine traditional text search with
 * vector similarity search for more accurate and context-aware results.
 */

import { supabase } from '@/integrations/supabase/client';
import { ContextualRetrievalService, ContextualSearchParams, ContextualSearchResult, MemoryStoreParams } from './contextual-retrieval.ts';
import { EmbeddingService } from '@/services/embeddingService';
import { KnowledgeGraphService } from '@/services/knowledgeGraphService';

// Extended params for vector search
export interface VectorSearchParams extends ContextualSearchParams {
  useVectorSearch?: boolean;
  hybridSearch?: boolean;
  vectorWeight?: number;
  textWeight?: number;
  similarityThreshold?: number;
}

// Extended params for storing memories with embeddings
export interface VectorMemoryStoreParams extends MemoryStoreParams {
  generateEmbedding?: boolean;
}

/**
 * Vector-Enhanced Contextual Retrieval Service
 * 
 * Extends the base contextual retrieval service to add vector-based semantic similarity
 * search capabilities using embeddings.
 */
export class VectorEnhancedRetrieval extends ContextualRetrievalService {
  /**
   * Stores a memory item in the knowledge base with embedding for vector search
   */
  static async storeMemory(params: VectorMemoryStoreParams): Promise<string> {
    const { 
      content,
      generateEmbedding = true,
      ...baseParams 
    } = params;
    
    try {
      // Generate embedding if requested
      let embedding = null;
      if (generateEmbedding) {
        try {
          embedding = await EmbeddingService.generateEmbedding(content);
        } catch (error) {
          console.warn('Failed to generate embedding, continuing without it:', error);
        }
      }
      
      // Create memory type prefix for the knowledge base
      const memoryTypePrefix = baseParams.memoryType === 'working' ? 'wm' : 
                               baseParams.memoryType === 'short-term' ? 'stm' : 'ltm';
      
      const fullContentType = `${memoryTypePrefix}:${baseParams.contentType}`;
      
      // Insert with embedding if available
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          title: fullContentType,
          content: content,
          user_id: baseParams.userId,
          embedding: embedding,
          metadata: {
            session_id: baseParams.sessionId,
            conversation_id: baseParams.conversationId,
            topic_id: baseParams.topicId,
            expires_at: baseParams.expiresAt?.toISOString(),
            original_metadata: baseParams.metadata || {},
            memory_type: baseParams.memoryType
          },
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error storing memory with embedding:`, error);
        throw new Error(`Failed to store memory: ${error.message}`);
      }
      
      return data?.id;
    } catch (error) {
      console.error(`Error in storeMemory with embedding:`, error);
      throw error;
    }
  }
  
  /**
   * Performs a vector-enhanced contextual search across the hierarchical memory system
   * Can use hybrid search combining traditional text search with vector similarity
   */
  static async search(params: VectorSearchParams): Promise<{
    results: ContextualSearchResult[];
    totalCount: number;
    searchParams: VectorSearchParams;
    executionTime: number;
    facets?: {
      memoryTypes: { [key: string]: number };
      contentTypes: { [key: string]: number };
      timeDistribution: { [key: string]: number };
    };
  }> {
    const startTime = Date.now();
    
    // Default parameters
    const {
      query,
      useVectorSearch = true,
      hybridSearch = true,
      vectorWeight = 0.7,
      textWeight = 0.3,
      similarityThreshold = 0.6,
      ...baseParams
    } = params;
    
    try {
      let results: ContextualSearchResult[] = [];
      
      // If vector search is disabled, use traditional search only
      if (!useVectorSearch) {
        return await super.search({
          query,
          ...baseParams
        });
      }
      
      // Generate embedding for the query
      let queryEmbedding: number[] | null = null;
      try {
        queryEmbedding = await EmbeddingService.generateEmbedding(query);
      } catch (error) {
        console.warn('Failed to generate query embedding, falling back to text search:', error);
        return await super.search({
          query,
          ...baseParams
        });
      }
      
      // Build memory type prefixes for filtering
      const memoryTypePrefixes: string[] = [];
      const memoryTypes = baseParams.memoryTypes || ['working', 'short-term', 'long-term'];
      
      if (memoryTypes.includes('working')) {
        memoryTypePrefixes.push('wm:');
      }
      if (memoryTypes.includes('short-term')) {
        memoryTypePrefixes.push('stm:');
      }
      if (memoryTypes.includes('long-term')) {
        memoryTypePrefixes.push('ltm:');
      }
      
      // Build the base vector query using pgvector's similarity search
      let queryBuilder = supabase
        .from('knowledge_base')
        .select('*')
        .not('embedding', 'is', null);  // Only search items that have embeddings
      
      // Apply vector similarity using pgvector's <-> operator
      // Lower values mean higher similarity
      if (queryEmbedding) {
        queryBuilder = queryBuilder.order('embedding <-> $1', { 
          ascending: true,  // Closest vectors first
          referencedTable: 'knowledge_base',
          nullsFirst: false,
        }).limit(baseParams.maxResults || 20);
      }
      
      // Apply additional filters similar to the base contextual search
      // Apply memory type filters using title field prefixes
      if (memoryTypePrefixes.length > 0) {
        queryBuilder = queryBuilder.or(
          memoryTypePrefixes.map(prefix => `title.ilike.${prefix}%`).join(',')
        );
      }
      
      // Apply user filter if provided
      if (baseParams.userId) {
        queryBuilder = queryBuilder.eq('user_id', baseParams.userId);
      }
      
      // Apply content type filters if provided
      const contentTypes = baseParams.contentTypes || [];
      if (contentTypes.length > 0) {
        const contentTypePatterns = contentTypes.map(type => {
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
      const timeframe = baseParams.timeframe || {};
      if (timeframe.start) {
        queryBuilder = queryBuilder.gte('created_at', timeframe.start.toISOString());
      }
      if (timeframe.end) {
        queryBuilder = queryBuilder.lte('created_at', timeframe.end.toISOString());
      }
      
      // Apply session, conversation, or topic filters from metadata
      if (baseParams.sessionId) {
        queryBuilder = queryBuilder.filter('metadata->session_id', 'eq', baseParams.sessionId);
      }
      if (baseParams.conversationId) {
        queryBuilder = queryBuilder.filter('metadata->conversation_id', 'eq', baseParams.conversationId);
      }
      if (baseParams.topicId) {
        queryBuilder = queryBuilder.filter('metadata->topic_id', 'eq', baseParams.topicId);
      }
      
      // Execute the vector query
      const { data: vectorResults, error: vectorError } = await queryBuilder;
      
      if (vectorError) {
        console.error('Error in vector search:', vectorError);
        // Fall back to traditional search
        return await super.search({
          query,
          ...baseParams
        });
      }
      
      // If we're doing hybrid search, also get text search results
      let textResults: any[] = [];
      if (hybridSearch) {
        // Use the traditional search method
        const textSearchResponse = await super.search({
          query,
          ...baseParams
        });
        
        textResults = textSearchResponse.results.map(r => {
          return {
            id: r.id,
            content: r.content,
            title: r.contentType,
            created_at: r.timestamp,
            user_id: r.metadata?.user_id,
            metadata: r.metadata,
            relevance: r.relevance
          };
        });
      }
      
      // Process vector results
      const vectorSearchResults = vectorResults?.map(item => {
        // Extract memory type and content type from title field
        const titleParts = item.title.split(':');
        let memoryType: 'working' | 'short-term' | 'long-term';
        let contentType: string;
        
        if (titleParts.length >= 2) {
          const prefix = titleParts[0];
          memoryType = prefix === 'wm' ? 'working' : 
                      prefix === 'stm' ? 'short-term' : 'long-term';
          contentType = titleParts.slice(1).join(':');
        } else {
          memoryType = 'long-term';
          contentType = item.title;
        }
        
        // Calculate vector similarity score (assuming embedding is normalized)
        let vectorScore = 0;
        if (queryEmbedding && item.embedding) {
          vectorScore = EmbeddingService.calculateCosineSimilarity(
            queryEmbedding, 
            item.embedding
          );
        }
        
        return {
          id: item.id,
          content: item.content,
          contentType: contentType,
          memoryType: memoryType,
          vectorScore: vectorScore,
          timestamp: new Date(item.created_at),
          source: 'knowledge_base',
          metadata: baseParams.includeMetadata === false ? undefined : item.metadata
        };
      }) || [];
      
      // Merge and score results if doing hybrid search
      if (hybridSearch && textResults.length > 0) {
        // Create a map for quick lookup of vector scores
        const vectorScoreMap = new Map(
          vectorSearchResults.map(r => [r.id, r.vectorScore])
        );
        
        // Create a map for quick lookup of text search scores
        const textScoreMap = new Map(
          textResults.map(r => [r.id, r.relevance])
        );
        
        // Merge all unique items
        const allItems = new Map();
        
        // Add all vector results
        vectorSearchResults.forEach(r => {
          allItems.set(r.id, r);
        });
        
        // Add or update with text results
        textResults.forEach(item => {
          // Extract memory type and content type from title field
          const titleParts = item.title.split(':');
          let memoryType: 'working' | 'short-term' | 'long-term';
          let contentType: string;
          
          if (titleParts.length >= 2) {
            const prefix = titleParts[0];
            memoryType = prefix === 'wm' ? 'working' : 
                        prefix === 'stm' ? 'short-term' : 'long-term';
            contentType = titleParts.slice(1).join(':');
          } else {
            memoryType = 'long-term';
            contentType = item.title;
          }
          
          if (allItems.has(item.id)) {
            // Update existing entry with text score
            const existing = allItems.get(item.id);
            existing.textScore = item.relevance;
          } else {
            // Add new entry
            allItems.set(item.id, {
              id: item.id,
              content: item.content,
              contentType: contentType,
              memoryType: memoryType,
              textScore: item.relevance,
              vectorScore: vectorScoreMap.get(item.id) || 0,
              timestamp: new Date(item.created_at),
              source: 'knowledge_base',
              metadata: baseParams.includeMetadata === false ? undefined : item.metadata
            });
          }
        });
        
        // Convert to array and calculate combined scores
        results = Array.from(allItems.values()).map(item => {
          const vectorScore = item.vectorScore || 0;
          const textScore = item.textScore || 0;
          
          // Calculate weighted hybrid score
          const combinedScore = 
            (vectorScore * vectorWeight) + 
            (textScore * textWeight);
          
          return {
            id: item.id,
            content: item.content,
            contentType: item.contentType,
            memoryType: item.memoryType,
            relevance: combinedScore,
            timestamp: item.timestamp,
            source: item.source,
            metadata: item.metadata
          };
        });
      } else {
        // Just use vector results
        results = vectorSearchResults.map(item => ({
          id: item.id,
          content: item.content,
          contentType: item.contentType,
          memoryType: item.memoryType,
          relevance: item.vectorScore,
          timestamp: item.timestamp,
          source: item.source,
          metadata: item.metadata
        }));
      }
      
      // Filter by relevance threshold
      const minRelevance = baseParams.minRelevance || similarityThreshold;
      results = results.filter(r => r.relevance >= minRelevance);
      
      // Sort by relevance and limit results
      const sortedResults = results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, baseParams.maxResults || 10);
      
      // Generate facets
      const facets = {
        memoryTypes: {} as { [key: string]: number },
        contentTypes: {} as { [key: string]: number },
        timeDistribution: {} as { [key: string]: number }
      };
      
      // Populate facets
      for (const result of sortedResults) {
        facets.memoryTypes[result.memoryType] = (facets.memoryTypes[result.memoryType] || 0) + 1;
        facets.contentTypes[result.contentType] = (facets.contentTypes[result.contentType] || 0) + 1;
        
        const month = result.timestamp.toISOString().substring(0, 7); // YYYY-MM format
        facets.timeDistribution[month] = (facets.timeDistribution[month] || 0) + 1;
      }
      
      // Enhance with knowledge graph if requested
      if (baseParams.includeKnowledgeGraph !== false && sortedResults.length > 0) {
        await this.enhanceResultsWithKnowledgeGraph(sortedResults, query);
      }
      
      return {
        results: sortedResults,
        totalCount: results.length,
        searchParams: params,
        executionTime: Date.now() - startTime,
        facets: facets
      };
    } catch (error) {
      console.error('Error in vector-enhanced search:', error);
      // Fall back to traditional search
      return await super.search({
        query,
        ...baseParams
      });
    }
  }
  
  /**
   * Update embeddings for existing content
   * Use this when migrating existing content to use embeddings
   */
  static async updateEmbeddingsForExistingContent(
    batchSize: number = 50,
    startId?: string
  ): Promise<{
    processed: number;
    updated: number;
    failed: number;
    lastId?: string;
  }> {
    try {
      // Query for items without embeddings
      let queryBuilder = supabase
        .from('knowledge_base')
        .select('id, content')
        .is('embedding', null)
        .order('id', { ascending: true })
        .limit(batchSize);
      
      if (startId) {
        queryBuilder = queryBuilder.gt('id', startId);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) {
        console.error('Error querying items without embeddings:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return {
          processed: 0,
          updated: 0,
          failed: 0
        };
      }
      
      // Process items in parallel batches
      let updated = 0;
      let failed = 0;
      let lastId: string | undefined;
      
      // Process in smaller chunks to avoid rate limits
      const chunks = this.chunkArray(data, 5);
      
      for (const chunk of chunks) {
        const updates = await Promise.all(chunk.map(async item => {
          try {
            const embedding = await EmbeddingService.generateEmbedding(item.content);
            
            const { error } = await supabase
              .from('knowledge_base')
              .update({ embedding })
              .eq('id', item.id);
            
            if (error) {
              console.error(`Failed to update embedding for item ${item.id}:`, error);
              return false;
            }
            
            return true;
          } catch (error) {
            console.error(`Error generating embedding for item ${item.id}:`, error);
            return false;
          }
        }));
        
        // Count successes and failures
        updated += updates.filter(success => success).length;
        failed += updates.filter(success => !success).length;
        
        // Short delay between chunks to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Set the last processed ID
      lastId = data[data.length - 1]?.id;
      
      return {
        processed: data.length,
        updated,
        failed,
        lastId
      };
    } catch (error) {
      console.error('Error updating embeddings:', error);
      throw error;
    }
  }
  
  /**
   * Helper to chunk array into smaller pieces
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
