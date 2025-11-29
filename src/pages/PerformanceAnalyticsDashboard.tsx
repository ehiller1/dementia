/**
 * Performance Analytics Dashboard
 * 
 * Analyze decision performance, variance, and success metrics
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface PerformanceMetric {
  decision_id: string;
  status: string;
  created_at: string;
  approval_time_ms?: number;
  execution_time_ms?: number;
  chosen_option_label?: string;
  projected_gross_profit?: number;
  actual_gross_profit?: number;
  variance_pct?: number;
  outcome_count: number;
}

export default function PerformanceAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [statusFilter, setStatusFilter] = useState<'all' | 'APPROVED' | 'COMPLETED'>('all');

  useEffect(() => {
    fetchPerformance();
  }, [timeRange, statusFilter]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      // Calculate date range
      const toDate = new Date();
      const fromDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      fromDate.setDate(fromDate.getDate() - days);
      
      params.append('fromDate', fromDate.toISOString());
      params.append('toDate', toDate.toISOString());

      const response = await fetch(`/api/decisions/performance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data || []);
      }
    } catch (error) {
      console.error('[PerformanceAnalytics] Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const stats = calculateStats(metrics);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track decision effectiveness and outcome variance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TimeRangeButton
                label="7 Days"
                active={timeRange === '7d'}
                onClick={() => setTimeRange('7d')}
              />
              <TimeRangeButton
                label="30 Days"
                active={timeRange === '30d'}
                onClick={() => setTimeRange('30d')}
              />
              <TimeRangeButton
                label="90 Days"
                active={timeRange === '90d'}
                onClick={() => setTimeRange('90d')}
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
            <MetricCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Total Decisions"
              value={stats.totalDecisions}
              color="blue"
            />
            <MetricCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Completed"
              value={stats.completedCount}
              color="green"
            />
            <MetricCard
              icon={<Clock className="w-5 h-5" />}
              label="Avg Approval Time"
              value={`${stats.avgApprovalTime}s`}
              color="purple"
            />
            <MetricCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Total GP Impact"
              value={`$${stats.totalGPImpact.toLocaleString()}`}
              color="green"
            />
            <MetricCard
              icon={<Target className="w-5 h-5" />}
              label="Avg Variance"
              value={`${stats.avgVariance}%`}
              color={parseFloat(stats.avgVariance) > 10 ? 'red' : 'green'}
            />
            <MetricCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Success Rate"
              value={`${stats.successRate}%`}
              color={parseFloat(stats.successRate) > 80 ? 'green' : 'yellow'}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Status:</span>
          <StatusFilterButton
            label="All"
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <StatusFilterButton
            label="Approved"
            active={statusFilter === 'APPROVED'}
            onClick={() => setStatusFilter('APPROVED')}
          />
          <StatusFilterButton
            label="Completed"
            active={statusFilter === 'COMPLETED'}
            onClick={() => setStatusFilter('COMPLETED')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading performance data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Decision Performance Trend
              </h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart visualization coming soon</p>
                  <p className="text-sm">Integration with Chart.js or Recharts</p>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Top Performing Decisions
              </h2>
              <div className="space-y-3">
                {metrics
                  .filter(m => m.actual_gross_profit)
                  .sort((a, b) => (b.actual_gross_profit || 0) - (a.actual_gross_profit || 0))
                  .slice(0, 5)
                  .map((metric) => (
                    <PerformanceRow key={metric.decision_id} metric={metric} />
                  ))}
                {metrics.filter(m => m.actual_gross_profit).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No completed decisions with outcomes yet
                  </div>
                )}
              </div>
            </div>

            {/* Variance Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Variance Analysis
              </h2>
              <div className="space-y-3">
                {metrics
                  .filter(m => m.variance_pct !== undefined)
                  .sort((a, b) => Math.abs(b.variance_pct || 0) - Math.abs(a.variance_pct || 0))
                  .slice(0, 5)
                  .map((metric) => (
                    <VarianceRow key={metric.decision_id} metric={metric} />
                  ))}
                {metrics.filter(m => m.variance_pct !== undefined).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No variance data available yet
                  </div>
                )}
              </div>
            </div>

            {/* Decision Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Decisions
              </h2>
              <div className="space-y-2">
                {metrics.slice(0, 10).map((metric) => (
                  <TimelineRow key={metric.decision_id} metric={metric} />
                ))}
                {metrics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No decisions in selected time range
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Calculate Summary Stats
 */
function calculateStats(metrics: PerformanceMetric[]) {
  const totalDecisions = metrics.length;
  const completedCount = metrics.filter(m => m.status === 'COMPLETED').length;
  
  const totalApprovalTime = metrics.reduce((sum, m) => sum + (m.approval_time_ms || 0), 0);
  const avgApprovalTime = totalDecisions > 0 
    ? (totalApprovalTime / totalDecisions / 1000).toFixed(1)
    : '0';
  
  const totalGPImpact = metrics.reduce((sum, m) => sum + (m.actual_gross_profit || 0), 0);
  
  const varianceMetrics = metrics.filter(m => m.variance_pct !== undefined);
  const avgVariance = varianceMetrics.length > 0
    ? Math.abs(varianceMetrics.reduce((sum, m) => sum + Math.abs(m.variance_pct || 0), 0) / varianceMetrics.length).toFixed(1)
    : '0';
  
  const successfulDecisions = varianceMetrics.filter(m => Math.abs(m.variance_pct || 0) < 15).length;
  const successRate = varianceMetrics.length > 0
    ? ((successfulDecisions / varianceMetrics.length) * 100).toFixed(0)
    : '0';

  return {
    totalDecisions,
    completedCount,
    avgApprovalTime,
    totalGPImpact,
    avgVariance,
    successRate
  };
}

/**
 * Helper Components
 */
const TimeRangeButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      {label}
    </button>
  );
};

const StatusFilterButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      {label}
    </button>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
}> = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
};

const PerformanceRow: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm">{metric.chosen_option_label}</div>
        <div className="text-xs text-gray-500">
          {new Date(metric.created_at).toLocaleDateString()}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold text-green-600">
          ${metric.actual_gross_profit?.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">GP Impact</div>
      </div>
    </div>
  );
};

const VarianceRow: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => {
  const variance = metric.variance_pct || 0;
  const isPositive = variance > 0;
  const isSignificant = Math.abs(variance) > 10;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm">{metric.chosen_option_label}</div>
        <div className="text-xs text-gray-500">
          Projected: ${metric.projected_gross_profit?.toLocaleString()} → 
          Actual: ${metric.actual_gross_profit?.toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isSignificant && <AlertTriangle className="w-4 h-4 text-orange-500" />}
        <div className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{variance.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

const TimelineRow: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
      <Calendar className="w-4 h-4 text-gray-400" />
      <div className="flex-1">
        <span className="text-sm text-gray-600">
          {new Date(metric.created_at).toLocaleString()}
        </span>
      </div>
      <StatusBadge status={metric.status} />
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};
