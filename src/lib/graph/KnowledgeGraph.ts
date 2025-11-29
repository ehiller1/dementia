/**
 * Minimal Knowledge Graph - In-memory graph for business entity relationships
 * Supports impact propagation, approval routing, and playbook grounding
 */

export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  properties: Record<string, any>;
}

export interface QueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private nodesByType: Map<string, Set<string>> = new Map();
  private edgesByType: Map<string, Set<string>> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  /**
   * Add a node to the graph
   */
  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    
    if (!this.nodesByType.has(node.type)) {
      this.nodesByType.set(node.type, new Set());
    }
    this.nodesByType.get(node.type)!.add(node.id);
    
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge: GraphEdge): void {
    this.edges.set(edge.id, edge);
    
    if (!this.edgesByType.has(edge.type)) {
      this.edgesByType.set(edge.type, new Set());
    }
    this.edgesByType.get(edge.type)!.add(edge.id);
    
    // Update adjacency list
    if (!this.adjacencyList.has(edge.from)) {
      this.adjacencyList.set(edge.from, new Set());
    }
    if (!this.adjacencyList.has(edge.to)) {
      this.adjacencyList.set(edge.to, new Set());
    }
    this.adjacencyList.get(edge.from)!.add(edge.to);
  }

  /**
   * Get node by ID
   */
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get nodes by type
   */
  getNodesByType(type: string): GraphNode[] {
    const nodeIds = this.nodesByType.get(type) || new Set();
    return Array.from(nodeIds).map(id => this.nodes.get(id)!);
  }

  /**
   * Get edges by type
   */
  getEdgesByType(type: string): GraphEdge[] {
    const edgeIds = this.edgesByType.get(type) || new Set();
    return Array.from(edgeIds).map(id => this.edges.get(id)!);
  }

  /**
   * Find substitutes for a SKU
   */
  findSubstitutes(skuId: string): GraphNode[] {
    const substitutes: GraphNode[] = [];
    const adjacentNodes = this.adjacencyList.get(skuId) || new Set();
    
    for (const nodeId of adjacentNodes) {
      const edge = Array.from(this.edges.values()).find(e => 
        e.from === skuId && e.to === nodeId && e.type === 'SUBSTITUTES'
      );
      if (edge) {
        const node = this.nodes.get(nodeId);
        if (node) substitutes.push(node);
      }
    }
    
    return substitutes;
  }

  /**
   * Find suppliers for SKUs
   */
  findSuppliersForSkus(skuIds: string[]): GraphNode[] {
    const suppliers = new Set<GraphNode>();
    
    for (const skuId of skuIds) {
      const adjacentNodes = this.adjacencyList.get(skuId) || new Set();
      
      for (const nodeId of adjacentNodes) {
        const edge = Array.from(this.edges.values()).find(e => 
          e.from === skuId && e.to === nodeId && e.type === 'SUPPLIED_BY'
        );
        if (edge) {
          const node = this.nodes.get(nodeId);
          if (node && node.type === 'Supplier') {
            suppliers.add(node);
          }
        }
      }
    }
    
    return Array.from(suppliers);
  }

  /**
   * Find key accounts for SKUs
   */
  findKeyAccountsForSkus(skuIds: string[]): GraphNode[] {
    const accounts = new Set<GraphNode>();
    
    for (const skuId of skuIds) {
      const adjacentNodes = this.adjacencyList.get(skuId) || new Set();
      
      for (const nodeId of adjacentNodes) {
        const edge = Array.from(this.edges.values()).find(e => 
          e.from === skuId && e.to === nodeId && e.type === 'SOLD_TO'
        );
        if (edge) {
          const node = this.nodes.get(nodeId);
          if (node && node.type === 'Account' && node.properties.tier === 'key') {
            accounts.add(node);
          }
        }
      }
    }
    
    return Array.from(accounts);
  }

  /**
   * Find primary channels for SKUs
   */
  findPrimaryChannelsForSkus(skuIds: string[]): GraphNode[] {
    const channels = new Set<GraphNode>();
    
    for (const skuId of skuIds) {
      const adjacentNodes = this.adjacencyList.get(skuId) || new Set();
      
      for (const nodeId of adjacentNodes) {
        const edge = Array.from(this.edges.values()).find(e => 
          e.from === skuId && e.to === nodeId && e.type === 'SOLD_IN'
        );
        if (edge) {
          const node = this.nodes.get(nodeId);
          if (node && node.type === 'Channel') {
            channels.add(node);
          }
        }
      }
    }
    
    return Array.from(channels);
  }

  /**
   * Find approvers for a role
   */
  findApproversForRole(role: string): GraphNode[] {
    return this.getNodesByType('Person').filter(person => 
      person.properties.roles && person.properties.roles.includes(role)
    );
  }

  /**
   * Get entity properties (margin, lead time, etc.)
   */
  getEntityProperties(entityId: string, propertyNames: string[]): Record<string, any> {
    const node = this.nodes.get(entityId);
    if (!node) return {};
    
    const result: Record<string, any> = {};
    for (const prop of propertyNames) {
      if (node.properties[prop] !== undefined) {
        result[prop] = node.properties[prop];
      }
    }
    return result;
  }

  /**
   * Find entities within impact radius of a change
   */
  findImpactRadius(entityId: string, maxDepth: number = 2): GraphNode[] {
    const visited = new Set<string>();
    const impacted: GraphNode[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: entityId, depth: 0 }];
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);
      
      const node = this.nodes.get(id);
      if (node && depth > 0) { // Don't include the starting entity
        impacted.push(node);
      }
      
      // Add adjacent nodes
      const adjacent = this.adjacencyList.get(id) || new Set();
      for (const adjacentId of adjacent) {
        if (!visited.has(adjacentId)) {
          queue.push({ id: adjacentId, depth: depth + 1 });
        }
      }
    }
    
    return impacted;
  }

  /**
   * Initialize default business data
   */
  private initializeDefaultData(): void {
    // Sample SKUs
    this.addNode({
      id: 'sku_a12fd',
      type: 'SKU',
      properties: {
        name: 'Premium Widget A',
        margin: 0.35,
        lead_time_days: 14,
        volume_weekly: 1000,
        price: 29.99,
      },
    });

    this.addNode({
      id: 'sku_b34gh',
      type: 'SKU',
      properties: {
        name: 'Standard Widget B',
        margin: 0.28,
        lead_time_days: 10,
        volume_weekly: 2500,
        price: 19.99,
      },
    });

    this.addNode({
      id: 'sku_c56jk',
      type: 'SKU',
      properties: {
        name: 'Economy Widget C',
        margin: 0.22,
        lead_time_days: 7,
        volume_weekly: 5000,
        price: 12.99,
      },
    });

    // Sample Suppliers
    this.addNode({
      id: 'supplier_acme',
      type: 'Supplier',
      properties: {
        name: 'ACME Manufacturing',
        lead_time_days: 14,
        reliability: 0.95,
        capacity_weekly: 10000,
      },
    });

    this.addNode({
      id: 'supplier_beta',
      type: 'Supplier',
      properties: {
        name: 'Beta Components',
        lead_time_days: 21,
        reliability: 0.88,
        capacity_weekly: 5000,
      },
    });

    // Sample Channels
    this.addNode({
      id: 'channel_dtc',
      type: 'Channel',
      properties: {
        name: 'Direct to Consumer',
        margin_share: 0.45,
        volume_share: 0.30,
      },
    });

    this.addNode({
      id: 'channel_retail',
      type: 'Channel',
      properties: {
        name: 'Retail Partners',
        margin_share: 0.25,
        volume_share: 0.60,
      },
    });

    // Sample Accounts
    this.addNode({
      id: 'account_bigbox',
      type: 'Account',
      properties: {
        name: 'BigBox Retailer',
        tier: 'key',
        volume_share: 0.35,
        payment_terms: 30,
      },
    });

    this.addNode({
      id: 'account_specialty',
      type: 'Account',
      properties: {
        name: 'Specialty Store Chain',
        tier: 'key',
        volume_share: 0.15,
        payment_terms: 15,
      },
    });

    // Sample People/Roles
    this.addNode({
      id: 'person_finance_controller',
      type: 'Person',
      properties: {
        name: 'Sarah Johnson',
        roles: ['FinanceController'],
        email: 'sarah.johnson@company.com',
      },
    });

    this.addNode({
      id: 'person_vp_supply',
      type: 'Person',
      properties: {
        name: 'Mike Chen',
        roles: ['VP_Supply'],
        email: 'mike.chen@company.com',
      },
    });

    this.addNode({
      id: 'person_inventory_controller',
      type: 'Person',
      properties: {
        name: 'Lisa Rodriguez',
        roles: ['InventoryController', 'CategoryManager'],
        email: 'lisa.rodriguez@company.com',
      },
    });

    // Relationships
    // SKU → Supplier relationships
    this.addEdge({
      id: 'edge_sku_a12fd_supplier_acme',
      from: 'sku_a12fd',
      to: 'supplier_acme',
      type: 'SUPPLIED_BY',
      properties: { primary: true, lead_time_days: 14 },
    });

    this.addEdge({
      id: 'edge_sku_b34gh_supplier_acme',
      from: 'sku_b34gh',
      to: 'supplier_acme',
      type: 'SUPPLIED_BY',
      properties: { primary: true, lead_time_days: 14 },
    });

    this.addEdge({
      id: 'edge_sku_c56jk_supplier_beta',
      from: 'sku_c56jk',
      to: 'supplier_beta',
      type: 'SUPPLIED_BY',
      properties: { primary: true, lead_time_days: 21 },
    });

    // SKU → Channel relationships
    this.addEdge({
      id: 'edge_sku_a12fd_channel_dtc',
      from: 'sku_a12fd',
      to: 'channel_dtc',
      type: 'SOLD_IN',
      properties: { volume_share: 0.6 },
    });

    this.addEdge({
      id: 'edge_sku_b34gh_channel_retail',
      from: 'sku_b34gh',
      to: 'channel_retail',
      type: 'SOLD_IN',
      properties: { volume_share: 0.8 },
    });

    // SKU → Account relationships
    this.addEdge({
      id: 'edge_sku_b34gh_account_bigbox',
      from: 'sku_b34gh',
      to: 'account_bigbox',
      type: 'SOLD_TO',
      properties: { volume_share: 0.4 },
    });

    this.addEdge({
      id: 'edge_sku_a12fd_account_specialty',
      from: 'sku_a12fd',
      to: 'account_specialty',
      type: 'SOLD_TO',
      properties: { volume_share: 0.3 },
    });

    // Substitution relationships
    this.addEdge({
      id: 'edge_sku_a12fd_substitutes_b34gh',
      from: 'sku_a12fd',
      to: 'sku_b34gh',
      type: 'SUBSTITUTES',
      properties: { substitution_rate: 0.7 },
    });

    this.addEdge({
      id: 'edge_sku_b34gh_substitutes_c56jk',
      from: 'sku_b34gh',
      to: 'sku_c56jk',
      type: 'SUBSTITUTES',
      properties: { substitution_rate: 0.5 },
    });

    console.log(`Initialized KnowledgeGraph with ${this.nodes.size} nodes and ${this.edges.size} edges`);
  }

  /**
   * Get graph statistics
   */
  getStats(): { nodes: number; edges: number; nodeTypes: string[]; edgeTypes: string[] } {
    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      nodeTypes: Array.from(this.nodesByType.keys()),
      edgeTypes: Array.from(this.edgesByType.keys()),
    };
  }

  /**
   * Export graph data (for debugging/visualization)
   */
  exportData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }
}
