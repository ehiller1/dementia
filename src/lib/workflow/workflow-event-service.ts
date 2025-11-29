/**
 * Workflow Event Service
 * Integrates with the existing event bus and provides workflow-specific event functionality
 */

import { supabase } from '../../integrations/supabase/client';
import {
  WorkflowEventType,
  WorkflowEventTypeValue,
  WorkflowEvent,
  EventDefinition,
  EventFilter,
  EventSubscription,
  WorkflowEventHandler,
  WorkflowEnvelope,
  FilterCriteria,
  SubscriberType,
  SimpleFilterCriteria,
  WorkflowSubscriptionHandle
} from './types';
import { 
  RedisWorkflowEventListener, 
  type WorkflowTelemetryPayload 
} from '../../services/event-bus/RedisWorkflowEventListener';
import { getEventBusService } from '../../services/event-bus/EventBus';
import { getMeshClient } from '../../infrastructure/redis-mesh/RedisMeshClient';
import type { MeshEnvelope } from '../../infrastructure/redis-mesh/types';
import { RedisMeshClient } from '../../infrastructure/redis-mesh/RedisMeshClient';
import { MeshEnvelopeBuilder } from '../../infrastructure/redis-mesh/MeshEnvelopeBuilder';

// Re-export WorkflowEventType for UI components
export { WorkflowEventType } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Determine if persistence should be disabled (e.g., during tests)
 */
const isPersistenceDisabled = (): boolean => {
  // Explicit flag OR test environment
  return (
    process.env.WORKFLOW_PERSIST_DISABLED === 'true' ||
    process.env.NODE_ENV === 'test'
  );
};

// Removed: workflowToEventBusType - no longer needed, using Redis Mesh directly

/**
 * WorkflowEventService
 * Manages workflow events, integrating with the existing event bus
 */
type InternalHandler = {
  handler: WorkflowEventHandler;
  filter?: FilterCriteria;
  subscriberType: SubscriberType;
  subscriberId: string;
};

const resolveEventTypeKeys = (eventType: WorkflowEventTypeValue): string[] => {
  const keys = new Set<string>();
  const value = eventType.toString();
  keys.add(value);
  keys.add(value.toLowerCase());
  keys.add(value.toUpperCase());
  return Array.from(keys);
};

export class WorkflowEventService {
  private eventHandlers: Map<string, Set<InternalHandler>>;
  private tenantId: string;
  private redisListener: RedisWorkflowEventListener;
  private redisUnsubscribe: (() => void) | null = null;
  private processedEventIds: Set<string> = new Set();
  private maxProcessedIds = 5000;
  private redisMeshClient: RedisMeshClient;
  private eventBusService = getEventBusService();
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.eventHandlers = new Map();
    
    // Initialize Redis Mesh Client as primary event backbone
    this.redisMeshClient = getMeshClient();

    // Subscribe to Redis Mesh telemetry stream
    this.redisListener = new RedisWorkflowEventListener({
      group: 'workflow.listeners'
    });
    this.redisUnsubscribe = this.redisListener.register(
      this.handleRedisTelemetry.bind(this)
    );
    
    console.log('[WorkflowEventService] Initialized with Redis Mesh as primary event bus');
  }
  
  // Removed: handleEventBusEvent - events now flow through Redis Mesh only
  
  /**
   * Stores an event in the database
   */
  private async storeEventInDatabase(event: WorkflowEvent): Promise<string | null> {
    if (isPersistenceDisabled()) {
      return null;
    }
    try {
      const { data, error } = await supabase.rpc('create_workflow_event', {
        p_tenant_id: this.tenantId,
        p_event_type: event.eventType,
        p_source_type: event.sourceType || null,
        p_source_id: event.sourceId || null,
        p_target_type: event.targetType || null,
        p_target_id: event.targetId || null,
        p_data: event.data || {},
        p_correlation_id: event.correlationId || null,
        p_session_id: event.sessionId || null,
        p_user_id: event.userId || null,
        p_event_definition_id: event.eventDefinitionId || null
      });
      
      if (error) {
        console.error('Error storing workflow event:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception storing workflow event:', error);
      return null;
    }
  }
  
  /**
   * Notifies subscribers of an event
   */
  private eventToEnvelope(event: WorkflowEvent): WorkflowEnvelope {
    const data = event.data || {};
    const payload = data.payload ?? data;
    const derivedSubtype = data.subtype ?? payload?.subtype ?? data.event_type ?? data.type;
    const attributes = data.attributes ?? payload?.attributes;
    return {
      eventType: event.eventType,
      data,
      payload,
      subtype: derivedSubtype,
      attributes,
      tenantId: this.tenantId
    };
  }

  private matchesFilter(envelope: WorkflowEnvelope, criteria?: FilterCriteria): boolean {
    if (!criteria) {
      return true;
    }

    if (typeof criteria === 'function') {
      try {
        return criteria(envelope);
      } catch (error) {
        console.error('[WorkflowEventService] Filter predicate threw error:', error);
        return false;
      }
    }

    const { subtype, attributes, match = 'all' } = criteria as SimpleFilterCriteria;
    const checks: boolean[] = [];

    if (subtype !== undefined) {
      const eventSubtype = envelope.subtype || envelope.data?.subtype || envelope.payload?.subtype;
      if (Array.isArray(subtype)) {
        checks.push(subtype.includes(eventSubtype));
      } else {
        checks.push(eventSubtype === subtype);
      }
    }

    if (attributes) {
      const eventAttrs = envelope.attributes || envelope.data?.attributes || envelope.payload?.attributes || {};
      const attributeChecks = Object.entries(attributes).map(([key, expected]) => {
        return eventAttrs[key] === expected;
      });
      checks.push(match === 'all' ? attributeChecks.every(Boolean) : attributeChecks.some(Boolean));
    }

    if (!checks.length) {
      return true;
    }

    return match === 'all' ? checks.every(Boolean) : checks.some(Boolean);
  }

  private async notifySubscribers(event: WorkflowEvent): Promise<void> {
    const candidateKeys = resolveEventTypeKeys(event.eventType);
    const handlerSet = new Set<InternalHandler>();

    for (const key of candidateKeys) {
      const handlers = this.eventHandlers.get(key);
      if (handlers) {
        handlers.forEach(handler => handlerSet.add(handler));
      }
    }

    if (handlerSet.size === 0) {
      return;
    }

    const envelope = this.eventToEnvelope(event);

    const executions = Array.from(handlerSet).map(({ handler, filter }) => {
      if (!this.matchesFilter(envelope, filter)) {
        return Promise.resolve();
      }
      try {
        return handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(executions);
  }
  
  /**
   * Publishes a workflow event
   */
  async publishEvent(event: WorkflowEvent): Promise<string | null> {
    // Generate ID if not provided
    if (!event.id) {
      event.id = uuidv4();
    }
    
    // Set timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }
    
    // 1. Store in Supabase for persistence/audit
    const eventId = await this.storeEventInDatabase(event);

    if (event.id) {
      this.trackProcessedEvent(event.id);
    }

    // 2. Publish to Redis Mesh (primary event bus)
    await this.publishToRedisMesh(event);
    
    // 3. Notify local subscribers
    await this.notifySubscribers(event);

    return eventId;
  }
  
  /**
   * Registers an event definition
   */
  async registerEventDefinition(definition: EventDefinition): Promise<string | null> {
    if (isPersistenceDisabled()) {
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('workflow_event_definitions')
        .insert({
          tenant_id: this.tenantId,
          name: definition.name,
          description: definition.description || null,
          event_type: definition.eventType,
          schema: definition.schema || null,
          metadata: definition.metadata || null
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error registering event definition:', error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Exception registering event definition:', error);
      return null;
    }
  }
  
  /**
   * Subscribes to events
   */
  subscribe(
    eventType: WorkflowEventTypeValue,
    handler: WorkflowEventHandler,
    subscriberType: SubscriberType,
    subscriberId: string,
    filterCriteria?: FilterCriteria
  ): WorkflowSubscriptionHandle {
    const keys = resolveEventTypeKeys(eventType);

    const internalHandler: InternalHandler = {
      handler,
      filter: filterCriteria,
      subscriberType,
      subscriberId
    };

    keys.forEach(key => {
      if (!this.eventHandlers.has(key)) {
        this.eventHandlers.set(key, new Set());
      }
      this.eventHandlers.get(key)!.add(internalHandler);
    });

    const subscriptionIdPromise = this.persistSubscription(eventType, subscriberType, subscriberId, filterCriteria);

    return {
      unsubscribe: async () => {
        const subscriptionId = await subscriptionIdPromise;
        await this.unsubscribe(eventType, handler, subscriptionId ?? undefined);
        return true;
      }
    };
  }
  
  /**
   * Unsubscribes from events
   */
  async unsubscribe(
    eventType: WorkflowEventTypeValue,
    handler: WorkflowEventHandler,
    subscriptionId?: string
  ): Promise<boolean> {
    // Remove handler from in-memory map
    const keys = resolveEventTypeKeys(eventType);

    for (const key of keys) {
      const handlers = this.eventHandlers.get(key);
      if (!handlers) {
        continue;
      }
      for (const internal of handlers) {
        if (internal.handler === handler) {
          handlers.delete(internal);
        }
      }
      if (handlers.size === 0) {
        this.eventHandlers.delete(key);
      }
    }
    
    // Deactivate subscription in database if ID provided (skip in test mode)
    if (isPersistenceDisabled()) {
      return true;
    }
    if (subscriptionId) {
      try {
        const { error } = await supabase
          .from('workflow_event_subscriptions')
          .update({ is_active: false })
          .eq('id', subscriptionId)
          .eq('tenant_id', this.tenantId);
        
        if (error) {
          console.error('Error deactivating event subscription:', error);
          return false;
        }
      } catch (error) {
        console.error('Exception deactivating event subscription:', error);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Queries event history
   */
  async queryEvents(filter: EventFilter, limit: number = 100, offset: number = 0): Promise<WorkflowEvent[]> {
    if (isPersistenceDisabled()) {
      return [];
    }
    try {
      let query = supabase
        .from('workflow_event_history')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('occurred_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);
      
      // Apply filters
      if (filter.eventType) {
        query = query.eq('event_type', filter.eventType);
      }
      
      if (filter.eventDefinitionId) {
        query = query.eq('event_definition_id', filter.eventDefinitionId);
      }
      
      if (filter.sourceType) {
        query = query.eq('source_type', filter.sourceType);
      }
      
      if (filter.sourceId) {
        query = query.eq('source_id', filter.sourceId);
      }
      
      if (filter.targetType) {
        query = query.eq('target_type', filter.targetType);
      }
      
      if (filter.targetId) {
        query = query.eq('target_id', filter.targetId);
      }
      
      if (filter.correlationId) {
        query = query.eq('correlation_id', filter.correlationId);
      }
      
      if (filter.sessionId) {
        query = query.eq('session_id', filter.sessionId);
      }
      
      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error querying events:', error);
        return [];
      }
      
      // Map database records to WorkflowEvent objects
      return data.map(record => ({
        id: record.id,
        eventDefinitionId: record.event_definition_id,
        eventType: record.event_type as WorkflowEventTypeValue,
        sourceType: record.source_type,
        sourceId: record.source_id,
        targetType: record.target_type,
        targetId: record.target_id,
        data: record.data,
        correlationId: record.correlation_id,
        sessionId: record.session_id,
        userId: record.user_id,
        timestamp: record.occurred_at
      }));
    } catch (error) {
      console.error('Exception querying events:', error);
      return [];
    }
  }
  
  /**
   * Gets event subscriptions
   */
  async getSubscriptions(
    subscriberType?: string,
    subscriberId?: string,
    eventType?: WorkflowEventTypeValue
  ): Promise<EventSubscription[]> {
    try {
      let query = supabase
        .from('workflow_event_subscriptions')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('is_active', true);
      
      if (subscriberType) {
        query = query.eq('subscriber_type', subscriberType);
      }
      
      if (subscriberId) {
        query = query.eq('subscriber_id', subscriberId);
      }
      
      if (eventType) {
        query = query.eq('event_type', eventType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error getting subscriptions:', error);
        return [];
      }
      
      // Map database records to EventSubscription objects
      return data.map(record => ({
        id: record.id,
        subscriberType: record.subscriber_type,
        subscriberId: record.subscriber_id,
        eventDefinitionId: record.event_definition_id,
        eventType: record.event_type as WorkflowEventType,
        filterCriteria: record.filter_criteria,
        isActive: record.is_active
      }));
    } catch (error) {
      console.error('Exception getting subscriptions:', error);
      return [];
    }
  }

  private trackProcessedEvent(eventId: string): void {
    this.processedEventIds.add(eventId);
    if (this.processedEventIds.size > this.maxProcessedIds) {
      const iterator = this.processedEventIds.values();
      while (this.processedEventIds.size > this.maxProcessedIds) {
        const value = iterator.next();
        if (value.done) break;
        this.processedEventIds.delete(value.value);
      }
    }
  }

  private async handleRedisTelemetry(
    envelope: MeshEnvelope<WorkflowTelemetryPayload>
  ): Promise<void> {
    const payload = envelope.payload;
    if (!payload) {
      return;
    }

    if (payload.tenantId && payload.tenantId !== this.tenantId) {
      return;
    }

    const eventType = payload.event_type as WorkflowEventTypeValue | undefined;
    if (!eventType) {
      return;
    }

    const eventId = payload.workflow_event_id || envelope.idempotency_key;
    if (eventId && this.processedEventIds.has(eventId)) {
      return;
    }

    const workflowEvent: WorkflowEvent = {
      id: eventId,
      eventType,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      targetType: payload.targetType,
      targetId: payload.targetId,
      data: payload.data,
      correlationId: payload.conversation_id,
      sessionId: payload.sessionId,
      userId: payload.userId,
      timestamp: payload.timestamp || envelope.timestamp
    };

    if (eventId) {
      this.trackProcessedEvent(eventId);
    }

    await this.storeEventInDatabase(workflowEvent);
    await this.notifySubscribers(workflowEvent);
  }

  private async persistSubscription(
    eventType: WorkflowEventTypeValue,
    subscriberType: SubscriberType,
    subscriberId: string,
    filterCriteria?: FilterCriteria
  ): Promise<string | null> {
    if (isPersistenceDisabled()) {
      return null;
    }

    try {
      const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const generateUUID = () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

      const validSubscriberId = isValidUUID(subscriberId) ? subscriberId : generateUUID();

      const normalizedFilter =
        typeof filterCriteria === 'function'
          ? null
          : filterCriteria
            ? { ...filterCriteria }
            : null;

      const { data, error } = await supabase
        .from('workflow_event_subscriptions')
        .insert({
          tenant_id: this.tenantId,
          subscriber_type: subscriberType,
          subscriber_id: validSubscriberId,
          event_type: eventType,
          filter_criteria: normalizedFilter
        })
        .select('id')
        .single();

      if (error) {
        console.log(`ℹ️  [EventService] Subscription registration skipped (table may not exist): ${error.message}`);
        return null;
      }

      return data.id;
    } catch (error) {
      console.log('ℹ️  [EventService] Subscription registration skipped:', error);
      return null;
    }
  }

  /**
   * Publish event to Redis Mesh (primary event bus)
   */
  private async publishToRedisMesh(event: WorkflowEvent): Promise<void> {
    try {
      const envelope = new MeshEnvelopeBuilder()
        .eventType(`workflow.${event.eventType}`)
        .producer({
          service: 'WorkflowEventService',
          agent_id: event.sourceId,
          agent_version: '1.0'
        })
        .subject({
          type: (event.targetType as 'workflow' | 'agent' | 'decision' | 'action' | 'dataset' | 'task') || 'workflow',
          id: event.targetId || event.correlationId || event.id || 'unknown'
        })
        .correlationId(event.correlationId || event.id || uuidv4())
        .rights({
          classification: 'internal',
          pii: false,
          retention_days: 30,
          shareable: false
        })
        .tags([
          this.tenantId,
          event.eventType,
          `source:${event.sourceType || 'unknown'}`,
          `target:${event.targetType || 'unknown'}`
        ])
        .payload({
          event_id: event.id,
          event_type: event.eventType,
          source_type: event.sourceType,
          source_id: event.sourceId,
          target_type: event.targetType,
          target_id: event.targetId,
          correlation_id: event.correlationId,
          session_id: event.sessionId,
          user_id: event.userId,
          timestamp: event.timestamp,
          tenant_id: this.tenantId,
          data: event.data || {}
        })
        .build();

      await this.redisMeshClient.publishEvent(envelope);
      console.log(`[WorkflowEventService] Published ${event.eventType} to Redis Mesh (${event.id})`);
    } catch (error) {
      console.error('[WorkflowEventService] Failed to publish to Redis Mesh:', error);
      throw error;
    }
  }
}

/**
 * Creates a workflow event service instance
 */
export function createWorkflowEventService(tenantId: string): WorkflowEventService {
  return new WorkflowEventService(tenantId);
}
