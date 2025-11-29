/**
 * Execution Monitor Component
 * 
 * Real-time monitoring of decision execution across systems
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Server,
  Package
} from 'lucide-react';

interface ExecutionTicket {
  id: string;
  actionId: string;
  system: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  externalRef?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  rollbackable: boolean;
  metadata: {
    functionName: string;
    actionType: string;
    payload: any;
  };
}

interface ExecutionStatus {
  tickets: ExecutionTicket[];
  overallStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETE';
  completedCount: number;
  failedCount: number;
}

interface ExecutionMonitorProps {
  decisionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
  decisionId,
  autoRefresh = true,
  refreshInterval = 3000
}) => {
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/decisions/${decisionId}/execution`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch execution status');
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      console.error('[ExecutionMonitor] Fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [decisionId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, decisionId]);

  const toggleExpand = (ticketId: string) => {
    setExpanded(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-500">Loading execution status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Error loading execution status</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-center py-8 text-gray-500">
        No execution data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon status={status.overallStatus} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Execution Status
              </h3>
              <p className="text-sm text-gray-500">
                {status.completedCount} of {status.tickets.length} actions completed
                {status.failedCount > 0 && ` • ${status.failedCount} failed`}
              </p>
            </div>
          </div>
          <button
            onClick={fetchStatus}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="text-gray-900 font-medium">
              {((status.completedCount / status.tickets.length) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                status.overallStatus === 'FAILED'
                  ? 'bg-red-500'
                  : status.overallStatus === 'COMPLETED'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{
                width: `${(status.completedCount / status.tickets.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Execution Tickets */}
      <div className="space-y-2">
        {status.tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white rounded-lg border border-gray-200"
          >
            {/* Ticket Header */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(ticket.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <TicketStatusIcon status={ticket.status} />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {ticket.metadata.functionName}
                    </h4>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {ticket.metadata.actionType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Server className="w-3 h-3" />
                      <span>{ticket.system}</span>
                    </div>
                    {ticket.externalRef && (
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{ticket.externalRef}</span>
                      </div>
                    )}
                  </div>
                </div>

                <StatusBadge status={ticket.status} />
              </div>

              {expanded[ticket.id] ? (
                <ChevronUp className="w-5 h-5 text-gray-400 ml-2" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 ml-2" />
              )}
            </div>

            {/* Ticket Details (Expanded) */}
            {expanded[ticket.id] && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {ticket.startedAt && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Started At</div>
                      <div className="text-sm text-gray-900">
                        {new Date(ticket.startedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {ticket.completedAt && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Completed At</div>
                      <div className="text-sm text-gray-900">
                        {new Date(ticket.completedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {ticket.error && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <div className="text-xs font-medium text-red-700 mb-1">Error</div>
                    <div className="text-sm text-red-600">{ticket.error}</div>
                  </div>
                )}

                {ticket.status === 'ROLLED_BACK' && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs font-medium text-orange-700 mb-1">
                      Rollback Status
                    </div>
                    <div className="text-sm text-orange-600">
                      Action has been rolled back due to execution failure
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Status Icon Component
 */
const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    case 'FAILED':
      return <XCircle className="w-8 h-8 text-red-500" />;
    case 'IN_PROGRESS':
      return <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />;
    default:
      return <Clock className="w-8 h-8 text-gray-400" />;
  }
};

/**
 * Ticket Status Icon Component
 */
const TicketStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'FAILED':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'ROLLED_BACK':
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case 'IN_PROGRESS':
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
};

/**
 * Status Badge Component
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    PENDING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    ROLLED_BACK: 'bg-orange-100 text-orange-700'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
