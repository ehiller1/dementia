/**
 * Recent Events (Bottom Panel)
 * Transparency log showing all agent activity with full auditability
 */

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, Loader2, Eye, RotateCcw, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentEvents } from '@/hooks/useAgentEvents';
import { toast } from 'sonner';

interface AgentEvent {
  id: string;
  agentName: string;
  status: 'running' | 'completed' | 'error';
  action: string;
  timestamp: Date;
  recordsAffected?: number;
  currentStep?: string;
  totalSteps?: number;
  canUndo?: boolean;
  errorMessage?: string;
}

interface RecentEventsProps {
  // Optional: Allow passing events from parent, otherwise use hook
  events?: AgentEvent[];
  onViewLog?: (eventId: string) => void;
  onUndo?: (eventId: string) => void;
}

const STATUS_CONFIG = {
  running: {
    icon: Loader2,
    color: 'blue',
    label: 'Running',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    iconClass: 'text-blue-600 animate-spin'
  },
  completed: {
    icon: CheckCircle2,
    color: 'green',
    label: 'Completed',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    iconClass: 'text-green-600'
  },
  error: {
    icon: AlertCircle,
    color: 'red',
    label: 'Error',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    iconClass: 'text-red-600'
  }
};

export function RecentEvents({ events: externalEvents, onViewLog, onUndo }: RecentEventsProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Use hook if external events not provided
  const { events: hookEvents } = useAgentEvents();
  const events = externalEvents || hookEvents;

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current && events.length > 0) {
      scrollRef.current.scrollTop = 0; // Scroll to top for newest events
    }
  }, [events.length]);

  const handleViewLog = async (eventId: string) => {
    if (onViewLog) {
      onViewLog(eventId);
      return;
    }
    
    // Default implementation: fetch log from backend
    try {
      const response = await fetch(`/api/rmn/event-log/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch log');
      const log = await response.json();
      console.log('[RecentEvents] Event log:', log);
      toast.success('Log details opened in console');
    } catch (error) {
      console.error('[RecentEvents] Error fetching log:', error);
      toast.error('Failed to fetch event log');
    }
  };

  const handleUndo = async (eventId: string) => {
    if (onUndo) {
      onUndo(eventId);
      return;
    }

    // Default implementation: call undo API
    try {
      const response = await fetch('/api/rmn/undo-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      
      if (!response.ok) throw new Error('Failed to undo action');
      toast.success('Action undone successfully');
    } catch (error) {
      console.error('[RecentEvents] Error undoing action:', error);
      toast.error('Failed to undo action');
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-64 bg-white border-t border-slate-200 flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Recent Events</h3>
        <Badge variant="secondary" className="text-xs">
          {events.length} events
        </Badge>
      </div>

      {/* Events List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Empty State */}
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Activity className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs text-slate-400 mt-1">Agent events will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {events.map((event) => {
              const config = STATUS_CONFIG[event.status];
              const StatusIcon = config.icon;
              const isExpanded = expandedEvent === event.id;

              return (
                <div key={event.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={cn("p-2 rounded-lg", config.bgClass)}>
                      <StatusIcon className={cn("w-4 h-4", config.iconClass)} />
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900">{event.agentName}</span>
                        <Badge variant="secondary" className={cn("text-xs", config.textClass)}>
                          {config.label}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-1">{event.action}</p>
                      
                      {/* Progress for running events */}
                      {event.status === 'running' && event.currentStep && (
                        <div className="text-xs text-slate-500 mb-2">
                          {event.currentStep} ({event.totalSteps ? `${event.totalSteps} steps` : 'in progress'})
                        </div>
                      )}

                      {/* Error message */}
                      {event.status === 'error' && event.errorMessage && (
                        <div className="text-xs text-red-600 mb-2">
                          {event.errorMessage}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatTimestamp(event.timestamp)}</span>
                        {event.recordsAffected !== undefined && (
                          <span>• {event.recordsAffected} records affected</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewLog(event.id)}
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Log
                      </Button>
                      
                      {event.canUndo && event.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUndo(event.id)}
                          className="text-xs text-orange-600 hover:text-orange-700"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Undo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
