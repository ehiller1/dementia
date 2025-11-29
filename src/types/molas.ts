/**
 * Types for MOLAS (Multi-Objective Learning and Adaptation System) outputs
 * and prompt parameter mapping
 */

/**
 * MOLAS Output Interface
 * Represents the structured output from the MOLAS system
 */
export interface MOLASOutput {
  insights: MOLASInsights;
  decisions: MOLASDecisions;
  context: MOLASContext;
  metadata?: Record<string, any>;
}

/**
 * MOLAS Insights
 * Represents observations, patterns, and analytical results
 */
export interface MOLASInsights {
  type?: string;
  source?: string;
  timestamp?: string;
  details?: Record<string, any>;
  significance?: 'low' | 'medium' | 'high';
  relatedEntities?: Array<{
    id: string;
    type: string;
    relevance: number;
  }>;
  [key: string]: any;
}

/**
 * MOLAS Decisions
 * Represents action recommendations and decision logic
 */
export interface MOLASDecisions {
  type?: string;
  target?: string | null;
  parameters?: Record<string, any>;
  confidence?: number;
  alternatives?: Array<{
    type: string;
    parameters: Record<string, any>;
    confidence: number;
  }>;
  reasoning?: string;
  [key: string]: any;
}

/**
 * MOLAS Context
 * Represents the current state and environmental factors
 */
export interface MOLASContext {
  workflow?: {
    id?: string;
    state?: string;
    history?: Array<{
      state: string;
      timestamp: string;
    }>;
    [key: string]: any;
  };
  entities?: Record<string, any>;
  metrics?: Record<string, any>;
  userContext?: Record<string, any>;
  systemState?: Record<string, any>;
  environmentFactors?: Record<string, any>;
  [key: string]: any;
}

/**
 * Prompt Parameters
 * Structured parameters used in prompt templates
 */
export interface PromptParameters {
  action: {
    type: string;
    target: string | null;
    parameters: Record<string, any>;
    confidence: number;
    alternatives: Array<{
      type: string;
      parameters: Record<string, any>;
      confidence: number;
    }>;
    reasoning: string;
    [key: string]: any;
  };
  event: {
    type: string;
    source: string;
    timestamp: string;
    details: Record<string, any>;
    significance: string;
    relatedEntities: Array<{
      id: string;
      type: string;
      relevance: number;
    }>;
    [key: string]: any;
  };
  state: {
    currentWorkflow: Record<string, any>;
    entities: Record<string, any>;
    metrics: Record<string, any>;
    userContext: Record<string, any>;
    systemState: Record<string, any>;
    environmentFactors: Record<string, any>;
    [key: string]: any;
  };
  [key: string]: any;
}
