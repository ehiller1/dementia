/**
 * Live Agent Display Component
 * Shows real-time active agents for a signal with health monitoring
 */

import { useSignalAgents } from '@/hooks/useActiveAgents';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap, Loader2 } from 'lucide-react';

interface LiveAgentDisplayProps {
  signalId: string;
  enabled: boolean;
  onAgentClick: (agentId: string) => void;
  getConfidenceColor: (confidence: number) => string;
}

export function LiveAgentDisplay({
  signalId,
  enabled,
  onAgentClick,
  getConfidenceColor
}: LiveAgentDisplayProps) {
  const { agents, isLoading } = useSignalAgents(enabled ? signalId : null, 5000);

  if (!enabled) {
    return null;
  }

  if (isLoading && agents.length === 0) {
    return (
      <div className="mt-3 flex items-center space-x-2 text-xs text-gray-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading agents...</span>
      </div>
    );
  }

  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center space-x-2 text-xs text-gray-400">
        <Bot className="h-3 w-3" />
        <span className="font-medium">Active Agents ({agents.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-1.5">
              {agent.status === 'spawning' ? (
                <Loader2 className="h-3 w-3 text-yellow-400 animate-spin" />
              ) : (
                <Zap className="h-3 w-3 text-green-400" />
              )}
              <span className="text-xs font-medium text-white">{agent.name}</span>
            </div>
            <Badge className={`${getConfidenceColor(agent.confidence)} text-[10px] px-1.5 py-0 border`}>
              {(agent.confidence * 100).toFixed(0)}%
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
