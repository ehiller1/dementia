// Mock classes since CrewAI exports are not available
class Task {
  constructor(config: any) {
    Object.assign(this, config);
  }
}

class Agent {
  constructor(config: any) {
    Object.assign(this, config);
  }
}

/**
 * Creates a data preprocessing task that prepares time series data
 * for seasonality analysis.
 */
export const createDataPreprocessingTask = (
  agent: Agent, 
  dataDescription: string, 
  csvData?: string
) => {
  return new Task({
    description: `Preprocess and clean the time series data for seasonality analysis.
    
    Data Description: ${dataDescription}
    
    Your responsibilities:
    1. Identify and handle missing values
    2. Detect and address outliers
    3. Convert data types to appropriate formats
    4. Normalize/standardize data if necessary
    5. Check for and handle duplicates
    6. Ensure data is properly ordered by timestamp
    7. Report on data quality metrics
    
    Provide a detailed report of your preprocessing steps and the quality of the data.`,
    agent,
    context: csvData ? `CSV Data:\n${csvData.substring(0, 1000)}...(truncated)` : 'Generate synthetic data based on the description',
    expectedOutput: `{
      "processedData": "...",
      "dataQualityReport": {
        "totalRows": 0,
        "validRows": 0,
        "missingValues": 0,
        "outliers": 0,
        "duplicates": 0,
        "quality": "high|medium|low"
      },
      "dataStatistics": {
        "min": 0,
        "max": 0,
        "mean": 0,
        "median": 0,
        "std": 0
      }
    }`
  });
};

/**
 * Creates a seasonality analysis task that identifies seasonal patterns
 * in the preprocessed data.
 */
export const createSeasonalityAnalysisTask = (
  agent: Agent, 
  period: number, 
  analysisType: string,
  query: string
) => {
  return new Task({
    description: `Analyze the preprocessed time series data to identify seasonal patterns.
    
    Query: ${query}
    Period: ${period}
    Analysis Method: ${analysisType}
    
    Your responsibilities:
    1. Perform time series decomposition using the specified method
    2. Identify the strength and frequency of seasonal patterns
    3. Calculate seasonality metrics
    4. Test for stationarity and trend
    5. Provide statistical evidence for your findings
    
    Generate a comprehensive analysis of the seasonality patterns in the data.`,
    agent,
    context: `Analysis type is ${analysisType}, with period ${period}. Consider the best approach for this specific case.`,
    expectedOutput: `{
      "method": "${analysisType}",
      "seasonalityStrength": 0.0,
      "trendSlope": 0.0,
      "stationarity": true|false,
      "frequencyDomain": [...],
      "autocorrelation": 0.0,
      "seasonalityTests": {...},
      "confidenceInterval": {"lower": 0.0, "upper": 0.0}
    }`
  });
};

/**
 * Creates a business insights task that translates technical findings
 * into business recommendations.
 */
export const createBusinessInsightsTask = (
  agent: Agent, 
  query: string,
  dataDescription: string
) => {
  return new Task({
    description: `Translate the technical seasonality analysis into actionable business insights.
    
    Query: ${query}
    Data Description: ${dataDescription}
    
    Your responsibilities:
    1. Interpret the seasonal patterns in business context
    2. Identify business opportunities based on seasonality
    3. Propose strategies to leverage seasonal patterns
    4. Provide risk assessment for seasonal fluctuations
    5. Suggest KPIs for monitoring seasonal performance
    
    Generate meaningful business insights and recommendations based on the seasonality analysis.`,
    agent,
    expectedOutput: `{
      "insights": ["..."],
      "recommendations": ["..."],
      "opportunities": ["..."],
      "risks": ["..."],
      "kpis": ["..."]
    }`
  });
};

/**
 * Creates a visualization task that produces visual representations
 * of the seasonality analysis.
 */
export const createVisualizationTask = (
  agent: Agent,
  analysisType: string
) => {
  return new Task({
    description: `Create effective visualizations of the seasonality analysis results.
    
    Analysis Method: ${analysisType}
    
    Your responsibilities:
    1. Design appropriate time series plots
    2. Visualize the decomposition components (trend, seasonal, residual)
    3. Create seasonal subseries plots
    4. Generate heatmaps for seasonal patterns
    5. Provide annotated explanations for each visualization
    
    Generate visualization code and descriptions that clearly communicate the seasonality patterns.`,
    agent,
    expectedOutput: `{
      "plots": [
        {"type": "time_series", "code": "...", "description": "..."},
        {"type": "decomposition", "code": "...", "description": "..."},
        {"type": "seasonal_subseries", "code": "...", "description": "..."},
        {"type": "heatmap", "code": "...", "description": "..."}
      ]
    }`
  });
};
