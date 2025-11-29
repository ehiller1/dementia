import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * MOLAS Phase Types
 */
export type MOLASPhase = 'planning' | 'reasoning' | 'execution' | 'interpretation';

/**
 * Progressive Streaming Configuration
 */
export interface ProgressiveStreamConfig {
  enabled: boolean;
  delayBetweenMessages: number; // ms
  showTypingIndicator: boolean;
  typingIndicatorDuration: number; // ms
}

/**
 * Workflow Progress State
 */
export interface WorkflowProgress {
  conversationId: string;
  currentPhase: MOLASPhase;
  currentStepIndex: number;
  totalSteps: number;
  thematicThread: string;
  accumulatedInsights: string[];
  canContinue: boolean;
  requiresUserInput: boolean;
  isWorkflowMode: boolean;
}

/**
 * Workflow Message with enhanced metadata
 */
export interface WorkflowMessage {
  id: string;
  type: 'user' | 'assistant' | 'workflow' | 'system';
  content: string;
  timestamp: Date;
  role?: 'user' | 'assistant';  // For ACT-R TurnEnvelope rendering
  turnEnvelope?: any;  // ACT-R TurnEnvelope structure
  parsedMessages?: any[];  // Parsed messages for EnhancedTurnRenderer
  workflowMetadata?: {
    phase?: MOLASPhase;
    stepIndex?: number;
    totalSteps?: number;
    canContinue?: boolean;
    requiresUserInput?: boolean;
    nextActions?: string[];
    insights?: string[];
    recommendations?: string[];
    progressBar?: string;
    agentsInvolved?: number;
    multiAgent?: boolean;
    // Executive message fields (for conversation flow integration)
    messageType?: 'summary' | 'insights' | 'recommendations' | 'actions' | 'impact' | 'provenance' | 'reflection';
    source?: string;
    roleDetection?: string;
    templateSnapline?: string;
    badges?: string[];
    crossFunctionalImpact?: Record<string, string>;
    agentMarketplaceResults?: any[];
    timeline?: any[];
    _metadata?: any;
  };
  metadata?: any;
}

/**
 * Hook for managing incremental workflow state and interactions
 */
export function useIncrementalWorkflow(conversationId: string, streamConfig?: ProgressiveStreamConfig) {
  const [workflowProgress, setWorkflowProgress] = useState<WorkflowProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingPhase, setStreamingPhase] = useState<string>('');
  const lastMessageRef = useRef<string>('');
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Default streaming configuration
  const defaultStreamConfig: ProgressiveStreamConfig = {
    enabled: true,
    delayBetweenMessages: 800, // 800ms between messages
    showTypingIndicator: true,
    typingIndicatorDuration: 600 // 600ms typing indicator
  };
  
  const config = streamConfig || defaultStreamConfig;

  /**
   * Parse workflow metadata from backend response (NEW FORMAT)
   */
  const parseWorkflowResponse = useCallback((response: string): WorkflowMessage['workflowMetadata'] | null => {
    try {
      // Safety check for undefined response
      if (!response || typeof response !== 'string') {
        console.warn('[parseWorkflowResponse] Response is undefined or not a string:', typeof response);
        return null;
      }
      
      // 1. First, try to parse the new HTML comment metadata format
      const metadataMatch = response.match(/<!-- WORKFLOW_METADATA: ({.*?}) -->/);
      if (metadataMatch) {
        const metadata = JSON.parse(metadataMatch[1]);
        console.log('🔍 Parsed workflow metadata:', metadata);
        
        return {
          phase: metadata.currentPhase === 'analysis' ? 'reasoning' : 
                 metadata.currentPhase === 'continuation' ? 'execution' : 'planning',
          stepIndex: metadata.workflowProgress?.current === 'insight_synthesis' ? 1 : 0,
          totalSteps: metadata.workflowProgress?.next?.length + 1 || 3,
          canContinue: true,
          requiresUserInput: true,
          nextActions: metadata.nextSuggestedActions || [],
          agentsInvolved: metadata.agentsInvolved || 0,
          insights: [],
          recommendations: []
        };
      }

      // 2. Parse multi-agent dialogue patterns
      const agentMatches = response.match(/📊 \*\*([^:]+)\*\*:/g);
      const reflectiveMatch = response.match(/🤔 \*\*([^:]+)\*\*: ([^\n]+)/);
      const synthesisMatch = response.match(/🔗 \*\*([^:]+)\*\*: ([^\n]+)/);
      
      // 3. Extract insights and recommendations from agent responses
      const insightsMatches = response.match(/\*\*Key Insights:\*\*\n((?:• [^\n]+\n?)+)/g);
      const recommendationsMatches = response.match(/\*\*My Recommendations:\*\*\n((?:• [^\n]+\n?)+)/g);
      const nextStepsMatch = response.match(/\*\*What would you like to explore next\?\*\*\n((?:• [^\n]+\n?)+)/);
      
      // 4. Extract all insights and recommendations
      const allInsights: string[] = [];
      const allRecommendations: string[] = [];
      
      if (insightsMatches) {
        insightsMatches.forEach(match => {
          const insights = match.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.replace('• ', '').trim());
          allInsights.push(...insights);
        });
      }
      
      if (recommendationsMatches) {
        recommendationsMatches.forEach(match => {
          const recommendations = match.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.replace('• ', '').trim());
          allRecommendations.push(...recommendations);
        });
      }
      
      const nextActions = nextStepsMatch ? 
        nextStepsMatch[1].split('\n').filter(line => line.trim().startsWith('•')).map(line => line.replace('• ', '').trim()) : 
        [];

      // 5. Determine if this is a multi-agent response
      const isMultiAgent = agentMatches && agentMatches.length > 1;
      const hasReflection = !!reflectiveMatch;
      const hasSynthesis = !!synthesisMatch;
      
      if (isMultiAgent || hasReflection || hasSynthesis) {
        console.log('🎭 Detected multi-agent dialogue:', {
          agents: agentMatches?.length || 0,
          hasReflection,
          hasSynthesis,
          insights: allInsights.length,
          recommendations: allRecommendations.length
        });
        
        return {
          phase: hasReflection ? 'reasoning' : hasSynthesis ? 'execution' : 'interpretation',
          stepIndex: hasReflection ? 0 : hasSynthesis ? 1 : 2,
          totalSteps: 3,
          canContinue: nextActions.length > 0,
          requiresUserInput: nextActions.length > 0,
          nextActions,
          insights: allInsights,
          recommendations: allRecommendations,
          agentsInvolved: agentMatches?.length || 1,
          multiAgent: true
        };
      }

      // 6. Fallback to legacy format parsing
      const progressMatch = response.match(/📊 \*\*Workflow Progress\*\* \[(\d+)\/(\d+)\]/);
      const phaseMatch = response.match(/(🎯|🔍|⚡) \*\*([^*]+)\*\*/);
      const progressBarMatch = response.match(/\[(\d+)\/(\d+)\]\n([█░]+)/);
      const continueMatch = response.includes('Ready to continue to the next phase');
      const inputMatch = response.includes('What would you like to explore next?');

      if (progressMatch || phaseMatch) {
        const currentStep = progressMatch ? parseInt(progressMatch[1]) : 1;
        const totalSteps = progressMatch ? parseInt(progressMatch[2]) : 4;
        const phase = phaseMatch ? phaseMatch[2].toLowerCase().includes('planning') ? 'planning' :
                                   phaseMatch[2].toLowerCase().includes('reasoning') ? 'reasoning' :
                                   phaseMatch[2].toLowerCase().includes('execution') ? 'execution' :
                                   'interpretation' : 'planning';

        return {
          phase: phase as MOLASPhase,
          stepIndex: currentStep - 1,
          totalSteps,
          canContinue: continueMatch,
          requiresUserInput: inputMatch,
          nextActions,
          progressBar: progressBarMatch ? progressBarMatch[3] : undefined
        };
      }
    } catch (error) {
      console.error('Error parsing workflow response:', error);
    }
    
    return null;
  }, []);

  /**
   * Update workflow progress from message
   */
  const updateWorkflowProgress = useCallback((message: WorkflowMessage) => {
    if (message.workflowMetadata && message.type === 'assistant') {
      const { phase, stepIndex, totalSteps, canContinue, requiresUserInput } = message.workflowMetadata;
      
      setWorkflowProgress(prev => ({
        conversationId,
        currentPhase: phase || prev?.currentPhase || 'planning',
        currentStepIndex: stepIndex !== undefined ? stepIndex : prev?.currentStepIndex || 0,
        totalSteps: totalSteps || prev?.totalSteps || 4,
        thematicThread: prev?.thematicThread || 'business_analysis',
        accumulatedInsights: prev?.accumulatedInsights || [],
        canContinue: canContinue !== undefined ? canContinue : prev?.canContinue || false,
        requiresUserInput: requiresUserInput !== undefined ? requiresUserInput : prev?.requiresUserInput || false,
        isWorkflowMode: true
      }));
    }
  }, [conversationId]);

  /**
   * Process message and extract workflow information
   */
  const processWorkflowMessage = useCallback((
    content: string, 
    type: 'user' | 'assistant' | 'system' = 'assistant',
    metadata?: any
  ): WorkflowMessage => {
    const message: WorkflowMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      metadata
    };

    // Parse workflow metadata from assistant responses
    if (type === 'assistant') {
      const workflowMetadata = parseWorkflowResponse(content);
      if (workflowMetadata) {
        // Merge parsed metadata with passed metadata
        message.workflowMetadata = { ...workflowMetadata, ...metadata };
        message.type = 'workflow'; // Mark as workflow message
        updateWorkflowProgress(message);
      } else if (metadata) {
        // If no parsed metadata but we have passed metadata, use it as workflowMetadata
        message.workflowMetadata = metadata;
      }
    } else if (metadata) {
      // For system messages, store metadata in workflowMetadata
      message.workflowMetadata = metadata;
    }

    return message;
  }, [parseWorkflowResponse, updateWorkflowProgress]);

  /**
   * Progressive message streaming function
   * Reveals messages one by one with natural pacing
   */
  const streamMessagesProgressively = useCallback(async (
    messages: WorkflowMessage[],
    onMessageReady: (message: WorkflowMessage) => void
  ): Promise<void> => {
    if (!config.enabled || messages.length === 0) {
      // If streaming disabled, return all messages immediately
      messages.forEach(onMessageReady);
      return;
    }

    setIsStreaming(true);
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const messageType = message.workflowMetadata?.messageType || 'unknown';
      
      // Set streaming phase for typing indicator
      if (config.showTypingIndicator && i < messages.length) {
        const nextMessageType = messages[i]?.workflowMetadata?.messageType || 'message';
        setStreamingPhase(`Generating ${nextMessageType}...`);
        await new Promise(resolve => setTimeout(resolve, config.typingIndicatorDuration));
      }
      
      // Reveal the message
      console.log(`[Progressive Stream] Revealing message ${i + 1}/${messages.length}: ${messageType}`);
      onMessageReady(message);
      
      // Wait before next message (except for last one)
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenMessages));
      }
    }
    
    setIsStreaming(false);
    setStreamingPhase('');
  }, [config]);

  /**
   * Send message with workflow processing
   */
  const sendWorkflowMessage = useCallback(async (
    content: string,
    processMessageFn: (params: any) => Promise<any>
  ): Promise<WorkflowMessage[]> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create user message
      const userMessage = processWorkflowMessage(content, 'user');
      
      // Call backend
      const result = await processMessageFn({
        query: content,
        conversationId,
        userId: 'user_123',
        sessionId: `session_${conversationId}`,
        context: {
          workflowMode: workflowProgress?.isWorkflowMode || false,
          currentPhase: workflowProgress?.currentPhase,
          stepIndex: workflowProgress?.currentStepIndex
        }
      });

      // Process assistant response - handle multiple messages from conversation_creator
      if (result.messages && result.messages.length > 0) {
        console.log('[useIncrementalWorkflow] Processing', result.messages.length, 'structured messages');
        
        // Create multiple assistant messages from parsed conversation_creator output
        const assistantMessages = result.messages.map((msg, index) => {
          // Safety check for message content
          if (!msg || !msg.content) {
            console.warn('[useIncrementalWorkflow] Message or content is undefined at index', index);
            return null;
          }
          
          return processWorkflowMessage(
            msg.content,
            'assistant',
            {
              messageType: msg.type,
              messageId: msg.id,
              sequenceIndex: index,
              totalMessages: result.messages.length,
              title: msg.title,
              messageNumber: msg.messageNumber,
              badges: msg.badges,
              actions: msg.actions,
              cta: msg.cta,
              crossFunctionalImpact: msg.crossFunctionalImpact,
              agentMarketplaceResults: msg.agentMarketplaceResults,
              timeline: msg.timeline,
              meta: msg.meta,
              intentClassification: result.intentClassification,
              templateDiscovery: result.workflowTemplates || result.templateDiscovery,
              agentExecutions: result.agentExecutions,
              workflowInsights: result.workflowInsights,
              businessInsights: result.businessInsights,
              conversationalResponse: result.conversationalResponse,
              templates: result.workflowTemplates || result.templates,
              canonicalData: result.canonicalData || msg.canonicalData,
              // Pass through nextActions and other canonical data for event publishing
              nextActions: result.canonicalData?.nextActions || msg.nextActions,
              templateSnapline: result.canonicalData?.templateSnapline || 'Business Analysis',
              _metadata: result.canonicalData?._metadata
            }
          )
        }).filter(Boolean); // Remove null entries from failed message processing

        // WINDSURF INTEGRATION: Process narrative updates as incremental console-like messages
        const narrativeMessages = [];
        if (result.narrativeUpdates && result.narrativeUpdates.length > 0) {
          console.log('[useIncrementalWorkflow] Processing', result.narrativeUpdates.length, 'narrative updates (Windsurf-style)');
          
          result.narrativeUpdates.forEach((update, index) => {
            // Filter: Only show reflective orchestration and conversational updates in main UI
            // Suppress raw system telemetry (send to diagnostics dashboard instead)
            if (update.source === 'reflective_orchestration' || 
                update.source === 'synthesis_engine' ||
                update.source === 'agent_marketplace' ||
                update.source === 'comprehensive_workflow' ||
                update.source === 'memory_coordination') {
              
              // Use the conversational content directly from the server
              // Handle case where content might be an object
              const contentText = typeof update.content === 'string' 
                ? update.content 
                : typeof update.content === 'object'
                ? JSON.stringify(update.content, null, 2)
                : String(update.content);
              
              const narrativeMessage = processWorkflowMessage(
                `📡 ${contentText}`,
                'system',
                {
                  messageType: update.source === 'reflective_orchestration' ? 'reflection' : 'narrative_update',
                  messageId: `narrative_${index}`,
                  source: update.source,
                  metadata: update.metadata,
                  isIncremental: true,
                  windsurfStyle: true
                }
              );
              narrativeMessages.push(narrativeMessage);
            } else if (update.source === 'system_telemetry') {
              // Send raw telemetry to diagnostics dashboard only
              // TODO: Import eventBus from OrchestrationContext to enable telemetry
              // eventBus.publish('diagnostics.telemetry', update);
              console.log('[useIncrementalWorkflow] Telemetry received (not published):', update.type);
            }
          });
        }

        // WINDSURF INTEGRATION: Process workflow updates as status messages
        if (result.workflowUpdates && result.workflowUpdates.length > 0) {
          console.log('[useIncrementalWorkflow] Processing', result.workflowUpdates.length, 'workflow updates');
          
          result.workflowUpdates.forEach((update, index) => {
            // Create conversational workflow status message
            const statusText = update.status === 'in_progress' 
              ? `I'm actively working through this analysis...`
              : update.status === 'completed'
              ? `Analysis complete and ready for your review.`
              : `Processing your request...`;
            
            const workflowMessage = processWorkflowMessage(
              `⚙️ ${statusText}`,
              'system',
              {
                messageType: 'workflow_update',
                messageId: `workflow_${index}`,
                metadata: update.metadata,
                isIncremental: true,
                windsurfStyle: true
              }
            );
            narrativeMessages.push(workflowMessage);
          });
        }

        lastMessageRef.current = content;
        return [userMessage, ...assistantMessages, ...narrativeMessages];
      } else {
        // Fallback to single message processing
        const responseContent = result.conversationalResponse || result.response || result.message || 'I understand your request.';
        
        const assistantMessage = processWorkflowMessage(
          responseContent,
          'assistant',
          {
            intentClassification: result.intentClassification,
            templateDiscovery: result.workflowTemplates || result.templateDiscovery,
            agentExecutions: result.agentExecutions,
            workflowInsights: result.workflowInsights,
            businessInsights: result.businessInsights,
            conversationalResponse: result.conversationalResponse,
            templates: result.workflowTemplates || result.templates,
            canonicalData: result.canonicalData
          }
        );

        lastMessageRef.current = content;
        return [userMessage, assistantMessage];
      }
      
    } catch (error) {
      console.error('Error in workflow message processing:', error);
      setError(error instanceof Error ? error.message : 'Failed to process message');
      
      // Return user message and error message
      const userMessage = processWorkflowMessage(content, 'user');
      const errorMessage = processWorkflowMessage(
        'I apologize, but I encountered an error processing your request. Please try again.',
        'assistant',
        { error: true }
      );
      
      return [userMessage, errorMessage];
    } finally {
      setIsProcessing(false);
    }
  }, [conversationId, workflowProgress, processWorkflowMessage]);

  /**
   * Continue workflow to next phase
   */
  const continueWorkflow = useCallback(async (
    processMessageFn: (params: any) => Promise<any>
  ): Promise<WorkflowMessage[]> => {
    if (!workflowProgress?.canContinue) {
      return [];
    }

    return sendWorkflowMessage('continue', processMessageFn);
  }, [workflowProgress, sendWorkflowMessage]);

  /**
   * Reset workflow state
   */
  const resetWorkflow = useCallback(() => {
    setWorkflowProgress(null);
    setError(null);
    lastMessageRef.current = '';
  }, []);

  /**
   * Get workflow status
   */
  const getWorkflowStatus = useCallback(() => {
    if (!workflowProgress) {
      return {
        isActive: false,
        phase: null,
        progress: 0,
        canContinue: false,
        requiresUserInput: false
      };
    }

    return {
      isActive: workflowProgress.isWorkflowMode,
      phase: workflowProgress.currentPhase,
      progress: ((workflowProgress.currentStepIndex + 1) / workflowProgress.totalSteps) * 100,
      canContinue: workflowProgress.canContinue,
      requiresUserInput: workflowProgress.requiresUserInput,
      stepIndex: workflowProgress.currentStepIndex,
      totalSteps: workflowProgress.totalSteps,
      thematicThread: workflowProgress.thematicThread,
      insights: workflowProgress.accumulatedInsights
    };
  }, [workflowProgress]);

  /**
   * Check if message should trigger workflow continuation
   */
  const shouldContinueWorkflow = useCallback((message: string): boolean => {
    const continueTriggers = ['continue', 'next', 'proceed', 'go ahead', 'yes'];
    const lowerMessage = message.toLowerCase().trim();
    
    return continueTriggers.some(trigger => 
      lowerMessage === trigger || lowerMessage.includes(trigger)
    ) && workflowProgress?.canContinue === true;
  }, [workflowProgress]);

  /**
   * Cleanup streaming on unmount
   */
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    workflowProgress,
    isProcessing,
    isStreaming,
    streamingPhase,
    error,
    
    // Actions
    sendWorkflowMessage,
    continueWorkflow,
    resetWorkflow,
    processWorkflowMessage,
    streamMessagesProgressively,
    
    // Utilities
    getWorkflowStatus,
    shouldContinueWorkflow,
    parseWorkflowResponse
  };
}
