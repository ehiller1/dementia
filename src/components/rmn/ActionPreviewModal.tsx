/**
 * Action Preview Modal - Microsoft AI UX Principle: TRANSPARENCY
 * Shows detailed before/after data impact for any agent action
 */

import React from 'react';
import { X, ArrowRight, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DataChange {
  recordId: string;
  recordType: string;
  field: string;
  before: string | number;
  after: string | number;
}

interface ActionPreview {
  actionId: string;
  title: string;
  description: string;
  agent: string;
  estimatedTime: string;
  riskLevel: 'high' | 'medium' | 'low';
  affectedRecords: number;
  dataChanges: DataChange[];
  reversible: boolean;
}

interface ActionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: ActionPreview;
  onConfirm: () => void;
}

export function ActionPreviewModal({ isOpen, onClose, preview, onConfirm }: ActionPreviewModalProps) {
  const riskColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };

  const riskLabels = {
    high: 'High Impact',
    medium: 'Medium Impact',
    low: 'Low Impact'
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
            className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Action Preview</h2>
                  <p className="text-sm text-gray-600">Review changes before execution</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 max-h-[calc(80vh-200px)]">
              {/* Action Summary */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{preview.title}</h3>
                    <p className="text-sm text-gray-600">{preview.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${riskColors[preview.riskLevel]}`}>
                    {riskLabels[preview.riskLevel]}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-600">Agent</div>
                    <div className="text-sm font-medium">{preview.agent}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-600">Est. Time</div>
                    <div className="text-sm font-medium">{preview.estimatedTime}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-600">Affected Records</div>
                    <div className="text-sm font-medium">{preview.affectedRecords}</div>
                  </div>
                </div>
              </div>

              {/* Data Changes Preview */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-gray-900">Data Impact</h4>
                  <span className="text-xs text-gray-500">
                    {preview.dataChanges.length} changes across {preview.affectedRecords} records
                  </span>
                </div>

                <div className="space-y-3">
                  {preview.dataChanges.map((change, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-700">
                          {change.recordType}
                        </span>
                        <span className="text-xs text-gray-500">#{change.recordId}</span>
                      </div>
                      
                      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
                        {/* Before */}
                        <div className="rounded bg-red-50 p-2">
                          <div className="text-xs text-gray-600 mb-1">{change.field}</div>
                          <div className="text-sm font-medium text-red-700">
                            {change.before}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="h-4 w-4 text-gray-400" />

                        {/* After */}
                        <div className="rounded bg-green-50 p-2">
                          <div className="text-xs text-gray-600 mb-1">{change.field}</div>
                          <div className="text-sm font-medium text-green-700">
                            {change.after}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recoverability Notice */}
              {preview.reversible && (
                <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-900">All changes are reversible</div>
                    <div className="text-xs text-green-700 mt-1">
                      You can undo this action at any time from the activity log
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Warning */}
              {preview.riskLevel === 'high' && (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3 mt-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-900">High-impact action</div>
                    <div className="text-xs text-red-700 mt-1">
                      This action will make significant changes to your data. Please review carefully.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t p-4 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm & Execute
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
