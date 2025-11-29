/**
 * Core agent types used across the system
 */

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  status: AgentStatus;
  metadata: AgentMetadata;
}

export type AgentType = 
  | 'platform'      // Platform-specific (Google Ads, Meta)
  | 'product'       // Product-level (Nike Air Max)
  | 'brand'         // Brand-level (Nike)
  | 'mco'           // MCO pipeline
  | 'governance'    // Governance & compliance
  | 'rmn';          // Retail media network

export type AgentStatus = 
  | 'spawning'
  | 'active'
  | 'completed'
  | 'failed'
  | 'terminated';

export interface AgentMetadata {
  spawnedAt: string;
  triggerId?: string;
  signalId?: string;
  confidence?: number;
  [key: string]: any;
}

export interface DiscoveredAgent extends Agent {
  confidence: number;
  discoveryMethod: 'ontology' | 'vector' | 'capability' | 'marketplace';
  matchScore: number;
}
