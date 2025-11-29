/**
 * Signals API client
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://picked-narwhal-trusty.ngrok-free.app';

export interface Signal {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error';
  filters?: Record<string, any>;
  activeAgents?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    confidence: number;
    spawnedAt: string;
  }>;
}

export interface SignalMetrics {
  totalEventsToday: number;
  activeAgents: number;
  enabledSignals: number;
  totalSignals: number;
}

export async function fetchSignals(): Promise<Signal[]> {
  const response = await fetch(`${API_BASE}/api/signals`);
  if (!response.ok) {
    throw new Error('Failed to fetch signals');
  }
  const data = await response.json();
  return data.signals || [];
}

export async function fetchSignalMetrics(): Promise<SignalMetrics> {
  const response = await fetch(`${API_BASE}/api/signals/metrics`);
  if (!response.ok) {
    throw new Error('Failed to fetch signal metrics');
  }
  return await response.json();
}

export async function enableSignal(signalId: string, filters?: Record<string, any>): Promise<Signal> {
  const response = await fetch(`${API_BASE}/api/signals/${signalId}/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters })
  });
  if (!response.ok) {
    throw new Error('Failed to enable signal');
  }
  const data = await response.json();
  return data;
}

export async function disableSignal(signalId: string): Promise<Signal> {
  const response = await fetch(`${API_BASE}/api/signals/${signalId}/disable`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Failed to disable signal');
  }
  const data = await response.json();
  return data;
}

export async function fetchAgents() {
  const response = await fetch(`${API_BASE}/api/signals/agents`);
  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }
  const data = await response.json();
  return data.agents || [];
}

