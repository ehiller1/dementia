import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Settings, User, Bot,
  Sparkles, Loader2, FastForward, RotateCcw, AlertCircle, CheckCircle,
  Clock, Target, TrendingUp, Users, FileText, BarChart3, Lightbulb,
  Play, Pause, Square, Zap, GitBranch, Brain, MessageCircle, ArrowRight,
  HelpCircle, Info, Upload, ChevronDown, BookOpen, Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnhancedUnifiedConversation as useConversation } from '@/contexts/EnhancedUnifiedConversationProvider';
import { useDemoTracking } from '../hooks/useDemoTracking';
import { useIncrementalWorkflow, type WorkflowMessage, type MOLASPhase } from '../hooks/useIncrementalWorkflow';
import { useWindsurfConversation } from '../hooks/useWindsurfConversation';
import { useOrchestration } from '../services/context/OrchestrationContext';
import { processMessage } from '../lib/api/processMessage';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionAssignmentModal } from './ActionAssignmentModal';
import { ConversationalMessageRenderer } from './ConversationalMessageRenderer';
import { createTaskAutomationService } from '../services/TaskAutomationService';
import { ExecutiveRenderer } from './ExecutiveRenderer';
import { StructuredMessageRenderer } from './StructuredMessageRenderer';
import type { WorkflowSnapshot } from '@/services/graph/WorkflowGraphService';
import { MetaThoughtDisplay } from '@/components/MetaThoughtDisplay';

/**
 * Sanitize text by removing the word "crew" and "CrewAI" (case-insensitive)
 * This prevents internal technical terms from appearing in the UI
 */
const sanitizeText = (text: string | undefined | null): string => {
  if (!text || typeof text !== 'string') return '';
  // Replace "CrewAI" (with or without space) and "crew" (case-insensitive)
  let sanitized = text
    .replace(/Crew\s*AI/gi, '') // Match "CrewAI" or "Crew AI" (case-insensitive)
    .replace(/\bcrew\b/gi, '') // Match standalone "crew" word
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .replace(/\s+([.,;:!?])/g, '$1') // Remove space before punctuation
    .replace(/([.,;:!?])\s+/g, '$1 ') // Ensure space after punctuation
    .trim();
  
  // Clean up any remaining artifacts
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
};

// Extend WorkflowMessage to support Windsurf message types
type ConversationMessage = WorkflowMessage | {
  id: string;
  type: 'task_update' | 'agent_progress' | 'mentor_nudge';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  mentorNudge?: {
    momentId: string;
    message: string;
    icon?: string;
    ctas: Array<{ label: string; action: string; payload?: any }>;
  };
};

// ============================================================================
// MENTOR MOMENTS - Embedded Micro-Mentorship System
// ============================================================================

type TopicTag = "marketing" | "sales" | "retail_media" | "supply_chain" | "finance" | "operations";
type CTAAction = "OPEN_PLAYBOOK" | "RUN_ASSISTANT" | "VIEW_ANALYTICS" | "CREATE_TASK";

interface MentorCTA {
  label: string;
  action: CTAAction;
  payload?: Record<string, any>;
}

interface MentorMoment {
  id: string;
  triggerPatterns: string[];
  preconditions?: string[];
  cooldownKey?: string;
  priority?: number;
  nudge: {
    message: string;
    ctas: MentorCTA[];
    icon?: string;
  };
}

interface Playbook {
  id: string;
  title: string;
  topic: TopicTag;
  mentorMoments: MentorMoment[];
}

interface Classification {
  topics: Array<{ tag: TopicTag; confidence: number }>;
  intents: string[];
}

// Sample Playbooks
const PLAYBOOKS: Playbook[] = [
  {
    id: "pb-marketing-optimization",
    title: "Marketing Campaign Optimization",
    topic: "marketing",
    mentorMoments: [
      {
        id: "mm-campaign-segmentation",
        triggerPatterns: ["campaign|email|newsletter", "low engagement|open rate|click"],
        cooldownKey: "campaign-segmentation-weekly",
        priority: 8,
        nudge: {
          message: "💡 Leaders find that segmenting campaigns by customer behavior boosts engagement by 40%. Want to see best practices?",
          icon: "💡",
          ctas: [
            { label: "View Playbook", action: "OPEN_PLAYBOOK", payload: { playbookId: "pb-marketing-optimization" } },
            { label: "Run Segmentation", action: "RUN_ASSISTANT", payload: { assistantId: "segmentation_assistant" } }
          ]
        }
      }
    ]
  },
  {
    id: "pb-retail-media",
    title: "Retail Media Network Optimization",
    topic: "retail_media",
    mentorMoments: [
      {
        id: "mm-rmn-attribution",
        triggerPatterns: ["rmn|retail media|roas|attribution", "campaign performance|ad spend"],
        cooldownKey: "rmn-attribution-weekly",
        priority: 9,
        nudge: {
          message: "📊 Top performers use cross-platform attribution to optimize RMN spend. Want to set up unified tracking?",
          icon: "📊",
          ctas: [
            { label: "View Analytics", action: "VIEW_ANALYTICS", payload: { dashboard: "rmn_attribution" } },
            { label: "Setup Tracking", action: "RUN_ASSISTANT", payload: { assistantId: "attribution_setup" } }
          ]
        }
      }
    ]
  },
  {
    id: "pb-supply-chain",
    title: "Supply Chain Optimization",
    topic: "supply_chain",
    mentorMoments: [
      {
        id: "mm-inventory-forecast",
        triggerPatterns: ["inventory|stock|out of stock|overstocked", "demand forecast|supply"],
        preconditions: ["has_inventory_data"],
        cooldownKey: "inventory-forecast-weekly",
        priority: 7,
        nudge: {
          message: "🎯 Successful teams use AI-driven demand forecasting to reduce stockouts by 30%. Ready to optimize?",
          icon: "🎯",
          ctas: [
            { label: "Run Forecast", action: "RUN_ASSISTANT", payload: { assistantId: "demand_forecast" } },
            { label: "View Playbook", action: "OPEN_PLAYBOOK", payload: { playbookId: "pb-supply-chain" } }
          ]
        }
      }
    ]
  }
];

// Cooldown management (in-memory for now)
const cooldowns = new Map<string, number>();

function isOnCooldown(userId: string, cooldownKey: string): boolean {
  const key = `${userId}:${cooldownKey}`;
  const expiry = cooldowns.get(key);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    cooldowns.delete(key);
    return false;
  }
  return true;
}

function setCooldown(userId: string, cooldownKey: string, durationMs: number = 7 * 24 * 60 * 60 * 1000) {
  const key = `${userId}:${cooldownKey}`;
  cooldowns.set(key, Date.now() + durationMs);
}

// Topic classification (simple keyword-based for now)
function classifyTopic(text: string): Classification {
  const lower = text.toLowerCase();
  const topics: Array<{ tag: TopicTag; confidence: number }> = [];
  
  if (/(campaign|marketing|email|newsletter|engagement|seo|social media)/i.test(lower)) {
    topics.push({ tag: "marketing", confidence: 0.8 });
  }
  if (/(sales|pipeline|lead|conversion|revenue|deal)/i.test(lower)) {
    topics.push({ tag: "sales", confidence: 0.75 });
  }
  if (/(rmn|retail media|roas|attribution|ad spend|sponsored)/i.test(lower)) {
    topics.push({ tag: "retail_media", confidence: 0.85 });
  }
  if (/(inventory|stock|supply chain|warehouse|logistics|demand)/i.test(lower)) {
    topics.push({ tag: "supply_chain", confidence: 0.8 });
  }
  if (/(finance|budget|p&l|cost|expense|profit)/i.test(lower)) {
    topics.push({ tag: "finance", confidence: 0.75 });
  }
  if (/(operations|process|efficiency|workflow)/i.test(lower)) {
    topics.push({ tag: "operations", confidence: 0.7 });
  }
  
  return { topics, intents: [] };
}

// Detect triggers
function getCandidateMoments(playbooks: Playbook[], topics: TopicTag[], text: string, userId: string) {
  const pool = playbooks
    .filter(p => topics.includes(p.topic))
    .flatMap(p => p.mentorMoments.map(m => ({ ...m, playbookId: p.id, playbookTitle: p.title })));
    
  return pool.filter(m => {
    // Check trigger patterns
    const matches = m.triggerPatterns.some(pattern => 
      new RegExp(pattern, 'i').test(text)
    );
    if (!matches) return false;
    
    // Check cooldown
    if (m.cooldownKey && isOnCooldown(userId, m.cooldownKey)) return false;
    
    // Check preconditions (simplified)
    if (m.preconditions) {
      // In production, check against actual system state
      // For now, assume all preconditions pass
    }
    
    return true;
  });
}

// Score and choose moment
function chooseMoment(candidates: any[], cls: Classification) {
  if (!candidates.length) return null;
  
  const ranked = candidates.map(m => {
    const topicBoost = Math.max(
      ...cls.topics.map(t => 
        m.triggerPatterns.some((p: string) => new RegExp(t.tag, 'i').test(p)) ? t.confidence : 0
      )
    );
    const priority = m.priority ?? 0;
    const score = priority * 2 + topicBoost * 1.5;
    return { m, score };
  }).sort((a, b) => b.score - a.score);
  
  return ranked[0].m;
}

// Function to clean up message content for better readability
const cleanMessageContent = (content: string): string => {
  return content
    // Remove emoji icons
    .replace(/[🔍📊🎯💡🚀✨📈📉💰🌟⭐🎨🔧⚡🌊🏢🔗🌍🌐📋📚🎯🔄]/g, '')
    // Replace bullet points with clean bullets
    .replace(/^[•·‣▪▫◦‣]/gm, '•')
    // Clean up excessive spacing
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Trim whitespace
    .trim();
};

interface MissingField {
  field: string;
  importance: 'critical' | 'important' | 'optional';
  question: string;
  examples: string[];
  reasoning: string;
}

interface ContextualPrompt {
  type: 'question' | 'suggestion' | 'clarification';
  content: string;
  field: string;
  examples: string[];
  priority: number;
}

interface WindsurfConversationInterfaceProps {
  conversationId?: string;
  userId?: string;
  tenantId?: string;
  onConversationChange?: (messages: ConversationMessage[]) => void;
  onApiResponse?: (response: any) => void;
}

/**
 * Windsurf-like Conversation Interface with Incremental Workflow
 * 
 * Provides an intelligent, multi-turn conversational experience similar to Windsurf/Cascade,
 * integrating incremental MOLAS workflow for step-by-step business intelligence guidance.
 */
export const WindsurfConversationInterface: React.FC<WindsurfConversationInterfaceProps> = ({
  conversationId = 'windsurf_conversation',
  userId = 'default_user',
  tenantId = 'default_tenant',
  onConversationChange,
  onApiResponse
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [contextualPrompts, setContextualPrompts] = useState<ContextualPrompt[]>([]);
  const [showFieldPrompts, setShowFieldPrompts] = useState(false);
  const [isAnalyzingGaps, setIsAnalyzingGaps] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Marketing");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isApiProcessing, setIsApiProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenMessageIds = useRef<Set<string>>(new Set());
  const { toast } = useToast();
  const tracking = useDemoTracking();

  // Helper functions for intent and role detection
  const detectIntent = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('seasonal') || q.includes('season')) return 'SEASONALITY_ANALYSIS';
    if (q.includes('optimize') || q.includes('optimization')) return 'OPTIMIZATION';
    if (q.includes('analyze') || q.includes('analysis')) return 'ANALYSIS';
    if (q.includes('forecast') || q.includes('predict')) return 'FORECASTING';
    if (q.includes('inventory') || q.includes('stock')) return 'INVENTORY_MANAGEMENT';
    if (q.includes('what') || q.includes('how') || q.includes('?')) return 'INFORMATION';
    return 'GENERAL';
  };

  const detectUserRole = (query: string): 'BUILDER' | 'OPERATOR' | 'UNKNOWN' => {
    const q = query.toLowerCase();
    const builderKeywords = ['build', 'create', 'develop', 'implement', 'configure', 'setup', 'design'];
    const operatorKeywords = ['analyze', 'optimize', 'monitor', 'track', 'performance', 'report', 'dashboard'];
    
    const hasBuilder = builderKeywords.some(keyword => q.includes(keyword));
    const hasOperator = operatorKeywords.some(keyword => q.includes(keyword));
    
    if (hasBuilder && !hasOperator) return 'BUILDER';
    if (hasOperator && !hasBuilder) return 'OPERATOR';
    return 'UNKNOWN';
  };

  // Mount log for debugging blank render issues
  useEffect(() => {
    console.log('WindsurfConversationInterface mounted with conversationId:', conversationId);
  }, [conversationId]);

  // Incremental workflow hook with progressive streaming enabled
  const {
    workflowProgress,
    isProcessing: isWorkflowProcessing,
    isStreaming,
    streamingPhase,
    error,
    sendWorkflowMessage,
    continueWorkflow,
    resetWorkflow,
    getWorkflowStatus,
    shouldContinueWorkflow,
    streamMessagesProgressively
  } = useIncrementalWorkflow(conversationId, {
    enabled: true,
    delayBetweenMessages: 800, // 800ms between executive cards
    showTypingIndicator: true,
    typingIndicatorDuration: 600 // 600ms for typing animation
  });
  
  // OPTION C: Windsurf-Style Orchestrator (autonomous execution loop)
  const windsurfConversation = useWindsurfConversation(conversationId);
  const isProcessing = isWorkflowProcessing || windsurfConversation.isExecuting || isApiProcessing;
  
  // Sync Windsurf messages to local state
  useEffect(() => {
    if (windsurfConversation.messages.length > messages.length) {
      const newMessages = windsurfConversation.messages.slice(messages.length);
      // Cast Windsurf messages to ConversationMessage type
      setMessages(prev => [...prev, ...newMessages as ConversationMessage[]]);
    }
  }, [windsurfConversation.messages]);
  
  // Task automation service state
  // Use a broad type here because the JS implementation is imported at runtime
  const [taskAutomationService, setTaskAutomationService] = useState<any>(null);
  const [currentContext, setCurrentContext] = useState<Record<string, any>>({});

  // Eventing and workflow orchestration (in-memory, swappable later)
  const { eventBus, graphService, controller } = useOrchestration();
  const [workflowSnapshot, setWorkflowSnapshot] = useState<WorkflowSnapshot | null>(null);

  // Action state model (event-driven)
  type ActionStatus = 'queued' | 'running' | 'needs_user_input' | 'blocked' | 'error' | 'done';
  interface ActionRecord {
    id: string;
    title?: string;
    status: ActionStatus;
    inputs?: Record<string, any>;
    owner?: string;
    createdAt?: number;
    updatedAt?: number;
  }
  const [actions, setActions] = useState<ActionRecord[]>([]);

  // Memoized values for TaskSuggestionPanel to prevent unnecessary re-renders
  const memoizedConversation = useMemo(() => 
    messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })), 
    [messages]
  );
  
  const memoizedContext = useMemo(() => {
    const workflowStatus = getWorkflowStatus();
    return {
      currentPhase: workflowStatus.phase,
      workflowStatus: workflowStatus
    };
  }, [getWorkflowStatus]);

  // Initialize task automation service
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize the OpenAI-backed task automation service (JS implementation)
        const tas = createTaskAutomationService({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
        });
        setTaskAutomationService(tas as any);
        
        // Set initial context
        setCurrentContext({
          conversationId,
          project: 'Windsurf Conversation',
          interface: 'windsurf'
        });
        
        console.log('✅ Task automation service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize task automation service:', error);
      }
    };
    
    initializeServices();
  }, [conversationId]);


  // Subscribe to live workflow graph updates (keep a local snapshot for UI sync)
  useEffect(() => {
    if (!controller || !graphService) return;
    const wfId = controller.getWorkflowId();
    if (!wfId) return;
    const sub = graphService.subscribe(wfId, (snap) => {
      setWorkflowSnapshot(snap);
    });
    return () => sub.unsubscribe();
  }, [controller, graphService]);

  // Subscribe to action lifecycle events
  useEffect(() => {
    // EventBus removed - no subscriptions
    return;
    // eslint-disable-next-line @typescript-eslint/no-unreachable
    if (!eventBus) return;
    const createdSub = eventBus.subscribe('action.created', (evt) => {
      setActions((prev) => {
        // Avoid duplicates
        if (prev.find((a) => a.id === evt.id)) return prev;
        const rec: ActionRecord = {
          id: evt.id,
          title: evt.title,
          status: (evt.status || 'queued') as ActionStatus,
          inputs: evt.inputs,
          owner: evt.owner,
          createdAt: evt.createdAt || Date.now(),
          updatedAt: evt.createdAt || Date.now(),
        };
        return [rec, ...prev];
      });
    });
    const statusSub = eventBus.subscribe('action.status_changed', (evt) => {
      setActions((prev) => {
        const idx = prev.findIndex((a) => a.id === evt.id);
        if (idx === -1) {
          // If we missed creation, create a minimal record
          const rec: ActionRecord = {
            id: evt.id,
            status: (evt.status || 'queued') as ActionStatus,
            updatedAt: evt.updatedAt || Date.now(),
          };
          return [rec, ...prev];
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status: (evt.status || updated[idx].status) as ActionStatus,
          updatedAt: evt.updatedAt || Date.now(),
        };
        return updated;
      });
    });
    return () => {
      createdSub.unsubscribe();
      statusSub.unsubscribe();
    };
  }, [eventBus]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to reflective messages from conversation flow
  useEffect(() => {
    // EventBus removed - no subscriptions
    return;
    // eslint-disable-next-line @typescript-eslint/no-unreachable
    if (!eventBus) return;
    
    const reflectionSubscription = eventBus.subscribe('narrative.item', (event: any) => {
      // Only add reflections from the reflective orchestration system
      if (event.metadata?.source === 'reflective_orchestration' && event.metadata?.messageType === 'reflection') {
        console.log('🔍 [WindsurfConversation] Received reflection message (raw):', event.content.substring(0, 100));
        
        // Parse the JSON content to extract narrative_update
        let narrativeText = event.content;
        try {
          // Remove markdown code fences
          let content = event.content;
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/i) || content.match(/```\s*([\s\S]*?)\s*```/i);
          if (jsonMatch) {
            content = jsonMatch[1].trim();
          }
          
          // Parse JSON if it looks like JSON
          if (typeof content === 'string' && content.trim().startsWith('{')) {
            const parsed = JSON.parse(content);
            narrativeText = parsed.narrative_update || parsed.content || content;
            console.log('✅ [WindsurfConversation] Parsed reflection narrative:', narrativeText);
          }
        } catch (e) {
          console.warn('⚠️ [WindsurfConversation] Failed to parse reflection JSON, using raw content');
        }
        
        // Only add if we have meaningful text (not just raw JSON)
        if (narrativeText && narrativeText.length > 10 && !narrativeText.includes('```json')) {
          const reflectionMessage: ConversationMessage = {
            id: event.id,
            type: 'system' as const,
            content: narrativeText,
            timestamp: new Date(event.timestamp),
            metadata: {
              messageType: 'reflection',
              source: 'reflective_orchestration',
              phase: event.metadata.phase,
              confidence: event.metadata.confidence
            }
          };
          
          setMessages(prev => [...prev, reflectionMessage]);
        }
      }
    });
    
    return () => reflectionSubscription.unsubscribe();
  }, [eventBus]);
  
  // Initialize conversation and subscribe to proactive orchestration
  useEffect(() => {
    if (messages.length === 0) {
      // Add welcome message with timestamp
      setMessages([{
        id: '1',
        type: 'assistant',
        content: `I'm your AI assistant, ready to help you analyze data, make decisions, and execute strategies. I can:

• Analyze your business data and seasonal patterns
• Simulate scenarios and project outcomes
• Provide executive-level insights with confidence scores
• Generate actionable recommendations with cross-functional impact
• Coordinate with specialized AI agents for deep analysis

Try asking me something like:
"What are our current holiday sales trends?"
"Analyze Q4 forecast accuracy"
"Show me inventory optimization opportunities"`,
        timestamp: new Date(),
        workflowMetadata: {}
      }]);
    }

    // SUBSCRIBE TO PROACTIVE ORCHESTRATION UPDATES
    // EventBus removed - no subscriptions
    return () => {};
    // eslint-disable-next-line @typescript-eslint/no-unreachable
    if (!eventBus) {
      return () => {}; // Return empty cleanup function
    }
    
    const subscriptions: Array<{ unsubscribe: () => void }> = [];
    
    // Subscribe to proactive orchestration updates
    subscriptions.push(eventBus.subscribe('orchestration.proactive_update', (evt: any) => {
      console.log('📡 [WindsurfConversation] Received proactive orchestration update', evt);
      
      // Add proactive system message
      const proactiveMessage: WorkflowMessage = {
        id: `proactive_${Date.now()}`,
        type: 'system' as const,
        content: `🌀 **Proactive Orchestration Alert**\n\n${evt.payload.executiveSummary.join('\n')}\n\n**Confidence:** ${Math.round(evt.payload.confidence * 100)}%\n**Mode:** ${evt.status.executionMode}`,
        timestamp: new Date(),
        metadata: {
          messageType: 'narrative_update',
          source: 'continuous_orchestration',
          orchestrationStatus: evt.status
        }
      };
      
      setMessages(prev => [...prev, proactiveMessage]);
    }));
    
    // ✅ NEW: Subscribe to phase transitions (log only, don't show to user)
    subscriptions.push(eventBus.subscribe('orchestration.phase_started', (evt: any) => {
      console.log('⚡ [WindsurfConversation] Phase transition:', evt.phase, '(not shown to user)');
      // Note: Phase transitions are now handled internally by reflective loop
      // We don't show technical "phase transition" messages to end users
    }));
    
    // ✅ NEW: Subscribe to agent updates (log only, don't show technical status)
    subscriptions.push(eventBus.subscribe('agent.updated', (evt: any) => {
      console.log('🤖 [WindsurfConversation] Agent update:', evt, '(not shown to user)');
      // Note: Agent completion is handled by reflective loop
      // We don't show technical "Agent Completed" messages to end users
    }));
    
    // ✅ NEW: Subscribe to agent progress (show progress bars)
    subscriptions.push(eventBus.subscribe('agent.progress_update', (evt: any) => {
      console.log('📊 [WindsurfConversation] Agent progress:', evt.progress, '%');
      // Note: In production, update a dedicated progress state instead of adding messages
    }));
    
    // ✅ NEW: Subscribe to marketplace bidding completion
    subscriptions.push(eventBus.subscribe('marketplace.bidding_complete', (evt: any) => {
      console.log('🎯 [WindsurfConversation] Marketplace bidding complete:', evt);
      
      const biddingMessage: WorkflowMessage = {
        id: `bidding_${Date.now()}`,
        type: 'system' as const,
        content: `🎯 **Agent Marketplace**: ${evt.totalBids} agents submitted bids, ${evt.tasksAssigned} tasks assigned\n\n**Average Confidence**: ${Math.round(evt.averageConfidence * 100)}%\n**Strategy**: ${evt.strategy}`,
        timestamp: new Date(),
        metadata: {
          messageType: 'marketplace_update',
          biddingResult: evt
        }
      };
      
      setMessages(prev => [...prev, biddingMessage]);
    }));
    
    // ✅ NEW: Subscribe to micro-task completion
    subscriptions.push(eventBus.subscribe('micro_task.completed', (evt: any) => {
      console.log('✅ [WindsurfConversation] Micro-task completed:', evt.taskId);
    }));

    return () => {
      subscriptions.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
    };
  }, [eventBus]);

  // Analyze message for missing fields and gaps
  const analyzeMessageGaps = async (messageContent: string) => {
    setIsAnalyzingGaps(true);
    
    try {
      // Call backend for gap analysis
      const response = await fetch('/api/analyze-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: messageContent,
          conversationId,
          analysisType: 'seasonality' // Could be dynamic based on intent
        })
      });
      
      if (response.ok) {
        const gapAnalysis = await response.json();
        
        if (gapAnalysis.missingFields && gapAnalysis.missingFields.length > 0) {
          setMissingFields(gapAnalysis.missingFields);
          setContextualPrompts(gapAnalysis.contextualPrompts || []);
          setShowFieldPrompts(true);
          
          // Add system message about missing information
          const gapMessage: ConversationMessage = {
            id: 'gap_analysis_' + Date.now(),
            type: 'system',
            content: `I need a bit more information to provide the best analysis. I've identified ${gapAnalysis.missingFields.length} areas where additional details would help.`,
            timestamp: new Date(),
            metadata: {
              phase: 'discovery',
              workflowStep: 'gap_identification',
              gapAnalysis
            }
          };
          
          setMessages(prev => [...prev, gapMessage]);
        }
      }
    } catch (error) {
      console.error('Gap analysis failed:', error);
    } finally {
      setIsAnalyzingGaps(false);
    }
  };

  // Handle sending messages with API integration
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    // Track user query event (safe - check if method exists)
    if (tracking && typeof tracking.trackEventCaptured === 'function') {
    tracking.trackEventCaptured('user_query_submitted', 'conversation_interface', {
      query: messageContent,
      queryLength: messageContent.length,
      hasQuestionMark: messageContent.includes('?'),
      conversationId
    });
    }

    // Detect and track intent
    const detectedIntent = detectIntent(messageContent);
    if (tracking && typeof tracking.trackIntentDetected === 'function') {
    tracking.trackIntentDetected(detectedIntent, 0.85, messageContent, {
      queryLength: messageContent.length,
      hasQuestionMark: messageContent.includes('?')
    });
    }

    // Detect and track user role
    const userRole = detectUserRole(messageContent);
    if (tracking && typeof tracking.trackRoleDetected === 'function') {
    tracking.trackRoleDetected(userRole, 0.78, ['keyword_analysis', 'context_clues'], {
      queryType: detectedIntent
    });
    }

    // Add user message immediately
    const userMessage: ConversationMessage = {
      id: 'user_' + Date.now(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      metadata: { phase: 'input' }
    };
    setMessages(prev => [...prev, userMessage]);

    // ========== MENTOR MOMENTS: Disabled - No longer showing mentor moments ==========
    // Mentor moments have been disabled to keep the interface clean and focused on responses
    // If you want to re-enable, uncomment the code below:
    /*
    const currentUserId = userId || 'default_user';
    const cls = classifyTopic(messageContent);
    const topTopics = cls.topics.filter(t => t.confidence >= 0.6).map(t => t.tag);
    
    if (topTopics.length > 0) {
      const candidates = getCandidateMoments(PLAYBOOKS, topTopics, messageContent, currentUserId);
      const chosen = chooseMoment(candidates, cls);
      
      if (chosen) {
        // Set cooldown
        if (chosen.cooldownKey) {
          setCooldown(currentUserId, chosen.cooldownKey, 7 * 24 * 60 * 60 * 1000); // 7 days
        }
        
        // Inject mentor nudge message
        const nudgeMessage: ConversationMessage = {
          id: 'mentor_' + Date.now(),
          type: 'mentor_nudge',
          content: chosen.nudge.message,
          timestamp: new Date(),
          metadata: {
            momentId: chosen.id,
            playbookId: chosen.playbookId,
            topic: topTopics[0]
          },
          mentorNudge: {
            momentId: chosen.id,
            message: chosen.nudge.message,
            icon: chosen.nudge.icon,
            ctas: chosen.nudge.ctas
          }
        };
        
        setMessages(prev => [...prev, nudgeMessage]);
        
        // Log telemetry
        console.log('📚 [MentorMoment] Shown:', {
          momentId: chosen.id,
          playbookId: chosen.playbookId,
          topic: topTopics[0],
          confidence: cls.topics[0]?.confidence
        });
      }
    }
    */
    // ========================================================================

    // Annotate into the workflow graph (non-blocking)
    controller?.annotateUserMessage(messageContent).catch(err => console.error('annotateUserMessage error', err));

    try {
      console.log('🚀 [WindsurfConversation] Calling API endpoint:', '/api/process-message');
      
      // Set processing state
      setIsApiProcessing(true);
      
      // Add loading message with animated dots
      const loadingMessage: ConversationMessage = {
        id: 'loading_' + Date.now(),
        type: 'assistant',
        content: 'Processing',
        timestamp: new Date(),
        metadata: { phase: 'processing', isLoading: true }
      };
      setMessages(prev => [...prev, loadingMessage]);

      // Call the API endpoint directly
      // Build request body matching backend API format: { message, conversationId }
      // conversationId should be unique per authenticated user
      const currentUserId = userId || 'default_user';
      const requestBody: any = {
        message: messageContent,
        conversationId: conversationId || currentUserId || 'default_conversation'
      };

      // Add agentTag when Retail Media is selected
      if (selectedModel === 'Retail Media') {
        requestBody.agentTag = 'tenmilliondollargrowthplan';
      }

      const response = await fetch('/api/process-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [WindsurfConversation] API response received:', result);
      console.log('✅ [WindsurfConversation] Response text length:', result.response?.length || 0);
      console.log('✅ [WindsurfConversation] Response text preview:', result.response?.substring(0, 200) || 'No response');

      // Notify parent component of API response
      if (onApiResponse) {
        onApiResponse(result);
      }

      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.metadata?.isLoading));

      // Extract response from backend API format
      // Backend returns: { response: "...", requestId: "...", conversationId: "...", ... }
      const responseText = result.response || 
                          result.agentResults?.summary?.synthesizedAnswer || 
                          result.conversationalResponse || 
                          'No response available';
      
      console.log('✅ [WindsurfConversation] Final responseText length:', responseText.length);
      console.log('✅ [WindsurfConversation] Final responseText preview:', responseText.substring(0, 200));
      
      // Add assistant response message in Windsurf-style chat format
      const assistantMessage: ConversationMessage = {
        id: 'assistant_' + Date.now(),
        type: 'assistant',
        content: responseText,
        timestamp: new Date(result.timestamp ? new Date(result.timestamp) : new Date()),
        metadata: {
          phase: 'response',
          requestId: result.requestId,
          conversationId: result.conversationId,
          processingTime: result.processingTime,
          turnEnvelope: result.turnEnvelope,
          function_calls: result.function_calls,
          intent: result.intentClassification?.intent,
          intentClassification: result.intentClassification, // Store full intentClassification object
          agentResults: result.agentResults,
          templates: result.templates, // Store templates if available
          query: result.query // Store query for context
        }
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Clear field prompts after successful processing
      if (showFieldPrompts) {
        setShowFieldPrompts(false);
        setMissingFields([]);
        setContextualPrompts([]);
      }

      toast({
        title: 'Success',
        description: 'Response received successfully',
      });
      
    } catch (error) {
      console.error('❌ Error in message processing:', error);
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.metadata?.isLoading));
      
      // Add error message
      const errorMessage: ConversationMessage = {
        id: 'error_' + Date.now(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { phase: 'error' }
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Error',
        description: 'Failed to process message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      // Always clear processing state
      setIsApiProcessing(false);
    }
  };

  // Handle continuing workflow
  const handleContinueWorkflow = async () => {
    try {
      const workflowMessages = await continueWorkflow(processMessage);
      setMessages(prev => [...prev, ...workflowMessages]);

    } catch (error) {
      console.error('Error continuing workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to continue workflow. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle resetting workflow
  const handleResetWorkflow = () => {
    resetWorkflow();
    setMessages([]);
    setIsInitialized(false);
  };

  // Local helpers used by contextual actions panel and navigation actions
  const addMessage = (msg: ConversationMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const sendMessage = (content: string) => {
    // Queue content and immediately process via existing handler
    setInputValue(content);
    // Let state update flush, then send
    setTimeout(() => {
      handleSendMessage();
    }, 0);
  };

  // Get workflow status for UI
  const workflowStatus = getWorkflowStatus();

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Notify parent of conversation changes
  useEffect(() => {
    if (onConversationChange) {
      onConversationChange(messages);
    }
  }, [messages, onConversationChange]);

  // Handle action selection
  const handleActionSelect = (action: any) => {
    setSelectedAction(action);
    setIsActionModalOpen(true);
  };

  // Handle action approval
  const handleActionApprove = async () => {
    if (!selectedAction) return;
    
    toast({
      title: 'Action Approved',
      description: `${selectedAction.title} has been approved and will be executed.`
    });
    
    setIsActionModalOpen(false);
  };

  // Handle action modification
  const handleActionModify = async () => {
    if (!selectedAction) return;
    
    toast({
      title: 'Action Modified',
      description: `${selectedAction.title} is being modified.`
    });
    
    setIsActionModalOpen(false);
  };

  // Handle action cancellation
  const handleActionCancel = () => {
    toast({
      title: 'Action Cancelled',
      description: 'Action has been cancelled.'
    });
    
    setIsActionModalOpen(false);
  };

  // Handle contextual prompt selection
  const handlePromptSelect = (prompt: ContextualPrompt) => {
    setInputValue(prompt.content);
    setShowFieldPrompts(false);
  };

  // Handle missing field response
  const handleFieldResponse = (field: MissingField, response: string) => {
    const fieldResponse = `${field.question} ${response}`;
    setInputValue(fieldResponse);
    setShowFieldPrompts(false);
  };

  // Get phase icon
  const getPhaseIcon = (phase?: MOLASPhase) => {
    switch (phase) {
      case 'planning': return <Target className="h-4 w-4" />;
      case 'reasoning': return <Brain className="h-4 w-4" />;
      case 'execution': return <Zap className="h-4 w-4" />;
      case 'interpretation': return <Lightbulb className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  // Get phase color
  const getPhaseColor = (phase?: MOLASPhase) => {
    switch (phase) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'reasoning': return 'bg-purple-100 text-purple-800';
      case 'execution': return 'bg-green-100 text-green-800';
      case 'interpretation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle mentor CTA actions
  const handleMentorCTA = (action: string, payload?: any) => {
    console.log('📚 [MentorMoment] CTA clicked:', action, payload);
    
    switch (action) {
      case 'OPEN_PLAYBOOK':
        toast({
          title: "Opening Playbook",
          description: `Loading ${payload?.playbookId || 'playbook'}...`,
        });
        // In production: navigate to playbook or open modal
        break;
      case 'RUN_ASSISTANT':
        toast({
          title: "Starting Assistant",
          description: `Launching ${payload?.assistantId || 'assistant'}...`,
        });
        // In production: trigger assistant workflow
        break;
      case 'VIEW_ANALYTICS':
        toast({
          title: "Opening Analytics",
          description: `Loading ${payload?.dashboard || 'dashboard'}...`,
        });
        // In production: open analytics view
        break;
      case 'CREATE_TASK':
        toast({
          title: "Creating Task",
          description: "Task created successfully",
        });
        // In production: create task
        break;
      default:
        console.warn('Unknown CTA action:', action);
    }
  };

  // Render message with conversational chunking
  const renderMessage = (message: ConversationMessage, index: number) => {
    // ✅ LOADING MESSAGE - Show animated three dots
    if (message.metadata?.isLoading) {
      return (
        <div key={message.id} className="mb-4 flex justify-start">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
            <span className="text-sm text-blue-700 font-medium">Processing</span>
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        </div>
      );
    }
    
    // ✅ NEW: STATUS UPDATES - Show reading/thinking indicators
    if (message.metadata?.messageType === 'status_update') {
      const phase = message.metadata.phase;
      const icon = phase === 'reading' ? '📖' : '🤔';
      const bgColor = phase === 'reading' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200';
      const textColor = phase === 'reading' ? 'text-blue-700' : 'text-purple-700';
      
      return (
        <div key={message.id} className="mb-4 flex justify-start">
          <div className={`${bgColor} border rounded-lg p-3 flex items-center gap-2 animate-pulse`}>
            <span className="text-lg">{icon}</span>
            <span className={`text-sm font-medium ${textColor}`}>{message.content}</span>
          </div>
        </div>
      );
    }
    
    // MENTOR NUDGE: Render embedded micro-mentorship
    if (message.type === 'mentor_nudge' && message.mentorNudge) {
      return (
        <div key={message.id} className="mb-4">
          <Card className="border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Compass className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      Mentor Moment
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {message.metadata?.topic || 'Guidance'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed mb-3">
                    {message.mentorNudge.message}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {message.mentorNudge.ctas.map((cta, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={idx === 0 ? "default" : "outline"}
                        onClick={() => handleMentorCTA(cta.action, cta.payload)}
                        className="text-xs"
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        {cta.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-xs text-gray-500 mt-2 text-left">
            <Clock className="h-3 w-3 inline mr-1" />
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      );
    }
    
    // OPTION C: Check for Windsurf-style message types
    const isWindsurfTaskUpdate = message.type === 'task_update';
    const isWindsurfProgress = message.type === 'agent_progress';
    
    // Check if this is a reflection message (Layer 2 - Reflective Orchestration)
    const isReflectionMessage = message.metadata?.messageType === 'reflection' || 
                                message.metadata?.source === 'reflective_orchestration' ||
                                message.type === 'system';
    
    // Check if this is a structured message with messageType (from conversation_creator)
    // Support all 8 message types: summary, insights, recommendations, actions, events, memory, impact, provenance
    const isStructuredMessage = message.metadata?.messageType && 
                               ['summary', 'insights', 'recommendations', 'actions', 'events', 'memory', 'impact', 'provenance'].includes(message.metadata.messageType);
    
    // Check if this message has canonical data for executive rendering (only if NOT a structured message)
    const hasCanonicalData = !isStructuredMessage && (message.metadata as any)?.canonicalData;
    
    // Debug logging (only once per message using ref)
    // Removed to reduce console spam during progressive streaming
    
    // PRIORITY 1: Reflection messages (Layer 2 - Real-time thinking)
    if (isReflectionMessage) {
      return (
        <div key={message.id} className="mb-4">
          <Card className="reflection-card border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">🔍</div>
                <div className="flex-1">
                  <p className="text-sm italic text-gray-700 leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Timestamp */}
          <div className="text-xs text-gray-500 mt-2 text-left">
            <Clock className="h-3 w-3 inline mr-1" />
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      );
    }
    
    // PRIORITY 2: Structured messages (new Windsurf-style cards)
    if (isStructuredMessage) {
      return (
        <div key={message.id} className="mb-4">
          <StructuredMessageRenderer
            message={message as any}
          />
          
          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-2 ${
            message.type === 'user' ? 'text-right' : 'text-left'
          }`}>
            <Clock className="h-3 w-3 inline mr-1" />
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      );
    }
    
    // PRIORITY 2: Canonical data messages (ExecutiveRenderer)
    if (hasCanonicalData) {
      return (
        <div key={message.id} className="mb-4">
          <ExecutiveRenderer 
            data={(message.metadata as any).canonicalData}
            todayISO={new Date().toISOString().split('T')[0]}
          />
          
          {/* Timestamp */}
          <div className="text-xs text-gray-500 mt-2 text-left">
            <Clock className="h-3 w-3 inline mr-1" />
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      );
    }
    
    // PRIORITY 3: Check if message has turnEnvelope (show reasoning process like Cursor/Windsurf)
    const hasTurnEnvelope = message.metadata?.turnEnvelope && message.type === 'assistant';
    
    if (hasTurnEnvelope) {
      const turnEnvelope = message.metadata.turnEnvelope;
          const functionCalls = Array.isArray(message.metadata?.function_calls) ? message.metadata.function_calls : [];
          const formatArgs = (args: any) => {
            try {
              return typeof args === 'string' ? args : JSON.stringify(args);
            } catch {
              return String(args);
            }
          };
          const formatResult = (result: any) => {
            try {
              const str = typeof result === 'string' ? result : JSON.stringify(result);
              return str.length > 300 ? str.slice(0, 300) + '…' : str;
            } catch {
              return '';
            }
          };
      return (
        <div key={message.id} className="mb-6 space-y-3">
          {/* Reasoning Process - Cursor/Windsurf Style */}
          {turnEnvelope.ack && (
            <div className="text-xs text-gray-500 italic mb-2">
              💭 {turnEnvelope.ack}
            </div>
          )}
          
          {/* Detailed Reasoning Process */}
          {(message.metadata?.intent || 
            message.metadata?.intentClassification ||
            turnEnvelope?.plan?.declarative?.length > 0 || 
            turnEnvelope?.plan?.procedural?.length > 0 ||
            message.metadata?.agentResults?.summary ||
            turnEnvelope?.meta ||
            turnEnvelope?.plan?.steps?.length > 0) && (
            <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 border-l-4 border-indigo-500 rounded-lg p-4 mb-3 space-y-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Brain className="h-4 w-4 text-indigo-600" />
                Detailed Reasoning Process
              </div>
              
              {/* Intent Classification - Check multiple possible locations */}
              {(message.metadata?.intent || message.metadata?.intentClassification) && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700">1. Intent Classification</div>
                  <div className="text-xs text-gray-600 pl-4">
                    {(() => {
                      const intent = message.metadata?.intentClassification || 
                                    (message.metadata?.intent ? { intent: message.metadata.intent } : null);
                      if (!intent) return null;
                      return (
                        <>
                          <span className="font-medium">Type:</span> {intent.intent || intent.type || 'N/A'}
                          {intent.confidence && (
                            <span className="ml-3">
                              <span className="font-medium">Confidence:</span> {(intent.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                          {intent.explanation && (
                            <div className="mt-1 text-gray-500 italic">{intent.explanation}</div>
                          )}
                          {intent.keywords?.length > 0 && (
                            <div className="mt-1">
                              <span className="font-medium">Keywords:</span> {intent.keywords.join(', ')}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Template Discovery (Declarative Plan) - Check both turnEnvelope and metadata */}
              {(turnEnvelope?.plan?.declarative?.length > 0 || message.metadata?.templates?.length > 0) && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700">2. Template Discovery & Selection</div>
                  <div className="text-xs text-gray-600 pl-4 space-y-2">
                    {(turnEnvelope?.plan?.declarative || message.metadata?.templates || []).map((template: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-blue-300 pl-2">
                        <div className="font-medium">{template.templateName || template.name || `Template ${idx + 1}`}</div>
                        <div className="text-gray-500 mt-0.5">
                          {template.relevance && (
                            <span>Relevance: <span className="font-semibold">{(template.relevance * 100).toFixed(0)}%</span></span>
                          )}
                          {template.domain && (
                            <span className="ml-2">Domain: {template.domain}</span>
                          )}
                        </div>
                        {template.relevanceBreakdown && (
                          <div className="text-gray-500 mt-1 text-xs">
                            Breakdown: {JSON.stringify(template.relevanceBreakdown)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Execution Steps (Procedural Plan) */}
              {turnEnvelope?.plan?.procedural?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700">3. Agent Execution Plan</div>
                  <div className="text-xs text-gray-600 pl-4 space-y-1.5">
                    {turnEnvelope.plan.procedural.map((task: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 border-l-2 border-green-300 pl-2">
                        <span className="text-gray-400 mt-0.5">{idx + 1}.</span>
                        <div className="flex-1">
                          <div className="font-medium">{task.title || task.service || `Task ${idx + 1}`}</div>
                          <div className="text-gray-500 mt-0.5">
                            {task.service && <span>Service: {task.service}</span>}
                            {task.capability && <span className="ml-2">Capability: {task.capability}</span>}
                            {task.deps?.length > 0 && (
                              <span className="ml-2">Dependencies: {task.deps.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Results Summary */}
              {message.metadata?.agentResults?.summary && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700">4. Agent Execution Results</div>
                  <div className="text-xs text-gray-600 pl-4">
                    {message.metadata.agentResults.summary.agentsInvolved && (
                      <div>
                        <span className="font-medium">Agents Involved:</span> {message.metadata.agentResults.summary.agentsInvolved}
                      </div>
                    )}
                    {message.metadata.agentResults.summary.successCount !== undefined && (
                      <div>
                        <span className="font-medium">Success Count:</span> {message.metadata.agentResults.summary.successCount}
                      </div>
                    )}
                    {message.metadata.agentResults.summary.processingTime && (
                      <div>
                        <span className="font-medium">Processing Time:</span> {message.metadata.agentResults.summary.processingTime}ms
                      </div>
                    )}
                    {message.metadata.agentResults.metrics && (
                      <div className="mt-1">
                        <span className="font-medium">Total Time:</span> {message.metadata.agentResults.metrics.totalTime}ms
                        {message.metadata.agentResults.metrics.successRate && (
                          <span className="ml-2">
                            <span className="font-medium">Success Rate:</span> {(message.metadata.agentResults.metrics.successRate * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Individual Agent Results */}
              {message.metadata?.agentResults?.results?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700">5. Individual Agent Outputs</div>
                  <div className="text-xs text-gray-600 pl-4 space-y-2">
                    {message.metadata.agentResults.results.map((result: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-purple-300 pl-2">
                        <div className="font-medium">
                          {result.agentName || result.agentId || result.agent || `Agent ${idx + 1}`}
                          {result.success !== false && (
                            <span className="ml-2 text-green-600">✓</span>
                          )}
                          {result.success === false && (
                            <span className="ml-2 text-red-600">✗</span>
                          )}
                        </div>
                        {result.executionTime && (
                          <div className="text-gray-500 mt-0.5">Execution Time: {result.executionTime}ms</div>
                        )}
                        {result.result?.output && (
                          <div className="text-gray-600 mt-1 bg-white/50 p-2 rounded text-xs max-h-32 overflow-y-auto">
                            {typeof result.result.output === 'string' 
                              ? result.result.output.slice(0, 300) + (result.result.output.length > 300 ? '...' : '')
                              : JSON.stringify(result.result.output).slice(0, 300)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Metadata */}
              {turnEnvelope?.meta && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700">6. Processing Metadata</div>
                  <div className="text-xs text-gray-600 pl-4">
                    {turnEnvelope.meta.processingMode && (
                      <div>
                        <span className="font-medium">Mode:</span> {turnEnvelope.meta.processingMode}
                      </div>
                    )}
                    {turnEnvelope.meta.provenance && (
                      <div>
                        <span className="font-medium">Provenance:</span> {turnEnvelope.meta.provenance}
                      </div>
                    )}
                    {turnEnvelope.meta.concepts?.length > 0 && (
                      <div>
                        <span className="font-medium">Concepts:</span> {turnEnvelope.meta.concepts.join(', ')}
                      </div>
                    )}
                    {turnEnvelope.meta.templatesUsed?.length > 0 && (
                      <div>
                        <span className="font-medium">Templates Used:</span> {turnEnvelope.meta.templatesUsed.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback: Simple steps if available (show even if other data exists) */}
              {turnEnvelope?.plan?.steps?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700">
                    {turnEnvelope?.plan?.declarative?.length > 0 || turnEnvelope?.plan?.procedural?.length > 0 
                      ? '7. Reasoning Steps' 
                      : 'Reasoning Steps'}
                  </div>
                  <ul className="text-xs text-gray-600 pl-4 space-y-1">
                {turnEnvelope.plan.steps.map((step: string, idx: number) => {
                  const sanitizedStep = sanitizeText(step);
                  return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{sanitizedStep}</span>
                  </li>
                  );
                })}
              </ul>
                </div>
              )}
              
            </div>
          )}
              
              {/* Executed Tool Functions - Render from backend function_calls */}
              {functionCalls.length > 0 && (
                <div className="bg-indigo-50 border-l-2 border-indigo-300 rounded p-3 mb-3">
                  <div className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Executed Tool Functions</div>
                  <ul className="space-y-2 text-xs text-indigo-900">
                    {functionCalls.map((fc: any, idx: number) => (
                      <li key={fc.id || idx} className="flex flex-col">
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span className="font-medium">{fc.name || 'function'}</span>
                        </div>
                        {fc.arguments && (
                          <div className="ml-4 text-[11px] text-indigo-700 break-words">
                            args: <span className="font-mono">{formatArgs(fc.arguments)}</span>
                          </div>
                        )}
                        {fc.result && (
                          <div className="ml-4 text-[11px] text-indigo-700 break-words">
                            result: <span className="font-mono">{formatResult(fc.result)}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          
          {/* Memory Context */}
          {turnEnvelope.memory && (
            <div className="text-xs text-gray-500 mb-2">
              📚 Memory: {turnEnvelope.memory.conversationHistory || 0} conversation turns
            </div>
          )}
          
          {/* Main Response */}
          <div className="mt-3">
            <ConversationalMessageRenderer
              content={message.content}
              isUser={false}
              workflowMetadata={'workflowMetadata' in message ? message.workflowMetadata : undefined}
            />
          </div>
          
          {/* Meta Information - Subtle footer */}
          {turnEnvelope.meta && (
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
              {turnEnvelope.meta.mode && (
                <span>Mode: {turnEnvelope.meta.mode}</span>
              )}
              {turnEnvelope.meta.service && (
                <span>• Service: {turnEnvelope.meta.service}</span>
              )}
              {turnEnvelope.meta.agent && (
                <span>• Agent: {turnEnvelope.meta.agent}</span>
              )}
              {message.metadata?.processingTime && (
                <span>• {message.metadata.processingTime}ms</span>
              )}
            </div>
          )}
          
          {/* Timestamp */}
          <div className="text-xs text-gray-500 text-left">
            <Clock className="h-3 w-3 inline mr-1" />
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      );
    }
    
    // PRIORITY 3: Default conversational renderer (Cursor/Windsurf style - clean and simple)
    return (
      <div key={message.id} className="mb-4">
        <ConversationalMessageRenderer
          content={message.content}
          isUser={message.type === 'user'}
          workflowMetadata={'workflowMetadata' in message ? message.workflowMetadata : undefined}
        />
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-2 ${
          message.type === 'user' ? 'text-right' : 'text-left'
        }`}>
          <Clock className="h-3 w-3 inline mr-1" />
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main conversation card - expands to fill available space */}
      <Card className="flex-1 flex flex-col shadow-lg overflow-hidden min-h-screen">
        {/* Header */}
        <CardHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">

            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-2">
              {workflowStatus.isActive && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getPhaseIcon(workflowStatus.phase)}
                  <span className="text-xs">{workflowStatus.phase}</span>
                </Badge>
              )}
              
              {isProcessing && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Processing</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Messages area - dynamically expands based on content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4 max-w-4xl mx-auto min-h-full">{messages.map((message, index) => renderMessage(message, index))}
            
            {/* Loading and Streaming indicators - Removed "Reflecting on your statement..." as we now show animated dots in loading message */}
            
            {/* Progressive streaming indicator */}
            {isStreaming && streamingPhase && (
              <div className="flex justify-start mb-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-purple-700 font-medium">{streamingPhase}</span>
                </div>
              </div>
            )}
            
            {/* Error display */}
            {error && (
              <div className="flex justify-start mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Meta-cognitive thoughts display */}
            <MetaThoughtDisplay className="mb-4" />
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4 shrink-0">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              workflowStatus.canContinue 
                ? "Type 'continue' to proceed or ask a follow-up question..."
                : "Ask me anything about your business..."
            }
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isProcessing}
            size="sm"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Bottom toolbar - Model selector and Excel upload (Windsurf style) */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <Brain className="h-3 w-3 mr-1.5" />
                  {selectedModel}
                  <ChevronDown className="h-3 w-3 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSelectedModel("Marketing")}>
                  <div className="flex flex-col">
                    <span className="font-medium">Marketing</span>
                    <span className="text-xs text-gray-500">Campaigns, ROI, customer insights</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("Sales")}>
                  <div className="flex flex-col">
                    <span className="font-medium">Sales</span>
                    <span className="text-xs text-gray-500">Pipeline, forecasting, conversions</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("Retail Media")}>
                  <div className="flex flex-col">
                    <span className="font-medium">Retail Media</span>
                    <span className="text-xs text-gray-500">RMN campaigns, attribution, ROAS</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("Supply Chain")}>
                  <div className="flex flex-col">
                    <span className="font-medium">Supply Chain</span>
                    <span className="text-xs text-gray-500">Inventory, logistics, demand planning</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("Finance")}>
                  <div className="flex flex-col">
                    <span className="font-medium">Finance</span>
                    <span className="text-xs text-gray-500">P&L, budgeting, cost optimization</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel("Operations")}>
                  <div className="flex flex-col">
                    <span className="font-medium">Operations</span>
                    <span className="text-xs text-gray-500">Process optimization, efficiency</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Excel Upload */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx,.xls,.csv';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    setUploadedFile(file);
                    toast({
                      title: "File uploaded",
                      description: `${file.name} is ready for analysis`,
                    });
                  }
                };
                input.click();
              }}
            >
              <Upload className="h-3 w-3 mr-1.5" />
              {uploadedFile ? uploadedFile.name : "Upload Excel"}
            </Button>
          </div>

          {/* Quick actions for workflow */}
          {workflowStatus.isActive && (
            <div className="flex gap-2">
              {workflowStatus.canContinue && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleContinueWorkflow}
                  disabled={isProcessing}
                  className="h-8 text-xs"
                >
                  Continue Workflow
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setInputValue('What insights do you have so far?')}
                disabled={isProcessing}
                className="h-8 text-xs"
              >
                Show Insights
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setInputValue('What are my next steps?')}
                disabled={isProcessing}
                className="h-8 text-xs"
              >
                Next Steps
              </Button>
            </div>
          )}
        </div>
      </div>
      </Card>
      
      {/* Action Assignment Modal */}
      <ActionAssignmentModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        action={selectedAction}
        onApprove={handleActionApprove}
        onModify={handleActionModify}
        onCancel={handleActionCancel}
      />
    </div>
  );
};
