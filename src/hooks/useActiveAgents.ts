/**
 * Custom hook for fetching active agents data
 * Uses SWR for real-time updates and caching
 */

import useSWR from 'swr';

export interface ActiveAgent {
  id: string;
  name: string;
  type: string;
  status: 'spawning' | 'active' | 'completed';
  confidence: number;
  spawnedAt: string;
  triggerId: string;
  signalId: string | null;
  capabilities: string[];
  metadata: Record<string, any>;
}

export interface ActiveAgentsResponse {
  count: number;
  agents: ActiveAgent[];
}

export interface SignalAgentsResponse {
  signalId: string;
  count: number;
  agents: ActiveAgent[];
}

export interface AgentStatsResponse {
  totalActiveAgents: number;
  totalAgentTemplates: number;
  averageConfidence: number;
  agentsBySignal: Record<string, number>;
  agentsByType: Record<string, number>;
}

// Backend calls disabled - provide a no-op fetcher and prefer static fallbacks
const fetcher = async (_url: string) => {
  console.warn('[useActiveAgents] Backend disabled, returning empty data');
  return {};
};

/**
 * Hook to fetch all active agents
 */
export function useActiveAgents(_refreshInterval: number = 5000) {
  // Do not request backend; always return static empty state
  return {
    agents: [] as ActiveAgent[],
    count: 0,
    isLoading: false,
    isError: null as any,
    mutate: async () => {}
  };
}

/**
 * Hook to fetch active agents for a specific signal
 */
export function useSignalAgents(signalId: string | null, _refreshInterval: number = 5000) {
  // Do not request backend; always return static empty state
  return {
    agents: [] as ActiveAgent[],
    count: 0,
    isLoading: false,
    isError: null as any,
    mutate: async () => {}
  };
}

/**
 * Hook to fetch detailed information about a specific agent
 */
export function useAgentDetails(_agentId: string | null) {
  return {
    agent: undefined as unknown as ActiveAgent,
    isLoading: false,
    isError: null as any,
    mutate: async () => {}
  };
}

/**
 * Hook to fetch agent statistics
 */
export function useAgentStats(_refreshInterval: number = 10000) {
  const data: AgentStatsResponse = {
    totalActiveAgents: 0,
    totalAgentTemplates: 0,
    averageConfidence: 0,
    agentsBySignal: {},
    agentsByType: {}
  };
  return {
    stats: data,
    isLoading: false,
    isError: null as any,
    mutate: async () => {}
  };
}

/**
 * Function to terminate an agent
 */
export async function terminateAgent(agentId: string, reason?: string): Promise<boolean> {
  console.warn('[terminateAgent] Backend disabled; simulating termination', { agentId, reason });
  return true;
}
