/**
 * Workflow Memory Integration
 * Integrates workflow execution with the hierarchical memory system
 */

import { 
  MemoryManager, 
  WorkingMemory, 
  ShortTermMemory, 
  LongTermMemory 
} from '../memory/memory-manager.ts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Memory integration for workflow execution
 */
export class WorkflowMemoryIntegration {
  private memoryManager: MemoryManager;
  private tenantId: string;
  private userId: string;
  
  constructor(memoryManager: MemoryManager, tenantId: string, userId: string) {
    this.memoryManager = memoryManager;
    this.tenantId = tenantId;
    this.userId = userId;
  }
  
  /**
   * Creates a memory context for a workflow execution
   */
  async createWorkflowMemoryContext(
    workflowId: string,
    templateId: string,
    sessionId?: string,
    parentContextId?: string
  ): Promise<string> {
    const contextId = uuidv4();
    
    // Initialize working memory for this workflow
    await this.memoryManager.working.initialize(
      contextId,
      {
        workflowId,
        templateId,
        sessionId,
        parentContextId,
        createdAt: new Date().toISOString(),
        tenantId: this.tenantId,
        userId: this.userId
      }
    );
    
    return contextId;
  }
  
  /**
   * Stores data in working memory
   */
  async storeInWorkingMemory(key: string, data: any): Promise<void> {
    await this.memoryManager.working.set(key, data);
  }
  
  /**
   * Retrieves data from working memory
   */
  async getFromWorkingMemory<T>(key: string): Promise<T | null> {
    return await this.memoryManager.working.get<T>(key);
  }
  
  /**
   * Stores data in short-term memory
   */
  async storeInShortTermMemory(key: string, data: any, tags?: string[]): Promise<void> {
    await this.memoryManager.shortTerm.store(
      key,
      data,
      {
        tenantId: this.tenantId,
        userId: this.userId,
        tags: tags || []
      }
    );
  }
  
  /**
   * Retrieves data from short-term memory
   */
  async getFromShortTermMemory<T>(key: string): Promise<T | null> {
    return await this.memoryManager.shortTerm.retrieve<T>(key);
  }
  
  /**
   * Searches short-term memory
   */
  async searchShortTermMemory<T>(query: string, limit: number = 5): Promise<T[]> {
    return await this.memoryManager.shortTerm.search<T>(
      query,
      {
        tenantId: this.tenantId,
        userId: this.userId,
        limit
      }
    );
  }
  
  /**
   * Stores data in long-term memory
   */
  async storeInLongTermMemory(key: string, data: any, tags?: string[]): Promise<void> {
    await this.memoryManager.longTerm.store(
      key,
      data,
      {
        tenantId: this.tenantId,
        userId: this.userId,
        tags: tags || []
      }
    );
  }
  
  /**
   * Retrieves data from long-term memory
   */
  async getFromLongTermMemory<T>(key: string): Promise<T | null> {
    return await this.memoryManager.longTerm.retrieve<T>(key);
  }
  
  /**
   * Searches long-term memory
   */
  async searchLongTermMemory<T>(query: string, limit: number = 5): Promise<T[]> {
    return await this.memoryManager.longTerm.search<T>(
      query,
      {
        tenantId: this.tenantId,
        userId: this.userId,
        limit
      }
    );
  }
  
  /**
   * Stores workflow template execution results in long-term memory
   * for future adaptation and learning
   */
  async storeWorkflowResults(
    workflowId: string,
    templateId: string,
    inputData: any,
    outputData: any,
    metrics: any,
    success: boolean
  ): Promise<void> {
    const key = `workflow:template:${templateId}:execution:${workflowId}`;
    
    await this.storeInLongTermMemory(
      key,
      {
        workflowId,
        templateId,
        inputData,
        outputData,
        metrics,
        success,
        executedAt: new Date().toISOString()
      },
      ['workflow_execution', 'template_performance', templateId]
    );
  }
  
  /**
   * Retrieves similar workflow executions from memory
   * for adaptation and learning
   */
  async getSimilarWorkflowExecutions(
    templateId: string,
    inputData: any,
    limit: number = 3
  ): Promise<any[]> {
    // Create a query string from the input data
    const queryString = JSON.stringify(inputData);
    
    // Search long-term memory for similar executions
    const results = await this.searchLongTermMemory<any>(
      queryString,
      limit
    );
    
    // Filter by template ID
    return results.filter(item => item.templateId === templateId);
  }
  
  /**
   * Stores workflow component execution data for learning
   */
  async storeComponentExecution(
    componentId: string,
    inputData: any,
    outputData: any,
    success: boolean
  ): Promise<void> {
    const key = `component:${componentId}:execution:${uuidv4()}`;
    
    await this.storeInLongTermMemory(
      key,
      {
        componentId,
        inputData,
        outputData,
        success,
        executedAt: new Date().toISOString()
      },
      ['component_execution', componentId]
    );
  }
  
  /**
   * Retrieves similar component executions for adaptation
   */
  async getSimilarComponentExecutions(
    componentId: string,
    inputData: any,
    limit: number = 3
  ): Promise<any[]> {
    // Create a query string from the input data
    const queryString = JSON.stringify(inputData);
    
    // Search long-term memory
    const results = await this.searchLongTermMemory<any>(
      queryString,
      limit
    );
    
    // Filter by component ID
    return results.filter(item => 
      item.componentId === componentId && 
      item.tags && 
      item.tags.includes('component_execution')
    );
  }
  
  /**
   * Stores workflow event in memory for pattern recognition
   */
  async storeWorkflowEvent(
    eventType: string,
    eventData: any,
    workflowId: string,
    templateId: string
  ): Promise<void> {
    const key = `workflow:${workflowId}:event:${uuidv4()}`;
    
    await this.storeInShortTermMemory(
      key,
      {
        eventType,
        eventData,
        workflowId,
        templateId,
        timestamp: new Date().toISOString()
      },
      ['workflow_event', eventType, workflowId, templateId]
    );
  }
  
  /**
   * Retrieves workflow context data
   */
  async getWorkflowContext(workflowId: string): Promise<any> {
    // Combine data from working memory and short-term memory
    const workingMemoryData = await this.getFromWorkingMemory<any>(`workflow:${workflowId}:context`);
    const shortTermData = await this.getFromShortTermMemory<any>(`workflow:${workflowId}:context`);
    
    return {
      ...workingMemoryData,
      ...shortTermData
    };
  }
  
  /**
   * Updates workflow context data
   */
  async updateWorkflowContext(workflowId: string, contextData: any): Promise<void> {
    // Store in both working memory and short-term memory
    await this.storeInWorkingMemory(`workflow:${workflowId}:context`, contextData);
    await this.storeInShortTermMemory(`workflow:${workflowId}:context`, contextData);
  }
  
  /**
   * Retrieves all step results for a workflow
   */
  async getWorkflowStepResults(workflowId: string): Promise<any[]> {
    // Search short-term memory for step results
    return await this.searchShortTermMemory<any>(
      `workflow:${workflowId}:results`,
      100 // Get all results
    );
  }
  
  /**
   * Stores workflow adaptation in long-term memory
   */
  async storeWorkflowAdaptation(
    templateId: string,
    originalSchema: any,
    adaptedSchema: any,
    adaptationReason: string
  ): Promise<void> {
    const key = `workflow:template:${templateId}:adaptation:${uuidv4()}`;
    
    await this.storeInLongTermMemory(
      key,
      {
        templateId,
        originalSchema,
        adaptedSchema,
        adaptationReason,
        adaptedAt: new Date().toISOString()
      },
      ['workflow_adaptation', templateId]
    );
  }
  
  /**
   * Retrieves workflow adaptations for a template
   */
  async getWorkflowAdaptations(templateId: string, limit: number = 5): Promise<any[]> {
    // Search long-term memory for adaptations
    const results = await this.searchLongTermMemory<any>(
      templateId,
      limit
    );
    
    // Filter by tags
    return results.filter(item => 
      item.tags && 
      item.tags.includes('workflow_adaptation') && 
      item.tags.includes(templateId)
    );
  }
}

/**
 * Creates a workflow memory integration instance
 */
export function createWorkflowMemoryIntegration(
  memoryManager: MemoryManager,
  tenantId: string,
  userId: string
): WorkflowMemoryIntegration {
  return new WorkflowMemoryIntegration(memoryManager, tenantId, userId);
}
