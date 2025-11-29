import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNarrativeWorkflow } from '@/hooks/useNarrativeWorkflow';
import { useToast } from '@/components/ui/use-toast';
import { useSessionService } from '@/hooks/useSessionService';
import { useActivityTracker } from '@/lib/memory/activity-tracker';

// ------------------------------
// Todo Template Types (frontend mirror of backend)
// ------------------------------
type TodoStatus = 'pending'|'in_progress'|'completed';
type TodoPriority = 'low'|'medium'|'high';
export interface TodoTaskFE {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string | null;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}
export interface TodoListTemplateFE {
  conversationId: string;
  tasks: TodoTaskFE[];
  config?: {
    sortBy?: 'order'|'priority'|'dueDate'|'createdAt'|'updatedAt';
    filter?: { status?: TodoStatus[]; tags?: string[] };
  };
  updatedAt: string;
}
export type TodoOpFE =
  | { type: 'add'; task: Partial<Omit<TodoTaskFE, 'createdAt'|'updatedAt'>> }
  | { type: 'update'; id: string; patch: Partial<Omit<TodoTaskFE, 'id'|'createdAt'|'updatedAt'>> }
  | { type: 'toggle'; id: string; completed?: boolean }
  | { type: 'delete'; id: string }
  | { type: 'reorder'; order: string[] }
  | { type: 'clear_completed' };

// Enhanced message interface with governance and agent execution metadata
export interface EnhancedUnifiedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent' | 'template' | 'workflow';
  content: string;
  timestamp: Date;
  metadata?: {
    workflowStep?: string;
    phase?: string;
    confidence?: number;
    intentType?: string;
    journeyStage?: string;
    sourceType?: string;
    sourceId?: string;
    insights?: string[];
    recommendations?: string[];
    suggestedAction?: any;
    // If present, this message is requesting approval for a deterministic todo op
    todoOp?: TodoOpFE;
  };
  governance?: {
    requiresApproval: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    approvalStatus?: 'pending' | 'approved' | 'denied';
    approver?: string;
    auditTrail: GovernanceEvent[];
  };
  agentExecution?: {
    agentId: string;
    executionId: string;
    status: 'running' | 'completed' | 'failed';
    confidence: number;
    tokenUsage: number;
    duration: number;
  };
  businessContext?: {
    intent: string;
    domain: string;
    stakeholders: string[];
    urgency: 'low' | 'medium' | 'high';
    kpiImpact: string[];
  };
}

export interface GovernanceEvent {
  id: string;
  event: 'created' | 'evaluated' | 'approved' | 'denied' | 'executed';
  timestamp: Date;
  userId: string;
  details: Record<string, any>;
}

export interface AgentStatus {
  [agentId: string]: 'idle' | 'running' | 'completed' | 'failed';
}

interface EnhancedUnifiedConversationContextType {
  messages: EnhancedUnifiedMessage[];
  isProcessing: boolean;
  error: string | null;
  agentStatus: AgentStatus;
  pendingApprovals: EnhancedUnifiedMessage[];
  sendMessage: (content: string, userContext?: any) => Promise<void>;
  approveAction: (messageId: string, approver: string) => Promise<void>;
  denyAction: (messageId: string, approver: string, reason: string) => Promise<void>;
  clearMessages: () => void;
  retryMessage: (messageId: string) => Promise<void>;
  updateAgentStatus: (agentId: string, status: AgentStatus[string]) => void;
  // Deterministic Todo Template state and operations
  todoTemplate: TodoListTemplateFE | null;
  refreshTodoTemplate: () => Promise<void>;
  applyTodoOp: (op: TodoOpFE) => Promise<void>;
  // Create a governance message that must be approved before executing the todo op
  requestTodoOpApproval: (op: TodoOpFE, summary: string, risk?: 'low'|'medium'|'high') => void;
}

const EnhancedUnifiedConversationContext = createContext<EnhancedUnifiedConversationContextType | undefined>(undefined);

interface EnhancedUnifiedConversationProviderProps {
  children: ReactNode;
  apiEndpoint?: string;
}

export function EnhancedUnifiedConversationProvider({ 
  children, 
  apiEndpoint = '/api/process-message' 
}: EnhancedUnifiedConversationProviderProps) {
  const [messages, setMessages] = useState<EnhancedUnifiedMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({});
  const [todoTemplate, setTodoTemplate] = useState<TodoListTemplateFE | null>(null);
  
  const { toast } = useToast();
  const { session, updateSessionContext } = useSessionService();

  // Computed pending approvals
  const pendingApprovals = messages.filter(m => 
    m.governance?.requiresApproval && m.governance?.approvalStatus === 'pending'
  );

  // Save conversation history to session
  useEffect(() => {
    if (session && messages.length > 0) {
      updateSessionContext({
        conversationHistory: messages
      });
    }
  }, [messages, session, updateSessionContext]);

  // Restore conversation history from session
  useEffect(() => {
    if (session?.context.conversationHistory) {
      setMessages(session.context.conversationHistory.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  }, [session]);

  // ------------------------------
  // Todo Template Types are declared at the top of this file.
  // ------------------------------

  // ------------------------------
  // Todo Template API helpers
  // ------------------------------
  const refreshTodoTemplate = useCallback(async () => {
    if (!session?.id) return;
    try {
      const currentUser = {
        id: session?.userId || 'anonymous',
        role: session?.role || 'operator'
      };
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({
          mode: 'todo_template_get',
          message: '',
          conversationId: session.id,
          context: { sessionId: session.id, tenantId: session.tenantId }
        })
      });
      if (!res.ok) throw new Error(`Failed to load todo template: HTTP ${res.status}`);
      const data = await res.json();
      if (data?.todoTemplate) setTodoTemplate(data.todoTemplate as TodoListTemplateFE);
    } catch (e) {
      console.error('refreshTodoTemplate error', e);
    }
  }, [apiEndpoint, session]);

  // Create an approval-required message to gate destructive todo ops
  const requestTodoOpApproval = useCallback((op: TodoOpFE, summary: string, risk: 'low'|'medium'|'high' = 'medium') => {
    const approvalMsg: EnhancedUnifiedMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: summary,
      timestamp: new Date(),
      metadata: {
        sourceType: 'governance_request',
        insights: [summary],
        todoOp: op,
      },
      governance: {
        requiresApproval: true,
        riskLevel: risk,
        approvalStatus: 'pending',
        auditTrail: [
          {
            id: uuidv4(),
            event: 'created',
            timestamp: new Date(),
            userId: session?.userId || 'system',
            details: { reason: 'Destructive todo operation requires approval', opType: (op as any).type },
          },
        ],
      },
    };
    setMessages(prev => [...prev, approvalMsg]);
    toast({
      title: 'Approval Required',
      description: summary,
    });
  }, [session, toast]);

  const applyTodoOp = useCallback(async (op: TodoOpFE) => {
    if (!session?.id) return;
    try {
      const currentUser = {
        id: session?.userId || 'anonymous',
        role: session?.role || 'operator'
      };
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({
          mode: 'todo_template_op',
          payload: { op },
          message: '',
          conversationId: session.id,
          context: { sessionId: session.id, tenantId: session.tenantId }
        })
      });
      if (!res.ok) throw new Error(`Failed to apply todo op: HTTP ${res.status}`);
      const data = await res.json();
      if (data?.todoTemplate) setTodoTemplate(data.todoTemplate as TodoListTemplateFE);
    } catch (e) {
      console.error('applyTodoOp error', e);
    }
  }, [apiEndpoint, session]);

  // Load template whenever session/conversation changes
  useEffect(() => {
    if (session?.id) {
      refreshTodoTemplate();
    }
  }, [session?.id, refreshTodoTemplate]);

  const updateAgentStatus = useCallback((agentId: string, status: AgentStatus[string]) => {
    setAgentStatus(prev => ({
      ...prev,
      [agentId]: status
    }));
  }, []);

  const sendMessage = useCallback(async (content: string, userContext?: any) => {
    const messageId = uuidv4();
    const userMessage: EnhancedUnifiedMessage = {
      id: messageId,
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        sourceType: 'user_input'
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setError(null);

    try {
      // Get current user context from session
      const currentUser = {
        id: session?.userId || 'anonymous',
        role: session?.role || 'operator'
      };

      // Build structured context and policy flags for backend ConversationController
      const recentHistory = messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
        metadata: m.metadata
      }));

      const structuredContext = {
        ...(userContext || {}),
        sessionId: session?.id,
        tenantId: session?.tenantId,
        // Centralized controller-compatible flags
        agentType: userContext?.agentType,
        policy: userContext?.policy ?? { enforceJsonSchema: true },
        recentHistory,
        memoryContext: userContext?.memoryContext,
        crossFunctionalContext: userContext?.crossFunctionalContext,
        templateCapabilitiesCard: userContext?.templateCapabilitiesCard,
        // Optional model controls
        model: userContext?.model,
        temperature: userContext?.temperature,
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          ...userContext?.headers
        },
        body: JSON.stringify({
          message: content,
          conversationId: session?.id || uuidv4(),
          context: structuredContext
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      // If backend returned a todo template (e.g., via NL intent routing later), sync it
      if (result?.todoTemplate) {
        setTodoTemplate(result.todoTemplate as TodoListTemplateFE);
      }
      
      // Create assistant response with enhanced metadata
      const assistantMessage: EnhancedUnifiedMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: result.message || 'Response received',
        timestamp: new Date(),
        metadata: {
          sourceType: 'agent_orchestration',
          confidence: result.confidence,
          insights: result.insights,
          recommendations: result.recommendations,
          workflowStep: result.workflowStep,
          phase: result.phase
        },
        governance: result.governance ? {
          requiresApproval: result.governance.requiresApproval || false,
          riskLevel: result.governance.riskLevel || 'low',
          approvalStatus: result.governance.approvalStatus || 'approved',
          auditTrail: result.governance.auditTrail || []
        } : undefined,
        agentExecution: result.agentExecution ? {
          agentId: result.agentExecution.agentId,
          executionId: result.agentExecution.executionId || uuidv4(),
          status: result.agentExecution.status || 'completed',
          confidence: result.agentExecution.confidence || 0,
          tokenUsage: result.agentExecution.tokenUsage || 0,
          duration: result.agentExecution.duration || 0
        } : undefined,
        businessContext: result.businessContext ? {
          intent: result.businessContext.intent,
          domain: result.businessContext.domain,
          stakeholders: result.businessContext.stakeholders || [],
          urgency: result.businessContext.urgency || 'medium',
          kpiImpact: result.businessContext.kpiImpact || []
        } : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show toast for high-risk actions requiring approval
      if (assistantMessage.governance?.requiresApproval) {
        toast({
          title: "Approval Required",
          description: `High-risk action detected (${assistantMessage.governance.riskLevel} risk). Please review and approve.`,
          variant: "default"
        });
      }

      // Update agent status if provided
      if (result.agentStatus) {
        setAgentStatus(prev => ({ ...prev, ...result.agentStatus }));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      const errorResponse: EnhancedUnifiedMessage = {
        id: uuidv4(),
        role: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        metadata: {
          sourceType: 'error',
          error: errorMessage
        }
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "Message Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [apiEndpoint, session, messages, toast, updateSessionContext]);

  const approveAction = useCallback(async (messageId: string, approver: string) => {
    try {
      const response = await fetch('/api/governance/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          approver,
          action: 'approve'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve action');
      }

      // Update message approval status
      let approvedOp: TodoOpFE | undefined;
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.governance) {
          // capture op for execution after state update
          approvedOp = msg.metadata?.todoOp as TodoOpFE | undefined;
          return {
            ...msg,
            governance: {
              ...msg.governance,
              approvalStatus: 'approved',
              approver,
              auditTrail: [
                ...msg.governance.auditTrail,
                {
                  id: uuidv4(),
                  event: 'approved',
                  timestamp: new Date(),
                  userId: approver,
                  details: { action: 'manual_approval' }
                }
              ]
            }
          } as EnhancedUnifiedMessage;
        }
        return msg;
      }));

      toast({
        title: "Action Approved",
        description: "The action has been approved and will be executed.",
        variant: "default"
      });

      // Execute deterministic todo op after approval
      if (approvedOp) {
        await applyTodoOp(approvedOp);
      }

    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve the action. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const denyAction = useCallback(async (messageId: string, approver: string, reason: string) => {
    try {
      const response = await fetch('/api/governance/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          approver,
          action: 'deny',
          reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to deny action');
      }

      // Update message approval status
      setMessages(prev => prev.map(msg => 
        msg.id === messageId && msg.governance
          ? {
              ...msg,
              governance: {
                ...msg.governance,
                approvalStatus: 'denied',
                approver,
                auditTrail: [
                  ...msg.governance.auditTrail,
                  {
                    id: uuidv4(),
                    event: 'denied',
                    timestamp: new Date(),
                    userId: approver,
                    details: { action: 'manual_denial', reason }
                  }
                ]
              }
            }
          : msg
      ));

      toast({
        title: "Action Denied",
        description: `The action has been denied: ${reason}`,
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Denial Failed",
        description: "Failed to deny the action. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setAgentStatus({});
    
    // Clear from session context
    updateSessionContext({
      conversationHistory: []
    });
  }, [updateSessionContext]);

  const retryMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.role === 'user') {
      // Remove the failed message and retry
      setMessages(prev => prev.filter(m => m.id !== messageId));
      await sendMessage(message.content);
    }
  }, [messages, sendMessage]);

  const contextValue: EnhancedUnifiedConversationContextType = {
    messages,
    isProcessing,
    error,
    agentStatus,
    pendingApprovals,
    sendMessage,
    approveAction,
    denyAction,
    clearMessages,
    retryMessage,
    updateAgentStatus,
    // Todo state and ops
    todoTemplate,
    refreshTodoTemplate,
    applyTodoOp,
    requestTodoOpApproval,
  };

  return (
    <EnhancedUnifiedConversationContext.Provider value={contextValue}>
      {children}
    </EnhancedUnifiedConversationContext.Provider>
  );
}

export function useEnhancedUnifiedConversation() {
  const context = useContext(EnhancedUnifiedConversationContext);
  if (context === undefined) {
    throw new Error('useEnhancedUnifiedConversation must be used within an EnhancedUnifiedConversationProvider');
  }
  return context;
}
