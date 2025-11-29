/**
 * Workflow System Types
 * Core type definitions for the event-driven workflow system
 */



/**
 * Workflow Event Types
 * Defined as a constant object instead of enum for compatibility with ts-node-esm
 */
export const WorkflowEventType = {
  WORKFLOW_START: 'workflow_start',
  WORKFLOW_COMPLETE: 'workflow_complete',
  WORKFLOW_STEP_COMPLETE: 'workflow_step_complete',
  WORKFLOW_STEP_ERROR: 'workflow_step_error',
  COMPONENT_START: 'component_start',
  COMPONENT_COMPLETE: 'component_complete',
  COMPONENT_ERROR: 'component_error',
  CONDITION_MET: 'condition_met',
  CONDITION_FAILED: 'condition_failed',
  LLM_DETECTED_EVENT: 'llm_detected_event',
  EXTERNAL_EVENT: 'external_event',
  TIMER_EVENT: 'timer_event',
  DATA_EVENT: 'data_event',
  USER_INTERACTION: 'user_interaction',
  POSITIVE_EVENT: 'positive_event',
  CHAIN_EVENT: 'chain_event',
  ERV_UPDATE: 'erv_update'
} as const;

/**
 * Type for WorkflowEventType values
 */
export type WorkflowEventCategory =
  | 'DATA_EVENT'
  | 'ACTION_EVENT'
  | 'DECISION_EVENT'
  | 'TELEMETRY_EVENT'
  | 'ORCHESTRATION_EVENT';

export type WorkflowEventTypeValue = WorkflowEventCategory | typeof WorkflowEventType[keyof typeof WorkflowEventType];

export type SubscriberType = 'business-service' | 'ui' | 'agent' | 'governance' | 'sync';

export interface WorkflowEnvelope {
  eventType: WorkflowEventTypeValue;
  payload?: any;
  data?: any;
  subtype?: string;
  attributes?: Record<string, string | number | boolean>;
  tenantId?: string;
}

export type SimpleFilterCriteria = {
  subtype?: string | string[];
  attributes?: Record<string, string | number | boolean>;
  match?: 'all' | 'any';
};

export type FilterCriteria = SimpleFilterCriteria | ((envelope: WorkflowEnvelope) => boolean);

export interface WorkflowSubscriptionHandle {
  unsubscribe: () => Promise<boolean>;
}

export type SubscribeFn = (
  eventType: WorkflowEventTypeValue,
  handler: WorkflowEventHandler,
  subscriberType: SubscriberType,
  subscriberId: string,
  filterCriteria?: FilterCriteria
) => WorkflowSubscriptionHandle;

/**
 * Component Types
 */
export const WorkflowComponentType = {
  ACTION: 'action',
  DECISION: 'decision',
  LLM: 'llm',
  INTEGRATION: 'integration',
  DATA: 'data',
  EVENT: 'event',
  COMPOSITE: 'composite'
} as const;

/**
 * Type for WorkflowComponentType values
 */
export type WorkflowComponentTypeValue = typeof WorkflowComponentType[keyof typeof WorkflowComponentType];

/**
 * Workflow Status
 */
export const WorkflowStatus = {
  CREATED: 'created',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

/**
 * Type for WorkflowStatus values
 */
export type WorkflowStatusValue = typeof WorkflowStatus[keyof typeof WorkflowStatus];

/**
 * Step Status
 */
export const StepStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
} as const;

/**
 * Type for StepStatus values
 */
export type StepStatusValue = typeof StepStatus[keyof typeof StepStatus];

/**
 * Event Definition
 */
export interface EventDefinition {
  id?: string;
  name: string;
  description?: string;
  eventType: WorkflowEventTypeValue;
  schema?: any; // JSON schema for event data
  metadata?: Record<string, any>;
}

/**
 * Event Data
 */
export interface WorkflowEvent {
  id?: string;
  eventDefinitionId?: string;
  eventType: WorkflowEventTypeValue;
  sourceType?: string;
  sourceId?: string;
  targetType?: string;
  targetId?: string;
  data?: any;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  timestamp?: string;
}

/**
 * Component Definition
 */
export interface WorkflowComponent {
  id?: string;
  name: string;
  description?: string;
  componentType: WorkflowComponentTypeValue;
  schema?: {
    input?: any;
    output?: any;
  };
  implementation: {
    type: 'function' | 'service' | 'llm' | 'external';
    reference: string;
    config?: any;
  };
  metadata?: Record<string, any>;
  version?: number;
}

/**
 * Workflow Step Definition
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  componentId?: string;
  componentType?: WorkflowComponentTypeValue;
  componentConfig?: any;
  inputs?: {
    [key: string]: {
      type: 'static' | 'dynamic' | 'memory' | 'context' | 'event';
      value: any;
      source?: string;
    };
  };
  outputs?: {
    [key: string]: {
      target: 'memory' | 'context' | 'event' | 'next_step';
      destination?: string;
    };
  };
  nextSteps?: {
    default?: string;
    conditions?: Array<{
      condition: string;
      step: string;
      description?: string;
    }>;
  };
  errorHandler?: {
    strategy: 'retry' | 'skip' | 'fail' | 'alternate';
    maxRetries?: number;
    alternateStep?: string;
  };
  events?: {
    emits?: string[];
    listens?: string[];
  };
}

/**
 * Workflow Template Definition
 */
export interface WorkflowTemplate {
  id?: string;
  name: string;
  description?: string;
  version?: number;
  decisionTemplateId?: string;
  eventTriggers?: Array<{
    eventType: WorkflowEventTypeValue;
    eventDefinitionId?: string;
    filter?: any;
  }>;
  emittedEvents?: Array<{
    eventType: WorkflowEventTypeValue;
    eventDefinitionId?: string;
    description?: string;
  }>;
  components: string[]; // Component IDs
  workflowSchema: {
    startStep: string;
    steps: Record<string, WorkflowStep>;
  };
  inputSchema?: any;
  outputSchema?: any;
  settings?: {
    autoAdapt?: boolean;
    maxDurationSeconds?: number;
    errorHandlingStrategy?: string;
  };
}

/**
 * Workflow Instance (Execution)
 */
export interface WorkflowInstance {
  id?: string;
  workflowTemplateId: string;
  templateVersion: number;
  correlationId?: string;
  parentWorkflowId?: string;
  sessionId?: string;
  userId?: string;
  status: WorkflowStatusValue;
  currentStepId?: string;
  inputData?: any;
  outputData?: any;
  contextData?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  memoryContextId?: string;
}

/**
 * Step Execution
 */
export interface StepExecution {
  id?: string;
  workflowInstanceId: string;
  stepId: string;
  componentId?: string;
  status: StepStatusValue;
  inputData?: any;
  outputData?: any;
  contextData?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount?: number;
}

/**
 * Workflow Branch (Decision Path)
 */
export interface WorkflowBranch {
  id?: string;
  workflowInstanceId: string;
  sourceStepId: string;
  targetStepId: string;
  conditionLogic?: any;
  decisionFactors?: any;
  takenAt?: string;
}

/**
 * Workflow Adaptation
 */
export interface WorkflowAdaptation {
  id?: string;
  workflowTemplateId: string;
  originalVersion: number;
  adaptedVersion: number;
  adaptationType: string;
  adaptationReason?: string;
  adaptationData?: any;
  performanceImpact?: any;
  createdBy?: string;
  approved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
}

/**
 * Event Subscription
 */
export interface EventSubscription {
  id?: string;
  subscriberType: string;
  subscriberId: string;
  eventDefinitionId?: string;
  eventType?: WorkflowEventTypeValue;
  filterCriteria?: any;
  isActive?: boolean;
}

/**
 * Component Execution Context
 */
export interface ComponentExecutionContext {
  workflowInstanceId: string;
  stepId: string;
  stepExecutionId: string;
  inputs: any;
  context: Record<string, any>;
  memory: {
    read: (key: string) => Promise<any>;
    write: (key: string, value: any) => Promise<void>;
  };
  events: {
    emit: (eventType: WorkflowEventTypeValue, data: any) => Promise<void>;
  };
}

/**
 * Component Execution Result
 */
export interface ComponentExecutionResult {
  success: boolean;
  outputs?: any;
  error?: Error;
  events?: WorkflowEvent[];
  nextStep?: string;
}

/**
 * Component Implementation
 */
export interface ComponentImplementation {
  execute: (context: ComponentExecutionContext) => Promise<ComponentExecutionResult>;
}

/**
 * Workflow Execution Options
 */
export interface WorkflowExecutionOptions {
  tenantId: string;
  userId: string;
  sessionId?: string;
  correlationId?: string;
  parentWorkflowId?: string;
  initialContext?: Record<string, any>;
  memoryContextId?: string;
}

/**
 * Workflow Event Handler
 */
export type WorkflowEventHandler = (event: WorkflowEvent) => Promise<void>;

/**
 * Workflow Event Filter
 */
export interface EventFilter {
  eventType?: WorkflowEventTypeValue;
  eventDefinitionId?: string;
  sourceType?: string;
  sourceId?: string;
  targetType?: string;
  targetId?: string;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
}

/**
 * Workflow Monitoring Metrics
 */
export interface WorkflowMetrics {
  workflowId: string;
  templateId: string;
  totalDuration?: number;
  stepMetrics: Record<string, {
    duration: number;
    status: StepStatusValue;
    startTime: string;
    endTime?: string;
    retries: number;
  }>;
  branchingDecisions: Array<{
    sourceStep: string;
    targetStep: string;
    condition: string;
    decisionFactors: any;
  }>;
  eventsEmitted: number;
  eventsReceived: number;
  memoryOperations: {
    reads: number;
    writes: number;
  };
}

/**
 * LLM Event Detection Result
 */
export interface LLMEventDetectionResult {
  detectedEvents: Array<{
    eventType: WorkflowEventTypeValue;
    confidence: number;
    data?: any;
    reasoning?: string;
  }>;
  suggestedActions?: Array<{
    actionType: string;
    description: string;
    priority: number;
  }>;
}

/**
 * Workflow Analytics Query Options
 */
export interface WorkflowAnalyticsOptions {
  templateId?: string;
  startDate?: string;
  endDate?: string;
  status?: WorkflowStatusValue;
  userId?: string;
  limit?: number;
  offset?: number;
}
