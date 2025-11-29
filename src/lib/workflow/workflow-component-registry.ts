/**
 * Workflow Component Registry
 * Manages registration, retrieval, and versioning of workflow components
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  WorkflowComponent, 
  WorkflowComponentType,
  ComponentImplementation
} from './types.ts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Component Registry Service
 * Manages the registration and retrieval of workflow components
 */
export class WorkflowComponentRegistry {
  private tenantId: string;
  private componentImplementations: Map<string, ComponentImplementation>;
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.componentImplementations = new Map();
  }
  
  /**
   * Registers a new component
   */
  async registerComponent(component: WorkflowComponent): Promise<string | null> {
    try {
      // Call the database function to register component
      const { data, error } = await supabase.rpc('register_workflow_component', {
        p_tenant_id: this.tenantId,
        p_name: component.name,
        p_description: component.description || '',
        p_component_type: component.componentType,
        p_schema: component.schema || {},
        p_implementation: component.implementation,
        p_metadata: component.metadata || {}
      });
      
      if (error) {
        console.error('Error registering component:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception registering component:', error);
      return null;
    }
  }
  
  /**
   * Creates a new version of an existing component
   */
  async createComponentVersion(
    componentId: string,
    schema: any,
    implementation: any,
    metadata?: any,
    createdBy?: string
  ): Promise<number | null> {
    try {
      const { data, error } = await supabase.rpc('create_component_version', {
        p_tenant_id: this.tenantId,
        p_component_id: componentId,
        p_schema: schema,
        p_implementation: implementation,
        p_metadata: metadata || {},
        p_created_by: createdBy
      });
      
      if (error) {
        console.error('Error creating component version:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception creating component version:', error);
      return null;
    }
  }
  
  /**
   * Gets a component by ID
   */
  async getComponent(componentId: string): Promise<WorkflowComponent | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_components')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('id', componentId)
        .single();
      
      if (error) {
        console.error('Error getting component:', error);
        return null;
      }
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        componentType: data.component_type as WorkflowComponentType,
        schema: data.schema,
        implementation: data.implementation,
        metadata: data.metadata,
        version: data.version
      };
    } catch (error) {
      console.error('Exception getting component:', error);
      return null;
    }
  }
  
  /**
   * Gets a specific version of a component
   */
  async getComponentVersion(componentId: string, version: number): Promise<WorkflowComponent | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_component_versions')
        .select('*, component:workflow_components(name, component_type, description)')
        .eq('tenant_id', this.tenantId)
        .eq('component_id', componentId)
        .eq('version', version)
        .single();
      
      if (error) {
        console.error('Error getting component version:', error);
        return null;
      }
      
      return {
        id: data.component_id,
        name: data.component.name,
        description: data.component.description,
        componentType: data.component.component_type as WorkflowComponentType,
        schema: data.schema,
        implementation: data.implementation,
        metadata: data.metadata,
        version: data.version
      };
    } catch (error) {
      console.error('Exception getting component version:', error);
      return null;
    }
  }
  
  /**
   * Finds components by type
   */
  async findComponentsByType(componentType: WorkflowComponentType): Promise<WorkflowComponent[]> {
    try {
      const { data, error } = await supabase.rpc('find_components_by_type', {
        p_tenant_id: this.tenantId,
        p_component_type: componentType
      });
      
      if (error) {
        console.error('Error finding components by type:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        componentType: item.component_type as WorkflowComponentType,
        schema: item.schema,
        implementation: item.implementation,
        metadata: item.metadata,
        version: item.version
      }));
    } catch (error) {
      console.error('Exception finding components by type:', error);
      return [];
    }
  }
  
  /**
   * Searches for components by name or description
   */
  async searchComponents(searchTerm: string): Promise<WorkflowComponent[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_components')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      
      if (error) {
        console.error('Error searching components:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        componentType: item.component_type as WorkflowComponentType,
        schema: item.schema,
        implementation: item.implementation,
        metadata: item.metadata,
        version: item.version
      }));
    } catch (error) {
      console.error('Exception searching components:', error);
      return [];
    }
  }
  
  /**
   * Registers a component implementation in memory
   */
  registerImplementation(componentId: string, implementation: ComponentImplementation): void {
    this.componentImplementations.set(componentId, implementation);
  }
  
  /**
   * Gets a component implementation from memory
   */
  getImplementation(componentId: string): ComponentImplementation | undefined {
    return this.componentImplementations.get(componentId);
  }
  
  /**
   * Gets component metrics
   */
  async getComponentMetrics(componentId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_component_metrics')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('component_id', componentId)
        .order('start_time', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error getting component metrics:', error);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Exception getting component metrics:', error);
      return [];
    }
  }
  
  /**
   * Records component execution metrics
   */
  async recordComponentMetrics(
    componentId: string,
    componentVersion: number,
    executionId: string,
    startTime: Date,
    endTime: Date,
    success: boolean,
    inputData: any,
    outputData: any,
    errorMessage?: string,
    memoryUsage?: number,
    metadata?: any
  ): Promise<void> {
    try {
      const durationMs = endTime.getTime() - startTime.getTime();
      
      await supabase
        .from('workflow_component_metrics')
        .insert({
          tenant_id: this.tenantId,
          component_id: componentId,
          component_version: componentVersion,
          execution_id: executionId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_ms: durationMs,
          success: success,
          error_message: errorMessage,
          input_data: inputData,
          output_data: outputData,
          memory_usage: memoryUsage,
          metadata: metadata
        });
    } catch (error) {
      console.error('Exception recording component metrics:', error);
    }
  }
  
  /**
   * Gets component dependencies
   */
  async getComponentDependencies(componentId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_component_dependencies')
        .select('dependency_component_id')
        .eq('tenant_id', this.tenantId)
        .eq('component_id', componentId);
      
      if (error) {
        console.error('Error getting component dependencies:', error);
        return [];
      }
      
      return data.map(item => item.dependency_component_id);
    } catch (error) {
      console.error('Exception getting component dependencies:', error);
      return [];
    }
  }
  
  /**
   * Adds a component dependency
   */
  async addComponentDependency(
    componentId: string,
    dependencyComponentId: string,
    dependencyType: string,
    conditionLogic?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workflow_component_dependencies')
        .insert({
          tenant_id: this.tenantId,
          component_id: componentId,
          dependency_component_id: dependencyComponentId,
          dependency_type: dependencyType,
          condition_logic: conditionLogic
        });
      
      if (error) {
        console.error('Error adding component dependency:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception adding component dependency:', error);
      return false;
    }
  }
}

/**
 * Creates a workflow component registry instance
 */
export function createWorkflowComponentRegistry(tenantId: string): WorkflowComponentRegistry {
  return new WorkflowComponentRegistry(tenantId);
}
