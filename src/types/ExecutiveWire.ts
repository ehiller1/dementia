/**
 * ExecutiveWire - Canonical DTO for Formatter Output
 * 
 * This is the contract between the formatter and UI.
 * All formatter output MUST conform to this schema.
 */

export interface Action {
  action: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'done';
  deadline?: string;
  owner?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  blockers?: string[];
}

export interface AgentResult {
  agentId: string;
  agentName?: string;
  success: boolean;
  confidence: number;
  cost?: number;
  latency?: number;
  resultSummary?: string;
  errors?: string[];
}

export interface TimelineEvent {
  label: string;
  date?: string;
  status?: 'completed' | 'in_progress' | 'upcoming' | 'blocked';
  milestone?: boolean;
}

export interface LiveMetadata {
  phase: string;
  tick: number;
  updatedAt: string;
  conversationId?: string;
  requestId?: string;
}

/**
 * Main canonical DTO
 */
export interface ExecutiveWire {
  // Role detection (drives UI layout)
  roleDetection: 'Operator' | 'Builder' | 'Strategist' | 'Executive';
  
  // One-line context
  templateSnapline: string;
  
  // Six-message block components
  executiveSummary: string[];          // Message 1
  whatImSeeing: string[];              // Message 2
  recommendation: string[];            // Message 3
  nextActions: Action[];               // Message 4
  crossFunctionalImpact: Record<string, string>;  // Message 5
  agentMarketplaceResults: AgentResult[];  // Message 6 (provenance)
  
  // Timeline/roadmap
  timeline: TimelineEvent[];
  
  // Live orchestration metadata
  _live: LiveMetadata;
  
  // Optional extended data
  metrics?: Record<string, number>;
  alerts?: string[];
  risks?: string[];
  opportunities?: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: ExecutiveWire;
}

/**
 * Formatter retry context
 */
export interface FormatterRetryContext {
  attempt: number;
  previousOutput: string;
  validationErrors: string[];
  originalContext: any;
}
