/**
 * Intent Classifier
 * 
 * This module provides basic intent classification capabilities for user queries.
 */

import { ExtendedIntent } from '../decision-templates/types.ts';

/**
 * Classify a user query into different intent types
 * @param query The user query to classify
 * @returns The classified intent object
 */
export async function classifyIntent(query: string): Promise<ExtendedIntent> {
  // Simple classification logic for demonstration purposes
  // In a real implementation, this would use a more sophisticated model
  
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('help me decide') || 
      queryLower.includes('evaluate') ||
      queryLower.includes('compare') ||
      queryLower.includes('analyze') ||
      queryLower.includes('risk') ||
      queryLower.includes('option')) {
    return {
      type: 'action',
      action: 'evaluate',
      confidence: 0.85
    };
  } else if (queryLower.includes('what') || 
             queryLower.includes('how') ||
             queryLower.includes('when') ||
             queryLower.includes('where') ||
             queryLower.includes('who') ||
             queryLower.includes('why')) {
    return {
      type: 'informational',
      confidence: 0.9
    };
  } else {
    // Default to action intent
    return {
      type: 'action',
      action: 'general',
      confidence: 0.6
    };
  }
}
