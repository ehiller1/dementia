/**
 * Mock OpenAI Embeddings Module
 * 
 * This is a mock implementation for testing purposes.
 */

export async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`Generating mock embedding for: ${text.substring(0, 50)}...`);
  // Return a mock embedding vector (1536 dimensions)
  return Array(1536).fill(0).map(() => Math.random() - 0.5);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(generateEmbedding));
}
