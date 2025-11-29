import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Brain,
  Target,
  History,
  ChevronRight,
  ChevronDown,
  Eye,
  Activity
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: string;
  dependencies?: string[];
  progress?: number;
}

interface HistoricalAction {
  timestamp: string;
  action: string;
  outcome: string;
  decisions_generated: number;
  user_context: string;
}

interface TemplateData {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'completed' | 'draft';
  progress: number;
  next_steps?: {
    immediate_actions: string[];
    short_term_goals: string[];
    long_term_objectives: string[];
    success_metrics: string[];
    learning_opportunities: string[];
  };
  historical_actions?: HistoricalAction[];
  last_execution?: {
    workflowInstanceId: string;
    executionTime: string;
    agentResults: string[];
    decisionsGenerated: number;
    userQuery: string;
  };
  evolution_count?: number;
  effectiveness_score?: number;
}

interface WorkflowData {
  id: string;
  conversation_id: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  current_step_id: string;
  progress: number;
  data: {
    userQuery: string;
    templatesUsed: Array<{ id: string; name: string }>;
    agentResults: Record<string, any>;
    decisions: any[];
    executionMetrics: {
      totalSteps: number;
      executionTime: string;
      agentsCoordinated: number;
      decisionsGenerated: number;
    };
  };
  context: {
    intent: string;
    confidence: number;
    templateEvolution: number;
    institutionalMemoryUpdated: boolean;
  };
}

interface TemplateWorkflowVisualizerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TemplateWorkflowVisualizer: React.FC<TemplateWorkflowVisualizerProps> = ({
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [openTasks, setOpenTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (isVisible) {
      loadTemplateWorkflowData();
    }
  }, [isVisible]);

  const loadTemplateWorkflowData = () => {
    // Simulate loading current template and workflow data
    // In real implementation, this would fetch from the backend
    setTemplateData({
      id: 'template-seasonality-001',
      name: 'Seasonality Analysis Template',
      type: 'business_intelligence',
      status: 'active',
      progress: 85,
      next_steps: {
        immediate_actions: [
          'Review agent recommendations and coordinate implementation',
          'Schedule stakeholder alignment meetings',
          'Prepare resource allocation plans'
        ],
        short_term_goals: [
          'Execute Q4 seasonality strategy with 25% marketing budget increase',
          'Implement 30% safety stock adjustment for top SKUs',
          'Establish weekly marketing-inventory coordination meetings'
        ],
        long_term_objectives: [
          'Build predictive seasonality models for future planning',
          'Develop automated inventory-marketing alignment systems',
          'Create institutional memory repository for seasonal insights'
        ],
        success_metrics: [
          'Q4 revenue growth (target: 28-35%)',
          'Inventory turnover improvement',
          'Stockout incident reduction',
          'Cross-functional coordination effectiveness'
        ],
        learning_opportunities: [
          'Capture decision outcomes for institutional memory',
          'Refine agent coordination protocols',
          'Enhance template effectiveness based on results'
        ]
      },
      historical_actions: [
        {
          timestamp: '2025-01-25T11:32:47.921Z',
          action: 'seasonality_analysis_execution',
          outcome: 'agent_coordination_successful',
          decisions_generated: 2,
          user_context: 'help me figure out the impact of seasonality on my product revenue'
        },
        {
          timestamp: '2025-01-20T09:15:23.445Z',
          action: 'template_refinement',
          outcome: 'effectiveness_improved',
          decisions_generated: 1,
          user_context: 'seasonal demand forecasting for Q4 planning'
        }
      ],
      last_execution: {
        workflowInstanceId: 'workflow-1753443139257',
        executionTime: '2025-01-25T11:32:47.921Z',
        agentResults: ['Marketing Agent', 'Inventory Agent', 'Memory Agent', 'Coordination Agent'],
        decisionsGenerated: 2,
        userQuery: 'help me figure out the impact of seasonality on my product revenue'
      },
      evolution_count: 3,
      effectiveness_score: 0.87
    });

    setWorkflowData({
      id: 'workflow-1753443139257',
      conversation_id: '9b2440e2-4f4c-4f6b-8da4-14db04529c77',
      status: 'completed',
      current_step_id: 'workflow_completion',
      progress: 100,
      data: {
        userQuery: 'help me figure out the impact of seasonality on my product revenue',
        templatesUsed: [
          { id: 'template-seasonality-001', name: 'Seasonality Analysis Template' }
        ],
        agentResults: {
          marketingAgent: { confidence: 0.87 },
          inventoryAgent: { confidence: 0.82 },
          memoryAgent: { confidence: 0.91 },
          coordinationAgent: { confidence: 0.85 }
        },
        decisions: [
          { id: 'decision-action-123', type: 'action', title: 'Q4 Seasonality Strategy Implementation' },
          { id: 'decision-simulation-456', type: 'simulation', title: 'Seasonality Impact Simulation' }
        ],
        executionMetrics: {
          totalSteps: 12,
          executionTime: '15.2s',
          agentsCoordinated: 4,
          decisionsGenerated: 2
        }
      },
      context: {
        intent: 'SeasonalityAnalysis',
        confidence: 1.00,
        templateEvolution: 1,
        institutionalMemoryUpdated: true
      }
    });

    setOpenTasks([
      {
        id: 'task-1',
        title: 'Review Q4 Marketing Budget Allocation',
        description: 'Analyze and approve 25% budget increase for Q4 seasonality campaign',
        status: 'pending',
        priority: 'high',
        assignee: 'Marketing Team',
        dueDate: '2025-02-01',
        progress: 0
      },
      {
        id: 'task-2',
        title: 'Adjust Safety Stock Levels',
        description: 'Implement 30% safety stock adjustment for top-performing SKUs',
        status: 'in_progress',
        priority: 'high',
        assignee: 'Inventory Management',
        dueDate: '2025-01-30',
        progress: 45
      },
      {
        id: 'task-3',
        title: 'Schedule Cross-Functional Meetings',
        description: 'Establish weekly marketing-inventory coordination meetings',
        status: 'completed',
        priority: 'medium',
        assignee: 'Coordination Agent',
        dueDate: '2025-01-28',
        progress: 100
      }
    ]);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Template & Workflow Visualizer</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Open Tasks</TabsTrigger>
              <TabsTrigger value="history">Historical</TabsTrigger>
              <TabsTrigger value="ai-integration">AI Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {templateData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span>{templateData.name}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{templateData.type}</Badge>
                        <Badge variant={templateData.status === 'active' ? 'default' : 'secondary'}>
                          {templateData.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span>{templateData.progress}%</span>
                      </div>
                      <Progress value={templateData.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="font-semibold text-blue-600">{templateData.evolution_count}</div>
                        <div className="text-gray-600">Evolutions</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-semibold text-green-600">
                          {Math.round((templateData.effectiveness_score || 0) * 100)}%
                        </div>
                        <div className="text-gray-600">Effectiveness</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="font-semibold text-purple-600">
                          {templateData.last_execution?.agentResults.length || 0}
                        </div>
                        <div className="text-gray-600">Agents Used</div>
                      </div>
                    </div>

                    {templateData.next_steps && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center">
                          <ChevronRight className="h-4 w-4 mr-1" />
                          Next Steps
                        </h4>
                        
                        <div className="space-y-2">
                          <div>
                            <button
                              onClick={() => toggleSection('immediate')}
                              className="flex items-center text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              {expandedSections.immediate ? 
                                <ChevronDown className="h-3 w-3 mr-1" /> : 
                                <ChevronRight className="h-3 w-3 mr-1" />
                              }
                              Immediate Actions ({templateData.next_steps.immediate_actions.length})
                            </button>
                            {expandedSections.immediate && (
                              <ul className="ml-4 mt-1 space-y-1 text-xs text-gray-600">
                                {templateData.next_steps.immediate_actions.map((action, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-red-500 mr-2">•</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div>
                            <button
                              onClick={() => toggleSection('shortterm')}
                              className="flex items-center text-sm font-medium text-yellow-600 hover:text-yellow-700"
                            >
                              {expandedSections.shortterm ? 
                                <ChevronDown className="h-3 w-3 mr-1" /> : 
                                <ChevronRight className="h-3 w-3 mr-1" />
                              }
                              Short-term Goals ({templateData.next_steps.short_term_goals.length})
                            </button>
                            {expandedSections.shortterm && (
                              <ul className="ml-4 mt-1 space-y-1 text-xs text-gray-600">
                                {templateData.next_steps.short_term_goals.map((goal, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-yellow-500 mr-2">•</span>
                                    {goal}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div>
                            <button
                              onClick={() => toggleSection('longterm')}
                              className="flex items-center text-sm font-medium text-green-600 hover:text-green-700"
                            >
                              {expandedSections.longterm ? 
                                <ChevronDown className="h-3 w-3 mr-1" /> : 
                                <ChevronRight className="h-3 w-3 mr-1" />
                              }
                              Long-term Objectives ({templateData.next_steps.long_term_objectives.length})
                            </button>
                            {expandedSections.longterm && (
                              <ul className="ml-4 mt-1 space-y-1 text-xs text-gray-600">
                                {templateData.next_steps.long_term_objectives.map((objective, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-green-500 mr-2">•</span>
                                    {objective}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {workflowData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span>Current Workflow</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(workflowData.status)}
                        <span className="font-medium">{workflowData.status.replace('_', ' ')}</span>
                      </div>
                      <Badge variant="outline">
                        {workflowData.context.intent} ({Math.round(workflowData.context.confidence * 100)}%)
                      </Badge>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Workflow Progress</span>
                        <span>{workflowData.progress}%</span>
                      </div>
                      <Progress value={workflowData.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Execution Metrics</div>
                        <div className="mt-1 space-y-1 text-xs text-gray-600">
                          <div>Steps: {workflowData.data.executionMetrics.totalSteps}</div>
                          <div>Time: {workflowData.data.executionMetrics.executionTime}</div>
                          <div>Agents: {workflowData.data.executionMetrics.agentsCoordinated}</div>
                          <div>Decisions: {workflowData.data.executionMetrics.decisionsGenerated}</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Context</div>
                        <div className="mt-1 space-y-1 text-xs text-gray-600">
                          <div>Templates Evolved: {workflowData.context.templateEvolution}</div>
                          <div>Memory Updated: {workflowData.context.institutionalMemoryUpdated ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="grid gap-3">
                {openTasks.map((task) => (
                  <Card key={task.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(task.status)}
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          {task.progress !== undefined && (
                            <div className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{task.progress}%</span>
                              </div>
                              <Progress value={task.progress} className="h-1" />
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {task.assignee && (
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {task.assignee}
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {templateData?.historical_actions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="h-5 w-5 text-purple-600" />
                      <span>Historical Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {templateData.historical_actions.map((action, idx) => (
                        <div key={idx} className="border-l-2 border-purple-200 pl-4 pb-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-sm">{action.action.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(action.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            Outcome: {action.outcome.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            Decisions Generated: {action.decisions_generated} | 
                            Context: {action.user_context.substring(0, 50)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ai-integration" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <span>AI Components Integration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">KnowledgeGraph</span>
                        </div>
                        <div className="text-xs text-blue-700 space-y-1">
                          <div>✅ Query Enhancement Active</div>
                          <div>✅ Concept Relationship Mapping</div>
                          <div>✅ Domain Knowledge Integration</div>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">MOLAS</span>
                        </div>
                        <div className="text-xs text-green-700 space-y-1">
                          <div>✅ Multi-layered Analysis</div>
                          <div>✅ Pattern Recognition</div>
                          <div>✅ Decision Generation</div>
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Eye className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-purple-800">Contextual Retrieval</span>
                        </div>
                        <div className="text-xs text-purple-700 space-y-1">
                          <div>✅ Memory Type Tagging</div>
                          <div>✅ Semantic Search</div>
                          <div>✅ Context Assembly</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Integration Points</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>• Message enhancement with knowledge graph context</div>
                        <div>• MOLAS-driven decision generation and business analysis</div>
                        <div>• Contextual retrieval for institutional memory access</div>
                        <div>• Template evolution using AI-enhanced insights</div>
                        <div>• Agent coordination with knowledge-aware processing</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TemplateWorkflowVisualizer;
