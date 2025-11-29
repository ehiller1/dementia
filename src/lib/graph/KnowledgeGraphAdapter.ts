/**
 * Knowledge Graph Adapter
 * 
 * Unified interface for graph operations across different storage backends.
 * Provides abstraction layer for entity/relationship CRUD operations.
 */

import { supabase } from '../../integrations/supabase/client';

export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphRelationship {
  id?: string;
  source_id: string;
  target_id: string;
  type: string;
  weight: number;
  metadata?: Record<string, any>;
}

export class KnowledgeGraphAdapter {
  /**
   * Create a new node in the graph
   */
  async createNode(node: GraphNode): Promise<void> {
    const { error } = await supabase
      .from('entities')
      .insert({
        id: node.id,
        type: node.type,
        name: node.properties.name || node.id,
        description: node.properties.description || '',
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to create node: ${error.message}`);
    }

    // Store properties
    if (Object.keys(node.properties).length > 0) {
      const propertyInserts = Object.entries(node.properties).map(([key, value]) => ({
        entity_id: node.id,
        property: key,
        value: JSON.stringify(value)
      }));

      const { error: propError } = await supabase
        .from('entity_properties')
        .insert(propertyInserts);

      if (propError) {
        console.error('Failed to store properties:', propError);
      }
    }
  }

  /**
   * Find node by property value
   */
  async findNodeByProperty(type: string, field: string, value: any): Promise<GraphNode | null> {
    // First try to find in entity properties
    const { data: propData, error: propError } = await supabase
      .from('entity_properties')
      .select('entity_id')
      .eq('property', field)
      .eq('value', JSON.stringify(value))
      .limit(1);

    if (propError || !propData || propData.length === 0) {
      return null;
    }

    const entityId = propData[0].entity_id;

    // Get the full entity
    const { data: entityData, error: entityError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .eq('type', type)
      .single();

    if (entityError || !entityData) {
      return null;
    }

    // Get all properties
    const { data: allProps } = await supabase
      .from('entity_properties')
      .select('*')
      .eq('entity_id', entityId);

    const properties: Record<string, any> = {};
    if (allProps) {
      for (const prop of allProps) {
        try {
          properties[prop.property] = JSON.parse(prop.value);
        } catch {
          properties[prop.property] = prop.value;
        }
      }
    }

    return {
      id: entityData.id,
      type: entityData.type,
      properties
    };
  }

  /**
   * Get node by ID
   */
  async getNode(id: string): Promise<GraphNode | null> {
    const { data: entityData, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !entityData) {
      return null;
    }

    // Get properties
    const { data: props } = await supabase
      .from('entity_properties')
      .select('*')
      .eq('entity_id', id);

    const properties: Record<string, any> = {};
    if (props) {
      for (const prop of props) {
        try {
          properties[prop.property] = JSON.parse(prop.value);
        } catch {
          properties[prop.property] = prop.value;
        }
      }
    }

    return {
      id: entityData.id,
      type: entityData.type,
      properties
    };
  }

  /**
   * Update node properties
   */
  async updateNode(id: string, properties: Record<string, any>): Promise<void> {
    // Update entity metadata
    if (properties.name || properties.description) {
      const updates: any = {};
      if (properties.name) updates.name = properties.name;
      if (properties.description) updates.description = properties.description;

      await supabase
        .from('entities')
        .update(updates)
        .eq('id', id);
    }

    // Update properties
    for (const [key, value] of Object.entries(properties)) {
      await supabase
        .from('entity_properties')
        .upsert({
          entity_id: id,
          property: key,
          value: JSON.stringify(value)
        });
    }
  }

  /**
   * Create relationship between nodes
   */
  async createRelationship(rel: GraphRelationship): Promise<void> {
    const { error } = await supabase
      .from('relationships')
      .insert({
        source_id: rel.source_id,
        target_id: rel.target_id,
        type: rel.type,
        weight: rel.weight,
        metadata: rel.metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to create relationship: ${error.message}`);
    }
  }

  /**
   * Find relationships by criteria
   */
  async findRelationships(criteria: {
    source_id?: string;
    target_id?: string;
    type?: string;
  }): Promise<GraphRelationship[]> {
    let query = supabase.from('relationships').select('*');

    if (criteria.source_id) {
      query = query.eq('source_id', criteria.source_id);
    }
    if (criteria.target_id) {
      query = query.eq('target_id', criteria.target_id);
    }
    if (criteria.type) {
      query = query.eq('type', criteria.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to find relationships:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Delete relationship
   */
  async deleteRelationship(id: string): Promise<void> {
    await supabase
      .from('relationships')
      .delete()
      .eq('id', id);
  }

  /**
   * Find similar nodes using vector similarity (stub for now)
   */
  async findSimilarNodes(
    type: string,
    embedding: number[],
    limit: number = 5
  ): Promise<Array<{ id: string; similarity: number }>> {
    // TODO: Implement vector similarity search using pgvector
    // For now, return empty array
    console.warn('[KnowledgeGraphAdapter] Vector similarity search not yet implemented');
    return [];
  }

  /**
   * Store embedding for a node (stub for now)
   */
  async storeEmbedding(nodeId: string, embedding: number[]): Promise<void> {
    // TODO: Store embedding in vector column
    // For now, store as JSON property
    await supabase
      .from('entity_properties')
      .upsert({
        entity_id: nodeId,
        property: '_embedding',
        value: JSON.stringify(embedding)
      });
  }

  /**
   * Execute raw query (for advanced use cases)
   * Note: This is a simplified implementation that queries entities table
   */
  async query(cypherQuery: string): Promise<any[]> {
    // This is a simplified implementation
    // In production, would use a proper graph query language parser
    console.warn('[KnowledgeGraphAdapter] Raw query support is limited');
    
    // Extract entity type from query (basic pattern matching)
    const typeMatch = cypherQuery.match(/\(p:(\w+)\)/);
    const type = typeMatch ? typeMatch[1] : null;

    if (!type) {
      console.error('[KnowledgeGraphAdapter] Could not parse entity type from query');
      return [];
    }

    // Query entities of that type
    const { data, error } = await supabase
      .from('entities')
      .select('id, type, name')
      .eq('type', type)
      .limit(100);

    if (error || !data) {
      console.error('[KnowledgeGraphAdapter] Query failed:', error);
      return [];
    }

    // For each entity, get its properties
    const results = [];
    for (const entity of data) {
      const { data: props } = await supabase
        .from('entity_properties')
        .select('property, value')
        .eq('entity_id', entity.id);

      const properties: Record<string, any> = {};
      if (props) {
        for (const prop of props) {
          try {
            properties[prop.property] = JSON.parse(prop.value);
          } catch {
            properties[prop.property] = prop.value;
          }
        }
      }

      results.push({
        id: entity.id,
        name: entity.name,
        ...properties
      });
    }

    return results;
  }
}
