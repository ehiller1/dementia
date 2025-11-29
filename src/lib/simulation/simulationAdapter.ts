import { v4 as uuidv4 } from 'uuid';
import { 
  SimulationResult, 
  SimulationScenario, 
  RecommendedAction,
  SimulationAggregateMetrics,
  ConfidenceInterval,
  SimulationDistributionPoint,
  SimulationMemoryItem
} from './types';
import { MemoryService } from '../memory/memoryService';
import { monteCarloSimulationService, type MonteCarloSimulationParams } from './monteCarloSimulationService';

// Define interfaces specific to this adapter that are not part of shared simulation types
export interface MonteCarloSimulationData {
  simulation_id: string;
  name: string;
  description?: string;
  start_time?: string | Date;
  end_time?: string | Date;
  parameters: Record<string, any>;
  results: { value: number; probability: number; scenario_id?: string; parameters?: Record<string, any> }[];
  scenarios?: SimulationScenario[];
  recommendations?: any[];
  metadata?: Record<string, any>;
  monte_carlo_simulation_outcomes?: {
    marketing_simulation?: any;
    inventory_simulation?: any;
    combined_scenario_analysis?: any;
  };
}
 

/**
 * Adapter service to transform Monte Carlo simulation data into structured format
 * for integration with the template engine and agent discovery system
 */
export class SimulationAdapter {
  private memoryService: MemoryService;
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.95;

  constructor(memoryService: MemoryService) {
    this.memoryService = memoryService;
  }
  
  /**
   * Safely access nested object properties
   */
  private safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
    return path.split('.').reduce((acc, key) => {
      try {
        return acc && acc[key] !== undefined ? acc[key] : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    }, obj);
  }

  /**
   * Capitalize the first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert risk level string to standardized format
   */
  private convertRiskLevel(level: string): 'low' | 'medium' | 'high' {
    const normalized = level.toLowerCase();
    if (normalized.includes('high')) return 'high';
    if (normalized.includes('medium')) return 'medium';
    return 'low';
  }
  
  /**
   * Get default metrics with error message
   */
  private getDefaultMetrics(message: string): SimulationAggregateMetrics {
    return {
      expectedValue: 0,
      confidenceIntervals: [],
      probabilityDistribution: [],
      recommendedActions: [],
      sensitivityAnalysis: [],
      riskAssessment: [
        {
          category: 'general',
          probability: 0,
          impact: 0,
          mitigationStrategy: message
        }
      ]
    };
  }

  /**
   * Extract scenarios from raw simulation data
   */
  private extractScenarios(data: any, type: string): SimulationScenario[] {
    if (!data) return [];
    
    const timestamp = new Date();
    const scenarios = Array.isArray(data) ? data : [data];
    
    return scenarios.map((item: any) => ({
      id: item.id || `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || `${this.capitalizeFirstLetter(type)} Scenario`,
      description: item.description || `Generated ${type} scenario`,
      type,
      metrics: item.metrics || {},
      probability: item.probability || 1,
      metadata: {
        ...(item.metadata || {}),
        created: timestamp.toISOString(),
        source: 'monte_carlo_simulation',
        type
      },
      timestamp
    }));
  }

  /**
   * Extract recommended actions from simulation results
   */
  private extractRecommendedActions(results: any): RecommendedAction[] {
    if (!results || !results.recommendations) return [];
    
    const recommendations = Array.isArray(results.recommendations) 
      ? results.recommendations 
      : [results.recommendations];
    
    const timestamp = new Date();
    return recommendations
      .filter((r: any) => r && r.action)
      .map((rec: any) => ({
        id: rec.id || `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: rec.title || 'Recommended Action',
        description: rec.description || rec.action,
        priority: rec.priority || 'medium',
        category: rec.category || 'general',
        impact: typeof rec.impact === 'number' ? rec.impact : 0,
        confidence: typeof rec.confidence === 'number' 
          ? Math.min(Math.max(rec.confidence, 0), 1) 
          : 0.8,
        implementationSteps: Array.isArray(rec.steps) 
          ? rec.steps 
          : [rec.action].filter(Boolean),
        estimatedEffort: typeof rec.effort === 'number' 
          ? Math.max(1, rec.effort) 
          : 1,
        createdAt: timestamp,
        updatedAt: timestamp
      }));
  }

  /**
   * Analyze sensitivity of simulation parameters
   */
  private analyzeSensitivity(params: MonteCarloSimulationParams, results: any): any[] {
    if (!results || !results.sensitivity) return [];
    
    return Object.entries(results.sensitivity).map(([param, value]: [string, any]) => ({
      parameter: param,
      impact: typeof value.impact === 'number' ? value.impact : 0,
      correlation: typeof value.correlation === 'number' 
        ? Math.min(Math.max(value.correlation, -1), 1) 
        : 0,
      confidence: typeof value.confidence === 'number' 
        ? Math.min(Math.max(value.confidence, 0), 1) 
        : this.DEFAULT_CONFIDENCE_LEVEL
    }));
  }

  /**
   * Assess risks based on simulation scenarios
   */
  private assessRisks(scenarios: SimulationScenario[]): { riskLevel: 'low' | 'medium' | 'high'; details: string } {
    if (!scenarios.length) {
      return { riskLevel: 'low', details: 'No risk scenarios to assess' };
    }
    
    const riskScores = scenarios
      .map(s => (s.metrics as any)?.riskScore)
      .filter((score): score is number => 
        typeof score === 'number' && score >= 0 && score <= 1
      );
    
    if (!riskScores.length) {
      return { riskLevel: 'medium', details: 'Insufficient data for risk assessment' };
    }
    
    const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    
    if (avgRisk > 0.7) return { riskLevel: 'high', details: 'High risk scenarios detected' };
    if (avgRisk > 0.3) return { riskLevel: 'medium', details: 'Moderate risk level' };
    return { riskLevel: 'low', details: 'Low risk scenarios' };
  }

  /**
   * Calculate aggregate metrics from simulation results
   */
  private calculateAggregateMetrics(
    results: any[], 
    confidenceLevel: number = this.DEFAULT_CONFIDENCE_LEVEL
  ): SimulationAggregateMetrics {
    if (!results || !results.length) {
      return this.getDefaultMetrics('No results provided for aggregation');
    }

    // Extract values for calculations
    const values = results.map(r => 
      typeof r.value === 'number' ? r.value : 0
    ).filter(v => !isNaN(v));

    if (!values.length) {
      return this.getDefaultMetrics('No valid numeric values found in results');
    }

    // Basic statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (values.length - 1)
    );

    // Confidence interval (simplified Z-score for 95% confidence)
    const z = 1.96; // Z-score for 95% confidence
    const marginOfError = z * (stdDev / Math.sqrt(values.length));
    
    // Probability distribution (simplified histogram)
    const distribution = this.createDistribution(values, 10);

    return {
      expectedValue: mean,
      confidenceIntervals: [
        { lower: mean - marginOfError, upper: mean + marginOfError, confidenceLevel: confidenceLevel }
      ],
      probabilityDistribution: distribution.points,
      recommendedActions: [],
      sensitivityAnalysis: [],
      riskAssessment: [
        {
          category: this.calculateRiskLevel(mean, stdDev, min, max),
          probability: 0,
          impact: 0,
          mitigationStrategy: `Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`
        }
      ]
    };
  }

  /**
   * Create a probability distribution from values
   */
  private createDistribution(
    values: number[], 
    numBins: number
  ): { points: SimulationDistributionPoint[], bins: number } {
    if (!values.length) return { points: [], bins: 0 };
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binSize = range / numBins;
    
    // Initialize bins
    const bins = new Array(numBins).fill(0);
    
    // Count values in each bin
    values.forEach(value => {
      if (value === max) {
        bins[numBins - 1]++;
      } else {
        const binIndex = Math.min(
          Math.floor((value - min) / binSize),
          numBins - 1
        );
        bins[binIndex]++;
      }
    });
    
    // Convert to distribution points
    const total = values.length;
    const points = bins.map((count, i) => ({
      outcome: min + (i + 0.5) * binSize,
      probability: count / total
    }));
    
    return { points, bins: numBins };
  }

  /**
   * Calculate risk level based on statistical properties
   */
  private calculateRiskLevel(
    mean: number, 
    stdDev: number, 
    min: number, 
    max: number
  ): 'low' | 'medium' | 'high' {
    const coefficientOfVariation = stdDev / Math.abs(mean) || 0;
    const range = max - min;
    
    if (coefficientOfVariation > 0.5 || range > 3 * stdDev) {
      return 'high';
    } else if (coefficientOfVariation > 0.2 || range > 2 * stdDev) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Process raw Monte Carlo simulation data into structured results
   */
  public async processSimulationData(
    rawData: any,
    templateId?: string
  ): Promise<SimulationResult> {
    console.log(`[📊 SimulationAdapter] Processing simulation data...`);
    
    try {
      // Extract and transform data
      const scenarios = this.extractScenarios(rawData.scenarios || [], 'simulation');
      const recommendedActions = this.extractRecommendedActions(rawData);
      const metrics = this.calculateAggregateMetrics(
        rawData.results || [],
        this.DEFAULT_CONFIDENCE_LEVEL
      );

      // Create simulation result aligned with shared SimulationResult type
      const result: SimulationResult = {
        id: rawData.simulation_id || `sim-${Date.now()}`,
        name: rawData.name || 'Monte Carlo Simulation',
        description: rawData.description || 'Simulation results',
        simulationType: 'monte_carlo',
        createdAt: new Date(rawData.start_time || Date.now()),
        updatedAt: new Date(rawData.end_time || Date.now()),
        templateId: templateId,
        scenarios,
        aggregateMetrics: metrics,
        rawResult: JSON.parse(JSON.stringify(rawData))
      };

      // NOTE: Storage integration is handled by SimulationTemplateEngine

      return result;
    } catch (error) {
      console.error('[❌ SimulationAdapter] Error processing simulation data:', error);
      throw new Error(`Failed to process simulation data: ${error.message}`);
    }
  }

  /**
   * Run a Monte Carlo simulation with the given parameters
   */
  public async runMonteCarloSimulation(
    params: MonteCarloSimulationParams,
    templateId?: string
  ): Promise<SimulationResult> {
    console.log(`[📊 SimulationAdapter] Starting Monte Carlo simulation...`);
    
    try {
      // Run the simulation
      const rawResults = await monteCarloSimulationService.runSimulation(params);
      
      // Process and return the results
      return this.processSimulationData(rawResults, templateId);
    } catch (error) {
      console.error('[❌ SimulationAdapter] Simulation failed:', error);
      throw new Error(`Simulation failed: ${error.message}`);
    }
  }

  /** Duplicate helper implementations removed to avoid conflicts **/

  /**
   * Run a new Monte Carlo simulation with the given parameters
   */
  /**
   * Run a new Monte Carlo simulation with the given parameters
   */
  /**
   * Run a Monte Carlo simulation with the given parameters
   */
  async runMonteCarloSimulation(params: MonteCarloSimulationParams): Promise<SimulationResult> {
    console.log(`[📊 SimulationAdapter] Starting new Monte Carlo simulation...`);
    
    try {
      // Run the simulation
      const results = await monteCarloSimulationService.runSimulation(params);
      
      // Convert to SimulationResult format
      const simulationResult: SimulationResult = {
        id: results.simulationId,
        name: `Monte Carlo Simulation - ${new Date().toISOString().split('T')[0]}`,
        description: `Monte Carlo simulation with ${params.iterations} iterations`,
        simulationType: 'monte_carlo',
        createdAt: new Date(),
        updatedAt: new Date(),
        scenarios: results.scenarios || [],
        aggregateMetrics: {
          expectedValue: results.metrics?.mean || 0,
          confidenceIntervals: (results.confidenceIntervals || []).map(ci => ({
            lower: ci.lower || 0,
            upper: ci.upper || 0,
            confidence: ci.confidence || 0.95,
            metric: 'revenue'
          })),
          probabilityDistribution: {
            type: 'monte_carlo',
            values: (results.outcomes || []).map((value: number) => ({
              value,
              probability: 1 / (results.outcomes?.length || 1)
            })),
            bins: 20
          },
          recommendedActions: this.extractRecommendedActions(results),
          sensitivityAnalysis: this.analyzeSensitivity(params, results),
          riskAssessment: this.assessRisks(results.scenarios || [])
        },
        rawResult: results
      };
      
      // Store in memory if memory service is available
      if (this.memoryService && typeof this.memoryService.store === 'function') {
        try {
          await this.memoryService.store('simulation_results', simulationResult);
        } catch (storageError) {
          console.warn('[⚠️ SimulationAdapter] Failed to store simulation result in memory:', storageError);
        }
      }
      
      return simulationResult;
      
    } catch (error) {
      console.error('[❌ SimulationAdapter] Error running Monte Carlo simulation:', error);
      throw new Error(`Failed to run simulation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Process raw simulation data into structured SimulationResult
   */
  async processSimulationData(
    rawSimulationData: unknown, 
    templateId?: string
  ): Promise<SimulationResult> {
    try {
      const data = rawSimulationData as MonteCarloSimulationData;
      const monteCarlo = data?.monte_carlo_simulation_outcomes;
      
      if (!monteCarlo) {
        throw new Error('Invalid simulation data format: missing monte_carlo_simulation_outcomes');
      }
      
      console.log(`[📊 SimulationAdapter] Processing data for product: ${monteCarlo.product_category} (SKU: ${monteCarlo.sku_id})`);
      
      // Extract scenarios from different simulation types
      const scenarios: SimulationScenario[] = [
        ...this.extractScenarios(monteCarlo.marketing_simulation, 'marketing'),
        ...this.extractScenarios(monteCarlo.inventory_simulation, 'inventory'),
        ...this.extractScenarios(monteCarlo.combined_scenario_analysis, 'combined')
      ];
      
      // Create simulation result
      const simulationResult: SimulationResult = {
        id: `sim-${uuidv4()}`,
        name: `Simulation - ${monteCarlo.product_category} - ${new Date().toISOString().split('T')[0]}`,
        description: `Simulation for ${monteCarlo.product_category} (${monteCarlo.sku_id})`,
        simulationType: 'monte_carlo',
        createdAt: new Date(),
        updatedAt: new Date(),
        scenarios,
        aggregateMetrics: this.calculateAggregateMetrics(scenarios),
        rawResult: data
      };
      
      // Store in memory if memory service is available
      if (this.memoryService && typeof this.memoryService.store === 'function') {
        try {
          await this.memoryService.store('simulation_results', simulationResult);
        } catch (storageError) {
          console.warn('[⚠️ SimulationAdapter] Failed to store simulation result in memory:', storageError);
        }
      }
      
      return simulationResult;
      
    } catch (error) {
      console.error('[❌ SimulationAdapter] Error processing simulation data:', error);
      throw new Error(`Failed to process simulation data: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log(`[📊 SimulationAdapter] PROCESSING Monte Carlo simulation data...`);
    console.log(`[📊 SimulationAdapter] Processing data for product: ${rawSimulationData.monte_carlo_simulation_outcomes.product_category} (SKU: ${rawSimulationData.monte_carlo_simulation_outcomes.sku_id})`);
    
    const monteCarlo = rawSimulationData.monte_carlo_simulation_outcomes;
    
    // Extract scenarios from marketing, inventory and combined scenarios
    console.log(`[📊 SimulationAdapter] Extracting scenarios from simulation data...`);
    const scenarios: SimulationScenario[] = [
      ...this.extractMarketingScenarios(monteCarlo.marketing_simulation),
      ...this.extractInventoryScenarios(monteCarlo.inventory_simulation),
      ...this.extractCombinedScenarios(monteCarlo.combined_scenario_analysis)
    ];
    console.log(`[📊 SimulationAdapter] Extracted ${scenarios.length} scenarios (${scenarios.filter(s => s.category === 'marketing').length} marketing, ${scenarios.filter(s => s.category === 'inventory').length} inventory, ${scenarios.filter(s => s.category === 'combined').length} combined)`);

    // Extract recommended actions from the simulation
    console.log(`[📊 SimulationAdapter] Extracting recommended actions...`);
    const recommendedActions = this.extractRecommendedActions(monteCarlo);
    console.log(`[📊 SimulationAdapter] Extracted ${recommendedActions.length} recommended actions with confidence scores ranging from ${Math.min(...recommendedActions.map(a => a.confidenceScore)).toFixed(2)} to ${Math.max(...recommendedActions.map(a => a.confidenceScore)).toFixed(2)}`);

    // Build aggregate metrics
    console.log(`[📊 SimulationAdapter] Building aggregate metrics...`);
    const aggregateMetrics: SimulationAggregateMetrics = {
      expectedValue: this.calculateExpectedValue(monteCarlo),
      confidenceIntervals: this.extractConfidenceIntervals(monteCarlo),
      probabilityDistribution: this.extractProbabilityDistribution(monteCarlo),
      recommendedActions,
      sensitivityAnalysis: this.extractSensitivityAnalysis(monteCarlo),
      riskAssessment: this.extractRiskAssessment(monteCarlo)
    };

    const simulationId = uuidv4();
    console.log(`[📊 SimulationAdapter] Creating simulation result with ID: ${simulationId}`);
    
    const simulationResult: SimulationResult = {
      id: simulationId,
      name: `${monteCarlo.product_category} - ${monteCarlo.sku_id} Simulation`,
      description: `Monte Carlo simulation for ${monteCarlo.product_category} (SKU: ${monteCarlo.sku_id}) with forecast horizon of ${monteCarlo.simulation_metadata.forecast_horizon_days} days`,
      simulationType: 'marketing_inventory_combined',
      createdAt: new Date(),
      updatedAt: new Date(),
      templateId,
      scenarios,
      aggregateMetrics,
      rawResult: monteCarlo
    };

    // Store in memory system
    console.log(`[📊 SimulationAdapter] Storing simulation in memory system...`);
    await this.storeSimulationInMemory(simulationResult);
    
    console.log(`[📊 SimulationAdapter] Simulation processing COMPLETE. Ready for template engine and agent execution.`);
    
    return simulationResult;
  }

  /**
   * Store simulation insights in the memory system
   */
  private async storeSimulationInMemory(simulationResult: SimulationResult): Promise<void> {
    console.log(`[📊 SimulationAdapter] Creating memory item for simulation ${simulationResult.id}...`);
    
    // Create memory item for the simulation
    const memoryItem: SimulationMemoryItem = {
      simulationId: simulationResult.id,
      simulationType: simulationResult.simulationType,
      simulationName: simulationResult.name,
      summary: this.generateSimulationSummary(simulationResult),
      keyFindings: this.extractKeyFindings(simulationResult),
      timestamp: new Date(),
      recommendedActionIds: simulationResult.aggregateMetrics.recommendedActions.map(a => a.actionId),
      templateId: simulationResult.templateId,
      confidenceScore: this.calculateOverallConfidence(simulationResult)
    };

    // Generate embedding for the memory item for semantic search
    console.log(`[📊 SimulationAdapter] Generating embedding for semantic search...`);
    const embeddingText = [
      memoryItem.simulationName,
      memoryItem.summary,
      ...memoryItem.keyFindings
    ].join(' ');
    
    const embedding = await this.embeddingService.generateEmbedding(embeddingText);
    console.log(`[📊 SimulationAdapter] Embedding generated successfully with ${embedding.length} dimensions.`);

    // Store in long-term memory
    await this.memoryService.storeInLongTermMemory({
      type: 'simulation_result',
      content: memoryItem,
      metadata: {
        simulationId: simulationResult.id,
        simulationType: simulationResult.simulationType,
        confidenceScore: memoryItem.confidenceScore,
        actionCount: memoryItem.recommendedActionIds.length,
        createdAt: memoryItem.timestamp.toISOString()
      },
      embedding
    });

    // Also update working memory with key simulation insights
    await this.memoryService.updateWorkingMemory({
      key: 'current_simulation_insights',
      value: {
        id: simulationResult.id,
        type: simulationResult.simulationType,
        keyFindings: memoryItem.keyFindings,
        topRecommendations: simulationResult.aggregateMetrics.recommendedActions
          .slice(0, 3)
          .map(a => ({
            actionId: a.actionId,
            actionName: a.actionName,
            successProbability: a.successProbability,
            expectedOutcome: a.expectedOutcome
          }))
      }
    });
  }

  /**
   * Extract marketing scenarios from the simulation data
   */
  private extractMarketingScenarios(marketingData: any): SimulationScenario[] {
    if (!marketingData || !marketingData.scenarios) return [];
    
    return Object.entries(marketingData.scenarios).map(([key, value]: [string, any]) => ({
      id: `marketing_${key}_${uuidv4().slice(0, 8)}`,
      name: this.capitalizeFirstLetter(key.replace(/_/g, ' ')),
      description: value.description,
      probability: value.probability,
      metrics: value.outcomes || {}
    }));
  }

  /**
   * Extract inventory scenarios from the simulation data
   */
  private extractInventoryScenarios(inventoryData: any): SimulationScenario[] {
    if (!inventoryData || !inventoryData.scenarios) return [];
    
    return Object.entries(inventoryData.scenarios).map(([key, value]: [string, any]) => ({
      id: `inventory_${key}_${uuidv4().slice(0, 8)}`,
      name: this.capitalizeFirstLetter(key.replace(/_/g, ' ')),
      description: value.description,
      probability: value.probability,
      metrics: value.outcomes || {}
    }));
  }

  /**
   * Extract combined scenarios from the simulation data
   */
  private extractCombinedScenarios(combinedData: any): SimulationScenario[] {
    if (!combinedData) return [];
    
    return Object.entries(combinedData).map(([key, value]: [string, any]) => ({
      id: `combined_${key}_${uuidv4().slice(0, 8)}`,
      name: this.capitalizeFirstLetter(key.replace(/_/g, ' ')),
      description: value.description,
      probability: value.probability,
      metrics: {
        total_demand: value.total_demand,
        total_inventory: value.total_inventory,
        stockout_risk: value.stockout_risk,
        revenue_potential: value.revenue_potential,
        risk_level: value.risk_level,
        roi_estimate: value.roi_estimate
      }
    }));
    
    }

  /**
   * Extract confidence intervals from the simulation data
   */
  private extractConfidenceIntervals(monteCarlo: any): ConfidenceInterval[] {
    const intervals: ConfidenceInterval[] = [];
    
    // Marketing confidence intervals
    const marketingScenarios = monteCarlo.marketing_simulation?.scenarios || {};
    Object.values(marketingScenarios).forEach((scenario: any) => {
      if (scenario.outcomes?.confidence_interval_90pct) {
        intervals.push({
          lower: scenario.outcomes.confidence_interval_90pct[0],
          upper: scenario.outcomes.confidence_interval_90pct[1],
          confidenceLevel: 0.9
        });
      }
    });
    
    // Inventory confidence intervals
    const inventoryScenarios = monteCarlo.inventory_simulation?.scenarios || {};
    Object.values(inventoryScenarios).forEach((scenario: any) => {
      if (scenario.outcomes?.confidence_interval_90pct) {
        intervals.push({
          lower: scenario.outcomes.confidence_interval_90pct[0],
          upper: scenario.outcomes.confidence_interval_90pct[1],
          confidenceLevel: 0.9
        });
      }
    });
    
    return intervals;
  }

  /**
   * Extract probability distribution from the simulation data
   */
  private extractProbabilityDistribution(monteCarlo: any): SimulationDistributionPoint[] {
    const distribution: SimulationDistributionPoint[] = [];
    
    // Revenue scenarios distribution
    const revenueScenarios = monteCarlo.financial_projections?.revenue_scenarios || {};
    Object.entries(revenueScenarios).forEach(([key, value]: [string, any]) => {
      distribution.push({
        outcome: value.total_revenue,
        probability: value.probability
      });
    });
    
    // Add marketing scenarios
    const marketingScenarios = monteCarlo.marketing_simulation?.scenarios || {};
    Object.entries(marketingScenarios).forEach(([key, value]: [string, any]) => {
      if (value.outcomes?.total_90_day_demand) {
        distribution.push({
          outcome: value.outcomes.total_90_day_demand,
          probability: value.probability
        });
      }
    });
    
    return distribution;
  }

  /**
   * Extract sensitivity analysis from the simulation data
   */
  private extractSensitivityAnalysis(monteCarlo: any): { factor: string, impact: number }[] {
    const analysis: { factor: string, impact: number }[] = [];
    
    // Marketing factors
    if (monteCarlo.marketing_simulation?.risk_metrics) {
      const metrics = monteCarlo.marketing_simulation.risk_metrics;
      
      analysis.push({
        factor: 'Marketing Spend Ratio',
        impact: metrics.optimal_marketing_spend_ratio || 0
      });
      
      analysis.push({
        factor: 'Campaign Effectiveness',
        impact: metrics.break_even_campaign_effectiveness || 0
      });
    }
    
    // Inventory factors
    if (monteCarlo.inventory_simulation?.risk_metrics) {
      const metrics = monteCarlo.inventory_simulation.risk_metrics;
      
      analysis.push({
        factor: 'Safety Stock Days',
        impact: metrics.optimal_safety_stock_days / 10 || 0
      });
      
      analysis.push({
        factor: 'Capital Efficiency',
        impact: metrics.capital_efficiency_score || 0
      });
    }
    
    return analysis;
  }

  /**
   * Extract risk assessment from the simulation data
   */
  private extractRiskAssessment(monteCarlo: any): { category: string, probability: number, impact: number, mitigationStrategy?: string }[] {
    const assessment: { category: string, probability: number, impact: number, mitigationStrategy?: string }[] = [];
    
    // Marketing risks
    if (monteCarlo.marketing_simulation?.risk_metrics) {
      const metrics = monteCarlo.marketing_simulation.risk_metrics;
      
      assessment.push({
        category: 'Campaign Failure',
        probability: metrics.campaign_failure_probability || 0,
        impact: 0.7,
        mitigationStrategy: 'A/B test campaign elements before full deployment'
      });
    }
    
    // Inventory risks
    if (monteCarlo.inventory_simulation?.risk_metrics) {
      const metrics = monteCarlo.inventory_simulation.risk_metrics;
      
      if (metrics.current_stockout_risk) {
        assessment.push({
          category: 'Stockout Risk',
          probability: this.convertRiskProbability(metrics.current_stockout_risk),
          impact: 0.8,
          mitigationStrategy: 'Implement automated reorder alerts for critical inventory levels'
        });
      }
      
      if (metrics.overstock_risk) {
        assessment.push({
          category: 'Overstock Risk',
          probability: this.convertRiskProbability(metrics.overstock_risk),
          impact: 0.5,
          mitigationStrategy: 'Develop markdown strategy for excess inventory'
        });
      }
    }
    
    return assessment;
  }

  /**
   * Calculate expected value from financial projections
   */
  private calculateExpectedValue(monteCarlo: any): number {
    let expectedValue = 0;
    let totalProbability = 0;
    
    const revenueScenarios = monteCarlo.financial_projections?.revenue_scenarios || {};
    
    Object.values(revenueScenarios).forEach((scenario: any) => {
      expectedValue += scenario.total_revenue * scenario.probability;
      totalProbability += scenario.probability;
    });
    
    return totalProbability > 0 ? expectedValue / totalProbability : 0;
  }

  /**
   * Calculate overall confidence score for the simulation
   */
  private calculateOverallConfidence(simulationResult: SimulationResult): number {
    if (simulationResult.aggregateMetrics.recommendedActions.length === 0) {
      return 0.5;
    }
    
    const confidenceSum = simulationResult.aggregateMetrics.recommendedActions
      .reduce((sum, action) => sum + action.confidenceScore, 0);
      
    return confidenceSum / simulationResult.aggregateMetrics.recommendedActions.length;
  }

  /**
   * Calculate strategic success probability
   */
  private calculateStrategicSuccessProbability(monteCarlo: any): number {
    // Base on profit improvement and risk metrics
    const profitImprovement = monteCarlo.financial_projections?.profit_optimization?.improvement_percentage || 0;
    const marketingRisk = monteCarlo.marketing_simulation?.risk_metrics?.marketing_investment_risk || 'medium';
    const inventoryRisk = monteCarlo.inventory_simulation?.risk_metrics?.current_stockout_risk || 'medium';
    
    let riskFactor = 0.8; // Default
    
    if (marketingRisk === 'low' && (inventoryRisk === 'extremely_low' || inventoryRisk === 'very_low')) {
      riskFactor = 0.95;
    } else if (marketingRisk === 'high' || inventoryRisk === 'high') {
      riskFactor = 0.6;
    }
    
    // Scale by profit improvement potential
    const scaleFactor = Math.min(1.0, profitImprovement / 100 + 0.7);
    
    return riskFactor * scaleFactor;
  }

  /**
   * Generate a summary of the simulation
   */
  private generateSimulationSummary(simulationResult: SimulationResult): string {
    const monteCarlo = simulationResult.rawResult;
    const keyInsights = monteCarlo.key_insights || {};
    
    return [
      `Monte Carlo simulation for ${monteCarlo.product_category} (SKU: ${monteCarlo.sku_id})`,
      `Forecast horizon: ${monteCarlo.simulation_metadata.forecast_horizon_days} days`,
      `Marketing insight: ${keyInsights.marketing?.primary_finding || 'Not available'}`,
      `Inventory insight: ${keyInsights.inventory?.primary_finding || 'Not available'}`,
      `Strategic recommendation: ${keyInsights.strategic_recommendation?.action || 'Not available'}`,
      `Expected outcome: ${keyInsights.strategic_recommendation?.expected_outcome || 'Not available'}`
    ].join('. ');
  }

  /**
   * Extract key findings from the simulation
   */
  private extractKeyFindings(simulationResult: SimulationResult): string[] {
    const monteCarlo = simulationResult.rawResult;
    const keyInsights = monteCarlo.key_insights || {};
    const findings: string[] = [];
    
    if (keyInsights.marketing?.primary_finding) {
      findings.push(keyInsights.marketing.primary_finding);
    }
    
    if (keyInsights.marketing?.opportunity) {
      findings.push(keyInsights.marketing.opportunity);
    }
    
    if (keyInsights.inventory?.primary_finding) {
      findings.push(keyInsights.inventory.primary_finding);
    }
    
    if (keyInsights.inventory?.opportunity) {
      findings.push(keyInsights.inventory.opportunity);
    }
    
    if (keyInsights.strategic_recommendation?.action) {
      findings.push(keyInsights.strategic_recommendation.action);
    }
    
    if (keyInsights.strategic_recommendation?.expected_outcome) {
      findings.push(keyInsights.strategic_recommendation.expected_outcome);
    }
    
    return findings;
  }

  /**
   * Convert risk level string to standard format
   */
  private convertRiskLevel(riskLevel: string): 'low' | 'medium' | 'high' {
    if (!riskLevel) return 'medium';
    
    const lowerRisk = riskLevel.toLowerCase();
    
    if (lowerRisk.includes('low') || lowerRisk.includes('minimal')) {
      return 'low';
    } else if (lowerRisk.includes('high')) {
      return 'high';
    } else {
      return 'medium';
    }
  }

  /**
   * Map stockout risk string to risk level
   */
  private mapStockoutRiskToRiskLevel(stockoutRisk: string): 'low' | 'medium' | 'high' {
    if (!stockoutRisk) return 'medium';
    
    const lowerRisk = stockoutRisk.toLowerCase();
    
    if (lowerRisk.includes('extremely_low') || lowerRisk.includes('very_low') || lowerRisk.includes('low')) {
      return 'low';
    } else if (lowerRisk.includes('high')) {
      return 'high';
    } else {
      return 'medium';
    }
  }

  /**
   * Convert risk probability string to number
   */
  private convertRiskProbability(riskString: string): number {
    if (!riskString) return 0.5;
    
    const lowerRisk = riskString.toLowerCase();
    
    if (lowerRisk.includes('extremely_low')) {
      return 0.01;
    } else if (lowerRisk.includes('very_low')) {
      return 0.05;
    } else if (lowerRisk.includes('low')) {
      return 0.2;
    } else if (lowerRisk.includes('medium') || lowerRisk.includes('moderate')) {
      return 0.5;
    } else if (lowerRisk.includes('high')) {
      return 0.8;
    } else {
      return 0.5;
    }
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
