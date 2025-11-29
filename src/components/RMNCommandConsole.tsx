import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart, Settings, HelpCircle, X } from 'lucide-react';
import { DecisionInbox } from './DecisionInbox';
import { LiveNarrativeStream } from './LiveNarrativeStream';
import { MemoryPanel } from './MemoryPanel';
import { RMNAgentDock } from './RMNAgentDock';
import { RMNFocusRail } from './RMNFocusRail';
import { AgentProgressTracker } from './AgentProgressTracker';
import { RMNRecentEvents } from './RMNRecentEvents';
import { useOrchestration } from '@/services/context/OrchestrationContext';
import { RMN_AGENTS, RMN_CREWS, BUSINESS_GROUPS } from '@/data/rmnAgents';
import * as Icons from 'lucide-react';

interface RunningAgent {
  id: string;
  name: string;
  task: string;
  progress: number;
  currentStep: string;
  canPause: boolean;
  canCancel: boolean;
}

interface RecentEvent {
  id: string;
  agent: string;
  status: 'completed' | 'running' | 'error';
  detail: string;
  timestamp?: string;
  recordsAffected?: number;
  canUndo?: boolean;
}

export const RMNCommandConsole = () => {
  const { eventBus } = useOrchestration();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [runningAgents, setRunningAgents] = useState<RunningAgent[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [memoryBlocks, setMemoryBlocks] = useState<any[]>([]);

  // Subscribe to agent activity events
  useEffect(() => {
    if (!eventBus) return;

    // Agent started
    const agentStartedSub = eventBus.subscribe('agent.started', (data: any) => {
      const newAgent: RunningAgent = {
        id: data.agentId || `agent-${Date.now()}`,
        name: data.agentName || data.agentId,
        task: data.task || 'Processing...',
        progress: 0,
        currentStep: 'Initializing...',
        canPause: true,
        canCancel: true
      };
      setRunningAgents(prev => [...prev, newAgent]);
    });

    // Agent progress update
    const agentProgressSub = eventBus.subscribe('agent.progress_update', (data: any) => {
      setRunningAgents(prev =>
        prev.map(a =>
          a.id === data.agentId
            ? { ...a, progress: data.progress || 0, currentStep: data.currentStep || a.currentStep }
            : a
        )
      );
    });

    // Agent completed
    const agentCompletedSub = eventBus.subscribe('agent.completed', (data: any) => {
      // Remove from running agents
      setRunningAgents(prev => prev.filter(a => a.id !== data.agentId));

      // Add to recent events
      const newEvent: RecentEvent = {
        id: `event-${Date.now()}`,
        agent: data.agentName || data.agentId || 'Agent',
        status: 'completed',
        detail: data.result?.summary || 'Task completed successfully',
        timestamp: new Date().toLocaleTimeString(),
        recordsAffected: data.result?.recordsAffected,
        canUndo: true
      };
      setEvents(prev => [newEvent, ...prev]);
    });

    // Agent work completed (from Redis Mesh)
    const workCompletedSub = eventBus.subscribe('agent.work.completed', (evt: any) => {
      const payload = evt.payload || evt;
      
      // Remove from running
      setRunningAgents(prev => prev.filter(a => a.id !== payload.agentId));

      // Add to events
      const newEvent: RecentEvent = {
        id: `event-${Date.now()}`,
        agent: payload.agentName || payload.agentId,
        status: 'completed',
        detail: `${payload.insights?.length || 0} insights, ${payload.recommendations?.length || 0} recommendations`,
        timestamp: new Date().toLocaleTimeString(),
        recordsAffected: payload.insights?.length + payload.recommendations?.length,
        canUndo: false
      };
      setEvents(prev => [newEvent, ...prev]);
    });

    return () => {
      agentStartedSub.unsubscribe();
      agentProgressSub.unsubscribe();
      agentCompletedSub.unsubscribe();
      workCompletedSub.unsubscribe();
    };
  }, [eventBus]);

  // Listen for institutional memory
  useEffect(() => {
    const handleMemory = (event: CustomEvent) => {
      const { memoryCards } = event.detail || {};
      if (Array.isArray(memoryCards)) {
        setMemoryBlocks(memoryCards);
      }
    };

    window.addEventListener('institutionalMemoryRetrieved', handleMemory as EventListener);
    return () => window.removeEventListener('institutionalMemoryRetrieved', handleMemory as EventListener);
  }, []);

  const handlePauseAgent = (agentId: string) => {
    console.log('Pause agent:', agentId);
    // Implement pause logic
  };

  const handleResumeAgent = (agentId: string) => {
    console.log('Resume agent:', agentId);
    // Implement resume logic
  };

  const handleCancelAgent = (agentId: string) => {
    setRunningAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const handleViewLog = (eventId: string) => {
    console.log('View log for event:', eventId);
    // Open activity log modal
  };

  const handleUndo = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Update event status
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId
          ? { ...e, status: 'error' as const, detail: `${e.detail} - UNDONE`, canUndo: false }
          : e
      )
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  RMN Command Console
                </h1>
                <p className="text-xs text-muted-foreground">
                  Retail Media Network Intelligence Hub
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Focus Rail */}
        <RMNFocusRail
          activeGroup={activeGroup}
          onSelectGroup={setActiveGroup}
          groups={BUSINESS_GROUPS}
        />

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Command & Review Console */}
          <div className="flex-1 border-r border-border bg-background/50 flex flex-col overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Activity Stream</h2>
                {activeGroup && (() => {
                  const groupInfo = BUSINESS_GROUPS.find(g => g.id === activeGroup);
                  const GroupIcon = groupInfo ? Icons[groupInfo.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> : null;

                  return (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {GroupIcon && <GroupIcon className="w-3 h-3" />}
                      {groupInfo?.name} Focus
                      <button
                        onClick={() => setActiveGroup(null)}
                        className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })()}
              </div>
              <p className="text-sm text-muted-foreground">
                {activeGroup
                  ? `Focused on ${BUSINESS_GROUPS.find(g => g.id === activeGroup)?.name || activeGroup} activities`
                  : 'Real-time agent activity and recommendations'
                }
              </p>
            </div>

            {/* Live Narrative Stream */}
            <div className="flex-1 overflow-hidden">
              <LiveNarrativeStream maxEntries={20} />
            </div>
          </div>

          {/* Decision Inbox & Context - Bottom Section */}
          <div className="h-[500px] border-t border-border flex">
            {/* Decision Inbox - Left */}
            <div className="flex-1 p-6 overflow-y-auto border-r">
              <DecisionInbox
                onSimulate={(id) => console.log('Simulate decision:', id)}
                templateContext={null}
              />
            </div>

            {/* Context Memory - Right */}
            <div className="w-96 p-6 overflow-y-auto bg-muted/20">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                📚 Relevant Context
              </h3>
              {memoryBlocks.length > 0 ? (
                <div className="space-y-3">
                  {memoryBlocks.map((card, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-3 bg-card text-sm"
                    >
                      <p className="font-medium mb-1">{card.title}</p>
                      <p className="text-xs text-muted-foreground">{card.content}</p>
                      {card.relevance_score && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {Math.round(card.relevance_score * 100)}% relevant
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No context loaded. Historical insights and relevant data will appear here as agents work.
                </p>
              )}
            </div>
          </div>

          {/* Recent Events (very bottom) */}
          <div className="h-64 border-t border-border p-6 overflow-y-auto bg-card/30">
            <RMNRecentEvents
              events={events}
              onViewLog={handleViewLog}
              onUndo={handleUndo}
            />
          </div>
        </div>

        {/* Agent Dock */}
        <RMNAgentDock
          agents={RMN_AGENTS}
          crews={RMN_CREWS}
          activeCategory={activeGroup}
          onAskAgent={(agentId) => console.log('Ask agent:', agentId)}
        />
      </div>

      {/* Progress Tracker (floating) */}
      <AgentProgressTracker
        runningAgents={runningAgents}
        onPause={handlePauseAgent}
        onResume={handleResumeAgent}
        onCancel={handleCancelAgent}
      />
    </div>
  );
};
