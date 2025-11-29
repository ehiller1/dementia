import React, { useState, useEffect } from 'react';

// Types
interface RevenueImpact { min: number; max: number; expected: number; confidence: number; currency: string; }
interface SimulationMetrics { 
  revenueImpact: RevenueImpact; 
  successProbability: number; 
  timeToImpact: string;
  riskLevel: 'low' | 'medium' | 'high'; 
}

interface Scenario {
  name: string;
  probability: number;
  impact: string;
  metrics: {
    revenueImpact: number;
    successProbability: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface SimulationResult {
  simulation: {
    id: string;
    decisionId: string;
    status: 'completed' | 'failed' | 'running';
    metrics: SimulationMetrics;
    scenarios: Scenario[];
    recommendations: string[];
  };
}

interface SimulatorProps { 
  decisionId?: string | null; 
  onClose: () => void; 
}

const Simulator: React.FC<SimulatorProps> = ({ decisionId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult['simulation'] | null>(null);

  const runSimulation = async () => {
    if (!decisionId) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/decision-${decisionId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId })
      });
      if (!response.ok) throw new Error('API error');
      const data: SimulationResult = await response.json();
      setResult(data.simulation);
    } catch (err) {
      setError('Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (decisionId) runSimulation();
  }, [decisionId]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (!decisionId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 pb-4 z-10">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">Decision Simulation</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Running simulation...</p>
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">Error running simulation</p>
              <button
                onClick={runSimulation}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry Simulation
              </button>
            </div>
          </div>
        )}

        {!loading && !error && result && (
          <div className="p-6">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Simulation Complete</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Projected Revenue Impact</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(result.metrics.revenueImpact.expected)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Success Probability</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {(result.metrics.successProbability * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Time to Impact</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {result.metrics.timeToImpact}
                  </p>
                </div>
              </div>

              {result.scenarios && result.scenarios.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">Scenarios</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.scenarios.map((scenario, index) => (
                      <div key={index} className="border p-4 rounded-lg">
                        <h5 className="font-semibold">{scenario.name} Scenario</h5>
                        <p className="text-sm text-gray-600 mt-1">{scenario.impact}</p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Revenue Impact:</span>{' '}
                          {formatCurrency(scenario.metrics.revenueImpact)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Success:</span>{' '}
                          {(scenario.metrics.successProbability * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Simulator;
