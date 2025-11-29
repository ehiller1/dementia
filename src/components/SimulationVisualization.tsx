/**
 * Simulation Input Sources Visualization
 * Animated view showing all input sources flowing into the event bus
 */

import React, { useState, useEffect } from 'react';
import { Activity, Database, MessageSquare, Video, TrendingUp, AlertCircle, Zap, Box, DollarSign, Package, Users, Brain, Shield, FileSearch, Calendar, FileText, ClipboardList, AlertTriangle, Lock as LockIcon, CheckCircle } from 'lucide-react';
import { fetchAgents } from '@/lib/api/signals';

interface AgentInfo {
  name: string;
  description: string;
  capabilities: string[];
  triggers: string[];
  outputs: string[];
  icon: React.ReactNode;
  color: string;
}

const AGENT_ROSTER: AgentInfo[] = [
  {
    name: 'BudgetAllocator',
    description: 'Optimizes RMN budget allocation across retailers, channels, and SKUs based on ROAS, inventory, and constraints',
    capabilities: [
      'Cross-RMN budget optimization',
      'ROAS-driven reallocation',
      'OOS-aware spend dampening',
      'Constraint-compliant planning'
    ],
    triggers: [
      'insight.detected (roas_drop, geo_opportunity)',
      'inventory.low',
      'budget.adjusted',
      'campaign.performance.threshold'
    ],
    outputs: [
      'campaign.optimized',
      'agent.recommendation.proposed'
    ],
    icon: <Brain className="w-5 h-5" />,
    color: 'purple'
  },
  {
    name: 'CreativeAnalyst',
    description: 'Monitors creative performance, detects fatigue, and recommends creative rotation or refresh',
    capabilities: [
      'Creative fatigue detection',
      'Frequency cap monitoring',
      'CTR trend analysis',
      'A/B test recommendation'
    ],
    triggers: [
      'creative.fatigue.alert',
      'campaign.ctr.decline',
      'frequency.cap.breach'
    ],
    outputs: [
      'campaign.paused',
      'campaign.resumed',
      'agent.recommendation.proposed'
    ],
    icon: <Activity className="w-5 h-5" />,
    color: 'pink'
  },
  {
    name: 'PromoPlanner',
    description: 'Plans and schedules promotional campaigns based on market conditions, inventory, and historical performance',
    capabilities: [
      'Promo calendar optimization',
      'ROI forecasting',
      'Competitor response planning',
      'Inventory-aware timing'
    ],
    triggers: [
      'knowledgegraph.ingest (Promo)',
      'competitor.price.changed',
      'inventory.restocked',
      'insight.detected (geo_opportunity)'
    ],
    outputs: [
      'promo.planned',
      'promo.started'
    ],
    icon: <Calendar className="w-5 h-5" />,
    color: 'green'
  },
  {
    name: 'RepriceBot',
    description: 'Monitors competitor pricing and recommends price adjustments within margin floor constraints',
    capabilities: [
      'Competitor price monitoring',
      'Margin floor validation',
      'Elasticity-based pricing',
      'Strategic hold decisions'
    ],
    triggers: [
      'competitor.price.changed',
      'price.test.completed',
      'margin.floor.updated'
    ],
    outputs: [
      'price.changed',
      'agent.recommendation.proposed (or rejected)',
      'campaign.optimized (shift to value messaging)'
    ],
    icon: <DollarSign className="w-5 h-5" />,
    color: 'yellow'
  },
  {
    name: 'Forecaster',
    description: 'Generates demand forecasts, monitors model quality, and triggers retraining when drift is detected',
    capabilities: [
      'Demand forecasting (ARIMA/Prophet/LSTM)',
      'Model quality monitoring (MAPE/drift)',
      'Seasonality detection',
      'Forecast confidence intervals'
    ],
    triggers: [
      'model.metrics.updated (drift_detected)',
      'data.quality.issue',
      'scheduled.forecast.refresh'
    ],
    outputs: [
      'demand.forecast.updated',
      'prediction.ready',
      'model.metrics.updated'
    ],
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'blue'
  },
  {
    name: 'CommsIngestor',
    description: 'Processes meeting transcripts and emails, extracts salient entities via LLM filter, writes to knowledge graph',
    capabilities: [
      'Transcript/email processing',
      'LLM-based salience filtering',
      'Entity extraction',
      'PII scrubbing'
    ],
    triggers: [
      'meeting.transcript.chunk',
      'email.thread.chunk',
      'salience >= 0.70'
    ],
    outputs: [
      'knowledgegraph.ingest',
      'doc.summary.available'
    ],
    icon: <FileSearch className="w-5 h-5" />,
    color: 'teal'
  },
  {
    name: 'Guardrails',
    description: 'Validates agent recommendations against policy constraints, margin floors, and data quality thresholds',
    capabilities: [
      'Policy constraint validation',
      'Margin floor enforcement',
      'Data quality checks',
      'Approval workflow management'
    ],
    triggers: [
      'agent.recommendation.proposed',
      'constraint.policy.updated',
      'data.quality.issue'
    ],
    outputs: [
      'agent.recommendation.approved',
      'agent.recommendation.rejected'
    ],
    icon: <Shield className="w-5 h-5" />,
    color: 'red'
  }
];

interface DataSource {
  id: string;
  name: string;
  category: 'systems' | 'agents' | 'communications' | 'analytics' | 'insights';
  icon: React.ReactNode;
  color: string;
  events: string[];
  active: boolean;
}

export default function SimulationVisualization() {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [pulsingEvents, setPulsingEvents] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<AgentInfo[]>(AGENT_ROSTER);

  // Fetch real agents from API and merge with hardcoded roster
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const apiAgents = await fetchAgents();
        // Map API agents to AgentInfo format
        const mappedAgents: AgentInfo[] = apiAgents.map((agent: any) => ({
          name: agent.name || agent.id,
          description: agent.description || `Agent ${agent.id}`,
          capabilities: agent.capabilities || [],
          triggers: agent.triggers || [],
          outputs: agent.outputs || [],
          icon: <Brain className="w-5 h-5" />,
          color: 'purple'
        }));
        // Merge with hardcoded roster, prioritizing API data
        setAgents([...AGENT_ROSTER, ...mappedAgents]);
      } catch (error) {
        console.error('[SimulationVisualization] Error loading agents:', error);
        // Fallback to hardcoded roster
        setAgents(AGENT_ROSTER);
      }
    };

    loadAgents();
    // Refresh every 30 seconds
    const interval = setInterval(loadAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const dataSources: DataSource[] = [
    // Software Systems (a)
    {
      id: 'erp',
      name: 'ERP System',
      category: 'systems',
      icon: <Database className="w-6 h-6" />,
      color: 'blue',
      events: ['sales.transaction', 'inventory.snapshot', 'cost.updated'],
      active: true
    },
    {
      id: 'wms',
      name: 'WMS',
      category: 'systems',
      icon: <Package className="w-6 h-6" />,
      color: 'blue',
      events: ['inventory.low', 'inventory.restocked', 'oos.risk.alert'],
      active: true
    },
    {
      id: 'rmn_servers',
      name: 'RMN Ad Servers',
      category: 'systems',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'blue',
      events: ['campaign.created', 'campaign.optimized', 'campaign.paused'],
      active: true
    },
    {
      id: 'pricing',
      name: 'Pricing Analytics',
      category: 'systems',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'blue',
      events: ['price.changed', 'competitor.price.changed', 'promo.started'],
      active: true
    },
    {
      id: 'salesforce',
      name: 'Salesforce CRM',
      category: 'systems',
      icon: <Users className="w-6 h-6" />,
      color: 'blue',
      events: ['lead.created', 'opportunity.updated', 'account.modified'],
      active: true
    },

    // CrewAI Agents (b)
    {
      id: 'budget_allocator',
      name: 'BudgetAllocator',
      category: 'agents',
      icon: <Brain className="w-6 h-6" />,
      color: 'purple',
      events: ['agent.task.started', 'agent.recommendation.proposed'],
      active: true
    },
    {
      id: 'reprice_bot',
      name: 'RepriceBot',
      category: 'agents',
      icon: <Zap className="w-6 h-6" />,
      color: 'purple',
      events: ['agent.task.completed', 'campaign.optimized'],
      active: true
    },
    {
      id: 'creative_analyst',
      name: 'CreativeAnalyst',
      category: 'agents',
      icon: <Activity className="w-6 h-6" />,
      color: 'purple',
      events: ['creative.fatigue.alert', 'agent.recommendation.approved'],
      active: true
    },

    // Communications → KG (c)
    {
      id: 'email',
      name: 'Email',
      category: 'communications',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'green',
      events: ['email.received', 'email.thread.chunk', 'campaign.sent'],
      active: true
    },
    {
      id: 'gmail',
      name: 'Gmail',
      category: 'communications',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'green',
      events: ['gmail.message', 'gmail.thread.updated'],
      active: true
    },
    {
      id: 'zoom',
      name: 'Zoom',
      category: 'communications',
      icon: <Video className="w-6 h-6" />,
      color: 'green',
      events: ['meeting.transcript.chunk', 'meeting.ended'],
      active: true
    },
    {
      id: 'kg_ingest',
      name: 'Knowledge Graph',
      category: 'communications',
      icon: <Video className="w-6 h-6" />,
      color: 'green',
      events: ['knowledgegraph.ingest', 'doc.summary.available'],
      active: true
    },

    // Analytics/Predictions (d)
    {
      id: 'forecaster',
      name: 'Demand Forecasting',
      category: 'analytics',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'orange',
      events: ['demand.forecast.updated', 'prediction.ready', 'forecast.quarterly'],
      active: true
    },
    {
      id: 'ml_models',
      name: 'ML Models',
      category: 'analytics',
      icon: <Box className="w-6 h-6" />,
      color: 'orange',
      events: ['model.metrics.updated', 'experiment.result'],
      active: true
    },

    // Data Insights (e)
    {
      id: 'insight_engine',
      name: 'Insight Engine',
      category: 'insights',
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'red',
      events: ['insight.detected', 'data.quality.issue'],
      active: true
    }
  ];

  // Simulate pulsing events
  useEffect(() => {
    const interval = setInterval(() => {
      const randomSource = dataSources[Math.floor(Math.random() * dataSources.length)];
      const randomEvent = randomSource.events[Math.floor(Math.random() * randomSource.events.length)];
      
      setPulsingEvents(prev => new Set(prev).add(`${randomSource.id}-${randomEvent}`));
      
      setTimeout(() => {
        setPulsingEvents(prev => {
          const next = new Set(prev);
          next.delete(`${randomSource.id}-${randomEvent}`);
          return next;
        });
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'systems': return 'bg-blue-500';
      case 'agents': return 'bg-purple-500';
      case 'communications': return 'bg-green-500';
      case 'analytics': return 'bg-orange-500';
      case 'insights': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryBorder = (category: string) => {
    switch (category) {
      case 'systems': return 'border-blue-400';
      case 'agents': return 'border-purple-400';
      case 'communications': return 'border-green-400';
      case 'analytics': return 'border-orange-400';
      case 'insights': return 'border-red-400';
      default: return 'border-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Signals
        </h1>
        <p className="text-slate-400 text-lg">
          Real-time event flow from all system inputs into the unified event bus
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Left Side - Input Sources */}
        <div className="col-span-8 space-y-6">
          {/* Software Systems */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              Software Systems (ERP/WMS/RMN)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {dataSources.filter(s => s.category === 'systems').map(source => (
                <button
                  key={source.id}
                  onClick={() => setActiveSource(source.id === activeSource ? null : source.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    activeSource === source.id
                      ? `${getCategoryBorder(source.category)} bg-slate-700`
                      : 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded ${getCategoryColor(source.category)}`}>
                      {source.icon}
                    </div>
                    <span className="text-white font-medium">{source.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    {source.events.map(event => (
                      <div
                        key={event}
                        className={`px-2 py-1 bg-slate-900 rounded transition-all ${
                          pulsingEvents.has(`${source.id}-${event}`)
                            ? 'ring-2 ring-blue-400 bg-blue-900/30'
                            : ''
                        }`}
                      >
                        {event}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CrewAI Agents */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              Digital Workers
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {dataSources.filter(s => s.category === 'agents').map(source => (
                <button
                  key={source.id}
                  onClick={() => setActiveSource(source.id === activeSource ? null : source.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    activeSource === source.id
                      ? `${getCategoryBorder(source.category)} bg-slate-700`
                      : 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded ${getCategoryColor(source.category)}`}>
                      {source.icon}
                    </div>
                    <span className="text-white font-medium text-sm">{source.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    {source.events.map(event => (
                      <div
                        key={event}
                        className={`px-2 py-1 bg-slate-900 rounded transition-all ${
                          pulsingEvents.has(`${source.id}-${event}`)
                            ? 'ring-2 ring-purple-400 bg-purple-900/30'
                            : ''
                        }`}
                      >
                        {event}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Communications & Analytics */}
          <div className="grid grid-cols-2 gap-6">
            {/* Communications */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Comms → KG
              </h2>
              <div className="space-y-4">
                {dataSources.filter(s => s.category === 'communications').map(source => (
                  <button
                    key={source.id}
                    onClick={() => setActiveSource(source.id === activeSource ? null : source.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      activeSource === source.id
                        ? `${getCategoryBorder(source.category)} bg-slate-700`
                        : 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded ${getCategoryColor(source.category)}`}>
                        {source.icon}
                      </div>
                      <span className="text-white font-medium text-sm">{source.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      {source.events.map(event => (
                        <div
                          key={event}
                          className={`px-2 py-1 bg-slate-900 rounded transition-all ${
                            pulsingEvents.has(`${source.id}-${event}`)
                              ? 'ring-2 ring-green-400 bg-green-900/30'
                              : ''
                          }`}
                        >
                          {event}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                Analytics/ML
              </h2>
              <div className="space-y-4">
                {dataSources.filter(s => s.category === 'analytics').map(source => (
                  <button
                    key={source.id}
                    onClick={() => setActiveSource(source.id === activeSource ? null : source.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      activeSource === source.id
                        ? `${getCategoryBorder(source.category)} bg-slate-700`
                        : 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded ${getCategoryColor(source.category)}`}>
                        {source.icon}
                      </div>
                      <span className="text-white font-medium text-sm">{source.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      {source.events.map(event => (
                        <div
                          key={event}
                          className={`px-2 py-1 bg-slate-900 rounded transition-all ${
                            pulsingEvents.has(`${source.id}-${event}`)
                              ? 'ring-2 ring-orange-400 bg-orange-900/30'
                              : ''
                          }`}
                        >
                          {event}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Data Insights
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {dataSources.filter(s => s.category === 'insights').map(source => (
                <button
                  key={source.id}
                  onClick={() => setActiveSource(source.id === activeSource ? null : source.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    activeSource === source.id
                      ? `${getCategoryBorder(source.category)} bg-slate-700`
                      : 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded ${getCategoryColor(source.category)}`}>
                      {source.icon}
                    </div>
                    <span className="text-white font-medium">{source.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    {source.events.map(event => (
                      <div
                        key={event}
                        className={`px-2 py-1 bg-slate-900 rounded transition-all ${
                          pulsingEvents.has(`${source.id}-${event}`)
                            ? 'ring-2 ring-red-400 bg-red-900/30'
                            : ''
                        }`}
                      >
                        {event}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Plans & Governance */}
          <div className="grid grid-cols-2 gap-6">
            {/* Plans */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
                Plans
              </h2>
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-semibold">Strategic Plans</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="px-2 py-1 bg-slate-900 rounded">Q4 Revenue Growth Strategy</div>
                    <div className="px-2 py-1 bg-slate-900 rounded">Market Expansion Plan 2025</div>
                    <div className="px-2 py-1 bg-slate-900 rounded">Digital Transformation Roadmap</div>
                  </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-semibold">Operational Plans</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="px-2 py-1 bg-slate-900 rounded">Weekly Inventory Optimization</div>
                    <div className="px-2 py-1 bg-slate-900 rounded">Daily Pricing Adjustments</div>
                    <div className="px-2 py-1 bg-slate-900 rounded">Campaign Performance Review</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Governance */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                Governance
              </h2>
              <div className="space-y-3">
                <div className="bg-slate-800 p-3 rounded-lg border border-amber-600/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="text-white text-sm font-semibold">Approval Thresholds</span>
                  </div>
                  <div className="text-xs text-slate-400">Budget changes &gt;$10K require VP approval</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border border-amber-600/30">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-white text-sm font-semibold">Risk Guardrails</span>
                  </div>
                  <div className="text-xs text-slate-400">Max 15% price variance from baseline</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border border-amber-600/30">
                  <div className="flex items-center gap-2 mb-1">
                    <LockIcon className="w-4 h-4 text-amber-400" />
                    <span className="text-white text-sm font-semibold">Data Access</span>
                  </div>
                  <div className="text-xs text-slate-400">PII restricted to authorized roles only</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border border-amber-600/30">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-white text-sm font-semibold">Compliance</span>
                  </div>
                  <div className="text-xs text-slate-400">SOX, GDPR, and SOC2 requirements enforced</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Event Bus */}
        <div className="col-span-4">
          <div className="sticky top-8">
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg border-2 border-indigo-500 p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
                  <Activity className="w-12 h-12 text-white animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Unified Event Bus
                </h2>
                <p className="text-indigo-200 text-sm">
                  intellex.events.*
                </p>
              </div>

              {/* Event Flow Animation */}
              <div className="space-y-3 mb-6">
                <div className="bg-white/10 rounded p-3">
                  <div className="text-xs text-indigo-200 mb-1">Event Topics:</div>
                  <div className="space-y-1 text-xs">
                    <div className="text-white">• intellex.events</div>
                    <div className="text-white">• intellex.events.{'{type}'}</div>
                    <div className="text-white">• {'{type}'}</div>
                  </div>
                </div>

                <div className="bg-white/10 rounded p-3">
                  <div className="text-xs text-indigo-200 mb-1">Active Generators:</div>
                  <div className="text-white font-mono text-xs">9 sources</div>
                </div>

                <div className="bg-white/10 rounded p-3">
                  <div className="text-xs text-indigo-200 mb-1">Event Types:</div>
                  <div className="text-white font-mono text-xs">40+ types</div>
                </div>
              </div>

              {/* Legend */}
              <div className="border-t border-indigo-700 pt-4">
                <div className="text-xs text-indigo-200 mb-2">Input Categories:</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-white text-xs">Software Systems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-white text-xs">Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-white text-xs">Communications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-white text-xs">Analytics/ML</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-white text-xs">Data Insights</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Coverage Map</h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>(a) Software Systems:</span>
                  <span className="text-blue-400">✓ 4 sources</span>
                </div>
                <div className="flex justify-between">
                  <span>(b) CrewAI Agents:</span>
                  <span className="text-purple-400">✓ 3 agents</span>
                </div>
                <div className="flex justify-between">
                  <span>(c) Email/Zoom → KG:</span>
                  <span className="text-green-400">✓ 2 pipelines</span>
                </div>
                <div className="flex justify-between">
                  <span>(d) Analytics/ML:</span>
                  <span className="text-orange-400">✓ 2 models</span>
                </div>
                <div className="flex justify-between">
                  <span>(e) Data Insights:</span>
                  <span className="text-red-400">✓ 1 engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Roster Section */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-8">
          <h2 className="text-3xl font-bold text-white mb-2">Active Agent Roster</h2>
          <p className="text-slate-400 mb-6">CrewAI agents orchestrating RMN optimization workflows</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map(agent => (
              <div key={agent.name} className="bg-slate-900/50 rounded-lg border border-slate-600 p-6 hover:border-purple-500 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg bg-${agent.color}-500/20 border border-${agent.color}-500/50`}>
                    {agent.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">{agent.name}</h3>
                    <p className="text-slate-400 text-sm">{agent.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Capabilities */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Capabilities</div>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities.map(cap => (
                        <span key={cap} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Triggers */}
                  <div>
                    <div className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-2">Triggers (Inputs)</div>
                    <div className="space-y-1">
                      {agent.triggers.map(trigger => (
                        <div key={trigger} className="text-xs text-slate-400 pl-3 border-l-2 border-green-500/30">
                          {trigger}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outputs */}
                  <div>
                    <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">Outputs (Actions)</div>
                    <div className="space-y-1">
                      {agent.outputs.map(output => (
                        <div key={output} className="text-xs text-slate-400 pl-3 border-l-2 border-blue-500/30">
                          {output}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
