import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedUnifiedConversation } from '@/contexts/EnhancedUnifiedConversationProvider';
import { 
  MessageCircle, 
  Brain, 
  Lightbulb, 
  Target, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
  RotateCcw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import ReasoningTransparencyWidget from './reasoning/ReasoningTransparencyWidget';

/**
 * Unified Conversation Interface
 * 
 * A comprehensive conversation component that uses the UnifiedConversationProvider
 * to provide all conversation capabilities in a single, clean interface.
 * 
 * Eliminates redundancy and provides the full Windsurf-like experience.
 */
export const UnifiedConversationInterface: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [showWorkflowSteps, setShowWorkflowSteps] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showReasoningTransparency, setShowReasoningTransparency] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isProcessing,
    error,
    agentStatus,
    pendingApprovals,
    sendMessage,
    clearMessages,
    approveAction,
    denyAction,
    retryMessage
  } = useEnhancedUnifiedConversation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) {
      return;
    }

    await sendMessage(inputValue);
    setInputValue('');
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get phase color
  const getPhaseColor = (phase: string | null) => {
    switch (phase) {
      case 'discovery': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-purple-100 text-purple-800';
      case 'decision': return 'bg-orange-100 text-orange-800';
      case 'action': return 'bg-green-100 text-green-800';
      case 'reflection': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter messages based on user preferences
  const filteredMessages = messages.filter(message => {
    if (message.role === 'workflow' && !showWorkflowSteps) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Header with status and controls */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              AMIGO
              <span className="text-sm font-normal text-muted-foreground">
                Adaptive Management of Intelligent Governance & Orchestration
              </span>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Processing indicator */}
              {isProcessing && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
              
              {/* Agent status */}
              {Object.keys(agentStatus).length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {Object.values(agentStatus).filter(s => s === 'running').length} agents active
                </Badge>
              )}
              
              {/* Pending approvals */}
              {pendingApprovals.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {pendingApprovals.length} pending
                </Badge>
              )}
              
              {/* Error indicator */}
              {error && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </Badge>
              )}

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWorkflowSteps(!showWorkflowSteps)}
                  className="flex items-center gap-1"
                >
                  {showWorkflowSteps ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  Steps
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReasoningTransparency(!showReasoningTransparency)}
                  className="flex items-center gap-1"
                >
                  <Brain className="h-3 w-3" />
                  {showReasoningTransparency ? 'CoT On' : 'CoT Off'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Debug
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMessages}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
          
          {/* Status bar */}
          {messages.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>Messages: {messages.filter(m => m.role === 'user').length}</span>
              <span>•</span>
              <span>Responses: {messages.filter(m => m.role === 'assistant').length}</span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main content area */}
      <div className="flex-1 flex gap-4">
        {/* Conversation area */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[600px] p-4">
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.role === 'workflow'
                          ? 'bg-amber-50 border border-amber-200'
                          : message.role === 'system'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-white border border-gray-200 shadow-sm'
                      }`}
                    >
                      {/* Message header */}
                      <div className="flex items-center gap-2 mb-3">
                        {message.role === 'user' && <MessageCircle className="h-4 w-4" />}
                        {message.role === 'assistant' && <Sparkles className="h-4 w-4 text-blue-500" />}
                        {message.role === 'workflow' && <Zap className="h-4 w-4 text-amber-500" />}
                        {message.role === 'system' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        
                        {message.metadata?.phase && (
                          <Badge variant="outline" className={`text-xs ${getPhaseColor(message.metadata.phase)}`}>
                            {message.metadata.phase}
                          </Badge>
                        )}

                        {message.metadata?.confidence && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(message.metadata.confidence * 100)}% confidence
                          </Badge>
                        )}

                        {message.metadata?.workflowStep && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.workflowStep}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Message content */}
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                      
                      {/* Key insights */}
                      {message.metadata?.insights && message.metadata.insights.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">Key Insights</span>
                          </div>
                          <ul className="text-sm space-y-1">
                            {message.metadata.insights.slice(0, 3).map((insight, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-yellow-500 mt-1">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {message.metadata?.recommendations && message.metadata.recommendations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Recommendations</span>
                          </div>
                          <ul className="text-sm space-y-1">
                            {message.metadata.recommendations.slice(0, 2).map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Chain-of-Thought Reasoning */}
                      {showReasoningTransparency && message.role === 'assistant' && message.metadata && 'reasoningChain' in message.metadata && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <ReasoningTransparencyWidget
                            messageId={message.id}
                            reasoningChain={message.metadata.reasoningChain as any}
                            isVisible={false}
                            compact={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Processing your request...
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>
          
          {/* Suggested action bar - removed as not available in context */}
          
          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your business data, seasonal patterns, or strategic decisions..."
                disabled={isProcessing}
                className={`${isProcessing ? 'opacity-50' : ''}`}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {error && (
              <p className="text-sm text-red-500 mt-2">
                {error}
              </p>
            )}
          </div>
        </Card>

        {/* Sidebar with insights and controls */}
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Conversation Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="workflow" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="intent">Intent</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
                <TabsTrigger value="implementation">Implementation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="workflow" className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Messages:</span>
                  <p className="text-sm">{messages.length} total</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Agents:</span>
                  <p className="text-sm">{Object.keys(agentStatus).length} active</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>User: {messages.filter(m => m.role === 'user').length}</span>
                  <span>AI: {messages.filter(m => m.role === 'assistant').length}</span>
                </div>
              </TabsContent>
              
              <TabsContent value="intent" className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Processing:</span>
                  <p className="text-sm">{isProcessing ? 'Active' : 'Idle'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Pending Approvals:</span>
                  <p className="text-sm">{pendingApprovals.length}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="config" className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Debug Mode</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDebugInfo(!showDebugInfo)}
                      className={showDebugInfo ? 'bg-green-50' : ''}
                    >
                      {showDebugInfo ? 'On' : 'Off'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflow Steps</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWorkflowSteps(!showWorkflowSteps)}
                      className={showWorkflowSteps ? 'bg-green-50' : ''}
                    >
                      {showWorkflowSteps ? 'Show' : 'Hide'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Chain-of-Thought</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReasoningTransparency(!showReasoningTransparency)}
                      className={showReasoningTransparency ? 'bg-purple-50' : ''}
                    >
                      {showReasoningTransparency ? 'Show' : 'Hide'}
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm">Processing Mode</span>
                    <div className="grid grid-cols-1 gap-1">
                      {['workflow', 'intent', 'hybrid'].map((mode) => (
                        <Button
                          key={mode}
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('Processing mode change not implemented')}
                          className="text-xs"
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="implementation" className="space-y-4">
                <div className="p-4 text-center text-gray-500">
                  Implementation planning will be available soon.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Debug information */}
      {showDebugInfo && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2">
              <div><strong>Messages:</strong> {messages.length}</div>
              <div><strong>Processing:</strong> {isProcessing ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {error || 'None'}</div>
              <div><strong>Agents:</strong> {Object.keys(agentStatus).length}</div>
              <div><strong>Pending Approvals:</strong> {pendingApprovals.length}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
