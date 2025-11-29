
import { useState } from 'react';
import { useInterpretationModuleAdapter } from './adapters/useMOLASAdapter.ts';
import { InterpretationInput, InterpretationOutput } from '../services/MOLASService.ts';

/**
 * Interpretation Module Hook
 * 
 * Refactored to use the MOLAS service adapter.
 * Maintains the same interface as the original hook for backward compatibility.
 */
export const useInterpretationModule = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { interpretResults: adapterInterpretResults, isInterpreting, error, interpretationResult } = useInterpretationModuleAdapter();

  // Maintain compatibility with the original interface
  const interpretResults = async (input: InterpretationInput): Promise<InterpretationOutput> => {
    console.log('Interpretation Module Input:', input);
    setIsProcessing(true);

    try {
      // Extract parameters to match the adapter's interface
      const result = await adapterInterpretResults(
        input.result,
        input.method_id,
        input.user_query,
        {
          statistical_metrics: input.statistical_metrics,
          business_context: input.business_context || false,
          enhanced_insights: input.enhanced_insights || false,
          real_data_analysis: input.real_data_analysis || false
        }
      );

      console.log('Interpretation Module Output:', result);
      return result || {
        summary: 'Analysis interpretation failed',
        key_insights: ['No insights available'],
        recommendations: ['Review the analysis results manually'],
        message: {
          analysis_method: input.method_id,
          key_insights: ['No insights available'],
          recommendations: ['Review the analysis results manually'],
          confidence_score: 0,
          data_quality: 'unknown'
        }
      };
    } catch (err) {
      console.error('Interpretation module error:', err);
      // Return default empty result to maintain compatibility
      return {
        summary: `Error interpreting ${input.method_id} analysis results`,
        key_insights: ['Analysis interpretation encountered an error'],
        recommendations: ['Review raw data and metrics manually'],
        message: {
          analysis_method: input.method_id,
          key_insights: ['Analysis interpretation encountered an error'],
          recommendations: ['Review raw data and metrics manually'],
          confidence_score: 0,
          data_quality: 'unknown'
        }
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    interpretResults,
    isProcessing,
    error,
    interpretationResult
  };
};
