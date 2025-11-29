import React, { useState, useEffect } from 'react';
import { SimulationService, SimulationResult, ProjectedOutcome } from '../services/SimulationService.js';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScenarioSimulationManagerProps {
  decisionId: string | null;
  conversationId: string;
  tenantId?: string;
  onSimulationComplete?: (result: SimulationResult) => void;
  onBack: () => void;
  onCommit?: () => void;
}

const ScenarioSimulationManager: React.FC<ScenarioSimulationManagerProps> = ({
  decisionId,
  conversationId,
  tenantId,
  onSimulationComplete,
  onBack,
  onCommit
}) => {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationService] = useState(() => new SimulationService({ tenantId }));

  useEffect(() => {
    // Only run simulation when decisionId is provided
    if (decisionId) {
      runSimulation();
    }
  }, [decisionId, conversationId]);

  const runSimulation = async () => {
    if (!decisionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the SimulationService to run the simulation
      const result = await simulationService.simulateScenario(decisionId, conversationId);
      
      setSimulationResult(result);
      
      // Notify parent component if callback provided
      if (onSimulationComplete) {
        onSimulationComplete(result);
      }
    } catch (error) {
      console.error('Error running simulation:', error);
      setError('Failed to run simulation: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!decisionId || !simulationResult) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call an API to commit the decision
      // For now, we'll simulate the API call
      await fetch(`/api/decisions/${decisionId}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          simulation_result_id: simulationResult.id 
        }),
      });
      
      // Call the onCommit callback if provided
      if (onCommit) {
        onCommit();
      } else {
        // Default behavior: return to previous view
        onBack();
      }
    } catch (error) {
      console.error('Error committing decision:', error);
      setError('Failed to commit decision: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!decisionId) {
    return null;
  }

  return (
    <Card className="p-4 bg-white">
      <h2 className="text-lg font-semibold mb-3">Scenario Simulator</h2>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-pulse text-gray-600">Simulating scenario...</div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm py-2">{error}</div>
      ) : simulationResult ? (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Scenario Projection</h3>
            <p className="text-sm text-gray-800 whitespace-pre-line">{simulationResult.scenario_text}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Projected Outcomes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {simulationResult.projected_outcomes.map((outcome, index) => (
                <div key={index} className="border rounded-md p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{outcome.metric}</span>
                    <Badge variant={getConfidenceBadgeVariant(outcome.confidence)}>
                      {Math.round(outcome.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <div className="text-lg font-bold">
                    {outcome.value} {outcome.unit}
                  </div>
                  <div className="text-xs text-gray-500">
                    {outcome.timeframe}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <Badge variant={getConfidenceBadgeVariant(simulationResult.confidence_score)}>
                Overall confidence: {Math.round(simulationResult.confidence_score * 100)}%
              </Badge>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCommit}
                disabled={loading}
                className="bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600"
              >
                🚀 Commit Decision
              </button>
              <button
                onClick={onBack}
                className="bg-gray-200 text-gray-700 rounded px-3 py-1 hover:bg-gray-300"
              >
                ↩️ Back
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">No simulation data available</p>
        </div>
      )}
    </Card>
  );
};

// Helper function to get badge variant based on confidence score
const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "destructive" | "outline" => {
  if (confidence >= 0.7) return "default"; // Green
  if (confidence >= 0.4) return "secondary"; // Yellow/Orange
  return "destructive"; // Red
};

export default ScenarioSimulationManager;
