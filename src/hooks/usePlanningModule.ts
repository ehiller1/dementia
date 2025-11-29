
import { useState } from 'react';
import { usePlanningModuleAdapter } from './adapters/useMOLASAdapter.ts';
import { PlanningInput, PlanningOutput } from '../services/MOLASService.ts';

/**
 * Planning Module Hook
 * 
 * This version of the hook uses the MOLAS service adapter.
 * It maintains the same interface as the original hook for backward compatibility.
 */
export const usePlanningModule = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { generatePlan, isLoading, error, planningResult } = usePlanningModuleAdapter();

  // Maintain the original interface to minimize changes in components
  const createPlan = async (input: PlanningInput): Promise<PlanningOutput> => {
    console.log('Planning Module Input:', input);
    setIsProcessing(true);
    
    try {
      const result = await generatePlan(input.method_id, input.params);
      console.log('Planning Module Output:', result);
      return result || {
        func_prompt: '',
        required_steps: [],
        analysis_config: {}
      };
    } catch (err) {
      console.error('Planning module error:', err);
      // Return default empty result to maintain compatibility
      return {
        func_prompt: '',
        required_steps: [],
        analysis_config: {}
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    createPlan,
    isProcessing,
    error,
    planningResult
  };
};
