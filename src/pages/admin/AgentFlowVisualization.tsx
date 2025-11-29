/**
 * Agent Flow Visualization
 * 
 * Interactive visualization of agent flows, categories, and interrelationships.
 * Shows data flow between agents with real-time status indicators.
 */

import React, { useState, useEffect } from 'react';
import {
  Database, Zap, GitBranch, Brain, Network, Workflow, 
  Mail, TrendingUp, Shield, Settings, FileSpreadsheet,
  ArrowRight, Circle, CheckCircle2, AlertCircle, XCircle,
  Info, X, Maximize2, Minimize2
} from 'lucide-react';

// Agent category definitions
const AGENT_CATEGORIES = {
  data_store: {
    name: 'Data Store Agents',
    icon: Database,
    color: 'blue',
    agents: [
      { id: 'campaign-history', name: 'Campaign History', stream: null },
      { id: 'marketing-mix', name: 'Marketing Mix', stream: null },
      { id: 'customers', name: 'Customers', stream: null },
      { id: 'inventory', name: 'Inventory', stream: null },
      { id: 'demand-forecast', name: 'Demand Forecast', stream: null },
      { id: 'cross-rmn', name: 'Cross RMN', stream: null },
      { id: 'sales-data', name: 'Sales Data', stream: null }
    ]
  },
  event_monitoring: {
    name: 'Event Monitoring',
    icon: Mail,
    color: 'purple',
    agents: [
      { id: 'demand-signal', name: 'Demand Forecast Signal', stream: 'stream:signal:demand:forecast' },
      { id: 'email-extraction', name: 'Email Event Extraction', stream: 'stream:email:received' }
    ]
  },
  stream_processing: {
    name: 'Stream Processing',
    icon: GitBranch,
    color: 'green',
    agents: [
      { id: 'semantic-router', name: 'Semantic Router', stream: 'stream:mco:event:*' },
      { id: 'event-translator', name: 'Event Translator', stream: 'stream:route.decisions' },
      { id: 'ingress-normalization', name: 'Ingress Normalization', stream: null }
    ]
  },
  rag_knowledge: {
    name: 'RAG & Knowledge',
    icon: Brain,
    color: 'indigo',
    agents: [
      { id: 'declarative-knowledge', name: 'Declarative Knowledge', stream: null },
      { id: 'semantic-data', name: 'Semantic Data', stream: null },
      { id: 'rag-query', name: 'RAG Query Tool', stream: null }
    ]
  },
  orchestration: {
    name: 'Orchestration',
    icon: Workflow,
    color: 'orange',
    agents: [
      { id: 'qrp', name: 'Question Router Planner', stream: 'stream:mco:event:query' },
      { id: 'agent-orchestrator', name: 'Agent Orchestrator', stream: null },
      { id: 'intent-translation', name: 'Intent Translation', stream: null }
    ]
  },
  mco: {
    name: 'MCO Agents',
    icon: TrendingUp,
    color: 'pink',
    agents: [
      { id: 'budget-optimizer', name: 'Budget Optimizer', stream: null },
      { id: 'attribution-causal', name: 'Attribution Causal', stream: null },
      { id: 'bid-target-setter', name: 'Bid Target Setter', stream: null },
      { id: 'guardrail-compliance', name: 'Guardrail Compliance', stream: null },
      { id: 'safeguard-rollback', name: 'Safeguard Rollback', stream: null }
    ]
  },
  excel_analysis: {
    name: 'Excel Analysis',
    icon: FileSpreadsheet,
    color: 'cyan',
    agents: [
      { id: 'data-query', name: 'Data Query', stream: null },
      { id: 'insight-generator', name: 'Insight Generator', stream: null },
      { id: 'schema-analyst', name: 'Schema Analyst', stream: null }
    ]
  }
};

// Flow patterns
const FLOW_PATTERNS = [
  {
    id: 'data-query',
    name: 'Data Query Flow',
    steps: ['qrp', 'semantic-data', 'campaign-history', 'rag-query'],
    description: 'User question → Query parsing → Data access → Vector search → Answer'
  },
  {
    id: 'event-processing',
    name: 'Event Processing Flow',
    steps: ['email-extraction', 'ingress-normalization', 'semantic-router', 'event-translator'],
    description: 'Email/Event → Extract → Normalize → Route → Translate → Target'
  },
  {
    id: 'signal-monitoring',
    name: 'Signal Monitoring Flow',
    steps: ['demand-signal'],
    description: 'Simulation → Signal analysis → Impact assessment → Recommendations'
  },
  {
    id: 'optimization',
    name: 'Optimization Flow',
    steps: ['qrp', 'budget-optimizer', 'guardrail-compliance', 'safeguard-rollback'],
    description: 'Question → Plan → Optimize → Validate → Execute/Rollback'
  }
];

interface AgentStatus {
  id: string;
  status: 'active' | 'idle' | 'error' | 'disabled';
  lastActivity?: string;
  messageCount?: number;
}

export default function AgentFlowVisualization() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Simulate agent status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: Record<string, AgentStatus> = {};
      
      Object.values(AGENT_CATEGORIES).forEach(category => {
        category.agents.forEach(agent => {
          statuses[agent.id] = {
            id: agent.id,
            status: ['active', 'idle', 'active', 'idle'][Math.floor(Math.random() * 4)] as any,
            lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            messageCount: Math.floor(Math.random() * 100)
          };
        });
      });
      
      setAgentStatuses(statuses);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      case 'disabled': return 'bg-gray-600';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4" />;
      case 'idle': return <Circle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'disabled': return <AlertCircle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      indigo: 'from-indigo-500 to-indigo-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      cyan: 'from-cyan-500 to-cyan-600'
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  const isAgentInFlow = (agentId: string, flowId: string | null) => {
    if (!flowId) return false;
    const flow = FLOW_PATTERNS.find(f => f.id === flowId);
    return flow?.steps.includes(agentId) || false;
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gray-50`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Flow Visualization</h1>
              <p className="mt-1 text-sm text-gray-500">
                Interactive view of agent categories, flows, and interrelationships
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {showLegend ? 'Hide' : 'Show'} Legend
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Flow Pattern Selector */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFlow(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFlow === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Agents
            </button>
            {FLOW_PATTERNS.map(flow => (
              <button
                key={flow.id}
                onClick={() => setSelectedFlow(flow.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFlow === flow.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {flow.name}
              </button>
            ))}
          </div>

          {/* Flow Description */}
          {selectedFlow && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                {FLOW_PATTERNS.find(f => f.id === selectedFlow)?.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Categories */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(AGENT_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === key;
                
                return (
                  <div
                    key={key}
                    className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                      isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => setSelectedCategory(isSelected ? null : key)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(category.color)}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        </div>
                        <span className="text-xs text-gray-500">{category.agents.length}</span>
                      </div>
                    </button>

                    {/* Agents List */}
                    <div className="px-4 pb-4 space-y-2">
                      {category.agents.map(agent => {
                        const status = agentStatuses[agent.id];
                        const inFlow = isAgentInFlow(agent.id, selectedFlow);
                        const isHighlighted = selectedFlow ? inFlow : true;

                        return (
                          <button
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent)}
                            className={`w-full text-left p-2 rounded-lg transition-all ${
                              isHighlighted
                                ? 'hover:bg-gray-50 border border-gray-200'
                                : 'opacity-30 border border-transparent'
                            } ${inFlow ? 'bg-blue-50 border-blue-300' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(status?.status || 'idle')}`} />
                                <span className="text-sm font-medium text-gray-900 truncate">{agent.name}</span>
                              </div>
                              {status?.messageCount !== undefined && status.messageCount > 0 && (
                                <span className="text-xs text-gray-500 ml-2">{status.messageCount}</span>
                              )}
                            </div>
                            {agent.stream && (
                              <div className="mt-1 text-xs text-gray-500 truncate pl-4">
                                {agent.stream}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar - Agent Details / Legend */}
          <div className="lg:col-span-1">
            {selectedAgent ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-32">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Agent Details</h3>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedAgent.name}</h4>
                    {selectedAgent.stream && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Stream:</span> {selectedAgent.stream}
                      </p>
                    )}
                  </div>

                  {agentStatuses[selectedAgent.id] && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(agentStatuses[selectedAgent.id].status)}
                          <span className="text-sm capitalize">{agentStatuses[selectedAgent.id].status}</span>
                        </div>
                      </div>
                      
                      {agentStatuses[selectedAgent.id].lastActivity && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Last Activity:</span>
                          <p className="text-sm text-gray-600">
                            {new Date(agentStatuses[selectedAgent.id].lastActivity!).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {agentStatuses[selectedAgent.id].messageCount !== undefined && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Messages Processed:</span>
                          <p className="text-sm text-gray-600">{agentStatuses[selectedAgent.id].messageCount}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                      View in Registry
                    </button>
                  </div>
                </div>
              </div>
            ) : showLegend ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-32">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Legend</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Agent Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-gray-600">Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-sm text-gray-600">Idle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-sm text-gray-600">Error</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                        <span className="text-sm text-gray-600">Disabled</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
                    <div className="space-y-2">
                      {Object.entries(AGENT_CATEGORIES).map(([key, category]) => {
                        const Icon = category.icon;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <div className={`p-1 rounded bg-gradient-to-br ${getCategoryColor(category.color)}`}>
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-600">{category.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>Click on a flow pattern to highlight agents in that flow. Click on an agent to see details.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
