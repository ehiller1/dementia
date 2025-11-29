import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSeasonalityContext } from '@/hooks/useSeasonalityContext';
import { createSeasonalityCrew, parseCrewResult } from '@/lib/crew/crew';
import { FeedbackLoopManager } from '../lib/crew/feedback-loop.ts';
import { ResultCache } from '../lib/crew/result-cache.ts';
// Import the same types used in the useSeasonalityAgent hook
interface SeasonalityAnalysisRequest {
  query: string;
  dataDescription: string;
  period: number;
  analysisType: 'stl' | 'seasonal_naive' | 'x11' | 'custom';
  parameters?: any;
  csvData?: string;
}

interface AnalysisResult {
  method: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  code?: string;
  plots?: string[];
  limitations?: string[];
  execution_details?: any;
  statisticalMetrics?: any;
  dataQuality?: string;
}

interface CrewSeasonalityAgentOptions {
  verbose?: boolean;
  sequential?: boolean;
  enableCaching?: boolean;
  enableFeedbackLoop?: boolean;
  maxFeedbackIterations?: number;
  cacheConfig?: {
    maxItems?: number;
    maxAgeMs?: number;
    enableExpiry?: boolean;
  };
}

/**
 * Hook that provides CrewAI-powered seasonality analysis capabilities
 * while maintaining compatibility with the existing seasonality agent.
 */
export const useCrewSeasonalityAgent = (agentId: string = 'crew-seasonality-agent', options: CrewSeasonalityAgentOptions = {}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackIterationCount, setFeedbackIterationCount] = useState(0);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const { toast } = useToast();
  const { context, switchContext, updatePlan, saveContext } = useSeasonalityContext(agentId);

  /**
   * Analyzes seasonality patterns in time series data using CrewAI agents.
   * Preserves the same interface as the original useSeasonalityAgent hook.
   */
  const analyzeSeasonality = async (request: SeasonalityAnalysisRequest): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    setIsCachedResult(false);
    setFeedbackIterationCount(0);
    
    try {
      console.log(`🛠️  CrewAI Seasonality Agent (${agentId}) analyzing request:`, request);
      
      // Apply options with defaults
      const enableCaching = options.enableCaching ?? true;
      const enableFeedbackLoop = options.enableFeedbackLoop ?? false;
      const maxFeedbackIterations = options.maxFeedbackIterations ?? 3;
      
      // Create the crew of specialized agents
      const seasonalityCrew = createSeasonalityCrew(
        {
          query: request.query,
          dataDescription: request.dataDescription,
          period: request.period || 12, // Default to 12 if not provided
          analysisType: request.analysisType || 'trend',
          csvData: request.csvData || ''
        },
        {
          verbose: options.verbose ?? true,
          sequential: options.sequential ?? true,
          cacheResults: enableCaching,
          enableFeedbackLoop: enableFeedbackLoop,
          maxIterations: maxFeedbackIterations,
          cacheConfig: options.cacheConfig || {
            maxItems: 50,
            maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
            enableExpiry: true
          }
        }
      );
      
      // Check if we got a cached result
      if (seasonalityCrew.cachedCrew) {
        console.log(`🚀 Using cached result for CrewAI Seasonality Agent (${agentId})`);
        setIsCachedResult(true);
        return seasonalityCrew.cachedCrew.cachedResult;
      }
      
      // Run the crew to perform the analysis
      const crewResult = await seasonalityCrew.run();
      
      // Update feedback iteration count if feedback loop was used
      if (enableFeedbackLoop && seasonalityCrew.feedbackLoop) {
        const metrics = seasonalityCrew.feedbackLoop.getAllTaskMetrics();
        let maxIterationsFound = 0;
        
        // Safely extract iteration count from metrics
        if (metrics && typeof metrics === 'object') {
          Object.values(metrics).forEach((m: any) => {
            if (m && typeof m === 'object' && typeof m.iterationCount === 'number') {
              maxIterationsFound = Math.max(maxIterationsFound, m.iterationCount);
            }
          });
        }
        
        setFeedbackIterationCount(maxIterationsFound);
      }
      
      // Parse the results from the crew execution
      const result = parseCrewResult(crewResult, seasonalityCrew.feedbackLoop);
      
      console.log(`✅ CrewAI Seasonality Agent (${agentId}) analysis complete:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ CrewAI Seasonality Agent (${agentId}) error:`, error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Get feedback loop statistics
   */
  const getFeedbackStats = () => {
    return {
      feedbackEnabled: options.enableFeedbackLoop ?? false,
      iterationCount: feedbackIterationCount,
      maxIterations: options.maxFeedbackIterations ?? 3
    };
  };
  
  /**
   * Get caching statistics 
   */
  const getCacheStats = () => {
    return {
      cachingEnabled: options.enableCaching ?? true,
      isCachedResult: isCachedResult
    };
  };

  return { 
    analyzeSeasonality, 
    isAnalyzing,
    isCachedResult,
    feedbackIterationCount,
    getFeedbackStats,
    getCacheStats,
    context,
    switchContext,
    updatePlan
  };
};
