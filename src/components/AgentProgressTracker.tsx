import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Pause, Play, X, Bot } from 'lucide-react';

interface RunningAgent {
  id: string;
  name: string;
  task: string;
  progress: number;
  currentStep: string;
  canPause: boolean;
  canCancel: boolean;
}

interface AgentProgressTrackerProps {
  runningAgents: RunningAgent[];
  onPause: (agentId: string) => void;
  onResume: (agentId: string) => void;
  onCancel: (agentId: string) => void;
}

export const AgentProgressTracker = ({
  runningAgents,
  onPause,
  onResume,
  onCancel
}: AgentProgressTrackerProps) => {
  if (runningAgents.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 z-50">
      <Card className="bg-card/95 backdrop-blur-lg shadow-2xl border-2">
        <div className="p-4 border-b bg-primary/5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              Active Agents ({runningAgents.length})
            </h3>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {runningAgents.map((agent) => (
            <div key={agent.id} className="p-4 border-b last:border-b-0 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.task}</p>
                </div>
                <div className="flex items-center gap-1">
                  {agent.canPause && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onPause(agent.id)}
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}
                  {agent.canCancel && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => onCancel(agent.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{agent.currentStep}</span>
                  <span className="font-medium">{Math.round(agent.progress)}%</span>
                </div>
                <Progress value={agent.progress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
