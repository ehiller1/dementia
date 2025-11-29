/**
 * Decision Stack API client
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://picked-narwhal-trusty.ngrok-free.app';

export interface DecisionStack {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'deprecated';
  version: string;
  lastModified: string;
  template: string;
  modules: {
    commonTerms: number;
    eventPatterns: number;
    tunedModels: number;
    entityMap: number;
    playsWorkflows: number;
    promptTemplates: number;
  };
}

export async function fetchDecisionStacks(): Promise<DecisionStack[]> {
  const response = await fetch(`${API_BASE}/api/decision-stacks`);
  if (!response.ok) {
    throw new Error('Failed to fetch decision stacks');
  }
  const data = await response.json();
  return data.stacks || [];
}

export async function fetchDecisionStack(stackId: string): Promise<DecisionStack> {
  const response = await fetch(`${API_BASE}/api/decision-stacks/${stackId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch decision stack');
  }
  return await response.json();
}

export async function createDecisionStack(stack: Omit<DecisionStack, 'id' | 'version' | 'lastModified'>): Promise<DecisionStack> {
  const response = await fetch(`${API_BASE}/api/decision-stacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stack)
  });
  if (!response.ok) {
    throw new Error('Failed to create decision stack');
  }
  return await response.json();
}

export async function updateDecisionStack(stackId: string, updates: Partial<DecisionStack>): Promise<DecisionStack> {
  const response = await fetch(`${API_BASE}/api/decision-stacks/${stackId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    throw new Error('Failed to update decision stack');
  }
  return await response.json();
}

export async function deleteDecisionStack(stackId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/decision-stacks/${stackId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete decision stack');
  }
}

export async function cloneDecisionStack(stackId: string): Promise<DecisionStack> {
  const response = await fetch(`${API_BASE}/api/decision-stacks/${stackId}/clone`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Failed to clone decision stack');
  }
  return await response.json();
}

