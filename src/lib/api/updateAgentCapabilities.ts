/**
 * Agent Capability Management API
 * 
 * This module provides functionality to update agent capabilities
 * and generate embeddings for improved semantic matching.
 */

import { supabase } from '@/integrations/supabase/client';
import { generateEmbedding } from '@/lib/embeddings';

export interface AgentCapability {
  name: string;
  description: string;
}

/**
 * Updates an agent's capabilities and generates embeddings for semantic matching
 */
export async function updateAgentCapabilities(
  agentId: string, 
  capabilities: AgentCapability[]
): Promise<boolean> {
  try {
    // First update the agent's capabilities in the agents table
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        capabilities: capabilities,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);
    
    if (updateError) {
      console.error('Error updating agent capabilities:', updateError);
      return false;
    }
    
    // Delete existing capability embeddings for this agent
    const { error: deleteError } = await supabase
      .from('agent_capability_embeddings')
      .delete()
      .eq('agent_id', agentId);
    
    if (deleteError) {
      console.error('Error removing existing capability embeddings:', deleteError);
    }
    
    // Generate embeddings for each capability
    const embeddingPromises = capabilities.map(async (capability) => {
      // Create combined description for better semantic matching
      const combinedText = `${capability.name}: ${capability.description}`;
      
      // Generate embedding
      const embedding = await generateEmbedding(combinedText);
      
      // Return formatted record for database
      return {
        agent_id: agentId,
        capability: combinedText,
        embedding
      };
    });
    
    // Wait for all embeddings to be generated
    const embeddingRecords = await Promise.all(embeddingPromises);
    
    // Insert embeddings into database
    const { error: insertError } = await supabase
      .from('agent_capability_embeddings')
      .insert(embeddingRecords);
    
    if (insertError) {
      console.error('Error storing agent capability embeddings:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error updating agent capabilities:', error);
    return false;
  }
}

/**
 * Refreshes embeddings for all agents in the database
 * Useful for batch updates or when embedding model changes
 */
export async function refreshAllAgentEmbeddings(): Promise<{
  success: boolean;
  processed: number;
  failed: number;
}> {
  try {
    // Fetch all agents with capabilities
    const { data: agents, error: fetchError } = await supabase
      .from('agents')
      .select('id, capabilities');
    
    if (fetchError || !agents) {
      console.error('Error fetching agents:', fetchError);
      return { success: false, processed: 0, failed: 0 };
    }
    
    let processed = 0;
    let failed = 0;
    
    // Process each agent
    for (const agent of agents) {
      if (agent.capabilities && agent.capabilities.length > 0) {
        const success = await updateAgentCapabilities(
          agent.id,
          agent.capabilities
        );
        
        if (success) {
          processed++;
        } else {
          failed++;
        }
      }
    }
    
    return {
      success: true,
      processed,
      failed
    };
  } catch (error) {
    console.error('Unexpected error refreshing agent embeddings:', error);
    return { success: false, processed: 0, failed: 0 };
  }
}
