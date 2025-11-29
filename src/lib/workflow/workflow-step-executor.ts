/**
 * Workflow Step Executor
 * Executes individual workflow steps and components
 */

import { 
  WorkflowStep, 
  StepStatus,
  WorkflowComponentType,
  ComponentExecutionContext,
  ComponentExecutionResult,
  WorkflowEventTypeValue,
  WorkflowEventType
} from './types';
import { WorkflowStateManager } from './workflow-state-manager';
import { WorkflowComponentRegistry } from './workflow-component-registry';
import { WorkflowEventService } from './workflow-event-service';
import { WorkflowMemoryIntegration } from './workflow-memory-integration';
import { ActionAgentService } from '../../services/ActionAgentService.js';

/**
 * Executes workflow steps and components
 */
export class WorkflowStepExecutor {
  private stateManager: WorkflowStateManager;
  private componentRegistry: WorkflowComponentRegistry;
  private eventService: WorkflowEventService;
  private memoryIntegration: WorkflowMemoryIntegration;
  private tenantId: string;
  
  constructor(
    tenantId: string,
    stateManager: WorkflowStateManager,
    componentRegistry: WorkflowComponentRegistry,
    eventService: WorkflowEventService,
    memoryIntegration: WorkflowMemoryIntegration
  ) {
    this.tenantId = tenantId;
    this.stateManager = stateManager;
    this.componentRegistry = componentRegistry;
    this.eventService = eventService;
    this.memoryIntegration = memoryIntegration;
  }
  
  /**
   * Executes a workflow step
   */
  async executeStep(
    workflowInstanceId: string,
    step: WorkflowStep,
    inputData: any,
    contextData: any
  ): Promise<{ status: typeof StepStatus[keyof typeof StepStatus]; outputData?: any; errorMessage?: string; contextData?: any; }> {
    try {
      // Create step execution record
      const stepExecutionId = await this.stateManager.createStepExecution(
        workflowInstanceId,
        step.id,
        step.componentId,
        inputData
      );
      
      if (!stepExecutionId) {
        return {
          status: StepStatus.FAILED,
          errorMessage: 'Failed to create step execution record',
          outputData: null
        };
      }
      
      // Update step status to running
      await this.stateManager.updateStepExecution(stepExecutionId, {
        status: StepStatus.RUNNING
      });
      
      // Emit component start event
      await this.eventService.publishEvent({
        eventType: WorkflowEventType.COMPONENT_START,
        sourceType: 'workflow_step',
        sourceId: step.id,
        targetType: 'component',
        targetId: step.componentId,
        data: {
          workflowInstanceId,
          stepExecutionId,
          inputData
        }
      });
      
      // Store step context in working memory
      const memoryKey = `workflow:${workflowInstanceId}:step:${step.id}`;
      await this.memoryIntegration.storeInWorkingMemory(
        memoryKey,
        {
          stepId: step.id,
          componentId: step.componentId,
          inputData,
          contextData
        }
      );
      
      let result: ComponentExecutionResult;
      
      try {
        // Execute the component
        // Build execution context to match ComponentExecutionContext interface
        const execContext: ComponentExecutionContext = {
          workflowInstanceId,
          stepId: step.id,
          stepExecutionId,
          inputs: inputData,
          context: contextData || {},
          memory: {
            read: async (key: string) => this.memoryIntegration.getFromWorkingMemory<any>(key),
            write: async (key: string, value: any) => this.memoryIntegration.storeInWorkingMemory(key, value)
          },
          events: {
            emit: async (eventType: WorkflowEventTypeValue, data: any) => {
              await this.eventService.publishEvent({
                eventType,
                sourceType: 'component',
                sourceId: step.componentId,
                targetType: 'workflow_step',
                targetId: step.id,
                data: { ...data, workflowInstanceId, stepExecutionId }
              });
            }
          }
        };
        result = await this.executeComponent(
          step.componentId!,
          execContext
        );
      } catch (error) {
        console.error(`Error executing component ${step.componentId}:`, error);
        
        // Update step status to failed
        await this.stateManager.updateStepExecution(stepExecutionId, {
          status: StepStatus.FAILED,
          errorMessage: error.message || 'Component execution failed'
        });
        
        // Emit component error event
        await this.eventService.publishEvent({
          eventType: WorkflowEventType.COMPONENT_ERROR,
          sourceType: 'component',
          sourceId: step.componentId,
          targetType: 'workflow_step',
          targetId: step.id,
          data: {
            workflowInstanceId,
            stepExecutionId,
            error: error.message || 'Component execution failed'
          }
        });
        
        return {
          status: StepStatus.FAILED,
          errorMessage: error.message || 'Component execution failed',
          outputData: null
        };
      }
      
      // Update step status based on component result
      const stepStatus = result.success ? StepStatus.COMPLETED : StepStatus.FAILED;
      
      await this.stateManager.updateStepExecution(stepExecutionId, {
        status: stepStatus,
        outputData: result.outputs,
        errorMessage: result.error?.message
      });
      
      // Store step result in working memory
      await this.memoryIntegration.storeInWorkingMemory(
        `${memoryKey}:result`,
        {
          status: stepStatus,
          outputData: result.outputs,
          errorMessage: result.error?.message
        }
      );
      
      // If successful, store relevant data in short-term memory
      if (result.success && result.outputs) {
        await this.memoryIntegration.storeInShortTermMemory(
          `workflow:${workflowInstanceId}:results:${step.id}`,
          {
            stepId: step.id,
            componentId: step.componentId,
            outputData: result.outputs,
            timestamp: new Date().toISOString()
          }
        );
      }
      
      // Emit component complete event
      await this.eventService.publishEvent({
        eventType: result.success ? WorkflowEventType.COMPONENT_COMPLETE : WorkflowEventType.COMPONENT_ERROR,
        sourceType: 'component',
        sourceId: step.componentId,
        targetType: 'workflow_step',
        targetId: step.id,
        data: {
          workflowInstanceId,
          stepExecutionId,
          success: result.success,
          outputData: result.outputs,
          errorMessage: result.error?.message
        }
      });
      
      return {
        status: stepStatus,
        outputData: result.outputs,
        errorMessage: result.error?.message
      };
    } catch (error) {
      console.error(`Error executing step ${step.id}:`, error);
      return {
        status: StepStatus.FAILED,
        errorMessage: (error as any).message || 'Step execution failed',
        outputData: null
      };
    }
  }
  
  /**
   * Executes a component
   */
  private async executeComponent(
    componentId: string,
    context: ComponentExecutionContext
  ): Promise<ComponentExecutionResult> {
    // Get component from registry
    const component = await this.componentRegistry.getComponent(componentId);
    
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }
    
    // Get component implementation
    const implementation = this.componentRegistry.getImplementation(componentId);
    
    if (!implementation) {
      throw new Error(`Component implementation not found: ${componentId}`);
    }
    
    // Record start time for metrics
    const startTime = new Date();
    
    try {
      // Governed execution of the component implementation
      const action = {
        id: `wfcomp-${context.workflowInstanceId}-${context.stepId}-${componentId}`,
        title: `Execute component ${componentId}`,
        description: `Workflow component execution for step ${context.stepId}`,
        priority: 'normal',
        complexity: 'medium',
        costEstimateUSD: 0,
        risk: 'medium',
        estimatedTimeframe: '1h'
      };

      const agent = { id: componentId, name: `WorkflowComponent:${componentId}` };
      const user = { id: 'system', email: 'system@local', role: 'user' };

      const envelope = await ActionAgentService.executeWithGovernance({
        action,
        agent,
        user,
        executor: async () => implementation.execute(context)
      });

      // Map governance envelope to component result
      if (envelope.status === 'pending_approval') {
        const pendingResult: ComponentExecutionResult = {
          success: false,
          outputs: null,
          error: new Error('pending_approval'),
          events: [],
          nextStep: undefined
        };
        const endTime = new Date();
        await this.componentRegistry.recordComponentMetrics(
          componentId,
          component.version || 1,
          context.stepExecutionId,
          startTime,
          endTime,
          false,
          (context as any).inputs,
          null,
          'pending_approval'
        );
        return pendingResult;
      }
      if (envelope.status === 'denied') {
        throw new Error(`governance_denied: ${envelope.reason}`);
      }
      if (envelope.status === 'failed') {
        throw new Error(`governance_failed: ${envelope.error || 'unknown'}`);
      }

      const result = envelope.result as ComponentExecutionResult;
      // Record end time and metrics
      const endTime = new Date();
      await this.componentRegistry.recordComponentMetrics(
        componentId,
        component.version || 1,
        context.stepExecutionId,
        startTime,
        endTime,
        result.success,
        (context as any).inputs,
        result.outputs,
        result.error?.message
      );
      return result;
    } catch (error) {
      // Record end time and metrics for error
      const endTime = new Date();
      await this.componentRegistry.recordComponentMetrics(
        componentId,
        component.version || 1,
        context.stepExecutionId,
        startTime,
        endTime,
        false,
        (context as any).inputs,
        null,
        (error as any).message || 'Component execution failed'
      );
      
      throw error;
    }
  }
}

/**
 * Creates a workflow step executor instance
 */
export function createWorkflowStepExecutor(
  tenantId: string,
  stateManager: WorkflowStateManager,
  componentRegistry: WorkflowComponentRegistry,
  eventService: WorkflowEventService,
  memoryIntegration: WorkflowMemoryIntegration
): WorkflowStepExecutor {
  return new WorkflowStepExecutor(
    tenantId,
    stateManager,
    componentRegistry,
    eventService,
    memoryIntegration
  );
}
