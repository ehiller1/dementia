/**
 * Incident Dashboard
 * 
 * Monitor and manage business incidents triggering decisions
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Search,
  Filter
} from 'lucide-react';

interface Incident {
  id: string;
  scope: {
    product?: any;
    location?: any;
    time?: any;
  };
  signal: {
    deltaDemandPct: number;
    baseline?: any;
    confidencePct?: number;
  };
  status: 'NEW' | 'ANALYZING' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at?: string;
}

export default function IncidentDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'NEW' | 'ANALYZING' | 'RESOLVED'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await fetch(`/api/incidents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIncidents(data.incidents || []);
      }
    } catch (error) {
      console.error('[IncidentDashboard] Fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
  };

  // Calculate stats
  const stats = {
    total: incidents.length,
    new: incidents.filter(i => i.status === 'NEW').length,
    analyzing: incidents.filter(i => i.status === 'ANALYZING').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    avgConfidence: incidents.length > 0
      ? (incidents.reduce((sum, i) => sum + (i.signal.confidencePct || 0), 0) / incidents.length * 100).toFixed(0)
      : 0
  };

  // Filter by search
  const filteredIncidents = incidents.filter(incident =>
    searchTerm === '' ||
    incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(incident.scope).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Incident Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor business anomalies and demand shifts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => {/* TODO: Create incident modal */}}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Incident
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Total Incidents"
              value={stats.total}
              color="gray"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="New"
              value={stats.new}
              color="yellow"
            />
            <StatCard
              icon={<RefreshCw className="w-5 h-5" />}
              label="Analyzing"
              value={stats.analyzing}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Resolved"
              value={stats.resolved}
              color="green"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Avg Confidence"
              value={`${stats.avgConfidence}%`}
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <FilterButton
              label="All"
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              count={stats.total}
            />
            <FilterButton
              label="New"
              active={filter === 'NEW'}
              onClick={() => setFilter('NEW')}
              count={stats.new}
            />
            <FilterButton
              label="Analyzing"
              active={filter === 'ANALYZING'}
              onClick={() => setFilter('ANALYZING')}
              count={stats.analyzing}
            />
            <FilterButton
              label="Resolved"
              active={filter === 'RESOLVED'}
              onClick={() => setFilter('RESOLVED')}
              count={stats.resolved}
            />
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading incidents...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No incidents found</p>
            {searchTerm && (
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'gray' | 'yellow' | 'blue' | 'green' | 'purple';
}> = ({ icon, label, value, color }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Filter Button Component
 */
const FilterButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}> = ({ label, active, onClick, count }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      {label} ({count})
    </button>
  );
};

/**
 * Incident Card Component
 */
const IncidentCard: React.FC<{ incident: Incident }> = ({ incident }) => {
  const isNegative = incident.signal.deltaDemandPct < 0;
  const severity = Math.abs(incident.signal.deltaDemandPct) > 0.15 ? 'high' : 
                   Math.abs(incident.signal.deltaDemandPct) > 0.08 ? 'medium' : 'low';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <SeverityBadge severity={severity} />
            <StatusBadge status={incident.status} />
            <span className="text-xs text-gray-500">{incident.id}</span>
          </div>

          {/* Signal */}
          <div className="flex items-center gap-2 mb-3">
            {isNegative ? (
              <TrendingDown className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-green-500" />
            )}
            <span className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
              {isNegative ? '' : '+'}{(incident.signal.deltaDemandPct * 100).toFixed(1)}%
            </span>
            <span className="text-gray-600">demand shift</span>
            {incident.signal.confidencePct && (
              <span className="text-sm text-gray-500">
                ({(incident.signal.confidencePct * 100).toFixed(0)}% confidence)
              </span>
            )}
          </div>

          {/* Scope */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {incident.scope.product?.choiceSetId && (
              <div>
                <span className="font-medium">Product:</span> {incident.scope.product.choiceSetId}
              </div>
            )}
            {incident.scope.location?.regionId && (
              <div>
                <span className="font-medium">Region:</span> {incident.scope.location.regionId}
              </div>
            )}
            {incident.scope.time?.weekId && (
              <div>
                <span className="font-medium">Week:</span> {incident.scope.time.weekId}
              </div>
            )}
          </div>

          {/* Baseline */}
          {incident.signal.baseline && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <span className="font-medium text-gray-700">Baseline: </span>
              <span className="text-gray-600">
                {incident.signal.baseline.units?.toLocaleString()} units • 
                ${incident.signal.baseline.revenue?.toLocaleString()} revenue
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-right text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(incident.created_at).toLocaleString()}</span>
          </div>
          {incident.updated_at && (
            <div className="mt-1">
              Updated: {new Date(incident.updated_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Severity Badge
 */
const SeverityBadge: React.FC<{ severity: 'low' | 'medium' | 'high' }> = ({ severity }) => {
  const colors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[severity]}`}>
      {severity.toUpperCase()}
    </span>
  );
};

/**
 * Status Badge
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    NEW: 'bg-blue-100 text-blue-700',
    ANALYZING: 'bg-purple-100 text-purple-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-700'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};
