/**
 * Workflow Template Integration
 * 
 * Provides integration between the workflowservice and the DynamicTemplateManager.
 * This module helps bridge the gap between the server-side workflow service and
 * the edge function-based dynamic template engine.
 */

import { workflowservice, WorkflowInstance, WorkflowTemplate } from '@/services/workflowservice';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowTemplateIntegrationOptions {
  tenantId: string;
  userId?: string;
}

/**
 * Class to integrate workflowservice with dynamic templates
 */
export class WorkflowTemplateIntegration {
  private tenantId: string;
  private userId?: string;
  
  constructor(options: WorkflowTemplateIntegrationOptions) {
    this.tenantId = options.tenantId;
    this.userId = options.userId;
  }
  
  /**
   * Synchronizes a workflow template to the dynamic templates table
   * This makes the workflow available for use in dynamic template processing
   */
  async syncWorkflowToDynamicTemplate(
    workflowTemplateId: string,
    conversationId?: string
  ): Promise<string | null> {
    try {
      // Get the workflow template
      const template = await workflowservice.getTemplate(workflowTemplateId, this.tenantId);
      if (!template) {
        console.error(`Workflow template ${workflowTemplateId} not found`);
        return null;
      }
      
      // Format the prompt for dynamic template use
      const dynamicPrompt = this.formatWorkflowAsDynamicTemplate(template);
      
      // Create or update the dynamic template
      const { data, error } = await supabase
        .from('dynamic_templates')
        .upsert({
          id: `wf_${template.id}`,
          name: `Workflow: ${template.name}`,
          prompt: dynamicPrompt,
          conversation_id: conversationId,
          tenant_id: this.tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          type: 'workflow',
          metadata: {
            workflow_template_id: template.id,
            version: template.version
          }
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error syncing workflow to dynamic template:', error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Error in syncWorkflowToDynamicTemplate:', error);
      return null;
    }
  }
  
  /**
   * Formats a workflow template as a dynamic template prompt
   */
  private formatWorkflowAsDynamicTemplate(template: { name: string; description?: string; version: string; steps: any[] }): string {
    // Generate a prompt that includes step information and transition logic using unified steps schema
    return `
      Context:
      - Conversation History: {conversation}
      - Working Memory: {working_memory}
      - User Events: {user_events}
      - System Events: {system_events}
      - State Changes: {state_changes}
      - Workflow Events: {workflow_events}
      - Workflow Decision Events: {workflow_decision_events}
      - Recent Task Executions: {task_executions}
      
      Workflow: ${template.name}
      Description: ${template.description || 'No description provided.'}
      Version: ${template.version}
      
      Current Step: {workflow_state.current_step_id}
      
      Available Steps:
      ${template.steps && template.steps.length > 0 ? template.steps.map((step: any) => `
        ID: ${step.id}
        Type: ${step.type}
        Description: ${step.description || 'No description provided.'}
        Content: ${step.content || ''}
        Agentic Task: ${step.agentic_task ? step.agentic_task.task : 'None'}
        Declarative Prompt: ${step.declarative_prompt ? step.declarative_prompt.prompt : 'None'}
        Inputs: ${step.inputs?.join(', ') || 'None'}
        Outputs: ${step.outputs?.join(', ') || 'None'}
        Parameters: ${step.parameters ? JSON.stringify(step.parameters) : 'None'}
        Order: ${step.order ?? 'N/A'}
      `).join('\n') : 'No steps defined.'}
      
      Task: Based on the context and current workflow state, determine the most appropriate next step or action.
      Analyze the user's last message and the workflow state to suggest a next step or provide relevant information.
    `;
  }
  
  /**
   * Updates the dynamic template when workflow state changes
   */
  async updateDynamicTemplateFromWorkflowState(
    workflowInstanceId: string,
    conversationId: string
  ): Promise<boolean> {
    try {
      // Get the workflow instance
      const instance = await workflowservice.getInstance(workflowInstanceId, this.tenantId);
      if (!instance) {
        console.error(`Workflow instance ${workflowInstanceId} not found`);
        return false;
      }
      
      // Get the template
      const template = await workflowservice.getTemplate(instance.templateId, this.tenantId);
      if (!template) {
        console.error(`Workflow template ${instance.templateId} not found`);
        return false;
      }
      
      // Get the workflow context
      const workflowContext = await workflowservice.getWorkflowContext(
        workflowInstanceId,
        this.tenantId
      );
      
      // Update workflow_state in conversation-specific state
      const { error: stateError } = await supabase
        .from('workflow_state')
        .upsert({
          conversation_id: conversationId,
          workflow_instance_id: workflowInstanceId,
          current_step_id: instance.currentStepId,
          status: instance.status,
          data: instance.data,
          context: workflowContext,
          user_id: this.userId || instance.userId,
          tenant_id: this.tenantId,
          updated_at: new Date().toISOString()
        });
        
      if (stateError) {
        console.error('Error updating workflow state:', stateError);
        return false;
      }
      
      // Ensure dynamic template exists
      await this.syncWorkflowToDynamicTemplate(instance.templateId, conversationId);
      
      return true;
    } catch (error) {
      console.error('Error in updateDynamicTemplateFromWorkflowState:', error);
      return false;
    }
  }
  
  /**
   * Records a workflow event
   */
  async recordWorkflowEvent(
    workflowInstanceId: string,
    conversationId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_events')
        .insert({
          workflow_instance_id: workflowInstanceId,
          conversation_id: conversationId,
          event_type: eventType,
          event_data: eventData,
          user_id: this.userId,
          tenant_id: this.tenantId,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error recording workflow event:', error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Error in recordWorkflowEvent:', error);
      return null;
    }
  }
  
  /**
   * Records a workflow decision event
   */
  async recordWorkflowDecisionEvent(
    workflowInstanceId: string,
    conversationId: string,
    decision: string,
    options: string[],
    reasoning: string,
    data?: Record<string, any>
  ): Promise<string | null> {
    try {
      const { data: result, error } = await supabase
        .from('workflow_decision_events')
        .insert({
          workflow_instance_id: workflowInstanceId,
          conversation_id: conversationId,
          decision,
          options,
          reasoning,
          data: data || {},
          user_id: this.userId,
          tenant_id: this.tenantId,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error recording workflow decision event:', error);
        return null;
      }
      
      return result.id;
    } catch (error) {
      console.error('Error in recordWorkflowDecisionEvent:', error);
      return null;
    }
  }
  
  /**
   * Gets workflow instances by conversation ID
   */
  async getWorkflowInstancesByConversation(conversationId: string): Promise<WorkflowInstance[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_state')
        .select('workflow_instance_id')
        .eq('conversation_id', conversationId)
        .eq('tenant_id', this.tenantId);
        
      if (error) {
        console.error('Error getting workflow instances by conversation:', error);
        return [];
      }
      
      const instances: WorkflowInstance[] = [];
      
      // Get details for each instance
      for (const item of data) {
        const instance = await workflowservice.getInstance(
          item.workflow_instance_id,
          this.tenantId
        );
        
        if (instance) {
          instances.push(instance);
        }
      }
      
      return instances;
    } catch (error) {
      console.error('Error in getWorkflowInstancesByConversation:', error);
      return [];
    }
  }
}

/**
 * Creates a new workflow template integration instance
 */
export function createWorkflowTemplateIntegration(
  options: WorkflowTemplateIntegrationOptions
): WorkflowTemplateIntegration {
  return new WorkflowTemplateIntegration(options);
}
