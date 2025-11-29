/**
 * MOLAS React Hook Adapter
 * 
 * This adapter connects the standalone MOLASService with the existing React hooks,
 * allowing for a smooth transition to the new service architecture.
 */

import { useEffect, useState } from 'react';
import { MOLASService, PlanningOutput, ReasoningOutput, EnhancedExecutionResult, InterpretationOutput } from '../../services/MOLASService.ts';

/**
 * Hook to adapt the standalone MOLASService planning module to React
 * @returns Planning module adapter functions
 */
export const usePlanningModuleAdapter = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [planningResult, setPlanningResult] = useState<PlanningOutput | null>(null);
  
  const molasService = new MOLASService();

  const generatePlan = async (method_id: string, params: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await molasService.planning({ 
        method_id, 
        params 
      });
      
      setPlanningResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown planning error';
      setError(errorMessage);
      console.error('Planning module error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    generatePlan, 
    isLoading, 
    error, 
    planningResult 
  };
};

/**
 * Hook to adapt the standalone MOLASService reasoning module to React
 * @returns Reasoning module adapter functions
 */
export const useReasoningModuleAdapter = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reasoningResult, setReasoningResult] = useState<ReasoningOutput | null>(null);
  
  const molasService = new MOLASService();

  const generateCode = async (
    func_prompt: string,
    required_steps: string[],
    include_data_processing = false,
    real_data_support = false,
    max_attempts = 3
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await molasService.reasoning({
        func_prompt,
        required_steps,
        include_data_processing,
        real_data_support,
        max_attempts
      });
      
      setReasoningResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown reasoning error';
      setError(errorMessage);
      console.error('Reasoning module error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateCode,
    isLoading,
    error,
    reasoningResult
  };
};

/**
 * Hook to adapt the standalone MOLASService execution module to React
 * @returns Execution module adapter functions
 */
export const useToolUseModuleAdapter = () => {
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<EnhancedExecutionResult | null>(null);
  
  const molasService = new MOLASService();

  const executeWithData = async (
    code: string,
    csv_data: string | undefined,
    user_query: string,
    analysis_type: string,
    additional_context: Record<string, any> = {}
  ) => {
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await molasService.execute({
        code,
        execution_context: {
          csv_data,
          user_query,
          analysis_type,
          ...additional_context
        }
      });
      
      setExecutionResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown execution error';
      setError(errorMessage);
      console.error('Tool use module error:', err);
      return null;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    executeWithData,
    isExecuting,
    error,
    executionResult
  };
};

/**
 * Hook to adapt the standalone MOLASService interpretation module to React
 * @returns Interpretation module adapter functions
 */
export const useInterpretationModuleAdapter = () => {
  const [isInterpreting, setIsInterpreting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interpretationResult, setInterpretationResult] = useState<InterpretationOutput | null>(null);
  
  const molasService = new MOLASService();

  const interpretResults = async (
    result: any,
    method_id: string,
    user_query: string,
    options: {
      statistical_metrics?: Record<string, any>;
      business_context?: boolean;
      enhanced_insights?: boolean;
      real_data_analysis?: boolean;
    } = {}
  ) => {
    setIsInterpreting(true);
    setError(null);
    
    try {
      const interpretationInput = {
        result,
        method_id,
        user_query,
        ...options
      };
      
      const response = await molasService.interpret(interpretationInput);
      setInterpretationResult(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown interpretation error';
      setError(errorMessage);
      console.error('Interpretation module error:', err);
      return null;
    } finally {
      setIsInterpreting(false);
    }
  };

  return {
    interpretResults,
    isInterpreting,
    error,
    interpretationResult
  };
};

/**
 * Unified MOLAS pipeline adapter hook
 * @returns Complete MOLAS pipeline adapter functions
 */
export const useMOLASPipelineAdapter = () => {
  const [isPipelineRunning, setIsPipelineRunning] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any | null>(null);
  
  const molasService = new MOLASService();
  
  const runPipeline = async (
    user_query: string,
    method_id: string,
    params: Record<string, any>,
    csv_data?: string,
    options: {
      include_data_processing?: boolean;
      real_data_support?: boolean;
      business_context?: boolean;
      enhanced_insights?: boolean;
      context_id?: string;
      persist_state?: boolean;
    } = {}
  ) => {
    setIsPipelineRunning(true);
    setError(null);
    
    try {
      setCurrentPhase('planning');
      const result = await molasService.runPipeline({
        user_query,
        method_id,
        params,
        csv_data,
        ...options
      });
      
      setPipelineResult(result);
      setCurrentPhase('complete');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown pipeline error';
      setError(errorMessage);
      console.error('MOLAS pipeline error:', err);
      return null;
    } finally {
      setIsPipelineRunning(false);
    }
  };
  
  return {
    runPipeline,
    isPipelineRunning,
    currentPhase,
    error,
    pipelineResult
  };
};

/**
 * Example usage of adapters in a component:
 * 
 * ```tsx
 * import { useMOLASPipelineAdapter } from '../hooks/adapters/useMOLASAdapter.ts';
 * 
 * export const MOLASAnalysisComponent = () => {
 *   const { runPipeline, isPipelineRunning, pipelineResult } = useMOLASPipelineAdapter();
 *   
 *   const handleAnalysis = async () => {
 *     const result = await runPipeline(
 *       "Analyze sales seasonality patterns", 
 *       "stl", 
 *       { period: 12 }, 
 *       csvData,
 *       { enhanced_insights: true }
 *     );
 *     
 *     if (result) {
 *       // Handle results
 *       console.log("Analysis summary:", result.interpretation.summary);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleAnalysis} disabled={isPipelineRunning}>
 *         {isPipelineRunning ? 'Analyzing...' : 'Run Analysis'}
 *       </button>
 *       
 *       {pipelineResult && (
 *         <div>
 *           <h3>Analysis Results</h3>
 *           <p>{pipelineResult.interpretation.summary}</p>
 *           <ul>
 *             {pipelineResult.interpretation.key_insights.map((insight, i) => (
 *               <li key={i}>{insight}</li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
