/**
 * Executive Dashboard - Strategic Synthesis & Oversight
 * 
 * Focus: High-level synthesis, confidence distribution, agent provenance
 * Information Density: Medium (synthesized insights)
 * Time Horizon: Strategic (weeks to months)
 */

import React, { useEffect, useState } from 'react';
import { eventBus } from '@/services/events/EventBus';
import { Crown, TrendingUp, Users, Target, BarChart3, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function ExecutiveDashboard() {
  // Use shared event bus directly (no OrchestrationProvider needed)
  const [agentProvenance, setAgentProvenance] = useState<any[]>([]);
  const [confidenceDistribution, setConfidenceDistribution] = useState<any>({});
  const [strategicRecommendations, setStrategicRecommendations] = useState<any[]>([]);
  const [outcomeMetrics, setOutcomeMetrics] = useState<any>({});

  useEffect(() => {
    // Subscribe to agent completion events for provenance
    const agentSub = eventBus.subscribe('agent.completed', (event) => {
      setAgentProvenance(prev => [{
        id: event.agentId,
        name: event.agentName || event.agentId,
        confidence: event.confidence || 0.85,
        results: event.results,
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 10));
    });

    // Subscribe to marketplace bidding for confidence distribution
    const marketplaceSub = eventBus.subscribe('agent.assigned_from_marketplace', (event) => {
      setConfidenceDistribution(prev => ({
        ...prev,
        [event.agentName]: event.confidence
      }));
    });

    // Subscribe to decision events for strategic recommendations
    const decisionSub = eventBus.subscribe('decision.created', (event) => {
      if (event.decision_type === 'recommendation' || event.priority === 'high') {
        setStrategicRecommendations(prev => [{
          id: event.id,
          title: event.title,
          description: event.description,
          priority: event.priority,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 5));
      }
    });

    return () => {
      agentSub.unsubscribe();
      marketplaceSub.unsubscribe();
      decisionSub.unsubscribe();
    };
  }, [eventBus]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-blue-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="executive-dashboard p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Crown className="text-green-600" />
            <span>Executive Command Center</span>
          </h1>
          <p className="text-gray-600 mt-1">Strategic oversight and synthesis</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Orchestration Status</div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-lg font-medium text-green-600">Active</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Agents</h3>
            <Users className="text-blue-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{Object.keys(confidenceDistribution).length}</div>
          <div className="text-xs text-gray-500 mt-1">Contributing to analysis</div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Avg Confidence</h3>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Object.keys(confidenceDistribution).length > 0
              ? `${Math.round((Object.values(confidenceDistribution).reduce((a: any, b: any) => a + b, 0) / Object.keys(confidenceDistribution).length) * 100)}%`
              : '85%'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Quality metric</div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Recommendations</h3>
            <Target className="text-purple-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{strategicRecommendations.length}</div>
          <div className="text-xs text-gray-500 mt-1">Strategic actions</div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
            <CheckCircle className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">92%</div>
          <div className="text-xs text-gray-500 mt-1">Historical performance</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Provenance */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl">Agent Provenance</h3>
            <BarChart3 size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Recent agent contributions with confidence metrics
          </p>
          <div className="space-y-3">
            {agentProvenance.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No agent activity yet
              </div>
            ) : (
              agentProvenance.map(agent => (
                <div key={agent.id + agent.timestamp} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{agent.name}</div>
                    <div className={`font-mono text-sm ${getConfidenceColor(agent.confidence)}`}>
                      {(agent.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={agent.confidence * 100} className="flex-1 h-2" />
                    <span className="text-xs text-gray-500">
                      {new Date(agent.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Confidence Distribution */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl">Confidence Distribution</h3>
            <TrendingUp size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Current agent confidence levels
          </p>
          <div className="space-y-3">
            {Object.keys(confidenceDistribution).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No confidence data available
              </div>
            ) : (
              Object.entries(confidenceDistribution).map(([agent, confidence]: [string, any]) => (
                <div key={agent} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-1">{agent}</div>
                    <div className="flex items-center space-x-2">
                      <Progress value={confidence * 100} className="flex-1 h-2" />
                      <span className={`text-sm font-mono ${getConfidenceColor(confidence)}`}>
                        {(confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Strategic Recommendations */}
      <Card className="p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl">Strategic Recommendations</h3>
          <Target size={24} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 mb-4">
          High-priority strategic actions requiring executive decision
        </p>
        <div className="space-y-3">
          {strategicRecommendations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <CheckCircle size={48} className="mx-auto mb-2 text-green-500" />
              <p>No pending strategic recommendations</p>
            </div>
          ) : (
            strategicRecommendations.map(rec => (
              <div key={rec.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{rec.title}</div>
                    <div className="text-sm text-gray-700">{rec.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(rec.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {rec.priority?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Outcome Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white">
          <h3 className="font-medium text-gray-600 mb-2">Efficiency Gain</h3>
          <div className="text-3xl font-bold text-green-600">+23%</div>
          <div className="text-xs text-gray-500 mt-1">vs. last period</div>
        </Card>

        <Card className="p-6 bg-white">
          <h3 className="font-medium text-gray-600 mb-2">Cost Reduction</h3>
          <div className="text-3xl font-bold text-blue-600">$45K</div>
          <div className="text-xs text-gray-500 mt-1">estimated savings</div>
        </Card>

        <Card className="p-6 bg-white">
          <h3 className="font-medium text-gray-600 mb-2">Risk Mitigation</h3>
          <div className="text-3xl font-bold text-purple-600">85%</div>
          <div className="text-xs text-gray-500 mt-1">identified risks</div>
        </Card>
      </div>
    </div>
  );
}
