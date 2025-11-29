/**
 * Context Pack Visualizer Component
 * 
 * Visualizes function-specific context packs with grain, facts, constraints, actions
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Database,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface ContextPack {
  id: string;
  functionName: string;
  grainOfAnalysis: {
    product?: { skuId?: string; choiceSetId?: string; categoryId?: string };
    location?: { storeId?: string; regionId?: string };
    time?: { dayId?: string; weekId?: string; monthId?: string };
  };
  facts: Record<string, any>;
  constraints: Record<string, any>;
  feasibleActions: Array<{
    id: string;
    type: string;
    payload: any;
    expectedDelta: any;
    resourceUsage: any;
  }>;
  version: string;
  generatedAt: string;
}

interface ContextPackVisualizerProps {
  contextPackIds: string[];
}

export const ContextPackVisualizer: React.FC<ContextPackVisualizerProps> = ({
  contextPackIds
}) => {
  const [contextPacks, setContextPacks] = useState<ContextPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPacks, setExpandedPacks] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    fetchContextPacks();
  }, [contextPackIds]);

  const fetchContextPacks = async () => {
    setLoading(true);
    try {
      const packs = await Promise.all(
        contextPackIds.map(async (id) => {
          const response = await fetch(`/api/context-packs/${id}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        })
      );
      setContextPacks(packs.filter(p => p !== null));
    } catch (error) {
      console.error('[ContextPackVisualizer] Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePack = (packId: string) => {
    setExpandedPacks(prev => ({
      ...prev,
      [packId]: !prev[packId]
    }));
  };

  const toggleSection = (packId: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [packId]: {
        ...(prev[packId] || {}),
        [section]: !prev[packId]?.[section]
      }
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading context packs...
      </div>
    );
  }

  if (contextPacks.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">No context packs found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <Info className="w-5 h-5" />
          <span className="font-medium">Context Packs Overview</span>
        </div>
        <div className="text-sm text-blue-600">
          {contextPacks.length} function-specific context pack{contextPacks.length !== 1 ? 's' : ''} generated with aligned grain of analysis
        </div>
      </div>

      {/* Context Packs */}
      {contextPacks.map((pack) => (
        <div key={pack.id} className="bg-white rounded-lg border border-gray-200">
          {/* Pack Header */}
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => togglePack(pack.id)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Box className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{pack.functionName}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span>{pack.feasibleActions.length} actions</span>
                  <span>•</span>
                  <span>{new Date(pack.generatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            {expandedPacks[pack.id] ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Pack Details */}
          {expandedPacks[pack.id] && (
            <div className="border-t border-gray-100 p-4 space-y-4">
              {/* Grain of Analysis */}
              <Section
                icon={<Box className="w-4 h-4" />}
                title="Grain of Analysis"
                color="purple"
                expanded={expandedSections[pack.id]?.grain || false}
                onToggle={() => toggleSection(pack.id, 'grain')}
              >
                <GrainDisplay grain={pack.grainOfAnalysis} />
              </Section>

              {/* Facts */}
              <Section
                icon={<Database className="w-4 h-4" />}
                title="Facts"
                color="blue"
                expanded={expandedSections[pack.id]?.facts || false}
                onToggle={() => toggleSection(pack.id, 'facts')}
                badge={Object.keys(pack.facts).length}
              >
                <FactsDisplay facts={pack.facts} functionName={pack.functionName} />
              </Section>

              {/* Constraints */}
              <Section
                icon={<Shield className="w-4 h-4" />}
                title="Constraints"
                color="orange"
                expanded={expandedSections[pack.id]?.constraints || false}
                onToggle={() => toggleSection(pack.id, 'constraints')}
                badge={Object.keys(pack.constraints).length}
              >
                <ConstraintsDisplay constraints={pack.constraints} />
              </Section>

              {/* Feasible Actions */}
              <Section
                icon={<Zap className="w-4 h-4" />}
                title="Feasible Actions"
                color="green"
                expanded={expandedSections[pack.id]?.actions || false}
                onToggle={() => toggleSection(pack.id, 'actions')}
                badge={pack.feasibleActions.length}
              >
                <ActionsDisplay actions={pack.feasibleActions} />
              </Section>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Section Component
 */
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  color: 'purple' | 'blue' | 'orange' | 'green';
  expanded: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}> = ({ icon, title, color, expanded, onToggle, badge, children }) => {
  const colors = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${colors[color]}`}>
            {icon}
          </div>
          <span className="font-medium text-gray-900">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </div>
      {expanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Grain Display
 */
const GrainDisplay: React.FC<{ grain: any }> = ({ grain }) => {
  return (
    <div className="space-y-2">
      {grain.product && (
        <GrainItem
          label="Product"
          values={[
            grain.product.skuId && `SKU: ${grain.product.skuId}`,
            grain.product.choiceSetId && `Choice Set: ${grain.product.choiceSetId}`,
            grain.product.categoryId && `Category: ${grain.product.categoryId}`
          ].filter(Boolean)}
        />
      )}
      {grain.location && (
        <GrainItem
          label="Location"
          values={[
            grain.location.storeId && `Store: ${grain.location.storeId}`,
            grain.location.regionId && `Region: ${grain.location.regionId}`
          ].filter(Boolean)}
        />
      )}
      {grain.time && (
        <GrainItem
          label="Time"
          values={[
            grain.time.dayId && `Day: ${grain.time.dayId}`,
            grain.time.weekId && `Week: ${grain.time.weekId}`,
            grain.time.monthId && `Month: ${grain.time.monthId}`
          ].filter(Boolean)}
        />
      )}
    </div>
  );
};

const GrainItem: React.FC<{ label: string; values: string[] }> = ({ label, values }) => {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-medium text-gray-500 min-w-[80px]">{label}:</span>
      <div className="flex-1 space-y-1">
        {values.map((value, idx) => (
          <div key={idx} className="text-sm text-gray-900">{value}</div>
        ))}
      </div>
    </div>
  );
};

/**
 * Facts Display
 */
const FactsDisplay: React.FC<{
  facts: Record<string, any>;
  functionName: string;
}> = ({ facts, functionName }) => {
  return (
    <div className="space-y-2">
      {Object.entries(facts).map(([key, value]) => (
        <div key={key} className="p-2 bg-white rounded border border-gray-200">
          <div className="text-xs font-medium text-gray-500 mb-1">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </div>
          <div className="text-sm text-gray-900">
            {typeof value === 'object' 
              ? JSON.stringify(value, null, 2)
              : String(value)
            }
          </div>
        </div>
      ))}
      {Object.keys(facts).length === 0 && (
        <div className="text-sm text-gray-500 italic">No facts available</div>
      )}
    </div>
  );
};

/**
 * Constraints Display
 */
const ConstraintsDisplay: React.FC<{
  constraints: Record<string, any>;
}> = ({ constraints }) => {
  return (
    <div className="space-y-2">
      {Object.entries(constraints).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
          <span className="text-sm font-medium text-gray-700">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <span className="text-sm text-gray-900 font-semibold">
            {typeof value === 'number' 
              ? value.toLocaleString()
              : String(value)
            }
          </span>
        </div>
      ))}
      {Object.keys(constraints).length === 0 && (
        <div className="text-sm text-gray-500 italic">No constraints defined</div>
      )}
    </div>
  );
};

/**
 * Actions Display
 */
const ActionsDisplay: React.FC<{
  actions: Array<any>;
}> = ({ actions }) => {
  return (
    <div className="space-y-2">
      {actions.map((action, idx) => (
        <div key={action.id || idx} className="p-3 bg-white rounded border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">{action.type}</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          {action.expectedDelta && (
            <div className="text-xs text-gray-600">
              GP: ${(action.expectedDelta.grossProfit || 0).toLocaleString()}
            </div>
          )}
        </div>
      ))}
      {actions.length === 0 && (
        <div className="text-sm text-gray-500 italic">No feasible actions generated</div>
      )}
    </div>
  );
};
