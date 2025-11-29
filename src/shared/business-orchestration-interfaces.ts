/**
 * Business Orchestration Interfaces
 * 
 * Models the proper business relationships where Template Engine is the central orchestrator
 * with bidirectional relationships to Memory Integration for dynamic template generation.
 */

import {
  BusinessContext,
  MemoryContext,
  DynamicTemplate,
  WorkflowState,
  WorkflowEvent,
  WorkflowDecision,
  StorableMemory,
  ShortTermMemory,
  LongTermMemoryResult,
  MemoryQueryOptions
} from './interfaces';

// ============================================================================
// TEMPLATE STATE MANAGEMENT
// ============================================================================

export interface TemplateState {
  id: string;
  templateId: string;
  currentStep: string;
  stepData: Record<string, any>;
  declarativeFunctions: DeclarativeFunction[];
  proceduralFunctions: ProceduralFunction[];
  informationalFunctions: InformationalFunction[];
  executionHistory: FunctionExecution[];
  memoryContext: MemoryContext;
  lastUpdated: string;
}

export interface DeclarativeFunction {
  id: string;
  type: 'declarative';
  name: string;
  description: string;
  parameters: Record<string, any>;
  constraints: string[];
  delegatedAgent?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface ProceduralFunction {
  id: string;
  type: 'procedural';
  name: string;
  description: string;
  steps: ProcedureStep[];
  delegatedAgent?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface InformationalFunction {
  id: string;
  type: 'informational';
  name: string;
  description: string;
  queryContext: Record<string, any>;
  delegatedAgent?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface ProcedureStep {
  id: string;
  name: string;
  action: string;
  parameters: Record<string, any>;
  dependencies: string[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface FunctionExecution {
  functionId: string;
  functionType: 'declarative' | 'procedural' | 'informational';
  agentId: string;
  startTime: string;
  endTime?: string;
  result?: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// MEMORY-DRIVEN TEMPLATE GENERATION
// ============================================================================

export interface EnrichedMemoryContext extends MemoryContext {
  // Working Memory - Template State
  currentTemplateState?: TemplateState;
  sessionContext: Record<string, any>;
  
  // Short-term Memory - Task State
  recentTasks: TaskState[];
  conversationHistory: ConversationTurn[];
  
  // Long-term Memory - Experience & History
  relevantExperiences: Experience[];
  historicalPatterns: Pattern[];
  institutionalKnowledge: Knowledge[];
}

export interface TaskState {
  id: string;
  taskType: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
  context: Record<string, any>;
  startTime: string;
  endTime?: string;
  outcome?: any;
}

export interface ConversationTurn {
  id: string;
  userInput: string;
  systemResponse: string;
  templateId?: string;
  functionsExecuted: string[];
  timestamp: string;
}

export interface Experience {
  id: string;
  scenario: string;
  context: Record<string, any>;
  decisions: WorkflowDecision[];
  outcome: any;
  lessons: string[];
  relevanceScore: number;
}

export interface Pattern {
  id: string;
  patternType: string;
  description: string;
  conditions: Record<string, any>;
  frequency: number;
  confidence: number;
  lastSeen: string;
}

export interface Knowledge {
  id: string;
  domain: string;
  concept: string;
  description: string;
  relationships: KnowledgeRelationship[];
  confidence: number;
  source: string;
}

export interface KnowledgeRelationship {
  targetId: string;
  relationshipType: 'causes' | 'enables' | 'requires' | 'conflicts' | 'similar';
  strength: number;
}

// ============================================================================
// TEMPLATE ENGINE AS CENTRAL ORCHESTRATOR
// ============================================================================

export interface ITemplateOrchestrator {
  /**
   * Core orchestration: Process user input through memory-driven template generation
   */
  processUserInteraction(
    userInput: string,
    context: BusinessContext
  ): Promise<OrchestrationResult>;

  /**
   * Dynamic template generation based on memory context
   */
  generateDynamicTemplate(
    memoryContext: EnrichedMemoryContext,
    userIntent: string
  ): Promise<DynamicTemplate>;

  /**
   * Template state management in working memory
   */
  persistTemplateState(templateState: TemplateState): Promise<void>;
  retrieveTemplateState(templateId: string, context: BusinessContext): Promise<TemplateState | null>;
  updateTemplateState(templateId: string, updates: Partial<TemplateState>): Promise<TemplateState>;

  /**
   * Function delegation to agents
   */
  delegateFunction(
    func: DeclarativeFunction | ProceduralFunction | InformationalFunction,
    templateState: TemplateState
  ): Promise<FunctionExecution>;

  /**
   * Memory context retrieval for template generation
   */
  enrichWithMemoryContext(
    baseContext: BusinessContext,
    userInput: string
  ): Promise<EnrichedMemoryContext>;
}

export interface OrchestrationResult {
  templateState: TemplateState;
  responseType: 'message' | 'narrative' | 'action' | 'simulation';
  response: any;
  functionsExecuted: FunctionExecution[];
  memoryUpdates: MemoryUpdate[];
  nextPotentialFunctions: (DeclarativeFunction | ProceduralFunction | InformationalFunction)[];
}

export interface MemoryUpdate {
  type: 'working' | 'short_term' | 'long_term';
  content: string;
  metadata: Record<string, any>;
  context: MemoryContext;
}

// ============================================================================
// MEMORY INTEGRATION FOR TEMPLATE ORCHESTRATION
// ============================================================================

export interface IMemoryForTemplateOrchestration {
  /**
   * Working Memory - Template State Persistence
   */
  storeTemplateState(templateState: TemplateState): Promise<void>;
  retrieveTemplateState(templateId: string, context: BusinessContext): Promise<TemplateState | null>;
  updateTemplateState(templateId: string, updates: Partial<TemplateState>): Promise<TemplateState>;

  /**
   * Short-term Memory - Task State & Conversation History
   */
  storeTaskState(taskState: TaskState, context: MemoryContext): Promise<void>;
  retrieveRecentTasks(context: BusinessContext, limit?: number): Promise<TaskState[]>;
  storeConversationTurn(turn: ConversationTurn, context: MemoryContext): Promise<void>;
  retrieveConversationHistory(context: BusinessContext, limit?: number): Promise<ConversationTurn[]>;

  /**
   * Long-term Memory - Experience, Patterns, Knowledge
   */
  storeExperience(experience: Experience, context: MemoryContext): Promise<void>;
  retrieveRelevantExperiences(scenario: string, context: BusinessContext): Promise<Experience[]>;
  storePattern(pattern: Pattern, context: MemoryContext): Promise<void>;
  retrievePatterns(conditions: Record<string, any>, context: BusinessContext): Promise<Pattern[]>;
  storeKnowledge(knowledge: Knowledge, context: MemoryContext): Promise<void>;
  retrieveKnowledge(domain: string, context: BusinessContext): Promise<Knowledge[]>;

  /**
   * Memory Context Enrichment for Template Generation
   */
  buildMemoryContext(
    baseContext: BusinessContext,
    userInput: string
  ): Promise<EnrichedMemoryContext>;

  /**
   * Template operations (delegated to memory adapter)
   */
  createTemplate(template: DynamicTemplate, context: MemoryContext): Promise<DynamicTemplate>;
  getTemplate(id: string, context: MemoryContext): Promise<DynamicTemplate | null>;
  listTemplates(context: MemoryContext, limit?: number, offset?: number): Promise<DynamicTemplate[]>;
  searchSemanticTemplates(query: string, context: MemoryContext, options?: MemoryQueryOptions): Promise<DynamicTemplate[]>;
}

// ============================================================================
// AGENT DELEGATION INTERFACES
// ============================================================================

export interface IAgentDelegationService {
  /**
   * Execute functions delegated by Template Engine
   */
  executeDeclarativeFunction(
    func: DeclarativeFunction,
    templateState: TemplateState
  ): Promise<FunctionExecution>;

  executeProceduralFunction(
    func: ProceduralFunction,
    templateState: TemplateState
  ): Promise<FunctionExecution>;

  executeInformationalFunction(
    func: InformationalFunction,
    templateState: TemplateState
  ): Promise<FunctionExecution>;

  /**
   * Agent capability matching
   */
  selectAgentForFunction(
    func: DeclarativeFunction | ProceduralFunction | InformationalFunction
  ): Promise<string>;
}

// ============================================================================
// BIDIRECTIONAL RELATIONSHIP MANAGEMENT
// ============================================================================

export interface IBidirectionalOrchestration {
  /**
   * Initialize the bidirectional relationship between Template Engine and Memory
   */
  initialize(config: {
    templateOrchestrator: ITemplateOrchestrator;
    memoryService: IMemoryForTemplateOrchestration;
    agentDelegation: IAgentDelegationService;
  }): Promise<void>;

  /**
   * Process complete business interaction cycle
   */
  processBusinessInteraction(
    userInput: string,
    context: BusinessContext
  ): Promise<{
    orchestrationResult: OrchestrationResult;
    memoryUpdates: MemoryUpdate[];
    templateStatePersisted: boolean;
  }>;
}
