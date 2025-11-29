/**
 * ResultCache - A caching system for storing and retrieving CrewAI analysis results
 * to improve performance by avoiding redundant computations.
 */

import { FeedbackLoopManager } from './feedback-loop.ts';

/**
 * Type for the input parameters that define a seasonality analysis request
 */
export interface SeasonalityCacheKey {
  query: string;
  dataDescription: string;
  period: string;
  analysisType: string;
  csvData?: string;
}

/**
 * Type for cached results
 */
export interface CachedResult {
  result: any;
  timestamp: number;
  feedbackMetrics?: any;
}

/**
 * Configuration options for the result cache
 */
export interface ResultCacheConfig {
  /** Maximum number of cached items to store */
  maxItems?: number;
  /** Maximum age of cached items in milliseconds before they expire */
  maxAgeMs?: number;
  /** Whether to enable cache invalidation based on age */
  enableExpiry?: boolean;
}

/**
 * ResultCache class for managing cached results from CrewAI executions
 */
export class ResultCache {
  private cache: Map<string, CachedResult> = new Map();
  private config: ResultCacheConfig;
  
  constructor(config: ResultCacheConfig = {}) {
    // Default configuration
    this.config = {
      maxItems: config.maxItems || 50,
      maxAgeMs: config.maxAgeMs || 24 * 60 * 60 * 1000, // 24 hours by default
      enableExpiry: config.enableExpiry ?? true
    };
  }
  
  /**
   * Generate a unique key for the cache based on input parameters
   */
  private generateCacheKey(params: SeasonalityCacheKey): string {
    // Create a normalized representation of the input parameters
    const normalizedQuery = params.query.trim().toLowerCase();
    const normalizedDescription = params.dataDescription.trim().toLowerCase();
    
    // For CSV data, we use a hash of the content rather than the full content
    const csvHash = params.csvData ? this.hashString(params.csvData) : 'no-csv';
    
    // Combine all parameters into a unique key
    return `${normalizedQuery}::${normalizedDescription}::${params.period}::${params.analysisType}::${csvHash}`;
  }
  
  /**
   * Simple string hashing function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Ensure it's converted to string
    return String(hash.toString(16)); // Convert to hex string
  }
  
  /**
   * Check if a result is cached and still valid
   */
  has(params: SeasonalityCacheKey): boolean {
    const key = this.generateCacheKey(params);
    
    if (!this.cache.has(key)) {
      return false;
    }
    
    // Check if cache entry has expired
    if (this.config.enableExpiry) {
      const cached = this.cache.get(key)!;
      const now = Date.now();
      
      if (now - cached.timestamp > this.config.maxAgeMs!) {
        // Remove expired item
        this.cache.delete(key);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Store a result in the cache
   */
  set(params: SeasonalityCacheKey, result: any, feedbackLoop?: FeedbackLoopManager | null): void {
    const key = this.generateCacheKey(params);
    
    // Extract feedback metrics if available
    const feedbackMetrics = feedbackLoop ? {
      dataPreprocessing: feedbackLoop.getImprovementMetrics('data-preprocessing', 'Data Preparation Specialist'),
      seasonalityAnalysis: feedbackLoop.getImprovementMetrics('seasonality-analysis', 'Seasonality Analyst'),
      businessInsights: feedbackLoop.getImprovementMetrics('business-insights', 'Business Insights Specialist'),
      visualization: feedbackLoop.getImprovementMetrics('visualization', 'Visualization Specialist')
    } : undefined;
    
    // Store the result with a timestamp
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      feedbackMetrics
    });
    
    // Check if we need to evict old items (LRU-like behavior)
    this.evictIfNeeded();
  }
  
  /**
   * Retrieve a cached result
   */
  get(params: SeasonalityCacheKey): any | null {
    const key = this.generateCacheKey(params);
    
    if (!this.has(params)) {
      return null;
    }
    
    const cached = this.cache.get(key)!;
    
    // Return the cached result
    return {
      ...cached.result,
      execution_details: {
        ...(cached.result.execution_details || {}),
        fromCache: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
        feedbackMetrics: cached.feedbackMetrics
      }
    };
  }
  
  /**
   * Evict items if the cache exceeds the maximum size
   */
  private evictIfNeeded(): void {
    if (this.cache.size <= this.config.maxItems!) {
      return;
    }
    
    // Find the oldest items if we need to evict
    const items = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest items until we're under the limit
    while (items.length > this.config.maxItems!) {
      const [key] = items.shift()!;
      this.cache.delete(key);
    }
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; oldestTimestamp: number | null } {
    let oldestTimestamp: number | null = null;
    
    if (this.cache.size > 0) {
      oldestTimestamp = Math.min(
        ...Array.from(this.cache.values()).map(item => item.timestamp)
      );
    }
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxItems!,
      oldestTimestamp
    };
  }
}
