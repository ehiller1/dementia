/**
 * Memory Indexer
 * Handles checksums, consistency validation, and enhanced retrieval
 */

import { MemoryManager } from './memory-manager.ts';
import { 
  MemoryType, 
  MemoryContext,
  MemoryEntry,
  MemorySystemDependencies
} from './types.ts';
// Browser-compatible hashing function
const generateHash = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Memory consistency status
 */
export enum ConsistencyStatus {
  VALID = 'valid',
  CORRUPTED = 'corrupted',
  UNKNOWN = 'unknown'
}

/**
 * Memory validation result
 */
export interface MemoryValidationResult {
  status: ConsistencyStatus;
  isValid: boolean;
  issues?: string[];
}

/**
 * Memory index information
 */
export interface MemoryIndex {
  id: string;
  checksum: string;
  references: string[];
  associations: Array<{
    targetId: string;
    type: string;
    strength: number;
  }>;
}

/**
 * Memory Indexer class
 * Provides advanced indexing and consistency validation
 */
export class MemoryIndexer {
  private memoryManager: MemoryManager;
  private deps: MemorySystemDependencies;
  
  constructor(dependencies?: Partial<MemorySystemDependencies>) {
    this.memoryManager = new MemoryManager(dependencies);
    
    // Set up dependencies with defaults from memory manager
    this.deps = {
      supabase: dependencies?.supabase || this.memoryManager['deps'].supabase,
      embeddingProvider: dependencies?.embeddingProvider || this.memoryManager['deps'].embeddingProvider
    };
  }
  
  /**
   * Validates a memory's consistency by comparing stored checksum with computed one
   * @param memoryId ID of the memory to validate
   * @param context Memory operation context
   * @returns Validation result
   */
  async validateMemoryConsistency(
    memoryId: string,
    context: MemoryContext
  ): Promise<MemoryValidationResult> {
    try {
      // Get the memory
      const memory = await this.memoryManager.getMemory(memoryId, context);
      
      if (!memory) {
        return {
          status: ConsistencyStatus.UNKNOWN,
          isValid: false,
          issues: ['Memory not found']
        };
      }
      
      // If no checksum exists, we can't validate
      if (!memory.checksum) {
        return {
          status: ConsistencyStatus.UNKNOWN,
          isValid: false,
          issues: ['No checksum available for validation']
        };
      }
      
      // Compute checksum of current content
      const computedChecksum = await this.generateChecksum(memory.content);
      
      // Compare with stored checksum
      const isValid = computedChecksum === memory.checksum;
      
      return {
        status: isValid ? ConsistencyStatus.VALID : ConsistencyStatus.CORRUPTED,
        isValid,
        issues: isValid ? undefined : ['Checksum mismatch: potential data corruption']
      };
    } catch (error) {
      console.error('Error validating memory consistency:', error);
      return {
        status: ConsistencyStatus.UNKNOWN,
        isValid: false,
        issues: [`Error during validation: ${error.message || error}`]
      };
    }
  }
  
  /**
   * Regenerates checksums for memories
   * @param memoryType Type of memories to process
   * @param context Memory operation context
   * @param limit Maximum number of memories to process
   * @returns Number of memories updated
   */
  async regenerateChecksums(
    memoryType: MemoryType,
    context: MemoryContext,
    limit: number = 100
  ): Promise<number> {
    try {
      // Find memories with missing or potentially invalid checksums
      const { data: memories, error } = await this.deps.supabase
        .from('memory_entries')
        .select('id, content')
        .eq('tenant_id', context.tenantId)
        .eq('memory_type', memoryType)
        .or('checksum.is.null,checksum.eq.""')
        .limit(limit);
        
      if (error) {
        throw new Error(`Error fetching memories: ${error.message}`);
      }
      
      if (!memories || memories.length === 0) {
        return 0;
      }
      
      // Update checksums
      let updatedCount = 0;
      
      for (const memory of memories) {
        const newChecksum = await this.generateChecksum(memory.content);
        
        const { error: updateError } = await this.deps.supabase
          .from('memory_entries')
          .update({ checksum: newChecksum })
          .eq('id', memory.id)
          .eq('tenant_id', context.tenantId);
          
        if (!updateError) {
          updatedCount++;
        }
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Error regenerating checksums:', error);
      throw error;
    }
  }
  
  /**
   * Creates indexes for memory entries for faster retrieval
   * @param memoryIds Array of memory IDs to index
   * @param context Memory operation context
   * @returns Number of indexes created
   */
  async createMemoryIndexes(
    memoryIds: string[],
    context: MemoryContext
  ): Promise<number> {
    try {
      // Get the memories
      const { data: memories, error } = await this.deps.supabase
        .from('memory_entries')
        .select('*')
        .in('id', memoryIds)
        .eq('tenant_id', context.tenantId);
        
      if (error) {
        throw new Error(`Error fetching memories: ${error.message}`);
      }
      
      if (!memories || memories.length === 0) {
        return 0;
      }
      
      // Create indexes in metadata
      let updatedCount = 0;
      
      for (const memory of memories) {
        // Extract references from content
        const references = this.extractReferences(memory.content);
        
        // Update metadata with index information
        const metadata = {
          ...memory.metadata,
          _index: {
            references,
            indexed_at: new Date().toISOString()
          }
        };
        
        const { error: updateError } = await this.deps.supabase
          .from('memory_entries')
          .update({ metadata })
          .eq('id', memory.id)
          .eq('tenant_id', context.tenantId);
          
        if (!updateError) {
          updatedCount++;
        }
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Error creating memory indexes:', error);
      throw error;
    }
  }
  
  /**
   * Finds potentially corrupted memories
   * @param context Memory operation context
   * @param limit Maximum number of memories to check
   * @returns Array of potentially corrupted memory IDs
   */
  async findCorruptedMemories(
    context: MemoryContext,
    limit: number = 50
  ): Promise<string[]> {
    try {
      // Find memories with checksums
      const { data: memories, error } = await this.deps.supabase
        .from('memory_entries')
        .select('id, content, checksum')
        .eq('tenant_id', context.tenantId)
        .not('checksum', 'is', null)
        .limit(limit);
        
      if (error) {
        throw new Error(`Error fetching memories: ${error.message}`);
      }
      
      if (!memories || memories.length === 0) {
        return [];
      }
      
      // Check for corrupted memories
      const corruptedIds: string[] = [];
      
      for (const memory of memories) {
        const computedChecksum = await this.generateChecksum(memory.content);
        
        if (computedChecksum !== memory.checksum) {
          corruptedIds.push(memory.id);
        }
      }
      
      return corruptedIds;
    } catch (error) {
      console.error('Error finding corrupted memories:', error);
      throw error;
    }
  }
  
  /**
   * Retrieves memory by reference key
   * @param referenceKey Key to search for in memory references
   * @param context Memory operation context
   * @returns Memories containing the reference
   */
  async getMemoriesByReference(
    referenceKey: string,
    context: MemoryContext
  ): Promise<MemoryEntry[]> {
    try {
      // Search for memories with reference in metadata index
      const { data: memories, error } = await this.deps.supabase
        .from('memory_entries')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .contains('metadata', { _index: { references: [referenceKey] } });
        
      if (error) {
        throw new Error(`Error fetching memories by reference: ${error.message}`);
      }
      
      if (!memories || memories.length === 0) {
        // Try content search as fallback
        const result = await this.memoryManager.searchMemories(
          referenceKey,
          context,
          {
            matchThreshold: 0.6,
            limit: 10
          }
        );
        
        return result.entries;
      }
      
      return memories;
    } catch (error) {
      console.error('Error getting memories by reference:', error);
      throw error;
    }
  }
  
  /**
   * Creates an association between two memory entries
   * @param sourceMemoryId Source memory ID
   * @param targetMemoryId Target memory ID
   * @param associationType Type of association
   * @param context Memory operation context
   * @param strength Strength of association (0-1)
   * @returns Association ID
   */
  async createAssociation(
    sourceMemoryId: string,
    targetMemoryId: string,
    associationType: string,
    context: MemoryContext,
    strength: number = 0.5
  ): Promise<string> {
    try {
      const { data, error } = await this.deps.supabase
        .from('memory_associations')
        .insert({
          tenant_id: context.tenantId,
          source_memory_id: sourceMemoryId,
          target_memory_id: targetMemoryId,
          association_type: associationType,
          strength,
          metadata: {}
        })
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating association: ${error.message}`);
      }
      
      return data.id;
    } catch (error) {
      console.error('Error creating association:', error);
      throw error;
    }
  }
  
  /**
   * Gets associations for a memory
   * @param memoryId Memory ID
   * @param context Memory operation context
   * @param direction 'outgoing', 'incoming', or 'both'
   * @returns Array of associations
   */
  async getAssociations(
    memoryId: string,
    context: MemoryContext,
    direction: 'outgoing' | 'incoming' | 'both' = 'both'
  ): Promise<any[]> {
    try {
      let query = this.deps.supabase
        .from('memory_associations')
        .select(`
          id,
          association_type,
          strength,
          metadata,
          source_memory:source_memory_id(id, memory_type, source_type, content),
          target_memory:target_memory_id(id, memory_type, source_type, content)
        `)
        .eq('tenant_id', context.tenantId);
      
      if (direction === 'outgoing') {
        query = query.eq('source_memory_id', memoryId);
      } else if (direction === 'incoming') {
        query = query.eq('target_memory_id', memoryId);
      } else {
        query = query.or(`source_memory_id.eq.${memoryId},target_memory_id.eq.${memoryId}`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching associations: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting associations:', error);
      throw error;
    }
  }
  
  /**
   * Generates a checksum for content validation
   * @param content Content to generate checksum for
   * @returns SHA-256 checksum string
   */
  private async generateChecksum(content: any): Promise<string> {
    const contentString = typeof content === 'string' 
      ? content 
      : JSON.stringify(content);
    
    return await generateHash(contentString);
  }
  
  /**
   * Extracts potential references from memory content
   * @param content Memory content
   * @returns Array of extracted references
   */
  private extractReferences(content: any): string[] {
    const references: Set<string> = new Set();
    
    // Extract IDs and keys from content
    if (typeof content === 'string') {
      // Look for UUIDs
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
      const uuids = content.match(uuidRegex) || [];
      uuids.forEach(uuid => references.add(uuid));
      
      // Look for potential keys
      const keyRegex = /\b([a-z0-9_]+)(?:_id|Id)\b\s*[=:]\s*["']?([^"',\s}]+)/gi;
      let match;
      while ((match = keyRegex.exec(content)) !== null) {
        if (match[2]) references.add(match[2]);
      }
    } else if (typeof content === 'object' && content !== null) {
      // Extract from object
      const extractFromObj = (obj: any, path: string = '') => {
        for (const [key, value] of Object.entries(obj)) {
          // Look for ID fields
          if (
            (key.toLowerCase().endsWith('_id') || 
             key.endsWith('Id')) && 
            typeof value === 'string'
          ) {
            references.add(value);
          }
          
          // Recurse into nested objects
          if (typeof value === 'object' && value !== null) {
            extractFromObj(value, `${path}${key}.`);
          }
        }
      };
      
      extractFromObj(content);
    }
    
    return Array.from(references);
  }
}
