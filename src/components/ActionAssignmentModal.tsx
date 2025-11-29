import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Clock, 
  Target, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Edit,
  Star,
  Zap,
  Shield
} from 'lucide-react';

interface ActionAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: {
    id: string;
    title: string;
    description: string;
    expectedOutcome: string;
    estimatedTimeframe: string;
    priority: 'low' | 'medium' | 'high';
    complexity: 'low' | 'medium' | 'high';
    requiredCapabilities: string[];
  };
  agentAssignment?: {
    type: 'existing_agent_assigned' | 'new_agent_created' | 'fallback_agent_created';
    agent: {
      id: string;
      name: string;
      type: string;
      backstory: string;
      capabilities: string[];
      algorithms: string[];
      experience: string;
      personality: string;
      workingStyle: string;
      expectedPerformance: {
        accuracy: number;
        efficiency: number;
        timeToCompletion: string;
      };
    };
    suitabilityScore: number;
    assignmentReason: string;
  };
  taskAssignment?: {
    assignmentId: string;
    milestones: Array<{
      id: string;
      title: string;
      description: string;
      estimatedCompletion: string;
      status: string;
    }>;
    riskAssessment: {
      overallRisk: string;
      risks: Array<{
        type: string;
        severity: string;
        description: string;
        mitigation: string;
      }>;
      recommendedActions: string[];
    };
  };
  onApprove: () => void;
  onModify: () => void;
  onCancel: () => void;
}

export const ActionAssignmentModal: React.FC<ActionAssignmentModalProps> = ({
  isOpen,
  onClose,
  action,
  agentAssignment,
  taskAssignment,
  onApprove,
  onModify,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'bg-purple-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'specialized': return <Star className="w-5 h-5 text-yellow-400" />;
      case 'existing': return <User className="w-5 h-5 text-blue-400" />;
      case 'fallback': return <Shield className="w-5 h-5 text-gray-400" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-blue-400" />
            Action Assignment
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
            <TabsTrigger value="agent" className="text-white">Agent Details</TabsTrigger>
            <TabsTrigger value="execution" className="text-white">Execution Plan</TabsTrigger>
            <TabsTrigger value="risks" className="text-white">Risk Assessment</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Task Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {action ? (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{action.title}</h3>
                    <p className="text-gray-300 mb-4">{action.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={`${getPriorityColor(action.priority)} text-white`}>
                        {action.priority.toUpperCase()} Priority
                      </Badge>
                      <Badge className={`${getComplexityColor(action.complexity)} text-white`}>
                        {action.complexity.toUpperCase()} Complexity
                      </Badge>
                      <Badge variant="outline" className="text-gray-300 border-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        {action.estimatedTimeframe}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Required Capabilities</h4>
                        <div className="flex flex-wrap gap-1">
                          {action.requiredCapabilities.map((cap, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-slate-700 text-gray-300">
                              {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                      <div>
                        <h4 className="font-semibold text-white mb-2">Expected Outcome</h4>
                        <p className="text-gray-300 text-sm">{action.expectedOutcome}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 font-semibold">No action data available</p>
                    <p className="text-gray-500 text-sm">Action information is not currently loaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agent Assignment Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {agentAssignment ? getAgentTypeIcon(agentAssignment.agent.type) : <User className="w-5 h-5 text-blue-400" />}
                  Agent Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agentAssignment ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{agentAssignment.agent.name}</h3>
                          <p className="text-gray-400 text-sm">{agentAssignment.assignmentReason}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            {Math.round(agentAssignment.suitabilityScore * 100)}%
                          </div>
                          <div className="text-xs text-gray-400">Suitability</div>
                        </div>
                      </div>
                      
                      <Progress 
                        value={agentAssignment.suitabilityScore * 100} 
                        className="mb-2" 
                      />
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-blue-400">
                            {Math.round(agentAssignment.agent.expectedPerformance.accuracy * 100)}%
                          </div>
                          <div className="text-xs text-gray-400">Accuracy</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-400">
                            {Math.round(agentAssignment.agent.expectedPerformance.efficiency * 100)}%
                          </div>
                          <div className="text-xs text-gray-400">Efficiency</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-yellow-400">
                            {agentAssignment.agent.expectedPerformance.timeToCompletion}
                          </div>
                          <div className="text-xs text-gray-400">Timeline</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 font-semibold">No agent assignment available</p>
                      <p className="text-gray-500 text-sm">Agent assignment information is not currently loaded</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Details Tab */}
          <TabsContent value="agent" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Agent Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentAssignment ? (
                  <div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Backstory</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{agentAssignment.agent.backstory}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Experience</h4>
                        <p className="text-gray-300 text-sm">{agentAssignment.agent.experience}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-2">Working Style</h4>
                        <p className="text-gray-300 text-sm">{agentAssignment.agent.workingStyle}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">Personality</h4>
                      <p className="text-gray-300 text-sm">{agentAssignment.agent.personality}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">Core Capabilities</h4>
                      <div className="flex flex-wrap gap-2">
                        {agentAssignment.agent.capabilities.map((capability, index) => (
                          <Badge key={index} variant="outline" className="text-blue-300 border-blue-600">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">Specialized Algorithms</h4>
                      <ul className="space-y-1">
                        {agentAssignment.agent.algorithms.map((algorithm, index) => (
                          <li key={index} className="text-gray-300 text-sm flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            {algorithm}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 font-semibold">No agent profile available</p>
                    <p className="text-gray-500 text-sm">Agent profile information is not currently loaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Execution Plan Tab */}
          <TabsContent value="execution" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-400" />
                  Execution Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taskAssignment ? (
                  <div className="space-y-4">
                    {taskAssignment.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-start gap-4 p-3 rounded-lg bg-slate-700">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-semibold text-white">{milestone.title}</h4>
                        <p className="text-gray-300 text-sm mb-2">{milestone.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                            {milestone.estimatedCompletion} Complete
                          </Badge>
                          <Badge 
                            variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {milestone.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No execution plan available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Assessment Tab */}
          <TabsContent value="risks" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {taskAssignment ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-white font-semibold">Overall Risk Level:</span>
                      <Badge className={`${getRiskColor(taskAssignment.riskAssessment.overallRisk)} border-current`} variant="outline">
                        {taskAssignment.riskAssessment.overallRisk.toUpperCase()}
                      </Badge>
                    </div>

                    {taskAssignment.riskAssessment.risks.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">Identified Risks</h4>
                    {taskAssignment.riskAssessment.risks.map((risk, index) => (
                      <div key={index} className="p-3 rounded-lg bg-slate-700 border-l-4 border-yellow-500">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{risk.type.replace('_', ' ').toUpperCase()}</span>
                          <Badge className={getRiskColor(risk.severity)} variant="outline">
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{risk.description}</p>
                        <p className="text-blue-300 text-sm">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 font-semibold">No significant risks identified</p>
                    <p className="text-gray-400 text-sm">This task appears to be well-matched to the assigned agent</p>
                  </div>
                )}

                    <div>
                      <h4 className="font-semibold text-white mb-2">Recommended Actions</h4>
                      <ul className="space-y-1">
                        {taskAssignment.riskAssessment.recommendedActions.map((action, index) => (
                          <li key={index} className="text-gray-300 text-sm flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-400" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No risk assessment available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="outline" onClick={onCancel} className="text-gray-300 border-gray-600 hover:bg-slate-700">
            Cancel
          </Button>
          <Button variant="outline" onClick={onModify} className="text-blue-300 border-blue-600 hover:bg-blue-900">
            <Edit className="w-4 h-4 mr-2" />
            Modify
          </Button>
          <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700 text-white">
            <Play className="w-4 h-4 mr-2" />
            Approve & Execute
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
