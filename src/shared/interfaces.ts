/**
 * Shared Business Domain Interfaces
 * 
 * Core interfaces shared across all business services.
 * This breaks circular dependencies by providing a single source of truth
 * for business domain models.
 */

// ============================================================================
// CORE BUSINESS ENTITIES
// ============================================================================

export interface BusinessContext {
  tenantId: string;
  userId: string;
  conversationId?: string;
  sessionId?: string;
}

export interface MemoryContext extends BusinessContext {
  workflowInstanceId?: string;
  templateId?: string;
}

// ============================================================================
// TEMPLATE SYSTEM INTERFACES
// ============================================================================

export interface DynamicTemplate {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  template_type: 'seasonality' | 'marketing' | 'inventory' | 'coordination' | 'general';
  metadata?: Record<string, any>;
  embedding?: number[];
  /**
   * Monitored events this template is interested in.
   * Used to auto-register event definitions and subscriptions on activation.
   */
  monitoredEvents?: MonitoredEvent[];
  created_at: string;
  updated_at: string;
  tenant_id?: string;
  user_id?: string;
}

export interface TemplateExecutionOptions {
  context: Record<string, any>;
  memoryContext?: MemoryContext;
  workflowState?: WorkflowState;
  businessAgents?: string[];
  /** Optional extra contextual data (roleContext, roleProfile, etc.) injected by callers */
  additionalContext?: Record<string, any>;
}

export interface TemplateExecutionResult {
  id: string;
  status: 'success' | 'error' | 'pending';
  result: any;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// WORKFLOW SYSTEM INTERFACES
// ============================================================================

export interface WorkflowState {
  id: string;
  template_id?: string;
  current_step: string;
  step_data: Record<string, any>;
  status: 'active' | 'completed' | 'paused' | 'error';
  created_at: string;
  updated_at: string;
  tenant_id: string;
  user_id: string;
}

export interface WorkflowEvent {
  id: string;
  workflow_instance_id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
  tenant_id: string;
  user_id: string;
}

export interface WorkflowDecision {
  id: string;
  workflow_instance_id: string;
  conversation_id: string;
  decision_type: 'action' | 'simulation' | 'information';
  decision_content: string;
  metadata: Record<string, any>;
  created_at: string;
  tenant_id: string;
  user_id: string;
}

// ============================================================================
// MEMORY SYSTEM INTERFACES
// ============================================================================

export interface StorableMemory {
  id?: string;
  content: string;
  memory_type: 'working' | 'short_term' | 'long_term';
  metadata: Record<string, any>;
  embedding?: number[];
  tenant_id: string;
  user_id: string;
  created_at?: string;
}

export interface ShortTermMemory {
  id: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  tenant_id: string;
  user_id: string;
}

export interface LongTermMemoryResult {
  id: string;
  content: string;
  type: string;
  relevance: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MemoryQueryOptions {
  limit?: number;
  threshold?: number;
  memoryTypes?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// BUSINESS AGENT INTERFACES
// ============================================================================

export interface BusinessAgentContext {
  workflowInstanceId: string;
  templateId?: string;
  userQuery: string;
  businessContext: BusinessContext;
  memoryContext: MemoryContext;
}

export interface BusinessAgentResult {
  agentType: 'marketing' | 'inventory' | 'memory' | 'coordination';
  recommendations: string[];
  analysis: Record<string, any>;
  decisions: WorkflowDecision[];
  nextSteps: string[];
}

// ============================================================================
// INTENT ROUTING INTERFACES
// ============================================================================

export enum IntentCategory {
  ACTION = 'ACTION',
  SIMULATION = 'SIMULATION', 
  INFORMATION = 'INFORMATION'
}

export interface IntentRoutingResult {
  intentCategory: IntentCategory;
  templateId: string;
  templateType: string;
  responseType: string;
  workflowState: WorkflowState;
  stepContext: any;
  metadata: Record<string, any>;
}

// ============================================================================
// SERVICE ADAPTER INTERFACES
// ============================================================================

export interface MemoryAdapter {
  // Template operations
  createTemplate(template: DynamicTemplate): Promise<DynamicTemplate>;
  getTemplate(id: string): Promise<DynamicTemplate | null>;
  listTemplates(context: MemoryContext, limit?: number, offset?: number): Promise<DynamicTemplate[]>;
  updateTemplate(id: string, updates: Partial<DynamicTemplate>): Promise<DynamicTemplate | null>;
  deleteTemplate(id: string): Promise<boolean>;
  
  // Memory operations
  storeMemory(memory: StorableMemory): Promise<void>;
  retrieveShortTermMemory(context: MemoryContext, limit?: number): Promise<ShortTermMemory[]>;
  searchLongTermMemory(query: string, context: MemoryContext, options?: MemoryQueryOptions): Promise<LongTermMemoryResult[]>;
  
  // Workflow operations
  storeWorkflowEvent(event: WorkflowEvent, context: MemoryContext): Promise<void>;
  storeWorkflowState(state: WorkflowState, context: MemoryContext): Promise<void>;
  storeWorkflowDecision(decision: WorkflowDecision, context: MemoryContext): Promise<void>;
}

export interface LanguageModelService {
  generateText(prompt: string, options?: any): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}

// ============================================================================
// TEMPLATE-EVENT MONITORING TYPES
// ============================================================================

/**
 * Function/role preferences and router constraints to bias LLM selection.
 */
export interface EventRouterConstraints {
  maxCostUSD?: number;
  provenance?: 'proprietary' | 'commercial' | 'opensource';
  region?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  sensitivity?: 'public' | 'internal' | 'restricted' | 'secret';
  preferredFunctions?: string[]; // e.g., ['finance','marketing']
}

/**
 * Definition of an event a template wants to monitor.
 */
export interface MonitoredEvent {
  name: string;
  eventType: string; // aligns with WorkflowEventTypeValue
  sources?: string[]; // e.g., ['weather','noaa','social_signals']
  filters?: Record<string, any>; // arbitrary filter criteria (region, severity, sku, etc.)
  llmAugmentationPrompt?: string; // if present, EventAugmentationService can expand/normalize
  routerConstraints?: EventRouterConstraints;
  handler?: string; // e.g., 'notify_guidance', 'run_simulation:tpl_123'
  metadata?: Record<string, any>;
}

// ============================================================================
// SERVICE OPTIONS INTERFACES
// ============================================================================

export interface DynamicTemplateEngineOptions {
  memoryIntegrationService?: any; // Will be properly typed after refactor
  languageModelService?: LanguageModelService;
  tenantId?: string;
  userId?: string;
}

export interface MemoryIntegrationServiceOptions {
  memoryAdapter?: MemoryAdapter;
  tenantId?: string;
  userId?: string;
}
