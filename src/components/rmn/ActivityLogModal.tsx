/**
 * Activity Log Modal - Microsoft AI UX Principle: TRUST
 * Complete execution history with timestamps and step details
 */

import React, { useState } from 'react';
import { X, FileText, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  metadata?: Record<string, any>;
}

interface ActivityLog {
  actionId: string;
  actionName: string;
  agent: string;
  status: 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime: string;
  duration: string;
  recordsAffected: number;
  logs: LogEntry[];
}

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityLog: ActivityLog;
}

export function ActivityLogModal({ isOpen, onClose, activityLog }: ActivityLogModalProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  const toggleLogExpansion = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusBadge = (status: ActivityLog['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Cancelled</span>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Activity Log</h2>
                  <p className="text-sm text-gray-600">Detailed execution history</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Action Summary */}
            <div className="border-b p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{activityLog.actionName}</h3>
                  <p className="text-sm text-gray-600">Executed by {activityLog.agent}</p>
                </div>
                {getStatusBadge(activityLog.status)}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-xs text-gray-600">Start Time</div>
                  <div className="text-sm font-medium">{activityLog.startTime}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-xs text-gray-600">End Time</div>
                  <div className="text-sm font-medium">{activityLog.endTime}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-xs text-gray-600">Duration</div>
                  <div className="text-sm font-medium">{activityLog.duration}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-xs text-gray-600">Records Affected</div>
                  <div className="text-sm font-medium">{activityLog.recordsAffected}</div>
                </div>
              </div>
            </div>

            {/* Log Entries */}
            <div className="overflow-y-auto p-4 max-h-[calc(85vh-280px)] bg-gray-50">
              <div className="space-y-2">
                {activityLog.logs.map((log, idx) => {
                  const isExpanded = expandedLogs.has(idx);
                  const hasDetails = log.details || log.metadata;

                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${getLevelColor(log.level)} transition-all`}
                    >
                      <div
                        className={`flex items-start gap-3 ${hasDetails ? 'cursor-pointer' : ''}`}
                        onClick={() => hasDetails && toggleLogExpansion(idx)}
                      >
                        <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-600">
                              {log.timestamp}
                            </span>
                            <span className={`text-xs font-medium uppercase ${
                              log.level === 'success' ? 'text-green-700' :
                              log.level === 'error' ? 'text-red-700' :
                              log.level === 'warning' ? 'text-yellow-700' :
                              'text-blue-700'
                            }`}>
                              {log.level}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900">{log.message}</div>
                        </div>
                        {hasDetails && (
                          <button className="p-1 hover:bg-white/50 rounded transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && hasDetails && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 pl-7 border-t border-gray-200/50 pt-3"
                          >
                            {log.details && (
                              <div className="text-xs text-gray-700 mb-2 whitespace-pre-wrap">
                                {log.details}
                              </div>
                            )}
                            {log.metadata && (
                              <div className="rounded bg-white/50 p-2 font-mono text-xs">
                                <pre className="text-gray-700 overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t p-4 bg-gray-50">
              <div className="text-sm text-gray-600">
                {activityLog.logs.length} log entries
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
