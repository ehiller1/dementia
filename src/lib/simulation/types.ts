/**
 * Types and interfaces for the Monte Carlo simulation integration
 */

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  metrics: Record<string, any>;
}

export interface SimulationDistributionPoint {
  outcome: string | number;
  probability: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidenceLevel?: number; // e.g. 0.95 for 95% confidence
}

export interface RecommendedAction {
  actionId: string;
  actionName: string;
  actionDescription: string;
  expectedOutcome: string;
  successProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  implementationSteps?: string[];
  dependencies?: string[];
  timeFrame?: {
    start?: Date;
    end?: Date;
    estimatedDurationDays?: number;
  };
  resources?: {
    type: string;
    amount: number;
    unit: string;
  }[];
}

export interface SimulationAggregateMetrics {
  expectedValue: number;
  confidenceIntervals: ConfidenceInterval[];
  probabilityDistribution: SimulationDistributionPoint[];
  recommendedActions: RecommendedAction[];
  sensitivityAnalysis?: {
    factor: string;
    impact: number;
  }[];
  riskAssessment?: {
    category: string;
    probability: number;
    impact: number;
    mitigationStrategy?: string;
  }[];
}

export interface SimulationResult {
  id: string;
  name: string;
  description: string;
  simulationType: string;
  createdAt: Date;
  updatedAt: Date;
  templateId?: string;
  createdBy?: string;
  scenarios: SimulationScenario[];
  aggregateMetrics: SimulationAggregateMetrics;
  rawResult: Record<string, any>;
}

export interface SimulationMemoryItem {
  simulationId: string;
  simulationType: string;
  simulationName: string;
  summary: string;
  keyFindings: string[];
  timestamp: Date;
  recommendedActionIds: string[];
  templateId?: string;
  confidenceScore: number;
}

export type SimulationDecisionType = 
  'SIMULATION_ACTION_APPROVAL' | 
  'AUTOMATED_SIMULATION_ACTION' | 
  'SIMULATION_RESULT_REVIEW' |
  'SIMULATION_CONFIG_APPROVAL';

export type SimulationDecisionStatus = 
  'PENDING' | 
  'APPROVED' | 
  'REJECTED' | 
  'COMPLETED' | 
  'FAILED';

export interface SimulationDecision {
  id: string;
  actionId: string;
  actionName: string;
  simulationContext: SimulationResult;
  successProbability: number;
  expectedOutcome: string;
  decisionType: SimulationDecisionType;
  status: SimulationDecisionStatus;
  agentId?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  executedAt?: Date;
  executionResult?: any;
}

export interface SimulationActionPlan {
  template: any; // Template interface from your system
  actionFunctions: any[]; // Function interface from your system
  originalSimulationId: string;
  successProbabilities: Map<string, number>; // Maps function IDs to probabilities
  actionToAgentMapping?: Map<string, string>; // Maps action IDs to agent IDs
  executionOrder?: string[]; // Action IDs in execution order
  dependencyGraph?: Map<string, string[]>; // Maps action IDs to dependent action IDs
}
