/**
 * BusinessAgentOrchestration.tsx
 * 
 * Main container component for business agent orchestration.
 * Integrates with conversation UI and provides agent interaction.
 */

import React, { useEffect } from 'react';
import { useBusinessAgentOrchestration } from '../hooks/useBusinessAgentOrchestration.js';
import { useEnhancedUnifiedConversation } from '../contexts/EnhancedUnifiedConversationProvider';

interface BusinessAgentOrchestrationProps {}

/**
 * BusinessAgentOrchestration component
 * 
 * Provides a conversational interface for interacting with business agents
 * through the EnhancedConversationInterface. This component acts as a controller
 * that connects the business agent orchestration hook with the enhanced conversation context.
 */
const BusinessAgentOrchestration: React.FC<BusinessAgentOrchestrationProps> = () => {
  // Use the business agent orchestration hook
  const {
    messages,
    sendMessage
  } = useBusinessAgentOrchestration();
  
  // Get the enhanced conversation context
  const { 
    addSystemMessage,
    addAgentMessage,
    sendMessage: sendConversationMessage
  } = useUnifiedConversation();

  // Forward agent messages to the conversation interface
  useEffect(() => {
    if (messages.length > 0) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1];
      
      // Only forward agent and system messages (not user messages)
      if (latestMessage.role !== 'user') {
        // Prepare metadata for the message
        const metadata = {
          ...latestMessage.metadata,
          isBusinessAgent: true,
          agentId: latestMessage.agentId,
          timestamp: latestMessage.timestamp
        };
        
        // Add the message to the conversation based on role
        if (latestMessage.role === 'agent') {
          addAgentMessage(latestMessage.content, metadata);
        } else if (latestMessage.role === 'system') {
          addSystemMessage(latestMessage.content, metadata);
        }
      }
    }
  }, [messages, addAgentMessage, addSystemMessage]);

  // Listen for user messages from the enhanced conversation context
  useEffect(() => {
    // Create a message handler to process user messages
    const handleUserMessage = async (message: any) => {
      if (message.role === 'user') {
        try {
          // Send the message to the business agent orchestration
          await sendMessage(message.content);
        } catch (error) {
          console.error('Error processing business agent message:', error);
        }
      }
    };

    // Register the message handler with the enhanced conversation context
    // This would typically be done through a subscription mechanism
    // For now, we'll rely on the conversation context to handle this

    // Return cleanup function
    return () => {
      // Unregister the message handler if needed
    };
  }, [sendMessage]);

  // This component doesn't render UI elements directly
  // It acts as a controller that integrates with the EnhancedConversationInterface
  return null;
};

export default BusinessAgentOrchestration;
