/**
 * MCWA-Enhanced Excel Analyst Agent
 * 
 * This extends the base Excel Analyst Agent with MCWA capabilities:
 * - Workflow awareness and state tracking
 * - Enhanced vector-based query generation
 * - Contextual retrieval integration
 */

import { ExcelAnalysisTool, createExcelAnalystAgent } from './excel-analyst-agent.ts';
import { workflowservice } from '../../services/workflowService.ts';
import { EnhancedQueryBuilder } from '../../services/enhancedQueryBuilder.ts';
import { WorkflowTemplateIntegration } from '../workflow/workflow-template-integration.ts';
import { VectorEnhancedRetrieval } from '../memory/vector-enhanced-retrieval.ts';
import { EmbeddingService } from '../../services/embeddingService.ts';
import { supabase } from '../../integrations/supabase/client.ts';
import { Tool } from 'langchain/tools';
import { ChatOpenAI } from '@langchain/openai';

/**
 * Enhanced Excel Analysis Tool with MCWA integration
 */
export class MCWAExcelAnalysisTool extends ExcelAnalysisTool {
  name = 'mcwa-excel-analysis';
  description = 'Load and analyze Excel files with workflow awareness and enhanced vector search';
  
  private tenantId: string;
  private enhancedQueryBuilder: EnhancedQueryBuilder;
  private workflowTemplateIntegration: WorkflowTemplateIntegration | null = null;
  private vectorRetrieval: VectorEnhancedRetrieval;
  private embeddingService: EmbeddingService;
  private workflowInstanceId: string | null = null;
  
  constructor(options?: { 
    userId?: string; 
    sessionId?: string; 
    conversationId?: string;
    tenantId?: string;
    workflowInstanceId?: string;
  }) {
    super(options);
    this.tenantId = options?.tenantId || 'default';
    this.workflowInstanceId = options?.workflowInstanceId || null;
    
    // Initialize MCWA components
    this.embeddingService = new EmbeddingService();
    this.enhancedQueryBuilder = new EnhancedQueryBuilder(this.tenantId);
    this.vectorRetrieval = new VectorEnhancedRetrieval({
      embeddingService: this.embeddingService,
      tenantId: this.tenantId,
      userId: options?.userId || undefined
    });
    
    if (options?.conversationId) {
      this.workflowTemplateIntegration = new WorkflowTemplateIntegration({
        tenantId: this.tenantId,
        userId: options?.userId
      });
    }
  }
  
  /**
   * Enhanced query data with workflow context awareness
   */
  public async queryData(query: string): Promise<string> {
    if (!this.vectorStore) {
      throw new Error('No Excel file has been loaded. Please load a file first.');
    }
    
    try {
      // Get enhanced query using MCWA query builder
      const enhancedQuery = await this.enhancedQueryBuilder.buildQuery(query, {
        userId: this.userId || undefined,
        sessionId: this.sessionId || undefined,
        conversationId: this.conversationId || undefined,
        workflowInstanceId: this.workflowInstanceId || undefined,
        includeWorkflowContext: !!this.workflowInstanceId,
        includeUserContext: !!this.userId,
        includeEntities: true,
        includeTemporalContext: true
      });
      
      // Get workflow context if available
      let workflowContext = '';
      if (this.workflowInstanceId) {
        const context = await workflowservice.getWorkflowContext(
          this.workflowInstanceId,
          this.tenantId
        );
        
        if (context) {
          workflowContext = `Current workflow step: ${context.workflow?.currentStep?.name || 'Unknown'}\n`;
          if (context.workflow?.currentStep?.description) {
            workflowContext += `Step description: ${context.workflow.currentStep.description}\n`;
          }
        }
      }
      
      // Use vector search for Excel data with enhanced query
      const results = await this.vectorStore.similaritySearch(
        enhancedQuery.textQuery, 
        5
      );
      
      // Format the results
      const resultContent = results.map(doc => doc.pageContent).join('\n\n');
      
      // Store in both working memory and as workflow event if applicable
      await this.storeInWorkingMemory(query, resultContent);
      
      if (this.workflowInstanceId && this.conversationId && this.workflowTemplateIntegration) {
        await this.workflowTemplateIntegration.recordWorkflowEvent(
          this.workflowInstanceId,
          this.conversationId,
          'excel_data_analyzed',
          { 
            query: query,
            enhancedQuery: enhancedQuery.textQuery,
            resultSummary: resultContent.substring(0, 200)
          }
        );
      }
      
      // Build response
      let response = resultContent;
      
      // Add workflow context if available
      if (workflowContext) {
        response += `\n\n**Workflow Context:**\n${workflowContext}`;
      }
      
      // Add query components used for transparency
      if (enhancedQuery.components.length > 1) {
        const componentInfo = enhancedQuery.components
          .filter(c => c.text !== query) // Don't show the original query
          .map(c => `- ${c.text} (weight: ${c.weight})`)
          .join('\n');
          
        if (componentInfo) {
          response += `\n\n**Query Enhancement:**\n${componentInfo}`;
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error in MCWA-enhanced queryData:', error);
      // Fall back to base class implementation
      return super.queryData(query);
    }
  }
  
  /**
   * Advanced analysis using workflow context
   */
  public async analyzeWithWorkflowContext(
    query: string, 
    analysisType: string
  ): Promise<string> {
    try {
      if (!this.workflowInstanceId) {
        throw new Error('No workflow context available. Please provide a workflowInstanceId.');
      }
      
      // Get workflow context
      const workflowContext = await workflowservice.getWorkflowContext(
        this.workflowInstanceId,
        this.tenantId
      );
      
      if (!workflowContext || !workflowContext.workflow) {
        throw new Error('Could not retrieve workflow context.');
      }
      
      // Get Excel data via standard query
      const queryResult = await this.queryData(query);
      
      // Format workflow context for LLM
      const contextPrompt = `
Current workflow: ${workflowContext.workflow.template.name}
Current step: ${workflowContext.workflow.currentStep.name}
Step description: ${workflowContext.workflow.currentStep.description || 'N/A'}
Step required outputs: ${workflowContext.workflow.currentStep.requiredOutputs?.join(', ') || 'None'}
      `;
      
      // Use LLM to perform analysis with workflow context
      const llm = new ChatOpenAI({ temperature: 0.2 });
      const analysis = await llm.predict(
        `You are an Excel data analysis expert working within a business workflow.
        
Workflow Context:
${contextPrompt}

Excel Data:
${queryResult}

Analysis Request: ${query}

Analysis Type: ${analysisType}

Based on the workflow context and Excel data, provide a detailed ${analysisType} analysis with insights, patterns, and recommendations that are relevant to the current workflow step. Focus on producing actionable insights that help the user move forward in their workflow.`
      );
      
      // Record a workflow decision event
      if (this.workflowTemplateIntegration && this.conversationId) {
        await this.workflowTemplateIntegration.recordWorkflowDecisionEvent(
          this.workflowInstanceId,
          this.conversationId,
          `excel_${analysisType}_analysis_completed`,
          ['proceed_with_recommendations', 'request_more_data', 'refine_analysis'],
          'Analysis complete with recommendations based on Excel data',
          { 
            analysisType,
            query,
            insightCount: analysis.split('\n').filter(line => line.trim().startsWith('-')).length
          }
        );
      }
      
      return analysis;
    } catch (error) {
      console.error('Error in analyzeWithWorkflowContext:', error);
      // Fall back to standard analysis
      return this.standardAnalysis(query);
    }
  }
  
  /**
   * Standard analysis without workflow context
   */
  private async standardAnalysis(query: string): Promise<string> {
    try {
      const data = await this.queryData(query);
      const llm = new ChatOpenAI({ temperature: 0.2 });
      return await llm.predict(
        `You are an Excel data analysis expert. Analyze the following data from an Excel file:
        
${data}

Analysis request: ${query}

Provide a detailed analysis with insights, patterns, and recommendations.`
      );
    } catch (err: any) {
      return `Error analyzing data: ${err.message}`;
    }
  }
  
  /**
   * Record Excel analysis results to workflow step data
   */
  public async recordToWorkflow(
    stepId: string,
    outputKey: string,
    data: any
  ): Promise<boolean> {
    if (!this.workflowInstanceId) {
      console.error('No workflow instance ID provided');
      return false;
    }
    
    try {
      // Get current workflow instance
      const instance = await workflowservice.getInstance(
        this.workflowInstanceId,
        this.tenantId
      );
      
      if (!instance) {
        console.error('Workflow instance not found');
        return false;
      }
      
      // Only update if we're on the expected step
      if (instance.currentStepId !== stepId) {
        console.error(`Current step (${instance.currentStepId}) does not match expected step (${stepId})`);
        return false;
      }
      
      // Build the updated data object with our new output
      const updatedData = {
        ...instance.data,
        [outputKey]: data
      };
      
      // Update the workflow instance
      const updated = await workflowservice.updateInstanceData(
        this.workflowInstanceId,
        updatedData,
        this.tenantId
      );
      
      if (!updated) {
        console.error('Failed to update workflow instance data');
        return false;
      }
      
      // Update dynamic template if integration exists
      if (this.workflowTemplateIntegration && this.conversationId) {
        await this.workflowTemplateIntegration.updateDynamicTemplateFromWorkflowState(
          this.workflowInstanceId,
          this.conversationId
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error recording to workflow:', error);
      return false;
    }
  }
  
  /**
   * Handle MCWA-enhanced tool calls
   */
  public async _call(input: string): Promise<string> {
    const parsed = JSON.parse(input);
    const { operation, workflowInstanceId } = parsed;
    
    // Update workflow instance ID if provided
    if (workflowInstanceId) {
      this.workflowInstanceId = workflowInstanceId;
    }
    
    // Handle MCWA-specific operations
    if (operation === 'workflow_analyze') {
      const { query, analysisType } = parsed;
      if (!query) return 'Error: Query is required for workflow_analyze operation';
      if (!analysisType) return 'Error: Analysis type is required for workflow_analyze operation';
      
      try {
        return await this.analyzeWithWorkflowContext(query, analysisType);
      } catch (err: any) {
        return `Error in workflow analysis: ${err.message}`;
      }
    }
    
    if (operation === 'record_to_workflow') {
      const { stepId, outputKey, data } = parsed;
      if (!stepId) return 'Error: Step ID is required for record_to_workflow operation';
      if (!outputKey) return 'Error: Output key is required for record_to_workflow operation';
      if (!data) return 'Error: Data is required for record_to_workflow operation';
      
      try {
        const success = await this.recordToWorkflow(stepId, outputKey, data);
        return success 
          ? `Successfully recorded ${outputKey} to workflow step ${stepId}` 
          : `Failed to record ${outputKey} to workflow step ${stepId}`;
      } catch (err: any) {
        return `Error recording to workflow: ${err.message}`;
      }
    }
    
    // For standard operations, delegate to parent class
    return super._call(input);
  }
}

/**
 * Create an MCWA-enhanced Excel analyst agent
 */
export async function createMCWAExcelAnalystAgent(options?: {
  name?: string;
  verbose?: boolean;
  maxIterations?: number;
  userId?: string;
  sessionId?: string;
  conversationId?: string;
  tenantId?: string;
  workflowInstanceId?: string;
}): Promise<any> {
  const mcwaExcelTool = new MCWAExcelAnalysisTool({
    userId: options?.userId,
    sessionId: options?.sessionId,
    conversationId: options?.conversationId,
    tenantId: options?.tenantId,
    workflowInstanceId: options?.workflowInstanceId
  });
  
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL_NAME || 'gpt-4',
    temperature: 0.2,
    verbose: options?.verbose ?? false
  });
  
  const agent: any = {
    name: options?.name || 'MCWA Excel Analyst',
    goal: 'Analyze Excel files with workflow awareness and provide contextually relevant insights',
    backstory: 'You are an expert data analyst specializing in Excel analysis with meta-cognitive workflow awareness. You understand the business context of your analyses and can provide insights that align with the current step in a business workflow. You leverage both structured data analysis and contextual business knowledge.',
    verbose: options?.verbose ?? false,
    allowDelegation: false,
    tools: [mcwaExcelTool],
    llm: model,
    maxIterations: options?.maxIterations ?? 5
  };
  
  return agent;
}

/**
 * MCWA-enhanced Excel analysis tasks
 */
export const mcwaExcelAnalysisTasks = {
  analyzeExcelFileWithWorkflow:
    (filePath: string, analysisQuery: string, workflowInstanceId: string, analysisType: string = 'comprehensive') => ({
      description: `Analyze the Excel file at ${filePath} within workflow context ${workflowInstanceId} with objective: ${analysisQuery}`,
      expected_output: 'A detailed workflow-aware analysis with insights, patterns, and recommendations',
      agent_scratchpad: '',
      async execute({ agent }: { agent: any }) {
        try {
          // Load the file
          const loadResult = await agent.invoke(JSON.stringify({ 
            operation: 'load', 
            filePath,
            workflowInstanceId
          }));
          console.log('Excel file loaded:', loadResult);
          
          // Perform workflow-aware analysis
          const analysisResult = await agent.invoke(JSON.stringify({ 
            operation: 'workflow_analyze', 
            query: analysisQuery,
            analysisType,
            workflowInstanceId
          }));
          
          return analysisResult;
        } catch (err: any) {
          console.error('Error executing workflow Excel analysis task:', err);
          return `Failed to analyze Excel file with workflow context: ${err.message}`;
        }
      }
    }),
    
  recordExcelInsightsToWorkflow:
    (filePath: string, query: string, workflowInstanceId: string, stepId: string, outputKey: string) => ({
      description: `Analyze Excel data and record insights to workflow step ${stepId} as ${outputKey}`,
      expected_output: 'Excel analysis insights recorded to workflow step',
      agent_scratchpad: '',
      async execute({ agent }: { agent: any }) {
        try {
          // Load the file
          await agent.invoke(JSON.stringify({ 
            operation: 'load', 
            filePath,
            workflowInstanceId
          }));
          
          // Analyze the data
          const analysis = await agent.invoke(JSON.stringify({ 
            operation: 'analyze', 
            query,
            workflowInstanceId
          }));
          
          // Record to workflow
          const recordResult = await agent.invoke(JSON.stringify({
            operation: 'record_to_workflow',
            stepId,
            outputKey,
            data: {
              analysis,
              timestamp: new Date().toISOString(),
              source: filePath
            },
            workflowInstanceId
          }));
          
          return `${recordResult}\n\nAnalysis summary: ${analysis.substring(0, 200)}...`;
        } catch (err: any) {
          console.error('Error recording Excel insights to workflow:', err);
          return `Failed to record Excel insights to workflow: ${err.message}`;
        }
      }
    })
};
