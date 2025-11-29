import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, Clock, AlertCircle, Undo2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentEvent {
  id: string;
  agent: string;
  status: 'completed' | 'running' | 'error';
  detail: string;
  timestamp?: string;
  recordsAffected?: number;
  canUndo?: boolean;
}

interface RMNRecentEventsProps {
  events: RecentEvent[];
  onViewLog: (eventId: string) => void;
  onUndo: (eventId: string) => void;
}

export const RMNRecentEvents = ({ events, onViewLog, onUndo }: RMNRecentEventsProps) => {
  const getStatusIcon = (status: RecentEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Agent Activity</h3>
        <Badge variant="outline" className="text-xs">
          Recoverability: All actions reversible
        </Badge>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <Card className="p-4 bg-muted/20">
            <p className="text-sm text-muted-foreground text-center">
              No recent activity. Agents will appear here as they complete work.
            </p>
          </Card>
        ) : (
          events.map((event) => (
            <Card
              key={event.id}
              className={cn(
                'p-3 transition-colors',
                event.status === 'running' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-card'
              )}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(event.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{event.agent}</p>
                    {event.recordsAffected && (
                      <Badge variant="secondary" className="text-xs">
                        {event.recordsAffected} records
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{event.detail}</p>
                  {event.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">{event.timestamp}</p>
                  )}
                </div>
              </div>

              {event.status === 'completed' && (
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={() => onViewLog(event.id)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View log
                  </Button>
                  {event.canUndo !== false && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1 text-destructive hover:text-destructive border-destructive/30"
                      onClick={() => onUndo(event.id)}
                    >
                      <Undo2 className="h-3 w-3 mr-1" />
                      Undo
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
