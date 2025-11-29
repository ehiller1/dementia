// JSON Schemas for Forecasts & Plans pipeline events
// Kept dependency-free: export plain JSON Schema objects that can be used
// by any validator (Ajv/Zod adapters can be added later). These are minimal
// and can be extended as the system evolves.

export const ISO_DATE = {
  type: 'string',
  pattern:
    '^(?:\\d{4}-\\d{2}-\\d{2})(?:T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z?)?$',
};

export const HorizonSchema = {
  type: 'object',
  required: ['start', 'end', 'granularity'],
  properties: {
    start: ISO_DATE,
    end: ISO_DATE,
    granularity: { enum: ['week', 'month', 'quarter'] },
  },
};

export const ScopeSchema = {
  type: 'object',
  required: ['level', 'ids'],
  properties: {
    level: { enum: ['global', 'region', 'channel', 'sku'] },
    ids: { type: 'array', items: { type: 'string' }, minItems: 1 },
  },
};

export const ProvenanceSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    source: { type: 'string' },
    inputs_hash: { type: 'string' },
    retrieved_docs: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, title: { type: 'string' }, score: { type: 'number' } },
        required: ['id'],
      },
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
};

export const ForecastValueSchema = {
  type: 'object',
  required: ['period', 'value'],
  properties: {
    period: { type: 'string' },
    value: { type: 'number' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
};

export const ForecastPublishedSchema = {
  $id: 'ForecastPublished',
  type: 'object',
  required: ['event_type', 'id', 'timestamp', 'horizon', 'scope', 'metric', 'values', 'version'],
  properties: {
    event_type: { const: 'ForecastPublished' },
    id: { type: 'string' },
    timestamp: ISO_DATE,
    horizon: HorizonSchema,
    scope: ScopeSchema,
    metric: { enum: ['demand_units', 'revenue'] },
    values: { type: 'array', items: ForecastValueSchema, minItems: 1 },
    assumptions: { type: 'array', items: { type: 'string' } },
    version: { type: 'integer', minimum: 0 },
    provenance: ProvenanceSchema,
  },
};

export const DeltaSchema = {
  oneOf: [
    {
      type: 'object',
      required: ['type', 'value', 'level'],
      properties: {
        type: { const: 'relative' },
        value: { type: 'number' }, // -0.03 => -3%
        level: { enum: ['global', 'region', 'channel', 'sku'] },
      },
    },
    {
      type: 'object',
      required: ['type', 'value', 'level'],
      properties: {
        type: { const: 'absolute' },
        value: { type: 'number' },
        level: { enum: ['global', 'region', 'channel', 'sku'] },
      },
    },
  ],
};

export const AffectedEntityDeltaSchema = {
  type: 'object',
  required: ['type', 'id', 'delta'],
  properties: {
    type: { enum: ['SKU', 'Region', 'Channel'] },
    id: { type: 'string' },
    delta: DeltaSchema,
  },
};

export const ForecastDeltaDetectedSchema = {
  $id: 'ForecastDeltaDetected',
  type: 'object',
  required: ['event_type', 'base_id', 'new_id', 'delta', 'timestamp'],
  properties: {
    event_type: { const: 'ForecastDeltaDetected' },
    base_id: { type: 'string' },
    new_id: { type: 'string' },
    delta: DeltaSchema,
    affected_entities: { type: 'array', items: AffectedEntityDeltaSchema },
    explanation: { type: 'string' },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const PlanDeclaredSchema = {
  $id: 'PlanDeclared',
  type: 'object',
  required: ['event_type', 'plan_id', 'level', 'timeframe', 'version', 'timestamp'],
  properties: {
    event_type: { const: 'PlanDeclared' },
    plan_id: { type: 'string' },
    level: { enum: ['strategic', 'operational', 'execution'] },
    timeframe: {
      type: 'object',
      required: ['start', 'end'],
      properties: { start: ISO_DATE, end: ISO_DATE },
    },
    content_raw: { type: 'string' },
    content_structured: { type: 'object', additionalProperties: true },
    coverage: {
      type: 'object',
      properties: { structured_pct: { type: 'number', minimum: 0, maximum: 1 }, notes: { type: 'string' } },
    },
    version: { type: 'integer', minimum: 0 },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const ImplicationSummarySchema = {
  type: 'object',
  required: ['function', 'implication'],
  properties: {
    function: { enum: ['Finance', 'Sales', 'Marketing', 'Inventory', 'Operations', 'Supply', 'Customer'] },
    implication: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
};

export const ImplicationsDerivedSchema = {
  $id: 'ImplicationsDerived',
  type: 'object',
  required: ['event_type', 'source_event', 'summaries', 'timestamp'],
  properties: {
    event_type: { const: 'ImplicationsDerived' },
    source_event: { type: 'string' },
    summaries: { type: 'array', items: ImplicationSummarySchema, minItems: 1 },
    assumptions: { type: 'array', items: { type: 'string' } },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const ActionDescriptorSchema = {
  type: 'object',
  required: ['function', 'type', 'params'],
  properties: {
    function: { enum: ['Finance', 'Sales', 'Marketing', 'Inventory', 'Operations', 'Supply'] },
    type: { type: 'string' },
    params: { type: 'object', additionalProperties: true },
  },
};

export const RecommendedActionsSchema = {
  $id: 'RecommendedActions',
  type: 'object',
  required: ['event_type', 'playbook', 'source_event', 'actions', 'timestamp'],
  properties: {
    event_type: { const: 'RecommendedActions' },
    playbook: { type: 'string' },
    source_event: { type: 'string' },
    actions: { type: 'array', items: ActionDescriptorSchema, minItems: 1 },
    rationale: { type: 'string' },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
    action_idempotency_key: { type: 'string' },
  },
};

export const PlanVarianceSchema = {
  type: 'object',
  required: ['kpi', 'target'],
  properties: {
    kpi: { type: 'string' },
    target: { type: 'number' },
    projected: { type: 'number' },
    actual: { type: 'number' },
  },
};

export const AttributionFactorSchema = {
  type: 'object',
  required: ['factor'],
  properties: { factor: { type: 'string' }, pct: { type: 'number' } },
};

export const PlanVarianceDetectedSchema = {
  $id: 'PlanVarianceDetected',
  type: 'object',
  required: ['event_type', 'plan_id', 'variance', 'timestamp'],
  properties: {
    event_type: { const: 'PlanVarianceDetected' },
    plan_id: { type: 'string' },
    variance: PlanVarianceSchema,
    attribution: { type: 'array', items: AttributionFactorSchema },
    proposed_response_level: { enum: ['strategic', 'operational', 'execution'] },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const SimulatedOutcomeSchema = {
  $id: 'SimulatedOutcome',
  type: 'object',
  required: ['event_type', 'source_actions', 'scenario_id', 'kpis', 'timestamp'],
  properties: {
    event_type: { const: 'SimulatedOutcome' },
    source_actions: { type: 'string' }, // ID of RecommendedActions
    scenario_id: { type: 'string' },
    kpis: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'projected_value'],
        properties: {
          name: { type: 'string' },
          projected_value: { type: 'number' },
          baseline_value: { type: 'number' },
          confidence_interval: {
            type: 'object',
            properties: {
              lower: { type: 'number' },
              upper: { type: 'number' },
              confidence_level: { type: 'number', minimum: 0, maximum: 1 },
            },
          },
        },
      },
    },
    risk_bands: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          risk_type: { type: 'string' },
          probability: { type: 'number', minimum: 0, maximum: 1 },
          impact: { enum: ['low', 'medium', 'high'] },
        },
      },
    },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const PolicyViolationRiskSchema = {
  $id: 'PolicyViolationRisk',
  type: 'object',
  required: ['event_type', 'policy_name', 'violation_type', 'risk_level', 'timestamp'],
  properties: {
    event_type: { const: 'PolicyViolationRisk' },
    policy_name: { type: 'string' },
    violation_type: { enum: ['constraint', 'threshold', 'approval', 'compliance'] },
    risk_level: { enum: ['low', 'medium', 'high', 'critical'] },
    affected_entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          id: { type: 'string' },
          impact: { type: 'string' },
        },
      },
    },
    mitigation_required: { type: 'boolean' },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const ReplanRequestedSchema = {
  $id: 'ReplanRequested',
  type: 'object',
  required: ['event_type', 'plan_level', 'trigger_reason', 'timestamp'],
  properties: {
    event_type: { const: 'ReplanRequested' },
    plan_level: { enum: ['strategic', 'operational', 'execution'] },
    trigger_reason: { type: 'string' },
    source_variance: { type: 'string' }, // ID of PlanVarianceDetected
    priority: { enum: ['low', 'medium', 'high', 'urgent'] },
    deadline: ISO_DATE,
    stakeholders: {
      type: 'array',
      items: { type: 'string' },
    },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const ActionCommittedSchema = {
  $id: 'ActionCommitted',
  type: 'object',
  required: ['event_type', 'action_id', 'system_target', 'status', 'timestamp'],
  properties: {
    event_type: { const: 'ActionCommitted' },
    action_id: { type: 'string' },
    system_target: { type: 'string' }, // ERP, CRM, Ad Platform, etc.
    status: { enum: ['pending', 'committed', 'failed', 'rolled_back'] },
    execution_details: {
      type: 'object',
      properties: {
        api_endpoint: { type: 'string' },
        request_id: { type: 'string' },
        response_code: { type: 'number' },
        execution_time_ms: { type: 'number' },
      },
    },
    rollback_info: {
      type: 'object',
      properties: {
        rollback_id: { type: 'string' },
        rollback_reason: { type: 'string' },
      },
    },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const ApprovalRequestedSchema = {
  $id: 'ApprovalRequested',
  type: 'object',
  required: ['event_type', 'approval_id', 'required_roles', 'subject', 'timestamp'],
  properties: {
    event_type: { const: 'ApprovalRequested' },
    approval_id: { type: 'string' },
    required_roles: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    subject: { type: 'string' },
    description: { type: 'string' },
    source_recommendations: { type: 'string' }, // ID of RecommendedActions
    urgency: { enum: ['low', 'medium', 'high', 'critical'] },
    deadline: ISO_DATE,
    approval_context: {
      type: 'object',
      properties: {
        business_impact: { type: 'string' },
        risk_assessment: { type: 'string' },
        alternatives: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const ApprovalGrantedSchema = {
  $id: 'ApprovalGranted',
  type: 'object',
  required: ['event_type', 'approval_id', 'approver_role', 'timestamp'],
  properties: {
    event_type: { const: 'ApprovalGranted' },
    approval_id: { type: 'string' },
    approver_role: { type: 'string' },
    approver_id: { type: 'string' },
    conditions: {
      type: 'array',
      items: { type: 'string' },
    },
    notes: { type: 'string' },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const ApprovalRejectedSchema = {
  $id: 'ApprovalRejected',
  type: 'object',
  required: ['event_type', 'approval_id', 'rejector_role', 'reason', 'timestamp'],
  properties: {
    event_type: { const: 'ApprovalRejected' },
    approval_id: { type: 'string' },
    rejector_role: { type: 'string' },
    rejector_id: { type: 'string' },
    reason: { type: 'string' },
    alternative_suggestions: {
      type: 'array',
      items: { type: 'string' },
    },
    timestamp: ISO_DATE,
    provenance: ProvenanceSchema,
  },
};

export const AllEventSchemas = [
  ForecastPublishedSchema,
  ForecastDeltaDetectedSchema,
  PlanDeclaredSchema,
  ImplicationsDerivedSchema,
  RecommendedActionsSchema,
  PlanVarianceDetectedSchema,
  SimulatedOutcomeSchema,
  PolicyViolationRiskSchema,
  ReplanRequestedSchema,
  ActionCommittedSchema,
  ApprovalRequestedSchema,
  ApprovalGrantedSchema,
  ApprovalRejectedSchema,
];
