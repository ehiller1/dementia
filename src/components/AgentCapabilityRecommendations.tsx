/**
 * Agent Capability Recommendations Component
 * 
 * Displays AI-powered agent suggestions: "I can help with..."
 * Shows agents that match current conversation context
 */

import React, { useState } from 'react';
import { Bot, Zap, Target, TrendingUp, CheckCircle, X } from 'lucide-react';

interface AgentRecommendation {
  id: string;
  name: string;
  capabilities: string[];
  confidence: number;
  suggestedFor: string;
  description: string;
  estimatedTime?: string;
}

interface AgentCapabilityRecommendationsProps {
  recommendations: AgentRecommendation[];
  onRequestAgent?: (agent: AgentRecommendation) => void;
  onDismiss?: (agentId: string) => void;
  className?: string;
}

export function AgentCapabilityRecommendations({
  recommendations = [],
  onRequestAgent,
  onDismiss,
  className = ''
}: AgentCapabilityRecommendationsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleRequestAgent = (agent: AgentRecommendation) => {
    if (onRequestAgent) {
      onRequestAgent(agent);
    }
  };

  const handleDismiss = (agentId: string) => {
    setDismissed(prev => new Set([...prev, agentId]));
    if (onDismiss) {
      onDismiss(agentId);
    }
  };

  const visibleRecommendations = recommendations.filter(
    rec => !dismissed.has(rec.id)
  );

  if (visibleRecommendations.length === 0) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400 bg-green-400/20';
    if (confidence >= 0.75) return 'text-blue-400 bg-blue-400/20';
    if (confidence >= 0.6) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-gray-400 bg-gray-400/20';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle className="w-3 h-3" />;
    if (confidence >= 0.75) return <Target className="w-3 h-3" />;
    return <TrendingUp className="w-3 h-3" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Bot className="w-4 h-4 text-cyan-400" />
        <span>I can help with...</span>
        <span className="text-xs text-gray-500">
          ({visibleRecommendations.length} suggestion{visibleRecommendations.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Recommendations */}
      <div className="space-y-2">
        {visibleRecommendations.map((agent) => (
          <div
            key={agent.id}
            className="group relative bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-3 hover:border-cyan-400/50 transition-all"
          >
            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(agent.id)}
              className="absolute top-2 right-2 p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Dismiss suggestion"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Agent header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-cyan-500/20">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-200">
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {agent.suggestedFor}
                  </div>
                </div>
              </div>

              {/* Confidence badge */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(agent.confidence)}`}>
                {getConfidenceIcon(agent.confidence)}
                <span>{Math.round(agent.confidence * 100)}%</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 mb-2 line-clamp-2">
              {agent.description}
            </p>

            {/* Capabilities */}
            <div className="flex flex-wrap gap-1 mb-2">
              {agent.capabilities.slice(0, 3).map((capability, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700/50 text-gray-300 border border-slate-600"
                >
                  <Zap className="w-3 h-3 text-yellow-400" />
                  {capability}
                </span>
              ))}
              {agent.capabilities.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-400">
                  +{agent.capabilities.length - 3} more
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              {agent.estimatedTime && (
                <span className="text-xs text-gray-500">
                  Est. {agent.estimatedTime}
                </span>
              )}
              <button
                onClick={() => handleRequestAgent(agent)}
                className="ml-auto px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Bot className="w-3 h-3" />
                Request Agent
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact variant for sidebar
 */
export function AgentCapabilityRecommendationsCompact({
  recommendations = [],
  onRequestAgent,
  className = ''
}: Omit<AgentCapabilityRecommendationsProps, 'onDismiss'>) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
        <Bot className="w-3 h-3 text-cyan-400" />
        <span>Suggested Agents</span>
      </div>

      {/* Compact list */}
      <div className="space-y-1">
        {recommendations.slice(0, 3).map((agent) => (
          <button
            key={agent.id}
            onClick={() => onRequestAgent?.(agent)}
            className="w-full flex items-center justify-between gap-2 p-2 rounded bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-cyan-500/30 transition-all text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-300 truncate">
                  {agent.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {agent.capabilities[0]}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-cyan-400">
              {Math.round(agent.confidence * 100)}%
            </div>
          </button>
        ))}
      </div>

      {recommendations.length > 3 && (
        <div className="text-xs text-gray-500 text-center">
          +{recommendations.length - 3} more agents available
        </div>
      )}
    </div>
  );
}
