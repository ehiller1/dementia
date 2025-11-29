/**
 * Manager Monitoring Dashboard
 * Real-time health and metrics visualization for CrewAI managers
 */

import React, { useState, useEffect } from 'react';

interface HealthStatus {
  manager_id: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  heartbeat_age_seconds: number;
  pending_messages: number;
  error_rate_pct: number;
  avg_latency_ms: number;
  circuit_breaker_state: 'closed' | 'open' | 'half-open';
  circuit_breaker_failures: number;
  details: {
    total_routed?: number;
    successful?: number;
    failed?: number;
    dlq_pending?: number;
    dlq_total?: number;
  };
}

interface DLQStats {
  total: number;
  by_error_type: Record<string, number>;
  by_manager: Record<string, number>;
  recent_failures: number;
}

interface DLQEntry {
  id: string;
  manager_id: string;
  event_id: string;
  error_type: string;
  error_message: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
}

export const ManagerMonitoringDashboard: React.FC = () => {
  const [managers, setManagers] = useState<HealthStatus[]>([]);
  const [dlqStats, setDLQStats] = useState<DLQStats | null>(null);
  const [recentDLQ, setRecentDLQ] = useState<DLQEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      // Fetch manager health
      const healthRes = await fetch('/api/managers/health');
      const healthData = await healthRes.json();
      if (healthData.success) {
        setManagers(healthData.managers);
      }

      // Fetch DLQ stats
      const dlqStatsRes = await fetch('/api/managers/dlq/stats');
      const dlqStatsData = await dlqStatsRes.json();
      if (dlqStatsData.success) {
        setDLQStats(dlqStatsData.stats);
      }

      // Fetch recent DLQ entries
      const dlqRecentRes = await fetch('/api/managers/dlq/recent?limit=10');
      const dlqRecentData = await dlqRecentRes.json();
      if (dlqRecentData.success) {
        setRecentDLQ(dlqRecentData.entries);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'closed': return 'text-green-600';
      case 'half-open': return 'text-yellow-600';
      case 'open': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manager Monitoring Dashboard</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-refresh (10s)</span>
          </label>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Managers</div>
          <div className="text-2xl font-bold">{managers.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Healthy</div>
          <div className="text-2xl font-bold text-green-600">
            {managers.filter(m => m.status === 'healthy').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">DLQ Total</div>
          <div className="text-2xl font-bold text-red-600">{dlqStats?.total || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Recent Failures (1h)</div>
          <div className="text-2xl font-bold text-orange-600">{dlqStats?.recent_failures || 0}</div>
        </div>
      </div>

      {/* Manager Health Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Manager Health</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heartbeat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Circuit Breaker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metrics</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {managers.map((manager) => (
                <tr key={manager.manager_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {manager.manager_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(manager.status)}`}>
                      {manager.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {manager.heartbeat_age_seconds}s ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {manager.pending_messages}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {manager.error_rate_pct.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {manager.avg_latency_ms.toFixed(0)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${getCircuitBreakerColor(manager.circuit_breaker_state)}`}>
                      {manager.circuit_breaker_state}
                    </span>
                    {manager.circuit_breaker_failures > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({manager.circuit_breaker_failures} failures)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>✓ {manager.details.successful || 0}</div>
                      <div>✗ {manager.details.failed || 0}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DLQ Error Breakdown */}
      {dlqStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">DLQ by Error Type</h2>
            <div className="space-y-2">
              {Object.entries(dlqStats.by_error_type).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">DLQ by Manager</h2>
            <div className="space-y-2">
              {Object.entries(dlqStats.by_manager).map(([manager, count]) => (
                <div key={manager} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{manager}</span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent DLQ Entries */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent DLQ Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retries</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDLQ.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.manager_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {entry.event_id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {entry.error_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {entry.error_message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.retry_count} / {entry.max_retries}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
