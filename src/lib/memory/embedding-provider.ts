/**
 * Embedding Provider
 * Provides vector embeddings for semantic memory search
 */

import { EmbeddingProvider } from './types.ts';
import { OpenAI } from 'openai';
import { getEmbeddingModelName } from '../../utils/env.ts';

/**
 * Generate a SHA-256 hash of the input string using Web Crypto API
 * @param input Input string to hash
 * @returns Hex string of the hash
 */
async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * OpenAI-based embedding provider
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private openai: OpenAI;
  private modelName: string;
  private cache: Map<string, number[]> = new Map();
  private cacheSize: number = 1000; // Maximum cache size

  constructor(apiKey?: string, modelName?: string) {
    // In browser environment, we'll rely on the provided API key or a default empty string
    // The actual API key should be provided when instantiating this class
    this.openai = new OpenAI({
      apiKey: apiKey || '',
      dangerouslyAllowBrowser: true // Allow usage in browser for testing purposes
    });
    this.modelName = modelName || getEmbeddingModelName() || 'text-embedding-ada-002';
  }

  /**
   * Generates an embedding vector for the given text
   * @param text Text to generate embedding for
   * @returns Vector embedding as number array
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Normalize text for consistent caching
    const normalizedText = text.trim().toLowerCase();
    
    // Check cache first
    if (this.cache.has(normalizedText)) {
      return this.cache.get(normalizedText)!;
    }
    
    try {
      const response = await this.openai.embeddings.create({
        model: this.modelName,
        input: normalizedText,
      });
      
      const embedding = response.data[0].embedding;
      
      // Cache the result
      this.addToCache(normalizedText, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message || error}`);
    }
  }

  /**
   * Calculates the cosine similarity between two embedding vectors
   * @param a First embedding vector
   * @param b Second embedding vector
   * @returns Similarity score between 0 and 1
   */
  similarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embedding vectors must have the same length');
    }
    
    let dotProduct = 0;
    let aMagnitude = 0;
    let bMagnitude = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      aMagnitude += a[i] * a[i];
      bMagnitude += b[i] * b[i];
    }
    
    aMagnitude = Math.sqrt(aMagnitude);
    bMagnitude = Math.sqrt(bMagnitude);
    
    if (aMagnitude === 0 || bMagnitude === 0) {
      return 0;
    }
    
    return dotProduct / (aMagnitude * bMagnitude);
  }
  
  /**
   * Adds an embedding to the cache, managing cache size
   * @param text The text key
   * @param embedding The embedding vector
   */
  private addToCache(text: string, embedding: number[]): void {
    // If cache is full, remove the oldest entry
    if (this.cache.size >= this.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(text, embedding);
  }
}

/**
 * Mock embedding provider for browser testing
 * Generates deterministic embeddings based on text hash
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  private cache: Map<string, number[]> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  /**
   * Generates a deterministic embedding vector for the given text
   * @param text Text to generate embedding for
   * @returns Vector embedding as number array
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Normalize text for consistent caching
    const normalizedText = text.trim().toLowerCase();
    
    // Check cache first
    if (this.cache.has(normalizedText)) {
      return this.cache.get(normalizedText)!;
    }
    
    // Generate a deterministic embedding based on the text
    // This is a simple hash-based approach for testing purposes
    const embedding = await this.generateDeterministicEmbedding(normalizedText);
    
    // Cache the result
    this.cache.set(normalizedText, embedding);
    
    return embedding;
  }

  /**
   * Generates a deterministic embedding based on text hash
   * @param text Input text
   * @returns Embedding vector
   */
  private async generateDeterministicEmbedding(text: string): Promise<number[]> {
    // Generate a hash of the text
    const hash = await generateHash(text);
    
    // Use the hash to seed a deterministic embedding
    // We'll use 1536 dimensions to match OpenAI's embedding size
    const embedding: number[] = [];
    
    // Use hash characters to seed the embedding values
    for (let i = 0; i < 1536; i++) {
      const hashChar = hash.charCodeAt(i % hash.length);
      // Generate a value between -1 and 1
      const value = (hashChar / 255) * 2 - 1;
      embedding.push(value);
    }
    
    // Normalize the embedding to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  
  /**
   * Calculates cosine similarity between two embedding vectors
   * @param a First embedding vector
   * @param b Second embedding vector
   * @returns Similarity score between 0 and 1
   */
  similarity(a: number[], b: number[]): number {
    // Calculate cosine similarity
    let dotProduct = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
    }
    
    // Since embeddings are normalized to unit length, dot product equals cosine similarity
    return (dotProduct + 1) / 2; // Scale from [-1,1] to [0,1]
  }
}

/**
 * Creates a default embedding provider
 * @returns Configured embedding provider
 */
export function createDefaultEmbeddingProvider(): EmbeddingProvider {
  // For browser environments
  if (typeof window !== 'undefined') {
    const apiKey = typeof import.meta !== 'undefined' ? import.meta.env.VITE_OPENAI_API_KEY : undefined;

    if (apiKey && apiKey.trim() !== '') {
      console.log('Using OpenAI embedding provider for browser environment');
      return new OpenAIEmbeddingProvider(apiKey);
    } else {
      console.log('Using mock embedding provider for browser environment (VITE_OPENAI_API_KEY not found)');
      return new MockEmbeddingProvider();
    }
  }

  // For server environments, the OpenAI library automatically uses process.env.OPENAI_API_KEY
  return new OpenAIEmbeddingProvider();
}
