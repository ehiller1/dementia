import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '@/contexts/ConversationContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Avatar } from '@/components/ui/avatar';
// import { withSeasonalityBridge } from './SeasonalityAgentBridge.js'; // Removed - functionality integrated into EnhancedConversationContext
import { format } from 'date-fns';
import { MessageSquare, Bot, Info, Clock, AlertCircle, CheckCircle, ChevronRight, ChevronDown, BarChart2 } from 'lucide-react';
import { Agent } from '@/pages/Index';
import { ProgressSteps, ProgressStep } from '@/components/ui/progress-steps';

/**
 * Conversation Interface Component
 * 
 * This component provides a full-featured conversation UI that supports:
 * - Displaying user, system, and agent messages
 * - Rendering agent activities and execution status
 * - Allowing user input and message submission
 */
interface ConversationInterfaceProps {
  agents?: Agent[];
  selectedAgent?: Agent | null;
  onSelectAgent?: (agent: Agent | null) => void;
}

const ConversationInterfaceBase: React.FC<ConversationInterfaceProps> = ({
  agents = [],
  selectedAgent,
  onSelectAgent
}) => {
  const {
    messages,
    sendMessage,
    isProcessing,
    activeAgentExecutions,
    clearConversation,
    getProgressUpdates,
    refreshProgressUpdates
  } = useConversation();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set the seasonality agent in the conversation context if selectedAgent changes
  useEffect(() => {
    if (selectedAgent) {
      // You can update the conversation context here
      // For example, you might want to set a specific agent ID
      console.log('Selected agent in conversation interface:', selectedAgent.id);
    }
  }, [selectedAgent]);

  // Handle message submission
  const handleSendMessage = () => {
    if (inputMessage.trim() && !isProcessing) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle agent execution details
  const toggleAgentExpand = (id: string) => {
    setExpandedAgents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    
    // If expanding, refresh progress updates
    if (!expandedAgents[id]) {
      const execution = activeAgentExecutions.find(exec => exec.id === id);
      if (execution) {
        refreshProgressUpdates(id);
      }
    }
  };

  // Poll for progress updates for active executions
  useEffect(() => {
    if (activeAgentExecutions.length === 0) return;
    
    const pollInterval = setInterval(() => {
      activeAgentExecutions.forEach(execution => {
        if (expandedAgents[execution.id] && execution.status === 'in_progress') {
          refreshProgressUpdates(execution.id);
        }
      });
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, [activeAgentExecutions, expandedAgents]);

  // Render a user message
  const renderUserMessage = (message: any) => (
    <div className="flex justify-end mb-4">
      <div className="max-w-3/4">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {message.timestamp && format(new Date(message.timestamp), 'HH:mm')}
        </div>
      </div>
    </div>
  );

  // Render a system message
  const renderSystemMessage = (message: any) => (
    <div className="flex mb-4">
      <div className="max-w-3/4">
        <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg">
          <p className="text-sm">{message.content}</p>
          {message.metadata?.sources && (
            <div className="mt-2 border-t border-gray-300 dark:border-gray-700 pt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sources:</p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 pl-4 list-disc">
                {message.metadata.sources.map((source: any, idx: number) => (
                  <li key={idx}>{source.title || source.id}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <span className="flex items-center">
            <Info className="w-3 h-3 mr-1" />
            System
            {message.timestamp && ` • ${format(new Date(message.timestamp), 'HH:mm')}`}
          </span>
        </div>
      </div>
    </div>
  );

  // Render an agent message
  const renderAgentMessage = (message: any) => (
    <div className="flex mb-4">
      <div className="max-w-3/4">
        <div className="bg-emerald-100 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-lg">
          <div className="flex items-center mb-1">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
              Agent
            </Badge>
            {message.metadata?.agentId && (
              <span className="text-xs ml-2 text-gray-500">{message.metadata.agentId.substring(0, 8)}</span>
            )}
          </div>
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <span className="flex items-center">
            <Bot className="w-3 h-3 mr-1" />
            Agent
            {message.timestamp && ` • ${format(new Date(message.timestamp), 'HH:mm')}`}
          </span>
        </div>
      </div>
    </div>
  );

  // Render a seasonality agent message
  const renderSeasonalityMessage = (message: any) => (
    <div className="flex mb-4">
      <div className="max-w-3/4">
        <div className="bg-purple-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 px-4 py-2 rounded-lg">
          <div className="flex items-center mb-1">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700">
              Seasonality
            </Badge>
          </div>
          <p className="text-sm">{message.content}</p>
          {message.metadata?.analysis && (
            <div className="mt-2 border-t border-purple-200 dark:border-purple-800 pt-1">
              <div className="text-xs text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Analysis Results:</span> {message.metadata.analysis.summary}
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <span className="flex items-center">
            <Bot className="w-3 h-3 mr-1" />
            Seasonality Agent
            {message.timestamp && ` • ${format(new Date(message.timestamp), 'HH:mm')}`}
          </span>
        </div>
      </div>
    </div>
  );

  // Render agent execution status
  const renderAgentExecutions = () => {
    if (!activeAgentExecutions || activeAgentExecutions.length === 0) {
      return null;
    }

    return (
      <div className="my-4">
        {activeAgentExecutions.map((execution) => (
          <Card key={execution.id} className="mb-3 shadow-sm">
            <CardHeader className="p-3 pb-2">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleAgentExpand(execution.id)}
              >
                <div className="flex items-center">
                  <Bot className="h-4 w-4 mr-2" />
                  <span className="font-medium">{execution.agentName}</span>
                  <Badge variant={execution.status === 'completed' ? 'default' : execution.status === 'failed' ? 'destructive' : 'outline'} className="ml-2">{execution.status}</Badge>
                </div>
                <div>
                  {expandedAgents[execution.id] ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </div>
              </div>
            </CardHeader>
            
            {expandedAgents[execution.id] && (
              <CardContent className="p-3 pt-0">
                <div className="text-sm">
                  <div className="flex items-center mt-2 text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Started {format(execution.startedAt, 'MMM d, h:mm a')}</span>
                  </div>
                  
                  {/* Progress Updates */}
                  {execution.progressUpdates && execution.progressUpdates.length > 0 ? (
                    <div className="mt-3">
                      <div className="flex items-center mb-2">
                        <BarChart2 className="h-3 w-3 mr-1" />
                        <span className="text-sm font-medium">Progress</span>
                      </div>
                      <ProgressSteps
                        steps={execution.progressUpdates.map(update => ({
                          id: update.step.toString(),
                          step: update.step,
                          title: update.title,
                          description: update.description,
                          status: update.status,
                          percentage: update.percentage
                        }))}
                        className="mb-3"
                      />
                    </div>
                  ) : execution.status === 'in_progress' ? (
                    <div className="my-2 flex justify-center">
                      <Spinner size="sm" />
                      <span className="ml-2 text-sm text-muted-foreground">Working on your request...</span>
                    </div>
                  ) : null}
                  
                  {execution.status === 'completed' && execution.results && (
                    <div className="mt-2 bg-secondary/20 p-2 rounded">
                      <div className="flex items-center mb-1">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                        <span className="text-sm font-medium">Results</span>
                      </div>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(execution.results, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {execution.status === 'failed' && execution.error && (
                    <div className="mt-2 bg-destructive/10 p-2 rounded">
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-destructive mr-1 mt-0.5" />
                        <span className="text-sm text-destructive">{execution.error}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          <h2 className="text-lg font-medium">Conversation</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={clearConversation}>
          New Chat
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-center">Start a new conversation</p>
            <p className="text-center text-sm mt-1">Ask a question or request an action</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={message.id || index}>
                {message.role === 'user' && renderUserMessage(message)}
                {message.role === 'system' && renderSystemMessage(message)}
                {message.role === 'agent' && renderAgentMessage(message)}
                {message.role === 'seasonality' && renderSeasonalityMessage(message)}
              </div>
            ))}
            {renderAgentExecutions()}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none"
            rows={2}
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            className="ml-2 self-end"
            disabled={isProcessing || !inputMessage.trim()}
          >
            {isProcessing ? <Spinner className="h-4 w-4" /> : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Export the conversation interface directly - seasonality functionality now integrated into EnhancedConversationContext
export const ConversationInterface = ConversationInterfaceBase;
