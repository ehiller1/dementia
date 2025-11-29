/**
 * PolicyEngine - JavaScript version
 * Loads playbooks and applies guards/bounds to LLM-produced actions
 * Dependency-free implementation with simple parameter bounding and approval checks
 */

export class PolicyEngine {
  constructor() {
    this.playbooks = new Map();
  }

  /**
   * Register a playbook specification
   */
  registerPlaybook(spec) {
    if (!spec || !spec.playbook) {
      throw new Error('Invalid playbook spec: playbook name is required');
    }
    this.playbooks.set(spec.playbook, spec);
    console.log(`✅ [PolicyEngine] Registered playbook: ${spec.playbook}`);
  }

  /**
   * Get a playbook by name
   */
  getPlaybook(name) {
    return this.playbooks.get(name);
  }

  /**
   * Get all registered playbooks
   */
  getAllPlaybooks() {
    return Array.from(this.playbooks.values());
  }

  /**
   * Evaluate recommended actions against playbook policies
   * Applies parameter bounds and determines approval requirements
   */
  evaluate(recommendations) {
    if (!recommendations || !recommendations.playbook) {
      console.warn('⚠️ [PolicyEngine] No playbook specified in recommendations');
      return {
        approved: false,
        required_roles: [],
        bounded_actions: recommendations?.actions || []
      };
    }

    const spec = this.playbooks.get(recommendations.playbook);
    if (!spec) {
      console.warn(`⚠️ [PolicyEngine] Playbook not found: ${recommendations.playbook}`);
      return {
        approved: false,
        required_roles: [],
        bounded_actions: recommendations.actions || []
      };
    }

    const params = spec.parameters || {};
    const required_roles = spec.guards?.approvals?.required_roles || [];

    // Apply parameter bounds based on playbook constraints
    const bounded_actions = (recommendations.actions || []).map(action => {
      const bounded = { ...action, params: { ...(action.params || {}) } };

      // Bound purchase order adjustments
      if (action.type === 'adjust_po') {
        const max = Number(params.max_adjust_po_reduction_pct || 0.05);
        const v = Number(action.params?.reduction_pct || 0);
        const clamped = Math.max(0, Math.min(Math.abs(v), Math.abs(max)));
        bounded.params.reduction_pct = clamped;
        
        if (clamped !== Math.abs(v)) {
          console.log(`🔒 [PolicyEngine] Bounded reduction_pct from ${v} to ${clamped} (max: ${max})`);
        }
      }

      // Bound budget reallocations
      if (action.type === 'realloc_budget') {
        const max = Number(params.max_budget_realloc_pct || 0.1);
        const v = Number(action.params?.amount_pct || 0);
        const clamped = Math.max(0, Math.min(Math.abs(v), Math.abs(max)));
        bounded.params.amount_pct = clamped;
        
        if (clamped !== Math.abs(v)) {
          console.log(`🔒 [PolicyEngine] Bounded amount_pct from ${v} to ${clamped} (max: ${max})`);
        }
      }

      // Bound quota adjustments
      if (action.type === 'reset_quota') {
        const max = Number(params.quota_adjustment_cap || 0.08);
        const v = Number(action.params?.adjustment_pct || 0);
        const clamped = Math.max(0, Math.min(Math.abs(v), Math.abs(max)));
        bounded.params.adjustment_pct = clamped;
        
        if (clamped !== Math.abs(v)) {
          console.log(`🔒 [PolicyEngine] Bounded adjustment_pct from ${v} to ${clamped} (max: ${max})`);
        }
      }

      return bounded;
    });

    const approved = required_roles.length === 0;
    
    console.log(`📋 [PolicyEngine] Evaluated ${bounded_actions.length} actions from playbook: ${recommendations.playbook}`);
    console.log(`   Approval ${approved ? 'not ' : ''}required${required_roles.length > 0 ? ` from: ${required_roles.join(', ')}` : ''}`);

    return {
      approved,
      required_roles,
      bounded_actions
    };
  }

  /**
   * Check if a specific action requires approval
   */
  requiresApproval(playbookName, action) {
    const spec = this.playbooks.get(playbookName);
    if (!spec) return false;
    
    const required_roles = spec.guards?.approvals?.required_roles || [];
    return required_roles.length > 0;
  }

  /**
   * Get statistics about registered playbooks
   */
  getStats() {
    return {
      totalPlaybooks: this.playbooks.size,
      playbooks: Array.from(this.playbooks.keys()),
      playbooksWithApprovals: Array.from(this.playbooks.values())
        .filter(spec => spec.guards?.approvals?.required_roles?.length > 0)
        .map(spec => spec.playbook)
    };
  }
}
