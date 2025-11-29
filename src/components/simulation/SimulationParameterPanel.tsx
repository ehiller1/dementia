/**
 * Simulation Parameter Panel
 * Interactive UI for manipulating simulation parameters with sliders
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, ChevronDown, ChevronUp, RotateCcw, 
  TrendingUp, TrendingDown, Target, Zap, Info 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ParameterSlider } from './ParameterSlider';
import { DistributionPicker } from './DistributionPicker';
import { ParameterSelect } from './ParameterSelect';
import { ParameterToggle } from './ParameterToggle';

interface ParameterDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  parameter_type: 'continuous' | 'discrete' | 'boolean' | 'distribution';
  data_type: string;
  default_value: any;
  current_value: any;
  constraints: any;
  category: string;
  affects_agents: string[];
  ui_component: string;
  is_advanced: boolean;
  has_override: boolean;
}

interface SimulationParameterPanelProps {
  decisionId: string;
  onParametersChange?: (params: Record<string, any>) => void;
  onRunSimulation?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  marketing: <TrendingUp className="w-4 h-4" />,
  inventory: <Target className="w-4 h-4" />,
  demand: <TrendingDown className="w-4 h-4" />,
  risk: <Zap className="w-4 h-4" />,
  simulation_config: <Settings className="w-4 h-4" />
};

const CATEGORY_COLORS: Record<string, string> = {
  marketing: 'bg-blue-500',
  inventory: 'bg-green-500',
  demand: 'bg-purple-500',
  risk: 'bg-red-500',
  simulation_config: 'bg-gray-500'
};

export const SimulationParameterPanel: React.FC<SimulationParameterPanelProps> = ({
  decisionId,
  onParametersChange,
  onRunSimulation
}) => {
  const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['marketing', 'inventory', 'demand'])
  );
  const [changedParams, setChangedParams] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchParameters();
  }, [decisionId, showAdvanced]);

  const fetchParameters = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/simulation/parameters/${decisionId}?includeAdvanced=${showAdvanced}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch parameters');
      }

      const data = await response.json();
      setParameters(data.data || []);
    } catch (err) {
      console.error('Error fetching parameters:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = async (parameterId: string, value: any) => {
    // Optimistic update
    setParameters(prev =>
      prev.map(p => p.id === parameterId ? { ...p, current_value: { value }, has_override: true } : p)
    );

    // Track changed parameters
    setChangedParams(prev => new Set(prev).add(parameterId));

    // Persist to backend
    try {
      await fetch(`/api/simulation/parameters/${decisionId}/${parameterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });

      // Notify parent
      if (onParametersChange) {
        const updatedParams = parameters.reduce((acc, p) => {
          acc[p.name] = p.id === parameterId ? value : p.current_value?.value;
          return acc;
        }, {} as Record<string, any>);
        onParametersChange(updatedParams);
      }
    } catch (err) {
      console.error('Error updating parameter:', err);
      // Revert optimistic update on error
      fetchParameters();
    }
  };

  const loadPreset = async (presetName: string) => {
    try {
      const response = await fetch(
        `/api/simulation/parameters/${decisionId}/preset/${presetName}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load preset');
      }

      await fetchParameters();
      setChangedParams(new Set());
    } catch (err) {
      console.error('Error loading preset:', err);
      setError((err as Error).message);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Reset all parameters to default values?')) {
      return;
    }

    try {
      await fetch(`/api/simulation/parameters/${decisionId}/reset`, {
        method: 'POST'
      });

      await fetchParameters();
      setChangedParams(new Set());
    } catch (err) {
      console.error('Error resetting parameters:', err);
      setError((err as Error).message);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const renderParameterControl = (param: ParameterDefinition) => {
    const value = param.current_value?.value ?? param.default_value?.value;
    const isChanged = changedParams.has(param.id);

    switch (param.ui_component) {
      case 'slider':
        return (
          <ParameterSlider
            parameter={param}
            value={value}
            onChange={(v) => handleParameterChange(param.id, v)}
            isChanged={isChanged}
          />
        );

      case 'distribution_picker':
        return (
          <DistributionPicker
            parameter={param}
            value={param.current_value || param.default_value}
            onChange={(v) => handleParameterChange(param.id, v)}
            isChanged={isChanged}
          />
        );

      case 'select':
        return (
          <ParameterSelect
            parameter={param}
            value={value}
            onChange={(v) => handleParameterChange(param.id, v)}
            isChanged={isChanged}
          />
        );

      case 'toggle':
        return (
          <ParameterToggle
            parameter={param}
            value={value}
            onChange={(v) => handleParameterChange(param.id, v)}
            isChanged={isChanged}
          />
        );

      default:
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleParameterChange(param.id, parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
          />
        );
    }
  };

  // Group parameters by category
  const groupedParams = parameters.reduce((acc, param) => {
    if (!acc[param.category]) {
      acc[param.category] = [];
    }
    acc[param.category].push(param);
    return acc;
  }, {} as Record<string, ParameterDefinition[]>);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading parameters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Error: {error}</p>
        <button onClick={fetchParameters} className="mt-2 text-sm text-blue-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="simulation-parameter-panel bg-white border rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Simulation Parameters</h3>
            {changedParams.size > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                {changedParams.size} changed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
            <button
              onClick={resetToDefaults}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Parameters by Category */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {Object.entries(groupedParams).map(([category, params]) => {
          const isExpanded = expandedCategories.has(category);
          const categoryChanges = params.filter(p => changedParams.has(p.id)).length;

          return (
            <div key={category} className="border rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${CATEGORY_COLORS[category]} text-white`}>
                    {CATEGORY_ICONS[category] || <Settings className="w-4 h-4" />}
                  </div>
                  <span className="font-medium text-gray-800 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({params.length} {params.length === 1 ? 'parameter' : 'parameters'})
                  </span>
                  {categoryChanges > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {categoryChanges} changed
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Category Parameters */}
              {isExpanded && (
                <div className="p-4 space-y-4 bg-white">
                  {params.map(param => (
                    <div key={param.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">
                            {param.display_name}
                          </label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{param.description}</p>
                                {param.affects_agents && param.affects_agents.length > 0 && (
                                  <p className="text-xs mt-2 text-gray-500">
                                    Affects: {param.affects_agents.join(', ')}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {param.has_override && (
                            <span className="text-xs text-blue-600 font-medium">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                      {renderParameterControl(param)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preset Scenarios */}
      <div className="p-4 border-t bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Preset Scenarios</h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => loadPreset('aggressive_growth')}
            className="px-4 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors font-medium"
          >
            🚀 Aggressive Growth
          </button>
          <button
            onClick={() => loadPreset('conservative')}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors font-medium"
          >
            🛡️ Conservative
          </button>
          <button
            onClick={() => loadPreset('baseline')}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors font-medium"
          >
            📊 Baseline
          </button>
        </div>
      </div>

      {/* Run Simulation Button */}
      {onRunSimulation && (
        <div className="p-4 border-t">
          <button
            onClick={onRunSimulation}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Run Simulation</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
