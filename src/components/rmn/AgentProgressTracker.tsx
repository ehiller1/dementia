/**
 * Agent Progress Tracker - Microsoft AI UX Principle: CONTROL
 * Floating progress cards with pause/cancel controls
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, StopCircle, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
}

interface AgentProgress {
  agentId: string;
  agentName: string;
  status: 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
  currentStep: number;
  totalSteps: number;
  steps: ProgressStep[];
  startTime: string;
  estimatedCompletion?: string;
  canPause: boolean;
  canCancel: boolean;
}

interface AgentProgressTrackerProps {
  progressItems: AgentProgress[];
  onPause: (agentId: string) => void;
  onResume: (agentId: string) => void;
  onCancel: (agentId: string) => void;
  onDismiss: (agentId: string) => void;
}

export function AgentProgressTracker({
  progressItems,
  onPause,
  onResume,
  onCancel,
  onDismiss
}: AgentProgressTrackerProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const getStatusColor = (status: AgentProgress['status']) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: AgentProgress['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <StopCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStepIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-2 w-2 rounded-full bg-gray-300" />;
      case 'running':
        return <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-3 max-w-md">
      <AnimatePresence>
        {progressItems.map((item) => {
          const isExpanded = expandedAgent === item.agentId;
          const progressPercent = (item.currentStep / item.totalSteps) * 100;

          return (
            <motion.div
              key={item.agentId}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
            >
              {/* Compact Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedAgent(isExpanded ? null : item.agentId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {item.agentName}
                      </div>
                      <div className="text-xs text-gray-600">
                        Step {item.currentStep} of {item.totalSteps}
                      </div>
                    </div>
                  </div>

                  {/* Dismiss button for completed/failed/cancelled */}
                  {['completed', 'failed', 'cancelled'].includes(item.status) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(item.agentId);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <motion.div
                    className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Current Activity */}
                {item.status === 'running' && (
                  <div className="text-xs text-gray-600 mb-2">
                    {item.steps[item.currentStep - 1]?.name || 'Processing...'}
                  </div>
                )}

                {/* Controls */}
                {item.status === 'running' || item.status === 'paused' ? (
                  <div className="flex items-center gap-2">
                    {item.canPause && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          item.status === 'running'
                            ? onPause(item.agentId)
                            : onResume(item.agentId);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                      >
                        {item.status === 'running' ? (
                          <>
                            <Pause className="h-3 w-3" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            Resume
                          </>
                        )}
                      </button>
                    )}

                    {item.canCancel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to cancel this action?')) {
                            onCancel(item.agentId);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                      >
                        <StopCircle className="h-3 w-3" />
                        Cancel
                      </button>
                    )}

                    {item.estimatedCompletion && (
                      <div className="ml-auto text-xs text-gray-500">
                        ~{item.estimatedCompletion}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-medium">
                    {item.status === 'completed' && (
                      <span className="text-green-600">✓ Completed successfully</span>
                    )}
                    {item.status === 'failed' && (
                      <span className="text-red-600">✗ Failed to complete</span>
                    )}
                    {item.status === 'cancelled' && (
                      <span className="text-gray-600">⊘ Cancelled by user</span>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Execution Steps
                    </div>
                    <div className="space-y-2">
                      {item.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-start gap-2">
                          <div className="mt-1">{getStepIcon(step.status)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-700">{step.name}</div>
                            {step.startTime && (
                              <div className="text-[10px] text-gray-500">
                                {step.status === 'completed' && step.endTime
                                  ? `Completed at ${step.endTime}`
                                  : `Started at ${step.startTime}`}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State Message */}
      {progressItems.length === 0 && (
        <div className="rounded-xl bg-white/90 backdrop-blur shadow-lg border border-gray-200 p-4 text-center">
          <div className="text-sm text-gray-600">No active tasks</div>
        </div>
      )}
    </div>
  );
}
