import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Zap,
  Brain
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: 'dynamic' | 'static';
  status: 'active' | 'idle' | 'busy' | 'error';
  capabilities: string[];
  currentTask?: string;
  tasksCompleted: number;
  successRate: number;
  avgResponseTime: number;
  createdAt: string;
  lastActive: string;
}

export default function AgentMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Mock data - replace with actual agent data
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'agent-001',
      name: 'Demand Forecast Specialist',
      type: 'dynamic',
      status: 'active',
      capabilities: ['forecasting', 'trend-analysis', 'seasonality'],
      currentTask: 'Analyzing Q4 demand patterns',
      tasksCompleted: 47,
      successRate: 94.5,
      avgResponseTime: 2.3,
      createdAt: '2025-10-20T10:30:00Z',
      lastActive: '2025-10-21T16:45:00Z',
    },
    {
      id: 'agent-002',
      name: 'Pricing Optimizer',
      type: 'static',
      status: 'busy',
      capabilities: ['pricing', 'elasticity', 'competitive-analysis'],
      currentTask: 'Optimizing SKU pricing',
      tasksCompleted: 128,
      successRate: 97.2,
      avgResponseTime: 1.8,
      createdAt: '2025-10-15T08:00:00Z',
      lastActive: '2025-10-21T16:50:00Z',
    },
    {
      id: 'agent-003',
      name: 'Inventory Allocator',
      type: 'dynamic',
      status: 'idle',
      capabilities: ['allocation', 'optimization', 'fulfillment'],
      tasksCompleted: 89,
      successRate: 91.8,
      avgResponseTime: 3.1,
      createdAt: '2025-10-18T14:20:00Z',
      lastActive: '2025-10-21T15:30:00Z',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'idle': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'busy': return <Clock className="h-4 w-4" />;
      case 'idle': return <Pause className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    dynamic: agents.filter(a => a.type === 'dynamic').length,
    avgSuccessRate: (agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length).toFixed(1),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-400" />
            Agent Marketplace
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor and manage autonomous agents in real-time
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Agents</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Now</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Play className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Dynamic Agents</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{stats.dynamic}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Success Rate</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.avgSuccessRate}%</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search agents by name or capability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'busy', 'idle'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? 'bg-purple-600' : 'border-slate-700 text-gray-300'}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="bg-slate-900/50 border-slate-800 p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-slate-700">
                        {agent.type}
                      </Badge>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStatusColor(agent.status)}/20`}>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)} animate-pulse`} />
                        <span className={`text-xs font-medium text-${agent.status === 'active' ? 'green' : agent.status === 'busy' ? 'yellow' : 'gray'}-400`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {agent.currentTask && (
                  <div className="mb-3 p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Current Task</p>
                    <p className="text-sm text-white">{agent.currentTask}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="bg-slate-800 text-gray-300">
                      {cap}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Tasks Completed</p>
                    <p className="text-white font-semibold">{agent.tasksCompleted}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Success Rate</p>
                    <p className="text-green-400 font-semibold">{agent.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Response</p>
                    <p className="text-blue-400 font-semibold">{agent.avgResponseTime}s</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="border-slate-700">
                  View Details
                </Button>
                <Button size="sm" variant="outline" className="border-slate-700 text-red-400">
                  Terminate
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800 p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}
