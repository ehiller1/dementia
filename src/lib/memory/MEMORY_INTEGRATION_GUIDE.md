# Hierarchical Memory System Integration Guide

This document outlines the integration patterns, data flow, and usage guidelines for the hierarchical memory system implemented in the decision template automation platform.

## Memory Architecture Overview

The memory system follows a three-tiered architecture aligned with user interaction patterns:

### 1. Working Memory
- **Purpose**: Stores specific prompt, agent, or template activations tied to individual user intents or queries
- **Lifespan**: Short (default: 2 hours)
- **Scope**: Per-activation, per-intent, per-query context
- **Example**: When a user asks about "seasonal impact on product sales", the specific prompt, agent activation, or template execution is stored here

### 2. Short-Term Memory
- **Purpose**: Stores time-bound information spanning multiple parallel templates/agents/activities
- **Lifespan**: Medium (default: 14-30 days)
- **Scope**: Session-level or topic-level connections (e.g., seasonality + marketing + procurement in parallel)
- **Example**: When a user explores multiple related topics like "seasonal impact", "marketing campaigns", and "procurement planning" within the same business context

### 3. Long-Term Memory
- **Purpose**: Accumulates validated learnings and patterns across all user activities
- **Lifespan**: Permanent (no expiration)
- **Scope**: Cross-session, cross-topic knowledge base
- **Example**: Validated template adaptations, business rules, recurring patterns in user behavior

## Integration Components

The system consists of these key integration components:

1. **Memory Manager**: Core storage and retrieval operations (`memory-manager.ts`)
2. **Working Memory**: Execution context tracking (`working-memory.ts`)
3. **Short-Term Memory**: Cross-execution persistence (`short-term-memory.ts`)
4. **Long-Term Memory**: Historical knowledge storage (`long-term-memory.ts`)
5. **Memory Integration Service**: Orchestrates memory flow (`memory-integration-service.ts`)
6. **Template Memory Integration**: Template-specific memory operations (`template-memory-integration.ts`)
7. **Memory Indexer**: Memory validation and associations (`memory-indexer.ts`)
8. **Contextual Retrieval**: Multi-faceted search capabilities (`contextual-retrieval.ts`)

## Data Flow Patterns

### Template Execution Flow

```
User Query → Working Memory (activation) → Template Execution → 
Working Memory (step updates) → Short-Term Memory (promotion) → 
Long-Term Memory (validated insights)
```

1. **Activation**: When a template is activated:
   - Store activation details in Working Memory
   - Track session and associate with existing topic if relevant
   - Look for similar past executions in Short-Term Memory

2. **Execution**: During template execution:
   - Track step-by-step progress in Working Memory
   - Store important decisions in Short-Term Memory
   - Use Working Memory for execution variable context

3. **Completion**: When template execution completes:
   - Store result in Working Memory
   - Promote execution context to Short-Term Memory
   - Store performance metrics in Long-Term Memory

### Template Enhancement Flow

```
Enhancement Need → Short-Term Memory (patterns) → Long-Term Memory (knowledge) → 
Template Adaptation → Long-Term Memory (adaptation record)
```

1. **Knowledge Retrieval**: Gather relevant information:
   - Previous adaptations from Long-Term Memory
   - Similar templates via semantic search
   - Business rules from Long-Term Memory
   - User feedback patterns from Long-Term Memory

2. **Adaptation**: Create template enhancements:
   - Generate adaptations using retrieved knowledge
   - Apply enhancements to template

3. **Performance Tracking**: Track adaptation effectiveness:
   - Store adaptation record in Long-Term Memory
   - Update with performance metrics after execution

## Integration Patterns

### 1. Initialization Pattern

```typescript
// Initialize memory for template execution
const templateMemory = new TemplateMemoryIntegration();
await templateMemory.initializeTemplateExecution({
  executionId: 'exec_123',
  templateId: 'template_abc',
  userId: user.id,
  tenantId: user.tenant_id,
  sessionId: session.id,
  conversationId: conversation.id,
  queryText: 'How does seasonality impact my product sales?',
  intent: 'analyze_seasonality',
  metadata: {
    source: 'web_app',
    priority: 'high'
  }
});
```

### 2. Execution Tracking Pattern

```typescript
// Track execution steps
await templateMemory.trackExecutionStep(
  'exec_123',
  1,
  {
    task_id: 'analyze_historical_data',
    status: 'completed',
    result: { seasonal_pattern: 'Q4_peak' }
  },
  {
    userId: user.id,
    tenantId: user.tenant_id,
    contextId: conversation.id,
    contextType: 'conversation'
  }
);
```

### 3. Topic Association Pattern

```typescript
// Create a topic for related activities
const memoryService = new MemoryIntegrationService();
const topicId = await memoryService.createOrUpdateTopic(
  session.id,
  {
    name: 'Business Planning',
    description: 'Seasonality, marketing, and procurement planning',
    keywords: ['seasonality', 'marketing', 'procurement', 'planning']
  },
  memoryContext
);

// Link multiple activations to the topic
await memoryService.linkTopicActivations(
  topicId,
  ['exec_123', 'exec_456', 'exec_789'],
  memoryContext
);
```

### 4. Knowledge Retrieval Pattern

```typescript
// Retrieve knowledge for template enhancement
const knowledge = await templateMemory.retrieveKnowledgeForEnhancement(
  'template_abc',
  'improve seasonal analysis with marketing data',
  memoryContext
);

// Use knowledge to enhance template
const enhancement = generateEnhancement(templateDetails, knowledge);
await templateMemory.storeTemplateAdaptation(
  'template_abc',
  {
    type: 'schema',
    originalValue: templateDetails.schema,
    adaptedValue: enhancement.schema,
    rationale: 'Added marketing spend correlation fields',
    source: 'automated_enhancement'
  },
  memoryContext
);
```

## Best Practices

### Working Memory
1. **DO** store execution-specific context that's only needed during execution
2. **DO** clear working memory once execution is complete (with some delay)
3. **DO NOT** store information needed across executions in working memory
4. **DO** use working memory for fast, frequent access during execution

### Short-Term Memory
1. **DO** store patterns across related executions
2. **DO** create topics to link parallel activities
3. **DO** use short-term memory for user session continuity
4. **DO NOT** rely on short-term memory for permanent storage

### Long-Term Memory
1. **DO** validate insights before storing in long-term memory
2. **DO** store business rules and domain knowledge
3. **DO** track adaptation performance
4. **DO** periodically review and clean up long-term memory

## Session & Topic Management

Sessions represent user interaction periods, while topics group related activities across one or more sessions:

1. **Session**: Created when user begins interacting with the system
2. **Topic**: Created when system identifies related parallel activities
3. **Memory Promotion**: Working → Short-Term → Long-Term based on validation

## Database Schema Integration

The memory system integrates with these database tables:
- `memory_entries`: Core memory storage
- `memory_associations`: Relationships between memories
- `memory_access_logs`: Usage tracking

## Security Considerations

1. All memory operations enforce tenant isolation via Row-Level Security
2. Memory context always includes user and tenant identification
3. Sensitive information should be marked in metadata for special handling

## Error Handling & Resilience

1. Memory operations use try/catch to prevent cascading failures
2. Data integrity is verified via checksums
3. Memory corruption detection and repair mechanisms are available

## Performance Optimization

1. Use the appropriate memory tier for the use case
2. Leverage the indexed search functions for efficient retrieval
3. Clean up working memory regularly
4. Consider batch processing for long-term memory promotion

## Next Steps & Future Extensions

1. Memory analytics dashboard for insights
2. Enhanced topic detection using NLP
3. Memory summarization capabilities
4. Automatic memory cleaning based on usage patterns
