import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Card } from '@/components/ui/card.js';
import { Switch } from '@/components/ui/switch.js';
import ImplementationPlanMessage from './ImplementationPlanMessage.js';
import ImplementationPlansPanel from './ImplementationPlansPanel.js';
import BusinessAgentOrchestration from './BusinessAgentOrchestration.js';
import { Badge } from '@/components/ui/badge';
import { useConversation } from '@/contexts/ConversationContext';
import { processMessage } from '@/lib/api/processMessage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { InfoCircledIcon, LightningBoltIcon, MixerHorizontalIcon } from '@radix-ui/react-icons';
// Temporarily comment out radix icons to fix import error
const InfoCircledIcon = () => <span>ℹ️</span>;
const LightningBoltIcon = () => <span>⚡</span>;
const MixerHorizontalIcon = () => <span>⚙️</span>;
import WorkflowStateVisualization from './WorkflowStateVisualization.js';
import LiveNarrativeStream from './LiveNarrativeStream.js';
import DecisionInbox from './DecisionInbox.js';
import TemplateWorkflowVisualizer from './TemplateWorkflowVisualizer.js';
import ConversationalMessage from './ConversationalMessage.js';
import SemanticFileUpload from './SemanticFileUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponseType } from '@/services/IntentRouterService';
import { useSessionService } from '@/hooks/useSessionService';

/**
 * Enhanced Conversation Interface Component
 * 
 * This component provides a comprehensive interface with knowledge graph integration,
 * workflow state visualization, intent routing, and multi-agent collaboration for
 * retail marketing scenarios.
 */
interface EnhancedConversationInterfaceProps {
  onDecisionSelected?: (decisionId: string) => void;
}

export const EnhancedConversationInterfaceComponent: React.FC<EnhancedConversationInterfaceProps> = ({ onDecisionSelected }) => {
  const [inputValue, setInputValue] = useState('');
  const [showTemplateVisualizer, setShowTemplateVisualizer] = useState(false);
  const [showSemanticUpload, setShowSemanticUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    messages, 
    sendMessage,
    isProcessing,
    addSystemMessage,
    addAgentMessage,
    conversationId
  } = useConversation();
  
  const [knowledgeGraphEnabled, setKnowledgeGraphEnabled] = useState(false);
  const [intentRouterEnabled, setIntentRouterEnabled] = useState(true);
  const [activeAgentExecutions, setActiveAgentExecutions] = useState([]);
  const tenantId = 'demo-tenant';
  
  const narrativeStreamRef = useRef<any>(null);
  const decisionInboxRef = useRef<any>(null);
  const { session } = useSessionService();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle form submission with backend process-message API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isProcessing) return;
    
    try {
      const messageContent = inputValue;
      setInputValue('');
      
      // Process message through backend API (sendMessage handles user message creation)
      // await sendMessage(messageContent); // We'll call processMessage directly instead
      
      // Process message through backend API
      const result = await processMessage({
        query: messageContent,
        conversationId: conversationId || 'enhanced_conversation',
        context: 'enhanced_conversation_interface'
      });
      
      // Display conversational response (fallback logic removed for testing)
      if ((result as any).conversationalResponse) {
        console.log('✅ EnhancedConversationInterface: Using conversational response, suppressing individual agent messages');
        addSystemMessage((result as any).conversationalResponse, {
          type: 'conversational_response',
          hasBackendProcessing: true,
          suppressAgentMessages: true
        });
        // Return early to prevent any additional message processing
        return;
      } else {
        console.log('⚠️ EnhancedConversationInterface: No conversational response found');
      }
      
      // Trigger narrative update with conversation context
      if (narrativeStreamRef.current) {
        setTimeout(() => {
          narrativeStreamRef.current.fetchData(conversationId, messageContent);
        }, 1000);
      }
      
      // Trigger decision inbox update
      if (decisionInboxRef.current) {
        setTimeout(() => {
          decisionInboxRef.current.fetchData();
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addSystemMessage('Sorry, there was an error processing your message. Please try again.', {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Handle textarea key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Render message based on role and response type
  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAgent = message.role === 'agent' || message.role === 'seasonality';
    const hasKnowledgeContext = message.metadata?.knowledgeContext;
    const responseType = message.metadata?.responseType;
    const hasDecision = message.metadata?.decision;
    const hasSimulationResult = message.metadata?.simulationResult;
    
    return (
      <div 
        key={message.id} 
        className={`mb-4 ${isUser ? 'text-right' : ''}`}
      >
        <div className="flex items-center mb-1">
          {!isUser && (
            <div className="font-medium text-sm mr-2">
              {isSystem ? 'System' : isAgent ? 'Agent' : message.role}
            </div>
          )}
          
          {hasKnowledgeContext && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2">
                    <LightningBoltIcon className="h-3 w-3 mr-1" />
                    Knowledge Enhanced
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">This message was enhanced with domain knowledge</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {message.metadata?.isKnowledgeGraphNote && (
            <Badge variant="secondary" className="ml-2">Knowledge Graph</Badge>
          )}
          
          {message.metadata?.isNarrativeNote && (
            <Badge variant="secondary" className="ml-2">Narrative</Badge>
          )}
          
          {message.metadata?.isActionNote && (
            <Badge variant="secondary" className="ml-2">Action</Badge>
          )}
          
          {message.metadata?.isSimulationNote && (
            <Badge variant="secondary" className="ml-2">Simulation</Badge>
          )}
          
          {message.metadata?.type === 'agent_competition' && (
            <Badge variant="outline" className="ml-2">
              🏆 Agent Competition
            </Badge>
          )}
          
          {message.metadata?.type === 'dynamic_creation' && (
            <Badge variant="outline" className="ml-2">
              🤖 Dynamic Creation
            </Badge>
          )}
          
          {responseType && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={responseType === ResponseType.NARRATIVE ? 'default' : 
                                responseType === ResponseType.ACTION ? 'destructive' : 
                                responseType === ResponseType.SIMULATION ? 'outline' : 'secondary'} 
                         className="ml-2">
                    {responseType}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Response type: {responseType}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div 
          className={`
            p-3 rounded-lg inline-block max-w-[80%]
            ${isUser 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : responseType === ResponseType.NARRATIVE ? 'bg-blue-100 text-blue-900' :
                responseType === ResponseType.ACTION ? 'bg-green-100 text-green-900' :
                responseType === ResponseType.SIMULATION ? 'bg-amber-100 text-amber-900' :
                'bg-muted text-muted-foreground'}
          `}
        >
          {message.metadata?.implementationPlanId ? (
            <ImplementationPlanMessage message={message} />
          ) : message.role === 'conversational_agent' || message.metadata?.type === 'conversational_agent' ? (
            <ConversationalMessage 
              userQuery={message.metadata?.userQuery || message.content}
              conversationId={message.metadata?.conversationId || message.id}
              onContinue={(response: string) => {
                console.log('User continued conversation:', response);
                // Handle conversation continuation
                if (response.toLowerCase().includes('simulate')) {
                  // Trigger simulation
                  console.log('Triggering simulation based on user response');
                } else if (response.toLowerCase().includes('implement')) {
                  // Trigger implementation
                  console.log('Triggering implementation based on user response');
                }
                // Send the continuation as a new message
                handleSubmit(new Event('submit') as any);
              }}
            />
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
        
        {/* Display decision options if available */}
        {hasDecision && onDecisionSelected && (
          <div className="mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Decision ID: {message.metadata.decision.id}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDecisionSelected(message.metadata.decision.id)}
                className="text-xs flex items-center gap-1"
              >
                <span>Run Simulation</span>
              </Button>
            </div>
          </div>
        )}
        
        {/* Display simulation results summary if available */}
        {hasSimulationResult && (
          <div className="mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Simulation Confidence: {Math.round(message.metadata.simulationResult.confidence_score * 100)}%</span>
              <Badge variant={message.metadata.simulationResult.confidence_score > 0.7 ? "default" : "outline"}>
                {message.metadata.simulationResult.projected_outcomes.length} Projected Outcomes
              </Badge>
            </div>
          </div>
        )}
        
        {/* Display related concepts if available */}
        {hasKnowledgeContext && knowledgeGraphEnabled && (
          <div className="mt-1 text-xs text-muted-foreground">
            <div className="flex flex-wrap gap-1 mt-1 justify-end">
              {message.metadata.knowledgeContext.relatedConcepts
                .filter((c: any) => c.depth === 0)
                .slice(0, 3)
                .map((concept: any) => (
                  <Badge key={concept.entity_id} variant="outline" className="text-xs">
                    {concept.name}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Initial welcome message for the demo flow
  useEffect(() => {
    if (messages.length === 0) {
      // Add a welcome message when the component mounts if there are no messages
      const welcomeMessage = {
        id: 'welcome-message',
        role: 'assistant',
        content: 'Welcome to the Retail Marketing Assistant! I can help you with market analysis, campaign strategy development, scenario simulations, and implementation planning. How can I assist you today?',
        timestamp: new Date(),
        metadata: {
          isWelcomeMessage: true
        }
      };
      
      // Add the welcome message to the conversation context
      // Note: In a real implementation, we would use the conversation context's addMessage method
      // For demo purposes, we'll just add it to the UI
      setTimeout(() => {
        // This is a mock implementation since we can't directly modify the messages array
        console.log('Welcome message would be displayed here:', welcomeMessage);
      }, 500);
    }
  }, []);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Main conversation area - takes 2/3 of the space on large screens */}
      <Card className="flex flex-col h-full lg:col-span-2">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Retail Marketing Assistant</h2>
          
          <div className="flex items-center">
            {/* Open semantic file upload */}
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2"
              onClick={() => setShowSemanticUpload(true)}
            >
              Upload Data (Semantic)
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center mr-2">
                    <span className="text-sm mr-2">Knowledge Graph</span>
                    <Switch 
                      checked={knowledgeGraphEnabled} 
                      onCheckedChange={(checked) => setKnowledgeGraphEnabled(checked)} 
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {knowledgeGraphEnabled 
                      ? 'Messages are enhanced with domain knowledge' 
                      : 'Domain knowledge enhancement is disabled'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center mr-2">
                    <span className="text-sm mr-2">Intent Router</span>
                    <Switch 
                      checked={intentRouterEnabled} 
                      onCheckedChange={(checked) => setIntentRouterEnabled(checked)} 
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {intentRouterEnabled 
                      ? 'Messages are routed based on intent' 
                      : 'Intent routing is disabled'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <InfoCircledIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="text-xs mb-1">
                      The retail marketing assistant helps with:
                    </p>
                    <ul className="text-xs list-disc pl-4">
                      <li>Market analysis and trends</li>
                      <li>Campaign strategy development</li>
                      <li>Budget allocation and ROI projections</li>
                      <li>Scenario simulations</li>
                      <li>Implementation planning</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Semantic upload panel */}
        <div className="p-4">
          <SemanticFileUpload
            isVisible={showSemanticUpload}
            conversationId={conversationId || 'enhanced_conversation'}
            onCancel={() => setShowSemanticUpload(false)}
            onFileUpload={(result: any) => {
              // Post a brief system message about the uploaded dataset and selected agent
              try {
                const fieldCount = result?.datasetProfile?.fieldCount ?? result?.datasetProfile?.fields?.length ?? 0;
                const topName = result?.topAgent?.agentName || 'Unknown Agent';
                const confidencePct = result?.topAgent?.confidence ? Math.round(result.topAgent.confidence * 100) : undefined;
                const summary = `Dataset uploaded: ${result?.fileName || 'file'} (${fieldCount} fields). Selected agent: ${topName}` + (confidencePct !== undefined ? ` (${confidencePct}% confidence).` : '.');
                addSystemMessage(summary);
              } catch (e) {
                console.warn('Failed to summarize semantic upload result', e);
              }
              setShowSemanticUpload(false);
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Welcome to the Retail Marketing Assistant! I can help you with market analysis, campaign strategy development, scenario simulations, and implementation planning. How can I assist you today?</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                rows={2}
                className="resize-none"
                disabled={isProcessing}
              />
            </div>
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Send'}
            </Button>
          </form>
          
          {/* Active agent executions */}
          {activeAgentExecutions.length > 0 && (
            <div className="mt-2">
              {activeAgentExecutions.map(execution => (
                <div 
                  key={execution.id}
                  className="text-xs text-muted-foreground flex items-center"
                >
                  <div className={`
                    h-2 w-2 rounded-full mr-2
                    ${execution.status === 'completed' ? 'bg-green-500' : 
                      execution.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}
                  `} />
                  <span>
                    {execution.agent_id} - {execution.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* Sidebar area - takes 1/3 of the space on large screens */}
      <div className="flex flex-col h-full">
        <Tabs defaultValue="workflow" className="h-full flex flex-col">
          <div className="border-b px-2">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="narrative">Narrative</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
            </TabsList>
            
            {/* Template Workflow Visualizer Button */}
            <div className="px-2 py-1 border-b">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTemplateVisualizer(true)}
                className="w-full text-xs"
              >
                📊 Template & Workflow Visualizer
              </Button>
            </div>
          </div>
          
          <TabsContent value="workflow" className="flex-1 overflow-auto">
            <div className="space-y-4 p-4">
              <DecisionInbox 
                ref={decisionInboxRef}
                onSimulate={async (decisionId) => {
                  try {
                    const resp = await fetch(`/api/decisions/${decisionId}/simulate`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(session?.id ? { 'x-session-id': session.id } : {}),
                        ...(session?.userId ? { 'x-user-id': session.userId } : {}),
                      },
                    });
                    if (!resp.ok) {
                      const txt = await resp.text();
                      throw new Error(`Backend error ${resp.status}: ${txt}`);
                    }
                    // refresh inbox
                    decisionInboxRef.current?.fetchData();
                    addSystemMessage?.(`Simulation triggered for decision ${decisionId}`, { decisionId });
                  } catch (e: any) {
                    console.error('Failed to trigger simulation', e);
                    addSystemMessage?.(`Failed to trigger simulation: ${e?.message || 'Unknown error'}`);
                  }
                }}
              />
              <WorkflowStateVisualization 
                tenantId="demo-tenant"
                height="400px"
                width="100%"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="narrative" className="flex-1 overflow-auto">
            <LiveNarrativeStream 
              ref={narrativeStreamRef} 
              maxEntries={5}

            />
          </TabsContent>
          
          <TabsContent value="plans" className="h-full overflow-auto">
            <ImplementationPlansPanel />
          </TabsContent>
          
          <TabsContent value="agents" className="h-full overflow-auto">
            <BusinessAgentOrchestration />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Template Workflow Visualizer Modal */}
      <TemplateWorkflowVisualizer 
        isVisible={showTemplateVisualizer}
        onClose={() => setShowTemplateVisualizer(false)}
      />
    </div>
  );
};

export default EnhancedConversationInterfaceComponent;
