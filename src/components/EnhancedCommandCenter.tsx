/**
 * Enhanced Command Center with Redesigned UI Layout
 * 
 * Features:
 * - Separate WindsurfConversation container
 * - Active Actions container showing human actions and agent progress
 * - Narrative container for live updates
 * - Decision inbox for pending decisions
 * - Reuses existing functionality with improved organization
 */

import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WindsurfConversationInterface } from '@/components/WindsurfConversationInterface';
import { QuestSystem } from '@/components/QuestSystem';
import { ResultsAnalyzer } from '@/components/ResultsAnalyzer';
import { CommandCenterHeader } from '@/components/CommandCenterHeader';
import LiveNarrativeStream, { LiveNarrativeStreamRef } from '@/components/LiveNarrativeStream';
import DecisionInbox, { DecisionInboxRef } from '@/components/DecisionInbox';
import { useConversation } from '@/contexts/ConversationContext';
import { useEnhancedUnifiedConversation } from '@/contexts/EnhancedUnifiedConversationProvider';
import RoleSwitchBanner from '@/components/RoleSwitchBanner';
import { useToast } from '@/components/ui/use-toast';
import { useSessionService } from '@/hooks/useSessionService';
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
  User,
  Clock,
  RotateCcw,
  FastForward,
  HelpCircle,
  Info,
  Activity,
  Users,
  Bot,
  Eye,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface EnhancedCommandCenterProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  onCreateNewAgent: () => void;
  onBackToDashboard: () => void;
}

interface ActionItem {
  id: string;
  type: 'human' | 'agent';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
  agentId?: string;
  progress?: number;
  details?: string;
}

interface ActiveAction {
  id: string;
  type: 'analysis' | 'decision' | 'execution' | 'collaboration';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  agentId?: string;
  humanAction?: boolean;
  timestamp: Date;
  estimatedCompletion?: Date;
  details?: any;
}

export const EnhancedCommandCenter: React.FC<EnhancedCommandCenterProps> = ({ 
  agents, 
  setAgents, 
  onCreateNewAgent, 
  onBackToDashboard 
}) => {
  const { uiMode, roleContext, setRoleMode } = useUnifiedConversation();
  const [activeTab, setActiveTab] = useState("conversation");
  const [isWindsurfExpanded, setIsWindsurfExpanded] = useState(false);
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
  const [activeActions, setActiveActions] = useState<ActiveAction[]>([]);
  const [actionHistory, setActionHistory] = useState<ActionItem[]>([]);
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const { session } = useSessionService();

  // Handle simulation requests from DecisionInbox via backend endpoint
  const handleSimulateDecision = async (decisionId: string) => {
    try {
      setActiveDecisionId(decisionId);
      toast({
        title: '🔮 Simulation started',
        description: `Simulating decision ${decisionId}...`,
        duration: 2500,
      });

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

      // Optionally refresh inbox
      decisionInboxRef.current?.fetchData();

      // Notify user; narrative SSE should stream results
      toast({
        title: '✅ Simulation triggered',
        description: 'Streaming results will appear in Live Narrative.',
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Error triggering simulation:', error);
      toast({
        title: '❌ Simulation failed to start',
        description: error?.message || 'Unknown error',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };
  
  const narrativeStreamRef = useRef<LiveNarrativeStreamRef>(null);
  const decisionInboxRef = useRef<DecisionInboxRef>(null);
  const { toast } = useToast();

  // Simulate active actions for demonstration
  useEffect(() => {
    const sampleActions: ActiveAction[] = [
      {
        id: 'action_1',
        type: 'analysis',
        title: 'Market Trend Analysis',
        description: 'Analyzing seasonal patterns in customer data',
        status: 'in_progress',
        progress: 65,
        agentId: agents[0]?.id,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        estimatedCompletion: new Date(Date.now() + 3 * 60 * 1000)
      },
      {
        id: 'action_2',
        type: 'decision',
        title: 'Inventory Planning Decision',
        description: 'Awaiting user approval for inventory recommendations',
        status: 'pending',
        progress: 0,
        humanAction: true,
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      },
      {
        id: 'action_3',
        type: 'collaboration',
        title: 'Agent Coordination',
        description: 'Marketing and Sales agents collaborating on campaign strategy',
        status: 'in_progress',
        progress: 40,
        timestamp: new Date(Date.now() - 8 * 60 * 1000)
      }
    ];
    setActiveActions(sampleActions);

    const sampleHistory: ActionItem[] = [
      {
        id: 'hist_1',
        type: 'agent',
        title: 'Data Analysis Completed',
        description: 'Seasonal trend analysis finished with 94% confidence',
        status: 'completed',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        agentId: agents[0]?.id
      },
      {
        id: 'hist_2',
        type: 'human',
        title: 'Query Submitted',
        description: 'User requested inventory optimization analysis',
        status: 'completed',
        timestamp: new Date(Date.now() - 20 * 60 * 1000)
      }
    ];
    setActionHistory(sampleHistory);
  }, [agents]);

  const handleActionUpdate = (actionId: string, updates: Partial<ActiveAction>) => {
    setActiveActions(prev => 
      prev.map(action => 
        action.id === actionId ? { ...action, ...updates } : action
      )
    );
  };

  const handleActionComplete = (actionId: string) => {
    const action = activeActions.find(a => a.id === actionId);
    if (action) {
      // Move to history
      setActionHistory(prev => [{
        id: action.id,
        type: action.humanAction ? 'human' : 'agent',
        title: action.title,
        description: action.description,
        status: 'completed',
        timestamp: new Date(),
        agentId: action.agentId
      }, ...prev]);
      
      // Remove from active
      setActiveActions(prev => prev.filter(a => a.id !== actionId));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Brain className="h-4 w-4 text-purple-500" />;
      case 'decision': return <Target className="h-4 w-4 text-orange-500" />;
      case 'execution': return <Play className="h-4 w-4 text-green-500" />;
      case 'collaboration': return <Users className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="relative z-10 min-h-screen p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={onBackToDashboard}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            ← Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              className="bg-purple-700 hover:bg-purple-600 text-white"
              onClick={onCreateNewAgent}
            >
              Create New Agent
            </Button>
          </div>
        </div>

        {/* Role Switch Banner */}
        <RoleSwitchBanner 
          role={uiMode}
          confidence={roleContext?.confidence}
          reasons={roleContext?.reasons}
          manualOverride={roleContext?.manualOverride}
          onSwitch={(mode) => setRoleMode(mode, 'user_toggle')}
        />

        {/* Role-specific quick panels */}
        {uiMode === 'operator' ? (
          <div className="mb-4 grid grid-cols-3 gap-4">
            <Card className="bg-slate-800 border-slate-700 col-span-3">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  <CardTitle className="text-white text-sm">KPI Strip</CardTitle>
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400">Operator</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4 text-slate-300 text-sm">
                KPI preview placeholder (wire real KPIs later)
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-3 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-sky-400" />
                  <CardTitle className="text-white text-sm">Experiments</CardTitle>
                  <Badge variant="outline" className="text-xs text-sky-400 border-sky-400">Builder</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4 text-slate-300 text-sm">
                Experiment panel placeholder
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700 col-span-2">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-sky-400" />
                  <CardTitle className="text-white text-sm">Artifacts</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4 text-slate-300 text-sm">
                Models, notebooks, and generated assets placeholder
              </CardContent>
            </Card>
          </div>
        )}
        {/* Main Layout Grid */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
          
          {/* Left Column: WindsurfConversation Container */}
          <div className={`${isWindsurfExpanded ? 'col-span-8' : 'col-span-6'} transition-all duration-300`}>
            <Card className="h-full bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-400" />
                    <CardTitle className="text-white">AI Conversation</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      Windsurf Interface
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsWindsurfExpanded(!isWindsurfExpanded)}
                    className="text-gray-400 hover:text-white"
                  >
                    {isWindsurfExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-4rem)]">
                <div className="h-full bg-white rounded-lg">
                  <WindsurfConversationInterface
                    conversationId="enhanced_command_center"
                    onConversationChange={(messages) => {
                      console.log('Conversation updated:', messages.length, 'messages');
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column: Active Actions Container */}
          <div className={`${isActionsExpanded ? 'col-span-8' : isWindsurfExpanded ? 'col-span-4' : 'col-span-3'} transition-all duration-300`}>
            <Card className="h-full bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    <CardTitle className="text-white">Active Actions</CardTitle>
                    <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                      {activeActions.length} Active
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsActionsExpanded(!isActionsExpanded)}
                    className="text-gray-400 hover:text-white"
                  >
                    {isActionsExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 h-[calc(100%-4rem)]">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Active Actions */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        In Progress
                      </h4>
                      {activeActions.map((action) => (
                        <div key={action.id} className="mb-3 p-3 bg-slate-700 rounded-lg border border-slate-600">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getActionTypeIcon(action.type)}
                              <span className="text-sm font-medium text-white">{action.title}</span>
                              {action.humanAction && (
                                <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                                  <User className="h-3 w-3 mr-1" />
                                  Human
                                </Badge>
                              )}
                              {action.agentId && (
                                <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                                  <Bot className="h-3 w-3 mr-1" />
                                  Agent
                                </Badge>
                              )}
                            </div>
                            {getStatusIcon(action.status)}
                          </div>
                          
                          <p className="text-xs text-gray-400 mb-2">{action.description}</p>
                          
                          {action.status === 'in_progress' && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>Progress</span>
                                <span>{action.progress}%</span>
                              </div>
                              <Progress value={action.progress} className="h-1" />
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                            <span>{formatTimeAgo(action.timestamp)}</span>
                            {action.estimatedCompletion && action.status === 'in_progress' && (
                              <span>ETA: {Math.ceil((action.estimatedCompletion.getTime() - Date.now()) / 60000)}m</span>
                            )}
                          </div>
                          
                          {action.humanAction && action.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" className="text-xs h-6 bg-green-600 hover:bg-green-700">
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-6">
                                Review
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-slate-600" />

                    {/* Recent History */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent History
                      </h4>
                      {actionHistory.slice(0, 5).map((item) => (
                        <div key={item.id} className="mb-2 p-2 bg-slate-700/50 rounded border border-slate-600/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {item.type === 'human' ? (
                                <User className="h-3 w-3 text-blue-400" />
                              ) : (
                                <Bot className="h-3 w-3 text-purple-400" />
                              )}
                              <span className="text-xs font-medium text-white">{item.title}</span>
                              {getStatusIcon(item.status)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                          <span className="text-xs text-gray-500">{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Narrative & Decision Containers */}
          <div className={`${isActionsExpanded ? 'col-span-0 hidden' : isWindsurfExpanded ? 'col-span-0 hidden' : 'col-span-3'} transition-all duration-300`}>
            <div className="h-full flex flex-col gap-4">
              
              {/* Narrative Container */}
              <Card className="h-1/2 bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-yellow-400" />
                    <CardTitle className="text-white text-sm">Live Narrative</CardTitle>
                    <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                      Real-time
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100%-4rem)]">
                  <LiveNarrativeStream 
                    ref={narrativeStreamRef}
                    maxEntries={10}
                  />
                </CardContent>
              </Card>

              {/* Decision Inbox Container */}
              <Card className="h-1/2 bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-400" />
                    <CardTitle className="text-white text-sm">Decision Inbox</CardTitle>
                    <Badge variant="outline" className="text-xs text-orange-400 border-orange-400">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100%-4rem)]">
                  <DecisionInbox 
                    ref={decisionInboxRef}
                    onSimulate={handleSimulateDecision} 
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Tabs for Additional Views */}
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="conversation" className="data-[state=active]:bg-slate-700 text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-slate-700 text-white">
                ⚔️ Quest Board
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-slate-700 text-white">
                📊 Results Chamber
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700 text-white">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="mt-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-center text-gray-400">
                    <Sparkles className="h-8 w-8 mx-auto mb-2" />
                    <p>Enhanced Command Center is active with redesigned UI layout.</p>
                    <p className="text-sm mt-1">
                      WindsurfConversation, Active Actions, Narrative, and Decision containers are now separated for better workflow management.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quests" className="mt-4">
              <QuestSystem 
                agents={agents}
                setAgents={setAgents}
              />
            </TabsContent>

            <TabsContent value="results" className="mt-4">
              <ResultsAnalyzer 
                agents={agents}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Interface Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Auto-expand containers</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Real-time updates</span>
                    <Button variant="outline" size="sm">Enabled</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Action notifications</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCommandCenter;
