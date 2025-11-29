/**
 * Command & Review Console (Center)
 * Primary interaction surface combining conversational AI with structured actions
 */

import { useState, useEffect, useRef } from 'react';
import { crewService, QuickAction } from '@/services/crew/CrewService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, ArrowRight, Zap, Loader2, AlertCircle, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { eventBus } from '@/services/events/EventBus';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CommandConsoleProps {
  activeCategory: string | null;
  onSendMessage: (message: string) => void;
  messages: Message[];
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  icon?: string;
}

const AI_MODELS: AIModel[] = [
  {
    id: 'marketing-optimization',
    name: 'Marketing Optimization',
    provider: 'RMN Intelligence',
    description: 'Campaign performance, budget allocation, and media mix optimization',
    capabilities: ['campaigns', 'ROI', 'attribution', 'media-mix'],
    icon: '📊'
  },
  {
    id: 'customer-satisfaction',
    name: 'Customer Satisfaction',
    provider: 'RMN Intelligence',
    description: 'Customer experience, sentiment analysis, and retention strategies',
    capabilities: ['CX', 'NPS', 'retention', 'feedback'],
    icon: '😊'
  },
  {
    id: 'finance',
    name: 'Finance',
    provider: 'RMN Intelligence',
    description: 'Revenue forecasting, P&L analysis, and financial planning',
    capabilities: ['forecasting', 'P&L', 'budgeting', 'variance'],
    icon: '💰'
  },
  {
    id: 'inventory',
    name: 'Inventory',
    provider: 'RMN Intelligence',
    description: 'Stock optimization, demand planning, and supply chain management',
    capabilities: ['stock-levels', 'demand', 'replenishment', 'turnover'],
    icon: '📦'
  },
  {
    id: 'category-management',
    name: 'Category Management',
    provider: 'RMN Intelligence',
    description: 'Assortment planning, pricing strategy, and category performance',
    capabilities: ['assortment', 'pricing', 'shelf-space', 'promotions'],
    icon: '🏷️'
  }
];

export function CommandConsole({ activeCategory, onSendMessage, messages }: CommandConsoleProps) {
  const [input, setInput] = useState('');
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadQuickActions = async () => {
      setIsLoadingActions(true);
      setError(null);
      try {
        const actions = await crewService.fetchQuickActions(activeCategory || undefined);
        setQuickActions(actions);
      } catch (err) {
        console.error('[CommandConsole] Error loading quick actions:', err);
        setError('Failed to load quick actions');
      } finally {
        setIsLoadingActions(false);
      }
    };
    loadQuickActions();
  }, [activeCategory]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const message = input.trim();
    setInput('');
    setIsSending(true);

    try {
      // Publish to EventBus for RMN orchestrator
      eventBus.publish('conversation.message', {
        message,
        conversationId: 'rmn-workspace',
        userId: 'current-user',
        timestamp: new Date().toISOString(),
        category: activeCategory,
        intent: 'analyze', // Will be determined by orchestrator
        model: {
          id: selectedModel.id,
          name: selectedModel.name,
          provider: selectedModel.provider
        }
      });

      // Call parent handler
      onSendMessage(message);
      
    } catch (err) {
      console.error('[CommandConsole] Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    onSendMessage(action.prompt);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Quick Actions */}
      {messages.length === 0 && (
        isLoadingActions ? (
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 border-b border-slate-200 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : quickActions.length > 0 && (
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={isSending}
                className={cn(
                  "p-4 rounded-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group",
                  isSending && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{action.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 mb-1">{action.title}</div>
                    <div className="text-xs text-slate-600">{action.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
        )
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !isLoadingActions && quickActions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Zap className="w-16 h-16 mb-4" />
            <p className="text-sm font-medium">Welcome to RMN Command Center</p>
            <p className="text-xs mt-1">Type a message or select a quick action to get started</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                "max-w-2xl rounded-lg px-4 py-3",
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-2xl rounded-lg px-4 py-3 bg-slate-100 text-slate-900 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing your request...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input with Model Selector */}
      <div className="border-t border-slate-200">
        {/* Model Selector Bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-2 text-xs font-medium hover:bg-slate-100"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-slate-700">{selectedModel.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                Select Business Function
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AI_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                    selectedModel.id === model.id && "bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-lg">{model.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{model.name}</span>
                        {selectedModel.id === model.id && (
                          <span className="text-xs text-blue-600">✓ Active</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{model.provider}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{model.description}</p>
                  <div className="flex gap-1 mt-1">
                    {model.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Context: {activeCategory || 'All'}</span>
          </div>
        </div>

        {/* Input Form */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you want to do... (⌘K)"
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isSending}>
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
