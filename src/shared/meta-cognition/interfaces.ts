// Shared interfaces for Meta-Cognitive Overlay to prevent circular dependencies
// Keep this file dependency-free (no imports from app services)

export type MetaStage =
  | 'intent'
  | 'template_selection'
  | 'agent_orchestration'
  | 'memory_update'
  | 'output_synthesis';

export type Severity = 'low' | 'medium' | 'high';
export type RiskTier = 'low' | 'medium' | 'high';

export interface Evidence {
  inputs?: unknown;
  prompts?: unknown;
  agents?: unknown;
  outputs?: unknown;
  policies?: unknown;
  [k: string]: unknown;
}

export interface MetaThought {
  id: string;
  workflowInstanceId?: string;
  conversationId?: string;
  traceId?: string;
  stage: MetaStage;
  finding: string;
  evidence?: Evidence;
  severity: Severity;
  confidence: number; // 0..1
  recommendations?: string[];
  createdAt: string; // ISO
  createdBy: string; // meta-agent id
}

export type CorrectionType =
  | 'adjust_template_params'
  | 'swap_template'
  | 'reroute_agents'
  | 'inject_context'
  | 'add_disclaimer'
  | 'request_approval'
  | 'run_simulation';

export type CorrectionStatus = 'proposed' | 'approved' | 'applied' | 'rejected';

export interface CorrectionPatch {
  // free-form patch data. Prefer JSON Patch-like ops, but typed enough to carry deltas safely
  op?: 'add' | 'remove' | 'replace' | 'test' | 'move' | 'copy';
  path?: string;
  from?: string;
  value?: unknown;
  // typed hints for common ops
  templateId?: string;
  paramsDelta?: Record<string, unknown>;
  agentRoute?: { add?: string[]; remove?: string[] };
  contextInject?: Record<string, unknown>;
  disclaimer?: string;
  simulationSpec?: Record<string, unknown>;
}

export interface CorrectionAction {
  id: string;
  workflowInstanceId?: string;
  conversationId?: string;
  relatedMetaThoughtId: string;
  type: CorrectionType;
  patch: CorrectionPatch;
  riskTier: RiskTier;
  rationale: string;
  status: CorrectionStatus;
  createdAt: string;
  createdBy: string;
  appliedBy?: string;
  appliedAt?: string;
}

export interface DAGAnnotation {
  workflowInstanceId: string;
  dagNodeId?: string;
  annotationType: 'meta_warning' | 'meta_info' | 'correction_applied';
  content: string;
  severity?: Severity;
  linkIds?: { metaThoughtId?: string; correctionId?: string };
  createdAt: string;
}

export interface MetaCriticInput {
  stage: MetaStage;
  context: Record<string, unknown>;
}

export interface MetaCriticOutput {
  thoughts: MetaThought[];
}

export type MetaEventType =
  | 'meta.thought.created'
  | 'meta.alert.raised'
  | 'correction.created'
  | 'correction.approved'
  | 'correction.rejected'
  | 'correction.applied'
  | 'dag.annotated';

export interface MetaEvent<T = unknown> {
  id: string;
  type: MetaEventType;
  time: string; // ISO
  data: T;
  workflowInstanceId?: string;
  conversationId?: string;
  traceId?: string;
}
