/**
 * Decision Commands Hook
 * Provides domain commands for decision management (no persistence logic)
 * Follows command pattern - hooks fire commands, services handle persistence
 */

import { useState } from 'react';

interface DecisionCommand {
  title: string;
  rationale: string;
  decision_type?: 'approval' | 'execution' | 'simulation' | 'recommendation';
  priority?: 'low' | 'medium' | 'high';
  risk?: 'low' | 'medium' | 'high';
  confidence?: number;
  required_data?: string[];
  agent_capabilities?: string[];
  context?: Record<string, any>;
  approval_policy?: {
    min_approvers?: number;
    roles_required?: string[];
    expires_at?: string;
  };
}

interface UseDecisionCommandsReturn {
  submitDecision: (command: DecisionCommand) => Promise<{ decision_id: string; is_new: boolean }>;
  submitDecisionBatch: (commands: DecisionCommand[]) => Promise<Array<{ decision_id: string; is_new: boolean }>>;
  acceptDecision: (decisionId: string, reason?: string, expectedVersion?: number) => Promise<void>;
  dismissDecision: (decisionId: string, reason?: string, expectedVersion?: number) => Promise<void>;
  simulateDecision: (decisionId: string, simulationId: string, artifact: any) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export function useDecisionCommands(): UseDecisionCommandsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit a single decision (from reflection, template, etc.)
   */
  const submitDecision = async (command: DecisionCommand): Promise<{ decision_id: string; is_new: boolean }> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/decisions/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(command)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit decision');
      }

      const result = await response.json();
      return {
        decision_id: result.decision_id,
        is_new: result.is_new
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit decision';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Submit multiple decisions (batch)
   */
  const submitDecisionBatch = async (commands: DecisionCommand[]): Promise<Array<{ decision_id: string; is_new: boolean }>> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/decisions/intake/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decisions: commands })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit decisions');
      }

      const result = await response.json();
      return result.results;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit decisions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Accept a decision (transitions to approved)
   */
  const acceptDecision = async (decisionId: string, reason?: string, expectedVersion?: number): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${decisionId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to_status: 'approved',
          reason,
          expected_version: expectedVersion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error('Version conflict - decision was modified by another user');
        }
        throw new Error(errorData.message || 'Failed to accept decision');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to accept decision';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Dismiss a decision
   */
  const dismissDecision = async (decisionId: string, reason?: string, expectedVersion?: number): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${decisionId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to_status: 'dismissed',
          reason,
          expected_version: expectedVersion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error('Version conflict - decision was modified by another user');
        }
        throw new Error(errorData.message || 'Failed to dismiss decision');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to dismiss decision';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Link simulation artifact to decision
   */
  const simulateDecision = async (decisionId: string, simulationId: string, artifact: any): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${decisionId}/simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          simulation_id: simulationId,
          artifact
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to link simulation');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to link simulation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitDecision,
    submitDecisionBatch,
    acceptDecision,
    dismissDecision,
    simulateDecision,
    isSubmitting,
    error
  };
}
