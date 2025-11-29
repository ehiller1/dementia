/**
 * Workflow State Manager
 * Manages the state of workflow instances and steps
 */

import { supabase } from '../../integrations/supabase/client.ts';
import { 
  WorkflowInstance, 
  WorkflowStatus,
  WorkflowStatusValue,
  StepExecution,
  StepStatus,
  StepStatusValue,
  WorkflowBranch
} from './types.ts';

/**
 * Manages workflow state persistence and retrieval
 */
export class WorkflowStateManager {
  private tenantId: string;
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }
  
  /**
   * Creates a new workflow instance
   */
  async createWorkflowInstance(
    workflowTemplateId: string,
    inputData: any,
    userId: string,
    sessionId?: string,
    correlationId?: string,
    parentWorkflowId?: string,
    memoryContextId?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_workflow_instance', {
        p_tenant_id: this.tenantId,
        p_workflow_template_id: workflowTemplateId,
        p_input_data: inputData || {},
        p_user_id: userId,
        p_session_id: sessionId,
        p_correlation_id: correlationId,
        p_parent_workflow_id: parentWorkflowId
      });
      
      if (error) {
        console.error('Error creating workflow instance:', error);
        return null;
      }
      
      // If memory context provided, update the instance
      if (memoryContextId) {
        await supabase
          .from('workflow_instances')
          .update({ memory_context_id: memoryContextId })
          .eq('id', data)
          .eq('tenant_id', this.tenantId);
      }
      
      return data;
    } catch (error) {
      console.error('Exception creating workflow instance:', error);
      return null;
    }
  }
  
  /**
   * Gets a workflow instance by ID
   */
  async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('id', instanceId)
        .single();
      
      if (error) {
        console.error('Error getting workflow instance:', error);
        return null;
      }
      
      return {
        id: data.id,
        workflowTemplateId: data.workflow_template_id,
        templateVersion: data.template_version,
        correlationId: data.correlation_id,
        parentWorkflowId: data.parent_workflow_id,
        sessionId: data.session_id,
        userId: data.user_id,
        status: data.status as WorkflowStatusValue,
        currentStepId: data.current_step_id,
        inputData: data.input_data,
        outputData: data.output_data,
        contextData: data.context_data,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        errorMessage: data.error_message,
        memoryContextId: data.memory_context_id
      };
    } catch (error) {
      console.error('Exception getting workflow instance:', error);
      return null;
    }
  }
  
  /**
   * Updates a workflow instance
   */
  async updateWorkflowInstance(
    instanceId: string,
    updates: Partial<WorkflowInstance>
  ): Promise<boolean> {
    try {
      // Convert from camelCase to snake_case
      const dbUpdates: any = {};
      
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.currentStepId !== undefined) dbUpdates.current_step_id = updates.currentStepId;
      if (updates.outputData !== undefined) dbUpdates.output_data = updates.outputData;
      if (updates.contextData !== undefined) dbUpdates.context_data = updates.contextData;
      if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
      if (updates.memoryContextId !== undefined) dbUpdates.memory_context_id = updates.memoryContextId;
      
      // Set completed_at if status is terminal
      if (updates.status === WorkflowStatus.COMPLETED || 
          updates.status === WorkflowStatus.FAILED || 
          updates.status === WorkflowStatus.CANCELLED) {
        dbUpdates.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('workflow_instances')
        .update(dbUpdates)
        .eq('tenant_id', this.tenantId)
        .eq('id', instanceId);
      
      if (error) {
        console.error('Error updating workflow instance:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception updating workflow instance:', error);
      return false;
    }
  }
  
  /**
   * Creates a step execution record
   */
  async createStepExecution(
    workflowInstanceId: string,
    stepId: string,
    componentId?: string,
    inputData?: any
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_step_executions')
        .insert({
          tenant_id: this.tenantId,
          workflow_instance_id: workflowInstanceId,
          step_id: stepId,
          component_id: componentId,
          status: StepStatus.PENDING,
          input_data: inputData || {}
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating step execution:', error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Exception creating step execution:', error);
      return null;
    }
  }
  
  /**
   * Updates a step execution
   */
  async updateStepExecution(
    stepExecutionId: string,
    updates: Partial<StepExecution>
  ): Promise<boolean> {
    try {
      // Convert from camelCase to snake_case
      const dbUpdates: any = {};
      
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.outputData !== undefined) dbUpdates.output_data = updates.outputData;
      if (updates.contextData !== undefined) dbUpdates.context_data = updates.contextData;
      if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
      
      // Set timestamps based on status
      if (updates.status === StepStatus.RUNNING && !dbUpdates.started_at) {
        dbUpdates.started_at = new Date().toISOString();
      }
      
      if ((updates.status === StepStatus.COMPLETED || 
           updates.status === StepStatus.FAILED || 
           updates.status === StepStatus.SKIPPED) && 
          !dbUpdates.completed_at) {
        dbUpdates.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('workflow_step_executions')
        .update(dbUpdates)
        .eq('tenant_id', this.tenantId)
        .eq('id', stepExecutionId);
      
      if (error) {
        console.error('Error updating step execution:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception updating step execution:', error);
      return false;
    }
  }
  
  /**
   * Gets a step execution by ID
   */
  async getStepExecution(stepExecutionId: string): Promise<StepExecution | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_step_executions')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('id', stepExecutionId)
        .single();
      
      if (error) {
        console.error('Error getting step execution:', error);
        return null;
      }
      
      return {
        id: data.id,
        workflowInstanceId: data.workflow_instance_id,
        stepId: data.step_id,
        componentId: data.component_id,
        status: data.status as StepStatusValue,
        inputData: data.input_data,
        outputData: data.output_data,
        contextData: data.context_data,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        errorMessage: data.error_message,
        retryCount: data.retry_count
      };
    } catch (error) {
      console.error('Exception getting step execution:', error);
      return null;
    }
  }
  
  /**
   * Gets all step executions for a workflow instance
   */
  async getWorkflowSteps(workflowInstanceId: string): Promise<StepExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_step_executions')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('workflow_instance_id', workflowInstanceId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error getting workflow steps:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        workflowInstanceId: item.workflow_instance_id,
        stepId: item.step_id,
        componentId: item.component_id,
        status: item.status as StepStatusValue,
        inputData: item.input_data,
        outputData: item.output_data,
        contextData: item.context_data,
        startedAt: item.started_at,
        completedAt: item.completed_at,
        errorMessage: item.error_message,
        retryCount: item.retry_count
      }));
    } catch (error) {
      console.error('Exception getting workflow steps:', error);
      return [];
    }
  }
  
  /**
   * Records a workflow branch decision
   */
  async recordBranchDecision(
    workflowInstanceId: string,
    sourceStepId: string,
    targetStepId: string,
    conditionLogic?: any,
    decisionFactors?: any
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_branches')
        .insert({
          tenant_id: this.tenantId,
          workflow_instance_id: workflowInstanceId,
          source_step_id: sourceStepId,
          target_step_id: targetStepId,
          condition_logic: conditionLogic,
          decision_factors: decisionFactors,
          taken_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error recording branch decision:', error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Exception recording branch decision:', error);
      return null;
    }
  }
  
  /**
   * Gets all branch decisions for a workflow instance
   */
  async getWorkflowBranches(workflowInstanceId: string): Promise<WorkflowBranch[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_branches')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('workflow_instance_id', workflowInstanceId)
        .order('taken_at', { ascending: true });
      
      if (error) {
        console.error('Error getting workflow branches:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        workflowInstanceId: item.workflow_instance_id,
        sourceStepId: item.source_step_id,
        targetStepId: item.target_step_id,
        conditionLogic: item.condition_logic,
        decisionFactors: item.decision_factors,
        takenAt: item.taken_at
      }));
    } catch (error) {
      console.error('Exception getting workflow branches:', error);
      return [];
    }
  }
}

/**
 * Creates a workflow state manager instance
 */
export function createWorkflowStateManager(tenantId: string): WorkflowStateManager {
  return new WorkflowStateManager(tenantId);
}
