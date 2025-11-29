// Adapter to convert DecisionTemplateStep[] to WorkflowStep[] and vice versa
import { DecisionTemplateStep } from '../decision-templates/types.ts';
import { WorkflowStep } from './types.ts';

/**
 * Convert an array of DecisionTemplateStep to WorkflowStep
 */
export function decisionStepsToWorkflowSteps(
  steps: DecisionTemplateStep[]
): WorkflowStep[] {
  return steps.map((step) => ({
    id: step.id,
    name: step.type === 'prompt' || step.type === 'conversation'
      ? step.content || step.description || step.id
      : step.description || step.id,
    description: step.description,
    // Map agentic_task/declarative_prompt to componentConfig/componentType if needed
    componentId: step.agentic_task ? 'agentic-task' : step.declarative_prompt ? 'declarative-prompt' : undefined,
    componentType: step.type as any, // Accepts broader types in WorkflowStep
    componentConfig: step.agentic_task || step.declarative_prompt || {},
    inputs: step.inputs
      ? Object.fromEntries(
          step.inputs.map((input) => [input, { type: 'dynamic', value: null }])
        )
      : undefined,
    outputs: step.outputs
      ? Object.fromEntries(
          step.outputs.map((output) => [output, { target: 'next_step' }])
        )
      : undefined,
    nextSteps: step.parameters?.nextSteps
      ? { default: step.parameters.nextSteps[0], conditions: [] }
      : undefined,
    errorHandler: undefined,
    events: undefined,
  }));
}

/**
 * Convert an array of WorkflowStep to DecisionTemplateStep
 */
export function workflowStepsToDecisionSteps(
  steps: WorkflowStep[]
): DecisionTemplateStep[] {
  return steps.map((step) => ({
    id: step.id,
    type: (step.componentType as any) || 'action',
    description: step.description,
    content: step.name,
    agentic_task:
      step.componentId === 'agentic-task' ? (step.componentConfig as any) : undefined,
    declarative_prompt:
      step.componentId === 'declarative-prompt' ? (step.componentConfig as any) : undefined,
    inputs: step.inputs ? Object.keys(step.inputs) : undefined,
    outputs: step.outputs ? Object.keys(step.outputs) : undefined,
    parameters: step.nextSteps ? { nextSteps: [step.nextSteps.default] } : undefined,
    order: undefined,
  }));
}
