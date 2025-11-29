/**
 * Theme Extraction Service
 * Extracts key themes from present template implementations and connects them
 * with institutional long-term memory through semantic analysis and pattern matching.
 */

import { EmbeddingService } from '../../services/embeddingService';
import { supabase } from '../../integrations/supabase/client';
import type { MemoryCard, MemoryLink } from '../memory/types';

export interface TemplateTheme {
  id: string;
  templateId: string;
  conversationId: string;
  themes: string[];
  entities: string[];
  solutionPattern: string;
  businessContext: Record<string, any>;
  embedding: number[];
  confidence: number;
  extractedAt: string;
}

export interface InstitutionalConnection {
  currentThemeId: string;
  historicalMemoryId: string;
  connectionType: 'similar_problem' | 'shared_entity' | 'solution_pattern' | 'contextual_relevance';
  similarity: number;
  bridgingContext: Record<string, any>;
}

export class ThemeExtractionService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Extract themes from current template execution
   */
  async extractTemplateThemes(
    templateId: string,
    executionContext: Record<string, any>,
    conversationId: string
  ): Promise<TemplateTheme> {
    console.log(`🎯 Extracting themes from template execution: ${templateId}`);

    // 1. Analyze template execution context for key themes
    const themes = await this.analyzeExecutionThemes(executionContext);
    
    // 2. Extract business entities (products, markets, decisions, etc.)
    const entities = await this.extractBusinessEntities(executionContext);
    
    // 3. Classify solution pattern
    const solutionPattern = await this.classifySolutionPattern(executionContext, themes);
    
    // 4. Generate semantic embedding for the combined context
    const contextText = this.buildContextText(themes, entities, solutionPattern, executionContext);
    const embedding = await EmbeddingService.generateEmbedding(contextText);

    const templateTheme: TemplateTheme = {
      id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      conversationId,
      themes,
      entities,
      solutionPattern,
      businessContext: executionContext,
      embedding,
      confidence: this.calculateExtractionConfidence(themes, entities),
      extractedAt: new Date().toISOString()
    };

    // Store the extracted theme
    await this.storeTemplateTheme(templateTheme);
    
    return templateTheme;
  }

  /**
   * Find connections between current themes and institutional long-term memory
   */
  async findInstitutionalConnections(
    currentTheme: TemplateTheme,
    similarityThreshold: number = 0.7
  ): Promise<InstitutionalConnection[]> {
    console.log(`🔗 Finding institutional connections for theme: ${currentTheme.id}`);

    const connections: InstitutionalConnection[] = [];

    // 1. Semantic similarity search in long-term memory
    const semanticMatches = await this.findSemanticMatches(currentTheme, similarityThreshold);
    connections.push(...semanticMatches);

    // 2. Entity-based connections
    const entityMatches = await this.findEntityBasedConnections(currentTheme);
    connections.push(...entityMatches);

    // 3. Solution pattern matches
    const patternMatches = await this.findSolutionPatternMatches(currentTheme);
    connections.push(...patternMatches);

    // 4. Contextual relevance connections
    const contextualMatches = await this.findContextualConnections(currentTheme);
    connections.push(...contextualMatches);

    // Sort by similarity and deduplicate
    return this.rankAndDeduplicateConnections(connections);
  }

  /**
   * Create memory links between current execution and institutional knowledge
   */
  async createInstitutionalMemoryLinks(
    connections: InstitutionalConnection[]
  ): Promise<void> {
    console.log(`📎 Creating ${connections.length} institutional memory links`);

    for (const connection of connections) {
      await this.createMemoryLink({
        source_id: connection.currentThemeId,
        target_id: connection.historicalMemoryId,
        relation: connection.connectionType,
        weight: connection.similarity,
        metadata: {
          bridging_context: connection.bridgingContext,
          created_by: 'theme_extraction_service',
          connection_strength: connection.similarity
        }
      });
    }
  }

  /**
   * Analyze execution context to extract key themes
   */
  private async analyzeExecutionThemes(context: Record<string, any>): Promise<string[]> {
    const themes: string[] = [];

    // Extract from user intent and queries
    if (context.userIntent) {
      themes.push(`intent:${context.userIntent}`);
    }

    // Extract from agent activations
    if (context.agentResults) {
      for (const result of context.agentResults) {
        if (result.agentType) themes.push(`agent:${result.agentType}`);
        if (result.domain) themes.push(`domain:${result.domain}`);
      }
    }

    // Extract from decision points
    if (context.decisions) {
      for (const decision of context.decisions) {
        if (decision.type) themes.push(`decision:${decision.type}`);
        if (decision.category) themes.push(`category:${decision.category}`);
      }
    }

    // Extract from business metrics and KPIs
    if (context.metrics) {
      Object.keys(context.metrics).forEach(metric => {
        themes.push(`metric:${metric}`);
      });
    }

    return [...new Set(themes)]; // Deduplicate
  }

  /**
   * Extract business entities from execution context
   */
  private async extractBusinessEntities(context: Record<string, any>): Promise<string[]> {
    const entities: string[] = [];

    // Product entities
    if (context.products) {
      entities.push(...context.products.map((p: any) => `product:${p.name || p.id}`));
    }

    // Market/segment entities
    if (context.markets) {
      entities.push(...context.markets.map((m: any) => `market:${m.name || m.segment}`));
    }

    // Time period entities
    if (context.timeframe) {
      entities.push(`timeframe:${context.timeframe}`);
    }

    // Geographic entities
    if (context.region) {
      entities.push(`region:${context.region}`);
    }

    return [...new Set(entities)];
  }

  /**
   * Classify the solution pattern used in this execution
   */
  private async classifySolutionPattern(
    context: Record<string, any>,
    themes: string[]
  ): Promise<string> {
    // Analyze the combination of themes and context to classify solution pattern
    const patternIndicators = {
      'demand_forecasting': ['metric:demand', 'agent:seasonality', 'timeframe:'],
      'inventory_optimization': ['metric:inventory', 'decision:stock', 'agent:inventory'],
      'pricing_strategy': ['metric:price', 'decision:pricing', 'market:'],
      'promotional_planning': ['decision:promotion', 'metric:sales', 'timeframe:'],
      'risk_mitigation': ['decision:risk', 'agent:governance', 'metric:compliance']
    };

    for (const [pattern, indicators] of Object.entries(patternIndicators)) {
      const matches = indicators.filter(indicator => 
        themes.some(theme => theme.includes(indicator))
      );
      if (matches.length >= 2) {
        return pattern;
      }
    }

    return 'general_business_analysis';
  }

  /**
   * Build context text for embedding generation
   */
  private buildContextText(
    themes: string[],
    entities: string[],
    solutionPattern: string,
    context: Record<string, any>
  ): string {
    return [
      `Solution Pattern: ${solutionPattern}`,
      `Themes: ${themes.join(', ')}`,
      `Entities: ${entities.join(', ')}`,
      `Context: ${JSON.stringify(context).substring(0, 500)}`
    ].join('\n');
  }

  /**
   * Find semantic matches in long-term memory using vector similarity
   */
  private async findSemanticMatches(
    currentTheme: TemplateTheme,
    threshold: number
  ): Promise<InstitutionalConnection[]> {
    try {
      const { data: matches, error } = await supabase.rpc('match_memory_cards', {
        query_embedding: currentTheme.embedding,
        similarity_threshold: threshold,
        match_count: 10
      });

      if (error) throw error;

      return matches?.map((match: any) => ({
        currentThemeId: currentTheme.id,
        historicalMemoryId: match.id,
        connectionType: 'similar_problem' as const,
        similarity: match.similarity,
        bridgingContext: {
          semantic_overlap: match.similarity,
          historical_context: match.content?.substring(0, 200)
        }
      })) || [];
    } catch (error) {
      console.warn('Semantic matching failed:', error);
      return [];
    }
  }

  /**
   * Find connections based on shared business entities
   */
  private async findEntityBasedConnections(
    currentTheme: TemplateTheme
  ): Promise<InstitutionalConnection[]> {
    const connections: InstitutionalConnection[] = [];

    for (const entity of currentTheme.entities) {
      try {
        const { data: entityMatches, error } = await supabase
          .from('memory_cards')
          .select('*')
          .or(`tags.cs.{${entity}},content.ilike.%${entity}%`)
          .eq('retention', 'long_term')
          .limit(5);

        if (error) throw error;

        entityMatches?.forEach(match => {
          connections.push({
            currentThemeId: currentTheme.id,
            historicalMemoryId: match.id,
            connectionType: 'shared_entity',
            similarity: 0.8, // High confidence for exact entity matches
            bridgingContext: {
              shared_entity: entity,
              historical_context: match.content?.substring(0, 200)
            }
          });
        });
      } catch (error) {
        console.warn(`Entity-based connection failed for ${entity}:`, error);
      }
    }

    return connections;
  }

  /**
   * Find matches based on solution patterns
   */
  private async findSolutionPatternMatches(
    currentTheme: TemplateTheme
  ): Promise<InstitutionalConnection[]> {
    try {
      const { data: patternMatches, error } = await supabase
        .from('memory_cards')
        .select('*')
        .or(`tags.cs.{${currentTheme.solutionPattern}},content.ilike.%${currentTheme.solutionPattern}%`)
        .eq('retention', 'long_term')
        .limit(5);

      if (error) throw error;

      return patternMatches?.map(match => ({
        currentThemeId: currentTheme.id,
        historicalMemoryId: match.id,
        connectionType: 'solution_pattern' as const,
        similarity: 0.75,
        bridgingContext: {
          solution_pattern: currentTheme.solutionPattern,
          historical_approach: match.content?.substring(0, 200)
        }
      })) || [];
    } catch (error) {
      console.warn('Solution pattern matching failed:', error);
      return [];
    }
  }

  /**
   * Find contextually relevant connections
   */
  private async findContextualConnections(
    currentTheme: TemplateTheme
  ): Promise<InstitutionalConnection[]> {
    // Look for memories from the same conversation or related conversations
    try {
      const { data: contextMatches, error } = await supabase
        .from('memory_cards')
        .select('*')
        .eq('conversation_id', currentTheme.conversationId)
        .eq('retention', 'long_term')
        .limit(3);

      if (error) throw error;

      return contextMatches?.map(match => ({
        currentThemeId: currentTheme.id,
        historicalMemoryId: match.id,
        connectionType: 'contextual_relevance' as const,
        similarity: 0.6,
        bridgingContext: {
          conversation_context: currentTheme.conversationId,
          temporal_relationship: 'same_conversation'
        }
      })) || [];
    } catch (error) {
      console.warn('Contextual connection failed:', error);
      return [];
    }
  }

  /**
   * Calculate confidence score for theme extraction
   */
  private calculateExtractionConfidence(themes: string[], entities: string[]): number {
    const themeScore = Math.min(themes.length * 0.1, 0.5);
    const entityScore = Math.min(entities.length * 0.15, 0.4);
    const baseConfidence = 0.1;
    
    return Math.min(baseConfidence + themeScore + entityScore, 1.0);
  }

  /**
   * Rank and deduplicate connections
   */
  private rankAndDeduplicateConnections(
    connections: InstitutionalConnection[]
  ): InstitutionalConnection[] {
    // Remove duplicates based on historicalMemoryId
    const uniqueConnections = connections.reduce((acc, conn) => {
      const existing = acc.find(c => c.historicalMemoryId === conn.historicalMemoryId);
      if (!existing || existing.similarity < conn.similarity) {
        acc = acc.filter(c => c.historicalMemoryId !== conn.historicalMemoryId);
        acc.push(conn);
      }
      return acc;
    }, [] as InstitutionalConnection[]);

    // Sort by similarity descending
    return uniqueConnections.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Store template theme in memory system
   */
  private async storeTemplateTheme(theme: TemplateTheme): Promise<void> {
    try {
      // Generate valid UUID for tenant_id
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const { error } = await supabase
        .from('memory_cards')
        .insert({
          id: theme.id,
          tenant_id: generateUUID(),
          conversation_id: theme.conversationId,
          type: 'template_theme',
          title: `Template Theme: ${theme.templateId}`,
          content: JSON.stringify({
            themes: theme.themes,
            entities: theme.entities,
            solutionPattern: theme.solutionPattern,
            businessContext: theme.businessContext
          }),
          tags: [...theme.themes, ...theme.entities, theme.solutionPattern],
          importance: theme.confidence,
          retention: 'short_term' // Start in short-term, promote based on usage
        });

      if (error) throw error;
      console.log(`✅ Stored template theme: ${theme.id}`);
    } catch (error) {
      console.error('Failed to store template theme:', error);
    }
  }

  /**
   * Create memory link between current and historical memories
   */
  private async createMemoryLink(linkData: {
    source_id: string;
    target_id: string;
    relation: string;
    weight: number;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      // Generate valid UUID for tenant_id
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const { error } = await supabase
        .from('memory_links')
        .insert({
          tenant_id: generateUUID(),
          source_card_id: linkData.source_id,
          target_card_id: linkData.target_id,
          relation: linkData.relation,
          metadata: linkData.metadata
        });

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to create memory link:', error);
    }
  }
}
