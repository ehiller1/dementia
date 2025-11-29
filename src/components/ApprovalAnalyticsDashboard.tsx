/**
 * ApprovalAnalyticsDashboard
 * Visualizes approval metrics, bottlenecks, and optimization opportunities
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';

interface ApprovalMetrics {
  total_approvals: number;
  avg_approval_time_hours: number;
  approval_grant_rate: number;
  approval_overhead_cost_usd: number;
  bottlenecks: Bottleneck[];
  optimization_opportunities: OptimizationOpportunity[];
}

interface Bottleneck {
  action_type: string;
  avg_approval_time_hours: number;
  approval_count: number;
  approval_rate: number;
  bottleneck_severity: 'low' | 'medium' | 'high' | 'critical';
  recommended_actions: string[];
}

interface OptimizationOpportunity {
  opportunity_type: 'auto_execute' | 'delegate' | 'simplify' | 'parallel';
  action_type: string;
  description: string;
  estimated_time_savings_hours: number;
  estimated_cost_savings_usd: number;
  confidence: number;
  implementation_steps: string[];
}

interface ThresholdHistory {
  timestamp: string;
  threshold_type: string;
  old_value: number;
  new_value: number;
  reason: string;
}

interface RejectionPattern {
  action_type: string;
  rejection_count: number;
  rejection_rate: number;
  common_reasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

export const ApprovalAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ApprovalMetrics | null>(null);
  const [thresholdHistory, setThresholdHistory] = useState<ThresholdHistory[]>([]);
  const [rejectionPatterns, setRejectionPatterns] = useState<RejectionPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'bottlenecks' | 'opportunities' | 'thresholds' | 'rejections'>('overview');
  const [lookbackDays, setLookbackDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [lookbackDays]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch approval metrics
      const metricsRes = await fetch(`/api/approvals/analytics?lookbackDays=${lookbackDays}`);
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

      // Fetch threshold history
      const thresholdsRes = await fetch('/api/approvals/threshold-history');
      const thresholdsData = await thresholdsRes.json();
      setThresholdHistory(thresholdsData);

      // Fetch rejection patterns
      const rejectionsRes = await fetch(`/api/approvals/rejection-patterns?lookbackDays=${lookbackDays}`);
      const rejectionsData = await rejectionsRes.json();
      setRejectionPatterns(rejectionsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'auto_execute': return <Zap className="w-5 h-5" />;
      case 'delegate': return <Target className="w-5 h-5" />;
      case 'simplify': return <TrendingDown className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Approval Analytics</h1>
        <p className="text-gray-600">Monitor approval efficiency and identify optimization opportunities</p>
      </div>

      {/* Lookback Period Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Analysis Period:</label>
        <select
          value={lookbackDays}
          onChange={(e) => setLookbackDays(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={180}>Last 6 months</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Approvals</span>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{metrics.total_approvals}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Approval Time</span>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics.avg_approval_time_hours.toFixed(1)}h
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Approval Rate</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {(metrics.approval_grant_rate * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Overhead Cost</span>
            <DollarSign className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ${metrics.approval_overhead_cost_usd.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'bottlenecks', label: `Bottlenecks (${metrics.bottlenecks.length})` },
              { id: 'opportunities', label: `Opportunities (${metrics.optimization_opportunities.length})` },
              { id: 'thresholds', label: 'Threshold History' },
              { id: 'rejections', label: 'Rejection Patterns' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics.bottlenecks.length > 0 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-orange-900">
                            {metrics.bottlenecks.length} Bottlenecks Identified
                          </div>
                          <div className="text-sm text-orange-700 mt-1">
                            {metrics.bottlenecks[0].action_type} taking {metrics.bottlenecks[0].avg_approval_time_hours.toFixed(1)}h average
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {metrics.optimization_opportunities.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-green-900">
                            ${metrics.optimization_opportunities.reduce((sum, o) => sum + o.estimated_cost_savings_usd, 0).toFixed(0)} Potential Savings
                          </div>
                          <div className="text-sm text-green-700 mt-1">
                            {metrics.optimization_opportunities.length} optimization opportunities identified
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottlenecks Tab */}
          {selectedTab === 'bottlenecks' && (
            <div className="space-y-4">
              {metrics.bottlenecks.map((bottleneck, idx) => (
                <div key={idx} className={`p-4 border rounded-lg ${getSeverityColor(bottleneck.bottleneck_severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{bottleneck.action_type}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>⏱️ {bottleneck.avg_approval_time_hours.toFixed(1)}h avg</span>
                        <span>📊 {bottleneck.approval_count} approvals</span>
                        <span>✅ {(bottleneck.approval_rate * 100).toFixed(0)}% granted</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(bottleneck.bottleneck_severity)}`}>
                      {bottleneck.bottleneck_severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Recommended Actions:</div>
                    <ul className="space-y-1">
                      {bottleneck.recommended_actions.map((action, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-gray-600">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Opportunities Tab */}
          {selectedTab === 'opportunities' && (
            <div className="space-y-4">
              {metrics.optimization_opportunities.map((opp, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getOpportunityIcon(opp.opportunity_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{opp.action_type}</h4>
                          <p className="text-sm text-gray-600 mt-1">{opp.description}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {opp.opportunity_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-3 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">Time Savings</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {opp.estimated_time_savings_hours.toFixed(0)}h
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Cost Savings</div>
                          <div className="text-lg font-semibold text-green-600">
                            ${opp.estimated_cost_savings_usd.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Confidence</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {(opp.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">Implementation Steps:</div>
                        <ol className="space-y-1">
                          {opp.implementation_steps.map((step, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-blue-600 font-medium">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Implement Optimization
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Threshold History Tab */}
          {selectedTab === 'thresholds' && (
            <div className="space-y-3">
              {thresholdHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No threshold adjustments yet
                </div>
              ) : (
                thresholdHistory.map((adj, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            {adj.threshold_type}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(adj.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-mono">{adj.old_value.toFixed(2)}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-lg font-mono font-semibold text-blue-600">
                            {adj.new_value.toFixed(2)}
                          </span>
                          {adj.new_value > adj.old_value ? (
                            <TrendingUp className="w-4 h-4 text-red-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{adj.reason}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Rejection Patterns Tab */}
          {selectedTab === 'rejections' && (
            <div className="space-y-4">
              {rejectionPatterns.map((pattern, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{pattern.action_type}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>❌ {pattern.rejection_count} rejections</span>
                        <span>📊 {(pattern.rejection_rate * 100).toFixed(1)}% rejection rate</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Common Rejection Reasons:</div>
                    <div className="space-y-2">
                      {pattern.common_reasons.slice(0, 3).map((reason, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{reason.reason}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${reason.percentage}%` }}
                              />
                            </div>
                            <span className="text-gray-500 w-12 text-right">
                              {reason.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalAnalyticsDashboard;
