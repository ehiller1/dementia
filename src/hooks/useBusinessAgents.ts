/**
 * useBusinessAgents.ts
 * 
 * Custom hook for managing business agent state and interactions.
 * Provides access to agent services, event subscriptions, and workflow state.
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ExcelAnalysisService } from '../services/ExcelAnalysisService.ts';
import { BusinessEventService } from '../services/BusinessEventService.ts';
import { BusinessAgentService } from '../services/BusinessAgentService.ts';
import { workflowservice } from '../services/workflowService.ts';

export interface AgentMessage {
  id: string;
  agentType: 'marketing' | 'inventory' | 'memory' | 'coordination' | 'system';
  messageType: 'alert' | 'insight' | 'recommendation' | 'simulation' | 'action' | 'info';
  content: string;
  timestamp: Date;
  data?: any;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'simulated' | 'approved' | 'rejected';
  data?: any;
}

export interface SimulationResult {
  id: string;
  decisionId: string;
  results: {
    salesLift: number;
    customerSatisfaction: number;
    inventoryUtilization: number;
    roi: number;
    riskReduction: number;
  };
  insights: string[];
  timestamp: Date;
}

export interface BusinessAgentsState {
  workflowInstanceId: string | null;
  messages: AgentMessage[];
  decisions: Decision[];
  simulations: SimulationResult[];
  narrativeContext: string;
  isAnalyzing: boolean;
  isRunningAgents: boolean;
  isSimulating: boolean;
  error: string | null;
}

export function useBusinessAgents(tenantId: string = 'default') {
  const [state, setState] = useState<BusinessAgentsState>({
    workflowInstanceId: null,
    messages: [],
    decisions: [],
    simulations: [],
    narrativeContext: '',
    isAnalyzing: false,
    isRunningAgents: false,
    isSimulating: false,
    error: null
  });
  
  // Services
  const excelService = new ExcelAnalysisService(tenantId);
  const eventService = new BusinessEventService(tenantId);
  const agentService = new BusinessAgentService(tenantId);
  const workflowservice = new workflowservice();
  
  // Add message to the conversation
  const addMessage = useCallback((message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const newMessage: AgentMessage = {
      id: uuidv4(),
      ...message,
      timestamp: new Date()
    };
    
    setState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, newMessage]
    }));
    
    return newMessage.id;
  }, []);
  
  // Add decision to the inbox
  const addDecision = useCallback((decision: Omit<Decision, 'id' | 'timestamp' | 'status'>) => {
    const newDecision: Decision = {
      id: uuidv4(),
      ...decision,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setState(prevState => ({
      ...prevState,
      decisions: [...prevState.decisions, newDecision]
    }));
    
    return newDecision.id;
  }, []);
  
  // Update narrative context
  const updateNarrativeContext = useCallback((context: string) => {
    setState(prevState => ({
      ...prevState,
      narrativeContext: context
    }));
  }, []);
  
  // Analyze Excel file
  const analyzeExcelFile = useCallback(async (filePath: string) => {
    try {
      setState(prevState => ({
        ...prevState,
        isAnalyzing: true,
        error: null
      }));
      
      // Create workflow instance
      const workflowInstanceId = uuidv4();
      
      // Add system message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: `Analyzing Excel file: ${filePath}`
      });
      
      // Analyze Excel file
      const results = await excelService.analyzeMarketingInventoryData(filePath, workflowInstanceId);
      
      // Update state with workflow instance ID
      setState(prevState => ({
        ...prevState,
        workflowInstanceId,
        isAnalyzing: false
      }));
      
      // Add Excel analysis message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: 'Excel analysis complete. Processing insights...'
      });
      
      // Update narrative context with analysis summary
      updateNarrativeContext(generateNarrativeFromAnalysis(results));
      
      // Process inventory alerts
      await agentService.processInventoryAlerts(results);
      
      return {
        workflowInstanceId,
        results
      };
    } catch (error) {
      console.error('Error analyzing Excel file:', error);
      
      setState(prevState => ({
        ...prevState,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Unknown error analyzing Excel file'
      }));
      
      // Add error message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: `Error analyzing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      throw error;
    }
  }, [addMessage, excelService, agentService, updateNarrativeContext]);
  
  // Run business agent workflow
  const runBusinessAgents = useCallback(async (workflowInstanceId: string, analysisResults: any) => {
    try {
      setState(prevState => ({
        ...prevState,
        isRunningAgents: true,
        error: null
      }));
      
      // Add system message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: 'Business agents are analyzing the data and generating insights...'
      });
      
      // Run business agent workflow
      const results = await agentService.runBusinessAgentWorkflow(workflowInstanceId, analysisResults);
      
      // Process marketing recommendations
      await agentService.processMarketingRecommendations(results);
      
      // Process institutional memory
      await agentService.processInstitutionalMemory(results);
      
      setState(prevState => ({
        ...prevState,
        isRunningAgents: false
      }));
      
      // Add completion message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: 'Business agents have completed their analysis and generated recommendations.'
      });
      
      return results;
    } catch (error) {
      console.error('Error running business agents:', error);
      
      setState(prevState => ({
        ...prevState,
        isRunningAgents: false,
        error: error instanceof Error ? error.message : 'Unknown error running business agents'
      }));
      
      // Add error message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: `Error running business agents: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      throw error;
    }
  }, [addMessage, agentService]);
  
  // Run simulation for a decision
  const simulateDecision = useCallback(async (decisionId: string) => {
    try {
      // Find the decision
      const decision = state.decisions.find(d => d.id === decisionId);
      if (!decision) {
        throw new Error(`Decision not found: ${decisionId}`);
      }
      
      setState(prevState => ({
        ...prevState,
        isSimulating: true,
        error: null
      }));
      
      // Add system message
      addMessage({
        agentType: 'coordination',
        messageType: 'simulation',
        content: `Simulating outcomes for recommendation: ${decision.title}`
      });
      
      // Publish simulation request
      await eventService.publishSimulationRequest({
        recommendationId: decisionId,
        originalProduct: decision.data.originalProduct,
        recommendedProduct: decision.data.recommendedProduct,
        reallocationPercentage: decision.data.reallocationPercentage
      });
      
      // Simulate scenario using the coordination agent
      const simulationResult = await agentService.simulateScenario({
        scenario: {
          decisionId,
          ...decision.data
        }
      });
      
      // Create simulation result
      const newSimulation: SimulationResult = {
        id: uuidv4(),
        decisionId,
        results: simulationResult.results,
        insights: simulationResult.insights,
        timestamp: new Date()
      };
      
      // Update state
      setState(prevState => {
        // Update decision status
        const updatedDecisions = prevState.decisions.map(d => 
          d.id === decisionId ? { ...d, status: 'simulated' } : d
        );
        
        return {
          ...prevState,
          decisions: updatedDecisions,
          simulations: [...prevState.simulations, newSimulation],
          isSimulating: false
        };
      });
      
      // Publish simulation result
      await eventService.publishSimulationResult({
        recommendationId: decisionId,
        originalProduct: decision.data.originalProduct,
        recommendedProduct: decision.data.recommendedProduct,
        reallocationPercentage: decision.data.reallocationPercentage,
        results: simulationResult.results
      });
      
      // Add simulation result message
      addMessage({
        agentType: 'coordination',
        messageType: 'simulation',
        content: `Simulation complete. The recommendation shows a ${simulationResult.results.salesLift * 100}% increase in sales and ${simulationResult.results.customerSatisfaction * 100}% customer satisfaction.`,
        data: newSimulation
      });
      
      return newSimulation;
    } catch (error) {
      console.error('Error simulating decision:', error);
      
      setState(prevState => ({
        ...prevState,
        isSimulating: false,
        error: error instanceof Error ? error.message : 'Unknown error simulating decision'
      }));
      
      // Add error message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: `Error simulating decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      throw error;
    }
  }, [state.decisions, addMessage, eventService, agentService]);
  
  // Approve a decision
  const approveDecision = useCallback(async (decisionId: string) => {
    try {
      // Find the decision
      const decision = state.decisions.find(d => d.id === decisionId);
      if (!decision) {
        throw new Error(`Decision not found: ${decisionId}`);
      }
      
      // Update decision status
      setState(prevState => ({
        ...prevState,
        decisions: prevState.decisions.map(d => 
          d.id === decisionId ? { ...d, status: 'approved' } : d
        )
      }));
      
      // Add approval message
      addMessage({
        agentType: 'system',
        messageType: 'action',
        content: `Decision approved: ${decision.title}`
      });
      
      // Capture decision in institutional memory
      await agentService.captureDecision({
        decision: {
          id: decisionId,
          title: decision.title,
          description: decision.description,
          data: decision.data,
          status: 'approved',
          timestamp: new Date().toISOString()
        }
      });
      
      // Add institutional memory message
      addMessage({
        agentType: 'memory',
        messageType: 'insight',
        content: `Decision captured: ${decision.title}. This will be available for future reference.`
      });
      
      return decisionId;
    } catch (error) {
      console.error('Error approving decision:', error);
      
      // Add error message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: `Error approving decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      throw error;
    }
  }, [state.decisions, addMessage, agentService]);
  
  // Reject a decision
  const rejectDecision = useCallback(async (decisionId: string) => {
    try {
      // Find the decision
      const decision = state.decisions.find(d => d.id === decisionId);
      if (!decision) {
        throw new Error(`Decision not found: ${decisionId}`);
      }
      
      // Update decision status
      setState(prevState => ({
        ...prevState,
        decisions: prevState.decisions.map(d => 
          d.id === decisionId ? { ...d, status: 'rejected' } : d
        )
      }));
      
      // Add rejection message
      addMessage({
        agentType: 'system',
        messageType: 'action',
        content: `Decision rejected: ${decision.title}`
      });
      
      // Capture decision in institutional memory
      await agentService.captureDecision({
        decision: {
          id: decisionId,
          title: decision.title,
          description: decision.description,
          data: decision.data,
          status: 'rejected',
          timestamp: new Date().toISOString()
        }
      });
      
      return decisionId;
    } catch (error) {
      console.error('Error rejecting decision:', error);
      
      // Add error message
      addMessage({
        agentType: 'system',
        messageType: 'info',
        content: `Error rejecting decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      throw error;
    }
  }, [state.decisions, addMessage, agentService]);
  
  // Set up event subscriptions
  useEffect(() => {
    // Subscribe to inventory alerts
    const inventoryAlertSubscription = eventService.subscribeToInventoryAlerts((event) => {
      const { payload } = event;
      
      // Add inventory alert message
      addMessage({
        agentType: 'inventory',
        messageType: 'alert',
        content: `Inventory Alert: ${payload.productName} (${payload.productId}) is forecasted to be below campaign expectations. Current inventory: ${payload.inventoryLevel}, Expected demand: ${payload.expectedDemand}.`,
        data: payload
      });
      
      // Update narrative context
      updateNarrativeContext(prevContext => 
        `${prevContext}\n\nInventory Alert: Product ${payload.productName} has insufficient inventory to meet expected campaign demand. Risk score: ${payload.riskScore * 100}%.`
      );
    });
    
    // Subscribe to marketing recommendations
    const marketingRecommendationSubscription = eventService.subscribeToMarketingRecommendations((event) => {
      const { payload } = event;
      
      // Add marketing recommendation message
      addMessage({
        agentType: 'marketing',
        messageType: 'recommendation',
        content: `Marketing Recommendation: Reduce promotional spend by ${payload.reallocationPercentage}% for ${payload.originalProductName}, reallocating budget toward ${payload.recommendedProductName} where inventory is ample.`,
        data: payload
      });
      
      // Add decision to inbox
      addDecision({
        title: `Campaign Reallocation: ${payload.originalProductName} → ${payload.recommendedProductName}`,
        description: `Recommend reducing promotional spend by ${payload.reallocationPercentage}% for ${payload.originalProductName}, reallocating budget toward ${payload.recommendedProductName} where inventory is ample.`,
        data: payload
      });
    });
    
    // Subscribe to institutional memory
    const institutionalMemorySubscription = eventService.subscribeToInstitutionalMemory((event) => {
      const { payload } = event;
      
      // Add institutional memory message
      addMessage({
        agentType: 'memory',
        messageType: 'insight',
        content: payload.content,
        data: payload
      });
      
      // Update narrative context
      if (payload.type === 'historical_context') {
        updateNarrativeContext(prevContext => 
          `${prevContext}\n\nHistorical Context: ${payload.content}`
        );
      }
    });
    
    // Subscribe to simulation results
    const simulationResultSubscription = eventService.subscribeToSimulationResults((event) => {
      const { payload } = event;
      
      // Update narrative context
      updateNarrativeContext(prevContext => 
        `${prevContext}\n\nSimulation Results: Reallocating budget from ${payload.originalProduct} to ${payload.recommendedProduct} shows a projected ${payload.results.salesLift * 100}% increase in sales and ${payload.results.customerSatisfaction * 100}% improvement in customer satisfaction.`
      );
    });
    
    // Clean up subscriptions
    return () => {
      inventoryAlertSubscription.unsubscribe();
      marketingRecommendationSubscription.unsubscribe();
      institutionalMemorySubscription.unsubscribe();
      simulationResultSubscription.unsubscribe();
    };
  }, [eventService, addMessage, addDecision, updateNarrativeContext]);
  
  // Helper function to generate narrative from analysis
  const generateNarrativeFromAnalysis = (results: any): string => {
    const { marketingAnalysis, inventoryAnalysis, mismatchAnalysis } = results;
    
    let narrative = 'Excel Analysis Summary:\n\n';
    
    // Marketing insights
    narrative += 'Marketing Insights:\n';
    marketingAnalysis.insights.forEach((insight: string) => {
      narrative += `- ${insight}\n`;
    });
    
    // Inventory insights
    narrative += '\nInventory Insights:\n';
    inventoryAnalysis.insights.forEach((insight: string) => {
      narrative += `- ${insight}\n`;
    });
    
    // Mismatch insights
    narrative += '\nPotential Mismatches:\n';
    mismatchAnalysis.insights.forEach((insight: string) => {
      narrative += `- ${insight}\n`;
    });
    
    return narrative;
  };
  
  return {
    ...state,
    analyzeExcelFile,
    runBusinessAgents,
    simulateDecision,
    approveDecision,
    rejectDecision,
    addMessage,
    updateNarrativeContext
  };
}
