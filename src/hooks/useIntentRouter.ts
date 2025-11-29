/**
 * Intent Router Hook
 * 
 * This hook provides functionality to classify user queries into:
 * 1. Information/interpretation/recommendation intents
 * 2. Action intents that should trigger an agent
 */

import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { classifyIntent as classifyIntentLib, Intent } from '@/lib/intent-router';

export interface IntentClassificationRequest {
  query: string;
  conversationHistory?: Array<{
    role: 'user' | 'system';
    content: string;
  }>;
  context?: string;
}

export interface IntentClassificationResult extends Intent {
  intent?: 'information' | 'action';
  explanation?: string;
}

export const useIntentRouter = () => {
  const [isClassifying, setIsClassifying] = useState(false);
  const { toast } = useToast();

  /**
   * Classifies user query to determine if it's seeking information or requesting action
   */
  const classifyIntent = async (request: IntentClassificationRequest): Promise<IntentClassificationResult> => {
    setIsClassifying(true);
    try {
      // Call the intent router library function
      const result = await classifyIntentLib(request.query, request.context || '');
      
      // Map the intent type to the expected format
      let mappedIntent: 'information' | 'action' = 'information';
      
      // Map the intent types from the library to our hook's types
      if (result.type === 'action') {
        mappedIntent = 'action';
      } else if (result.type === 'rag' || result.type === 'clarification') {
        mappedIntent = 'information';
      }
      
      return {
        ...result,
        intent: mappedIntent,
        explanation: `Classified as ${result.type} with confidence ${result.confidence}`
      };
    } catch (error) {
      console.error('Intent classification error:', error);
      toast({
        title: "Classification Error",
        description: "Failed to classify your query. Please try again.",
        variant: "destructive"
      });
      // Return default classification
      return {
        type: 'rag',
        intent: 'information',
        confidence: 0.5,
        explanation: 'Error during classification. Defaulting to information intent.'
      };
    } finally {
      setIsClassifying(false);
    }
  };

  return {
    classifyIntent,
    isClassifying
  };
};
