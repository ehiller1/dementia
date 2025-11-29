
import { useState } from 'react';
import { useToolUseModuleAdapter } from './adapters/useMOLASAdapter.ts';
import { EnhancedExecutionRequest, EnhancedExecutionResult } from '../services/MOLASService.ts';

/**
 * Enhanced Tool Use Module Hook
 * 
 * Refactored to use the MOLAS service adapter.
 * Maintains the same interface as the original hook for backward compatibility.
 */

export const useEnhancedToolUseModule = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const { executeWithData, isExecuting: adapterExecuting, error, executionResult } = useToolUseModuleAdapter();

  // Maintain compatibility with existing interface
  const executeWithRealData = async (request: EnhancedExecutionRequest): Promise<EnhancedExecutionResult> => {
    console.log('=== Enhanced Tool Use Module - Refactored with MOLAS Service ===');
    setIsExecuting(true);
    
    try {
      const result = await executeWithData(
        request.code,
        request.execution_context.csv_data,
        request.execution_context.user_query,
        request.execution_context.analysis_type,
        request.execution_context
      );
      
      console.log('Tool Use Module execution complete');
      return result || {
        status: 'error',
        execution_time: 0,
        dataframes: [],
        plots: [],
        metrics: {},
        output: '',
        error: 'Execution failed with no specific error'  
      };
    } catch (err) {
      console.error('Tool Use Module error:', err);
      return {
        status: 'error',
        execution_time: 0,
        dataframes: [],
        plots: [],
        metrics: {},
        output: '',
        error: err instanceof Error ? err.message : 'Unknown execution error'
      };
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    executeWithRealData,
    isExecuting: isExecuting || adapterExecuting,
    error,
    executionResult
  };
};

