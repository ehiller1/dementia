/**
 * Action Selector Component
 * Allows users to select or cancel recommended actions from conversational responses
 */

import React, { useState } from 'react';
import { Check, X, Loader, AlertCircle } from 'lucide-react';

export interface Action {
  id: string;
  content: string;
  category?: string;
  metadata?: any;
}

interface ActionSelectorProps {
  actions: Action[];
  conversationId: string;
  originalQuery: string;
  context?: any;
  onComplete?: (result: any) => void;
}

export function ActionSelector({ 
  actions, 
  conversationId, 
  originalQuery,
  context,
  onComplete 
}: ActionSelectorProps) {
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [canceledActions, setCanceledActions] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAction = (actionId: string, type: 'select' | 'cancel') => {
    if (type === 'select') {
      const newSelected = new Set(selectedActions);
      const newCanceled = new Set(canceledActions);
      
      if (newSelected.has(actionId)) {
        newSelected.delete(actionId);
      } else {
        newSelected.add(actionId);
        newCanceled.delete(actionId); // Remove from canceled if selected
      }
      
      setSelectedActions(newSelected);
      setCanceledActions(newCanceled);
    } else {
      const newSelected = new Set(selectedActions);
      const newCanceled = new Set(canceledActions);
      
      if (newCanceled.has(actionId)) {
        newCanceled.delete(actionId);
      } else {
        newCanceled.add(actionId);
        newSelected.delete(actionId); // Remove from selected if canceled
      }
      
      setSelectedActions(newSelected);
      setCanceledActions(newCanceled);
    }
  };

  const processActions = async () => {
    setProcessing(true);
    setError(null);

    try {
      const selected = actions.filter(a => selectedActions.has(a.id));
      const canceled = actions.filter(a => canceledActions.has(a.id));

      console.log('[ActionSelector] Processing:', {
        selected: selected.length,
        canceled: canceled.length
      });

      const response = await fetch('/api/actions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          selectedActions: selected,
          canceledActions: canceled,
          originalQuery,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[ActionSelector] Result:', result);

      if (onComplete) {
        onComplete(result);
      }

    } catch (err: any) {
      console.error('[ActionSelector] Error:', err);
      setError(err.message || 'Failed to process actions');
    } finally {
      setProcessing(false);
    }
  };

  const hasSelections = selectedActions.size > 0 || canceledActions.size > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          📋 Recommended Actions
        </h3>
        {hasSelections && (
          <span className="text-xs text-gray-500">
            {selectedActions.size} selected • {canceledActions.size} canceled
          </span>
        )}
      </div>

      <div className="space-y-2">
        {actions.map((action) => {
          const isSelected = selectedActions.has(action.id);
          const isCanceled = canceledActions.has(action.id);

          return (
            <div
              key={action.id}
              className={`
                flex items-start gap-3 p-3 rounded-lg border transition-all
                ${isSelected ? 'bg-green-50 border-green-300' : ''}
                ${isCanceled ? 'bg-red-50 border-red-300 opacity-60' : ''}
                ${!isSelected && !isCanceled ? 'bg-gray-50 border-gray-200 hover:border-gray-300' : ''}
              `}
            >
              <div className="flex-1">
                <p className={`text-sm ${isCanceled ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {action.content}
                </p>
                {action.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    {action.category}
                  </span>
                )}
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => toggleAction(action.id, 'select')}
                  disabled={processing}
                  className={`
                    p-1.5 rounded transition-colors
                    ${isSelected 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  title="Select this action"
                >
                  <Check className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggleAction(action.id, 'cancel')}
                  disabled={processing}
                  className={`
                    p-1.5 rounded transition-colors
                    ${isCanceled 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  title="Cancel this action"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {hasSelections && (
        <button
          onClick={processActions}
          disabled={processing}
          className="
            w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg
            hover:bg-blue-700 transition-colors font-medium text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {processing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing Actions...
            </>
          ) : (
            <>
              Process {selectedActions.size + canceledActions.size} Action{(selectedActions.size + canceledActions.size) !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}

      <p className="text-xs text-gray-500 text-center">
        Selected actions will update workflows and activate impact agents
      </p>
    </div>
  );
}
