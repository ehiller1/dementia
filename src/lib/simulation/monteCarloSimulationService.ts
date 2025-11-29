import { v4 as uuidv4 } from 'uuid';
import { SimulationResult, SimulationScenario, SimulationAggregateMetrics } from './types';
import { supabase as supabase } from '../../lib/supabase';

export interface MonteCarloSimulationParams {
  // Core parameters
  iterations: number;
  timeHorizon: number; // in days
  
  // Business metrics
  baseRevenue: number;
  minRevenue: number;
  maxRevenue: number;
  
  // Risk factors
  riskFactors: Array<{
    name: string;
    impact: number; // -1 to 1
    probability: number; // 0 to 1
  }>;
  
  // External dependencies (optional)
  dependencies?: Array<{
    name: string;
    weight: number;
    impactOnRevenue: (iteration: number) => number;
  }>;
}

interface MonteCarloResult {
  simulationId: string;
  iterations: number;
  outcomes: number[];
  metrics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: {
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
    };
  };
  scenarios: SimulationScenario[];
  confidenceIntervals: {
    lower: number;
    upper: number;
    confidence: number;
  }[];
}

export class MonteCarloSimulationService {
  /**
   * Run a Monte Carlo simulation with the given parameters
   */
  async runSimulation(params: MonteCarloSimulationParams): Promise<MonteCarloResult> {
    const simulationId = uuidv4();
    const outcomes: number[] = [];
    
    // Run simulation iterations
    for (let i = 0; i < params.iterations; i++) {
      const iterationResult = this.runIteration(params, i);
      outcomes.push(iterationResult);
    }
    
    // Calculate metrics
    const metrics = this.calculateMetrics(outcomes);
    
    // Generate scenarios
    const scenarios = this.generateScenarios(outcomes, params);
    
    // Calculate confidence intervals
    const confidenceIntervals = this.calculateConfidenceIntervals(outcomes, [0.9, 0.95, 0.99]);
    
    return {
      simulationId,
      iterations: params.iterations,
      outcomes,
      metrics,
      scenarios,
      confidenceIntervals
    };
  }
  
  /**
   * Run a single iteration of the Monte Carlo simulation
   */
  private runIteration(params: MonteCarloSimulationParams, iteration: number): number {
    // Start with base revenue
    let result = params.baseRevenue;
    
    // Apply risk factors
    for (const factor of params.riskFactors) {
      if (Math.random() < factor.probability) {
        // Apply impact (can be positive or negative)
        result *= (1 + factor.impact);
      }
    }
    
    // Apply external dependencies
    if (params.dependencies) {
      for (const dep of params.dependencies) {
        const impact = dep.impactOnRevenue(iteration);
        result += impact * dep.weight;
      }
    }
    
    // Ensure result is within bounds
    return Math.max(params.minRevenue, Math.min(params.maxRevenue, result));
  }
  
  /**
   * Calculate statistical metrics from simulation outcomes
   */
  private calculateMetrics(outcomes: number[]): MonteCarloResult['metrics'] {
    const sorted = [...outcomes].sort((a, b) => a - b);
    const n = sorted.length;
    
    // Basic metrics
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    
    // Standard deviation
    const squaredDiffs = sorted.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    
    // Percentiles
    const percentile = (p: number) => {
      const pos = (n - 1) * p;
      const base = Math.floor(pos);
      const rest = pos - base;
      
      if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
      }
      return sorted[base];
    };
    
    return {
      mean,
      median: percentile(0.5),
      stdDev,
      min: sorted[0],
      max: sorted[n - 1],
      percentiles: {
        p5: percentile(0.05),
        p25: percentile(0.25),
        p50: percentile(0.5),
        p75: percentile(0.75),
        p95: percentile(0.95)
      }
    };
  }
  
  /**
   * Generate simulation scenarios based on outcomes
   */
  private generateScenarios(outcomes: number[], params: MonteCarloSimulationParams): SimulationScenario[] {
    const sorted = [...outcomes].sort((a, b) => a - b);
    const n = sorted.length;
    
    // Define scenario percentiles
    const optimisticIndex = Math.floor(n * 0.9); // Top 10%
    const pessimisticIndex = Math.floor(n * 0.1); // Bottom 10%
    
    return [
      // Optimistic scenario (90th percentile)
      {
        id: `optimistic-${Date.now()}`,
        name: 'Optimistic',
        description: 'Best-case scenario based on top 10% of outcomes',
        probability: 0.1,
        metrics: {
          revenue: sorted[optimisticIndex],
          riskLevel: 'low' as const,
          confidence: 0.8,
          topPositiveRiskFactors: params.riskFactors
            .filter(f => f.impact > 0)
            .sort((a, b) => b.impact - a.impact)
            .slice(0, 3)
        },
      },
      
      // Expected scenario (median)
      {
        id: `expected-${Date.now()}`,
        name: 'Expected',
        description: 'Most likely scenario based on median outcome',
        probability: 0.8,
        metrics: {
          revenue: sorted[Math.floor(n / 2)],
          riskLevel: 'medium' as const,
          confidence: 0.9,
          topImpactRiskFactors: params.riskFactors
            .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
            .slice(0, 3)
        },
      },
      
      // Pessimistic scenario (10th percentile)
      {
        id: `pessimistic-${Date.now()}`,
        name: 'Pessimistic',
        description: 'Worst-case scenario based on bottom 10% of outcomes',
        probability: 0.1,
        metrics: {
          revenue: sorted[pessimisticIndex],
          riskLevel: 'high' as const,
          confidence: 0.8,
          topNegativeRiskFactors: params.riskFactors
            .filter(f => f.impact < 0)
            .sort((a, b) => a.impact - b.impact)
            .slice(0, 3)
        },
      }
    ];
  }
  
  /**
   * Calculate confidence intervals for the simulation outcomes
   */
  private calculateConfidenceIntervals(
    outcomes: number[],
    confidences: number[]
  ): MonteCarloResult['confidenceIntervals'] {
    const sorted = [...outcomes].sort((a, b) => a - b);
    const n = sorted.length;
    
    return confidences.map(confidence => {
      const lowerPercentile = (1 - confidence) / 2;
      const upperPercentile = 1 - lowerPercentile;
      
      const lowerIdx = Math.floor(n * lowerPercentile);
      const upperIdx = Math.ceil(n * upperPercentile);
      
      return {
        lower: sorted[Math.max(0, lowerIdx)],
        upper: sorted[Math.min(n - 1, upperIdx)],
        confidence
      };
    });
  }
  
  /**
   * Save simulation results to the database
   */
  async saveResults(simulationId: string, results: MonteCarloResult): Promise<void> {
    const { error } = await supabase
      .from('simulation_results')
      .insert({
        id: simulationId,
        simulation_type: 'monte_carlo',
        parameters: results,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error saving simulation results:', error);
      throw new Error(`Failed to save simulation results: ${error.message}`);
    }
  }
  
  /**
   * Load simulation results from the database
   */
  async loadResults(simulationId: string): Promise<MonteCarloResult | null> {
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('id', simulationId)
      .single();
      
    if (error || !data) {
      console.error('Error loading simulation results:', error);
      return null;
    }
    
    return data.parameters as MonteCarloResult;
  }
}

// Export a singleton instance
export const monteCarloSimulationService = new MonteCarloSimulationService();
