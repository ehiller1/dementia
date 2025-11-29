// Shared agent registry types

export interface AgentManifest {
  name: string;
  version?: string;
  owner?: string;
  description?: string;
  capabilities: string[];
  intents?: string[];
  enabled?: boolean;
  // Arbitrary manifest details (interfaces, resources, etc.)
  manifest?: Record<string, any>;
}

export interface AgentRecord {
  id: string;
  name: string;
  version: string | null;
  owner: string | null;
  description: string | null;
  capabilities: string[];
  intents: string[];
  enabled: boolean;
  manifest: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AgentQueryFilter {
  intent?: string;
  capability?: string;
  q?: string; // free-text semantic query
  limit?: number;
}

export interface AgentSearchResult {
  agent: AgentRecord;
  similarity?: number;
}
