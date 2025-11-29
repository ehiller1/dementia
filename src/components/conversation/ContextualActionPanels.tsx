import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  Target, 
  FileText, 
  TrendingUp, 
  Users, 
  Calendar,
  Database,
  BarChart3,
  Zap,
  ArrowRight,
  Plus,
  Eye,
  Download,
  Share2,
  Settings
} from 'lucide-react';
import { useOrchestration } from '@/services/context/OrchestrationContext';

interface ContextualAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'quick-actions' | 'data-insights' | 'templates' | 'agents';
  priority: 'high' | 'medium' | 'low';
  onClick: () => void;
  disabled?: boolean;
}

interface ContextualActionPanelsProps {
  conversationContext: {
    messages: Array<{ role: string; content: string }>;
    currentPhase?: string;
    detectedEntities?: string[];
    suggestedWorkflow?: string;
  };
  onActionExecute: (actionId: string, payload?: any) => void;
  onNavigate: (screen: string) => void;
}

export const ContextualActionPanels: React.FC<ContextualActionPanelsProps> = ({
  conversationContext,
  onActionExecute,
  onNavigate
}) => {
  const [activePanel, setActivePanel] = useState<string>('quick-actions');
  const [contextualActions, setContextualActions] = useState<ContextualAction[]>([]);
  const { eventBus } = useOrchestration();

  // Live chips state
  const [actionCounts, setActionCounts] = useState<{ running: number; needs_input: number; blocked: number; error: number; done: number }>({
    running: 0,
    needs_input: 0,
    blocked: 0,
    error: 0,
    done: 0,
  });
  const [insightCount, setInsightCount] = useState<number>(0);
  const [agentHintCount, setAgentHintCount] = useState<number>(0);

  // Analyze conversation context and generate contextual actions
  useEffect(() => {
    const actions = generateContextualActions(conversationContext);
    setContextualActions(actions);
  }, [conversationContext]);

  // Subscribe to action lifecycle and narrative/insight events
  useEffect(() => {
    const createdSub = eventBus.subscribe('action.created', (evt) => {
      setActionCounts((prev) => ({ ...prev, running: prev.running + 1 }));
    });
    const statusSub = eventBus.subscribe('action.status_changed', (evt) => {
      setActionCounts((prev) => {
        const next = { ...prev };
        // Decrement from any previous inferred bucket is not tracked here; we only increment target bucket for lightweight UI signal
        switch (evt.status) {
          case 'running': next.running += 1; break;
          case 'needs_user_input': next.needs_input += 1; break;
          case 'blocked': next.blocked += 1; break;
          case 'error': next.error += 1; break;
          case 'done': next.done += 1; break;
        }
        return next;
      });
    });
    const narrativeSub = eventBus.subscribe('narrative.item', (evt) => {
      // Treat narrative items with type 'insight' as insights
      if (evt?.type === 'insight' || evt?.eventType === 'insight.created') {
        setInsightCount((c) => c + 1);
      }
    });
    const insightSub = eventBus.subscribe('insight.created', () => {
      setInsightCount((c) => c + 1);
    });

    // Heuristic: when agents are suggested via decisions or events (optional future wiring)
    const agentSuggestSub = eventBus.subscribe('agent.suggested', () => {
      setAgentHintCount((c) => c + 1);
    });

    return () => {
      createdSub.unsubscribe();
      statusSub.unsubscribe();
      narrativeSub.unsubscribe();
      insightSub.unsubscribe();
      agentSuggestSub.unsubscribe();
    };
  }, [eventBus]);

  const generateContextualActions = (context: typeof conversationContext): ContextualAction[] => {
    const actions: ContextualAction[] = [];
    const lastMessage = context.messages[context.messages.length - 1]?.content?.toLowerCase() || '';
    const entities = context.detectedEntities || [];

    // Quick Actions based on conversation content
    if (lastMessage.includes('data') || lastMessage.includes('analysis')) {
      actions.push({
        id: 'upload-data',
        title: 'Upload Data File',
        description: 'Upload spreadsheet or CSV for analysis',
        icon: Database,
        category: 'quick-actions',
        priority: 'high',
        onClick: () => onActionExecute('upload-data')
      });

      actions.push({
        id: 'create-dashboard',
        title: 'Create Dashboard',
        description: 'Generate interactive data dashboard',
        icon: BarChart3,
        category: 'quick-actions',
        priority: 'medium',
        onClick: () => onActionExecute('create-dashboard')
      });
    }

    if (lastMessage.includes('meeting') || lastMessage.includes('schedule')) {
      actions.push({
        id: 'schedule-meeting',
        title: 'Schedule Meeting',
        description: 'Create calendar event with stakeholders',
        icon: Calendar,
        category: 'quick-actions',
        priority: 'high',
        onClick: () => onActionExecute('schedule-meeting')
      });
    }

    if (lastMessage.includes('report') || lastMessage.includes('summary')) {
      actions.push({
        id: 'generate-report',
        title: 'Generate Report',
        description: 'Create comprehensive analysis report',
        icon: FileText,
        category: 'quick-actions',
        priority: 'medium',
        onClick: () => onActionExecute('generate-report')
      });

      actions.push({
        id: 'export-summary',
        title: 'Export Summary',
        description: 'Download conversation summary',
        icon: Download,
        category: 'quick-actions',
        priority: 'low',
        onClick: () => onActionExecute('export-summary')
      });
    }

    // Template suggestions based on detected patterns
    if (entities.includes('seasonality') || lastMessage.includes('seasonal')) {
      actions.push({
        id: 'seasonality-template',
        title: 'Seasonality Analysis Template',
        description: 'Pre-built template for seasonal trend analysis',
        icon: TrendingUp,
        category: 'templates',
        priority: 'high',
        onClick: () => onActionExecute('apply-template', { templateId: 'seasonality-analysis' })
      });
    }

    if (entities.includes('marketing') || lastMessage.includes('campaign')) {
      actions.push({
        id: 'marketing-template',
        title: 'Marketing Campaign Template',
        description: 'Template for campaign performance analysis',
        icon: Target,
        category: 'templates',
        priority: 'high',
        onClick: () => onActionExecute('apply-template', { templateId: 'marketing-campaign' })
      });
    }

    // Agent suggestions based on context
    if (lastMessage.includes('customer') || lastMessage.includes('feedback')) {
      actions.push({
        id: 'customer-agent',
        title: 'Customer Analysis Agent',
        description: 'Specialized agent for customer insights',
        icon: Users,
        category: 'agents',
        priority: 'high',
        onClick: () => onActionExecute('suggest-agent', { agentType: 'customer-analysis' })
      });
    }

    if (lastMessage.includes('inventory') || lastMessage.includes('stock')) {
      actions.push({
        id: 'inventory-agent',
        title: 'Inventory Optimization Agent',
        description: 'Agent for supply chain and inventory analysis',
        icon: Database,
        category: 'agents',
        priority: 'medium',
        onClick: () => onActionExecute('suggest-agent', { agentType: 'inventory-optimization' })
      });
    }

    // Data insights based on conversation
    if (context.messages.length > 3) {
      actions.push({
        id: 'conversation-insights',
        title: 'Conversation Insights',
        description: 'Key themes and patterns from discussion',
        icon: Lightbulb,
        category: 'data-insights',
        priority: 'medium',
        onClick: () => onActionExecute('show-insights')
      });
    }

    return actions;
  };

  const getActionsByCategory = (category: string) => {
    return contextualActions.filter(action => action.category === category);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const panels = [
    { id: 'quick-actions', label: 'Quick Actions', icon: Zap },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'agents', label: 'Agents', icon: Users },
    { id: 'data-insights', label: 'Insights', icon: TrendingUp }
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4" />
          Contextual Actions
          {/* Live chips */}
          {actionCounts.running > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px]">Running {actionCounts.running}</Badge>
          )}
          {actionCounts.needs_input > 0 && (
            <Badge variant="outline" className="ml-1 text-[10px]">Needs input {actionCounts.needs_input}</Badge>
          )}
          {insightCount > 0 && (
            <Badge variant="outline" className="ml-1 text-[10px]">Insights {insightCount}</Badge>
          )}
          {agentHintCount > 0 && (
            <Badge variant="outline" className="ml-1 text-[10px]">Agents {agentHintCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Panel Tabs */}
        <div className="flex flex-wrap gap-1">
          {panels.map((panel) => {
            const Icon = panel.icon;
            const actionsCount = getActionsByCategory(panel.id).length;
            
            return (
              <Button
                key={panel.id}
                variant={activePanel === panel.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActivePanel(panel.id)}
                className="text-xs h-8"
                disabled={actionsCount === 0}
              >
                <Icon className="h-3 w-3 mr-1" />
                {panel.label}
                {actionsCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {actionsCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        <Separator />

        {/* Actions List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {getActionsByCategory(activePanel).length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No {activePanel.replace('-', ' ')} available for current context
            </div>
          ) : (
            getActionsByCategory(activePanel).map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  className="flex items-start gap-3 p-2 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={action.onClick}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{action.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1 py-0 ${getPriorityColor(action.priority)}`}
                      >
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              );
            })
          )}
        </div>

        {/* Navigation Actions */}
        {contextualActions.length > 0 && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('command-center')}
                className="flex-1 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Command Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onActionExecute('share-context')}
                className="flex-1 text-xs"
              >
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
