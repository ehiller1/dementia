/**
 * Inline Approval Gate Component
 * 
 * Approve or reject agent spawning within conversation
 * Windsurf-style inline approval UI
 */

import React, { useState } from 'react';
import { Check, X, AlertCircle, Bot } from 'lucide-react';

export interface ApprovalRequest {
  id: string;
  type: 'agent_spawning' | 'decision_execution' | 'data_access';
  title: string;
  description: string;
  agents?: Array<{
    id: string;
    name: string;
    capabilities: string[];
  }>;
  metadata?: any;
}

interface InlineApprovalGateProps {
  request: ApprovalRequest;
  onApprove: (requestId: string, metadata?: any) => void;
  onReject: (requestId: string, reason?: string) => void;
  className?: string;
}

export function InlineApprovalGate({
  request,
  onApprove,
  onReject,
  className = ''
}: InlineApprovalGateProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(request.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(request.id, 'User rejected');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`border border-orange-300 bg-orange-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {request.title}
          </h4>
          
          <p className="text-sm text-gray-700 mb-3">
            {request.description}
          </p>
          
          {request.agents && request.agents.length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-xs font-medium text-gray-700">
                Agents to spawn:
              </p>
              {request.agents.map(agent => (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 text-xs bg-white rounded px-3 py-2 border border-gray-200"
                >
                  <Bot className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{agent.name}</span>
                  <span className="text-gray-500">
                    ({agent.capabilities.slice(0, 2).join(', ')}
                    {agent.capabilities.length > 2 && ` +${agent.capabilities.length - 2} more`})
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="
                flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md
                hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors text-sm font-medium
              "
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="
                flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md
                hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors text-sm font-medium
              "
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
