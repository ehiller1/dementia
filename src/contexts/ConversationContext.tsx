'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import type { ProcessMessageRequest, ProcessMessageResult } from '@/hooks/useMessageProcessor';
import { processMessage } from '@/lib/api/processMessage';
// import { DemoTrackingService } from '@/lib/services/DemoTrackingService';

// Helper function to parse conversation creator response and extract messages
function parseConversationResponse(responseText: string): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  
  console.log('🔍 parseConversationResponse: Input text:', responseText);
  console.log('🔍 parseConversationResponse: Input type:', typeof responseText);
  
  try {
    // First try to parse as direct JSON (most common case)
    console.log('🔍 parseConversationResponse: Attempting JSON.parse...');
    const jsonData = JSON.parse(responseText);
    console.log('🔍 parseConversationResponse: Parsed JSON data:', jsonData);
    console.log('🔍 parseConversationResponse: JSON keys:', Object.keys(jsonData));
    
    // Check if it's a structured response object with the expected fields
    const hasExpectedFields = jsonData.roleDetection || jsonData.executiveSummary || jsonData.recommendation || jsonData.templateSnapline;
    console.log('🔍 parseConversationResponse: Has expected fields?', hasExpectedFields);
    console.log('🔍 parseConversationResponse: Field check:', {
      roleDetection: !!jsonData.roleDetection,
      executiveSummary: !!jsonData.executiveSummary,
      recommendation: !!jsonData.recommendation,
      templateSnapline: !!jsonData.templateSnapline
    });
    
    if (hasExpectedFields) {
      // Create separate message bubbles for each section
      const baseTimestamp = new Date();
      
      // Template Snapline (if available)
      if (jsonData.templateSnapline) {
        messages.push({
          id: uuidv4(),
          role: 'agent',
          content: `**Template:** ${jsonData.templateSnapline}`,
          timestamp: new Date(baseTimestamp.getTime() + 100),
          metadata: { section: 'template', structured: true }
        });
      }
      
      // Executive Summary
      if (jsonData.executiveSummary && Array.isArray(jsonData.executiveSummary)) {
        let summaryContent = '## Executive Summary\n';
        jsonData.executiveSummary.forEach((item: string) => {
          summaryContent += `• ${item}\n`;
        });
        messages.push({
          id: uuidv4(),
          role: 'agent',
          content: summaryContent.trim(),
          timestamp: new Date(baseTimestamp.getTime() + 200),
          metadata: { section: 'executive_summary', structured: true }
        });
      }
      
      // What I'm Seeing
      if (jsonData.whatImSeeing && Array.isArray(jsonData.whatImSeeing)) {
        let seeingContent = '## What I\'m Seeing\n';
        jsonData.whatImSeeing.forEach((item: string) => {
          seeingContent += `• ${item}\n`;
        });
        messages.push({
          id: uuidv4(),
          role: 'agent',
          content: seeingContent.trim(),
          timestamp: new Date(baseTimestamp.getTime() + 300),
          metadata: { section: 'observations', structured: true }
        });
      }
      
      // Recommendations
      if (jsonData.recommendation && Array.isArray(jsonData.recommendation)) {
        let recContent = '## Recommendations\n';
        jsonData.recommendation.forEach((item: string) => {
          recContent += `• ${item}\n`;
        });
        messages.push({
          id: uuidv4(),
          role: 'agent',
          content: recContent.trim(),
          timestamp: new Date(baseTimestamp.getTime() + 400),
          metadata: { section: 'recommendations', structured: true }
        });
      }
      
      // Next Actions
      if (jsonData.nextActions && Array.isArray(jsonData.nextActions)) {
        let actionsContent = '## Next Actions\n';
        jsonData.nextActions.forEach((action: any) => {
          if (typeof action === 'string') {
            actionsContent += `• ${action}\n`;
          } else if (action.action) {
            actionsContent += `• **${action.action}**\n`;
            if (action.status) actionsContent += `  Status: ${action.status}\n`;
            if (action.deadline) actionsContent += `  Deadline: ${action.deadline}\n`;
          }
        });
        messages.push({
          id: uuidv4(),
          role: 'agent',
          content: actionsContent.trim(),
          timestamp: new Date(baseTimestamp.getTime() + 500),
          metadata: { section: 'next_actions', structured: true }
        });
      }
      
      // Agent Marketplace Results
      if (jsonData.agentMarketplaceResults) {
        messages.push({
          id: uuidv4(),
          role: 'agent',
          content: `## Agent Analysis\n${jsonData.agentMarketplaceResults}`,
          timestamp: new Date(baseTimestamp.getTime() + 600),
          metadata: { section: 'agent_results', structured: true }
        });
      }
      
      // Timeline
      if (jsonData.timeline) {
        messages.push({
          id: uuidv4(),
          role: 'agent',
          content: `## Timeline\n${jsonData.timeline}`,
          timestamp: new Date(baseTimestamp.getTime() + 700),
          metadata: { section: 'timeline', structured: true }
        });
      }
      
      return messages;
    }
    
    // Handle JSON array format
    if (Array.isArray(jsonData)) {
      jsonData.forEach((msg, index) => {
        messages.push({
          id: msg.id || `msg_${index}`,
          role: 'agent',
          content: formatMessageContent(msg),
          timestamp: new Date(),
          metadata: {
            type: msg.type,
            ...msg.meta,
            badges: msg.badges,
            cta: msg.cta,
            checklist: msg.checklist,
            crossFunctionalImpact: msg.crossFunctionalImpact,
            agentMarketplaceResults: msg.agentMarketplaceResults,
            timeline: msg.timeline
          }
        });
      });
      return messages;
    }
    
    // Single JSON object fallback
    messages.push({
      id: uuidv4(),
      role: 'agent',
      content: JSON.stringify(jsonData, null, 2),
      timestamp: new Date()
    });
    
  } catch (parseError) {
    // Try to look for JSON block in markdown format as fallback
    const jsonMatch = responseText.match(/```JSON\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        
        if (Array.isArray(jsonData)) {
          jsonData.forEach((msg, index) => {
            messages.push({
              id: msg.id || `msg_${index}`,
              role: 'agent',
              content: formatMessageContent(msg),
              timestamp: new Date(),
              metadata: {
                type: msg.type,
                ...msg.meta,
                badges: msg.badges,
                cta: msg.cta,
                checklist: msg.checklist,
                crossFunctionalImpact: msg.crossFunctionalImpact,
                agentMarketplaceResults: msg.agentMarketplaceResults,
                timeline: msg.timeline
              }
            });
          });
        }
      } catch (blockParseError) {
        // Not valid JSON in block, treat as plain text
        messages.push({
          id: uuidv4(),
          role: 'agent',
          content: responseText,
          timestamp: new Date()
        });
      }
    } else {
      // Not JSON, treat as plain text
      messages.push({
        id: uuidv4(),
        role: 'agent',
        content: responseText,
        timestamp: new Date()
      });
    }
  }
  
  return messages;
}

// Helper to format structured response from conversation-creator
function formatStructuredResponse(data: any): string {
  let content = '';
  
  if (data.executiveSummary && Array.isArray(data.executiveSummary)) {
    content += '## Executive Summary\n';
    data.executiveSummary.forEach((item: string) => {
      content += `• ${item}\n`;
    });
    content += '\n';
  }
  
  if (data.whatImSeeing && Array.isArray(data.whatImSeeing)) {
    content += '## Current Analysis\n';
    data.whatImSeeing.forEach((item: string) => {
      content += `• ${item}\n`;
    });
    content += '\n';
  }
  
  if (data.recommendation && Array.isArray(data.recommendation)) {
    content += '## Recommendations\n';
    data.recommendation.forEach((item: string) => {
      content += `• ${item}\n`;
    });
    content += '\n';
  }
  
  if (data.nextActions && Array.isArray(data.nextActions)) {
    content += '## Next Actions\n';
    data.nextActions.forEach((action: any) => {
      content += `• **${action.action}** (${action.status}) - Due: ${action.deadline}\n`;
    });
    content += '\n';
  }
  
  if (data.crossFunctionalImpact) {
    content += '## Cross-Functional Impact\n';
    Object.entries(data.crossFunctionalImpact).forEach(([dept, impact]) => {
      content += `• **${dept}**: ${impact}\n`;
    });
    content += '\n';
  }
  
  if (data.agentMarketplaceResults) {
    content += '## Agent Analysis\n';
    content += `${data.agentMarketplaceResults}\n\n`;
  }
  
  if (data.timeline) {
    content += '## Timeline\n';
    content += `${data.timeline}\n\n`;
  }
  
  return content;
}

// Helper to format individual message content based on type
function formatMessageContent(msg: any): string {
  switch (msg.type) {
    case 'summary':
      return msg.content;
    
    case 'insights':
      let insights = Array.isArray(msg.content) ? msg.content.join('\n• ') : msg.content;
      if (msg.badges && msg.badges.length > 0) {
        const badgeText = msg.badges.map((b: any) => `${b.label}=${b.value}`).join(' | ');
        insights += `\n\nBadges: ${badgeText}`;
      }
      return `• ${insights}`;
    
    case 'recommendations':
      const recs = Array.isArray(msg.content) ? msg.content.join('\n• ') : msg.content;
      return `• ${recs}`;
    
    case 'actions':
      if (msg.checklist && Array.isArray(msg.checklist)) {
        return msg.checklist.map((item: any) => 
          `Action=${item.action}, Status=${item.status}${item.deadline ? `, Due=${item.deadline_human || item.deadline}` : ''}${item.days_until_deadline ? ` (${item.days_until_deadline} days)` : ''}`
        ).join('\n');
      }
      return msg.content || 'No actions specified';
    
    case 'impact':
      if (msg.crossFunctionalImpact) {
        return Object.entries(msg.crossFunctionalImpact)
          .map(([dept, impact]) => `• ${dept}: ${impact}`)
          .join('\n');
      }
      return msg.content || 'No cross-functional impact specified';
    
    case 'provenance':
      let provenance = '';
      if (msg.agentMarketplaceResults) {
        provenance += `Agent: ${msg.agentMarketplaceResults}\n`;
      }
      if (msg.timeline) {
        provenance += `Timeline: ${msg.timeline}`;
      }
      return provenance || 'Source information not specified';
    
    default:
      return msg.content || '';
  }
}

// Legacy helper function for backward compatibility
function formatBusinessResponse(responseData: any): string {
  let formatted = '';
  
  if (responseData.roleDetection) {
    formatted += `${responseData.roleDetection}\n\n`;
  }
  
  if (responseData.templateSnapline) {
    formatted += `**${responseData.templateSnapline}**\n\n`;
  }
  
  if (responseData.executiveSummary && Array.isArray(responseData.executiveSummary)) {
    formatted += `**Executive Summary:**\n`;
    responseData.executiveSummary.forEach((item: string) => {
      formatted += `• ${item}\n`;
    });
    formatted += '\n';
  }
  
  if (responseData.whatImSeeing && Array.isArray(responseData.whatImSeeing)) {
    formatted += `**What I'm Seeing:**\n`;
    responseData.whatImSeeing.forEach((item: string) => {
      formatted += `• ${item}\n`;
    });
    formatted += '\n';
  }
  
  if (responseData.recommendation && Array.isArray(responseData.recommendation)) {
    formatted += `**Recommendations:**\n`;
    responseData.recommendation.forEach((item: string) => {
      formatted += `• ${item}\n`;
    });
    formatted += '\n';
  }
  
  if (responseData.nextActions && Array.isArray(responseData.nextActions)) {
    formatted += `**Next Actions:**\n`;
    responseData.nextActions.forEach((action: any) => {
      formatted += `• ${action.action || action} ${action.status ? `${action.status}` : ''}\n`;
    });
    formatted += '\n';
  }
  
  if (responseData.crossFunctionalImpact && Array.isArray(responseData.crossFunctionalImpact)) {
    formatted += `**Cross-Functional Impact:**\n`;
    responseData.crossFunctionalImpact.forEach((item: string) => {
      formatted += `• ${item}\n`;
    });
    formatted += '\n';
  }
  
  if (responseData.agentMarketplaceResults) {
    formatted += `**Agent Analysis:** ${responseData.agentMarketplaceResults}\n\n`;
  }
  
  if (responseData.timeline) {
    formatted += `**Timeline:** ${responseData.timeline}\n`;
  }
  
  return formatted.trim();
}

import type { ProgressUpdate } from '@/lib/api/agentProgressUpdates';

// Message types for the conversation
export interface ConversationMessage {
  id: string;
  role: 'user' | 'system' | 'agent' | 'seasonality';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Agent execution types
export interface ActiveAgentExecution {
  id: string;
  agentId: string;
  agentName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  results?: any;
  error?: string;
  progressUpdates?: ProgressUpdate[];
}

// The main conversation context interface
export interface ConversationContextType {
  // Basic conversation state
  conversationId: string;
  messages: ConversationMessage[];
  isProcessing: boolean;
  
  // Agent executions
  activeAgentExecutions: ActiveAgentExecution[];
  
  // Methods
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  
  // Agent orchestration is now handled entirely by the backend
  // No frontend-specific agent state needed
  
  // Advanced context management
  addSystemMessage: (content: string, metadata?: Record<string, any>) => void;
  addAgentMessage: (content: string, metadata?: Record<string, any>) => void;
  
  // Progress updates
  getProgressUpdates: (executionId: string) => Promise<ProgressUpdate[]>;
  refreshProgressUpdates: (executionId: string) => Promise<void>;
  
  // State tracking
  lastUserMessageId?: string;
  lastUserMessageTimestamp?: Date;
  error: string | null;
}

// Create the context
export const ConversationContext = createContext<ConversationContextType | null>(null);

// Props for the provider
interface ConversationProviderProps {
  children: ReactNode;
  initialConversationId?: string;
}

// The provider component
export const ConversationProvider: React.FC<ConversationProviderProps> = ({ 
  children, 
  initialConversationId 
}) => {
  // State
  const [conversationId, setConversationId] = useState<string>(initialConversationId || uuidv4());
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeAgentExecutions, setActiveAgentExecutions] = useState<ActiveAgentExecution[]>([]);
  // Removed seasonality-specific state - all agent orchestration now handled by backend
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessageId, setLastUserMessageId] = useState<string | undefined>(undefined);
  const [lastUserMessageTimestamp, setLastUserMessageTimestamp] = useState<Date | undefined>(undefined);
  const [executionProgressMap, setExecutionProgressMap] = useState<Record<string, ProgressUpdate[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // We now use the server-side processMessage API instead of individual hooks

  // Load conversation messages if conversationId is provided
  useEffect(() => {
    if (!conversationId) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        // Define the message structure we expect from DB
        interface DbMessage {
          id: string;
          conversation_id: string;
          role: 'user' | 'system' | 'agent' | 'seasonality';
          content: string;
          created_at: string;
          metadata?: Record<string, any>;
        }

        // Fetch messages for this conversation
        const { data: messageData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          throw messagesError;
        }

        // Convert to our message format
        if (messageData) {
          const loadedMessages: ConversationMessage[] = messageData.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            metadata: msg.metadata || {}
          }));
          
          setMessages(loadedMessages);
          
          // Find the last user message
          const lastUserMsg = [...loadedMessages].reverse().find(m => m.role === 'user');
          if (lastUserMsg) {
            setLastUserMessageId(lastUserMsg.id);
            setLastUserMessageTimestamp(lastUserMsg.timestamp);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Helper to save message to the database
  const saveMessage = async (message: ConversationMessage) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Ensure conversation exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!existingConversation) {
        // Create conversation if it doesn't exist
        await supabase
          .from('conversations')
          .insert({
            id: conversationId,
            user_id: session.user.id,
            title: message.content.slice(0, 50) + '...'  // First message becomes title
          });
      }

      // Save message
      await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          metadata: message.metadata || {},
          created_at: message.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Helper to add message to state and save to DB
  const addMessage = async (role: ConversationMessage['role'], content: string, metadata: Record<string, any> = {}) => {
    const newMessage: ConversationMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      metadata
    };

    // Update state
    setMessages(prev => [...prev, newMessage]);
    
    // If this is a user message, update the last user message reference
    if (role === 'user') {
      setLastUserMessageId(newMessage.id);
      setLastUserMessageTimestamp(newMessage.timestamp);
    }

    // Persist to database if we have a conversation ID
    if (conversationId) {
      try {
        await saveMessage(newMessage);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    }

    return newMessage;
  };

  // Method to add a system message
  const addSystemMessage = (content: string, metadata?: Record<string, any>) => {
    addMessage('system', content, metadata);
  };

  // Method to add an agent message
  const addAgentMessage = (content: string, metadata?: Record<string, any>) => {
    addMessage('agent', content, metadata);
  };

  // Process a user message using the Edge Function
  const sendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Add user message
      const userMessage = await addMessage('user', message);

      // Always use our server-side processing API for all queries
      // This provides unified agent orchestration with real backend services
      await addMessage('system', 'Processing your message...', { 
        processingStart: new Date().toISOString()
      });
      
      // Call the server-side API to process the message
      const result = await processMessage({
        query: message,
        conversationId,
        conversationHistory: messages.slice(-10).map(m => ({
          role: m.role === 'seasonality' ? 'system' : m.role,
          content: m.content
        }))
      });

      console.log('ConversationContext: Backend result:', result);
      console.log('ConversationContext: Checking for conversationalResponse:', {
        hasConversationalResponse: !!(result as any).conversationalResponse,
        conversationalResponseLength: (result as any).conversationalResponse?.length || 0
      });

      // PRIORITIZE: Use unified conversational response if available
      if ((result as any).conversationalResponse) {
        console.log('✅ ConversationContext: Using unified conversational response, suppressing individual messages');
        console.log('🔍 ConversationContext: Raw conversationalResponse:', (result as any).conversationalResponse);
        console.log('🔍 ConversationContext: Type of conversationalResponse:', typeof (result as any).conversationalResponse);
        
        const conversationalResponse = (result as any).conversationalResponse;
        
        // Parse the conversation creator response into multiple messages
        console.log('🔍 ConversationContext: About to parse conversational response...');
        const conversationMessages = parseConversationResponse(conversationalResponse);
        console.log('🔍 ConversationContext: Parsed messages count:', conversationMessages.length);
        console.log('🔍 ConversationContext: Parsed messages:', conversationMessages);
        
        // Add each message as a separate conversation bubble
        for (const msg of conversationMessages) {
          console.log('🔍 ConversationContext: Adding message:', msg.content.substring(0, 100) + '...');
          await addMessage('agent', msg.content, msg.metadata);
        }
        // Return early to prevent individual message processing
        return;
      }

      console.log('⚠️ ConversationContext: No conversational response found, falling back to individual messages');
      
      // FALLBACK: Handle the processed result based on intent classification
      await addMessage('system', `Intent classified as: ${result.intentClassification.intent}`, { 
        intentClassification: result.intentClassification 
      });

      // Unified agent orchestration handling - works for ALL agent types
      if ((result as any).agentOrchestration && (result as any).agentOrchestration.agentsExecuted > 0) {
        const orchestration = (result as any).agentOrchestration;
        
        // Process each agent execution and display results
        for (const execution of orchestration.executions) {
          if (execution.status === 'completed') {
            const analysis = execution.result.analysis || 'Analysis completed';
            const recommendations = execution.result.recommendations || [];
            
            let agentMessage = `**${execution.agentName} Analysis:**\n\n${analysis}`;
            
            if (recommendations.length > 0) {
              agentMessage += `\n\n**Recommendations:**\n${recommendations.map((rec: string) => `• ${rec}`).join('\n')}`;
            }
            
            await addMessage('agent', agentMessage, {
              executionId: orchestration.executionId,
              agentId: execution.agentId,
              agentName: execution.agentName
            });
          }
        }
        
        // Add business insights summary if available
        if ((result as any).businessInsights && (result as any).businessInsights.length > 0) {
          const insights = (result as any).businessInsights;
          const insightsMessage = `**Business Insights Summary:**\n\n${insights.map((insight: any) => `• ${insight.content} (${insight.source}, ${Math.round(insight.confidence * 100)}% confidence)`).join('\n')}`;
          
          await addMessage('system', insightsMessage, {
            type: 'business_insights',
            insights: insights
          });
        }
      } else {
        // No agent orchestration results - could be information query or failed orchestration
        if (result.informationResult) {
          await addMessage('system', result.informationResult.content, { 
            sources: result.informationResult.sources 
          });
        } else {
          await addMessage('system', 'No suitable agents were found for this request.', {
            intentClassification: result.intentClassification
          });
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      await addMessage('system', 'An error occurred while processing your message.', { error: String(error) });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear the conversation
  const clearConversation = () => {
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    setMessages([]);
    setActiveAgentExecutions([]);
    setLastUserMessageId(undefined);
    setLastUserMessageTimestamp(undefined);
  };

  /**
   * Get progress updates for a specific agent execution
   */
  const getProgressUpdates = async (executionId: string): Promise<ProgressUpdate[]> => {
    if (executionProgressMap[executionId]) {
      return executionProgressMap[executionId];
    }
    
    try {
      // TODO: Implement actual progress updates fetching from API
      const updates: ProgressUpdate[] = [];
      
      // Update the cache
      setExecutionProgressMap(prev => ({
        ...prev,
        [executionId]: updates
      }));
      
      return updates;
    } catch (err) {
      console.error('Error getting progress updates:', err);
      return [];
    }
  };
  
  /**
   * Refresh progress updates for a specific agent execution
   */
  const refreshProgressUpdates = async (executionId: string): Promise<void> => {
    try {
      const updates = await getProgressUpdates(executionId);
      
      // Update the cache
      setExecutionProgressMap(prev => ({
        ...prev,
        [executionId]: updates
      }));
      
      // Also update the active execution with the progress
      setActiveAgentExecutions(prev => 
        prev.map(exec => 
          exec.id === executionId ? {
            ...exec,
            progressUpdates: updates
          } : exec
        )
      );
    } catch (err) {
      console.error('Error refreshing progress updates:', err);
    }
  };

  // Context value
  const value: ConversationContextType = {
    conversationId,
    messages,
    isProcessing,
    activeAgentExecutions,
    sendMessage,
    clearConversation,
    addSystemMessage,
    addAgentMessage,
    getProgressUpdates,
    refreshProgressUpdates,
    error,
    lastUserMessageId,
    lastUserMessageTimestamp
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

// Hook to use the conversation context
export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
