/**
 * Enhanced Message Processing Hook with Knowledge Graph Integration
 * 
 * This hook extends the standard message processor by integrating knowledge graph
 * context for improved understanding of domain-specific concepts in user queries.
 */

import { useState } from 'react';
import { useMessageProcessor, ProcessMessageRequest, ProcessMessageResult } from './useMessageProcessor.ts';
import { useKnowledgeGraph } from '../services/knowledgeGraphService.ts';
import { useToast } from '../components/ui/use-toast.ts';

export interface EnhancedProcessMessageRequest extends ProcessMessageRequest {
  enableKnowledgeGraph?: boolean;
  knowledgeGraphDepth?: number;
}

export interface EnhancedProcessMessageResult extends ProcessMessageResult {
  knowledgeGraphContext?: {
    relatedConcepts: Array<{
      name: string;
      type: string;
      description?: string;
      relationship_type?: string;
      depth: number;
    }>;
    conceptProperties: Record<string, any>;
    conceptPaths?: Array<{
      path: string[];
      relationship_types: string[];
    }>;
  };
}

export interface EnhancedMessagePipelineOptions {
  messageProcessorOptions?: {
    ragOptions?: {
      limit?: number;
      threshold?: number;
    };
    agentOptions?: {
      limit?: number;
      threshold?: number;
    };
  };
  knowledgeGraphOptions?: {
    defaultEnabled: boolean;
    maxDepth: number;
    maxConcepts: number;
  };
}

export const useEnhancedMessageProcessor = (options: EnhancedMessagePipelineOptions = {
  knowledgeGraphOptions: {
    defaultEnabled: true,
    maxDepth: 2,
    maxConcepts: 10
  }
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Import base message processor
  const { processMessage: baseProcessMessage } = useMessageProcessor(options.messageProcessorOptions);
  
  // Import knowledge graph service
  const { enhanceQuery, getRelatedConcepts, findPath } = useKnowledgeGraph();
  
  /**
   * Enhanced message processing with knowledge graph integration
   */
  const processMessage = async (request: EnhancedProcessMessageRequest): Promise<EnhancedProcessMessageResult> => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      // Determine if knowledge graph enhancement should be applied
      const useKnowledgeGraph = request.enableKnowledgeGraph ?? options.knowledgeGraphOptions?.defaultEnabled ?? true;
      const knowledgeGraphDepth = request.knowledgeGraphDepth ?? options.knowledgeGraphOptions?.maxDepth ?? 2;
      
      // Prepare enhanced result
      let knowledgeGraphContext = undefined;
      
      // Step 1: If enabled, enhance the query with knowledge graph context
      if (useKnowledgeGraph) {
        console.log('[Enhanced Message Processor] Enhancing query with knowledge graph');
        try {
          const enhancedQuery = await enhanceQuery(request.query);
          
          // Extract and format knowledge graph context
          knowledgeGraphContext = {
            relatedConcepts: enhancedQuery.enhancedContext.relatedConcepts.slice(0, options.knowledgeGraphOptions?.maxConcepts ?? 10),
            conceptProperties: enhancedQuery.enhancedContext.conceptProperties || {}
          };
          
          // For specific domain concepts, find paths between them if multiple are present
          const domainConcepts = enhancedQuery.enhancedContext.relatedConcepts
            .filter(c => c.depth === 0)
            .map(c => c.name);
            
          if (domainConcepts.length >= 2) {
            // Find paths between the first two key concepts
            const paths = await findPath(domainConcepts[0], domainConcepts[1], knowledgeGraphDepth);
            if (paths && paths.length > 0) {
              knowledgeGraphContext.conceptPaths = paths;
            }
          }
          
          console.log('[Enhanced Message Processor] Knowledge graph context:', {
            conceptCount: knowledgeGraphContext.relatedConcepts.length,
            pathsFound: knowledgeGraphContext.conceptPaths?.length || 0
          });
          
        } catch (error) {
          console.error('[Enhanced Message Processor] Error enhancing with knowledge graph:', error);
          // Continue processing even if knowledge graph enhancement fails
        }
      }
      
      // Step 2: Enhance the original request with knowledge graph context
      const enhancedRequest: ProcessMessageRequest = {
        ...request,
        // Add knowledge graph context to the request context if available
        context: knowledgeGraphContext 
          ? `${request.context || ''}\n\nKnowledge Graph Context: ${JSON.stringify(knowledgeGraphContext)}`
          : request.context
      };
      
      // Step 3: Process the enhanced request with the base processor
      const baseResult = await baseProcessMessage(enhancedRequest);
      
      // Step 4: Combine results
      const enhancedResult: EnhancedProcessMessageResult = {
        ...baseResult,
        knowledgeGraphContext
      };
      
      const endTime = Date.now();
      console.log(`[Enhanced Message Processor] Processing completed in ${endTime - startTime}ms`);
      
      return enhancedResult;
      
    } catch (error) {
      console.error('[Enhanced Message Processor] Error in enhanced message processing:', error);
      toast({
        title: "Error processing message",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    processMessage,
    isProcessing
  };
};
