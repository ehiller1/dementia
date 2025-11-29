/**
 * Reactive Template Renderer
 * 
 * Subscribes to template update events and re-renders in real-time
 * Used by DecisionInbox, LiveNarrativeStream, and other UI components
 */

import { useEffect, useState, useCallback } from 'react';
import { reactiveTemplateUpdater } from '@/services/continuous-orchestration/ReactiveTemplateUpdater';
import { eventBus } from '@/services/events/EventBus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';

interface TemplateUpdate {
  section: 'summary' | 'insights' | 'recommendations' | 'actions' | 'impact' | 'provenance';
  content: string;
  confidence?: number;
  timestamp: string;
  trigger: string;
}

interface ReactiveTemplateRendererProps {
  section: 'summary' | 'insights' | 'recommendations' | 'actions' | 'impact' | 'provenance';
  title?: string;
  defaultContent?: string;
  className?: string;
  showMetadata?: boolean;
}

export function ReactiveTemplateRenderer({
  section,
  title,
  defaultContent = 'Waiting for updates...',
  className = '',
  showMetadata = true
}: ReactiveTemplateRendererProps) {
  const [content, setContent] = useState<string>(defaultContent);
  const [lastUpdate, setLastUpdate] = useState<TemplateUpdate | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Subscribe to reactive template updates
    reactiveTemplateUpdater.onTemplateUpdate(section, (update: TemplateUpdate) => {
      setIsUpdating(true);
      setContent(update.content);
      setLastUpdate(update);
      
      // Clear updating indicator after animation
      setTimeout(() => setIsUpdating(false), 500);
    });

    // Also subscribe directly to event bus for immediate updates
    const unsubscribe = eventBus.subscribe('template.updated', (event: any) => {
      if (event.section === section) {
        setIsUpdating(true);
        setContent(event.content);
        setLastUpdate(event);
        setTimeout(() => setIsUpdating(false), 500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [section]);

  const handleManualRefresh = useCallback(() => {
    console.log(`🔄 Manual refresh requested for ${section}`);
    reactiveTemplateUpdater.regenerateAll();
  }, [section]);

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const percentage = Math.round(confidence * 100);
    const variant = percentage > 80 ? 'default' : percentage > 60 ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant} className="ml-2">
        {percentage}% confidence
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      
      if (diffSecs < 60) return `${diffSecs}s ago`;
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  return (
    <Card className={`relative ${className} ${isUpdating ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          <CardTitle className="text-lg font-semibold">
            {title || section.charAt(0).toUpperCase() + section.slice(1)}
          </CardTitle>
          {isUpdating && <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-500" />}
          {lastUpdate && showMetadata && getConfidenceBadge(lastUpdate.confidence)}
        </div>
        <button
          onClick={handleManualRefresh}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh template"
        >
          <RefreshCw className="h-4 w-4 text-gray-500" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          {content}
        </div>
        
        {lastUpdate && showMetadata && (
          <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex items-center justify-between">
            <span>
              Triggered by: <span className="font-mono">{lastUpdate.trigger}</span>
            </span>
            <span>{formatTimestamp(lastUpdate.timestamp)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook for subscribing to template updates in custom components
 */
export function useReactiveTemplate(section: string) {
  const [content, setContent] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<TemplateUpdate | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    reactiveTemplateUpdater.onTemplateUpdate(section, (update: TemplateUpdate) => {
      setIsUpdating(true);
      setContent(update.content);
      setLastUpdate(update);
      setTimeout(() => setIsUpdating(false), 500);
    });

    const unsubscribe = eventBus.subscribe('template.updated', (event: any) => {
      if (event.section === section) {
        setIsUpdating(true);
        setContent(event.content);
        setLastUpdate(event);
        setTimeout(() => setIsUpdating(false), 500);
      }
    });

    return () => unsubscribe();
  }, [section]);

  const refresh = useCallback(() => {
    reactiveTemplateUpdater.regenerateAll();
  }, []);

  return {
    content,
    lastUpdate,
    isUpdating,
    refresh
  };
}

/**
 * Multi-section reactive renderer for dashboards
 */
export function ReactiveTemplateDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <ReactiveTemplateRenderer
        section="summary"
        title="Orchestration Summary"
        className="col-span-2"
      />
      
      <ReactiveTemplateRenderer
        section="insights"
        title="Key Insights"
      />
      
      <ReactiveTemplateRenderer
        section="recommendations"
        title="Recommendations"
      />
      
      <ReactiveTemplateRenderer
        section="actions"
        title="Pending Actions"
      />
      
      <ReactiveTemplateRenderer
        section="provenance"
        title="Agent Provenance"
      />
      
      <ReactiveTemplateRenderer
        section="impact"
        title="Business Impact"
        className="col-span-2"
      />
    </div>
  );
}
