import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDiscoveryModule } from '@/hooks/useDiscoveryModule';
import { usePlanningModule } from '@/hooks/usePlanningModule';
import { useReasoningModule } from '@/hooks/useReasoningModule';
import { useEnhancedToolUseModule } from '@/hooks/useEnhancedToolUseModule';
import { useInterpretationModule } from '@/hooks/useInterpretationModule';
import { useSeasonalityContext } from '@/hooks/useSeasonalityContext';

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

export const useSeasonalityAgent = (agentId: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { context, switchContext, updatePlan, saveContext } = useSeasonalityContext(agentId);

  // Enhanced MoLAS Modules
  const { selectMethod } = useDiscoveryModule();
  const { createPlan } = usePlanningModule();
  const { generateCode } = useReasoningModule();
  const { executeWithRealData } = useEnhancedToolUseModule();
  const { interpretResults } = useInterpretationModule();

  const analyzeSeasonality = async (request: SeasonalityAnalysisRequest): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    
    try {
      console.log('=== Enhanced MoLAS Pipeline with Real Data Processing ===');
      console.log('Request details:', { 
        query: request.query.substring(0, 50),
        hasRealData: !!request.csvData,
        analysisType: request.analysisType,
        dataDescription: request.dataDescription
      });

      // Step 1: Enhanced Discovery Module
      await switchContext('discovery', { 
        conversationHistory: [...(context?.conversationHistory || []), { type: 'request', data: request }],
        dataAvailable: !!request.csvData,
        enhancedProcessing: true
      });

      const discoveryResult = await selectMethod({
        user_query: request.query,
        context: request.dataDescription,
        has_data: !!request.csvData,
        preferred_method: request.analysisType,
        enhanced_mode: true
      });

      // Step 2: Enhanced Planning Module
      await switchContext('planning');
      const planningResult = createPlan({
        method_id: discoveryResult.method_id,
        params: {
          period: request.period,
          data_source: request.csvData ? 'user_provided_real_data' : 'synthetic',
          enhanced_processing: true,
          real_data_integration: !!request.csvData,
          ...request.parameters
        }
      });

      await updatePlan({
        currentMethod: discoveryResult.method_id,
        requiredSteps: planningResult.required_steps,
        parameters: planningResult.analysis_config,
        executionStatus: 'enhanced_planning_complete',
        dataIntegration: !!request.csvData,
        realDataProcessing: true
      });

      // Step 3: Enhanced Reasoning Module
      await switchContext('reasoning');
      const reasoningResult = await generateCode({
        func_prompt: planningResult.func_prompt,
        required_steps: planningResult.required_steps,
        max_attempts: 3,
        include_data_processing: !!request.csvData,
        real_data_support: true
      });

      await updatePlan({
        executionStatus: 'enhanced_code_generated',
        generatedCode: reasoningResult.code,
        verificationStatus: reasoningResult.verification_status,
        codeOptimized: true,
        realDataSupport: true
      });

      // Step 4: Enhanced Tool Use Module - Real Data Processing
      await switchContext('execution');
      const executionResult = await executeWithRealData({
        code: reasoningResult.code,
        execution_context: {
          ...planningResult.analysis_config,
          csv_data: request.csvData,
          user_query: request.query,
          analysis_type: request.analysisType,
          enhanced_processing: true
        }
      });

      await updatePlan({
        executionStatus: 'enhanced_execution_complete',
        executionResults: executionResult,
        statisticalMetrics: executionResult.metrics,
        dataQuality: executionResult.dataQuality,
        realAnalysis: true,
        processedDataset: executionResult.processedDataset,
        businessInsights: executionResult.businessInsights
      });

      // Step 5: Enhanced Interpretation Module
      await switchContext('interpretation');
      const interpretationResult = await interpretResults({
        result: executionResult,
        method_id: discoveryResult.method_id,
        user_query: request.query,
        statistical_metrics: executionResult.metrics,
        business_context: true,
        enhanced_insights: true,
        real_data_analysis: !!request.csvData
      });

      // Final enhanced context save
      await saveContext({
        currentPhase: 'interpretation',
        analysisScope: {
          method: discoveryResult.method_id,
          completedAt: new Date().toISOString(),
          success: true,
          realStatistics: true,
          dataProcessed: !!request.csvData,
          enhancedProcessing: true,
          dataQuality: executionResult.dataQuality,
          businessInsights: executionResult.businessInsights?.length || 0
        }
      });

      console.log('=== Enhanced MoLAS Pipeline Completed Successfully ===');

      // Assemble enhanced business-friendly result
      const finalResult: AnalysisResult = {
        method: discoveryResult.method_id,
        summary: generateEnhancedBusinessSummary(
          executionResult, 
          interpretationResult, 
          !!request.csvData
        ),
        insights: executionResult.businessInsights || generateEnhancedBusinessInsights(
          executionResult.metrics, 
          interpretationResult.key_insights
        ),
        recommendations: interpretationResult.recommendations,
        code: reasoningResult.code,
        plots: executionResult.plots,
        statisticalMetrics: executionResult.metrics,
        dataQuality: executionResult.dataQuality,
        limitations: reasoningResult.verification_status !== 'verified' ? 
          [`Code verification: ${reasoningResult.verification_status}`, ...reasoningResult.missing_steps] : [],
        execution_details: {
          realStatisticalAnalysis: true,
          enhancedProcessing: true,
          processingTime: executionResult.execution_time,
          dataSource: request.csvData ? 'user_provided_real_data' : 'synthetic',
          context_switches: ['discovery', 'planning', 'reasoning', 'execution', 'interpretation'],
          plan_evolution: context?.planState,
          dataQuality: executionResult.dataQuality,
          processedDataset: executionResult.processedDataset,
          discovery: {
            method_selected: discoveryResult.method_id,
            confidence: discoveryResult.confidence,
            data_aware: !!request.csvData,
            enhanced_mode: true
          },
          planning: {
            required_steps: planningResult.required_steps,
            config: planningResult.analysis_config,
            real_data_integration: !!request.csvData
          },
          reasoning: {
            verification_status: reasoningResult.verification_status,
            attempts_used: reasoningResult.attempts_used,
            optimized: true,
            real_data_support: true
          },
          execution: {
            status: executionResult.status,
            execution_time: executionResult.execution_time,
            metrics: executionResult.metrics,
            real_calculations: true,
            data_quality: executionResult.dataQuality,
            enhanced_processing: true
          },
          interpretation: {
            confidence_score: interpretationResult.message.confidence_score,
            data_quality: interpretationResult.message.data_quality,
            business_focused: true,
            enhanced_insights: true
          }
        }
      };

      toast({
        title: "Enhanced MoLAS Analysis Complete",
        description: `Successfully completed ${discoveryResult.method_id} analysis with ${request.csvData ? 'real data processing' : 'synthetic data demo'}.`,
      });

      return finalResult;

    } catch (error) {
      console.error('Enhanced MoLAS Pipeline Error:', error);
      
      await saveContext({
        currentPhase: 'discovery',
        analysisScope: {
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date().toISOString(),
          realStatistics: true,
          enhancedProcessing: true
        }
      });

      toast({
        title: "Enhanced Analysis Failed",
        description: "Failed to complete enhanced seasonality analysis with real data processing",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeSeasonality,
    isAnalyzing,
    context,
    switchContext,
    updatePlan
  };
};

// Enhanced helper functions
function generateEnhancedBusinessSummary(
  executionResult: any, 
  interpretationResult: any, 
  hasRealData: boolean
): string {
  const metrics = executionResult.metrics;
  const dataSource = hasRealData ? "your uploaded data" : "synthetic demonstration data";
  const dataPoints = executionResult.processedDataset?.data?.length || executionResult.dataframes[0]?.shape[0] || 0;
  
  if (hasRealData && executionResult.processedDataset) {
    const quality = executionResult.processedDataset.qualityReport;
    const trend = metrics.trendSlope > 0 ? 'growing' : metrics.trendSlope < -0.01 ? 'declining' : 'stable';
    const seasonality = metrics.seasonalityStrength > 0.3 ? 'strong' : metrics.seasonalityStrength > 0.1 ? 'moderate' : 'weak';
    
    return `🔍 **Real Data Analysis Complete**: Processed ${dataPoints} data points from ${dataSource} with ${quality.quality} data quality (${quality.validRows}/${quality.totalRows} valid rows). 

📊 **Key Findings**: Your ${quality.dataType} data shows a ${trend} trend with ${seasonality} seasonal patterns. Statistical analysis reveals ${(metrics.seasonalityStrength * 100).toFixed(1)}% seasonality strength and ${metrics.stationarity ? 'stationary' : 'non-stationary'} behavior.

✅ **Data Quality**: ${((quality.validRows / quality.totalRows) * 100).toFixed(1)}% completeness with ${quality.outliers} outliers detected.`;
  } else {
    return `📊 **Synthetic Data Demo**: Analyzed ${dataPoints} demonstration data points to show capabilities. Upload your CSV file to see real analysis of your actual data with the same enhanced processing pipeline.`;
  }
}

function generateEnhancedBusinessInsights(metrics: any, aiInsights: string[]): string[] {
  const businessInsights = [
    `📈 **Trend Analysis**: ${metrics.trendSlope > 0 ? 'Positive growth trajectory detected' : metrics.trendSlope < -0.01 ? 'Declining performance trend identified' : 'Stable baseline performance maintained'} (slope: ${metrics.trendSlope?.toFixed(4) || 'N/A'})`,
    `🔄 **Seasonality Impact**: ${((metrics.seasonalityStrength || 0) * 100).toFixed(1)}% of total variation explained by seasonal factors${metrics.seasonalityStrength > 0.3 ? ' - Strong seasonal effect' : metrics.seasonalityStrength > 0.1 ? ' - Moderate seasonal effect' : ' - Weak seasonal effect'}`,
    `📊 **Performance Consistency**: CV = ${((metrics.standardDeviation / metrics.mean) * 100).toFixed(1)} indicates ${(metrics.standardDeviation / metrics.mean) < 0.2 ? 'consistent' : 'variable'} performance patterns`,
    `🎯 **Predictability Score**: ${Math.abs(metrics.autocorrelation || 0) > 0.5 ? 'High' : Math.abs(metrics.autocorrelation || 0) > 0.3 ? 'Medium' : 'Low'} predictability based on autocorrelation (${((metrics.autocorrelation || 0) * 100).toFixed(1)}%)`,
    `🔍 **Statistical Confidence**: 95% confidence interval: ${metrics.confidenceInterval?.lower?.toFixed(2) || 'N/A'} to ${metrics.confidenceInterval?.upper?.toFixed(2) || 'N/A'}`
  ];
  
  // Combine with AI-generated insights
  const enhancedAIInsights = aiInsights.map(insight => `🤖 **AI Insight**: ${insight}`);
  
  return [...businessInsights, ...enhancedAIInsights];
}
