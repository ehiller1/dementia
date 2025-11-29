import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare, Brain, Layers, Sparkles, TrendingUp, Zap, GitBranch, CheckCircle2, Clock, AlertCircle, ArrowRight, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { WindsurfConversationInterface } from "@/components/WindsurfConversationInterface";
import DecisionInbox from "@/components/DecisionInbox";
import LiveNarrativeStream from "@/components/LiveNarrativeStream";
import MemoryInspector from '@/components/memory/MemoryInspector';
import CrossFunctionalDecisionCard from '@/components/CrossFunctionalDecisionCard';
import { OrchestrationProvider } from "@/services/context/OrchestrationContext";
import { InMemoryWorkflowGraphService } from "@/services/graph/WorkflowGraphService";
import { OrchestrationController } from "@/services/conversation/OrchestrationController";
import { useAgentEvents } from "@/hooks/useAgentEvents";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";
import { ConversationalMessageRenderer } from "@/components/ConversationalMessageRenderer";

/**
 * Sanitize text by removing the word "crew" and "CrewAI" (case-insensitive)
 * This prevents internal technical terms from appearing in the UI
 */
const sanitizeText = (text: string | undefined | null): string => {
  if (!text || typeof text !== 'string') return '';
  // Replace "CrewAI" (with or without space) and "crew" (case-insensitive)
  // Use a more robust pattern that handles compound words
  let sanitized = text
    .replace(/Crew\s*AI/gi, '') // Match "CrewAI" or "Crew AI" (case-insensitive)
    .replace(/\bcrew\b/gi, '') // Match standalone "crew" word
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .replace(/\s+([.,;:!?])/g, '$1') // Remove space before punctuation
    .replace(/([.,;:!?])\s+/g, '$1 ') // Ensure space after punctuation
    .trim();
  
  // Clean up any remaining artifacts like "with  conversational" -> "with conversational"
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
};

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();
  
  // Redirect to dashboard if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Note: do not early-return before hooks to avoid hook-order mismatch.

  const [graphService] = useState(() => new InMemoryWorkflowGraphService());
  const [controller, setController] = useState<OrchestrationController | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showInteroperabilityModal, setShowInteroperabilityModal] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const { events: agentEvents } = useAgentEvents();
  const [activeAgentsCount, setActiveAgentsCount] = useState(0);
  const [recentEventsCount, setRecentEventsCount] = useState(0);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [latestApiResponse, setLatestApiResponse] = useState<any>(null);
  // Persist identifiers so memory writes/reads align across sessions
  // Initialize with authenticated user if available, otherwise use localStorage fallback
  const [conversationId, setConversationId] = useState<string>(() => {
    // If user is already loaded, use their ID for conversation
    if (user?.id) {
      return `conv-${user.id}`;
    }
    // Otherwise check localStorage or use default
    const stored = localStorage.getItem('demo_conversation_id');
    return stored || 'main_conversation';
  });
  const [tenantId, setTenantId] = useState<string>(() => {
    const stored = localStorage.getItem('demo_tenant_id');
    return stored || 'default_tenant';
  });
  const [userId, setUserId] = useState<string>(() => {
    // Prioritize authenticated user ID
    if (user?.id) {
      return user.id;
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('demo_user_id');
    return stored || 'default_user';
  });

  // Update userId and conversationId when authenticated user is available
  useEffect(() => {
    if (!authLoading && user?.id) {
      // Always use authenticated user's ID
      setUserId(user.id);
      // Generate conversation ID based on authenticated user
      const userConversationId = `conv-${user.id}`;
      setConversationId(userConversationId);
      // Persist to localStorage for consistency
      localStorage.setItem('demo_user_id', user.id);
      localStorage.setItem('demo_conversation_id', userConversationId);
    } else if (!authLoading && !user) {
      // If not authenticated, use localStorage fallback
      const getOrCreate = (key: string, fallbackPrefix: string) => {
        let val = localStorage.getItem(key);
        if (!val) {
          const rand = Math.random().toString(36).slice(2, 10);
          val = `${fallbackPrefix}-${rand}`;
          localStorage.setItem(key, val);
        }
        return val;
      };
      const storedUserId = getOrCreate('demo_user_id', 'user');
      const storedConversationId = getOrCreate('demo_conversation_id', 'conv');
      const storedTenantId = getOrCreate('demo_tenant_id', 'tenant');
      
      setUserId(storedUserId);
      setConversationId(storedConversationId);
      setTenantId(storedTenantId);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    const ctrl = new OrchestrationController({
      graph: graphService,
      conversationId: conversationId
    });
    setController(ctrl);
    
    // Load sample workflows for demo
    const loadWorkflows = () => {
      setWorkflows([
        {
          id: 'wf-1',
          name: 'Q4 Marketing Campaign Analysis',
          status: 'active',
          progress: 65,
          steps: [
            { name: 'Data Collection', status: 'completed', duration: '2m' },
            { name: 'Trend Analysis', status: 'active', duration: '5m' },
            { name: 'Recommendation Generation', status: 'pending', duration: '-' },
            { name: 'Report Creation', status: 'pending', duration: '-' }
          ],
          startedAt: new Date(Date.now() - 7 * 60000).toISOString(),
          estimatedCompletion: '3 minutes'
        },
        {
          id: 'wf-2',
          name: 'Inventory Optimization',
          status: 'active',
          progress: 40,
          steps: [
            { name: 'Stock Level Assessment', status: 'completed', duration: '1m' },
            { name: 'Demand Forecasting', status: 'active', duration: '8m' },
            { name: 'Reorder Recommendations', status: 'pending', duration: '-' }
          ],
          startedAt: new Date(Date.now() - 12 * 60000).toISOString(),
          estimatedCompletion: '6 minutes'
        }
      ]);
    };
    
    loadWorkflows();
    
    return () => {
      // Cleanup if needed
    };
  }, [graphService, conversationId]);

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          setAgents(data.agents || []);
          setActiveAgentsCount(data.count || 0);
        } else {
          console.error('Failed to fetch agents:', response.status);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchAgents();
    // Refresh agents every 30 seconds
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  // Derive active agents and recent events from agentEvents stream
  useEffect(() => {
    console.log('📊 [Home] Agent events updated:', agentEvents?.length || 0, 'events');
    if (!agentEvents || agentEvents.length === 0) {
      setRecentEventsCount(0);
      return;
    }
    // Count recent events in last 15 minutes
    const now = Date.now();
    let recentCount = 0;
    for (const ev of agentEvents.slice(-200)) {
      const ts = new Date(ev.timestamp || ev.time || Date.now()).getTime();
      // last 15 minutes window
      if (now - ts <= 15 * 60 * 1000) recentCount++;
    }
    setRecentEventsCount(recentCount);
  }, [agentEvents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <AppHeader />
      
      <OrchestrationProvider>
        {/* Main Content - Unified Workspace */}
        <div className="container mx-auto px-4 py-6 mt-16">
          {/* Top Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card 
              className="border-violet-200 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setShowWorkflowModal(true)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-violet-100">Active Workflows</p>
                    <p className="text-3xl font-bold">{workflows.length}</p>
                    <p className="text-xs text-violet-200 mt-1">Click to view details</p>
                  </div>
                  <GitBranch className="h-8 w-8 text-violet-200" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-fuchsia-200 bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setShowAgentsModal(true)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-fuchsia-100">Active Agents</p>
                    <p className="text-3xl font-bold">{activeAgentsCount}</p>
                    <p className="text-xs text-fuchsia-200 mt-1">Click to view details</p>
                  </div>
                  <Users className="h-8 w-8 text-fuchsia-200" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-purple-200 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setShowEventsModal(true)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-100">Events</p>
                    <p className="text-3xl font-bold">{recentEventsCount}</p>
                    <p className="text-xs text-purple-200 mt-1">Click to view details</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-indigo-200 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setShowInteroperabilityModal(true)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-100">Interoperability</p>
                    <p className="text-3xl font-bold">24</p>
                    <p className="text-xs text-indigo-200 mt-1">Click to view cross-functional decisions</p>
                  </div>
                  <Brain className="h-8 w-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Workspace Grid - 3 Columns */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left Column - Memory & Narratives */}
            <div className="col-span-3 flex flex-col gap-6 h-[calc(100vh-40px)]">
              {/* Memory Inspector */}
              <Card className="border-indigo-200 bg-white/95 backdrop-blur shadow-xl shrink-0 flex flex-col h-[300px]">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg shrink-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5" />
                    Memory
                  </CardTitle>
                  <CardDescription className="text-indigo-100">Short & long-term context</CardDescription>
                </CardHeader>
                <CardContent className="p-3 flex-1 overflow-hidden min-h-0">
                  <ScrollArea className="h-full">
                    <MemoryInspector 
                      tenantId={tenantId}
                      userId={userId}
                      contextId={conversationId}
                      refreshTrigger={latestApiResponse}
                      apiMemoryData={latestApiResponse?.turnEnvelope?.memory}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Live Narratives */}
              <Card className="border-purple-200 bg-white/95 backdrop-blur shadow-xl flex-1 flex flex-col min-h-0">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-t-lg shrink-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    Live Insights
                  </CardTitle>
                  <CardDescription className="text-purple-100">Real-time narratives</CardDescription>
                </CardHeader>
                <CardContent className="p-3 flex-1 overflow-hidden min-h-0">
                  <ScrollArea className="h-full">
                    <LiveNarrativeStream apiResponse={latestApiResponse} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Conversation */}
            <div className="col-span-6">
              <Card className="border-violet-200 bg-white/95 backdrop-blur shadow-2xl h-[calc(100vh-40px)] flex flex-col">
                <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg shrink-0">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageSquare className="h-6 w-6" />
                    AMIGO 
                  </CardTitle>
                  <CardDescription className="text-violet-100">Your AI-enabled management team</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    {latestApiResponse && (
                      <div className="p-4 border-b border-violet-100 bg-white/60">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {latestApiResponse.problem_type && (
                            <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                              Problem: {latestApiResponse.problem_type}
                            </Badge>
                          )}
                          {latestApiResponse.workflow_stage && (
                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              Stage: {latestApiResponse.workflow_stage}
                            </Badge>
                          )}
                          {latestApiResponse.problem_space && (
                            <Badge variant="secondary" className="text-xs">
                              {latestApiResponse.problem_space}
                            </Badge>
                          )}
                          {latestApiResponse.metadata?.model && (
                            <Badge variant="outline" className="text-xs">
                              Model: {latestApiResponse.metadata.model}
                            </Badge>
                          )}
                          {typeof latestApiResponse.processingTime === 'number' && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(latestApiResponse.processingTime)} ms
                            </Badge>
                          )}
                        </div>
                        
                        {/* Detailed Reasoning Process - Show if we have any API response */}
                        {latestApiResponse && (
                          <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 border-l-4 border-indigo-500 rounded-lg p-4 mb-3 space-y-4 shadow-sm">
                            <div className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <Brain className="h-4 w-4 text-indigo-600" />
                              Detailed Reasoning Process
                            </div>
                            
                            {/* Show message if no detailed data available */}
                            {!latestApiResponse.intentClassification && 
                             !latestApiResponse.turnEnvelope?.plan?.declarative?.length && 
                             !latestApiResponse.turnEnvelope?.plan?.procedural?.length &&
                             !latestApiResponse.agentResults?.summary &&
                             !latestApiResponse.turnEnvelope?.meta &&
                             !latestApiResponse.turnEnvelope?.plan?.steps?.length && (
                              <div className="text-xs text-gray-500 italic pl-4">
                                No detailed reasoning data available in this response.
                              </div>
                            )}
                            
                            {/* Intent Classification */}
                            {latestApiResponse.intentClassification && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-700">1. Intent Classification</div>
                                <div className="text-xs text-gray-600 pl-4">
                                  <span className="font-medium">Type:</span> {latestApiResponse.intentClassification.intent || latestApiResponse.intentClassification.type || 'N/A'}
                                  {latestApiResponse.intentClassification.confidence && (
                                    <span className="ml-3">
                                      <span className="font-medium">Confidence:</span> {(latestApiResponse.intentClassification.confidence * 100).toFixed(0)}%
                                    </span>
                                  )}
                                  {latestApiResponse.intentClassification.explanation && (
                                    <div className="mt-1 text-gray-500 italic">{latestApiResponse.intentClassification.explanation}</div>
                                  )}
                                  {latestApiResponse.intentClassification.keywords?.length > 0 && (
                                    <div className="mt-1">
                                      <span className="font-medium">Keywords:</span> {latestApiResponse.intentClassification.keywords.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Template Discovery (Declarative Plan) */}
                            {latestApiResponse.turnEnvelope?.plan?.declarative?.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-700">2. Template Discovery & Selection</div>
                                <div className="text-xs text-gray-600 pl-4 space-y-2">
                                  {latestApiResponse.turnEnvelope.plan.declarative.map((template: any, idx: number) => (
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
                            {latestApiResponse.turnEnvelope?.plan?.procedural?.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-700">3. Agent Execution Plan</div>
                                <div className="text-xs text-gray-600 pl-4 space-y-1.5">
                                  {latestApiResponse.turnEnvelope.plan.procedural.map((task: any, idx: number) => (
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
                            {latestApiResponse.agentResults?.summary && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-700">4. Agent Execution Results</div>
                                <div className="text-xs text-gray-600 pl-4">
                                  {latestApiResponse.agentResults.summary.agentsInvolved && (
                                    <div>
                                      <span className="font-medium">Agents Involved:</span> {latestApiResponse.agentResults.summary.agentsInvolved}
                                    </div>
                                  )}
                                  {latestApiResponse.agentResults.summary.successCount !== undefined && (
                                    <div>
                                      <span className="font-medium">Success Count:</span> {latestApiResponse.agentResults.summary.successCount}
                                    </div>
                                  )}
                                  {latestApiResponse.agentResults.summary.processingTime && (
                                    <div>
                                      <span className="font-medium">Processing Time:</span> {latestApiResponse.agentResults.summary.processingTime}ms
                                    </div>
                                  )}
                                  {latestApiResponse.agentResults.metrics && (
                                    <div className="mt-1">
                                      <span className="font-medium">Total Time:</span> {latestApiResponse.agentResults.metrics.totalTime}ms
                                      {latestApiResponse.agentResults.metrics.successRate && (
                                        <span className="ml-2">
                                          <span className="font-medium">Success Rate:</span> {(latestApiResponse.agentResults.metrics.successRate * 100).toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Individual Agent Results */}
                            {latestApiResponse.agentResults?.results?.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-700">5. Individual Agent Outputs</div>
                                <div className="text-xs text-gray-600 pl-4 space-y-2">
                                  {latestApiResponse.agentResults.results.map((result: any, idx: number) => (
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
                            {latestApiResponse.turnEnvelope?.meta && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-700">6. Processing Metadata</div>
                                <div className="text-xs text-gray-600 pl-4">
                                  {latestApiResponse.turnEnvelope.meta.processingMode && (
                                    <div>
                                      <span className="font-medium">Mode:</span> {latestApiResponse.turnEnvelope.meta.processingMode}
                                    </div>
                                  )}
                                  {latestApiResponse.turnEnvelope.meta.provenance && (
                                    <div>
                                      <span className="font-medium">Provenance:</span> {latestApiResponse.turnEnvelope.meta.provenance}
                                    </div>
                                  )}
                                  {latestApiResponse.turnEnvelope.meta.concepts?.length > 0 && (
                                    <div>
                                      <span className="font-medium">Concepts:</span> {latestApiResponse.turnEnvelope.meta.concepts.join(', ')}
                                    </div>
                                  )}
                                  {latestApiResponse.turnEnvelope.meta.templatesUsed?.length > 0 && (
                                    <div>
                                      <span className="font-medium">Templates Used:</span> {latestApiResponse.turnEnvelope.meta.templatesUsed.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Fallback: Simple steps if available */}
                            {latestApiResponse.turnEnvelope?.plan?.steps?.length > 0 && 
                             !latestApiResponse.turnEnvelope?.plan?.declarative?.length && 
                             !latestApiResponse.turnEnvelope?.plan?.procedural?.length && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-700">Reasoning Steps</div>
                                <ul className="text-xs text-gray-600 pl-4 space-y-1">
                              {latestApiResponse.turnEnvelope.plan.steps.map((step: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-gray-400 mt-0.5">•</span>
                                  <span>{sanitizeText(step)}</span>
                                </li>
                              ))}
                            </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Render main assistant content (markdown -> UI) */}
                        {latestApiResponse.response && (
                          <div className="mt-2">
                            <ConversationalMessageRenderer
                              content={sanitizeText(latestApiResponse.response)}
                              isUser={false}
                            />
                          </div>
                        )}

                        {/* Requirement tracking */}
                        {(latestApiResponse.requirementTracking || latestApiResponse.turnEnvelope?.meta?.requirementTracking) && (
                          <div className="mt-2">
                            {(() => {
                              const rt = latestApiResponse.requirementTracking || latestApiResponse.turnEnvelope.meta.requirementTracking;
                              const pct = rt?.progress?.percentage ?? 0;
                              return (
                                <div className="bg-green-50 border border-green-200 rounded p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={rt?.allRequirementsMet ? 'default' : 'secondary'} className="text-xs">
                                      {rt?.allRequirementsMet ? 'All requirements met' : 'Requirements pending'}
                                    </Badge>
                                    {typeof pct === 'number' && (
                                      <span className="text-xs text-gray-600">{pct}%</span>
                                    )}
                                  </div>
                                  {typeof pct === 'number' && <Progress value={pct} />}
                                  {rt?.unmetRequirements?.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-700">
                                      <div className="font-medium mb-1">Unmet Requirements:</div>
                                      <ul className="list-disc list-inside space-y-0.5">
                                        {rt.unmetRequirements.map((r: any, i: number) => (
                                          <li key={i}>{typeof r === 'string' ? r : r.requirement || JSON.stringify(r)}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  <WindsurfConversationInterface 
                    conversationId={conversationId}
                    userId={userId}
                    tenantId={tenantId}
                    onApiResponse={(response) => setLatestApiResponse(response)}
                  />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Decisions */}
            <div className="col-span-3 space-y-6">
              <Card className="border-fuchsia-200 bg-white/95 backdrop-blur shadow-xl h-[calc(100vh-40px)] flex flex-col">
                <CardHeader className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-t-lg shrink-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers className="h-5 w-5" />
                    Decision Inbox
                  </CardTitle>
                  <CardDescription className="text-fuchsia-100">Pending actions</CardDescription>
                </CardHeader>
                <CardContent className="p-3 flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <DecisionInbox onSimulate={(id) => console.log('Simulate:', id)} apiResponse={latestApiResponse} />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Removed - Now in modal */}
            </div>
          </div>
        </div>
      </OrchestrationProvider>
      
      {/* Innovative Workflow Modal */}
      <Dialog open={showWorkflowModal} onOpenChange={setShowWorkflowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <GitBranch className="h-6 w-6 text-violet-600" />
              Active Workflows
            </DialogTitle>
            <DialogDescription>
              Real-time view of your intelligent workflows in progress
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="border-violet-200 bg-gradient-to-br from-white to-violet-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {workflow.name}
                          <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                            {workflow.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Started {new Date(workflow.startedAt).toLocaleTimeString()} • Est. completion: {workflow.estimatedCompletion}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-violet-600">{workflow.progress}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                      </div>
                    </div>
                    <Progress value={workflow.progress} className="mt-3" />
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {workflow.steps.map((step: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-violet-100">
                          <div className="flex-shrink-0">
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : step.status === 'active' ? (
                              <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{step.name}</div>
                            <div className="text-xs text-gray-500">
                              {step.status === 'completed' ? `Completed in ${step.duration}` : 
                               step.status === 'active' ? `Running for ${step.duration}` : 
                               'Pending'}
                            </div>
                          </div>
                          {index < workflow.steps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Activity className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {workflows.length === 0 && (
                <div className="text-center py-12">
                  <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active workflows</p>
                  <p className="text-sm text-gray-400 mt-2">Start a conversation to create workflows</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Active Agents Modal */}
      <Dialog open={showAgentsModal} onOpenChange={setShowAgentsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-fuchsia-600" />
              Available Agents ({activeAgentsCount})
            </DialogTitle>
            <DialogDescription>
              All agents available in the system
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-3">
              {isLoadingAgents ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading agents...</p>
                </div>
              ) : agents && agents.length > 0 ? (
                agents.map((agent, index) => (
                  <Card key={agent.id || index} className="border-fuchsia-200 bg-gradient-to-br from-white to-fuchsia-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`h-2 w-2 rounded-full ${
                              agent.status === 'active' ? 'bg-green-500 animate-pulse' : 
                              agent.status === 'idle' ? 'bg-gray-400' : 
                              'bg-yellow-500'
                            }`}></div>
                            <h3 className="font-semibold text-sm">{agent.name || 'Unknown Agent'}</h3>
                            <Badge variant="secondary" className="text-xs">{agent.status || 'idle'}</Badge>
                            <Badge variant="outline" className="text-xs">{agent.id}</Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{agent.role || 'No description'}</p>
                          {agent.capabilities && agent.capabilities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {agent.capabilities.slice(0, 5).map((cap: string, capIndex: number) => (
                                <Badge key={capIndex} variant="outline" className="text-xs bg-white">
                                  {cap}
                                </Badge>
                              ))}
                              {agent.capabilities.length > 5 && (
                                <Badge variant="outline" className="text-xs bg-white">
                                  +{agent.capabilities.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No agents available</p>
                  <p className="text-sm text-gray-400 mt-2">Unable to fetch agents from the backend</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Events Modal */}
      <Dialog open={showEventsModal} onOpenChange={setShowEventsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Recent Events ({recentEventsCount})
            </DialogTitle>
            <DialogDescription>
              System events from the last 15 minutes
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-2">
              {agentEvents && agentEvents.length > 0 ? (
                agentEvents.slice(-50).reverse().map((event, index) => {
                  const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();
                  const isRecent = Date.now() - eventTime.getTime() <= 15 * 60 * 1000;
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${isRecent ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {event.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : event.status === 'error' ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Activity className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {event.agentName || event.type || 'System Event'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {event.status || 'active'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 break-words">
                            {event.currentStep || event.message || event.description || 'Event triggered'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          {eventTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent events</p>
                  <p className="text-sm text-gray-400 mt-2">Events will appear here as they occur</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Interoperability Modal */}
      <Dialog open={showInteroperabilityModal} onOpenChange={setShowInteroperabilityModal}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Brain className="h-6 w-6 text-indigo-600" />
              Interoperability - Cross-Functional Decisions
            </DialogTitle>
            <DialogDescription>
              View how decisions from one functional area impact others through semantic interoperability
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[75vh] pr-4">
            <CrossFunctionalDecisionCard />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
