/**
 * Builder Dashboard - System Design & Process Improvement
 * 
 * Focus: Architecture, process flows, system improvement
 * Information Density: Medium (design-focused)
 * Time Horizon: Medium-term (days to weeks)
 */

import React, { useEffect, useState } from 'react';
import { Wrench, GitBranch, FileCode, Layers, RefreshCw, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { eventBus } from '@/services/events/EventBus';

interface ProcessImprovement {
  id: string;
  title: string;
  category: 'architecture' | 'workflow' | 'automation' | 'integration';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  status: 'proposed' | 'in_design' | 'in_progress' | 'completed';
  roi: number;
}

interface SystemMetric {
  name: string;
  current: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
}

export function BuilderDashboard() {
  const [improvements, setImprovements] = useState<ProcessImprovement[]>([
    {
      id: '1',
      title: 'Automate inventory reallocation workflow',
      category: 'automation',
      impact: 'high',
      effort: 'medium',
      status: 'in_design',
      roi: 3.2
    },
    {
      id: '2',
      title: 'Implement agent performance caching layer',
      category: 'architecture',
      impact: 'medium',
      effort: 'low',
      status: 'proposed',
      roi: 2.8
    },
    {
      id: '3',
      title: 'Design cross-functional coordination framework',
      category: 'workflow',
      impact: 'high',
      effort: 'high',
      status: 'in_progress',
      roi: 4.1
    },
    {
      id: '4',
      title: 'Build template versioning system',
      category: 'integration',
      impact: 'medium',
      effort: 'medium',
      status: 'proposed',
      roi: 2.5
    }
  ]);

  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    { name: 'Process Automation', current: 65, target: 85, trend: 'up' },
    { name: 'System Efficiency', current: 72, target: 90, trend: 'up' },
    { name: 'Code Reusability', current: 58, target: 75, trend: 'stable' },
    { name: 'Integration Coverage', current: 80, target: 95, trend: 'up' }
  ]);

  useEffect(() => {
    // Subscribe to system improvement events
    const improvementSub = eventBus.subscribe('system.improvement_identified', (event) => {
      setImprovements(prev => [{
        id: event.id || String(Date.now()),
        title: event.title || 'New improvement opportunity',
        category: event.category || 'workflow',
        impact: event.impact || 'medium',
        effort: event.effort || 'medium',
        status: 'proposed',
        roi: event.roi || 2.0
      }, ...prev]);
    });

    return () => {
      improvementSub.unsubscribe();
    };
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'architecture': return <Layers size={16} />;
      case 'workflow': return <GitBranch size={16} />;
      case 'automation': return <RefreshCw size={16} />;
      case 'integration': return <FileCode size={16} />;
      default: return <Wrench size={16} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'architecture': return 'bg-purple-100 text-purple-700';
      case 'workflow': return 'bg-blue-100 text-blue-700';
      case 'automation': return 'bg-green-100 text-green-700';
      case 'integration': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return colors[impact as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'in_design': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  };

  return (
    <div className="builder-dashboard p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Wrench className="text-blue-600" />
            <span>Builder Workshop</span>
          </h1>
          <p className="text-gray-600 mt-1">System design and process improvement</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Design Mode</div>
          <div className="text-lg font-semibold text-blue-600">Active</div>
        </div>
      </div>

      {/* System Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric) => (
          <Card key={metric.name} className="p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">{metric.name}</h3>
              <span className="text-lg">{getTrendIcon(metric.trend)}</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Current: {metric.current}%</span>
                <span>Target: {metric.target}%</span>
              </div>
              <Progress value={metric.current} className="h-2" />
            </div>
            <div className="text-xs text-gray-500">
              Gap: {metric.target - metric.current}% to target
            </div>
          </Card>
        ))}
      </div>

      {/* Process Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Improvements */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Process Improvements</h2>
            <Button variant="outline" size="sm">
              <Wrench size={16} className="mr-1" />
              New Design
            </Button>
          </div>
          <div className="space-y-3">
            {improvements.map((improvement) => (
              <div
                key={improvement.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 ${getCategoryColor(improvement.category)}`}>
                        {getCategoryIcon(improvement.category)}
                        <span className="ml-1">{improvement.category}</span>
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactBadge(improvement.impact)}`}>
                        {improvement.impact} impact
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{improvement.title}</h3>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold text-green-600">
                      {improvement.roi.toFixed(1)}x ROI
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${getStatusColor(improvement.status)}`}>
                    {improvement.status.replace('_', ' ')}
                  </span>
                  <span className="text-gray-500">
                    Effort: {improvement.effort}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Architecture Overview */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Architecture</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Layers size={18} />
                <span>Orchestration Layer</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Continuous loop with macro/micro orchestration, 95% operational
              </p>
              <div className="mt-2">
                <Progress value={95} className="h-2" />
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <GitBranch size={18} />
                <span>Intelligence Router</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Formatter routed, pattern established for other services
              </p>
              <div className="mt-2">
                <Progress value={15} className="h-2" />
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <RefreshCw size={18} />
                <span>State Persistence</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Loop state persists, resumes after restart
              </p>
              <div className="mt-2">
                <Progress value={100} className="h-2" />
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <FileCode size={18} />
                <span>Event-Driven UI</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                SSE streaming, phase progress events, role adaptation
              </p>
              <div className="mt-2">
                <Progress value={90} className="h-2" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Design Patterns Library */}
      <Card className="p-6 bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Design Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Event Sourcing</h3>
            <p className="text-sm text-gray-600 mb-2">
              Append-only event log with state reconstruction
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Pattern
            </Button>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-semibold text-gray-900 mb-2">CQRS</h3>
            <p className="text-sm text-gray-600 mb-2">
              Separate read and write models for scalability
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Pattern
            </Button>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Saga Pattern</h3>
            <p className="text-sm text-gray-600 mb-2">
              Distributed transaction coordination
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Pattern
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
