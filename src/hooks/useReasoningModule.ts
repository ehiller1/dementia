
import { useState } from 'react';
import { useReasoningModuleAdapter } from './adapters/useMOLASAdapter.ts';
import { ReasoningInput, ReasoningOutput } from '../services/MOLASService.ts';

/**
 * Reasoning Module Hook
 * 
 * Refactored to use the MOLAS service adapter.
 * Maintains the same interface as the original hook for backward compatibility.
 */
export const useReasoningModule = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { generateCode: adapterGenerateCode, isLoading, error, reasoningResult } = useReasoningModuleAdapter();

  // Maintain compatibility with the original interface
  const generateCode = async (input: ReasoningInput): Promise<ReasoningOutput> => {
    console.log('Reasoning Module Input:', input);
    setIsProcessing(true);

    try {
      // Extract parameters to match the adapter's interface
      const result = await adapterGenerateCode(
        input.func_prompt,
        input.required_steps,
        input.include_data_processing || false,
        input.real_data_support || false,
        input.max_attempts || 3
      );

      console.log('Reasoning Module Output:', result);
      return result || {
        code: '',
        verification_status: 'failed',
        missing_steps: [],
        attempts_used: 0
      };
    } catch (err) {
      console.error('Reasoning module error:', err);
      // Return default empty result to maintain compatibility
      return {
        code: '',
        verification_status: 'failed',
        missing_steps: [],
        attempts_used: 0
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    generateCode,
    isProcessing,
    error,
    reasoningResult
  };
};
