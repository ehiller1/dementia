import React, { useState } from 'react';
import EnhancedConversationInterfaceComponent from './EnhancedConversationInterface.js';
import { SimulationProvider } from '../contexts/SimulationContext.js';
import ScenarioSimulationManager from './ScenarioSimulationManager.js';
import { Card } from '@/components/ui/card';

interface EnhancedConversationInterfaceWithSimulationProps {
  tenantId?: string;
  userId?: string;
  conversationId: string;
}

/**
 * Enhanced Conversation Interface with Simulation Integration
 * 
 * This component wraps the EnhancedConversationInterface with SimulationProvider
 * and adds the ScenarioSimulationManager component to enable bidirectional memory flow
 * between templates and memory during simulation phases.
 */
const EnhancedConversationInterfaceWithSimulation: React.FC<EnhancedConversationInterfaceWithSimulationProps> = ({
  tenantId,
  userId,
  conversationId
}) => {
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState<boolean>(false);

  // Handler for when a decision is selected for simulation
  const handleDecisionSelected = (decisionId: string) => {
    setActiveDecisionId(decisionId);
    setShowSimulation(true);
  };

  // Handler for returning from simulation view
  const handleBackFromSimulation = () => {
    setShowSimulation(false);
  };

  return (
    <SimulationProvider tenantId={tenantId} userId={userId}>
      <div className="h-full">
        {showSimulation && activeDecisionId ? (
          <Card className="h-full overflow-auto p-4">
            <ScenarioSimulationManager
              decisionId={activeDecisionId}
              conversationId={conversationId}
              tenantId={tenantId}
              onBack={handleBackFromSimulation}
              onCommit={() => {
                // After committing, return to the conversation interface
                setShowSimulation(false);
                setActiveDecisionId(null);
              }}
            />
          </Card>
        ) : (
          <EnhancedConversationInterfaceComponent 
            onDecisionSelected={handleDecisionSelected}
          />
        )}
      </div>
    </SimulationProvider>
  );
};

export default EnhancedConversationInterfaceWithSimulation;
