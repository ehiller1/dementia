/**
 * Message Processing Pipeline Hook
 * 
 * This hook combines the intent router, agent registry, agent activation,
 * and RAG systems into a unified processing pipeline for handling user queries.
 */

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useIntentRouter, IntentClassificationRequest, IntentClassificationResult } from './useIntentRouter';
import { useAgentRegistry } from './useAgentRegistry';
import { useAgentActivation } from './useAgentActivation';
import { useRAG } from './useRAG';

export interface ProcessMessageRequest {
  query: string;
  conversationId: string;
  conversationHistory?: Array<{
    role: 'user' | 'system' | 'agent' | 'seasonality';
    content: string;
  }>;
  context?: string;
  skipAgentExecution?: boolean;
  forceIntentType?: 'information' | 'action';
  specificAgentId?: string;
  memoryContext?: {
    shortTerm?: any;
    longTerm?: any[];
    conversationHistory?: any[];
  };
}

export interface ProcessMessageResult {
  query: string;
  intentClassification: IntentClassificationResult;
  informationResult?: {
    content: string;
    sources: Array<{
      id: string;
      title: string;
      relevance: number;
    }>;
  };
  agentResult?: {
    agentId: string;
    agentName: string;
    executionId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: any;
    error?: string;
  };
  processedAt: Date;
  // ACT-R INTEGRATION: TurnEnvelope for EnhancedTurnRenderer
  turnEnvelope?: any;
  // WINDSURF INTEGRATION: Incremental narrative updates for live streaming
  narrativeUpdates?: Array<{
    type: string;
    content: string;
    source?: string;
    metadata?: any;
  }>;
  // WINDSURF INTEGRATION: Workflow execution updates for progress tracking
  workflowUpdates?: Array<{
    type: string;
    status?: string;
    metadata?: any;
  }>;
  // CONVERSATIONAL FLOW: Parsed executive messages from conversation_creator
  parsedMessages?: Array<{
    id: string;
    type: string;
    content: string;
    meta?: any;
  }>;
  // BUSINESS INSIGHTS: Canonical executive data
  businessInsights?: any;
  // ITERATION METADATA: For ACT-R reflection loop
  _iterationMeta?: {
    autoExecutedTasks?: number;
    systemDirectedTasks?: any[];
    shouldTriggerReflection?: boolean;
    nextAction?: string;
  };
  // TEMPLATE DISCOVERY: Selected templates for execution
  templateDiscovery?: any;
}

export interface MessagePipelineOptions {
  ragOptions?: {
    limit?: number;
    threshold?: number;
  };
  agentOptions?: {
    limit?: number;
    threshold?: number;
  };
}

export const useMessageProcessor = (options: MessagePipelineOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Import hooks for various processing stages
  const { classifyIntent } = useIntentRouter();
  const { discoverAgents, getAgentById } = useAgentRegistry();
  const { executeAgent } = useAgentActivation();
  const { searchKnowledge } = useRAG();
  
  /**
   * Process a message through the entire pipeline:
   * 1. Intent classification
   * 2. Based on intent:
   *    a. For information: RAG search and response generation
   *    b. For action: Agent discovery, selection and execution
   */
  const processMessage = async (request: ProcessMessageRequest): Promise<ProcessMessageResult> => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      // Prepare the base result object
      const result: Partial<ProcessMessageResult> = {
        query: request.query,
        processedAt: new Date()
      };
      
      // Step 1: Intent Classification (unless forced)
      let intentResult: IntentClassificationResult;
      
      if (request.forceIntentType) {
        // Use forced intent type if specified
        intentResult = {
          type: request.forceIntentType,
          intent: request.forceIntentType,
          confidence: 1.0,
          explanation: `Intent type forced to ${request.forceIntentType}`
        };
      } else {
        // Classify intent normally
        const intentRequest: IntentClassificationRequest = {
          query: request.query,
          conversationHistory: request.conversationHistory,
          context: request.context
        };
        
        intentResult = await classifyIntent(intentRequest);
      }
      
      result.intentClassification = intentResult;
      
      // Step 2: Process based on intent type
      if (intentResult.intent === 'information') {
        // Information Intent: Use RAG system
        const ragLimit = options.ragOptions?.limit || 5;
        const ragThreshold = options.ragOptions?.threshold || 0.7;
        
        // Perform RAG search
        const ragResults = await searchKnowledge({
          query: request.query,
          limit: ragLimit,
          threshold: ragThreshold
        });
        
        // Process RAG results
        if (ragResults && ragResults.length > 0) {
          // Extract information from results
          const sources = ragResults.map(item => ({
            id: item.id || '',
            title: item.title || item.id || 'Untitled',
            relevance: item.similarity || 0
          }));
          
          // Combine information from top results
          let responseContent = '';
          
          // Use the top result as the main content
          if (ragResults[0].content) {
            responseContent = ragResults[0].content;
          } else {
            responseContent = "I found some information, but couldn't generate a complete response.";
          }
          
          result.informationResult = {
            content: responseContent,
            sources
          };
        } else {
          // No relevant information found
          result.informationResult = {
            content: "I don't have specific information about that query in my knowledge base.",
            sources: []
          };
        }
      } else {
        // Action Intent: Discover and execute agents
        
        // Skip agent execution if requested
        if (request.skipAgentExecution) {
          return result as ProcessMessageResult;
        }
        
        // Get agent by ID if specified, otherwise discover
        let targetAgentId = request.specificAgentId;
        let agentName = 'Unknown Agent';
        
        if (!targetAgentId) {
          // Discover relevant agents
          const agentLimit = options.agentOptions?.limit || 3;
          const agentThreshold = options.agentOptions?.threshold || 0.65;
          
          const agentResults = await discoverAgents({
            query: request.query,
            limit: agentLimit,
            threshold: agentThreshold
          });
          
          if (agentResults && agentResults.length > 0) {
            // Select the most relevant agent
            targetAgentId = agentResults[0].id;
            agentName = agentResults[0].name;
          } else {
            // No suitable agent found
            result.agentResult = {
              agentId: '',
              agentName: '',
              executionId: '',
              status: 'failed',
              error: 'No suitable agent found for this request'
            };
            
            return result as ProcessMessageResult;
          }
        } else {
          // Get agent details for the specified ID
          const agent = await getAgentById(targetAgentId);
          if (agent) {
            agentName = agent.name;
          }
        }
        
        // Execute the selected agent
        const executionResult = await executeAgent({
          agentId: targetAgentId,
          query: request.query,
          conversationId: request.conversationId,
          parameters: {},
          intentClassification: intentResult,
          context: request.context
        });
        
        // Process execution result
        result.agentResult = {
          agentId: targetAgentId,
          agentName,
          executionId: executionResult.executionId,
          status: executionResult.status === 'success' ? 'completed' : 
                  executionResult.status === 'error' ? 'failed' : 
                  executionResult.status === 'cancelled' ? 'failed' : 'in_progress',
          result: executionResult.results,
          error: executionResult.error
        };
      }
      
      return result as ProcessMessageResult;
    } catch (error) {
      console.error('Message processing error:', error);
      
      toast({
        title: 'Processing Error',
        description: `Failed to process message: ${error.message}`,
        variant: 'destructive',
      });
      
      // Return error result
      return {
        query: request.query,
        intentClassification: {
          type: 'information',
          intent: 'information', // Default to information on error
          confidence: 0,
          explanation: `Error during processing: ${error.message}`
        },
        processedAt: new Date()
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    processMessage,
    isProcessing
  };
};
