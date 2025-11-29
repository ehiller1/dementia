/**
 * Types for the decision template system
 * 
 * These types define the structure of decision templates, their inputs/outputs,
 * and instances when templates are used to make decisions.
 */

/**
 * A template input field definition
 */
export interface TemplateInput {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  enum?: any[];
  format?: string;
  nested?: {
    [key: string]: TemplateInput;
  };
}

/**
 * A template output field definition
 */
export interface TemplateOutput {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

/**
 * A declarative prompt to gather information
 */
export interface DeclarativePrompt {
  prompt: string;
  description?: string;
}

/**
 * An agentic task to be executed by an algorithm
 */
export interface AgenticTask {
  task: string;
  description?: string;
  input_fields: string[];
  output: string;
}

/**
 * The full decision template definition
 */
/**
 * DecisionTemplateStep and WorkflowStep are now convertible via step-adapter.ts.
 * Keep these interfaces in sync for schema harmonization.
 */
export interface DecisionTemplateStep {
  id: string;
  type: 'conversation' | 'prompt' | 'agent' | 'action' | 'approval' | 'calculation';
  description?: string;
  content?: string; // for prompts/conversations
  agentic_task?: AgenticTask;
  declarative_prompt?: DeclarativePrompt;
  inputs?: string[];
  outputs?: string[];
  parameters?: Record<string, any>;
  order?: number;
}

export interface DecisionTemplate {
  id?: string;
  name: string;
  description: string;
  steps: DecisionTemplateStep[];
  inputs: TemplateInput[];
  outputs: TemplateOutput[];
  declarative_prompts: DeclarativePrompt[];
  agentic_tasks: AgenticTask[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  is_public?: boolean;
  tags?: string[];
}

/**
 * The stored format of a decision template in the database
 */
export interface StoredDecisionTemplate {
  id: string;
  name: string;
  description: string;
  template_schema: DecisionTemplate;
  inputs_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  outputs_schema: {
    type: 'object';
    properties: Record<string, any>;
  };
  declarative_prompts: DeclarativePrompt[];
  agentic_tasks: AgenticTask[];
  created_at: string;
  updated_at: string;
  created_by: string;
  is_public: boolean;
  tags: string[];
}

/**
 * The status of a decision instance
 */
export type DecisionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * A record of a decision instance execution
 */
export interface DecisionInstance {
  id: string;
  template_id: string;
  conversation_id: string;
  input_values: Record<string, any>;
  output_values?: Record<string, any>;
  declarative_results?: Record<string, string>;
  agentic_results?: Record<string, any>;
  status: DecisionStatus;
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  error?: string;
  created_by: string;
}

/**
 * Result of template matching against a user query
 */
export interface TemplateMatch {
  templateId: string;
  name: string;
  description: string;
  confidence: number;
}

/**
 * Extended intent type including decision templates
 */
export interface ExtendedIntent {
  type: 'informational' | 'action' | 'decision';
  action?: string;
  confidence: number;
  templateId?: string;
  templateName?: string;
}
