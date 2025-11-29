import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bot, Zap, Users, CheckCircle2, Circle, Pause } from 'lucide-react';
import { RMNAgent, RMNCrew } from '@/data/rmnAgents';
import { cn } from '@/lib/utils';

interface RMNAgentDockProps {
  agents: RMNAgent[];
  crews: RMNCrew[];
  activeCategory: string | null;
  onAskAgent: (agentId: string) => void;
}

export const RMNAgentDock = ({
  agents,
  crews,
  activeCategory,
  onAskAgent
}: RMNAgentDockProps) => {
  // Filter agents based on active category
  const filteredAgents = activeCategory
    ? agents.filter((a) => {
        // Map category to crew/skills
        if (activeCategory === 'campaigns') {
          return ['amazon-rmn', 'walmart-rmn', 'target-rmn', 'instacart-rmn'].includes(a.crew);
        }
        if (activeCategory === 'optimization') {
          return a.skills.some(s => s.includes('optimization') || s.includes('optimizer'));
        }
        if (activeCategory === 'attribution') {
          return a.skills.some(s => s.includes('attribution'));
        }
        if (activeCategory === 'audiences') {
          return a.skills.some(s => s.includes('audience') || s.includes('targeting'));
        }
        if (activeCategory === 'analytics') {
          return a.skills.some(s => s.includes('analytics') || s.includes('forecast'));
        }
        return true;
      })
    : agents;

  // Separate by status
  const runningAgents = filteredAgents.filter((a) => a.status === 'running');
  const idleAgents = filteredAgents.filter((a) => a.status === 'idle');
  const pausedAgents = filteredAgents.filter((a) => a.status === 'paused');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Zap className="w-3 h-3 text-green-500 animate-pulse" />;
      case 'paused':
        return <Pause className="w-3 h-3 text-orange-500" />;
      case 'completed':
        return <CheckCircle2 className="w-3 h-3 text-blue-500" />;
      default:
        return <Circle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const AgentCard = ({ agent }: { agent: RMNAgent }) => (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all hover:shadow-md",
        agent.status === 'running' ? 'bg-green-500/5 border-green-500/20' : 'bg-card'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(agent.status)}
          <span className="text-sm font-medium">{agent.name}</span>
        </div>
        {agent.confidence && (
          <Badge variant="secondary" className="text-xs">
            {agent.confidence}%
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>
      {agent.status === 'idle' && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={() => onAskAgent(agent.id)}
        >
          <Bot className="w-3 h-3 mr-1" />
          Activate
        </Button>
      )}
    </div>
  );

  const CrewCard = ({ crew }: { crew: RMNCrew }) => (
    <div className="border rounded-lg p-3 bg-card/50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium">{crew.name}</p>
          <p className="text-xs text-muted-foreground">{crew.retailer}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          {crew.workers.length}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{crew.description}</p>
      <div className="flex flex-wrap gap-1">
        {crew.capabilities.slice(0, 3).map((cap, idx) => (
          <Badge key={idx} variant="secondary" className="text-[10px]">
            {cap}
          </Badge>
        ))}
        {crew.capabilities.length > 3 && (
          <Badge variant="secondary" className="text-[10px]">
            +{crew.capabilities.length - 3}
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-80 border-l border-border bg-card/30 flex flex-col overflow-hidden">
      <div className="p-4 border-b bg-card/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Agent Dock
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {activeCategory
            ? `${filteredAgents.length} agents available`
            : `${agents.length} total agents`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Running Agents */}
        {runningAgents.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Zap className="w-3 h-3 text-green-500" />
              Active ({runningAgents.length})
            </h4>
            <div className="space-y-2">
              {runningAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {/* Paused Agents */}
        {pausedAgents.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Paused ({pausedAgents.length})
            </h4>
            <div className="space-y-2">
              {pausedAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {/* Available Agents */}
        {idleAgents.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Available ({idleAgents.length})
            </h4>
            <div className="space-y-2">
              {idleAgents.slice(0, 5).map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
              {idleAgents.length > 5 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{idleAgents.length - 5} more agents
                </p>
              )}
            </div>
          </div>
        )}

        {/* Agent Crews */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Users className="w-3 h-3" />
            RMN Crews ({crews.length})
          </h4>
          <div className="space-y-2">
            {crews.map((crew) => (
              <CrewCard key={crew.id} crew={crew} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
