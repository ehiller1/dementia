/**
 * Agent Dock (Right Sidebar)
 * Display all available agents with their current status and capabilities
 */

import { useState, useEffect } from 'react';
import { crewService, Agent, Crew } from '@/services/crew/CrewService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Zap, Clock, AlertCircle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentDockProps {
  activeCategory: string | null;
  onAgentClick: (agent: Agent) => void;
}

const STATUS_CONFIG = {
  online: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
    icon: Zap,
    label: 'Online',
    description: 'Ready to execute tasks'
  },
  idle: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
    icon: Clock,
    label: 'Idle',
    description: 'Available but not active'
  },
  working: {
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    dotColor: 'bg-orange-500',
    icon: Bot,
    label: 'Working',
    description: 'Currently executing a task'
  },
  offline: {
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    dotColor: 'bg-slate-400',
    icon: AlertCircle,
    label: 'Offline',
    description: 'Module inactive or agent disabled'
  }
};

export function AgentDock({ activeCategory, onAgentClick }: AgentDockProps) {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [expandedCrew, setExpandedCrew] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCrews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allCrews = activeCategory
          ? await crewService.fetchCrewsByCategory(activeCategory)
          : await crewService.fetchCrews();
        setCrews(allCrews);
        
        // Auto-expand first crew
        if (allCrews.length > 0) {
          setExpandedCrew(allCrews[0].id);
        }
      } catch (err) {
        console.error('[AgentDock] Error loading crews:', err);
        setError('Failed to load agents. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadCrews();
    
    // Refresh every 10 seconds for live status updates
    const interval = setInterval(loadCrews, 10000);
    return () => clearInterval(interval);
  }, [activeCategory]);

  return (
    <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Agent Dock
        </h3>
        {activeCategory && (
          <p className="text-xs text-slate-500 mt-1">
            Filtered by: {activeCategory}
          </p>
        )}
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && crews.length === 0 && (
          <div className="p-8 text-center">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-1">No agents available</p>
            <p className="text-xs text-slate-500">
              {activeCategory ? 'Try selecting a different category' : 'Check back later'}
            </p>
          </div>
        )}

        {/* Crew List */}
        {!isLoading && !error && crews.map((crew) => (
          <div key={crew.id} className="border-b border-slate-200">
            {/* Crew Header */}
            <button
              onClick={() => setExpandedCrew(expandedCrew === crew.id ? null : crew.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1">
                {expandedCrew === crew.id ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-2xl">{crew.icon}</span>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                    {crew.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {crew.agents.length} {crew.agents.length === 1 ? 'agent' : 'agents'}
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {crew.category}
              </Badge>
            </button>

            {/* Agent Cards */}
            {expandedCrew === crew.id && (
              <div className="bg-white px-4 py-2 space-y-2">
                {crew.agents.map((agent) => {
                  const statusConfig = STATUS_CONFIG[agent.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={agent.id}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
                    >
                      {/* Agent Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-slate-900">{agent.name}</h4>
                            <div
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                                statusConfig.bgColor,
                                statusConfig.textColor
                              )}
                              title={statusConfig.description}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotColor)} />
                              {statusConfig.label}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{agent.description}</p>
                        </div>
                      </div>

                      {/* Capabilities */}
                      <div className="mb-2">
                        <div className="text-xs font-medium text-slate-700 mb-1">Capabilities:</div>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.map((capability, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Example Prompts */}
                      {agent.examplePrompts.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-slate-700 mb-1">Try asking:</div>
                          <div className="space-y-1">
                            {agent.examplePrompts.slice(0, 2).map((prompt, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-slate-600 italic pl-2 border-l-2 border-slate-300"
                              >
                                "{prompt}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        size="sm"
                        variant={agent.status === 'online' ? 'default' : 'outline'}
                        onClick={() => onAgentClick(agent)}
                        disabled={agent.status === 'offline'}
                        className="w-full text-xs"
                      >
                        {agent.status === 'working' ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Agent Busy
                          </>
                        ) : agent.status === 'offline' ? (
                          'Offline'
                        ) : (
                          'Ask Agent'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
