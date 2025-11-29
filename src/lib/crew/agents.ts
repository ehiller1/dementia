// Mock Agent class since CrewAI exports are not available
class Agent {
  constructor(config: any) {
    Object.assign(this, config);
  }
}

/**
 * Creates a data preparation specialist agent that focuses on processing
 * and cleaning time series data for seasonality analysis.
 */
export const createDataPrepAgent = () => {
  return new Agent({
    name: 'Data Preparation Specialist',
    goal: 'Prepare and clean time series data for accurate seasonality analysis',
    backstory: `You are an expert in data cleaning, normalization, and preparation 
    for time series analysis. You specialize in identifying and handling outliers, 
    imputing missing values, and ensuring data is properly formatted for seasonality analysis.`,
    verbose: true,
    allowDelegation: true,
    tools: []  // Tools will be added through the API integration
  });
};

/**
 * Creates a seasonality analyst agent that focuses on detecting and analyzing
 * seasonal patterns in time series data.
 */
export const createSeasonalityAnalystAgent = () => {
  return new Agent({
    name: 'Seasonality Analyst',
    goal: 'Discover and analyze seasonal patterns in time series data',
    backstory: `You are a highly skilled statistical analyst specializing in detecting 
    seasonal patterns in various types of time series data. You have expertise in 
    decomposition methods, time series analysis, and pattern recognition.`,
    verbose: true,
    allowDelegation: true,
    tools: []  // Tools will be added through the API integration
  });
};

/**
 * Creates a business insights specialist agent that translates technical
 * seasonality findings into business recommendations.
 */
export const createBusinessInsightsAgent = () => {
  return new Agent({
    name: 'Business Insights Specialist',
    goal: 'Translate seasonality analysis into actionable business insights',
    backstory: `You are a business intelligence expert who specializes in converting 
    technical statistical findings into practical business insights and recommendations. 
    You help organizations understand the implications of seasonal patterns and how 
    to leverage them for business advantage.`,
    verbose: true,
    allowDelegation: true,
    tools: []  // Tools will be added through the API integration
  });
};

/**
 * Creates a visualization specialist agent that produces effective
 * visualizations of seasonality analysis results.
 */
export const createVisualizationAgent = () => {
  return new Agent({
    name: 'Visualization Specialist',
    goal: 'Create clear and insightful visualizations of seasonality patterns',
    backstory: `You are an expert in data visualization with a focus on time series 
    and seasonality patterns. You know how to represent complex temporal patterns 
    in ways that are easily understood by business stakeholders.`,
    verbose: true,
    allowDelegation: true,
    tools: []  // Tools will be added through the API integration
  });
};
