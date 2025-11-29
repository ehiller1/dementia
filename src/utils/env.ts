/**
 * Environment utility functions
 * Provides access to environment variables and configuration settings
 */

/**
 * Get the embedding model name from environment variables
 * @returns The name of the embedding model to use
 */
export function getEmbeddingModelName(): string {
  // Check if running in browser (Vite) environment
  if (typeof window !== 'undefined' && typeof import.meta !== 'undefined') {
    const envValue = (import.meta as any).env?.VITE_EMBEDDING_MODEL;
    return envValue || 'text-embedding-ada-002';
  }
  return process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
}

/**
 * Get the OpenAI API key from environment variables
 * @returns The OpenAI API key
 */
export function getOpenAIApiKey(): string | undefined {
  // Check if running in browser (Vite) environment
  if (typeof window !== 'undefined' && typeof import.meta !== 'undefined') {
    return (import.meta as any).env?.VITE_OPENAI_API_KEY;
  }
  return process.env.OPENAI_API_KEY;
}

/**
 * Check if the application is running in development mode
 * @returns True if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if the application is running in production mode
 * @returns True if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
