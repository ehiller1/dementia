/**
 * RMN Command & Review Console
 * Business-focused retail media network command interface
 * Integrates: DecisionInbox, MemoryPanel, LiveNarrativeStream
 */

import React, { useState, useEffect } from 'react';
import { OrchestrationProvider } from '@/services/context/OrchestrationContext';
import { eventBus } from '@/services/events/EventBus';
import { InMemoryWorkflowGraphService } from '@/services/graph/WorkflowGraphService';
import { OrchestrationController } from '@/services/conversation/OrchestrationController';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ChevronRight, ChevronDown, ChevronUp,
  Play, Pause, StopCircle, Clock, Zap, Bot, Filter,
  Settings, Shield, ShoppingCart, Puzzle, CheckCircle2,
  BarChart, Target, TrendingUp, GitBranch, Users, Palette,
  FileText, Lightbulb, HandCoins, Home
} from 'lucide-react';
import DecisionInbox from '@/components/DecisionInbox';
import { MemoryPanel } from '@/components/MemoryPanel';
import LiveNarrativeStream from '@/components/LiveNarrativeStream';
import { RMN_AGENTS, RMN_CREWS, BUSINESS_GROUPS, BUSINESS_MODULES, PLATFORM_AGENTS } from '@/data/rmnAgents';

// Icon mapping
const ICON_MAP: Record<string, any> = {
  BarChart, Target, TrendingUp, GitBranch, Users, Palette,
  FileText, Lightbulb, HandCoins, Home
};

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs opacity-80">
    {children}
  </span>
);

const SectionTitle = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">{children}</h3>
    <div>{right}</div>
  </div>
);

const ModuleToggle = ({ moduleId, active, onToggle, name, type }: any) => (
  <button
    onClick={() => onToggle(moduleId)}
    className={`w-full flex items-center justify-between rounded-xl border p-3 hover:shadow transition ${
      active ? 'bg-white' : 'bg-transparent'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <div>
        <div className="font-medium text-left">{name}</div>
        <div className="text-xs opacity-60">{type}</div>
      </div>
    </div>
    <div className="flex items-center gap-2 text-xs">
      <span className={`px-2 py-0.5 rounded-full border ${active ? 'border-emerald-500 text-emerald-700' : 'border-slate-300'}`}>
        {active ? 'Enabled' : 'Enable'}
      </span>
      <ChevronRight className="h-4 w-4 opacity-60" />
    </div>
  </button>
);

const ConversationBubble = ({ role = 'user', text, intents }: any) => (
  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[72%] rounded-2xl p-3 shadow-sm ${role === 'user' ? 'bg-black text-white' : 'bg-white'}`}>
      <div className="prose-sm leading-relaxed">{text}</div>
      {intents?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {intents.map((i: string, idx: number) => (
            <Pill key={idx}>{i}</Pill>
          ))}
        </div>
      ) : null}
    </div>
  </div>
);

const CommandInput = ({ onSubmit, placeholder }: any) => {
  const [value, setValue] = useState('');
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.getElementById('cmd');
        el?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
        setValue('');
      }}
      className="flex items-center gap-2 rounded-2xl border p-2"
    >
      <Search className="h-5 w-5 opacity-60" />
      <input
        id="cmd"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none"
      />
      <kbd className="rounded border px-1.5 py-0.5 text-xs opacity-60">⌘K</kbd>
    </form>
  );
};

export default function RMNCommandConsole() {
  const [purchasedModules, setPurchasedModules] = useState(new Set([
    'rmn-core', 'amazon-ads', 'walmart-connect', 'portfolio-optimizer', 'attribution-suite'
  ]));
  const [purchasedAgents] = useState(new Set(RMN_AGENTS.map(a => a.id).concat(PLATFORM_AGENTS.map(a => a.id))));
  const [activeGroup, setActiveGroup] = useState('campaigns');
  const [showModuleDrawer, setShowModuleDrawer] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Welcome to RMN Command Console. I can help you optimize retail media campaigns, analyze performance, and coordinate your advertising agents. What would you like to accomplish today?',
      intents: ['Optimize Amazon campaigns', 'Review attribution metrics', 'Sync audience segments']
    }
  ]);
  const [nowRunning, setNowRunning] = useState([
    { id: 'run-1', agent: 'Amazon Portfolio Optimizer', status: 'running', detail: 'Reallocating budget across Sponsored Products (3/5)' },
    { id: 'run-2', agent: 'Meta Ads Specialist', status: 'running', detail: 'Optimizing Facebook ad creative performance' }
  ]);

  // Sample memory data for MemoryPanel
  const [memoryData] = useState({
    refs: [
      {
        id: 'mem-1',
        title: 'Q4 Amazon RMN Performance',
        why: 'Historical performance data for Amazon campaigns during peak season',
        confidence: 0.89,
        snippet: 'Sponsored Products ROAS increased 34% YoY during Black Friday week...'
      },
      {
        id: 'mem-2',
        title: 'Walmart Attribution Model',
        why: 'Omnichannel attribution methodology for Walmart Connect campaigns',
        confidence: 0.76,
        snippet: '30-day attribution window captures 85% of conversions...'
      }
    ],
    confidence: 0.82,
    pending: false
  });

  const visibleModules = BUSINESS_MODULES.filter(m => purchasedModules.has(m.id));
  const allAgents = [...RMN_AGENTS, ...PLATFORM_AGENTS];

  const submitCommand = (value: string) => {
    const intents = [];
    if (value.toLowerCase().includes('amazon')) intents.push('amazon_optimization');
    if (value.toLowerCase().includes('attribution')) intents.push('attribution_analysis');
    if (value.toLowerCase().includes('audience')) intents.push('audience_sync');
    if (value.toLowerCase().includes('budget')) intents.push('budget_allocation');

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: value },
      {
        role: 'assistant',
        text: 'Planned actions — confirm to execute:',
        intents: intents.length ? intents : ['classify', 'route_to_agent']
      }
    ]);

    setNowRunning((prev) => [
      {
        id: `run-${Date.now()}`,
        agent: intents.includes('amazon_optimization') ? 'Amazon Portfolio Optimizer' : 'Audience Sync Worker',
        status: 'running',
        detail: 'Queued by command'
      },
      ...prev
    ]);
  };

  const toggleModule = (id: string) => {
    const next = new Set(purchasedModules);
    next.has(id) ? next.delete(id) : next.add(id);
    setPurchasedModules(next);
  };

  const [controller, setController] = useState<OrchestrationController | null>(null);
  const [graphService] = useState(() => new InMemoryWorkflowGraphService());
  const [sharedEventBus] = useState(() => eventBus);
  const conversationId = 'rmn_conversation';

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const newController = new OrchestrationController({
        conversationId,
        eventBus: sharedEventBus,
        graph: graphService,
      });
      await newController.init('conversation_rmn', { interface: 'rmn' });
      if (isMounted) {
        setController(newController);
      }
    })();
    return () => { isMounted = false; };
  }, [conversationId, sharedEventBus, graphService]);

  return (
    <OrchestrationProvider eventBus={sharedEventBus} controller={controller} graphService={graphService}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <Puzzle className="h-5 w-5" /> RMN Command Console
          </div>
          <div className="hidden md:block flex-1" />
          <button
            onClick={() => setShowModuleDrawer(true)}
            className="rounded-full border px-3 py-1.5 text-sm flex items-center gap-2 hover:shadow"
          >
            <ShoppingCart className="h-4 w-4" /> Manage Modules
          </button>
          <button className="rounded-full border px-3 py-1.5 text-sm flex items-center gap-2 hover:shadow">
            <Shield className="h-4 w-4" /> Permissions
          </button>
          <button className="rounded-full border px-3 py-1.5 text-sm flex items-center gap-2 hover:shadow">
            <Settings className="h-4 w-4" /> Settings
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="mx-auto max-w-7xl px-4 pt-6 grid grid-cols-12 gap-4">
        {/* Left Rail: Group Switcher & Module Quick Picks */}
        <div className="col-span-12 md:col-span-3">
          <div className="grid gap-4">
            <div className="rounded-2xl border p-3 bg-white">
              <SectionTitle>Focus Areas</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_GROUPS.map((g) => {
                  const Icon = ICON_MAP[g.icon] || Target;
                  const isActive = activeGroup === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setActiveGroup(g.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2 hover:shadow text-sm ${
                        isActive ? 'bg-black text-white' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {g.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border p-3 bg-white">
              <SectionTitle right={<button className="text-sm opacity-70 hover:opacity-100">Edit</button>}>
                Pinned Modules
              </SectionTitle>
              <div className="flex flex-wrap gap-2">
                {visibleModules.slice(0, 6).map((m) => (
                  <Pill key={m.id}>{m.name}</Pill>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Performance Board, Conversation, Decision Inbox, Memory, Narrative */}
        <div className="col-span-12 md:col-span-6">
          {/* Performance Board */}
          <div className="rounded-3xl border bg-white p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Performance Dashboard</div>
              <div className="text-xs opacity-60">Real-time RMN metrics with optimization suggestions</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <div className="text-xs opacity-60">Amazon ROAS (7-day)</div>
                <div className="text-2xl font-semibold">4.2x</div>
                <div className="text-xs opacity-60">+12% vs target—consider increasing Sponsored Brands budget</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs opacity-60">Walmart Attribution</div>
                <div className="text-2xl font-semibold">2.8x</div>
                <div className="text-xs opacity-60">30-day window capturing 85% of conversions</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs opacity-60">Active Campaigns</div>
                <div className="text-2xl font-semibold">47</div>
                <div className="text-xs opacity-60">12 need audience refresh—sync segments across platforms</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs opacity-60">Portfolio Health</div>
                <div className="text-2xl font-semibold">Optimal</div>
                <div className="text-xs opacity-60">Budget allocation balanced across 4 RMN platforms</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full border px-3 py-1.5 text-sm">Increase Sponsored Brands</button>
              <button className="rounded-full border px-3 py-1.5 text-sm">Sync audience segments</button>
              <button className="rounded-full border px-3 py-1.5 text-sm">Review attribution</button>
              <button className="rounded-full border px-3 py-1.5 text-sm">Optimize portfolio</button>
            </div>
          </div>

          {/* Guided Conversation */}
          <div className="rounded-3xl border bg-white p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Guided Conversation</div>
              <div className="text-xs opacity-60">Ask in plain language; agents will execute</div>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {messages.map((m, idx) => (
                <ConversationBubble key={idx} role={m.role} text={m.text} intents={m.intents} />
              ))}
            </div>
            <div className="mt-4">
              <CommandInput
                onSubmit={submitCommand}
                placeholder="e.g., 'Optimize Amazon budget for Black Friday' or 'Sync high-value audiences to all RMN platforms'"
              />
            </div>
          </div>

          {/* Decision Inbox */}
          <div className="mb-4">
            <DecisionInbox
              onSimulate={(id) => console.log('Simulate:', id)}
              onGenerateDecisions={async (ctx) => console.log('Generate:', ctx)}
            />
          </div>

          {/* Memory Panel */}
          <div className="mb-4">
            <MemoryPanel memory={memoryData} mode="confident" />
          </div>

          {/* Narrative Stream */}
          <div className="rounded-3xl border bg-white p-4">
            <div className="font-semibold mb-3">Activity Stream</div>
            <LiveNarrativeStream maxEntries={5} />
          </div>

          {/* Recent Activity */}
          <div className="mt-4 rounded-3xl border bg-white p-4">
            <SectionTitle>Recent Agent Activity</SectionTitle>
            <div className="grid gap-2">
              {nowRunning.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 opacity-70" />
                    <div>
                      <div className="font-medium">{r.agent}</div>
                      <div className="text-xs opacity-60">{r.detail}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-full border px-2 py-1 text-xs">View log</button>
                    <button className="rounded-full border px-2 py-1 text-xs">Undo</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: RMN Agents & Crews */}
        <div className="col-span-12 md:col-span-3">
          <div className="rounded-2xl border p-3 bg-white sticky top-20">
            <SectionTitle right={<Filter className="h-4 w-4 opacity-60" />}>Active Agents</SectionTitle>
            
            {/* RMN Crews */}
            <div className="mb-4">
              <div className="text-xs font-semibold opacity-70 mb-2">RMN CREWS</div>
              {RMN_CREWS.map((crew) => {
                const crewAgents = allAgents.filter(a => a.crew === crew.id);
                const activeCount = crewAgents.filter(a => a.status === 'running').length;
                return (
                  <div key={crew.id} className="mb-3 rounded-xl border p-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">{crew.retailer}</div>
                      <div className="text-xs opacity-60">{activeCount}/{crewAgents.length} active</div>
                    </div>
                    <div className="text-xs opacity-60 mb-2">{crew.description}</div>
                    <div className="grid gap-1">
                      {crewAgents.map((a) => {
                        if (a.status === 'running') {
                          return (
                            <div key={a.id} className="text-xs flex items-center gap-1 text-green-600">
                              <Zap className="h-3 w-3" /> {a.name} {a.confidence && `(${a.confidence}%)`}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Platform Agents */}
            <div>
              <div className="text-xs font-semibold opacity-70 mb-2">PLATFORM AGENTS</div>
              {PLATFORM_AGENTS.filter(a => purchasedAgents.has(a.id)).map((a) => (
                <div key={a.id} className="rounded-xl border p-3 mb-2">
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs opacity-60 mb-2">{a.description}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {a.skills.slice(0, 3).map((s) => (
                      <Pill key={s}>{s}</Pill>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-full border px-2 py-1 text-xs flex items-center gap-1">
                      {a.status === 'running' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {a.status === 'running' ? 'Pause' : 'Run'}
                    </button>
                    {a.status === 'running' && a.confidence && (
                      <span className="text-xs text-green-600">{a.confidence}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module Drawer */}
      <AnimatePresence>
        {showModuleDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setShowModuleDrawer(false)}
          >
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">Manage Modules</div>
                <button onClick={() => setShowModuleDrawer(false)} className="rounded-full border p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border p-2">
                <Search className="h-4 w-4 opacity-60" />
                <input placeholder="Search modules..." className="w-full outline-none" />
              </div>

              <div className="mt-4 space-y-5">
                {BUSINESS_GROUPS.map((g) => {
                  const groupModules = BUSINESS_MODULES.filter((m) => m.group === g.id);
                  if (!groupModules.length) return null;
                  const Icon = ICON_MAP[g.icon] || Target;
                  return (
                    <div key={g.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <h4 className="font-medium">{g.name}</h4>
                      </div>
                      <div className="grid gap-2">
                        {groupModules.map((m) => (
                          <ModuleToggle
                            key={m.id}
                            moduleId={m.id}
                            name={m.name}
                            type={m.type}
                            active={purchasedModules.has(m.id)}
                            onToggle={toggleModule}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border p-3 bg-neutral-50">
                <div className="text-sm opacity-70 mb-2">Billing Preview</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">{purchasedModules.size} modules</div>
                    <div className="text-xs opacity-60">Agents billed per execution</div>
                  </div>
                  <button className="rounded-full border px-3 py-1.5 text-sm flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Checkout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mx-auto max-w-7xl px-4 py-8 opacity-60 text-xs">
        RMN Command Console — keyboard: ⌘/Ctrl+K to focus Command.
      </div>
    </div>
   </OrchestrationProvider>
  );
}
