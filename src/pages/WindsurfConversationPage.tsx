/**
 * Windsurf Conversation Page
 * 
 * Complete integration example showing all Windsurf features in action:
 * - Discuss/Direct mode toggle
 * - Editable plan pane
 * - Rules drawer
 * - Slash command autocomplete
 * - @-mention support
 * - Named checkpoints
 */

import React, { useState, useRef, useEffect } from 'react';
import { useWindsurfConversation } from '@/hooks/useWindsurfConversation';
import { EditablePlanPane } from '@/components/windsurf/EditablePlanPane';
import { RulesDrawer } from '@/components/windsurf/RulesDrawer';
import { ConversationMode } from '@/services/conversation/WindsurfStyleOrchestrator';
import { 
  MessageSquare, 
  Zap, 
  Send, 
  Settings, 
  BookOpen, 
  Bookmark,
  ChevronRight
} from 'lucide-react';

interface WindsurfConversationPageProps {
  conversationId: string;
  userId: string;
  tenantId: string;
}

export const WindsurfConversationPage: React.FC<WindsurfConversationPageProps> = ({
  conversationId,
  userId,
  tenantId
}) => {
  const [mode, setMode] = useState<ConversationMode>('direct');
  const [inputValue, setInputValue] = useState('');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashCommands, setSlashCommands] = useState<any[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    messages, 
    plan, 
    isExecuting, 
    startConversation,
    stop,
    clearMessages 
  } = useWindsurfConversation(conversationId, mode);

  // Load slash commands for autocomplete
  useEffect(() => {
    fetch('/api/windsurf/slash-commands')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSlashCommands(data.commands);
        }
      })
      .catch(console.error);
  }, []);

  // Detect slash command typing
  useEffect(() => {
    if (inputValue.startsWith('/') && !inputValue.includes(' ')) {
      setShowSlashCommands(true);
    } else {
      setShowSlashCommands(false);
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isExecuting) return;

    await startConversation(inputValue);
    setInputValue('');
  };

  const handleModeToggle = () => {
    setMode(prev => prev === 'discuss' ? 'direct' : 'discuss');
  };

  const handleSlashCommandSelect = (command: any) => {
    setInputValue(`/${command.command} `);
    setShowSlashCommands(false);
    inputRef.current?.focus();
  };

  const handleCreateCheckpoint = async () => {
    const label = prompt('Enter checkpoint name:');
    if (!label) return;

    try {
      await fetch('/api/windsurf/checkpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          stateData: {
            conversationId,
            messages: messages.slice(-10), // Last 10 messages
            plan: plan,
            mode
          },
          description: `Checkpoint created during conversation`,
          tenantId,
          userId
        })
      });
      alert(`Checkpoint "${label}" created!`);
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
    }
  };

  const filteredCommands = showSlashCommands
    ? slashCommands.filter(cmd => 
        cmd.command.toLowerCase().includes(inputValue.slice(1).toLowerCase())
      )
    : [];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-slate-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Conversation</h1>
            
            {/* Mode toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
              <button
                onClick={handleModeToggle}
                className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                  mode === 'discuss'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Discuss</span>
              </button>
              
              <button
                onClick={handleModeToggle}
                className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                  mode === 'direct'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Direct</span>
              </button>
            </div>

            {mode === 'discuss' && (
              <span className="text-xs text-slate-400 italic">
                Conversational mode - no agents will be spawned
              </span>
            )}
            {mode === 'direct' && (
              <span className="text-xs text-slate-400 italic">
                Agent execution mode - full orchestration
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateCheckpoint}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title="Create checkpoint"
            >
              <Bookmark className="w-4 h-4" />
              <span>Checkpoint</span>
            </button>

            <button
              onClick={() => setIsRulesOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title="Manage rules"
            >
              <BookOpen className="w-4 h-4" />
              <span>Rules</span>
            </button>

            <button
              onClick={clearMessages}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title="Clear conversation"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="max-w-2xl text-center space-y-4">
                <h2 className="text-2xl font-semibold text-slate-300">
                  {mode === 'discuss' ? 'Start a Discussion' : 'Start Planning'}
                </h2>
                <p className="text-sm">
                  {mode === 'discuss' 
                    ? 'Ask questions and explore ideas without triggering agent execution.'
                    : 'Describe your goal and let AI agents autonomously execute the plan.'}
                </p>
                
                <div className="mt-8 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Try these:</div>
                  <div className="grid gap-2">
                    <button
                      onClick={() => setInputValue('/quarterly-forecast-refresh')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-left transition-colors"
                    >
                      <span className="font-mono text-blue-400">/quarterly-forecast-refresh</span>
                      <span className="text-slate-400 ml-2">- Refresh quarterly forecast</span>
                    </button>
                    <button
                      onClick={() => setInputValue('@docs ')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-left transition-colors"
                    >
                      <span className="font-mono text-green-400">@docs</span>
                      <span className="text-slate-400 ml-2">- Reference internal documentation</span>
                    </button>
                    <button
                      onClick={() => setInputValue('@web ')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-left transition-colors"
                    >
                      <span className="font-mono text-purple-400">@web</span>
                      <span className="text-slate-400 ml-2">- Search the web for context</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'system'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  {typeof message.content === 'string' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      {message.content}
                    </div>
                  ) : (
                    <pre className="text-sm">{JSON.stringify(message.content, null, 2)}</pre>
                  )}
                  
                  {message.metadata?.mode && (
                    <div className="mt-2 text-xs opacity-70">
                      Mode: {message.metadata.mode}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isExecuting && (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-slate-700 p-4">
          <form onSubmit={handleSubmit} className="relative">
            {/* Slash command autocomplete */}
            {showSlashCommands && filteredCommands.length > 0 && (
              <div className="absolute bottom-full mb-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredCommands.map((cmd) => (
                  <button
                    key={cmd.command}
                    type="button"
                    onClick={() => handleSlashCommandSelect(cmd)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-blue-400">
                          /{cmd.command}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {cmd.description}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={
                  mode === 'discuss'
                    ? 'Ask a question... (or use /command or @mention)'
                    : 'Describe what you want to accomplish... (or use /command or @mention)'
                }
                rows={3}
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isExecuting}
              />
              
              <button
                type="submit"
                disabled={!inputValue.trim() || isExecuting}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>•</span>
              <span>Type <span className="font-mono text-slate-400">/</span> for commands</span>
              <span>•</span>
              <span>Type <span className="font-mono text-slate-400">@</span> to reference context</span>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar - Editable Plan Pane */}
      <div className="w-96 border-l border-slate-700 flex flex-col">
        <EditablePlanPane 
          plan={plan}
          editable={mode === 'direct'}
          onUpdateTask={(taskId, updates) => {
            console.log('Update task:', taskId, updates);
            // TODO: Integrate with plan update service
          }}
          onAddTask={(task) => {
            console.log('Add task:', task);
            // TODO: Integrate with plan update service
          }}
          onDeleteTask={(taskId) => {
            console.log('Delete task:', taskId);
            // TODO: Integrate with plan update service
          }}
        />
      </div>

      {/* Rules Drawer (overlay) */}
      <RulesDrawer
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        userId={userId}
        tenantId={tenantId}
      />
    </div>
  );
};

export default WindsurfConversationPage;
