/**
 * Thought Activity Feed Component
 * 
 * Displays LLM reasoning processes and decision-making steps
 * Similar to Windsurf's "Thought" tab showing AI thinking
 */

import React, { useState } from 'react';
import { Brain, Lightbulb, Target, ChevronDown, ChevronRight, Zap } from 'lucide-react';

export interface ThoughtActivity {
  id: string;
  conversationId: string;
  type: 'reasoning' | 'agent_selection' | 'semantic_routing' | 
        'template_match' | 'decision_weighing' | 'slot_extraction' |
        'packlet_execution';
  summary: string;
  reasoning: string[];
  confidence?: number;
  metadata?: any;
  timestamp: string;
}

interface ThoughtActivityFeedProps {
  thoughts: ThoughtActivity[];
  maxItems?: number;
  className?: string;
}

export function ThoughtActivityFeed({ 
  thoughts = [], 
  maxItems = 50,
  className = '' 
}: ThoughtActivityFeedProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const displayedThoughts = thoughts.slice(0, maxItems);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getIcon = (type: ThoughtActivity['type']) => {
    switch (type) {
      case 'reasoning':
        return <Brain className="w-4 h-4 text-blue-600" />;
      case 'agent_selection':
        return <Target className="w-4 h-4 text-green-600" />;
      case 'semantic_routing':
        return <Zap className="w-4 h-4 text-purple-600" />;
      case 'template_match':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case 'decision_weighing':
        return <Brain className="w-4 h-4 text-indigo-600" />;
      case 'slot_extraction':
        return <Lightbulb className="w-4 h-4 text-cyan-600" />;
      case 'packlet_execution':
        return <Zap className="w-4 h-4 text-orange-600" />;
      default:
        return <Brain className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: ThoughtActivity['type']): string => {
    switch (type) {
      case 'reasoning': return 'Reasoning';
      case 'agent_selection': return 'Agent Selection';
      case 'semantic_routing': return 'Routing';
      case 'template_match': return 'Template';
      case 'decision_weighing': return 'Decision';
      case 'slot_extraction': return 'Extraction';
      case 'packlet_execution': return 'Execution';
      default: return type;
    }
  };

  const getTypeColor = (type: ThoughtActivity['type']): string => {
    switch (type) {
      case 'reasoning': return 'bg-blue-100 text-blue-700';
      case 'agent_selection': return 'bg-green-100 text-green-700';
      case 'semantic_routing': return 'bg-purple-100 text-purple-700';
      case 'template_match': return 'bg-yellow-100 text-yellow-700';
      case 'decision_weighing': return 'bg-indigo-100 text-indigo-700';
      case 'slot_extraction': return 'bg-cyan-100 text-cyan-700';
      case 'packlet_execution': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 10) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString();
  };

  if (displayedThoughts.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No thinking activity yet</p>
        <p className="text-xs mt-1">AI reasoning steps will appear here</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            Thought Process
          </h3>
        </div>
        <span className="text-xs text-gray-500">
          {displayedThoughts.length} {displayedThoughts.length === 1 ? 'thought' : 'thoughts'}
        </span>
      </div>

      {/* Thoughts List */}
      {displayedThoughts.map((thought) => {
        const isExpanded = expandedItems.has(thought.id);
        const hasMetadata = thought.metadata && Object.keys(thought.metadata).length > 0;

        return (
          <div
            key={thought.id}
            className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(thought.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getTypeColor(thought.type)}`}>
                        {getTypeLabel(thought.type)}
                      </span>
                      {thought.confidence !== undefined && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {Math.round(thought.confidence * 100)}% confident
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-blue-900">
                      {thought.summary}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 whitespace-nowrap">
                      {formatTimestamp(thought.timestamp)}
                    </span>
                    {hasMetadata && (
                      <button
                        onClick={() => toggleExpand(thought.id)}
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-blue-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Reasoning Steps - Always Visible */}
                <div className="space-y-1 ml-6">
                  {thought.reasoning.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs text-blue-600 font-mono mt-0.5">
                        {idx + 1}.
                      </span>
                      <p className="text-xs text-blue-800 flex-1 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Expanded Metadata View */}
                {isExpanded && hasMetadata && (
                  <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-1">
                      Additional Details:
                    </p>
                    <pre className="text-xs text-blue-700 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(thought.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
