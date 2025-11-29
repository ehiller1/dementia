/**
 * Read Activity Feed Component
 * 
 * Displays what events/data the system has read
 * Similar to Windsurf's "Read" tab
 */

import React, { useState } from 'react';
import { BookOpen, Database, FileText, Zap, ChevronDown, ChevronRight } from 'lucide-react';

export interface ReadActivity {
  id: string;
  conversationId: string;
  type: 'redis_stream' | 'agent_evidence' | 'blackboard_context' | 
        'template_retrieval' | 'memory_query' | 'decision_context';
  source: string;
  summary: string;
  data?: any;
  timestamp: string;
}

interface ReadActivityFeedProps {
  activities: ReadActivity[];
  maxItems?: number;
  className?: string;
}

export function ReadActivityFeed({ 
  activities = [], 
  maxItems = 50,
  className = '' 
}: ReadActivityFeedProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const displayedActivities = activities.slice(0, maxItems);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getIcon = (type: ReadActivity['type']) => {
    switch (type) {
      case 'redis_stream':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'agent_evidence':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'blackboard_context':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'template_retrieval':
        return <BookOpen className="w-4 h-4 text-orange-500" />;
      case 'memory_query':
        return <Database className="w-4 h-4 text-cyan-500" />;
      case 'decision_context':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: ReadActivity['type']): string => {
    switch (type) {
      case 'redis_stream': return 'Stream';
      case 'agent_evidence': return 'Evidence';
      case 'blackboard_context': return 'Context';
      case 'template_retrieval': return 'Template';
      case 'memory_query': return 'Memory';
      case 'decision_context': return 'Decision';
      default: return type;
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

  if (displayedActivities.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No read activity yet</p>
        <p className="text-xs mt-1">Events and data reads will appear here</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            Read Activity
          </h3>
        </div>
        <span className="text-xs text-gray-500">
          {displayedActivities.length} {displayedActivities.length === 1 ? 'read' : 'reads'}
        </span>
      </div>

      {/* Activity List */}
      {displayedActivities.map((activity) => {
        const isExpanded = expandedItems.has(activity.id);
        const hasData = activity.data && Object.keys(activity.data).length > 0;

        return (
          <div
            key={activity.id}
            className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {activity.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {getTypeLabel(activity.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        from {activity.source}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    {hasData && (
                      <button
                        onClick={() => toggleExpand(activity.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Data View */}
                {isExpanded && hasData && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(activity.data, null, 2)}
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
