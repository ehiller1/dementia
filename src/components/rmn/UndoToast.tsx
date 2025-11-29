/**
 * Undo Toast - Microsoft AI UX Principle: RECOVERABILITY
 * Toast notifications with undo capability
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, RotateCcw, X } from 'lucide-react';

interface UndoAction {
  id: string;
  actionName: string;
  timestamp: string;
  recordsAffected: number;
  canUndo: boolean;
  undoTimeoutMs?: number;
}

interface UndoToastProps {
  action: UndoAction | null;
  onUndo: (actionId: string) => void;
  onDismiss: () => void;
}

export function UndoToast({ action, onUndo, onDismiss }: UndoToastProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!action || !action.undoTimeoutMs) return;

    setTimeRemaining(action.undoTimeoutMs / 1000);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    const timeout = setTimeout(onDismiss, action.undoTimeoutMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [action, onDismiss]);

  return (
    <AnimatePresence>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="rounded-xl bg-white shadow-2xl border border-gray-200 p-4 min-w-[400px]">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{action.actionName}</div>
                <div className="text-sm text-gray-600">
                  {action.recordsAffected} records affected • {action.timestamp}
                </div>
              </div>
              <button onClick={onDismiss} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            {action.canUndo && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => onUndo(action.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Undo
                </button>
                {timeRemaining > 0 && (
                  <span className="text-xs text-gray-500">
                    Auto-dismiss in {timeRemaining}s
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
