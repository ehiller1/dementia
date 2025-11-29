import React, { useState, useEffect } from 'react';
import AgentCompetitionArena from './AgentCompetitionArena';

interface ScenarioSimulatorProps {
  decisionId: string | null;
  onBack: () => void;
  onCommit?: () => void;
  demoMode?: boolean;
  onScenarioSelect?: (scenario: string, role: string, parameters: any) => void;
}

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  roles: string[];
  parameters: { [key: string]: { type: string; default: any; min?: number; max?: number; options?: string[] } };
}

interface SimulationResult {
  scenario_text: string;
  monte_carlo_results?: {
    revenue_impact: { mean: number; confidence_intervals: { [key: string]: number } };
    inventory_impact: { mean: number; confidence_intervals: { [key: string]: number } };
    customer_satisfaction: { mean: number; confidence_intervals: { [key: string]: number } };
    coordination_effectiveness: { mean: number; confidence_intervals: { [key: string]: number } };
  };
  role_specific_insights?: {
    operator?: string[];
    builder?: string[];
  };
}

type SimulatorMode = 'scenario' | 'competition' | 'dynamic_creation';

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ 
  decisionId, 
  onBack,
  onCommit,
  demoMode = false,
  onScenarioSelect
}) => {
  const [scenarioText, setScenarioText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Demo mode state
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [scenarioParameters, setScenarioParameters] = useState<{ [key: string]: any }>({});
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [isRunningSimulation, setIsRunningSimulation] = useState<boolean>(false);
  
  // New mode state
  const [simulatorMode, setSimulatorMode] = useState<SimulatorMode>('scenario');
  const [dynamicAgentRequest, setDynamicAgentRequest] = useState({
    query: '',
    intent: '',
    capabilities: [] as string[]
  });
  const [createdAgent, setCreatedAgent] = useState<any>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState<boolean>(false);

  const demoScenarios: DemoScenario[] = [
    {
      id: 'marketing_demand_spike',
      name: 'Marketing Demand Spike',
      description: 'CMO launches aggressive Q4 marketing campaign without operations coordination',
      roles: ['operator', 'builder', 'both'],
      parameters: {
        marketing_budget_increase: { type: 'number', default: 40, min: 10, max: 100 },
        expected_demand_lift: { type: 'number', default: 25, min: 5, max: 50 },
        inventory_preparation_weeks: { type: 'number', default: 2, min: 1, max: 8 },
        campaign_duration_weeks: { type: 'number', default: 8, min: 4, max: 16 }
      }
    },
    {
      id: 'inventory_optimization_initiative',
      name: 'Inventory Optimization',
      description: 'CFO mandates inventory reduction to improve cash flow',
      roles: ['operator', 'builder', 'both'],
      parameters: {
        inventory_reduction_target: { type: 'number', default: 20, min: 5, max: 40 },
        cash_flow_improvement_goal: { type: 'number', default: 2000000, min: 500000, max: 5000000 },
        implementation_timeline_months: { type: 'number', default: 6, min: 3, max: 12 },
        service_level_maintenance: { type: 'number', default: 95, min: 85, max: 99 }
      }
    },
    {
      id: 'coordinated_growth_strategy',
      name: 'Coordinated Growth Strategy',
      description: 'Marketing and Operations coordinate for market expansion',
      roles: ['operator', 'builder', 'both'],
      parameters: {
        revenue_growth_target: { type: 'number', default: 35, min: 15, max: 60 },
        market_expansion_regions: { type: 'number', default: 3, min: 1, max: 8 },
        timeline_months: { type: 'number', default: 12, min: 6, max: 24 },
        investment_budget: { type: 'number', default: 5000000, min: 1000000, max: 15000000 }
      }
    }
  ];

  useEffect(() => {
    if (demoMode) {
      // Initialize with first scenario for demo mode
      if (demoScenarios.length > 0) {
        const firstScenario = demoScenarios[0];
        setSelectedScenario(firstScenario.id);
        setSelectedRole('operator');
        setScenarioParameters(
          Object.fromEntries(
            Object.entries(firstScenario.parameters).map(([key, param]) => [key, param.default])
          )
        );
      }
    } else if (decisionId) {
      fetchScenario();
    }
  }, [decisionId, demoMode]);

  const fetchScenario = async () => {
    if (!decisionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/scenarios/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision_id: decisionId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to simulate scenario');
      }
      
      const data = await response.json();
      
      if (data.scenario_text) {
        setScenarioText(data.scenario_text);
      } else {
        throw new Error('No scenario text returned');
      }
    } catch (error) {
      console.error('Error simulating scenario:', error);
      setError('Failed to simulate scenario');
    } finally {
      setLoading(false);
    }
  };

  const runDemoSimulation = async () => {
    if (!selectedScenario || !selectedRole) return;
    
    setIsRunningSimulation(true);
    setError(null);
    
    try {
      const response = await fetch('/api/scenarios/demo-simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario_id: selectedScenario,
          role: selectedRole,
          parameters: scenarioParameters
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to run demo simulation');
      }
      
      const data: SimulationResult = await response.json();
      setSimulationResults(data);
      setScenarioText(data.scenario_text);
      
      // Notify parent component if callback provided
      if (onScenarioSelect) {
        onScenarioSelect(selectedScenario, selectedRole, scenarioParameters);
      }
    } catch (error) {
      console.error('Error running demo simulation:', error);
      setError('Failed to run demo simulation');
    } finally {
      setIsRunningSimulation(false);
    }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setScenarioParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleCommit = async () => {
    if (!decisionId) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/decisions/${decisionId}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to commit decision');
      }
      
      if (onCommit) {
        onCommit();
      } else {
        onBack();
      }
    } catch (error) {
      console.error('Error committing decision:', error);
      setError('Failed to commit decision');
    } finally {
      setLoading(false);
    }
  };

  const createDynamicAgent = async () => {
    if (!dynamicAgentRequest.query || !dynamicAgentRequest.intent) return;
    
    setIsCreatingAgent(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agents/create-dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dynamicAgentRequest),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create dynamic agent');
      }
      
      const data = await response.json();
      setCreatedAgent(data);
      
    } catch (error) {
      console.error('Error creating dynamic agent:', error);
      setError('Failed to create dynamic agent');
    } finally {
      setIsCreatingAgent(false);
    }
  };

  // Monte Carlo parameters are now handled automatically - no user configuration needed
  const renderSimulationInfo = () => {
    return (
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📊 Automated Monte Carlo Analysis</h3>
        <p className="text-sm text-gray-600 mb-2">
          The system will automatically run Monte Carlo simulations with optimized parameters:
        </p>
        <ul className="text-xs text-gray-500 list-disc list-inside">
          <li>1000+ iterations for statistical significance</li>
          <li>Cross-functional impact modeling (marketing, inventory, customer service)</li>
          <li>Risk factor analysis with confidence intervals</li>
          <li>Optimization recommendations based on business objectives</li>
        </ul>
      </div>
    );
  };

  const renderMonteCarloResults = () => {
    if (!simulationResults?.monte_carlo_results) return null;
    
    const { monte_carlo_results } = simulationResults;
    
    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📊 Monte Carlo Simulation Results</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800">Revenue Impact</h4>
            <p className="text-sm">Mean: {(monte_carlo_results.revenue_impact.mean * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-600">
              90% CI: [{(monte_carlo_results.revenue_impact.confidence_intervals['0.1'] * 100).toFixed(1)}%, 
              {(monte_carlo_results.revenue_impact.confidence_intervals['0.9'] * 100).toFixed(1)}%]
            </p>
          </div>
          <div>
            <h4 className="font-medium text-green-800">Customer Satisfaction</h4>
            <p className="text-sm">Mean: {monte_carlo_results.customer_satisfaction.mean.toFixed(2)}/5</p>
            <p className="text-xs text-gray-600">
              90% CI: [{monte_carlo_results.customer_satisfaction.confidence_intervals['0.1'].toFixed(2)}, 
              {monte_carlo_results.customer_satisfaction.confidence_intervals['0.9'].toFixed(2)}]
            </p>
          </div>
          <div>
            <h4 className="font-medium text-orange-800">Inventory Impact</h4>
            <p className="text-sm">Mean: {(monte_carlo_results.inventory_impact.mean * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-600">
              90% CI: [{(monte_carlo_results.inventory_impact.confidence_intervals['0.1'] * 100).toFixed(1)}%, 
              {(monte_carlo_results.inventory_impact.confidence_intervals['0.9'] * 100).toFixed(1)}%]
            </p>
          </div>
          <div>
            <h4 className="font-medium text-purple-800">Coordination Effectiveness</h4>
            <p className="text-sm">Mean: {(monte_carlo_results.coordination_effectiveness.mean * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-600">
              90% CI: [{(monte_carlo_results.coordination_effectiveness.confidence_intervals['0.1'] * 100).toFixed(1)}%, 
              {(monte_carlo_results.coordination_effectiveness.confidence_intervals['0.9'] * 100).toFixed(1)}%]
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderRoleInsights = () => {
    if (!simulationResults?.role_specific_insights) return null;
    
    const insights = simulationResults.role_specific_insights;
    const roleInsights = selectedRole === 'both' ? 
      [...(insights.operator || []), ...(insights.builder || [])] :
      insights[selectedRole as keyof typeof insights] || [];
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">
          🎯 {selectedRole === 'operator' ? 'Operator' : selectedRole === 'builder' ? 'Builder' : 'Cross-Role'} Insights
        </h3>
        <ul className="space-y-2">
          {roleInsights.map((insight, index) => (
            <li key={index} className="text-sm flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (demoMode) {
    const selectedScenarioData = demoScenarios.find(s => s.id === selectedScenario);
    
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🎭 Interactive Scenario Simulation</h2>
          
          {/* Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSimulatorMode('scenario')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                simulatorMode === 'scenario' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Scenarios
            </button>
            <button
              onClick={() => setSimulatorMode('competition')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                simulatorMode === 'competition' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏆 Competition
            </button>
            <button
              onClick={() => setSimulatorMode('dynamic_creation')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                simulatorMode === 'dynamic_creation' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🤖 Create Agent
            </button>
          </div>
        </div>

        {simulatorMode === 'competition' ? (
          <AgentCompetitionArena demoMode={true} />
        ) : simulatorMode === 'dynamic_creation' ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">🤖 Dynamic Agent Creation</h3>
              <p className="text-gray-600">
                Describe a unique analysis need and we'll create a specialized agent on-demand
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Query</label>
                  <textarea
                    value={dynamicAgentRequest.query}
                    onChange={(e) => setDynamicAgentRequest(prev => ({...prev, query: e.target.value}))}
                    placeholder="Describe the analysis you need..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Intent Category</label>
                  <input
                    type="text"
                    value={dynamicAgentRequest.intent}
                    onChange={(e) => setDynamicAgentRequest(prev => ({...prev, intent: e.target.value}))}
                    placeholder="e.g., CUSTOMER_SUCCESS_OPTIMIZATION"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={createDynamicAgent}
                  disabled={isCreatingAgent || !dynamicAgentRequest.query || !dynamicAgentRequest.intent}
                  className={`w-full py-3 px-4 rounded-md font-medium ${
                    isCreatingAgent || !dynamicAgentRequest.query || !dynamicAgentRequest.intent
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {isCreatingAgent ? '🔄 Creating Agent...' : '🚀 Create Dynamic Agent'}
                </button>
              </div>

              <div className="space-y-4">
                {createdAgent && (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">Agent Created Successfully!</h4>
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {createdAgent.agentName}</p>
                      <p><strong>Confidence:</strong> {createdAgent.confidence}%</p>
                      <p><strong>Specialization:</strong> {createdAgent.specialization}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scenario</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => {
                    setSelectedScenario(e.target.value);
                    const scenario = demoScenarios.find(s => s.id === e.target.value);
                    if (scenario) {
                      setScenarioParameters(
                        Object.fromEntries(
                          Object.entries(scenario.parameters).map(([key, param]) => [key, param.default])
                        )
                      );
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {demoScenarios.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                  ))}
                </select>
                {selectedScenarioData && (
                  <p className="text-sm text-gray-600 mt-1">{selectedScenarioData.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Perspective</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedScenarioData?.roles.map(role => (
                    <option key={role} value={role}>
                      {role === 'operator' ? '⚡ Operator (Tactical)' : 
                       role === 'builder' ? '🏗️ Builder (Strategic)' : 
                       '🤝 Both Perspectives'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedScenarioData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Simulation Configuration</h3>
                  {renderSimulationInfo()}
                </div>
              )}

              <button
                onClick={runDemoSimulation}
                disabled={isRunningSimulation || !selectedScenario || !selectedRole}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  isRunningSimulation || !selectedScenario || !selectedRole
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isRunningSimulation ? '🔄 Running Analysis...' : '🚀 Run Automated Analysis'}
              </button>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">❌ {error}</p>
                </div>
              )}

              {scenarioText && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-lg font-semibold mb-2">📝 Scenario Analysis</h3>
                  <div className="text-sm whitespace-pre-wrap">{scenarioText}</div>
                </div>
              )}

              {renderMonteCarloResults()}
              {renderRoleInsights()}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ↩️ Back
          </button>
          <div className="text-sm text-gray-500">
            Interactive Demo Mode • {simulatorMode === 'competition' ? 'Agent Competition' : simulatorMode === 'dynamic_creation' ? 'Dynamic Agent Creation' : 'Monte Carlo Analysis'}
          </div>
        </div>
      </div>
    );
  }

  // Original decision-based simulation mode
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">🎯 Scenario Simulation</h2>
      
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-blue-500">🔄 Loading scenario...</div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-red-600">❌ {error}</p>
        </div>
      )}
      
      {scenarioText && !loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
          <h3 className="text-lg font-semibold mb-2">📊 Simulation Results</h3>
          <div className="text-sm whitespace-pre-wrap">{scenarioText}</div>
        </div>
      )}
      
      <div className="flex mt-4">
        <button
          onClick={handleCommit}
          disabled={loading || !!error}
          className={`bg-green-500 text-white rounded px-3 py-1 ${
            loading || !!error ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
          }`}
        >
          🚀 Commit Decision
        </button>
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-700 rounded px-3 py-1 ml-2 hover:bg-gray-300"
        >
          ↩️ Back to Decision Inbox
        </button>
      </div>
    </div>
  );
};

export default ScenarioSimulator;
