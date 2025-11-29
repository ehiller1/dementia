/**
 * Embeddings Utility
 * 
 * This module handles the creation and comparison of text embeddings
 * for semantic matching between user queries and agent capabilities.
 */

import { OpenAI } from 'openai';
import { supabase } from '@/integrations/supabase/client';

// Lazily initialize OpenAI client to avoid crashing app at import time
// when API key is not provided in the frontend environment.
function getOpenAI(): OpenAI | null {
  // Prefer Vite-exposed key in browser; fall back to process.env for Node
  const apiKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_OPENAI_API_KEY)
    || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    return new OpenAI({ apiKey });
  } catch (e) {
    console.error('Failed to initialize OpenAI client', e);
    return null;
  }
}

// Cache for embeddings to reduce API calls
const embeddingCache = new Map<string, number[]>();

/**
 * Generate an embedding vector for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Check cache first
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }
  
  try {
    const openai = getOpenAI();
    if (!openai) {
      // Do not crash the whole UI; surface a clear error to callers
      throw new Error('OPENAI API key is not configured for frontend embeddings (set VITE_OPENAI_API_KEY).');
    }
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    
    const embedding = response.data[0].embedding;
    
    // Cache the result
    embeddingCache.set(text, embedding);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
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
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Store embeddings for agent capabilities in the database
 */
export async function storeAgentCapabilityEmbeddings(
  agentId: string,
  capabilities: string[]
): Promise<void> {
  try {
    // Generate embeddings for each capability
    const embeddingPromises = capabilities.map(async (capability) => {
      const embedding = await generateEmbedding(capability);
      
      return {
        agent_id: agentId,
        capability,
        embedding,
      };
    });
    
    const embeddings = await Promise.all(embeddingPromises);
    
    // Store in database (using any type since we know our Supabase has this table)
    await (supabase as any).from('agent_capability_embeddings').upsert(
      embeddings,
      { onConflict: 'agent_id, capability' }
    );
    
  } catch (error) {
    console.error('Error storing agent capability embeddings:', error);
    throw new Error('Failed to store agent capability embeddings');
  }
}

/**
 * Find the most semantically similar agent based on query and capabilities
 */
export async function findSimilarAgents(
  query: string,
  threshold = 0.7
): Promise<Array<{ agentId: string; similarity: number }>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Get all agent capability embeddings from the database
    const { data: capabilities, error } = await (supabase as any)
      .from('agent_capability_embeddings')
      .select('agent_id, capability, embedding');
    
    if (error) {
      throw error;
    }
    
    if (!capabilities || capabilities.length === 0) {
      return [];
    }
    
    // Calculate similarity scores
    const similarityScores = capabilities.map((cap: any) => {
      const similarity = cosineSimilarity(queryEmbedding, cap.embedding);
      return {
        agentId: cap.agent_id,
        capability: cap.capability,
        similarity,
      };
    });
    
    // Group by agent and take max similarity for each agent
    const agentSimilarities = new Map<string, number>();
    
    for (const score of similarityScores) {
      const currentMax = agentSimilarities.get(score.agentId) || 0;
      if (score.similarity > currentMax) {
        agentSimilarities.set(score.agentId, score.similarity);
      }
    }
    
    // Convert to array and filter by threshold
    const results = Array.from(agentSimilarities.entries())
      .map(([agentId, similarity]) => ({ agentId, similarity }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
    
    return results;
  } catch (error) {
    console.error('Error finding similar agents:', error);
    return [];
  }
}
