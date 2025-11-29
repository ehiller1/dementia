/**
 * Agent Registry UI
 * 
 * Comprehensive view of all registered agents with their configurations,
 * schemas, semantic router contracts, tools, and performance metrics.
 * Designed to scale to hundreds of agents with virtualization.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RefreshCw, ChevronRight, Database, Zap, Settings, Activity, Code, GitBranch, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  version: string | null;
  owner: string | null;
  description: string | null;
  capabilities: string[];
  intents: string[];
  enabled: boolean;
  manifest: any;
  created_at: string;
  updated_at: string;
  schemas: any[];
  routerContracts: any[];
  tools: string[];
  performanceMetrics: {
    confidence_threshold?: number;
    average_execution_time?: number;
    success_rate?: number;
  };
  configuration: any;
  metadata: {
    totalSchemas: number;
    totalRouterContracts: number;
    totalTools: number;
    hasEmbedding: boolean;
  };
}

interface RegistryStats {
  totalAgents: number;
  enabledAgents: number;
  disabledAgents: number;
  agentTypes: string[];
}

export default function AgentRegistry() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEnabled, setFilterEnabled] = useState<string>('all');
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schemas' | 'tools' | 'router' | 'config'>('overview');

  // Fetch agents from API
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterEnabled !== 'all') params.append('enabled', filterEnabled);

      const response = await fetch(`/api/agents/registry?${params}`);
      const data = await response.json();

      setAgents(data.agents || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [searchTerm, filterType, filterEnabled]);

  // Filter agents based on search and filters
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = !searchTerm || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || 
        agent.manifest?.type === filterType;
      
      const matchesEnabled = filterEnabled === 'all' ||
        (filterEnabled === 'true' && agent.enabled) ||
        (filterEnabled === 'false' && !agent.enabled);

      return matchesSearch && matchesType && matchesEnabled;
    });
  }, [agents, searchTerm, filterType, filterEnabled]);

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100';
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Registry</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and monitor all registered agents in the system
              </p>
            </div>
            <button
              onClick={fetchAgents}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div className="bg-blue-50 overflow-hidden rounded-lg px-4 py-5">
                <div className="flex items-center">
                  <Database className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total Agents</p>
                    <p className="text-2xl font-semibold text-blue-600">{stats.totalAgents}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 overflow-hidden rounded-lg px-4 py-5">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Enabled</p>
                    <p className="text-2xl font-semibold text-green-600">{stats.enabledAgents}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5">
                <div className="flex items-center">
                  <XCircle className="h-6 w-6 text-gray-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Disabled</p>
                    <p className="text-2xl font-semibold text-gray-600">{stats.disabledAgents}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 overflow-hidden rounded-lg px-4 py-5">
                <div className="flex items-center">
                  <GitBranch className="h-6 w-6 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-900">Agent Types</p>
                    <p className="text-2xl font-semibold text-purple-600">{stats.agentTypes.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search agents by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {stats?.agentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="true">Enabled Only</option>
              <option value="false">Disabled Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Agents ({filteredAgents.length})
              </h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  Loading agents...
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No agents found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedAgent?.id === agent.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.enabled)}`}>
                              {getStatusIcon(agent.enabled)}
                              {agent.enabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {agent.name}
                          </h3>
                          {agent.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {agent.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              {agent.metadata.totalTools} tools
                            </span>
                            <span className="flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              {agent.metadata.totalSchemas} schemas
                            </span>
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {agent.metadata.totalRouterContracts} routes
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Agent Details */}
          <div className="lg:col-span-2">
            {selectedAgent ? (
              <div className="bg-white rounded-lg shadow">
                {/* Agent Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
                      {selectedAgent.description && (
                        <p className="mt-1 text-sm text-gray-600">{selectedAgent.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAgent.enabled)}`}>
                          {getStatusIcon(selectedAgent.enabled)}
                          {selectedAgent.enabled ? 'Active' : 'Inactive'}
                        </span>
                        {selectedAgent.version && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            v{selectedAgent.version}
                          </span>
                        )}
                        {selectedAgent.manifest?.type && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {selectedAgent.manifest.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    {[
                      { id: 'overview', label: 'Overview', icon: Activity },
                      { id: 'schemas', label: 'Schemas', icon: Database },
                      { id: 'tools', label: 'Tools', icon: Code },
                      { id: 'router', label: 'Router Contracts', icon: GitBranch },
                      { id: 'config', label: 'Configuration', icon: Settings }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Performance Metrics */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-blue-900 font-medium">Confidence Threshold</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                              {((selectedAgent.performanceMetrics.confidence_threshold || 0) * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-green-900 font-medium">Success Rate</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                              {((selectedAgent.performanceMetrics.success_rate || 0) * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-sm text-purple-900 font-medium">Avg Execution Time</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                              {selectedAgent.performanceMetrics.average_execution_time || 0}ms
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Capabilities */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Capabilities</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedAgent.capabilities.map((cap, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Intents */}
                      {selectedAgent.intents.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Intents</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedAgent.intents.map((intent, idx) => (
                              <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                {intent}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h3>
                        <dl className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Owner</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedAgent.owner || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Has Embedding</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {selectedAgent.metadata.hasEmbedding ? 'Yes' : 'No'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Created</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(selectedAgent.created_at).toLocaleDateString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Updated</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(selectedAgent.updated_at).toLocaleDateString()}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {activeTab === 'schemas' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Schemas ({selectedAgent.schemas.length})
                      </h3>
                      {selectedAgent.schemas.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Database className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>No schemas registered</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedAgent.schemas.map((schema, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{schema.schema_id}</h4>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                  {schema.compatibility_mode}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{schema.schema_uri}</p>
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                                  View Schema Definition
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(schema.schema_definition, null, 2)}
                                </pre>
                              </details>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'tools' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tools ({selectedAgent.tools.length})
                      </h3>
                      {selectedAgent.tools.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Code className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>No tools configured</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedAgent.tools.map((tool, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                              <div className="flex items-center gap-2">
                                <Code className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-gray-900">{tool}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'router' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Semantic Router Contracts ({selectedAgent.routerContracts.length})
                      </h3>
                      {selectedAgent.routerContracts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <GitBranch className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>No router contracts configured</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedAgent.routerContracts.map((contract, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-2">{contract.channel}</h4>
                              <p className="text-sm text-gray-600 mb-3">{contract.description}</p>
                              {contract.ontology_concepts && contract.ontology_concepts.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Ontology Concepts:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {contract.ontology_concepts.map((concept: string, cidx: number) => (
                                      <span key={cidx} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                                        {concept}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {contract.example_payloads && contract.example_payloads.length > 0 && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                                    View Example Payloads
                                  </summary>
                                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(contract.example_payloads, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'config' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
                      {Object.keys(selectedAgent.configuration).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Settings className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>No configuration available</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(selectedAgent.configuration).map(([key, value]) => (
                            <div key={key} className="border-b border-gray-200 pb-3">
                              <dt className="text-sm font-medium text-gray-700 mb-1">{key}</dt>
                              <dd className="text-sm text-gray-900">
                                {typeof value === 'object' ? (
                                  <pre className="p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  String(value)
                                )}
                              </dd>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Agent Selected</h3>
                <p className="text-gray-600">Select an agent from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
