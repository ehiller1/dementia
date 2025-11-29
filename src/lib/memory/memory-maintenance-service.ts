/**
 * Memory Maintenance Service
 * Handles memory cleanup, archiving, and optimization
 */

import { supabase } from '../../integrations/supabase/client.ts';
import { MemoryType, MemorySourceType, MemoryContext } from './types';

export interface MaintenanceConfig {
  // Working memory cleanup threshold in hours
  workingMemoryRetentionHours: number;
  
  // Short-term memory archival threshold in days
  shortTermMemoryRetentionDays: number;
  
  // Threshold for memory importance to keep regardless of age
  importantMemoryThreshold: number;
  
  // Number of entries to process in each batch
  batchSize: number;
  
  // Whether to archive memories instead of deleting
  archiveBeforeDelete: boolean;
}

/**
 * Memory Maintenance Service
 * Provides utilities for memory cleanup, archiving, and optimization
 */
export class MemoryMaintenanceService {
  private config: MaintenanceConfig;
  
  constructor(config?: Partial<MaintenanceConfig>) {
    this.config = {
      workingMemoryRetentionHours: 24,
      shortTermMemoryRetentionDays: 30,
      importantMemoryThreshold: 0.8,
      batchSize: 100,
      archiveBeforeDelete: true,
      ...config
    };
  }
  
  /**
   * Performs memory system maintenance tasks
   * @param tenantId Tenant ID
   * @returns Summary of maintenance actions
   */
  async performMaintenance(tenantId: string): Promise<{
    workingMemoryCleaned: number;
    shortTermMemoryArchived: number;
    orphanedAssociationsCleaned: number;
    duplicateMemoriesMerged: number;
    expiredMemoriesCleaned: number;
  }> {
    const result = {
      workingMemoryCleaned: 0,
      shortTermMemoryArchived: 0,
      orphanedAssociationsCleaned: 0,
      duplicateMemoriesMerged: 0,
      expiredMemoriesCleaned: 0
    };
    
    // Clean expired memories first
    result.expiredMemoriesCleaned = await this.cleanupExpiredMemories(tenantId);
    
    // Clean working memory
    result.workingMemoryCleaned = await this.cleanupWorkingMemory(tenantId);
    
    // Archive old short-term memory
    result.shortTermMemoryArchived = await this.archiveShortTermMemory(tenantId);
    
    // Clean orphaned associations
    result.orphanedAssociationsCleaned = await this.cleanupOrphanedAssociations(tenantId);
    
    // Merge duplicate memories
    result.duplicateMemoriesMerged = await this.mergeDuplicateMemories(tenantId);
    
    return result;
  }
  
  /**
   * Cleans up expired memories
   * @param tenantId Tenant ID
   * @returns Count of cleaned entries
   */
  async cleanupExpiredMemories(tenantId: string): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      // Find expired memories
      const { data: expiredMemories } = await supabase
        .from('memory_entries')
        .select('id')
        .eq('tenant_id', tenantId)
        .lt('expiration', now)
        .limit(this.config.batchSize);
      
      if (!expiredMemories || expiredMemories.length === 0) {
        return 0;
      }
      
      const expiredIds = expiredMemories.map(m => m.id);
      
      // Archive if configured
      if (this.config.archiveBeforeDelete) {
        await this.archiveMemories(tenantId, expiredIds);
      }
      
      // Delete expired memories
      const { error } = await supabase
        .from('memory_entries')
        .delete()
        .eq('tenant_id', tenantId)
        .in('id', expiredIds);
      
      if (error) {
        console.error('Error cleaning expired memories:', error);
        return 0;
      }
      
      return expiredIds.length;
    } catch (error) {
      console.error('Error in cleanupExpiredMemories:', error);
      return 0;
    }
  }
  
  /**
   * Cleans up working memory older than retention threshold
   * @param tenantId Tenant ID
   * @returns Count of cleaned entries
   */
  async cleanupWorkingMemory(tenantId: string): Promise<number> {
    try {
      // Calculate cutoff time
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - this.config.workingMemoryRetentionHours);
      
      // Find old working memories that are not important
      const { data: oldMemories } = await supabase
        .from('memory_entries')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('memory_type', MemoryType.WORKING)
        .lt('created_at', cutoffDate.toISOString())
        .lt('importance', this.config.importantMemoryThreshold)
        .limit(this.config.batchSize);
      
      if (!oldMemories || oldMemories.length === 0) {
        return 0;
      }
      
      const oldMemoryIds = oldMemories.map(m => m.id);
      
      // Delete old working memories
      const { error } = await supabase
        .from('memory_entries')
        .delete()
        .eq('tenant_id', tenantId)
        .in('id', oldMemoryIds);
      
      if (error) {
        console.error('Error cleaning working memories:', error);
        return 0;
      }
      
      return oldMemoryIds.length;
    } catch (error) {
      console.error('Error in cleanupWorkingMemory:', error);
      return 0;
    }
  }
  
  /**
   * Archives short-term memory older than retention threshold
   * @param tenantId Tenant ID
   * @returns Count of archived entries
   */
  async archiveShortTermMemory(tenantId: string): Promise<number> {
    try {
      // Calculate cutoff time
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.shortTermMemoryRetentionDays);
      
      // Find old short-term memories that are not important
      const { data: oldMemories } = await supabase
        .from('memory_entries')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('memory_type', MemoryType.SHORT_TERM)
        .lt('created_at', cutoffDate.toISOString())
        .lt('importance', this.config.importantMemoryThreshold)
        .limit(this.config.batchSize);
      
      if (!oldMemories || oldMemories.length === 0) {
        return 0;
      }
      
      const oldMemoryIds = oldMemories.map(m => m.id);
      
      // Archive memories
      await this.archiveMemories(tenantId, oldMemoryIds);
      
      // Delete archived memories
      const { error } = await supabase
        .from('memory_entries')
        .delete()
        .eq('tenant_id', tenantId)
        .in('id', oldMemoryIds);
      
      if (error) {
        console.error('Error deleting archived short-term memories:', error);
        return 0;
      }
      
      return oldMemoryIds.length;
    } catch (error) {
      console.error('Error in archiveShortTermMemory:', error);
      return 0;
    }
  }
  
  /**
   * Cleans up orphaned memory associations
   * @param tenantId Tenant ID
   * @returns Count of cleaned associations
   */
  async cleanupOrphanedAssociations(tenantId: string): Promise<number> {
    try {
      // First, find orphaned source associations
      const { data: orphanedSources } = await supabase.rpc(
        'find_orphaned_memory_associations',
        {
          p_tenant_id: tenantId,
          p_check_source: true
        }
      );
      
      // Then, find orphaned target associations
      const { data: orphanedTargets } = await supabase.rpc(
        'find_orphaned_memory_associations',
        {
          p_tenant_id: tenantId,
          p_check_source: false
        }
      );
      
      const orphanedIds = [
        ...(orphanedSources?.map(a => a.id) || []),
        ...(orphanedTargets?.map(a => a.id) || [])
      ];
      
      if (orphanedIds.length === 0) {
        return 0;
      }
      
      // Delete orphaned associations
      const { error } = await supabase
        .from('memory_associations')
        .delete()
        .eq('tenant_id', tenantId)
        .in('id', orphanedIds);
      
      if (error) {
        console.error('Error deleting orphaned associations:', error);
        return 0;
      }
      
      return orphanedIds.length;
    } catch (error) {
      console.error('Error in cleanupOrphanedAssociations:', error);
      return 0;
    }
  }
  
  /**
   * Merges duplicate memories
   * @param tenantId Tenant ID
   * @returns Count of merged memories
   */
  async mergeDuplicateMemories(tenantId: string): Promise<number> {
    try {
      // Find duplicate memories based on checksums
      const { data: duplicates } = await supabase.rpc(
        'find_duplicate_memories',
        {
          p_tenant_id: tenantId,
          p_limit: this.config.batchSize
        }
      );
      
      if (!duplicates || duplicates.length === 0) {
        return 0;
      }
      
      let mergedCount = 0;
      
      // Process each group of duplicates
      for (const group of duplicates) {
        // The first memory is the one we'll keep
        const primaryId = group.memory_ids[0];
        const duplicateIds = group.memory_ids.slice(1);
        
        // Update associations to point to the primary memory
        await supabase
          .from('memory_associations')
          .update({ source_memory_id: primaryId })
          .eq('tenant_id', tenantId)
          .in('source_memory_id', duplicateIds);
          
        await supabase
          .from('memory_associations')
          .update({ target_memory_id: primaryId })
          .eq('tenant_id', tenantId)
          .in('target_memory_id', duplicateIds);
        
        // Delete the duplicate memories
        await supabase
          .from('memory_entries')
          .delete()
          .eq('tenant_id', tenantId)
          .in('id', duplicateIds);
        
        mergedCount += duplicateIds.length;
      }
      
      return mergedCount;
    } catch (error) {
      console.error('Error in mergeDuplicateMemories:', error);
      return 0;
    }
  }
  
  /**
   * Optimizes memory embeddings (re-generates where needed)
   * @param tenantId Tenant ID
   * @returns Count of optimized memories
   */
  async optimizeEmbeddings(tenantId: string): Promise<number> {
    try {
      // Find memories with missing embeddings
      const { data: missingEmbeddings } = await supabase
        .from('memory_entries')
        .select('id, content')
        .eq('tenant_id', tenantId)
        .is('embedding', null)
        .limit(this.config.batchSize);
      
      if (!missingEmbeddings || missingEmbeddings.length === 0) {
        return 0;
      }
      
      // Call a function to generate embeddings for these memories
      const { data: result } = await supabase.rpc(
        'generate_missing_embeddings',
        {
          p_tenant_id: tenantId,
          p_memory_ids: missingEmbeddings.map(m => m.id)
        }
      );
      
      return result?.updated_count || 0;
    } catch (error) {
      console.error('Error in optimizeEmbeddings:', error);
      return 0;
    }
  }
  
  /**
   * Performs memory consistency check and repair
   * @param tenantId Tenant ID
   * @returns Result of consistency check
   */
  async checkAndRepairConsistency(tenantId: string): Promise<{
    checkedCount: number;
    repairedCount: number;
    errors: string[];
  }> {
    try {
      // Run consistency check
      const { data, error } = await supabase.rpc(
        'check_memory_consistency',
        {
          p_tenant_id: tenantId,
          p_repair: true,
          p_limit: this.config.batchSize
        }
      );
      
      if (error) {
        throw error;
      }
      
      return {
        checkedCount: data?.checked_count || 0,
        repairedCount: data?.repaired_count || 0,
        errors: data?.errors || []
      };
    } catch (error) {
      console.error('Error in checkAndRepairConsistency:', error);
      return {
        checkedCount: 0,
        repairedCount: 0,
        errors: [`Error: ${error.message}`]
      };
    }
  }
  
  /**
   * Archives memories before deletion
   * @param tenantId Tenant ID
   * @param memoryIds Memory IDs to archive
   * @returns Success status
   */
  private async archiveMemories(
    tenantId: string,
    memoryIds: string[]
  ): Promise<boolean> {
    try {
      if (!this.config.archiveBeforeDelete || memoryIds.length === 0) {
        return true;
      }
      
      // Fetch memories to archive
      const { data: memories } = await supabase
        .from('memory_entries')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('id', memoryIds);
      
      if (!memories || memories.length === 0) {
        return true;
      }
      
      // Insert into memory archives
      const archiveEntries = memories.map(memory => ({
        tenant_id: memory.tenant_id,
        original_id: memory.id,
        user_id: memory.user_id,
        memory_type: memory.memory_type,
        source_type: memory.source_type,
        source_id: memory.source_id,
        content: memory.content,
        metadata: memory.metadata,
        checksum: memory.checksum,
        importance: memory.importance,
        created_at: memory.created_at,
        original_expiration: memory.expiration,
        archived_at: new Date()
      }));
      
      const { error } = await supabase
        .from('memory_archives')
        .insert(archiveEntries);
      
      if (error) {
        console.error('Error archiving memories:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in archiveMemories:', error);
      return false;
    }
  }
  
  /**
   * Schedules regular maintenance
   * @param tenantId Tenant ID
   * @param intervalMinutes Minutes between maintenance runs
   * @returns Timer ID
   */
  scheduleRegularMaintenance(tenantId: string, intervalMinutes: number = 60): NodeJS.Timeout {
    console.log(`Scheduling regular maintenance for tenant ${tenantId} every ${intervalMinutes} minutes`);
    
    return setInterval(async () => {
      console.log(`Running scheduled maintenance for tenant ${tenantId}`);
      try {
        const result = await this.performMaintenance(tenantId);
        console.log(`Maintenance completed:`, result);
      } catch (error) {
        console.error(`Maintenance error for tenant ${tenantId}:`, error);
      }
    }, intervalMinutes * 60 * 1000);
  }
  
  /**
   * Cancels scheduled maintenance
   * @param timerId Timer ID
   */
  cancelScheduledMaintenance(timerId: NodeJS.Timeout): void {
    clearInterval(timerId);
  }
}
