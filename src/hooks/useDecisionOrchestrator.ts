/**
 * useDecisionOrchestrator Hook
 * 
 * React hook for interacting with Decision Orchestrator API
 */

import { useState, useEffect, useCallback } from 'react';
import { DecisionLedgerEntry } from '@/services/decision-ledger/types';

interface UseDecisionOrchestratorOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export function useDecisionOrchestrator(options: UseDecisionOrchestratorOptions = {}) {
  const { autoRefresh = true, refreshInterval = 5000 } = options;

  const [decisions, setDecisions] = useState<DecisionLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending decisions
  const fetchPendingDecisions = useCallback(async () => {
    try {
      const response = await fetch('/api/decisions/pending?limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch decisions');
      }

      const data = await response.json();
      setDecisions(data);
      setError(null);
    } catch (err: any) {
      console.error('[useDecisionOrchestrator] Fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve decision
  const approveDecision = useCallback(async (
    decisionId: string,
    chosenOptionId: string,
    rationale: string,
    approverName: string = 'Current User'
  ) => {
    try {
      const response = await fetch(`/api/decisions/${decisionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chosenOptionId,
          approver: {
            userId: 'current-user',
            name: approverName,
            role: 'user'
          },
          rationale
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve decision');
      }

      // Refresh decisions list
      await fetchPendingDecisions();
      
      return true;
    } catch (err: any) {
      console.error('[useDecisionOrchestrator] Approve failed:', err);
      throw err;
    }
  }, [fetchPendingDecisions]);

  // Get decision details
  const getDecision = useCallback(async (decisionId: string): Promise<DecisionLedgerEntry | null> => {
    try {
      const response = await fetch(`/api/decisions/${decisionId}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('[useDecisionOrchestrator] Get decision failed:', err);
      return null;
    }
  }, []);

  // Get decision summary
  const getDecisionSummary = useCallback(async (decisionId: string) => {
    try {
      const response = await fetch(`/api/decisions/${decisionId}/summary`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('[useDecisionOrchestrator] Get summary failed:', err);
      return null;
    }
  }, []);

  // Add outcome measurement
  const addOutcome = useCallback(async (
    decisionId: string,
    actual: any,
    attributionNotes?: string
  ) => {
    try {
      const response = await fetch(`/api/decisions/${decisionId}/outcomes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          measuredAt: new Date().toISOString(),
          actual,
          attributionNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add outcome');
      }

      return true;
    } catch (err: any) {
      console.error('[useDecisionOrchestrator] Add outcome failed:', err);
      throw err;
    }
  }, []);

  // Get performance metrics
  const getPerformance = useCallback(async (filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate);
      if (filters?.toDate) params.append('toDate', filters.toDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/decisions/performance?${params}`);
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('[useDecisionOrchestrator] Get performance failed:', err);
      return [];
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPendingDecisions();
  }, [fetchPendingDecisions]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPendingDecisions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPendingDecisions]);

  return {
    decisions,
    loading,
    error,
    refresh: fetchPendingDecisions,
    approveDecision,
    getDecision,
    getDecisionSummary,
    addOutcome,
    getPerformance
  };
}
