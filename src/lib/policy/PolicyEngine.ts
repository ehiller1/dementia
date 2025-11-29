// PolicyEngine: loads playbooks and applies guards/bounds to LLM-produced actions.
// Dependency-free implementation with simple parameter bounding and approval checks.

import { RecommendedActions, ActionDescriptor } from '../events/types';

export type Role = 'FinanceController' | 'VP_Supply' | 'CategoryManager' | string;

export interface ApprovalRequirement {
  required_roles: Role[];
}

export interface PlaybookSpec {
  playbook: string;
  triggers?: any[];
  guards?: { approvals?: ApprovalRequirement };
  parameters?: Record<string, any>;
  actions?: Array<{ function: string; type: string; params?: Record<string, any> }>;
}

export interface PolicyEvaluationResult {
  approved: boolean; // if true, can auto-commit; otherwise requires approvals
  required_roles: Role[];
  bounded_actions: ActionDescriptor[]; // params bounded/adjusted
}

// In lieu of a YAML parser, we embed a very light loader that expects JSON-like
// objects at build time or accepts pre-parsed playbooks injected by caller.
// In the real system, these will be parsed from YAML files.
export class PolicyEngine {
  private playbooks: Map<string, PlaybookSpec> = new Map();

  registerPlaybook(spec: PlaybookSpec) {
    this.playbooks.set(spec.playbook, spec);
  }

  getPlaybook(name: string): PlaybookSpec | undefined {
    return this.playbooks.get(name);
  }

  // Bound parameters and determine approvals. This is intentionally conservative.
  evaluate(reco: RecommendedActions): PolicyEvaluationResult {
    const spec = this.playbooks.get(reco.playbook);
    const params = spec?.parameters || {};
    const required_roles = spec?.guards?.approvals?.required_roles ?? [];

    // Apply simple bounds based on known parameter keys from playbook
    const bounded_actions: ActionDescriptor[] = reco.actions.map(a => {
      const bounded: ActionDescriptor = { ...a, params: { ...(a.params || {}) } };
      if (a.type === 'adjust_po') {
        const max = Number(params.max_adjust_po_reduction_pct ?? 0.05);
        const v = Number((a.params || {}).reduction_pct ?? 0);
        const clamped = Math.max(0, Math.min(Math.abs(v), Math.abs(max)));
        (bounded.params as any).reduction_pct = clamped;
      }
      if (a.type === 'realloc_budget') {
        const max = Number(params.max_budget_realloc_pct ?? 0.1);
        const v = Number((a.params || {}).amount_pct ?? 0);
        const clamped = Math.max(0, Math.min(Math.abs(v), Math.abs(max)));
        (bounded.params as any).amount_pct = clamped;
      }
      return bounded;
    });

    return {
      approved: required_roles.length === 0,
      required_roles,
      bounded_actions,
    };
  }
}
