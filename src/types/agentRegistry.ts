/**
 * Agent Registry Types
 * 
 * This file contains type definitions for the agent registry system.
 * It defines the structure of agents, their capabilities, parameters,
 * and execution records in the registry.
 */

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema?: Record<string, any>; // JSON schema for inputs
  outputSchema?: Record<string, any>; // JSON schema for outputs
}

export interface AgentParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
  options?: any[]; // For enum-like parameters
  validation?: Record<string, any>; // JSON schema for validation
}

export interface AgentDefinition {
  id?: string; // UUID, optional when creating
  name: string;
  description: string;
  capabilities: AgentCapability[];
  parameters: AgentParameter[];
  useCases: string[];
  tags: string[];
  implementation: {
    type: 'builtin' | 'custom' | 'openai';
    entryPoint: string; // Hook name, function name, etc.
    config?: Record<string, any>;
  };
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface AgentExecutionRecord {
  id?: string; // UUID, optional when creating
  agent_id: string;
  conversation_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input_parameters: Record<string, any>;
  results?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  user_id?: string;
  error?: string;
}

export interface DiscoverAgentsRequest {
  query: string;
  tags?: string[];
  capability?: string;
  limit?: number;
}

export interface DiscoverAgentsResult {
  agents: AgentDefinition[];
  similarity: number; // Confidence score
}

export interface AgentActivationRequest {
  agent_id: string;
  conversation_id: string;
  parameters: Record<string, any>;
}

export interface AgentActivationResponse {
  execution_id: string;
  status: 'pending' | 'running';
  estimated_completion?: string; // ISO timestamp
}

export interface AgentExecutionStatusRequest {
  execution_id: string;
}

export interface AgentExecutionStatusResponse {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number; // 0-100
  results?: Record<string, any>;
  error?: string;
}
