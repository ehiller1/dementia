import React, { useState } from 'react';
import { EnhancedConversationInterfaceComponent } from './EnhancedConversationInterface.js';
import { ScenarioSimulationManager } from './ScenarioSimulationManager.js';
import { SimulationProvider } from '@/contexts/SimulationContext';
import { Card } from '@/components/ui/card';

/**
 * SimulationWorkflowContainer
 * 
 * This component integrates the EnhancedConversationInterface with the ScenarioSimulationManager
 * to provide a seamless workflow for decision-making and simulation.
 */
export const SimulationWorkflowContainer: React.FC = () => {
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);

  // Handler for when a decision is selected in the conversation interface
  const handleDecisionSelected = (decisionId: string) => {
    setActiveDecisionId(decisionId);
    setShowSimulation(true);
  };

  // Handler for when the simulation is closed
  const handleCloseSimulation = () => {
    setShowSimulation(false);
  };

  return (
    <SimulationProvider>
      <div className="flex flex-col gap-4 h-full">
        {showSimulation && activeDecisionId && (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Scenario Simulation</h3>
              <button 
                onClick={handleCloseSimulation}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <ScenarioSimulationManager decisionId={activeDecisionId} />
          </Card>
        )}
        
        <div className="flex-grow">
          <EnhancedConversationInterfaceComponent 
            onDecisionSelected={handleDecisionSelected} 
          />
        </div>
      </div>
    </SimulationProvider>
  );
};

export default SimulationWorkflowContainer;
