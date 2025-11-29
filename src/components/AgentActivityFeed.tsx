/**
 * Agent Activity Feed Component
 * 
 * Live feed of agent activities: "Agent X is analyzing inventory..."
 * Real-time updates via WebSocket
 */

import React, { useState, useEffect } from 'react';
import { Bot, Loader, CheckCircle, XCircle, Activity } from 'lucide-react';

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  type: 'spawned' | 'started' | 'progress' | 'completed' | 'failed';
  message: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    decisionId?: string;
    result?: any;
    error?: string;
  };
}

interface AgentActivityFeedProps {
  activities: AgentActivity[];
  maxItems?: number;
  className?: string;
  showTimestamps?: boolean;
}

export function AgentActivityFeed({
  activities = [],
  maxItems = 10,
  className = '',
  showTimestamps = true
}: AgentActivityFeedProps) {
  const [displayedActivities, setDisplayedActivities] = useState<AgentActivity[]>([]);

  useEffect(() => {
    // Show most recent activities first
    const sorted = [...activities].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setDisplayedActivities(sorted.slice(0, maxItems));
  }, [activities, maxItems]);

  const renderActivityIcon = (type: AgentActivity['type']) => {
    switch (type) {
      case 'spawned':
        return <Bot className="w-4 h-4 text-blue-500" />;
      case 'started':
        return <Activity className="w-4 h-4 text-purple-500" />;
      case 'progress':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (displayedActivities.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No agent activity yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {displayedActivities.map((activity) => (
        <div
          key={activity.id}
          className={`
            flex items-start gap-3 p-3 rounded-lg border transition-all
            ${activity.type === 'progress' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}
            ${activity.type === 'completed' ? 'opacity-75' : ''}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {renderActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.agentName}</span>
              {' '}
              <span className="text-gray-600">{activity.message}</span>
            </p>
            
            {showTimestamps && (
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(activity.timestamp)}
              </p>
            )}
            
            {activity.metadata?.confidence !== undefined && (
              <div className="mt-1 text-xs text-gray-600">
                Confidence: {Math.round(activity.metadata.confidence * 100)}%
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
