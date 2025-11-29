/**
 * Dynamic Template Engine React Adapter Hook
 * 
 * This hook provides a simple interface for React components to use the
 * DynamicTemplateEngine service.
 */

import { useState, useCallback } from 'react';
import { TemplatesAPI, WorkflowAPI } from '../../services/dynamic-template-engine/api.ts';
import { 
  DynamicTemplate, 
  TemplateExecutionResult,
  WorkflowState,
  WorkflowEvent,
  WorkflowDecision
} from '../../services/dynamic-template-engine/interfaces.ts';

interface UseDynamicTemplateEngineOptions {
  tenantId?: string;
  userId?: string;
  conversationId?: string;
}

/**
 * React hook for using the DynamicTemplateEngine service
 */
export function useDynamicTemplateEngine(options?: UseDynamicTemplateEngineOptions) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Template operations
  
  const createTemplate = useCallback(async (
    template: Omit<DynamicTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DynamicTemplate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await TemplatesAPI.create({
        ...template,
        tenant_id: template.tenant_id || options?.tenantId || ''
      }, options?.tenantId);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [options?.tenantId]);
  
  const getTemplate = useCallback(async (
    id: string
  ): Promise<DynamicTemplate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      return await TemplatesAPI.get(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const listTemplates = useCallback(async (
    queryOptions?: {
      conversationId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<DynamicTemplate[]> => {
    setLoading(true);
    setError(null);
    
    try {
      return await TemplatesAPI.list({
        ...queryOptions,
        tenantId: options?.tenantId,
        conversationId: queryOptions?.conversationId || options?.conversationId
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, [options?.tenantId, options?.conversationId]);
  
  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<DynamicTemplate>
  ): Promise<DynamicTemplate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      return await TemplatesAPI.update(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const deleteTemplate = useCallback(async (
    id: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      return await TemplatesAPI.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const executeTemplate = useCallback(async (
    templateId: string,
    executionOptions?: {
      sessionId?: string;
      modelId?: string;
      maxTokens?: number;
      temperature?: number;
      additionalContext?: Record<string, any>;
    }
  ): Promise<TemplateExecutionResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await TemplatesAPI.execute(
        templateId,
        {
          conversationId: options?.conversationId || '',
          sessionId: executionOptions?.sessionId,
          userId: options?.userId,
          tenantId: options?.tenantId,
          modelId: executionOptions?.modelId,
          maxTokens: executionOptions?.maxTokens,
          temperature: executionOptions?.temperature,
          additionalContext: executionOptions?.additionalContext
        }
      );
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [options?.conversationId, options?.userId, options?.tenantId]);
  
  // Workflow operations
  
  const storeWorkflowState = useCallback(async (
    state: Omit<WorkflowState, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WorkflowState | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure conversation_id is set
      if (!state.conversation_id && options?.conversationId) {
        state.conversation_id = options.conversationId;
      }
      
      return await WorkflowAPI.storeState(
        state,
        options?.tenantId,
        options?.userId
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [options?.conversationId, options?.tenantId, options?.userId]);
  
  const getWorkflowState = useCallback(async (
    workflowInstanceId: string,
    conversationId?: string
  ): Promise<WorkflowState | null> => {
    setLoading(true);
    setError(null);
    
    try {
      return await WorkflowAPI.getState(
        workflowInstanceId,
        conversationId || options?.conversationId || ''
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [options?.conversationId]);
  
  const getWorkflowStates = useCallback(async (
    queryOptions?: {
      workflowInstanceId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowState[]> => {
    setLoading(true);
    setError(null);
    
    try {
      return await WorkflowAPI.getStates({
        ...queryOptions,
        conversationId: options?.conversationId,
        tenantId: options?.tenantId
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, [options?.conversationId, options?.tenantId]);
  
  const storeWorkflowEvent = useCallback(async (
    event: Omit<WorkflowEvent, 'id' | 'created_at'>
  ): Promise<WorkflowEvent | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure conversation_id is set
      if (!event.conversation_id && options?.conversationId) {
        event.conversation_id = options.conversationId;
      }
      
      return await WorkflowAPI.storeEvent(
        event,
        options?.tenantId,
        options?.userId
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [options?.conversationId, options?.tenantId, options?.userId]);
  
  const getWorkflowEvents = useCallback(async (
    queryOptions?: {
      workflowInstanceId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowEvent[]> => {
    setLoading(true);
    setError(null);
    
    try {
      return await WorkflowAPI.getEvents({
        ...queryOptions,
        conversationId: options?.conversationId,
        tenantId: options?.tenantId
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, [options?.conversationId, options?.tenantId]);
  
  const storeWorkflowDecision = useCallback(async (
    decision: Omit<WorkflowDecision, 'id' | 'created_at'>
  ): Promise<WorkflowDecision | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure conversation_id is set
      if (!decision.conversation_id && options?.conversationId) {
        decision.conversation_id = options.conversationId;
      }
      
      return await WorkflowAPI.storeDecision(
        decision,
        options?.tenantId,
        options?.userId
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [options?.conversationId, options?.tenantId, options?.userId]);
  
  const getWorkflowDecisions = useCallback(async (
    queryOptions?: {
      workflowInstanceId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowDecision[]> => {
    setLoading(true);
    setError(null);
    
    try {
      return await WorkflowAPI.getDecisions({
        ...queryOptions,
        conversationId: options?.conversationId,
        tenantId: options?.tenantId
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, [options?.conversationId, options?.tenantId]);
  
  return {
    // States
    loading,
    error,
    
    // Template operations
    createTemplate,
    getTemplate,
    listTemplates,
    updateTemplate,
    deleteTemplate,
    executeTemplate,
    
    // Workflow operations
    storeWorkflowState,
    getWorkflowState,
    getWorkflowStates,
    storeWorkflowEvent,
    getWorkflowEvents,
    storeWorkflowDecision,
    getWorkflowDecisions
  };
}
