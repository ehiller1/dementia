// Create type definitions to match what we need without depending on crewai exports
type Agent = any;
type Task = any;

// Use require for runtime dependencies
const crewAI = require('crewai');
const Crew = crewAI.Crew;

import { ResultCache, SeasonalityCacheKey } from './result-cache';
import { 
  createDataPrepAgent, 
  createSeasonalityAnalystAgent,
  createBusinessInsightsAgent,
  createVisualizationAgent 
} from './agents';
import {
  createDataPreprocessingTask,
  createSeasonalityAnalysisTask,
  createBusinessInsightsTask,
  createVisualizationTask
} from './tasks';
import { FeedbackLoopManager } from './feedback-loop';

interface SeasonalityCrewInput {
  query: string;
  dataDescription: string;
  period: number;
  analysisType: string;
  csvData?: string;
  parameters?: any;
}

interface SeasonalityCrewConfig {
  verbose?: boolean;
  cacheResults?: boolean;
  sequential?: boolean;
  enableFeedbackLoop?: boolean;
  maxIterations?: number;
  cacheConfig?: {
    maxItems?: number;
    maxAgeMs?: number;
    enableExpiry?: boolean;
  };
}

// Global cache instance to share across crew instances
let globalCache: ResultCache | null = null;

/**
 * Creates and orchestrates a CrewAI crew for performing
 * comprehensive seasonality analysis.
 */
export const createSeasonalityCrew = (
  input: SeasonalityCrewInput,
  config: SeasonalityCrewConfig = {}
) => {
  // Initialize or reuse the results cache
  if (config.cacheResults && !globalCache) {
    globalCache = new ResultCache(config.cacheConfig);
  }
  
  // Check if we have a cached result for this input
  const cacheKey: SeasonalityCacheKey = {
    query: input.query,
    dataDescription: input.dataDescription,
    period: String(input.period), // Ensure period is a string
    analysisType: input.analysisType,
    csvData: input.csvData
  };
  
  // Check cache for existing result
  if (config.cacheResults && globalCache && globalCache.has(cacheKey)) {
    console.log('🚀 Found cached result for query, returning from cache');
    const cachedResult = globalCache.get(cacheKey);
    
    // We'll still create and return the crew object for API consistency,
    // but the run method will return the cached result
    const cachedCrew = {
      cached: true,
      cachedResult
    };
    
    return {
      crew: null,
      agents: {},
      tasks: {},
      feedbackLoop: null,
      cachedCrew,
      async run() {
        return cachedResult;
      }
    };
  }
  
  // Create agents
  const dataPrepAgent = createDataPrepAgent();
  const seasonalityAnalystAgent = createSeasonalityAnalystAgent();
  const businessInsightsAgent = createBusinessInsightsAgent();
  const visualizationAgent = createVisualizationAgent();
  
  // Setup feedback loop manager if enabled
  const feedbackLoopEnabled = config.enableFeedbackLoop ?? false;
  const feedbackLoop = feedbackLoopEnabled ? 
    new FeedbackLoopManager({ maxIterations: config.maxIterations || 3 }) : 
    null;
  
  // Create tasks
  const dataPreprocessingTask = createDataPreprocessingTask(
    dataPrepAgent, 
    input.dataDescription, 
    input.csvData
  );
  
  const seasonalityAnalysisTask = createSeasonalityAnalysisTask(
    seasonalityAnalystAgent,
    input.period,
    input.analysisType,
    input.query
  );
  
  const businessInsightsTask = createBusinessInsightsTask(
    businessInsightsAgent,
    input.query,
    input.dataDescription
  );
  
  const visualizationTask = createVisualizationTask(
    visualizationAgent,
    input.analysisType
  );
  
  // Define initial task collection
  const initialTasks = [
    dataPreprocessingTask,
    seasonalityAnalysisTask,
    businessInsightsTask,
    visualizationTask
  ];
  
  // Create and configure crew
  const crew = new Crew({
    agents: [
      dataPrepAgent,
      seasonalityAnalystAgent,
      businessInsightsAgent,
      visualizationAgent
    ],
    tasks: initialTasks,
    verbose: config.verbose ?? true,
    cache: config.cacheResults ?? false,
    sequential: config.sequential ?? true,
  });
  
  return {
    crew,
    agents: {
      dataPrepAgent,
      seasonalityAnalystAgent,
      businessInsightsAgent,
      visualizationAgent
    },
    tasks: {
      dataPreprocessingTask,
      seasonalityAnalysisTask,
      businessInsightsTask,
      visualizationTask
    },
    feedbackLoop,
    cachedCrew: null,
    async run() {
      if (!feedbackLoopEnabled) {
        const results = await crew.run();
    
    // Store results in cache if caching is enabled
    if (config.cacheResults && globalCache) {
      console.log('💾 Storing results in cache for future use');
      const parsedResults = parseCrewResult(results, feedbackLoop);
      globalCache.set(cacheKey, parsedResults, feedbackLoop);
    }
    
    return results;
      }

      // With feedback loop enabled, we run in stages and incorporate feedback
      console.log('🔄 Starting CrewAI execution with feedback loop enabled');
      
      // Step 1: Run data preprocessing
      console.log('📊 Running data preprocessing task...');
      const [dataPreprocessingResult] = await crew.kickoff([
        dataPreprocessingTask
      ]);
      
      // Record the result in the feedback loop
      feedbackLoop.recordTaskOutput(
        'data-preprocessing',
        dataPrepAgent.name,
        dataPreprocessingResult
      );
      
      // Step 2: Create feedback task for data preprocessing
      const dataFeedbackTask = feedbackLoop.createFeedbackTask(
        seasonalityAnalystAgent,
        dataPrepAgent.name,
        'data-preprocessing',
        dataPreprocessingTask.description
      );
      
      console.log('🔍 Collecting feedback on data preprocessing...');
      const [dataFeedbackResult] = await crew.kickoff([dataFeedbackTask]);
      
      // Record feedback
      feedbackLoop.recordFeedback(
        seasonalityAnalystAgent.name,
        dataPrepAgent.name,
        'data-preprocessing',
        dataFeedbackResult
      );
      
      // Step 3: Create improvement task if needed
      const dataImprovementTask = feedbackLoop.createImprovementTask(
        dataPrepAgent,
        'data-preprocessing',
        dataPreprocessingTask.description
      );
      
      let finalDataPreprocessingResult = dataPreprocessingResult;
      
      if (dataImprovementTask) {
        console.log('✨ Improving data preprocessing based on feedback...');
        const [improvedDataResult] = await crew.kickoff([dataImprovementTask]);
        
        // Record the improvement
        feedbackLoop.recordImprovement(
          dataPrepAgent.name,
          'data-preprocessing',
          improvedDataResult,
          ['Incorporated analyst feedback on data quality']
        );
        
        finalDataPreprocessingResult = improvedDataResult;
      }
      
      // Step 4: Run seasonality analysis with the improved data
      console.log('📈 Running seasonality analysis task...');
      const [seasonalityAnalysisResult] = await crew.kickoff([
        seasonalityAnalysisTask
      ]);
      
      // Record the result
      feedbackLoop.recordTaskOutput(
        'seasonality-analysis',
        seasonalityAnalystAgent.name,
        seasonalityAnalysisResult
      );
      
      // Step 5: Get business expert feedback on seasonality analysis
      const seasonalityFeedbackTask = feedbackLoop.createFeedbackTask(
        businessInsightsAgent,
        seasonalityAnalystAgent.name,
        'seasonality-analysis',
        seasonalityAnalysisTask.description
      );
      
      console.log('🔍 Collecting feedback on seasonality analysis...');
      const [seasonalityFeedbackResult] = await crew.kickoff([seasonalityFeedbackTask]);
      
      // Record feedback
      feedbackLoop.recordFeedback(
        businessInsightsAgent.name,
        seasonalityAnalystAgent.name,
        'seasonality-analysis',
        seasonalityFeedbackResult
      );
      
      // Step 6: Create improvement task if needed
      const seasonalityImprovementTask = feedbackLoop.createImprovementTask(
        seasonalityAnalystAgent,
        'seasonality-analysis',
        seasonalityAnalysisTask.description
      );
      
      let finalSeasonalityAnalysisResult = seasonalityAnalysisResult;
      
      if (seasonalityImprovementTask) {
        console.log('✨ Improving seasonality analysis based on feedback...');
        const [improvedSeasonalityResult] = await crew.kickoff([seasonalityImprovementTask]);
        
        // Record the improvement
        feedbackLoop.recordImprovement(
          seasonalityAnalystAgent.name,
          'seasonality-analysis',
          improvedSeasonalityResult,
          ['Incorporated business expert feedback on analysis']
        );
        
        finalSeasonalityAnalysisResult = improvedSeasonalityResult;
      }
      
      // Step 7: Generate business insights with the improved analysis
      console.log('💡 Generating business insights...');
      const [businessInsightsResult] = await crew.kickoff([
        businessInsightsTask
      ]);
      
      // Record the result
      feedbackLoop.recordTaskOutput(
        'business-insights',
        businessInsightsAgent.name,
        businessInsightsResult
      );
      
      // Step 8: Generate visualizations
      console.log('📊 Creating visualizations...');
      const [visualizationResult] = await crew.kickoff([
        visualizationTask
      ]);
      
      // Record the result
      feedbackLoop.recordTaskOutput(
        'visualization',
        visualizationAgent.name,
        visualizationResult
      );
      
      console.log('✅ CrewAI execution with feedback loop completed');
      
      // Return results from all tasks
      const results = [
        finalDataPreprocessingResult,
        finalSeasonalityAnalysisResult,
        businessInsightsResult,
        visualizationResult
      ];
      
      // Store results in cache if caching is enabled
      if (config.cacheResults && globalCache) {
        console.log('💾 Storing results in cache for future use');
        const parsedResults = parseCrewResult(results, feedbackLoop);
        globalCache.set(cacheKey, parsedResults, feedbackLoop);
      }
      
      return results;
    }
  };
};

/**
 * Parses the raw output from the CrewAI execution into a structured format
 * compatible with the existing seasonality agent result format.
 */
export const parseCrewResult = (crewResult: any, feedbackLoop?: FeedbackLoopManager | null) => {
  try {
    // Extract results from each agent's output
    let dataPreprocessing: Record<string, any> = {};
    let seasonalityAnalysis: Record<string, any> = {};
    let businessInsights: Record<string, any> = {};
    let visualization: Record<string, any> = {};
    
    // Process raw results from crewAI
    if (Array.isArray(crewResult) && crewResult.length >= 4) {
      try {
        dataPreprocessing = JSON.parse(crewResult[0]);
      } catch (e) {
        console.warn('Error parsing dataPreprocessing result:', e);
        dataPreprocessing = { rawOutput: crewResult[0] };
      }
      
      try {
        seasonalityAnalysis = JSON.parse(crewResult[1]);
      } catch (e) {
        console.warn('Error parsing seasonalityAnalysis result:', e);
        seasonalityAnalysis = { rawOutput: crewResult[1] };
      }
      
      try {
        businessInsights = JSON.parse(crewResult[2]);
      } catch (e) {
        console.warn('Error parsing businessInsights result:', e);
        businessInsights = { rawOutput: crewResult[2] };
      }
      
      try {
        visualization = JSON.parse(crewResult[3]);
      } catch (e) {
        console.warn('Error parsing visualization result:', e);
        visualization = { rawOutput: crewResult[3] };
      }
    } else {
      console.warn('CrewAI result is not in the expected format:', crewResult);
    }
    
    // Extract feedback metrics if feedback loop is enabled
    const feedbackMetricsData = feedbackLoop ? {
      dataPreprocessing: feedbackLoop.getImprovementMetrics('data-preprocessing', 'Data Preparation Specialist'),
      seasonalityAnalysis: feedbackLoop.getImprovementMetrics('seasonality-analysis', 'Seasonality Analyst'),
      businessInsights: feedbackLoop.getImprovementMetrics('business-insights', 'Business Insights Specialist'),
      visualization: feedbackLoop.getImprovementMetrics('visualization', 'Visualization Specialist')
    } : null;

    // Format the result to match the expected output structure
    return {
      // Method information
      method: seasonalityAnalysis.method || 'crew_analysis',
      
      // Summary from combined insights
      summary: generateSummary(dataPreprocessing, seasonalityAnalysis),
      
      // Insights from business insights agent
      insights: businessInsights.insights || [],
      
      // Recommendations from business insights agent
      recommendations: businessInsights.recommendations || [],
      
      // Visualization code
      plots: visualization.plots?.map(p => p.code) || [],
      
      // Statistical metrics from seasonality analysis
      statisticalMetrics: {
        seasonalityStrength: seasonalityAnalysis.seasonalityStrength,
        trendSlope: seasonalityAnalysis.trendSlope,
        stationarity: seasonalityAnalysis.stationarity,
        autocorrelation: seasonalityAnalysis.autocorrelation,
        confidenceInterval: seasonalityAnalysis.confidenceInterval,
        ...dataPreprocessing.dataStatistics
      },
      
      // Data quality information
      dataQuality: dataPreprocessing.dataQualityReport?.quality || 'unknown',
      
      // Execution details for debugging and monitoring
      execution_details: {
        feedbackLoopEnabled: !!feedbackLoop,
        feedbackMetrics: feedbackMetricsData,
        crewExecution: true,
        dataPreprocessing: dataPreprocessing,
        seasonalityAnalysis: seasonalityAnalysis,
        businessInsights: businessInsights,
        visualization: visualization
      }
    };
  } catch (error) {
    console.error('Error parsing crew result:', error);
    return {
      method: 'crew_analysis',
      summary: 'Error parsing crew results',
      insights: [],
      recommendations: [],
      code: '',
      plots: [],
      limitations: [`Error parsing crew results: ${error.message}`],
      execution_details: {
        feedbackLoopEnabled: !!feedbackLoop,
        feedbackMetrics: null, // No metrics in error case
        error: error.message, 
        rawResults: crewResult 
      }
    };
  }
};

/**
 * Generates a summary from the data preprocessing and seasonality analysis results.
 */
function generateSummary(dataPreprocessing: any, seasonalityAnalysis: any): string {
  const dataQuality = dataPreprocessing.dataQualityReport?.quality || 'unknown';
  const validRows = dataPreprocessing.dataQualityReport?.validRows || 0;
  const totalRows = dataPreprocessing.dataQualityReport?.totalRows || 0;
  const seasonalityStrength = seasonalityAnalysis.seasonalityStrength || 0;
  const trendSlope = seasonalityAnalysis.trendSlope || 0;
  const stationarity = seasonalityAnalysis.stationarity ? 'stationary' : 'non-stationary';

  const trend = trendSlope > 0 ? 'growing' : trendSlope < -0.01 ? 'declining' : 'stable';
  const seasonality = seasonalityStrength > 0.3 ? 'strong' : seasonalityStrength > 0.1 ? 'moderate' : 'weak';

  return `🔍 **CrewAI Analysis Complete**: Processed ${totalRows} data points with ${dataQuality} data quality (${validRows}/${totalRows} valid rows).

📊 **Key Findings**: Your data shows a ${trend} trend with ${seasonality} seasonal patterns. Statistical analysis reveals ${(seasonalityStrength * 100).toFixed(1)}% seasonality strength and ${stationarity} behavior.

✅ **Data Quality**: ${totalRows > 0 ? ((validRows / totalRows) * 100).toFixed(1) : 0}% completeness with ${dataPreprocessing.dataQualityReport?.outliers || 0} outliers detected.`;
}
