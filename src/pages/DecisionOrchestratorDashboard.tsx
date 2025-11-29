/**
 * Decision Orchestrator Dashboard
 * 
 * Main UI for cross-functional decision coordination
 * Shows pending decisions with option bundles
 */

import React, { useState } from 'react';
import { 
  RefreshCw, 
  Filter, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { DecisionOrchestratorCard } from '@/components/decision-orchestrator/DecisionOrchestratorCard';
import { useDecisionOrchestrator } from '@/hooks/useDecisionOrchestrator';

export default function DecisionOrchestratorDashboard() {
  const { 
    decisions, 
    loading, 
    error, 
    refresh,
    approveDecision 
  } = useDecisionOrchestrator({
    autoRefresh: true,
    refreshInterval: 10000 // 10 seconds
  });

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleApprove = async (decisionId: string, optionId: string, rationale: string) => {
    try {
      await approveDecision(decisionId, optionId, rationale);
      // Show success toast
      alert('Decision approved successfully!');
    } catch (err: any) {
      alert(`Failed to approve decision: ${err.message}`);
    }
  };

  const handleDismiss = (decisionId: string) => {
    // TODO: Implement dismiss logic
    console.log('Dismiss decision:', decisionId);
  };

  // Filter decisions
  const filteredDecisions = decisions.filter(d => {
    if (filter === 'pending') return d.status === 'PENDING';
    if (filter === 'approved') return d.status === 'APPROVED';
    return true;
  });

  // Calculate stats
  const stats = {
    total: decisions.length,
    pending: decisions.filter(d => d.status === 'PENDING').length,
    approved: decisions.filter(d => d.status === 'APPROVED').length,
    avgOptions: decisions.length > 0 
      ? (decisions.reduce((sum, d) => sum + d.optionsConsidered.length, 0) / decisions.length).toFixed(1)
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Decision Orchestrator
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Cross-functional decision coordination with grain alignment
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Total Decisions"
              value={stats.total}
              color="blue"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Pending"
              value={stats.pending}
              color="yellow"
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Approved"
              value={stats.approved}
              color="green"
            />
            <StatCard
              icon={<AlertCircle className="w-5 h-5" />}
              label="Avg Options"
              value={stats.avgOptions}
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex items-center gap-2">
            <FilterButton
              label="All"
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              count={stats.total}
            />
            <FilterButton
              label="Pending"
              active={filter === 'pending'}
              onClick={() => setFilter('pending')}
              count={stats.pending}
            />
            <FilterButton
              label="Approved"
              active={filter === 'approved'}
              onClick={() => setFilter('approved')}
              count={stats.approved}
            />
          </div>
        </div>
      </div>

      {/* Decision List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading && decisions.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading decisions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Error loading decisions</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No {filter} decisions found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filter === 'pending' 
                ? 'All decisions have been processed' 
                : 'Try changing the filter'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDecisions.map((decision) => (
              <DecisionOrchestratorCard
                key={decision.id}
                decision={decision}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
        <p>
          Decisions auto-refresh every 10 seconds • 
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
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
interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, active, onClick, count }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      {label} ({count})
    </button>
  );
};
