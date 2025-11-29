/**
 * React Hook for Conversation WebSocket
 * 
 * Connects to WebSocket server and provides real-time updates for:
 * - Agent spawning and progress
 * - Task state changes
 * - Decision updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AgentActivity } from '../components/AgentActivityFeed';
import { Task } from '../components/TaskProgress';
import { ApprovalRequest } from '../components/InlineApprovalGate';
import { ReadActivity } from '../components/ReadActivityFeed';
import { ThoughtActivity } from '../components/ThoughtActivityFeed';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
  [key: string]: any;
}

interface UseConversationWebSocketResult {
  isConnected: boolean;
  activities: AgentActivity[];
  tasks: Task[];
  approvalRequests: ApprovalRequest[];
  readActivities: ReadActivity[];
  thoughtActivities: ThoughtActivity[];
  connectionError: string | null;
  sendMessage: (message: any) => void;
}

export function useConversationWebSocket(
  conversationId: string,
  enabled: boolean = true
): UseConversationWebSocketResult {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [readActivities, setReadActivities] = useState<ReadActivity[]>([]);
  const [thoughtActivities, setThoughtActivities] = useState<ThoughtActivity[]>([]);

  const sendMessage = useCallback((message: any) => {
    // DISABLED: WebSocket sending removed for frontend-only build
    console.log('[useConversationWebSocket] sendMessage disabled - frontend-only mode', message);
  }, []);

  useEffect(() => {
    // DISABLED: WebSocket connections removed for frontend-only build
    console.log('[useConversationWebSocket] WebSocket disabled - frontend-only mode');
    setIsConnected(false);
    setConnectionError('WebSocket connections disabled');
    return;
  }, [conversationId, enabled]);

  const handleMessage = (message: WebSocketMessage) => {
    console.log('[useConversationWebSocket] Message:', message.type);

    switch (message.type) {
      case 'connection_established':
        // Initial connection
        break;

      case 'agents_spawned':
        // Add activity for spawned agents
        message.agents?.forEach((agent: any) => {
          addActivity({
            id: `spawn_${agent.id}_${Date.now()}`,
            agentId: agent.id,
            agentName: agent.name,
            type: 'spawned',
            message: 'was spawned',
            timestamp: message.timestamp
          });
        });
        break;

      case 'agent_execution_started':
        addActivity({
          id: `start_${message.agentId}_${Date.now()}`,
          agentId: message.agentId,
          agentName: message.agentName,
          type: 'started',
          message: 'started execution',
          timestamp: message.timestamp
        });
        break;

      case 'agent_progress':
        addActivity({
          id: `progress_${message.agentId}_${Date.now()}`,
          agentId: message.agentId,
          agentName: message.data?.agentName || 'Agent',
          type: 'progress',
          message: message.data?.message || 'is working',
          timestamp: message.timestamp,
          metadata: {
            confidence: message.data?.confidence
          }
        });
        break;

      case 'agent_completed':
        addActivity({
          id: `complete_${message.agentId}_${Date.now()}`,
          agentId: message.agentId,
          agentName: message.agentName,
          type: 'completed',
          message: 'completed successfully',
          timestamp: message.timestamp,
          metadata: {
            confidence: message.confidence,
            result: message.result
          }
        });
        break;

      case 'agent_failed':
        addActivity({
          id: `failed_${message.agentId}_${Date.now()}`,
          agentId: message.agentId,
          agentName: message.agentName,
          type: 'failed',
          message: `failed: ${message.error}`,
          timestamp: message.timestamp,
          metadata: {
            error: message.error
          }
        });
        break;

      case 'task.created':
      case 'task.started':
      case 'task.completed':
        updateTask(message.data);
        break;

      case 'approval_required':
        addApprovalRequest(message.data);
        break;

      case 'read.activity':
        addReadActivity(message.data);
        break;

      case 'thought.activity':
        addThoughtActivity(message.data);
        break;

      default:
        console.log('[useConversationWebSocket] Unhandled message type:', message.type);
    }
  };

  const addActivity = (activity: AgentActivity) => {
    setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50
  };

  const updateTask = (taskData: any) => {
    setTasks(prev => {
      const existing = prev.find(t => t.id === taskData.id);
      if (existing) {
        // Update existing task
        return prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t);
      } else {
        // Add new task
        return [...prev, taskData];
      }
    });
  };

  const addApprovalRequest = (request: ApprovalRequest) => {
    setApprovalRequests(prev => [...prev, request]);
  };

  const addReadActivity = (activity: ReadActivity) => {
    setReadActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50
  };

  const addThoughtActivity = (activity: ThoughtActivity) => {
    setThoughtActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50
  };

  return {
    isConnected,
    activities,
    tasks,
    approvalRequests,
    readActivities,
    thoughtActivities,
    connectionError,
    sendMessage
  };
}
