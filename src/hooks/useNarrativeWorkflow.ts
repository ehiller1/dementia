import { useState, useCallback, useRef } from 'react';
import { NarrativeWorkflowOrchestrator, NarrativeContext, WorkflowOrchestrationResult } from '../services/NarrativeWorkflowOrchestrator.ts';

export interface UseNarrativeWorkflowOptions {
  tenantId?: string;
  userId?: string;
  enableLogging?: boolean;
}

export interface NarrativeWorkflowState {
  isProcessing: boolean;
  currentContext: NarrativeContext | null;
  lastResult: WorkflowOrchestrationResult | null;
  error: string | null;
  workflowHistory: WorkflowOrchestrationResult[];
}

/**
 * React hook for managing narrative workflow orchestration in the UI
 * 
 * This hook provides:
 * - Integration with the Narrative Workflow Orchestrator
 * - State management for multi-turn conversations
 * - Error handling and loading states
 * - Workflow history tracking
 */
export function useNarrativeWorkflow(options?: UseNarrativeWorkflowOptions) {
  const [state, setState] = useState<NarrativeWorkflowState>({
    isProcessing: false,
    currentContext: null,
    lastResult: null,
    error: null,
    workflowHistory: []
  });

  const orchestratorRef = useRef<NarrativeWorkflowOrchestrator | null>(null);

  // Initialize orchestrator lazily
  const getOrchestrator = useCallback(() => {
    if (!orchestratorRef.current) {
      orchestratorRef.current = new NarrativeWorkflowOrchestrator({
        tenantId: options?.tenantId,
        userId: options?.userId
      });
    }
    return orchestratorRef.current;
  }, [options?.tenantId, options?.userId]);

  /**
   * Initialize a new narrative workflow context
   */
  const initializeWorkflow = useCallback(async (
    conversationId: string,
    userIntent: string,
    domainContext: Record<string, any> = {}
  ) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const orchestrator = getOrchestrator();
      const context = await orchestrator.initializeNarrativeContext(
        conversationId,
        userIntent,
        domainContext
      );

      setState(prev => ({
        ...prev,
        currentContext: context,
        isProcessing: false,
        workflowHistory: []
      }));

      if (options?.enableLogging) {
        console.log('🔄 Narrative workflow initialized:', context);
      }

      return context;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize workflow';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false
      }));
      throw error;
    }
  }, [getOrchestrator, options?.enableLogging]);

  /**
   * Process a user input through the narrative workflow
   */
  const processUserInput = useCallback(async (
    userInput: string,
    context?: NarrativeContext
  ): Promise<WorkflowOrchestrationResult> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const orchestrator = getOrchestrator();
      const workflowContext = context || state.currentContext;

      if (!workflowContext) {
        throw new Error('No workflow context available. Please initialize workflow first.');
      }

      if (options?.enableLogging) {
        console.log('🔄 Processing user input through narrative workflow:', userInput);
        console.log('📋 Current context:', workflowContext);
      }

      const result = await orchestrator.orchestrateWorkflowStep(userInput, workflowContext);

      setState(prev => ({
        ...prev,
        currentContext: result.updatedContext,
        lastResult: result,
        isProcessing: false,
        workflowHistory: [...prev.workflowHistory, result]
      }));

      if (options?.enableLogging) {
        console.log('✅ Workflow step completed:', result);
        console.log('📝 Narrative response:', result.narrativeResponse);
        console.log('🎯 Suggested next action:', result.suggestedNextAction);
        console.log('🧠 Memory updates:', result.memoryUpdates);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process user input';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false
      }));
      throw error;
    }
  }, [getOrchestrator, state.currentContext, options?.enableLogging]);

  /**
   * Continue workflow with suggested next action
   */
  const continueWithSuggestedAction = useCallback(async (
    actionInput?: string
  ): Promise<WorkflowOrchestrationResult> => {
    if (!state.lastResult?.suggestedNextAction) {
      throw new Error('No suggested action available');
    }

    const input = actionInput || state.lastResult.suggestedNextAction.description;
    return processUserInput(input);
  }, [state.lastResult, processUserInput]);

  /**
   * Get workflow insights and recommendations
   */
  const getWorkflowInsights = useCallback(() => {
    if (!state.currentContext) return null;

    const allInsights = state.workflowHistory.flatMap(result => 
      result.workflowSteps
        .filter(step => step.output.insights)
        .flatMap(step => step.output.insights)
    );

    const allRecommendations = state.workflowHistory.flatMap(result =>
      result.workflowSteps
        .filter(step => step.output.recommendations)
        .flatMap(step => step.output.recommendations)
    );

    return {
      currentPhase: state.currentContext.currentPhase,
      thematicThread: state.currentContext.thematicThread,
      accumulatedInsights: state.currentContext.accumulatedInsights,
      allInsights,
      allRecommendations,
      workflowSteps: state.workflowHistory.flatMap(result => result.workflowSteps),
      suggestedNextAction: state.lastResult?.suggestedNextAction
    };
  }, [state.currentContext, state.workflowHistory, state.lastResult]);

  /**
   * Reset workflow state
   */
  const resetWorkflow = useCallback(() => {
    setState({
      isProcessing: false,
      currentContext: null,
      lastResult: null,
      error: null,
      workflowHistory: []
    });

    if (options?.enableLogging) {
      console.log('🔄 Workflow state reset');
    }
  }, [options?.enableLogging]);

  /**
   * Update workflow context manually
   */
  const updateWorkflowContext = useCallback((
    updates: Partial<NarrativeContext>
  ) => {
    setState(prev => ({
      ...prev,
      currentContext: prev.currentContext ? {
        ...prev.currentContext,
        ...updates
      } : null
    }));

    if (options?.enableLogging) {
      console.log('📝 Workflow context updated:', updates);
    }
  }, [options?.enableLogging]);

  /**
   * Get current workflow phase information
   */
  const getCurrentPhaseInfo = useCallback(() => {
    if (!state.currentContext) return null;

    const phaseDescriptions = {
      discovery: 'Exploring and understanding the problem space',
      analysis: 'Analyzing data and generating insights',
      decision: 'Evaluating options and making decisions',
      action: 'Implementing solutions and taking action',
      reflection: 'Reviewing outcomes and learning from results'
    };

    return {
      phase: state.currentContext.currentPhase,
      description: phaseDescriptions[state.currentContext.currentPhase],
      progress: state.workflowHistory.length,
      thematicThread: state.currentContext.thematicThread
    };
  }, [state.currentContext, state.workflowHistory]);

  /**
   * Check if workflow can continue
   */
  const canContinueWorkflow = useCallback(() => {
    return !state.isProcessing && 
           state.currentContext !== null && 
           state.error === null;
  }, [state.isProcessing, state.currentContext, state.error]);

  /**
   * Get workflow statistics
   */
  const getWorkflowStats = useCallback(() => {
    return {
      totalSteps: state.workflowHistory.length,
      totalWorkflowSteps: state.workflowHistory.flatMap(r => r.workflowSteps).length,
      averageStepDuration: state.workflowHistory.length > 0 
        ? state.workflowHistory.flatMap(r => r.workflowSteps)
            .filter(s => s.metadata.duration)
            .reduce((sum, s) => sum + (s.metadata.duration || 0), 0) / 
          state.workflowHistory.flatMap(r => r.workflowSteps).length
        : 0,
      currentPhase: state.currentContext?.currentPhase,
      hasError: state.error !== null
    };
  }, [state.workflowHistory, state.currentContext, state.error]);

  return {
    // State
    ...state,
    
    // Actions
    initializeWorkflow,
    processUserInput,
    continueWithSuggestedAction,
    resetWorkflow,
    updateWorkflowContext,
    
    // Getters
    getWorkflowInsights,
    getCurrentPhaseInfo,
    getWorkflowStats,
    
    // Utilities
    canContinueWorkflow,
    
    // Computed properties
    hasActiveWorkflow: state.currentContext !== null,
    isReady: !state.isProcessing && state.error === null,
    workflowProgress: state.workflowHistory.length
  };
}
