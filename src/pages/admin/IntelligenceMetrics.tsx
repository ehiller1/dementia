import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  DollarSign, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ModelMetrics {
  name: string;
  requests: number;
  avgLatency: number;
  avgCost: number;
  successRate: number;
  fallbackRate: number;
  totalCost: number;
}

export default function IntelligenceMetrics() {
  const [timeRange, setTimeRange] = useState('24h');

  const models: ModelMetrics[] = [
    {
      name: 'GPT-4',
      requests: 1247,
      avgLatency: 2.3,
      avgCost: 0.045,
      successRate: 98.5,
      fallbackRate: 1.2,
      totalCost: 56.12,
    },
    {
      name: 'GPT-3.5-Turbo',
      requests: 3891,
      avgLatency: 0.8,
      avgCost: 0.008,
      successRate: 97.2,
      fallbackRate: 2.1,
      totalCost: 31.13,
    },
    {
      name: 'Claude-3-Opus',
      requests: 892,
      avgLatency: 1.9,
      avgCost: 0.038,
      successRate: 99.1,
      fallbackRate: 0.5,
      totalCost: 33.90,
    },
    {
      name: 'Claude-3-Sonnet',
      requests: 2156,
      avgLatency: 1.2,
      avgCost: 0.015,
      successRate: 98.8,
      fallbackRate: 0.8,
      totalCost: 32.34,
    },
  ];

  const taskDistribution = [
    { task: 'Demand Forecasting', model: 'GPT-4', count: 342, avgCost: 0.052 },
    { task: 'Pricing Optimization', model: 'Claude-3-Opus', count: 289, avgCost: 0.041 },
    { task: 'Inventory Allocation', model: 'GPT-3.5-Turbo', count: 1203, avgCost: 0.009 },
    { task: 'Anomaly Detection', model: 'Claude-3-Sonnet', count: 567, avgCost: 0.016 },
    { task: 'Report Generation', model: 'GPT-3.5-Turbo', count: 891, avgCost: 0.007 },
  ];

  const totalRequests = models.reduce((sum, m) => sum + m.requests, 0);
  const totalCost = models.reduce((sum, m) => sum + m.totalCost, 0);
  const avgLatency = models.reduce((sum, m) => sum + m.avgLatency * m.requests, 0) / totalRequests;
  const avgSuccessRate = models.reduce((sum, m) => sum + m.successRate * m.requests, 0) / totalRequests;

  const costOptimizationSuggestions = [
    {
      title: 'Route simple tasks to GPT-3.5-Turbo',
      impact: 'Save ~$18/day',
      description: 'Inventory allocation and report generation can use cheaper model',
      priority: 'high',
    },
    {
      title: 'Implement caching for repeated queries',
      impact: 'Save ~$12/day',
      description: 'Cache common demand forecast patterns',
      priority: 'medium',
    },
    {
      title: 'Batch similar requests',
      impact: 'Save ~$8/day',
      description: 'Group pricing optimization requests to reduce API calls',
      priority: 'low',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-400" />
            Intelligence Router Metrics
          </h1>
          <p className="text-gray-400 mt-1">
            Model usage, performance, and cost optimization insights
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="1h">1 Hour</TabsTrigger>
            <TabsTrigger value="24h">24 Hours</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-white mt-1">{totalRequests.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Cost</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">${totalCost.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Latency</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{avgLatency.toFixed(2)}s</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Clock className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{avgSuccessRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Model Performance */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Model Performance Breakdown</h2>
        <div className="space-y-4">
          {models.map((model) => (
            <div key={model.name} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                  <p className="text-sm text-gray-400">{model.requests.toLocaleString()} requests</p>
                </div>
                <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                  ${model.totalCost.toFixed(2)} total
                </Badge>
              </div>

              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Avg Latency</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <span className="text-white font-semibold">{model.avgLatency}s</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Avg Cost</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-yellow-400" />
                    <span className="text-white font-semibold">${model.avgCost.toFixed(3)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white font-semibold">{model.successRate}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Fallback Rate</p>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <span className="text-white font-semibold">{model.fallbackRate}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Usage</p>
                  <Progress value={(model.requests / totalRequests) * 100} className="h-2 mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Task Distribution */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Task Distribution by Model</h2>
        <div className="space-y-3">
          {taskDistribution.map((task, index) => (
            <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium">{task.task}</h3>
                    <Badge variant="outline" className="text-xs border-slate-600">
                      {task.model}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400">{task.count} requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-400">${task.avgCost.toFixed(3)} avg</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${(task.count * task.avgCost).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">total cost</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cost Optimization Suggestions */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <TrendingDown className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Cost Optimization Suggestions</h2>
            <p className="text-sm text-gray-400">Potential savings: ~$38/day</p>
          </div>
        </div>

        <div className="space-y-4">
          {costOptimizationSuggestions.map((suggestion, index) => (
            <div key={index} className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold">{suggestion.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        suggestion.priority === 'high' ? 'border-red-500 text-red-400' :
                        suggestion.priority === 'medium' ? 'border-yellow-500 text-yellow-400' :
                        'border-blue-500 text-blue-400'
                      }`}
                    >
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">{suggestion.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">{suggestion.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cost Trend */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cost Trend</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Today</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">$153.49</span>
                <TrendingUp className="h-4 w-4 text-red-400" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Yesterday</span>
              <span className="text-white font-semibold">$142.31</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">7-day avg</span>
              <span className="text-white font-semibold">$138.22</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">30-day avg</span>
              <span className="text-white font-semibold">$145.67</span>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Fastest Model</span>
              <span className="text-white font-semibold">GPT-3.5-Turbo (0.8s)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Most Reliable</span>
              <span className="text-white font-semibold">Claude-3-Opus (99.1%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Most Cost-Effective</span>
              <span className="text-white font-semibold">GPT-3.5-Turbo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Fallbacks</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">127</span>
                <TrendingDown className="h-4 w-4 text-green-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
