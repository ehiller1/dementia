/**
 * Enhanced Conversation Page
 * 
 * Integrates all real-time features:
 * - WebSocket for live updates
 * - Task progress visualization
 * - Agent activity feed
 * - Inline approval gates
 */

import React, { useState } from 'react';
import { useConversationWebSocket } from '../hooks/useConversationWebSocket';
import { TaskProgress } from '../components/TaskProgress';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import { InlineApprovalGate } from '../components/InlineApprovalGate';
import { AgentCapabilityRecommendationsCompact } from '../components/AgentCapabilityRecommendations';
import { ReadActivityFeed } from '../components/ReadActivityFeed';
import { ThoughtActivityFeed } from '../components/ThoughtActivityFeed';
import { useAgentRecommendations } from '../hooks/useAgentRecommendations';
import { MessageSquare, Activity, CheckSquare, AlertCircle, BookOpen, Brain } from 'lucide-react';

export function EnhancedConversation() {
  const conversationId = 'main'; // Or from route params
  const [activeTab, setActiveTab] = useState<'tasks' | 'activity' | 'agents' | 'read' | 'thought'>('tasks');

  const {
    isConnected,
    activities,
    tasks,
    approvalRequests,
    readActivities,
    thoughtActivities,
    connectionError,
    sendMessage
  } = useConversationWebSocket(conversationId, true);

  // Agent recommendations
  const { recommendations: agentRecommendations } = useAgentRecommendations({
    conversationId,
    currentTask: tasks.find(t => t.status === 'in_progress')?.title,
    keywords: [] // Could extract from messages
  });

  // Separate declarative and procedural tasks
  const declarativeTasks = tasks.filter(t => t.type === 'declarative');
  const proceduralTasks = tasks.filter(t => t.type === 'procedural');

  const handleApproveRequest = async (requestId: string, metadata?: any) => {
    console.log('[EnhancedConversation] Approving request:', requestId);
    
    // Send approval to backend via WebSocket
    sendMessage({
      type: 'approve_request',
      requestId,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Remove from pending approvals
    // (Backend will handle actual approval logic)
  };

  const handleRejectRequest = async (requestId: string, reason?: string) => {
    console.log('[EnhancedConversation] Rejecting request:', requestId);
    
    sendMessage({
      type: 'reject_request',
      requestId,
      reason,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Business Intelligence Assistant
              </h1>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {connectionError && (
            <div className="mt-2 text-sm text-red-600">
              {connectionError}
            </div>
          )}
        </div>

        {/* Conversation Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Approval Requests (shown inline) */}
          {approvalRequests.map(request => (
            <InlineApprovalGate
              key={request.id}
              request={request}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
            />
          ))}
          
          {/* Placeholder for conversation messages */}
          <div className="text-center text-gray-500 py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start a conversation to see messages here</p>
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask about your business data..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Task Progress & Activity Feed */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'tasks'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'activity'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'agents'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Agents ({agentRecommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('read')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${
                activeTab === 'read'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              Read
            </button>
            <button
              onClick={() => setActiveTab('thought')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${
                activeTab === 'thought'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Brain className="w-3 h-3" />
              Thought
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'tasks' && (
            <TaskProgress
              declarativeTasks={tasks.filter(t => t.type === 'declarative')}
              proceduralTasks={tasks.filter(t => t.type === 'procedural')}
              activeTaskId={tasks.find(t => t.status === 'in_progress')?.id}
            />
          )}
          {activeTab === 'activity' && (
            <AgentActivityFeed activities={activities} />
          )}
          {activeTab === 'agents' && (
            <AgentCapabilityRecommendationsCompact
              recommendations={agentRecommendations}
              onRequestAgent={(agent) => {
                console.log('Requesting agent:', agent);
                sendMessage({
                  type: 'request_agent',
                  agentId: agent.id,
                  agentName: agent.name
                });
              }}
            />
          )}
          {activeTab === 'read' && (
            <ReadActivityFeed activities={readActivities} />
          )}
          {activeTab === 'thought' && (
            <ThoughtActivityFeed thoughts={thoughtActivities} />
          )}
        </div>
      </div>
    </div>
  );
}
