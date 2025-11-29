/**
 * Unified Knowledge Graph - Integrates the minimal in-memory graph with the Supabase-backed service
 * Provides a single interface for both local business entity queries and persistent knowledge graph operations
 */

import { KnowledgeGraph, GraphNode, GraphEdge, QueryResult } from './KnowledgeGraph';
import { KnowledgeGraphService, Entity, Relationship, RelatedConcept } from '../../services/knowledgeGraphService';

export interface UnifiedQueryResult {
  // Local graph results (business entities)
  local: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  // Persistent graph results (concepts and workflows)
  persistent: {
    entities: Entity[];
    relationships: Relationship[];
    relatedConcepts: RelatedConcept[];
  };
}

export class UnifiedKnowledgeGraph {
  private localGraph: KnowledgeGraph;

  constructor() {
    this.localGraph = new KnowledgeGraph();
  }

  /**
   * Get the local in-memory graph instance
   */
  getLocalGraph(): KnowledgeGraph {
    return this.localGraph;
  }

  /**
   * Query both local and persistent knowledge graphs
   */
  async query(queryText: string): Promise<UnifiedQueryResult> {
    // Parse query to determine what to search for
    const queryTerms = this.parseQuery(queryText);
    
    // Query local graph for business entities
    const localResults = this.queryLocalGraph(queryTerms);
    
    // Query persistent graph for concepts and workflows
    const persistentResults = await this.queryPersistentGraph(queryTerms);

    return {
      local: localResults,
      persistent: persistentResults
    };
  }

  /**
   * Find substitutes using local graph
   */
  findSubstitutes(skuId: string): GraphNode[] {
    return this.localGraph.findSubstitutes(skuId);
  }

  /**
   * Find suppliers using local graph
   */
  findSuppliersForSkus(skuIds: string[]): GraphNode[] {
    return this.localGraph.findSuppliersForSkus(skuIds);
  }

  /**
   * Find key accounts using local graph
   */
  findKeyAccountsForSkus(skuIds: string[]): GraphNode[] {
    return this.localGraph.findKeyAccountsForSkus(skuIds);
  }

  /**
   * Find primary channels using local graph
   */
  findPrimaryChannelsForSkus(skuIds: string[]): GraphNode[] {
    return this.localGraph.findPrimaryChannelsForSkus(skuIds);
  }

  /**
   * Find approvers using local graph
   */
  findApproversForRole(role: string): GraphNode[] {
    return this.localGraph.findApproversForRole(role);
  }

  /**
   * Get entity properties from local graph
   */
  getEntityProperties(entityId: string, propertyNames: string[]): Record<string, any> {
    return this.localGraph.getEntityProperties(entityId, propertyNames);
  }

  /**
   * Find impact radius using local graph
   */
  findImpactRadius(entityId: string, maxDepth: number = 2): GraphNode[] {
    return this.localGraph.findImpactRadius(entityId, maxDepth);
  }

  /**
   * Enhanced query that combines local business entities with persistent concepts
   */
  async enhanceQueryWithKnowledge(userQuery: string): Promise<{
    originalQuery: string;
    localContext: {
      businessEntities: GraphNode[];
      relationships: GraphEdge[];
      impactRadius: GraphNode[];
    };
    persistentContext: {
      relatedConcepts: RelatedConcept[];
      conceptProperties: Record<string, any>;
    };
  }> {
    // Get enhanced context from persistent graph
    const persistentEnhancement = await KnowledgeGraphService.enhanceQueryWithKnowledge(userQuery);
    
    // Extract business entities from query
    const businessEntities = this.extractBusinessEntitiesFromQuery(userQuery);
    
    // Find relationships and impact radius for business entities
    const relationships = this.findRelationshipsForEntities(businessEntities);
    const impactRadius = this.findCombinedImpactRadius(businessEntities);

    return {
      originalQuery: userQuery,
      localContext: {
        businessEntities,
        relationships,
        impactRadius
      },
      persistentContext: persistentEnhancement.enhancedContext
    };
  }

  /**
   * Add business entity to local graph
   */
  addBusinessEntity(node: GraphNode): void {
    this.localGraph.addNode(node);
  }

  /**
   * Add business relationship to local graph
   */
  addBusinessRelationship(edge: GraphEdge): void {
    this.localGraph.addEdge(edge);
  }

  /**
   * Sync local business entities with persistent storage (if needed)
   */
  async syncWithPersistentStorage(): Promise<void> {
    // This could be implemented to persist local graph data to Supabase
    // For now, we keep them separate as they serve different purposes
    console.log('Local graph sync not implemented - local and persistent graphs serve different purposes');
  }

  /**
   * Get comprehensive statistics from both graphs
   */
  async getUnifiedStats(): Promise<{
    local: { nodes: number; edges: number; nodeTypes: string[]; edgeTypes: string[] };
    persistent: { entities: number; relationships: number; domains: string[] };
  }> {
    const localStats = this.localGraph.getStats();
    
    // Get persistent stats (simplified - would need actual implementation)
    const persistentStats = {
      entities: 0, // Would query from Supabase
      relationships: 0, // Would query from Supabase
      domains: ['programmatic_advertising', 'field_sales'] // From KnowledgeGraphService
    };

    return {
      local: localStats,
      persistent: persistentStats
    };
  }

  /**
   * Parse query to extract relevant terms
   */
  private parseQuery(queryText: string): string[] {
    const businessTerms = [
      'sku', 'supplier', 'channel', 'account', 'substitutes', 'approver',
      'margin', 'lead time', 'volume', 'price', 'capacity', 'reliability'
    ];
    
    const queryLower = queryText.toLowerCase();
    return businessTerms.filter(term => queryLower.includes(term));
  }

  /**
   * Query local graph for business entities
   */
  private queryLocalGraph(queryTerms: string[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Search by node types based on query terms
    if (queryTerms.includes('sku')) {
      nodes.push(...this.localGraph.getNodesByType('SKU'));
    }
    if (queryTerms.includes('supplier')) {
      nodes.push(...this.localGraph.getNodesByType('Supplier'));
    }
    if (queryTerms.includes('channel')) {
      nodes.push(...this.localGraph.getNodesByType('Channel'));
    }
    if (queryTerms.includes('account')) {
      nodes.push(...this.localGraph.getNodesByType('Account'));
    }

    // Get relevant edges
    if (queryTerms.includes('substitutes')) {
      edges.push(...this.localGraph.getEdgesByType('SUBSTITUTES'));
    }
    edges.push(...this.localGraph.getEdgesByType('SUPPLIED_BY'));
    edges.push(...this.localGraph.getEdgesByType('SOLD_IN'));
    edges.push(...this.localGraph.getEdgesByType('SOLD_TO'));

    return { nodes, edges };
  }

  /**
   * Query persistent graph for concepts and workflows
   */
  private async queryPersistentGraph(queryTerms: string[]): Promise<{
    entities: Entity[];
    relationships: Relationship[];
    relatedConcepts: RelatedConcept[];
  }> {
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const relatedConcepts: RelatedConcept[] = [];

    // Search for concepts based on query terms
    for (const term of queryTerms) {
      const searchResults = await KnowledgeGraphService.searchConcepts(term);
      entities.push(...searchResults);

      // Get related concepts for each found entity
      for (const entity of searchResults) {
        const related = await KnowledgeGraphService.findRelatedConcepts(entity.name, 2);
        relatedConcepts.push(...related);
      }
    }

    return { entities, relationships, relatedConcepts };
  }

  /**
   * Extract business entities mentioned in query
   */
  private extractBusinessEntities(query: string): string[] {
    const entities: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Extract SKUs, suppliers, channels, accounts, people from local graph
    const localNodes = this.localGraph.getAllNodes();
    for (const node of localNodes) {
      if (lowerQuery.includes(node.name.toLowerCase())) {
        entities.push(node.name);
      }
    }
    
    return entities;
  }

  /**
   * Find relationships for given entities
   */
  private findRelationshipsForEntities(entities: GraphNode[]): GraphEdge[] {
    const relationships: GraphEdge[] = [];
    const entityIds = new Set(entities.map(e => e.id));

    const allEdges = this.localGraph.exportData().edges;
    for (const edge of allEdges) {
      if (entityIds.has(edge.from) || entityIds.has(edge.to)) {
        relationships.push(edge);
      }
    }

    return relationships;
  }

  /**
   * Find combined impact radius for multiple entities
   */
  private findCombinedImpactRadius(entities: GraphNode[]): GraphNode[] {
    const impactedEntities = new Set<GraphNode>();

    for (const entity of entities) {
      const impacted = this.localGraph.findImpactRadius(entity.id, 2);
      impacted.forEach(e => impactedEntities.add(e));
    }

    return Array.from(impactedEntities);
  }

  /**
   * Get combined statistics from both local and persistent graphs
   */
  getStats(): any {
    const localStats = this.localGraph.getStats();
    
    return {
      local: localStats,
      persistent: {
        // These would come from KnowledgeGraphService if we had access to counts
        entities: 0,
        relationships: 0,
        concepts: 0
      },
      combined: {
        total_nodes: localStats.nodes,
        total_edges: localStats.edges,
        business_entities: localStats.nodes,
        domain_concepts: 0
      }
    };
  }
}

// Export singleton instance
export const unifiedKnowledgeGraph = new UnifiedKnowledgeGraph();
