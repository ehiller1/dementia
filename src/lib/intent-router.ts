/**
 * Intent Router
 * 
 * This module classifies user queries into intents and actions
 * to determine how they should be processed.
 */

export interface Intent {
  type: 'rag' | 'action' | 'clarification' | 'chitchat';
  action?: string;
  confidence: number;
  details?: Record<string, any>;
  // Enhanced action detection
  actionType?: 'continue_previous' | 'execute_specific' | 'delegate_to_agent' | 'approve_decision' | 'start_workflow';
  actionTarget?: string;  // What to act on (e.g., "inventory optimization")
  requiresContext: boolean;  // Does this need previous conversation context?
  contextKeys?: string[];  // What context is needed (e.g., ['lastRecommendations'])
}

/**
 * Classify a user query into an intent type
 * 
 * @param query The user's message
 * @param context Optional additional context to guide classification
 * @returns The classified intent
 */
export async function classifyIntent(
  query: string,
  context: string = ''
): Promise<Intent> {
  try {
    // Simple rule-based classification for common patterns
    const lowerQuery = query.toLowerCase().trim();
    
    // Check for action keywords
    const actionKeywords = ['proceed', 'do it', 'go ahead', 'continue', 'execute', 'make it happen', 'start', 'begin', 'implement', 'run'];
    const isAction = actionKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // Check for continuation keywords
    const continuationKeywords = ['proceed', 'continue', 'next', 'go ahead', 'do it'];
    const isContinuation = continuationKeywords.some(keyword => lowerQuery === keyword || lowerQuery.startsWith(keyword));
    
    // Check for context references
    const contextReferences = ['that', 'those', 'it', 'the recommendation', 'this', 'these'];
    const requiresContext = contextReferences.some(ref => lowerQuery.includes(ref));
    
    if (isAction) {
      const result: Intent = {
        type: 'action',
        action: isContinuation ? 'Continue with previous recommendations' : 'Execute action',
        actionType: isContinuation ? 'continue_previous' : 'execute_specific',
        requiresContext: isContinuation || requiresContext,
        contextKeys: isContinuation ? ['lastRecommendations', 'pendingActions'] : [],
        confidence: 0.85
      };
      console.log('Intent classification result:', result);
      return result;
    }
    
    // Default to RAG for information queries
    const result: Intent = {
      type: 'rag',
      action: 'Information retrieval',
      requiresContext: requiresContext,
      contextKeys: requiresContext ? ['conversationHistory'] : [],
      confidence: 0.75
    };
    console.log('Intent classification result:', result);
    return result;
    
  } catch (error) {
    console.error('Error classifying intent:', error);
    // Default to RAG on error
    return {
      type: 'rag',
      confidence: 0.5,
      requiresContext: false
    };
  }
}
