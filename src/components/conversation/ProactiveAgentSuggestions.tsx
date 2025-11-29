import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Brain, 
  Zap, 
  Target, 
  TrendingUp,
  Users,
  Database,
  FileText,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Calendar,
  MessageSquare,
  Code,
  Lightbulb,
  ArrowRight,
  Plus,
  Star,
  Clock
} from 'lucide-react';

interface AgentCapability {
  id: string;
  name: string;
  description: string;
  confidence: number;
}

interface SuggestedAgent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  specialization: string;
  capabilities: AgentCapability[];
  relevanceScore: number;
  estimatedValue: 'high' | 'medium' | 'low';
  triggerReason: string;
  suggestedActions: string[];
  isAvailable: boolean;
  lastUsed?: Date;
  successRate?: number;
}

interface ProactiveAgentSuggestionsProps {
  conversationContext: {
    messages: Array<{ role: string; content: string }>;
    currentPhase?: string;
    detectedEntities?: string[];
    userIntent?: string;
    workflowType?: string;
  };
  availableAgents: Array<{
    id: string;
    name: string;
    type: string;
    status: 'available' | 'busy' | 'offline';
  }>;
  onAgentSelect: (agentId: string, action?: string) => void;
  onCreateAgent: (agentSpec: any) => void;
  onNavigate: (screen: string) => void;
}

export const ProactiveAgentSuggestions: React.FC<ProactiveAgentSuggestionsProps> = ({
  conversationContext,
  availableAgents,
  onAgentSelect,
  onCreateAgent,
  onNavigate
}) => {
  const [suggestedAgents, setSuggestedAgents] = useState<SuggestedAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showCreateAgent, setShowCreateAgent] = useState(false);

  // Analyze conversation and suggest relevant agents
  useEffect(() => {
    const agents = analyzeAndSuggestAgents(conversationContext);
    setSuggestedAgents(agents);
  }, [conversationContext]);

  const analyzeAndSuggestAgents = (context: typeof conversationContext): SuggestedAgent[] => {
    const agents: SuggestedAgent[] = [];
    const lastMessage = context.messages[context.messages.length - 1]?.content?.toLowerCase() || '';
    const allMessages = context.messages.map(m => m.content.toLowerCase()).join(' ');
    const entities = context.detectedEntities || [];

    // Data Analysis Agent
    if (lastMessage.includes('data') || lastMessage.includes('analyze') || lastMessage.includes('insights')) {
      agents.push({
        id: 'data-analyst',
        name: 'Data Analysis Specialist',
        description: 'Expert in statistical analysis, data visualization, and insights generation',
        specialization: 'Data Science',
        relevanceScore: 0.92,
        estimatedValue: 'high',
        triggerReason: 'Data analysis keywords detected in conversation',
        isAvailable: true,
        capabilities: [
          {
            id: 'statistical-analysis',
            name: 'Statistical Analysis',
            description: 'Advanced statistical modeling and hypothesis testing',
            confidence: 0.95
          },
          {
            id: 'data-visualization',
            name: 'Data Visualization',
            description: 'Create compelling charts and interactive dashboards',
            confidence: 0.88
          },
          {
            id: 'pattern-recognition',
            name: 'Pattern Recognition',
            description: 'Identify trends and anomalies in complex datasets',
            confidence: 0.91
          }
        ],
        suggestedActions: [
          'Analyze uploaded dataset',
          'Create data visualization dashboard',
          'Generate insights report',
          'Perform statistical testing'
        ],
        successRate: 0.87
      });
    }

    // Marketing Specialist Agent
    if (allMessages.includes('marketing') || allMessages.includes('campaign') || allMessages.includes('customer')) {
      agents.push({
        id: 'marketing-specialist',
        name: 'Marketing Campaign Expert',
        description: 'Specialized in campaign strategy, customer analysis, and ROI optimization',
        specialization: 'Marketing',
        relevanceScore: 0.85,
        estimatedValue: 'high',
        triggerReason: 'Marketing and customer-related content identified',
        isAvailable: true,
        capabilities: [
          {
            id: 'campaign-strategy',
            name: 'Campaign Strategy',
            description: 'Develop comprehensive marketing campaign strategies',
            confidence: 0.92
          },
          {
            id: 'customer-segmentation',
            name: 'Customer Segmentation',
            description: 'Advanced customer profiling and segmentation',
            confidence: 0.89
          },
          {
            id: 'roi-optimization',
            name: 'ROI Optimization',
            description: 'Maximize marketing return on investment',
            confidence: 0.86
          }
        ],
        suggestedActions: [
          'Analyze customer segments',
          'Design campaign strategy',
          'Optimize marketing spend',
          'Create performance dashboard'
        ],
        successRate: 0.83
      });
    }

    // Financial Analysis Agent
    if (lastMessage.includes('financial') || lastMessage.includes('budget') || lastMessage.includes('revenue')) {
      agents.push({
        id: 'financial-analyst',
        name: 'Financial Analysis Expert',
        description: 'Specialized in financial modeling, budgeting, and investment analysis',
        specialization: 'Finance',
        relevanceScore: 0.88,
        estimatedValue: 'high',
        triggerReason: 'Financial analysis requirements detected',
        isAvailable: true,
        capabilities: [
          {
            id: 'financial-modeling',
            name: 'Financial Modeling',
            description: 'Build comprehensive financial models and forecasts',
            confidence: 0.94
          },
          {
            id: 'risk-analysis',
            name: 'Risk Analysis',
            description: 'Assess and quantify financial risks',
            confidence: 0.87
          },
          {
            id: 'investment-analysis',
            name: 'Investment Analysis',
            description: 'Evaluate investment opportunities and ROI',
            confidence: 0.90
          }
        ],
        suggestedActions: [
          'Create financial model',
          'Analyze budget variance',
          'Assess investment opportunities',
          'Generate financial reports'
        ],
        successRate: 0.91
      });
    }

    // Operations Optimization Agent
    if (lastMessage.includes('operations') || lastMessage.includes('efficiency') || lastMessage.includes('process')) {
      agents.push({
        id: 'operations-optimizer',
        name: 'Operations Optimization Specialist',
        description: 'Expert in process improvement, efficiency analysis, and operational excellence',
        specialization: 'Operations',
        relevanceScore: 0.79,
        estimatedValue: 'medium',
        triggerReason: 'Operational efficiency topics identified',
        isAvailable: true,
        capabilities: [
          {
            id: 'process-analysis',
            name: 'Process Analysis',
            description: 'Analyze and optimize business processes',
            confidence: 0.88
          },
          {
            id: 'efficiency-metrics',
            name: 'Efficiency Metrics',
            description: 'Develop and track operational KPIs',
            confidence: 0.85
          },
          {
            id: 'automation-opportunities',
            name: 'Automation Opportunities',
            description: 'Identify processes suitable for automation',
            confidence: 0.82
          }
        ],
        suggestedActions: [
          'Analyze current processes',
          'Identify bottlenecks',
          'Recommend optimizations',
          'Create efficiency dashboard'
        ],
        successRate: 0.78
      });
    }

    // Content Strategy Agent
    if (lastMessage.includes('content') || lastMessage.includes('writing') || lastMessage.includes('communication')) {
      agents.push({
        id: 'content-strategist',
        name: 'Content Strategy Expert',
        description: 'Specialized in content creation, strategy, and communication optimization',
        specialization: 'Content',
        relevanceScore: 0.76,
        estimatedValue: 'medium',
        triggerReason: 'Content and communication needs detected',
        isAvailable: true,
        capabilities: [
          {
            id: 'content-planning',
            name: 'Content Planning',
            description: 'Develop comprehensive content strategies',
            confidence: 0.89
          },
          {
            id: 'audience-analysis',
            name: 'Audience Analysis',
            description: 'Analyze target audience preferences and behavior',
            confidence: 0.84
          },
          {
            id: 'performance-optimization',
            name: 'Performance Optimization',
            description: 'Optimize content for engagement and conversion',
            confidence: 0.81
          }
        ],
        suggestedActions: [
          'Create content strategy',
          'Analyze audience engagement',
          'Optimize content performance',
          'Generate content calendar'
        ],
        successRate: 0.82
      });
    }

    return agents.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const getSpecializationIcon = (specialization: string) => {
    switch (specialization.toLowerCase()) {
      case 'data science': return Database;
      case 'marketing': return Target;
      case 'finance': return DollarSign;
      case 'operations': return BarChart3;
      case 'content': return FileText;
      default: return Bot;
    }
  };

  const getValueColor = (value: string) => {
    switch (value) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getAgentInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          Proactive Agent Suggestions
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Suggested Agents */}
        {suggestedAgents.length > 0 ? (
          <div className="space-y-3">
            {suggestedAgents.map((agent) => {
              const SpecializationIcon = getSpecializationIcon(agent.specialization);
              
              return (
                <div
                  key={agent.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedAgent === agent.id 
                      ? 'border-primary bg-accent/50' 
                      : 'hover:bg-accent/30'
                  }`}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={agent.avatar} />
                      <AvatarFallback className="text-xs">
                        {getAgentInitials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{agent.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0 ${getValueColor(agent.estimatedValue)}`}
                        >
                          {agent.estimatedValue} value
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <SpecializationIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{agent.specialization}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(agent.relevanceScore * 100)}% match
                        </span>
                        {agent.successRate && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(agent.successRate * 100)}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {agent.description}
                      </p>
                      
                      <div className="text-xs text-muted-foreground bg-accent/30 rounded px-2 py-1">
                        <Lightbulb className="h-3 w-3 inline mr-1" />
                        {agent.triggerReason}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedAgent === agent.id && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {/* Capabilities */}
                      <div>
                        <h5 className="text-xs font-medium mb-2">Key Capabilities</h5>
                        <div className="space-y-1">
                          {agent.capabilities.map((capability) => (
                            <div key={capability.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{capability.name}</span>
                              <Badge variant="outline" className="text-xs px-1">
                                {Math.round(capability.confidence * 100)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Actions */}
                      <div>
                        <h5 className="text-xs font-medium mb-2">Suggested Actions</h5>
                        <div className="grid grid-cols-2 gap-1">
                          {agent.suggestedActions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 justify-start"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAgentSelect(agent.id, action);
                              }}
                            >
                              {action}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Main Action */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAgentSelect(agent.id);
                        }}
                        className="w-full"
                        size="sm"
                      >
                        <Bot className="h-3 w-3 mr-2" />
                        Activate {agent.name}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-6">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Continue the conversation to get agent suggestions</p>
          </div>
        )}

        {/* Create Custom Agent */}
        {suggestedAgents.length > 0 && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateAgent(true)}
                className="flex-1 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Custom Agent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('agent-create')}
                className="flex-1 text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Agent Builder
              </Button>
            </div>
          </>
        )}

        {/* Quick Agent Creation */}
        {showCreateAgent && (
          <div className="border rounded-lg p-3 bg-accent/30">
            <h4 className="font-medium text-sm mb-2">Quick Agent Creation</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Based on your conversation, we can create a specialized agent for your specific needs.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onCreateAgent({
                    type: 'conversation-specific',
                    context: conversationContext,
                    capabilities: ['analysis', 'recommendations', 'automation']
                  });
                  setShowCreateAgent(false);
                }}
                className="flex-1 text-xs"
              >
                Create Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateAgent(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
