'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SimulationService, SimulationResult } from '../services/SimulationService.js';
import { useEnhancedConversation } from './EnhancedConversationContext.js';

interface SimulationContextType {
  simulationService: SimulationService;
  activeSimulation: SimulationResult | null;
  isSimulating: boolean;
  simulationError: string | null;
  runSimulation: (decisionId: string, conversationId: string) => Promise<SimulationResult>;
  clearSimulation: () => void;
  commitSimulation: (decisionId: string) => Promise<void>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

interface SimulationProviderProps {
  children: ReactNode;
  tenantId?: string;
  userId?: string;
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({ 
  children, 
  tenantId,
  userId
}) => {
  const [simulationService] = useState(() => new SimulationService({ tenantId, userId }));
  const [activeSimulation, setActiveSimulation] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  
  const { addMessage } = useEnhancedConversation();

  const runSimulation = async (decisionId: string, conversationId: string): Promise<SimulationResult> => {
    setIsSimulating(true);
    setSimulationError(null);
    
    try {
      const result = await simulationService.simulateScenario(decisionId, conversationId);
      setActiveSimulation(result);
      
      // Add simulation result to conversation
      addMessage({
        role: 'assistant',
        content: `Simulation completed with ${Math.round(result.confidence_score * 100)}% confidence. The simulation projects: ${result.scenario_text.substring(0, 100)}...`,
        metadata: {
          responseType: 'SIMULATION',
          isSimulationNote: true,
          simulationResult: result
        }
      });
      
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setSimulationError(errorMessage);
      
      // Add error message to conversation
      addMessage({
        role: 'assistant',
        content: `Failed to run simulation: ${errorMessage}`,
        metadata: {
          responseType: 'SIMULATION',
          isSimulationNote: true,
          isError: true
        }
      });
      
      throw error;
    } finally {
      setIsSimulating(false);
    }
  };

  const clearSimulation = () => {
    setActiveSimulation(null);
    setSimulationError(null);
  };

  const commitSimulation = async (decisionId: string): Promise<void> => {
    if (!activeSimulation) {
      throw new Error('No active simulation to commit');
    }
    
    try {
      // In a real implementation, this would call an API to commit the decision
      // For now, we'll simulate the API call
      await fetch(`/api/decisions/${decisionId}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          simulation_result_id: activeSimulation.id 
        }),
      });
      
      // Add commit message to conversation
      addMessage({
        role: 'assistant',
        content: `Decision committed based on simulation results. Implementation planning will begin.`,
        metadata: {
          responseType: 'ACTION',
          isActionNote: true,
          decisionId,
          simulationResultId: activeSimulation.id
        }
      });
      
      // Clear the active simulation
      clearSimulation();
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Add error message to conversation
      addMessage({
        role: 'assistant',
        content: `Failed to commit decision: ${errorMessage}`,
        metadata: {
          responseType: 'ACTION',
          isActionNote: true,
          isError: true
        }
      });
      
      throw error;
    }
  };

  const value = {
    simulationService,
    activeSimulation,
    isSimulating,
    simulationError,
    runSimulation,
    clearSimulation,
    commitSimulation
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};
