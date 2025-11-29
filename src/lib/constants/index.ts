/**
 * System-wide constants
 */

// Redis Streams
export const REDIS_STREAMS = {
  EVENTS: 'mesh:events',
  COMMANDS: 'mesh:commands',
  DLQ: 'mesh:events:dlq',
} as const;

export const CONSUMER_GROUPS = {
  HITL: 'hitl',
  ROUTER: 'router',
  VERIFIER: 'verifier',
  GOVERNANCE: 'governance',
} as const;

// CloudEvents
export const CLOUDEVENTS = {
  SPEC_VERSION: '1.0',
  CONTENT_TYPE: 'application/cloudevents+json',
} as const;

// Agent Discovery
export const DISCOVERY = {
  MIN_CONFIDENCE: 0.7,
  MAX_AGENTS: 5,
  TIMEOUT_MS: 30000,
  CACHE_TTL_SECONDS: 3600,
} as const;

// Ontology
export const ONTOLOGY = {
  NAMESPACE: 'ex',
  BASE_URI: 'http://example.org/',
  CACHE_TTL_SECONDS: 3600,
} as const;

// Confidence Thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
  MINIMUM: 0.3,
} as const;
