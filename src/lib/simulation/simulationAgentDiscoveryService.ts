import { RecommendedAction, SimulationResult } from './types';
import { AgentDiscoveryService } from '../agent/agentDiscoveryService';
import { MemoryService } from '../memory/memoryService';
import { OpenAIEmbeddingService } from '../embedding/openAIEmbeddingService';
import { supabase } from '../supabase';

/**
 * Specialized agent discovery service for simulation-based actions
 * Extends the base AgentDiscoveryService with simulation-specific logic
 */
export class SimulationAgentDiscoveryService extends AgentDiscoveryService {
  private memoryService: MemoryService;
  private embeddingService: OpenAIEmbeddingService;

  constructor(
    memoryService: MemoryService,
    embeddingService: OpenAIEmbeddingService
  ) {
    super();
    this.memoryService = memoryService;
    this.embeddingService = embeddingService;
  }

  /**
   * Specialized agent discovery for simulation actions
   */
  async selectAgentForSimulationAction(
    action: RecommendedAction,
    simulationContext: SimulationResult
  ): Promise<any> {
    try {
      // 1. Check memory for past successful agents with this action type
      const pastSuccessfulAgents = await this.getPastSuccessfulAgentsForAction(
        action, 
        simulationContext.simulationType
      );
      
      if (pastSuccessfulAgents.length > 0) {
        // Use historical success data to inform agent selection
        console.log(`Found ${pastSuccessfulAgents.length} past successful agents for similar actions`);
      }
      
      // 2. Build capability requirements based on simulation context and action
      const requiredCapabilities = this.buildCapabilityRequirements(action, simulationContext);
      
      // 3. Find agents with matching capabilities
      const agents = await this.discoverAgentsWithCapabilities(requiredCapabilities);
      
      if (agents.length === 0) {
        console.log('No agents found with required capabilities, searching for fallback agents');
        return await this.findFallbackAgent(action);
      }
      
      // 4. Score agents based on capability match and simulation-specific factors
      const scoredAgents = await this.scoreAgentsForSimulationAction(
        agents, 
        action, 
        simulationContext,
        pastSuccessfulAgents
      );
      
      // 5. Return the best matching agent or null if none found
      return scoredAgents.length > 0 ? scoredAgents[0] : null;
    } catch (error) {
      console.error('Error in selectAgentForSimulationAction:', error);
      return await this.findFallbackAgent(action);
    }
  }

  /**
   * Retrieve past successful agents for similar actions from memory
   */
  private async getPastSuccessfulAgentsForAction(
    action: RecommendedAction,
    simulationType: string
  ): Promise<any[]> {
    try {
      // Query long-term memory for past successful executions
      const pastExecutions = await this.memoryService.queryLongTermMemory({
        type: 'simulation_action_execution',
        filters: {
          simulationType,
        },
        limit: 10
      });
      
      // Extract successful agents with their performance metrics
      return pastExecutions.filter(item => {
        const content = item.content as any;
        // Consider only successful, similar actions
        return content && 
               content.actionName.toLowerCase().includes(action.actionName.toLowerCase());
      }).map(item => {
        const content = item.content as any;
        return {
          agentId: content.agentId,
          successProbability: content.successProbability,
          simulationType: content.simulationType,
          actionName: content.actionName
        };
      });
    } catch (error) {
      console.error('Error getting past successful agents:', error);
      return [];
    }
  }

  /**
   * Build capability requirements based on action and simulation context
   */
  private buildCapabilityRequirements(
    action: RecommendedAction,
    simulationContext: SimulationResult
  ): string[] {
    const capabilities: string[] = [];
    const actionNameLower = action.actionName.toLowerCase();
    const simulationType = simulationContext.simulationType.toLowerCase();
    
    // Add domain-specific capabilities
    if (simulationType.includes('marketing') || 
        actionNameLower.includes('marketing') || 
        actionNameLower.includes('campaign')) {
      capabilities.push(
        'marketing_strategy', 
        'campaign_management',
        'market_research'
      );
      
      if (action.successProbability > 0.85) {
        capabilities.push('high_confidence_marketing_actions');
      }
    }
    
    if (simulationType.includes('inventory') || 
        actionNameLower.includes('inventory') || 
        actionNameLower.includes('stock')) {
      capabilities.push(
        'inventory_management',
        'supply_chain_optimization',
        'demand_forecasting'
      );
      
      if (actionNameLower.includes('reduce') || actionNameLower.includes('safety')) {
        capabilities.push('inventory_risk_management');
      }
    }
    
    if (simulationType.includes('combined') || 
        actionNameLower.includes('strategic') || 
        actionNameLower.includes('optimize')) {
      capabilities.push(
        'strategic_planning',
        'cross_functional_coordination',
        'business_optimization'
      );
    }
    
    // Add risk-related capabilities
    if (action.riskLevel === 'high') {
      capabilities.push('high_risk_action_execution', 'risk_mitigation_expertise');
    } else if (action.riskLevel === 'medium') {
      capabilities.push('balanced_risk_management');
    }
    
    // Add simulation-specific capabilities
    capabilities.push(
      'simulation_result_interpretation',
      'monte_carlo_analysis'
    );
    
    // Add success probability threshold capability
    if (action.successProbability > 0.9) {
      capabilities.push('high_probability_execution');
    }
    
    return capabilities;
  }

  /**
   * Find a fallback agent when no specialized agents are available
   */
  private async findFallbackAgent(action: RecommendedAction): Promise<any> {
    try {
      // Query for general-purpose or coordination agents
      const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .or('capabilities.cs.{coordination_agent},capabilities.cs.{general_purpose}')
        .limit(1);
        
      if (error || !agents || agents.length === 0) {
        console.error('Error finding fallback agent:', error);
        
        // Create a minimal fallback agent if none found
        return {
          id: 'fallback-agent',
          name: 'Fallback Agent',
          description: 'Handles requests when specialized agents are unavailable',
          capabilities: ['basic_task_processing']
        };
      }
      
      return agents[0];
    } catch (error) {
      console.error('Error in findFallbackAgent:', error);
      
      // Create a minimal fallback agent if exception occurs
      return {
        id: 'error-fallback-agent',
        name: 'Error Fallback Agent',
        description: 'Emergency fallback for error scenarios',
        capabilities: ['basic_task_processing']
      };
    }
  }

  /**
   * Score agents based on capability match and simulation-specific factors
   */
  private async scoreAgentsForSimulationAction(
    agents: any[],
    action: RecommendedAction,
    simulationContext: SimulationResult,
    pastSuccessfulAgents: any[] = []
  ): Promise<any[]> {
    // Calculate scores for each agent
    const scoredAgents = await Promise.all(agents.map(async (agent) => {
      // 1. Base score from capability matching (0-100)
      const capabilityMatchScore = this.calculateCapabilityMatchScore(
        agent,
        this.buildCapabilityRequirements(action, simulationContext)
      );
      
      // 2. Past performance score based on memory (0-50)
      const pastPerformanceScore = this.calculatePastPerformanceScore(
        agent,
        pastSuccessfulAgents
      );
      
      // 3. Domain expertise score based on simulation type (0-30)
      const domainExpertiseScore = this.calculateDomainExpertiseScore(
        agent,
        simulationContext.simulationType
      );
      
      // 4. Risk handling score based on action risk level (0-20)
      const riskHandlingScore = this.calculateRiskHandlingScore(
        agent,
        action.riskLevel
      );
      
      // 5. Calculate semantic similarity between agent description and action (0-20)
      const semanticSimilarityScore = await this.calculateSemanticSimilarityScore(
        agent,
        action
      );
      
      // Combine scores with weights
      const totalScore = 
        (capabilityMatchScore * 0.4) + 
        (pastPerformanceScore * 0.25) + 
        (domainExpertiseScore * 0.15) + 
        (riskHandlingScore * 0.1) + 
        (semanticSimilarityScore * 0.1);
        
      return {
        ...agent,
        score: totalScore,
        scores: {
          capabilityMatch: capabilityMatchScore,
          pastPerformance: pastPerformanceScore,
          domainExpertise: domainExpertiseScore,
          riskHandling: riskHandlingScore,
          semanticSimilarity: semanticSimilarityScore
        }
      };
    }));
    
    // Sort by total score
    return scoredAgents.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate capability match score (0-100)
   */
  private calculateCapabilityMatchScore(agent: any, requiredCapabilities: string[]): number {
    if (!agent.capabilities || !Array.isArray(agent.capabilities) || agent.capabilities.length === 0) {
      return 0;
    }
    
    if (requiredCapabilities.length === 0) {
      return 50; // Neutral score if no requirements
    }
    
    // Count matching capabilities
    const agentCapabilities = agent.capabilities.map((c: string) => c.toLowerCase());
    const matchingCapabilities = requiredCapabilities.filter(
      rc => agentCapabilities.some(ac => ac.includes(rc.toLowerCase()))
    );
    
    // Calculate match percentage
    return (matchingCapabilities.length / requiredCapabilities.length) * 100;
  }

  /**
   * Calculate past performance score based on memory (0-50)
   */
  private calculatePastPerformanceScore(agent: any, pastSuccessfulAgents: any[]): number {
    if (pastSuccessfulAgents.length === 0) {
      return 25; // Neutral score if no history
    }
    
    // Check if this agent has past successes
    const agentPastExecutions = pastSuccessfulAgents.filter(
      pa => pa.agentId === agent.id
    );
    
    if (agentPastExecutions.length === 0) {
      return 15; // Below average if no history for this specific agent
    }
    
    // Calculate average success probability from past executions
    const avgSuccessProbability = agentPastExecutions.reduce(
      (sum, curr) => sum + curr.successProbability, 
      0
    ) / agentPastExecutions.length;
    
    // Scale to 0-50 range
    return avgSuccessProbability * 50;
  }

  /**
   * Calculate domain expertise score based on simulation type (0-30)
   */
  private calculateDomainExpertiseScore(agent: any, simulationType: string): number {
    if (!agent.expertise || !Array.isArray(agent.expertise)) {
      return 15; // Neutral score if no expertise defined
    }
    
    // Check if agent has expertise in the simulation domain
    const lowerSimulationType = simulationType.toLowerCase();
    const domainExpertiseMatch = agent.expertise.some((expertise: string) => {
      const lowerExpertise = expertise.toLowerCase();
      
      if (lowerSimulationType.includes('marketing') && 
          (lowerExpertise.includes('marketing') || lowerExpertise.includes('campaign'))) {
        return true;
      }
      
      if (lowerSimulationType.includes('inventory') && 
          (lowerExpertise.includes('inventory') || lowerExpertise.includes('supply chain'))) {
        return true;
      }
      
      if (lowerSimulationType.includes('combined') && 
          (lowerExpertise.includes('strategic') || lowerExpertise.includes('cross-functional'))) {
        return true;
      }
      
      return false;
    });
    
    return domainExpertiseMatch ? 30 : 10;
  }

  /**
   * Calculate risk handling score based on action risk level (0-20)
   */
  private calculateRiskHandlingScore(agent: any, riskLevel: string): number {
    if (!agent.capabilities || !Array.isArray(agent.capabilities)) {
      return 10; // Neutral score if no capabilities
    }
    
    const agentCapabilities = agent.capabilities.map((c: string) => c.toLowerCase());
    
    // Check for risk-specific capabilities
    if (riskLevel === 'high') {
      const hasHighRiskCapability = agentCapabilities.some(
        c => c.includes('high_risk') || c.includes('risk_mitigation')
      );
      return hasHighRiskCapability ? 20 : 5;
    } else if (riskLevel === 'medium') {
      const hasRiskCapability = agentCapabilities.some(
        c => c.includes('risk')
      );
      return hasRiskCapability ? 15 : 10;
    } else {
      // Low risk - most agents should be able to handle
      return 15;
    }
  }

  /**
   * Calculate semantic similarity score between agent and action (0-20)
   */
  private async calculateSemanticSimilarityScore(agent: any, action: RecommendedAction): Promise<number> {
    try {
      // Create text representations
      const agentText = [
        agent.name,
        agent.description,
        ...(agent.capabilities || [])
      ].join(' ');
      
      const actionText = [
        action.actionName,
        action.actionDescription,
        action.expectedOutcome
      ].join(' ');
      
      // Generate embeddings
      const agentEmbedding = await this.embeddingService.generateEmbedding(agentText);
      const actionEmbedding = await this.embeddingService.generateEmbedding(actionText);
      
      // Calculate cosine similarity
      const similarity = this.calculateCosineSimilarity(agentEmbedding, actionEmbedding);
      
      // Scale to 0-20 range
      return similarity * 20;
    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      return 10; // Neutral score on error
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let vec1Magnitude = 0;
    let vec2Magnitude = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      vec1Magnitude += vec1[i] * vec1[i];
      vec2Magnitude += vec2[i] * vec2[i];
    }
    
    vec1Magnitude = Math.sqrt(vec1Magnitude);
    vec2Magnitude = Math.sqrt(vec2Magnitude);
    
    if (vec1Magnitude === 0 || vec2Magnitude === 0) {
      return 0;
    }
    
    return dotProduct / (vec1Magnitude * vec2Magnitude);
  }
}
