/**
 * useAgentEvents Hook
 * EventBus removed - returns empty events array
 */

import { useState } from 'react';

export interface AgentEvent {
  id: string;
  agentName: string;
  status: 'running' | 'completed' | 'error';
  action: string;
  timestamp: Date;
  recordsAffected?: number;
  currentStep?: string;
  totalSteps?: number;
  canUndo?: boolean;
  errorMessage?: string;
  // Additional properties for extended functionality
  message?: string;
  progress?: number;
  type?: string;
  description?: string;
  agent?: any;
  agentId?: string;
  agent_id?: string;
  source?: string;
  time?: string;
  state?: string;
}

export function useAgentEvents() {
  // EventBus removed - return empty events
  const [events] = useState<AgentEvent[]>([]);

  return { events };
}
