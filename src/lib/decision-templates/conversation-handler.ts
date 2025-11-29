/**
 * Decision Template Conversation Handler
 * 
 * This module provides utilities for managing the conversation flow around decision templates,
 * including parameter collection, progress updates, and result presentation.
 */
import { getDecisionInstanceStatus, formatResultsForUser } from './workflow.ts';
import { processMessageWithTemplates } from '../intent-router/decision-integration.ts';
import { supabase } from '../supabase.ts';

// Track active template processing sessions
interface TemplateSession {
  templateId: string;
  instanceId?: string;
  extractedParams: Record<string, any>;
  missingParams: Array<{ name: string; description: string }>;
  status: 'collecting_params' | 'processing' | 'completed' | 'failed';
}

const activeSessions: Record<string, TemplateSession> = {};

/**
 * Process a user message in a conversation
 * @param message The user's message
 * @param conversationId The conversation ID
 * @param userId The user ID
 * @returns Appropriate response to the user
 */
export async function handleConversationMessage(
  message: string,
  conversationId: string,
  userId: string
): Promise<{
  responseType: 'text' | 'processing' | 'results';
  content: string;
  progress?: string[];
}> {
  try {
    // Check if we're in an active parameter collection session
    const activeSession = activeSessions[conversationId];
    
    if (activeSession && activeSession.status === 'collecting_params') {
      // We're collecting parameters, so this message should contain parameter values
      return await handleParameterInput(message, conversationId, userId, activeSession);
    }
    
    // Check if we're waiting for a decision instance to complete
    if (activeSession && activeSession.status === 'processing' && activeSession.instanceId) {
      // Check status and potentially return results
      const status = await getDecisionInstanceStatus(activeSession.instanceId);
      
      if (status.status === 'completed' && status.results) {
        // Get template details for formatting
        const { data: template } = await supabase
          .from('decision_templates')
          .select('*')
          .eq('id', activeSession.templateId)
          .single();
        
        // Format results for user
        const formattedResults = formatResultsForUser(status.results, template);
        
        // Clear active session
        delete activeSessions[conversationId];
        
        return {
          responseType: 'results',
          content: formattedResults
        };
      }
      
      if (status.status === 'failed') {
        // Clear active session
        delete activeSessions[conversationId];
        
        return {
          responseType: 'text',
          content: `I encountered an error while processing your request: ${status.error || 'Unknown error'}`
        };
      }
      
      // Still processing, so treat this as a new query
    }
    
    // No active session or completed session, process as new query
    const result = await processMessageWithTemplates(message, conversationId, userId);
    
    // Handle different response types
    if (result.type === 'parameter_request') {
      // Start parameter collection session
      activeSessions[conversationId] = {
        templateId: result.templateId,
        extractedParams: result.extractedParams,
        missingParams: result.missingParams,
        status: 'collecting_params'
      };
      
      return {
        responseType: 'text',
        content: `I'll help you with ${result.templateName}. ${result.questions}`
      };
    }
    
    if (result.type === 'decision_processing') {
      // Start processing tracking
      activeSessions[conversationId] = {
        templateId: result.templateId,
        instanceId: result.instanceId,
        extractedParams: {},
        missingParams: [],
        status: 'processing'
      };
      
      return {
        responseType: 'processing',
        content: `I'm working on ${result.templateName} for you. This may take a moment...`,
        progress: [
          'Analyzing inputs and context...',
          'Retrieving relevant information...',
          'Processing decision steps...',
          'Generating recommendations...'
        ]
      };
    }
    
    // Handle regular responses
    if (result.type === 'action') {
      // Handle with existing agent activation
      return {
        responseType: 'text',
        content: `I'll process your request using our agents. ${result.action}`
      };
    } else {
      // Handle with RAG response
      return {
        responseType: 'text',
        content: result.content || 'I found information related to your query.'
      };
    }
  } catch (error) {
    console.error('Error handling conversation message:', error);
    return {
      responseType: 'text',
      content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Handle parameter input from user
 */
async function handleParameterInput(
  message: string,
  conversationId: string,
  userId: string,
  session: TemplateSession
): Promise<{
  responseType: 'text' | 'processing' | 'results';
  content: string;
  progress?: string[];
}> {
  try {
    // Extract parameter values from message using LLM
    const { data: template } = await supabase
      .from('decision_templates')
      .select('*')
      .eq('id', session.templateId)
      .single();
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Get the next parameter we're collecting
    const nextParam = session.missingParams[0];
    
    // Use LLM to extract this specific parameter
    const paramValue = await extractSpecificParameter(message, nextParam);
    
    if (!paramValue) {
      return {
        responseType: 'text',
        content: `I couldn't understand your answer. Could you please provide a value for ${nextParam.description}?`
      };
    }
    
    // Update extracted parameters
    session.extractedParams[nextParam.name] = paramValue;
    
    // Remove this parameter from missing list
    session.missingParams.shift();
    
    // Check if we need more parameters
    if (session.missingParams.length > 0) {
      // Ask for next parameter
      const nextMissingParam = session.missingParams[0];
      return {
        responseType: 'text',
        content: `Thank you. Now, ${nextMissingParam.description}?`
      };
    } else {
      // All parameters collected, start processing
      const { instanceId } = await processDecisionTemplate(
        session.templateId,
        session.extractedParams,
        conversationId,
        userId
      );
      
      // Update session to processing state
      session.instanceId = instanceId;
      session.status = 'processing';
      
      return {
        responseType: 'processing',
        content: `Thank you for providing all the information. I'm processing your request now...`,
        progress: [
          'Analyzing inputs and context...',
          'Retrieving relevant information...',
          'Processing decision steps...',
          'Generating recommendations...'
        ]
      };
    }
  } catch (error) {
    console.error('Error handling parameter input:', error);
    delete activeSessions[conversationId];
    
    return {
      responseType: 'text',
      content: `I encountered an error processing your input: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Extract a specific parameter value from user input
 */
async function extractSpecificParameter(
  userInput: string,
  parameter: { name: string; description: string }
): Promise<any> {
  // Use OpenAI to extract the parameter
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const prompt = `
    Extract the value for the following parameter from the user input:
    
    Parameter: ${parameter.name}
    Description: ${parameter.description}
    
    User Input: "${userInput}"
    
    Return ONLY the extracted value with no additional text, explanation, or formatting.
    If the value cannot be reliably extracted, return null.
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 100
  });
  
  const content = response.choices[0]?.message?.content?.trim() || '';
  
  if (content.toLowerCase() === 'null') {
    return null;
  }
  
  return content;
}

// Import at bottom to avoid circular dependencies
import { OpenAI } from 'openai';
import { processDecisionTemplate } from './workflow.ts';
