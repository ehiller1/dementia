// Event type definitions for Forecasts & Plans pipeline
// Minimal, dependency-free TypeScript interfaces to avoid adding runtime deps.

export type Granularity = 'week' | 'month' | 'quarter';
export type ScopeLevel = 'global' | 'region' | 'channel' | 'sku';

export interface Horizon {
  start: string; // ISO date
  end: string;   // ISO date
  granularity: Granularity;
}

export interface ScopeRef {
  level: ScopeLevel;
  ids: string[]; // e.g., ['GLOBAL'] or ['US-EAST'] or ['DTC'] or ['a12fd']
}

export interface Provenance {
  source?: string; // e.g., 'ml_forecaster_v2'
  inputs_hash?: string;
  retrieved_docs?: Array<{ id: string; title?: string; score?: number }>;
  confidence?: number; // 0..1
}

// 1) ForecastPublished
export interface ForecastValue {
  period: string;  // e.g., '2025-W36'
  value: number;
  confidence?: number; // 0..1
}

export interface ForecastPublished {
  event_type: 'ForecastPublished';
  id: string;
  timestamp: string; // ISO datetime
  horizon: Horizon;
  scope: ScopeRef;
  metric: 'demand_units' | 'revenue';
  values: ForecastValue[];
  assumptions?: string[];
  version: number;
  provenance?: Provenance;
}

// 2) ForecastDeltaDetected
export interface RelativeDelta { type: 'relative'; value: number; level: ScopeLevel; }
export interface AbsoluteDelta { type: 'absolute'; value: number; level: ScopeLevel; }
export type DeltaValue = RelativeDelta | AbsoluteDelta;

export interface AffectedEntityDelta {
  type: 'SKU' | 'Region' | 'Channel';
  id: string;
  delta: RelativeDelta | AbsoluteDelta;
}

export interface ForecastDeltaDetected {
  event_type: 'ForecastDeltaDetected';
  base_id: string;
  new_id: string;
  delta: DeltaValue;
  affected_entities?: AffectedEntityDelta[];
  explanation?: string;
  timestamp: string; // ISO datetime
  provenance?: Provenance;
}

// 3) PlanDeclared
export type PlanLevel = 'strategic' | 'operational' | 'execution';

export interface PlanTimeframe { start: string; end: string; }

export interface StructuredPlanContent {
  goals?: Array<{ name: string; kpi: string; target: number }>;
  constraints?: Array<{ name: string; value: number | string }>;
  policies?: Array<Record<string, any>>;
  actions?: Array<Record<string, any>>;
}

export interface PlanDeclared {
  event_type: 'PlanDeclared';
  plan_id: string;
  level: PlanLevel;
  timeframe: PlanTimeframe;
  content_raw?: string; // text or URI
  content_structured?: StructuredPlanContent;
  coverage?: { structured_pct: number; notes?: string };
  version: number;
  timestamp: string; // ISO datetime
  provenance?: Provenance;
}

// 4) ImplicationsDerived
export interface ImplicationSummary {
  function: 'Finance' | 'Sales' | 'Marketing' | 'Inventory' | 'Operations' | 'Supply' | 'Customer';
  implication: string;
  confidence?: number; // 0..1
}

export interface ImplicationsDerived {
  event_type: 'ImplicationsDerived';
  source_event: string; // id or ref to ForecastDeltaDetected
  summaries: ImplicationSummary[];
  assumptions?: string[];
  timestamp: string; // ISO datetime
  provenance?: Provenance;
}

// 5) RecommendedActions
export interface ActionDescriptor {
  function: 'Finance' | 'Sales' | 'Marketing' | 'Inventory' | 'Operations' | 'Supply';
  type: string; // e.g., 'adjust_po', 'reset_quota', 'realloc_budget'
  params: Record<string, any>;
}

export interface RecommendedActions {
  event_type: 'RecommendedActions';
  playbook: string; // which playbook triggered
  source_event: string; // ref id
  actions: ActionDescriptor[];
  rationale?: string;
  timestamp: string; // ISO datetime
  provenance?: Provenance;
  action_idempotency_key?: string;
}

// 6) PlanVarianceDetected
export interface Variance {
  kpi: string; // e.g., 'fill_rate'
  target: number;
  projected?: number;
  actual?: number;
}

export interface AttributionFactor { factor: string; pct?: number }

export interface PlanVarianceDetected {
  event_type: 'PlanVarianceDetected';
  plan_id: string;
  variance: {
    kpi: string;
    target: number;
    projected?: number;
    actual?: number;
  };
  attribution?: Array<{
    factor: string;
    pct?: number;
  }>;
  proposed_response_level?: 'strategic' | 'operational' | 'execution';
  timestamp: string;
  provenance?: Provenance;
}

export interface SimulatedOutcome {
  event_type: 'SimulatedOutcome';
  source_actions: string; // ID of RecommendedActions
  scenario_id: string;
  kpis: Array<{
    name: string;
    projected_value: number;
    baseline_value?: number;
    confidence_interval?: {
      lower: number;
      upper: number;
      confidence_level: number;
    };
  }>;
  risk_bands?: Array<{
    risk_type: string;
    probability: number;
    impact: 'low' | 'medium' | 'high';
  }>;
  timestamp: string;
  provenance?: Provenance;
}

export interface PolicyViolationRisk {
  event_type: 'PolicyViolationRisk';
  policy_name: string;
  violation_type: 'constraint' | 'threshold' | 'approval' | 'compliance';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  affected_entities?: Array<{
    type: string;
    id: string;
    impact: string;
  }>;
  mitigation_required?: boolean;
  timestamp: string;
  provenance?: Provenance;
}

export interface ReplanRequested {
  event_type: 'ReplanRequested';
  plan_level: 'strategic' | 'operational' | 'execution';
  trigger_reason: string;
  source_variance?: string; // ID of PlanVarianceDetected
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  stakeholders?: string[];
  timestamp: string;
  provenance?: Provenance;
}

export interface ActionCommitted {
  event_type: 'ActionCommitted';
  action_id: string;
  system_target: string; // ERP, CRM, Ad Platform, etc.
  status: 'pending' | 'committed' | 'failed' | 'rolled_back';
  execution_details?: {
    api_endpoint: string;
    request_id: string;
    response_code: number;
    execution_time_ms: number;
  };
  rollback_info?: {
    rollback_id: string;
    rollback_reason: string;
  };
  timestamp: string;
  provenance?: Provenance;
}

export interface ApprovalRequested {
  event_type: 'ApprovalRequested';
  approval_id: string;
  required_roles: string[];
  subject: string;
  description?: string;
  source_recommendations?: string; // ID of RecommendedActions
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  approval_context?: {
    business_impact: string;
    risk_assessment: string;
    alternatives: string[];
  };
  timestamp: string;
  provenance?: Provenance;
}

export interface ApprovalGranted {
  event_type: 'ApprovalGranted';
  approval_id: string;
  approver_role: string;
  approver_id?: string;
  conditions?: string[];
  notes?: string;
  timestamp: string;
  provenance?: Provenance;
}

export interface ApprovalRejected {
  event_type: 'ApprovalRejected';
  approval_id: string;
  rejector_role: string;
  rejector_id?: string;
  reason: string;
  alternative_suggestions?: string[];
  timestamp: string;
  provenance?: Provenance;
}

export type AnyConfiguredEvent =
  | ForecastPublished
  | ForecastDeltaDetected
  | PlanDeclared
  | ImplicationsDerived
  | RecommendedActions
  | PlanVarianceDetected
  | SimulatedOutcome
  | PolicyViolationRisk
  | ReplanRequested
  | ActionCommitted
  | ApprovalRequested
  | ApprovalGranted
  | ApprovalRejected;
