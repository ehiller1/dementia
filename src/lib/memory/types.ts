/**
 * Memory System Types
 * Defines the core types and enums for the hierarchical memory system
 */

export enum MemoryType {
  WORKING = 'working',
  SHORT_TERM = 'short_term', 
  LONG_TERM = 'long_term'
}

export enum MemorySourceType {
  PROMPT_ACTIVATION = 'prompt_activation',
  AGENT_ACTIVATION = 'agent_activation',
  TEMPLATE_EXECUTION = 'template_execution',
  USER_SESSION = 'user_session',
  USER_TOPIC = 'user_topic',
  USER_ACTIVITY = 'user_activity',
  AGENT_RESULT = 'agent_result',
  SYSTEM_LEARNING = 'system_learning',
  TEMPLATE_ADAPTATION = 'template_adaptation',
  USER_FEEDBACK = 'user_feedback',
  AGENT_KNOWLEDGE = 'agent_knowledge'
}

export interface MemoryEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  memory_type: MemoryType;
  source_type: MemorySourceType;
  source_id: string;
  content: any;
  metadata: Record<string, any>;
  checksum: string;
  embedding?: any;
  importance: number;
  created_at: string;
  expiration?: string;
  created_by: string;
}

export interface MemoryAssociation {
  id: string;
  tenant_id: string;
  source_memory_id: string;
  target_memory_id: string;
  association_type: string;
  strength: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MemorySearchParams {
  tenant_id: string;
  user_id?: string;
  memory_type?: MemoryType;
  source_type?: MemorySourceType;
  search_term?: string;
  limit?: number;
  offset?: number;
}
