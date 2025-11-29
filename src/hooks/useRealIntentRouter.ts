import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { classifyIntentCore, IntentClassificationRequest, IntentClassificationResult } from '@/lib/intent/intent-classifier';
import { useSeasonalityDatabase, VectorSearchOptions } from './useSeasonalityDatabase.ts';

/**
 * Intent Router with Real Database Integration
 * 
 * This hook provides enhanced intent routing functionality with:
 * 1. Intent classification using OpenAI
 * 2. Vector search against the real database for templates and prompts
 * 3. Contextual knowledge retrieval based on user queries
 */
export const useRealIntentRouter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { 
    findRelevantTemplates, 
    findRelevantPrompts, 
    getContextualKnowledge, 
    loading, 
    error 
  } = useSeasonalityDatabase();

  // Store the current journey stage to improve context awareness
  const [currentJourneyStage, setCurrentJourneyStage] = useState<'discernment' | 'analysis' | 'decision' | 'action'>('discernment');

  /**
   * Determine the next logical journey stage based on the current stage and intent
   */
  const determineNextStage = useCallback((
    currentStage: 'discernment' | 'analysis' | 'decision' | 'action',
    intent: IntentClassificationResult
  ) => {
    // 0) Respect explicit journey hint from classifier if present
    if (intent.journeyHint) return intent.journeyHint;

    // 1) Heuristics based on suggested agent type
    if (intent.suggestedAgentType?.includes('action') || 
        intent.suggestedAgentType?.includes('implement')) {
      return 'action';
    }
    if (intent.suggestedAgentType?.includes('decision') || 
        intent.suggestedAgentType?.includes('strategy')) {
      return 'decision';
    }
    if (intent.suggestedAgentType?.includes('analysis') || 
        intent.suggestedAgentType?.includes('data')) {
      return 'analysis';
    }

    // 2) Executive business category mapping
    switch (intent.businessCategory) {
      case 'strategic_planning':
      case 'market_expansion':
        return 'decision';
      case 'operational_optimization':
        return 'analysis';
      case 'financial_analysis':
        return 'analysis';
      case 'risk_management':
        return 'analysis';
      case 'performance_review':
        return 'discernment';
      default:
        break;
    }

    // 3) Follow natural progression if no specific signal is detected
    switch (currentStage) {
      case 'discernment': return 'analysis';
      case 'analysis': return 'decision';
      case 'decision': return 'action';
      case 'action': return 'action'; // Stay in action stage by default
      default: return 'discernment';
    }
  }, []);

  /**
   * Process a user query through the full intent routing pipeline
   * with real database connections
   */
  const processQuery = useCallback(async (request: IntentClassificationRequest) => {
    setIsProcessing(true);
    try {
      // 1. Classify intent
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
      if (!apiKey) throw new Error('Missing OpenAI API key');
      
      const intentResult = await classifyIntentCore(request, apiKey);
      
      // 2. Determine the appropriate journey stage based on intent
      const nextStage = determineNextStage(currentJourneyStage, intentResult);
      setCurrentJourneyStage(nextStage);
      
      // 3. Search for relevant templates and prompts based on intent
      const searchOptions: VectorSearchOptions = {
        query: request.query,
        limit: 3,
        threshold: 0.6,
        filterByStage: nextStage,
        // Tag filter helps prefer executive-specific content when applicable
        filterByTags: intentResult.businessCategory ? [intentResult.businessCategory] : undefined
      };
      
      // For information intents, prefer prompts
      // For action intents, prefer templates that can execute actions
      const [relevantTemplates, relevantPrompts, contextualKnowledge] = await Promise.all([
        findRelevantTemplates(searchOptions),
        findRelevantPrompts(searchOptions),
        getContextualKnowledge(request.query)
      ]);
      
      // 4. Determine whether to use a template or prompt based on intent
      const useTemplate = (intentResult.intent === 'action' || 
                          intentResult.intent === 'seasonality' || 
                          intentResult.intent === 'analysis' ||
                          intentResult.domainSpecific?.requiresTemplateExecution) && 
                         relevantTemplates.length > 0;
      
      return {
        intentClassification: intentResult,
        journeyStage: nextStage,
        templates: relevantTemplates,
        prompts: relevantPrompts,
        knowledge: contextualKnowledge,
        recommended: useTemplate ? 
          { type: 'template', item: relevantTemplates[0] } : 
          { type: 'prompt', item: relevantPrompts[0] }
      };
    } catch (error) {
      console.error('Intent routing error:', error);
      toast({
        title: "Routing Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [currentJourneyStage, findRelevantTemplates, findRelevantPrompts, getContextualKnowledge]);

  return {
    processQuery,
    isProcessing: isProcessing || loading,
    error,
    currentJourneyStage,
    setCurrentJourneyStage
  };
};
