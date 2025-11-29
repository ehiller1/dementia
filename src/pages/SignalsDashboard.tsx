import { useState, useEffect } from 'react';
import { useSignalAgents, useAgentStats } from '@/hooks/useActiveAgents';
import { AgentDetailsModal } from '@/components/AgentDetailsModal';
import { LiveAgentDisplay } from '@/components/LiveAgentDisplay';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchSignals, fetchSignalMetrics, enableSignal, disableSignal, type Signal, type SignalMetrics } from '@/lib/api/signals';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  BarChart3,
  Mail,
  Video,
  MessageSquare,
  FileText,
  Database,
  Settings,
  Search,
  Check,
  AlertCircle,
  Activity,
  TrendingUp,
  Bot,
  Zap,
} from 'lucide-react';
import { mockSignalActivities, mockSignalMetrics } from '@/data/mockSignalsData';

// Types
interface Signal {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error';
  filters?: SignalFilters;
  activeAgents?: ActiveAgent[];
}

interface ActiveAgent {
  id: string;
  name: string;
  type: string;
  status: 'spawning' | 'active' | 'completed';
  confidence: number;
  spawnedAt: string;
}

interface SignalFilters {
  [key: string]: any;
}

// All signals from the requirements
const SIGNAL_DATA: Record<string, Signal[]> = {
  Analytics: [
    // Analytics signals from image
    { id: 'CAG/MTA Analytics', name: 'CAG/MTA Analytics', description: 'Customer Acquisition & Multi-Touch Attribution', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Campaign Analytics', name: 'Campaign Analytics', description: 'Campaign performance metrics', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'CartoDB Analytics', name: 'CartoDB Analytics', description: 'Geospatial analytics platform', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Chartbeat', name: 'Chartbeat', description: 'Real-time analytics', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Clicky', name: 'Clicky', description: 'Web analytics', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Customer Analytics', name: 'Customer Analytics', description: 'Demographics, LTV, churn prediction', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Demand Forecasting', name: 'Demand Forecasting', description: 'Time horizon, product category forecasting', category: 'Analytics', enabled: true, status: 'active', filters: { timeHorizon: 'quarterly', region: 'All Regions', confidenceThreshold: 85 }, activeAgents: [
      { id: 'agent-df-001', name: 'Demand Forecast Analyzer', type: 'demand_forecast_analyzer', status: 'active', confidence: 0.92, spawnedAt: '2025-10-25T10:30:00Z' },
      { id: 'agent-df-002', name: 'Seasonality Detector', type: 'seasonality_analyzer', status: 'active', confidence: 0.88, spawnedAt: '2025-10-25T10:35:00Z' },
    ] },
    { id: 'Google Analytics', name: 'Google Analytics', description: 'Web analytics platform', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Heap Analytics', name: 'Heap Analytics', description: 'Behavioral analytics', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Inventory Analytics', name: 'Inventory & Procurement Analytics', description: 'Product hierarchy, vendor analytics', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Marketing Analytics', name: 'Marketing Analytics', description: 'Campaign, channel, attribution analytics', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Mixpanel', name: 'Mixpanel', description: 'Product analytics', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Price Analytics', name: 'Price & Pricing Analytics', description: 'SKU-level, competitor pricing', category: 'Analytics', enabled: true, status: 'active', filters: { timeHorizon: 'monthly', region: 'All Regions', confidenceThreshold: 80 }, activeAgents: [
      { id: 'agent-pa-001', name: 'Price Optimizer', type: 'price_optimizer', status: 'active', confidence: 0.85, spawnedAt: '2025-10-25T10:25:00Z' },
    ] },
    { id: 'Sales Analytics', name: 'Sales Performance Analytics', description: 'Territory, account, rep analytics', category: 'Analytics', enabled: false, status: 'inactive' },
    { id: 'Segment', name: 'Segment', description: 'Customer data platform', category: 'Analytics', enabled: false, status: 'inactive' },
  ],
  Communication: [
    // Communication signals
    { id: 'Email', name: 'Email', description: 'Email campaign tracking', category: 'Communication', enabled: true, status: 'active', filters: { senderDomain: '@company.com', campaignType: 'promotional' }, activeAgents: [
      { id: 'agent-em-001', name: 'Campaign Analyzer', type: 'campaign_analyzer', status: 'active', confidence: 0.90, spawnedAt: '2025-10-25T10:20:00Z' },
    ] },
    { id: 'Gmail', name: 'Gmail', description: 'Gmail integration', category: 'Communication', enabled: true, status: 'active', filters: { senderDomain: '@gmail.com', campaignType: 'transactional' }, activeAgents: [] },
    { id: 'Microsoft Teams', name: 'Microsoft Teams', description: 'Teams collaboration', category: 'Communication', enabled: false, status: 'inactive' },
    { id: 'Outlook', name: 'Outlook', description: 'Microsoft Outlook', category: 'Communication', enabled: false, status: 'inactive' },
    { id: 'Slack', name: 'Slack', description: 'Slack messaging', category: 'Communication', enabled: false, status: 'inactive' },
    { id: 'Twilio', name: 'Twilio', description: 'SMS and voice communications', category: 'Communication', enabled: false, status: 'inactive' },
    { id: 'Zoom', name: 'Zoom', description: 'Video conferencing', category: 'Communication', enabled: false, status: 'inactive' },
    { id: 'Zendesk', name: 'Zendesk', description: 'Customer support', category: 'Communication', enabled: false, status: 'inactive' },
  ],
  Plans: [
    // Plans signals
    { id: 'Operational Plans', name: 'Operational Plans', description: 'Department, priority, time window', category: 'Plans', enabled: false, status: 'inactive' },
    { id: 'Strategic Plans', name: 'Strategic Plans', description: 'Business unit, long-term initiatives', category: 'Plans', enabled: false, status: 'inactive' },
    { id: 'Project Plans', name: 'Project Plans', description: 'Project owner, stage, dependencies', category: 'Plans', enabled: false, status: 'inactive' },
    { id: 'Asana', name: 'Asana', description: 'Project management', category: 'Plans', enabled: false, status: 'inactive' },
    { id: 'Jira', name: 'Jira', description: 'Issue tracking and project management', category: 'Plans', enabled: false, status: 'inactive' },
    { id: 'Monday.com', name: 'Monday.com', description: 'Work OS platform', category: 'Plans', enabled: false, status: 'inactive' },
    { id: 'Trello', name: 'Trello', description: 'Kanban board management', category: 'Plans', enabled: false, status: 'inactive' },
  ],
  Systems: [
    // Systems signals from image
    { id: 'Salesforce', name: 'Salesforce CRM', description: 'Lead, Opportunity, Account management', category: 'Systems', enabled: true, status: 'active', filters: { objectType: 'opportunity', stage: 'Qualified' }, activeAgents: [
      { id: 'agent-sf-001', name: 'Opportunity Analyzer', type: 'opportunity_analyzer', status: 'active', confidence: 0.87, spawnedAt: '2025-10-25T10:15:00Z' },
      { id: 'agent-sf-002', name: 'Lead Scorer', type: 'lead_scoring_agent', status: 'active', confidence: 0.91, spawnedAt: '2025-10-25T10:18:00Z' },
    ] },
    { id: 'SAP ERP', name: 'SAP ERP', description: 'Finance, procurement, HR modules', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'Oracle ERP', name: 'Oracle ERP', description: 'Enterprise resource planning', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'HubSpot', name: 'HubSpot', description: 'Marketing automation', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'Marketo', name: 'Marketo', description: 'Marketing automation', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'ServiceNow', name: 'ServiceNow', description: 'IT ticketing system', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'Workday', name: 'Workday', description: 'HR and finance system', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'NetSuite', name: 'NetSuite', description: 'Cloud ERP', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'Shopify', name: 'Shopify', description: 'E-commerce platform', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'Square', name: 'Square', description: 'Payment processing', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'Stripe', name: 'Stripe', description: 'Payment processing', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'QuickBooks', name: 'QuickBooks', description: 'Accounting software', category: 'Systems', enabled: false, status: 'inactive' },
    { id: 'Xero', name: 'Xero', description: 'Accounting software', category: 'Systems', enabled: false, status: 'inactive' },
  ],
  Repositories: [
    // Repository signals
    { id: 'SharePoint', name: 'SharePoint', description: 'Document management', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'Google Drive', name: 'Google Drive', description: 'Cloud storage', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'Confluence', name: 'Confluence', description: 'Knowledge management', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'Dropbox', name: 'Dropbox', description: 'File storage', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'Box', name: 'Box', description: 'Content management', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'Snowflake', name: 'Snowflake', description: 'Data warehouse', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'Redshift', name: 'Amazon Redshift', description: 'Data warehouse', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'BigQuery', name: 'Google BigQuery', description: 'Data warehouse', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'S3', name: 'Amazon S3', description: 'Object storage', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'GitHub', name: 'GitHub', description: 'Code repository', category: 'Repositories', enabled: false, status: 'inactive' },
    { id: 'GitLab', name: 'GitLab', description: 'DevOps platform', category: 'Repositories', enabled: false, status: 'inactive' },
  ],
};

const CATEGORY_ICONS = {
  Analytics: BarChart3,
  Communication: MessageSquare,
  Plans: FileText,
  Systems: Settings,
  Repositories: Database,
};

export default function SignalsDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Analytics');
  const [signals, setSignals] = useState<Record<string, Signal[]>>(SIGNAL_DATA);
  const [apiSignals, setApiSignals] = useState<Signal[]>([]);
  const [metrics, setMetrics] = useState<SignalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);

  // Filter configuration state
  const [filterConfig, setFilterConfig] = useState<SignalFilters>({});
  
  // Fetch agent statistics
  const { stats } = useAgentStats(10000); // Refresh every 10 seconds

  // Fetch signals and metrics from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [signalsData, metricsData] = await Promise.all([
          fetchSignals(),
          fetchSignalMetrics()
        ]);
        setApiSignals(signalsData);
        setMetrics(metricsData);
        
        // Merge API signals with hardcoded signal structure
        // Group by category
        const grouped: Record<string, Signal[]> = {};
        signalsData.forEach(signal => {
          if (!grouped[signal.category]) {
            grouped[signal.category] = [];
          }
          grouped[signal.category].push(signal);
        });
        
        // Merge with existing SIGNAL_DATA structure, prioritizing API data
        const merged: Record<string, Signal[]> = { ...SIGNAL_DATA };
        Object.keys(grouped).forEach(category => {
          merged[category] = grouped[category];
        });
        setSignals(merged);
      } catch (error) {
        console.error('[SignalsDashboard] Error loading data:', error);
        // Fallback to hardcoded data on error
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSignal = async (signalId: string) => {
    const signal = signals[selectedCategory]?.find(s => s.id === signalId);
    if (signal && !signal.enabled) {
      // Opening filter modal
      setSelectedSignal(signal);
      setFilterConfig({});
      setFilterModalOpen(true);
    } else if (signal && signal.enabled) {
      // Disabling signal via API
      try {
        await disableSignal(signalId);
        // Refresh signals
        const updatedSignals = await fetchSignals();
        setApiSignals(updatedSignals);
        // Update local state
        setSignals(prev => ({
          ...prev,
          [selectedCategory]: prev[selectedCategory]?.map(s =>
            s.id === signalId ? { ...s, enabled: false, status: 'inactive', activeAgents: [] } : s
          ) || [],
        }));
      } catch (error) {
        console.error('[SignalsDashboard] Error disabling signal:', error);
      }
    }
  };

  const handleSaveFilters = async () => {
    if (selectedSignal) {
      try {
        // Enable signal via API
        const updated = await enableSignal(selectedSignal.id, filterConfig);
        // Refresh signals
        const updatedSignals = await fetchSignals();
        setApiSignals(updatedSignals);
        // Update local state
        setSignals(prev => ({
          ...prev,
          [selectedCategory]: prev[selectedCategory]?.map(s =>
            s.id === selectedSignal.id ? updated : s
          ) || [],
        }));
        setFilterModalOpen(false);
        setSelectedSignal(null);
      } catch (error) {
        console.error('[SignalsDashboard] Error enabling signal:', error);
      }
    }
  };

  const filteredSignals = signals[selectedCategory]?.filter(signal =>
    signal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    signal.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const enabledCount = metrics?.enabledSignals || Object.values(signals).flat().filter(s => s.enabled).length;
  const totalCount = metrics?.totalSignals || Object.values(signals).flat().length;
  
  // Use live agent count from stats API or metrics
  const totalActiveAgents = metrics?.activeAgents || stats?.totalActiveAgents || 0;
  
  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId);
    setAgentModalOpen(true);
  };
  
  const handleAgentTerminated = () => {
    // Refresh will happen automatically via SWR
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-600/20 text-green-400 border-green-600';
    if (confidence >= 0.6) return 'bg-yellow-600/20 text-yellow-400 border-yellow-600';
    return 'bg-red-600/20 text-red-400 border-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mesh Configuration
              </h1>
              <p className="text-gray-400 mt-2">
                Manage and configure the intelligence mesh
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Active Signals</div>
              <div className="text-3xl font-bold text-green-400">
                {enabledCount} / {totalCount}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Events Today</div>
                <div className="text-2xl font-bold text-white">{metrics?.totalEventsToday?.toLocaleString() || mockSignalMetrics.totalEventsToday.toLocaleString()}</div>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Active Signals</div>
                <div className="text-2xl font-bold text-green-400">{mockSignalMetrics.activeSignals}</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Error Rate</div>
                <div className="text-2xl font-bold text-yellow-400">{(mockSignalMetrics.errorRate * 100).toFixed(2)}%</div>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Avg Latency</div>
                <div className="text-2xl font-bold text-purple-400">{mockSignalMetrics.avgLatency}ms</div>
              </div>
              <Database className="h-8 w-8 text-purple-400" />
            </div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Active Agents</div>
                <div className="text-2xl font-bold text-cyan-400">{totalActiveAgents}</div>
              </div>
              <Bot className="h-8 w-8 text-cyan-400" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Navigation */}
          <div className="col-span-3">
            <Card className="bg-slate-900 border-slate-800 p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-200">Categories</h2>
              <nav className="space-y-2">
                {Object.keys(signals).map((category) => {
                  const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                  const categorySignals = signals[category];
                  const enabledInCategory = categorySignals.filter(s => s.enabled).length;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{category}</span>
                      </div>
                      {enabledInCategory > 0 && (
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          {enabledInCategory}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Panel */}
          <div className="col-span-9">
            <Card className="bg-slate-900 border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-200">
                  {selectedCategory} Signals
                </h2>
                <Badge variant="outline" className="text-gray-400">
                  {filteredSignals.length} signals
                </Badge>
              </div>

              {/* Signals List */}
              <div className="space-y-3">
                {filteredSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-white">{signal.name}</h3>
                        {signal.enabled && signal.status === 'active' && (
                          <Badge className="bg-green-600 text-white flex items-center space-x-1">
                            <Check className="h-3 w-3" />
                            <span>Active</span>
                          </Badge>
                        )}
                        {signal.enabled && signal.status === 'error' && (
                          <Badge className="bg-red-600 text-white flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Error</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{signal.description}</p>
                      {signal.enabled && signal.filters && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.keys(signal.filters).length > 0 && (
                            <Badge variant="outline" className="text-xs text-blue-400">
                              {Object.keys(signal.filters).length} filter(s) applied
                            </Badge>
                          )}
                        </div>
                      )}
                      <LiveAgentDisplay 
                        signalId={signal.id} 
                        enabled={signal.enabled}
                        onAgentClick={handleAgentClick}
                        getConfidenceColor={getConfidenceColor}
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      {signal.enabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            console.log('[SignalsDashboard] Simulate signal (frontend only):', signal.id);
                          }}
                          className="border-slate-700 text-gray-300 hover:bg-slate-700"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Simulate
                        </Button>
                      )}
                      <Switch
                        checked={signal.enabled}
                        onCheckedChange={() => handleToggleSignal(signal.id)}
                      />
                    </div>
                  </div>
                ))}

                {filteredSignals.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No signals found matching your search</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Filter Configuration Modal */}
      <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Configure Filters: {selectedSignal?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Set up filters to refine the data flowing into your application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Dynamic filter fields based on signal type */}
            {selectedSignal?.category === 'Analytics' && (
              <>
                <div className="space-y-2">
                  <Label>Time Horizon</Label>
                  <Select
                    value={filterConfig.timeHorizon || 'quarterly'}
                    onValueChange={(value) =>
                      setFilterConfig({ ...filterConfig, timeHorizon: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select time horizon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input
                    value={filterConfig.region || 'All Regions'}
                    onChange={(e) =>
                      setFilterConfig({ ...filterConfig, region: e.target.value })
                    }
                    placeholder="e.g., North America, EMEA"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confidence Threshold (%)</Label>
                  <Slider
                    value={[filterConfig.confidenceThreshold || 70]}
                    onValueChange={(value) =>
                      setFilterConfig({ ...filterConfig, confidenceThreshold: value[0] })
                    }
                    max={100}
                    step={5}
                    className="py-4"
                  />
                  <div className="text-right text-sm text-gray-400">
                    {filterConfig.confidenceThreshold || 70}%
                  </div>
                </div>
              </>
            )}

            {selectedSignal?.category === 'Communication' && (
              <>
                <div className="space-y-2">
                  <Label>Sender Domain</Label>
                  <Input
                    value={filterConfig.senderDomain || ''}
                    onChange={(e) =>
                      setFilterConfig({ ...filterConfig, senderDomain: e.target.value })
                    }
                    placeholder="e.g., @company.com"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Campaign Type</Label>
                  <Select
                    value={filterConfig.campaignType || ''}
                    onValueChange={(value) =>
                      setFilterConfig({ ...filterConfig, campaignType: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {selectedSignal?.category === 'Systems' && (
              <>
                <div className="space-y-2">
                  <Label>Object Type</Label>
                  <Select
                    value={filterConfig.objectType || ''}
                    onValueChange={(value) =>
                      setFilterConfig({ ...filterConfig, objectType: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select object type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="opportunity">Opportunity</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="contact">Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Stage Filter</Label>
                  <Input
                    value={filterConfig.stage || ''}
                    onChange={(e) =>
                      setFilterConfig({ ...filterConfig, stage: e.target.value })
                    }
                    placeholder="e.g., Qualified, Negotiation"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </>
            )}

            {selectedSignal?.category === 'Repositories' && (
              <>
                <div className="space-y-2">
                  <Label>File Type</Label>
                  <Select
                    value={filterConfig.fileType || ''}
                    onValueChange={(value) =>
                      setFilterConfig({ ...filterConfig, fileType: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                      <SelectItem value="pptx">PPTX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modified Date</Label>
                  <Input
                    type="date"
                    value={filterConfig.modifiedDate || ''}
                    onChange={(e) =>
                      setFilterConfig({ ...filterConfig, modifiedDate: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </>
            )}

            {selectedSignal?.category === 'Plans' && (
              <>
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select
                    value={filterConfig.priority || ''}
                    onValueChange={(value) =>
                      setFilterConfig({ ...filterConfig, priority: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={filterConfig.department || ''}
                    onChange={(e) =>
                      setFilterConfig({ ...filterConfig, department: e.target.value })
                    }
                    placeholder="e.g., Marketing, Sales"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFilterModalOpen(false)}
              className="border-slate-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFilters}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Details Modal */}
      <AgentDetailsModal
        agentId={selectedAgentId}
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        onAgentTerminated={handleAgentTerminated}
      />
    </div>
  );
}
