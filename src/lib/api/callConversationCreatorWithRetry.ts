/**
 * Retry wrapper for conversation_creator with forced fence enforcement
 * Ensures we always get fenced TurnEnvelope output from the model
 */

import { parseFencedBlocks } from '../util/parseFencedBlocks';
import { FORCE_FENCES_SYSTEM, FORCE_FENCES_USER } from '../prompts/forceFences';

interface ConversationCreatorRequest {
  query: string;
  context?: any;
  userId?: string;
}

interface LLMRequest {
  system: string;
  user: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Call the conversation_creator endpoint
 */
async function callConversationCreator(request: ConversationCreatorRequest): Promise<string> {
  console.log('[callConversationCreator] Calling backend with query:', request.query);
  
  try {
    const response = await fetch('/api/process-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: request.query,
        query: request.query,
        conversationId: request.context?.conversationId || 'main_conversation',
        userId: request.userId || 'anonymous',
        context: request.context
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const conversationalResponse = data.conversationalResponse || data.response || '';
    
    console.log('[callConversationCreator] Response length:', conversationalResponse.length);
    return conversationalResponse;
  } catch (error) {
    console.error('[callConversationCreator] Error:', error);
    throw error;
  }
}

/**
 * Call LLM directly with system/user prompts
 * Used for forced retry with strict fence requirements
 */
async function callLLMDirect(request: LLMRequest): Promise<string> {
  console.log('[callLLMDirect] Calling LLM with forced fences prompt');
  
  try {
    const response = await fetch('/api/llm-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM direct call failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.response || '';
    
    console.log('[callLLMDirect] Response length:', content.length);
    return content;
  } catch (error) {
    console.error('[callLLMDirect] Error:', error);
    throw error;
  }
}

/**
 * Call conversation_creator with automatic retry using forced fences
 * 
 * Flow:
 * 1. First attempt: Normal conversation_creator call
 * 2. Check for JSON fence in response
 * 3. If no fence: Retry with FORCE_FENCES strict prompt
 * 4. Return best available response
 * 
 * @param query - User's query
 * @param context - Optional context data
 * @returns Conversational response (hopefully with fenced TurnEnvelope)
 */
export async function callConversationCreatorWithRetry(
  query: string,
  context?: any
): Promise<string> {
  console.log('[callConversationCreatorWithRetry] Starting with query:', query);
  
  // First attempt: Normal conversation_creator
  let firstAttempt: string;
  try {
    firstAttempt = await callConversationCreator({ query, context });
  } catch (error) {
    console.error('[callConversationCreatorWithRetry] First attempt failed:', error);
    // If first attempt fails completely, try forced fences immediately
    console.warn('[callConversationCreatorWithRetry] ⚠️ First attempt failed, trying forced fences');
    return await callLLMDirect({
      system: FORCE_FENCES_SYSTEM,
      user: FORCE_FENCES_USER(query),
      temperature: 0.7,
      max_tokens: 2000
    });
  }
  
  // Parse and check for JSON fence
  const blocks = parseFencedBlocks(firstAttempt);
  
  if (blocks.hasJson) {
    console.log('[callConversationCreatorWithRetry] ✅ First attempt has JSON fence - using it');
    return firstAttempt;
  }
  
  // No JSON fence found - retry with forced fences
  console.warn('[callConversationCreatorWithRetry] ⚠️ No JSON fence in first attempt - retrying with FORCE_FENCES');
  console.log('[callConversationCreatorWithRetry] First attempt preview:', firstAttempt.substring(0, 200));
  
  try {
    const forcedAttempt = await callLLMDirect({
      system: FORCE_FENCES_SYSTEM,
      user: FORCE_FENCES_USER(query),
      temperature: 0.5, // Lower temperature for more structured output
      max_tokens: 2000
    });
    
    const forcedBlocks = parseFencedBlocks(forcedAttempt);
    
    if (forcedBlocks.hasJson) {
      console.log('[callConversationCreatorWithRetry] ✅ Forced attempt has JSON fence - using it');
      return forcedAttempt;
    } else {
      console.error('[callConversationCreatorWithRetry] ❌ Forced attempt STILL has no JSON fence');
      console.log('[callConversationCreatorWithRetry] Forced attempt preview:', forcedAttempt.substring(0, 200));
      // Return forced attempt anyway - it might have better structure
      return forcedAttempt;
    }
  } catch (retryError) {
    console.error('[callConversationCreatorWithRetry] Retry failed:', retryError);
    // Fall back to first attempt if retry fails
    console.warn('[callConversationCreatorWithRetry] Using first attempt as fallback');
    return firstAttempt;
  }
}

/**
 * Batch retry for multiple queries
 * Useful for testing or bulk operations
 */
export async function callConversationCreatorBatch(
  queries: string[],
  context?: any
): Promise<string[]> {
  console.log(`[callConversationCreatorBatch] Processing ${queries.length} queries`);
  
  const results = await Promise.all(
    queries.map(query => callConversationCreatorWithRetry(query, context))
  );
  
  const successCount = results.filter(r => parseFencedBlocks(r).hasJson).length;
  console.log(`[callConversationCreatorBatch] ✅ ${successCount}/${queries.length} have JSON fences`);
  
  return results;
}

/**
 * Test helper to validate fence enforcement
 */
export async function testFenceEnforcement(query: string): Promise<{
  firstAttemptHasFence: boolean;
  retryNeeded: boolean;
  finalHasFence: boolean;
  response: string;
}> {
  console.log('[testFenceEnforcement] Testing with query:', query);
  
  const firstAttempt = await callConversationCreator({ query });
  const firstBlocks = parseFencedBlocks(firstAttempt);
  const firstAttemptHasFence = firstBlocks.hasJson;
  
  if (firstAttemptHasFence) {
    return {
      firstAttemptHasFence: true,
      retryNeeded: false,
      finalHasFence: true,
      response: firstAttempt
    };
  }
  
  // Retry needed
  const forcedAttempt = await callLLMDirect({
    system: FORCE_FENCES_SYSTEM,
    user: FORCE_FENCES_USER(query),
    temperature: 0.5,
    max_tokens: 2000
  });
  
  const forcedBlocks = parseFencedBlocks(forcedAttempt);
  
  return {
    firstAttemptHasFence: false,
    retryNeeded: true,
    finalHasFence: forcedBlocks.hasJson,
    response: forcedAttempt
  };
}
