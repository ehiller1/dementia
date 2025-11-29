import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  GitBranch, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Workflow,
  Target,
  Database,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';
import { useOrchestration } from '@/services/context/OrchestrationContext';
import type { WorkflowSnapshot, WorkflowNode } from '@/services/graph/WorkflowGraphService';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'error';
  estimatedDuration: number; // in minutes
  dependencies?: string[];
  outputs?: string[];
  agentType?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'planning' | 'execution' | 'review';
  steps: WorkflowStep[];
  estimatedTotal: number;
  confidence: number;
}

interface DynamicWorkflowOrchestratorProps {
  conversationContext: {
    messages: Array<{ role: string; content: string }>;
    currentPhase?: string;
    detectedEntities?: string[];
    userIntent?: string;
  };
  currentWorkflow?: {
    template: WorkflowTemplate;
    currentStepIndex: number;
    startTime: Date;
    progress: number;
  };
  onWorkflowStart: (templateId: string) => void;
  onWorkflowPause: () => void;
  onWorkflowResume: () => void;
  onWorkflowSkip: () => void;
  onWorkflowReset: () => void;
  onStepComplete: (stepId: string, outputs: any) => void;
}

export const DynamicWorkflowOrchestrator: React.FC<DynamicWorkflowOrchestratorProps> = ({
  conversationContext,
  currentWorkflow,
  onWorkflowStart,
  onWorkflowPause,
  onWorkflowResume,
  onWorkflowSkip,
  onWorkflowReset,
  onStepComplete
}) => {
  const [suggestedWorkflows, setSuggestedWorkflows] = useState<WorkflowTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const { graphService, controller } = useOrchestration();
  const [liveSnapshot, setLiveSnapshot] = useState<WorkflowSnapshot | null>(null);

  // Detect workflow type from conversation context
  useEffect(() => {
    const workflows = detectWorkflowType(conversationContext);
    setSuggestedWorkflows(workflows);
    
    // Auto-select highest confidence workflow
    if (workflows.length > 0 && !selectedWorkflow) {
      setSelectedWorkflow(workflows[0].id);
    }
  }, [conversationContext]);

  // Subscribe to live workflow graph updates when a workflow exists
  useEffect(() => {
    const wfId = controller?.getWorkflowId();
    if (!wfId) return;
    const sub = graphService.subscribe(wfId, (snap) => {
      setLiveSnapshot(snap);
    });
    return () => sub.unsubscribe();
  }, [controller, graphService]);

  const detectWorkflowType = (context: typeof conversationContext): WorkflowTemplate[] => {
    const lastMessage = context.messages[context.messages.length - 1]?.content?.toLowerCase() || '';
    const allMessages = context.messages.map(m => m.content.toLowerCase()).join(' ');
    const workflows: WorkflowTemplate[] = [];

    // Data Analysis Workflow
    if (lastMessage.includes('analyze') || lastMessage.includes('data') || lastMessage.includes('insights')) {
      workflows.push({
        id: 'data-analysis',
        name: 'Data Analysis Workflow',
        description: 'Comprehensive data analysis and insights generation',
        category: 'analysis',
        confidence: 0.85,
        estimatedTotal: 45,
        steps: [
          {
            id: 'data-collection',
            title: 'Data Collection',
            description: 'Gather and validate data sources',
            status: 'pending',
            estimatedDuration: 10,
            outputs: ['validated_data', 'data_quality_report']
          },
          {
            id: 'exploratory-analysis',
            title: 'Exploratory Analysis',
            description: 'Initial data exploration and pattern identification',
            status: 'pending',
            estimatedDuration: 15,
            dependencies: ['data-collection'],
            outputs: ['summary_statistics', 'initial_insights']
          },
          {
            id: 'deep-analysis',
            title: 'Deep Analysis',
            description: 'Advanced statistical analysis and modeling',
            status: 'pending',
            estimatedDuration: 20,
            dependencies: ['exploratory-analysis'],
            agentType: 'data-scientist',
            outputs: ['analysis_results', 'statistical_models']
          }
        ]
      });
    }

    // Strategic Planning Workflow
    if (lastMessage.includes('plan') || lastMessage.includes('strategy') || lastMessage.includes('roadmap')) {
      workflows.push({
        id: 'strategic-planning',
        name: 'Strategic Planning Workflow',
        description: 'Comprehensive strategic planning and roadmap creation',
        category: 'planning',
        confidence: 0.78,
        estimatedTotal: 60,
        steps: [
          {
            id: 'situation-analysis',
            title: 'Situation Analysis',
            description: 'Current state assessment and SWOT analysis',
            status: 'pending',
            estimatedDuration: 20,
            outputs: ['swot_analysis', 'current_state_report']
          },
          {
            id: 'goal-setting',
            title: 'Goal Setting',
            description: 'Define strategic objectives and KPIs',
            status: 'pending',
            estimatedDuration: 15,
            dependencies: ['situation-analysis'],
            outputs: ['strategic_objectives', 'kpi_framework']
          },
          {
            id: 'action-planning',
            title: 'Action Planning',
            description: 'Create detailed implementation roadmap',
            status: 'pending',
            estimatedDuration: 25,
            dependencies: ['goal-setting'],
            agentType: 'strategic-planner',
            outputs: ['implementation_roadmap', 'resource_allocation']
          }
        ]
      });
    }

    // Marketing Campaign Workflow
    if (allMessages.includes('marketing') || allMessages.includes('campaign') || allMessages.includes('promotion')) {
      workflows.push({
        id: 'marketing-campaign',
        name: 'Marketing Campaign Workflow',
        description: 'End-to-end marketing campaign development and execution',
        category: 'execution',
        confidence: 0.72,
        estimatedTotal: 90,
        steps: [
          {
            id: 'market-research',
            title: 'Market Research',
            description: 'Target audience analysis and competitive research',
            status: 'pending',
            estimatedDuration: 25,
            outputs: ['audience_personas', 'competitive_analysis']
          },
          {
            id: 'campaign-design',
            title: 'Campaign Design',
            description: 'Creative strategy and content development',
            status: 'pending',
            estimatedDuration: 35,
            dependencies: ['market-research'],
            agentType: 'marketing-specialist',
            outputs: ['creative_strategy', 'campaign_materials']
          },
          {
            id: 'execution-plan',
            title: 'Execution Planning',
            description: 'Channel strategy and timeline development',
            status: 'pending',
            estimatedDuration: 20,
            dependencies: ['campaign-design'],
            outputs: ['channel_strategy', 'execution_timeline']
          },
          {
            id: 'performance-tracking',
            title: 'Performance Tracking',
            description: 'Set up analytics and monitoring systems',
            status: 'pending',
            estimatedDuration: 10,
            dependencies: ['execution-plan'],
            outputs: ['tracking_setup', 'kpi_dashboard']
          }
        ]
      });
    }

    return workflows.sort((a, b) => b.confidence - a.confidence);
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed': return CheckCircle;
      case 'active': return Clock;
      case 'error': return AlertCircle;
      default: return Target;
    }
  };

  const getStepColor = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analysis': return Database;
      case 'planning': return Target;
      case 'execution': return Play;
      case 'review': return FileText;
      default: return Workflow;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <GitBranch className="h-4 w-4" />
          Dynamic Workflow Orchestration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Workflow Status */}
        {currentWorkflow && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{currentWorkflow.template.name}</h3>
              <Badge variant="outline" className="text-xs">
                {currentWorkflow.template.category}
              </Badge>
            </div>
            
            <Progress value={currentWorkflow.progress} className="h-2" />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {currentWorkflow.currentStepIndex + 1} of {currentWorkflow.template.steps.length}</span>
              <span>{formatDuration(currentWorkflow.template.estimatedTotal)} estimated</span>
            </div>

            {/* Current Step */}
            <div className="bg-accent/30 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">
                    {currentWorkflow.template.steps[currentWorkflow.currentStepIndex]?.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentWorkflow.template.steps[currentWorkflow.currentStepIndex]?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Workflow Controls */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onWorkflowPause}>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
              <Button size="sm" variant="outline" onClick={onWorkflowSkip}>
                <SkipForward className="h-3 w-3 mr-1" />
                Skip
              </Button>
              <Button size="sm" variant="outline" onClick={onWorkflowReset}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>

            <Separator />
          </div>
        )}

        {/* Live Workflow Graph (nodes) */}
        {liveSnapshot && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Live Workflow</h3>
            <div className="space-y-1">
              {liveSnapshot.nodes.map((n: WorkflowNode) => (
                <div key={n.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.label || n.id}</span>
                    {n.outputs?.content && (
                      <span className="text-muted-foreground truncate max-w-[240px]">{String(n.outputs.content)}</span>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {n.status.replaceAll('_',' ')}
                  </Badge>
                </div>
              ))}
              {liveSnapshot.nodes.length === 0 && (
                <div className="text-xs text-muted-foreground">No nodes yet</div>
              )}
            </div>
          </div>
        )}

        {/* Suggested Workflows */}
        {!currentWorkflow && suggestedWorkflows.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Suggested Workflows</h3>
            
            {suggestedWorkflows.map((workflow) => {
              const CategoryIcon = getCategoryIcon(workflow.category);
              
              return (
                <div
                  key={workflow.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedWorkflow === workflow.id 
                      ? 'border-primary bg-accent/50' 
                      : 'hover:bg-accent/30'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{workflow.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(workflow.confidence * 100)}% match
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {workflow.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{workflow.steps.length} steps</span>
                        <span>{formatDuration(workflow.estimatedTotal)}</span>
                        <span className="capitalize">{workflow.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Steps Preview */}
                  {selectedWorkflow === workflow.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {workflow.steps.map((step, index) => {
                        const StepIcon = getStepIcon(step);
                        return (
                          <div key={step.id} className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-2 flex-1">
                              <StepIcon className={`h-3 w-3 ${getStepColor(step)}`} />
                              <span className="truncate">{step.title}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {formatDuration(step.estimatedDuration)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Start Workflow Button */}
            {selectedWorkflow && (
              <Button 
                onClick={() => onWorkflowStart(selectedWorkflow)}
                className="w-full"
                size="sm"
              >
                <Play className="h-3 w-3 mr-2" />
                Start {suggestedWorkflows.find(w => w.id === selectedWorkflow)?.name}
              </Button>
            )}
          </div>
        )}

        {/* No Workflows Available */}
        {!currentWorkflow && suggestedWorkflows.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-6">
            <Workflow className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Continue the conversation to get workflow suggestions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
