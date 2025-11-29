/**
 * Algorithm API module
 * 
 * Provides functions to store, retrieve, and manage algorithms in the database.
 */
import { supabase } from '@/integrations/supabase/client';
import { AlgorithmDefinition } from '../algorithm/types.ts';

export interface StoredAlgorithm extends AlgorithmDefinition {
  id: string;
  created_at: string;
  updated_at?: string;
  execution_id?: string;
  agent_id?: string;
  created_by?: string;
  is_public: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  performance_metrics?: Record<string, any>;
  version: number;
}

export interface AlgorithmExecutionRecord {
  id: string;
  algorithm_id: string;
  execution_id?: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  error?: string;
  created_by?: string;
  metadata?: Record<string, any>;
}

/**
 * Store an algorithm definition in the database
 */
export async function storeAlgorithm(
  algorithm: AlgorithmDefinition,
  executionId?: string,
  agentId?: string,
  isPublic = false,
  tags?: string[]
): Promise<StoredAlgorithm | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('algorithms')
      .insert({
        name: algorithm.name,
        description: algorithm.description,
        implementation: algorithm.implementation,
        language: algorithm.language || 'javascript',
        input_schema: algorithm.inputSchema,
        output_schema: algorithm.outputSchema,
        parameters: algorithm.parameters,
        execution_id: executionId,
        agent_id: agentId,
        created_by: user.user?.id,
        is_public: isPublic,
        tags,
        metadata: {
          createdVia: 'algorithm-instantiation',
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error storing algorithm:', error);
      return null;
    }
    
    return data as StoredAlgorithm;
  } catch (error) {
    console.error('Error storing algorithm:', error);
    return null;
  }
}

/**
 * Retrieve an algorithm from the database by ID
 */
export async function getAlgorithmById(id: string): Promise<StoredAlgorithm | null> {
  try {
    const { data, error } = await supabase
      .from('algorithms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error retrieving algorithm:', error);
      return null;
    }
    
    return mapDbAlgorithmToInterface(data);
  } catch (error) {
    console.error('Error retrieving algorithm:', error);
    return null;
  }
}

/**
 * Find algorithms by name, description, or tags
 */
export async function findAlgorithms(
  query: string,
  language?: string,
  tags?: string[],
  limit = 10
): Promise<StoredAlgorithm[]> {
  try {
    let queryBuilder = supabase
      .from('algorithms')
      .select('*');
    
    // Full-text search if query provided
    if (query) {
      queryBuilder = queryBuilder.textSearch(
        'name,description',
        query,
        { config: 'english' }
      );
    }
    
    // Filter by language if provided
    if (language) {
      queryBuilder = queryBuilder.eq('language', language);
    }
    
    // Filter by tags if provided
    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', tags);
    }
    
    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      console.error('Error finding algorithms:', error);
      return [];
    }
    
    return data.map(mapDbAlgorithmToInterface);
  } catch (error) {
    console.error('Error finding algorithms:', error);
    return [];
  }
}

/**
 * Record an algorithm execution
 */
export async function recordAlgorithmExecution(
  algorithmId: string,
  executionId: string | undefined,
  inputs: Record<string, any>,
  status: 'pending' | 'in_progress' | 'completed' | 'failed' = 'in_progress',
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('algorithm_executions')
      .insert({
        algorithm_id: algorithmId,
        execution_id: executionId,
        inputs,
        status,
        created_by: user.user?.id,
        metadata
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error recording algorithm execution:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error recording algorithm execution:', error);
    return null;
  }
}

/**
 * Update algorithm execution with results
 */
export async function updateAlgorithmExecution(
  executionId: string,
  status: 'in_progress' | 'completed' | 'failed',
  outputs?: Record<string, any>,
  executionTimeMs?: number,
  error?: string
): Promise<boolean> {
  try {
    const updateData: Record<string, any> = { status };
    
    if (outputs) updateData.outputs = outputs;
    if (executionTimeMs) updateData.execution_time_ms = executionTimeMs;
    if (error) updateData.error = error;
    if (status !== 'in_progress') updateData.completed_at = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('algorithm_executions')
      .update(updateData)
      .eq('id', executionId);
    
    if (updateError) {
      console.error('Error updating algorithm execution:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating algorithm execution:', error);
    return false;
  }
}

/**
 * Get algorithm execution history
 */
export async function getAlgorithmExecutionHistory(
  algorithmId: string,
  limit = 10
): Promise<AlgorithmExecutionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('algorithm_executions')
      .select('*')
      .eq('algorithm_id', algorithmId)
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      console.error('Error getting algorithm execution history:', error);
      return [];
    }
    
    return data as AlgorithmExecutionRecord[];
  } catch (error) {
    console.error('Error getting algorithm execution history:', error);
    return [];
  }
}

/**
 * Update algorithm metadata and performance metrics
 */
export async function updateAlgorithmMetrics(
  algorithmId: string,
  performanceMetrics: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('algorithms')
      .update({
        performance_metrics: performanceMetrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', algorithmId);
    
    if (error) {
      console.error('Error updating algorithm metrics:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating algorithm metrics:', error);
    return false;
  }
}

/**
 * Helper function to convert database algorithm to interface format
 */
function mapDbAlgorithmToInterface(dbAlgorithm: any): StoredAlgorithm {
  return {
    id: dbAlgorithm.id,
    name: dbAlgorithm.name,
    description: dbAlgorithm.description,
    implementation: dbAlgorithm.implementation,
    language: dbAlgorithm.language,
    inputSchema: dbAlgorithm.input_schema,
    outputSchema: dbAlgorithm.output_schema,
    parameters: dbAlgorithm.parameters,
    execution_id: dbAlgorithm.execution_id,
    agent_id: dbAlgorithm.agent_id,
    created_by: dbAlgorithm.created_by,
    created_at: dbAlgorithm.created_at,
    updated_at: dbAlgorithm.updated_at,
    is_public: dbAlgorithm.is_public,
    tags: dbAlgorithm.tags,
    metadata: dbAlgorithm.metadata,
    performance_metrics: dbAlgorithm.performance_metrics,
    version: dbAlgorithm.version
  };
}
