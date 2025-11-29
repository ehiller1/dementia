import React, { useState, useEffect } from 'react';
import LiveNarrativeStream from './LiveNarrativeStream.js';
import DecisionInbox from './DecisionInbox.js';
import ScenarioSimulator from './ScenarioSimulator.js';
import ExecutiveObservationPanel from './ExecutiveObservationPanel.js';

const BusinessDashboard: React.FC = () => {
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('📊 BusinessDashboard: Component mounted');
    console.log('📊 BusinessDashboard: Initializing business intelligence dashboard');
    
    return () => {
      console.log('📊 BusinessDashboard: Component unmounting');
    };
  }, []);

  useEffect(() => {
    if (activeDecisionId) {
      console.log('📊 BusinessDashboard: Active decision changed to:', activeDecisionId);
      console.log('📊 BusinessDashboard: Switching to scenario simulator view');
    } else {
      console.log('📊 BusinessDashboard: Returning to decision inbox view');
    }
  }, [activeDecisionId]);
  
  // Handler for when "Simulate" is clicked in DecisionInbox
  const handleSimulate = (decisionId: string) => {
    console.log('📊 BusinessDashboard: handleSimulate called for decision:', decisionId);
    setActiveDecisionId(decisionId);
  };
  
  // Handler for when "Back" is clicked in ScenarioSimulator
  const handleBack = () => {
    console.log('📊 BusinessDashboard: handleBack called, returning to decision inbox');
    setActiveDecisionId(null);
  };

  const handleObservationClick = (observation: any) => {
    console.log('📊 BusinessDashboard: Executive observation clicked:', observation);
    // Could navigate to detailed view or trigger specific actions
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Business Intelligence Dashboard</h1>
      
      {/* Executive Observations - Full Width at Top */}
      <div className="mb-6">
        <ExecutiveObservationPanel 
          onObservationClick={handleObservationClick}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Always visible LiveNarrativeStream */}
        <div className="space-y-6">
          <LiveNarrativeStream 
            maxEntries={10} 
          />
        </div>
        
        {/* Right column: Either DecisionInbox or ScenarioSimulator */}
        <div>
          {activeDecisionId ? (
            <ScenarioSimulator 
              decisionId={activeDecisionId} 
              onBack={handleBack} 
            />
          ) : (
            <DecisionInbox 
              onSimulate={handleSimulate} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
