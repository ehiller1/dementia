/**
 * Agent Details Modal
 * Shows detailed information about a specific agent
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Bot,
  Zap,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useAgentDetails, terminateAgent, type ActiveAgent } from '@/hooks/useActiveAgents';
import { formatDistanceToNow } from 'date-fns';

interface AgentDetailsModalProps {
  agentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentTerminated?: () => void;
}

export function AgentDetailsModal({
  agentId,
  open,
  onOpenChange,
  onAgentTerminated
}: AgentDetailsModalProps) {
  const { agent, isLoading, mutate } = useAgentDetails(agentId);
  const [isTerminating, setIsTerminating] = useState(false);

  const handleTerminate = async () => {
    if (!agentId) return;

    setIsTerminating(true);
    const success = await terminateAgent(agentId, 'Manual termination from UI');
    
    if (success) {
      await mutate();
      onAgentTerminated?.();
      onOpenChange(false);
    }
    
    setIsTerminating(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'spawning':
        return <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600';
      case 'spawning':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-blue-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!agent && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center space-x-3">
            <Bot className="h-6 w-6 text-cyan-400" />
            <span>{agent?.name || 'Loading...'}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Agent ID: {agentId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : agent ? (
          <div className="space-y-6 py-4">
            {/* Status Overview */}
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(agent.status)}
                  <div>
                    <div className="text-sm text-gray-400">Status</div>
                    <Badge className={`${getStatusColor(agent.status)} text-white`}>
                      {agent.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Zap className={`h-5 w-5 ${getConfidenceColor(agent.confidence)}`} />
                  <div>
                    <div className="text-sm text-gray-400">Confidence</div>
                    <div className={`text-xl font-bold ${getConfidenceColor(agent.confidence)}`}>
                      {(agent.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="text-sm text-gray-400">Spawned</div>
                    <div className="text-sm font-medium text-white">
                      {formatDistanceToNow(new Date(agent.spawnedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="text-sm text-gray-400">Type</div>
                    <div className="text-sm font-medium text-white">
                      {agent.type}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Capabilities */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((capability, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-slate-800 border-slate-600 text-gray-300"
                  >
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Metadata */}
            {agent.metadata && Object.keys(agent.metadata).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Metadata</h3>
                <Card className="bg-slate-800 border-slate-700 p-4">
                  <div className="space-y-2">
                    {Object.entries(agent.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">{key}:</span>
                        <span className="text-sm text-white font-mono max-w-md text-right break-all">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Trigger Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">Trigger Information</h3>
              <Card className="bg-slate-800 border-slate-700 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Trigger ID:</span>
                    <span className="text-sm text-white font-mono">{agent.triggerId}</span>
                  </div>
                  {agent.signalId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Signal ID:</span>
                      <span className="text-sm text-white font-mono">{agent.signalId}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Agent not found</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-gray-300"
          >
            Close
          </Button>
          {agent && agent.status === 'active' && (
            <Button
              onClick={handleTerminate}
              disabled={isTerminating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isTerminating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Terminating...
                </>
              ) : (
                'Terminate Agent'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
