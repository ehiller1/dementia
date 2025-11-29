/**
 * Executive Observation Panel
 * Displays high-priority executive observations prominently in the UI
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Clock, Users, Target, ChevronRight } from 'lucide-react';
import { executiveObservationService, ExecutiveObservation } from '../services/ExecutiveObservationService.js';

// Interface moved to service file

interface ExecutiveObservationPanelProps {
  observations?: ExecutiveObservation[];
  onObservationClick?: (observation: ExecutiveObservation) => void;
  className?: string;
}

export const ExecutiveObservationPanel: React.FC<ExecutiveObservationPanelProps> = ({
  observations = [],
  onObservationClick,
  className = ''
}) => {
  const [localObservations, setLocalObservations] = useState<ExecutiveObservation[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Subscribe to executive observation service
  useEffect(() => {
    console.log('🔔 [ExecutiveObservationPanel] Subscribing to observation service');
    
    const unsubscribe = executiveObservationService.subscribe((newObservations) => {
      console.log('📊 [ExecutiveObservationPanel] Received observations update:', newObservations.length);
      setLocalObservations(newObservations);
    });

    return () => {
      console.log('🔕 [ExecutiveObservationPanel] Unsubscribing from observation service');
      unsubscribe();
    };
  }, []);

  // Use provided observations if any, otherwise use service observations
  useEffect(() => {
    if (observations.length > 0) {
      console.log('📊 [ExecutiveObservationPanel] Using provided observations:', observations.length);
      setLocalObservations(observations);
    }
  }, [observations]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <TrendingUp className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Target className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'forecast':
        return <TrendingUp className="h-4 w-4" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity':
        return <Target className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const criticalCount = localObservations.filter(obs => obs.priority === 'critical').length;
  const highCount = localObservations.filter(obs => obs.priority === 'high').length;
  const actionRequiredCount = localObservations.filter(obs => obs.actionRequired).length;

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Executive Observations</h3>
          </div>
          <div className="flex items-center space-x-2">
            {criticalCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                {highCount} High
              </span>
            )}
            {actionRequiredCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {actionRequiredCount} Action Required
              </span>
            )}
          </div>
        </div>
        <ChevronRight 
          className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
        />
      </div>

      {/* Observations List */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {localObservations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No executive observations at this time</p>
              <p className="text-sm mt-1">High-priority business insights will appear here</p>
            </div>
          ) : (
            localObservations.map((observation) => (
              <div
                key={observation.id}
                className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${getPriorityColor(observation.priority)}`}
                onClick={() => onObservationClick?.(observation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getPriorityIcon(observation.priority)}
                      <h4 className="font-semibold text-gray-900">{observation.title}</h4>
                      {observation.category && (
                        <div className="flex items-center space-x-1 text-gray-500">
                          {getCategoryIcon(observation.category)}
                          <span className="text-xs capitalize">{observation.category}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      {observation.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(observation.timestamp)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Target className="h-3 w-3" />
                          <span>{Math.round(observation.metadata.confidence * 100)}% confidence</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{observation.source}</span>
                        </span>
                      </div>
                      
                      {observation.actionRequired && (
                        <button className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                          Take Action
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Actions Footer */}
      {isExpanded && actionRequiredCount > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {actionRequiredCount} observation{actionRequiredCount !== 1 ? 's' : ''} require executive action
            </span>
            <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Review All Actions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveObservationPanel;
