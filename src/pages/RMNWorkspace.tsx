/**
 * RMN Command & Control Workspace
 * 
 * ⚠️ DEPRECATED: This page has been integrated into the Home page.
 * All RMN components (FocusRail, CommandConsole, AgentDock, RecentEvents, etc.)
 * are now available at "/" (Home page).
 * 
 * This file is kept for reference but the route "/rmn-workspace" now redirects to Home.
 * 
 * @deprecated Use Home page (/) instead
 */

import { useState, useEffect } from 'react';
import { FocusRail } from '@/components/rmn/FocusRail';
import { PinnedModules } from '@/components/rmn/PinnedModules';
import { CommandConsole } from '@/components/rmn/CommandConsole';
import { AgentDock } from '@/components/rmn/AgentDock';
import { RecentEvents } from '@/components/rmn/RecentEvents';
import { ModuleDrawer } from '@/components/rmn/ModuleDrawer';
import { CommandPalette } from '@/components/rmn/CommandPalette';
import { ActionConfirmationDialog } from '@/components/rmn/ActionConfirmationDialog';
import { crewService, Crew, Agent, QuickAction } from '@/services/crew/CrewService';
import { useAgentEvents } from '@/hooks/useAgentEvents';
import DecisionInbox from '@/components/DecisionInbox';
import LiveNarrativeStream from '@/components/LiveNarrativeStream';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { eventBus } from '@/services/events/EventBus';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function RMNWorkspace() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { events } = useAgentEvents(); // Use real EventBus integration
  const [moduleDrawerOpen, setModuleDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<any>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Create AI response immediately
    const aiMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Analyzing your request: "${message}". Discovering relevant agents...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);

    // Publish message to EventBus for agent spawning
    eventBus.publish('conversation.message', {
      message,
      conversationId: `rmn-${Date.now()}`,
      userId: 'default_user',
      timestamp: new Date().toISOString(),
      category: activeCategory,
      intent: 'analyze' // This would be extracted by semantic router in production
    });

    // Listen for agent discovery response
    const sub = eventBus.subscribe('agent_discovery_completed', (event: any) => {
      if (event.conversationId?.startsWith('rmn-')) {
        const responseMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I've spawned ${event.agents?.length || 0} agents to handle your request. Check the Recent Events panel to see their progress.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, responseMessage]);
        sub.unsubscribe();
      }
    });
  };

  const handleModuleClick = (crew: Crew) => {
    console.log('Module clicked:', crew);
  };

  const handleAgentClick = (agent: Agent) => {
    const prompt = agent.examplePrompts[0] || `Tell me about ${agent.name}`;
    handleSendMessage(prompt);
  };

  const handleViewLog = (eventId: string) => {
    console.log('View log:', eventId);
  };

  const handleUndo = (eventId: string) => {
    console.log('Undo event:', eventId);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Focus Rail (Left Sidebar) */}
      <FocusRail
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Pinned Modules Bar */}
        <PinnedModules
          onEditClick={() => setModuleDrawerOpen(true)}
          onModuleClick={handleModuleClick}
        />

        {/* Active Category Badge (if focused) */}
        {activeCategory && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">Focus Active</Badge>
              <span className="text-sm text-blue-900">{activeCategory}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveCategory(null)}
              className="text-blue-600 hover:text-blue-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Focus
            </Button>
          </div>
        )}

        {/* Three-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Decision Inbox & Narrative */}
          <div className="w-80 flex flex-col border-r border-slate-200 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <DecisionInbox onSimulate={(id) => console.log('Simulate decision:', id)} />
            </div>
            <div className="flex-1 border-t border-slate-200 overflow-y-auto">
              <LiveNarrativeStream />
            </div>
          </div>

          {/* Center: Command Console */}
          <CommandConsole
            activeCategory={activeCategory}
            onSendMessage={handleSendMessage}
            messages={messages}
          />

          {/* Right: Agent Dock */}
          <AgentDock
            activeCategory={activeCategory}
            onAgentClick={handleAgentClick}
          />
        </div>

        {/* Bottom: Recent Events */}
        <RecentEvents
          events={events}
          onViewLog={handleViewLog}
          onUndo={handleUndo}
        />
      </div>

      {/* Module Drawer */}
      <ModuleDrawer
        open={moduleDrawerOpen}
        onClose={() => setModuleDrawerOpen(false)}
        activeCategory={activeCategory}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectCrew={handleModuleClick}
        onExecuteAction={(action) => handleSendMessage(action.prompt)}
      />

      {/* Action Confirmation Dialog */}
      {confirmationDialog && (
        <ActionConfirmationDialog
          open={true}
          onClose={() => setConfirmationDialog(null)}
          onConfirm={() => {
            console.log('Action confirmed');
            setConfirmationDialog(null);
          }}
          {...confirmationDialog}
        />
      )}
    </div>
  );
}
