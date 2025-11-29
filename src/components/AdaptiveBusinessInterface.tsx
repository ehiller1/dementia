import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WindsurfConversationInterface } from '@/components/WindsurfConversationInterface';
import { TaskSuggestionPanel } from '@/components/task-automation/TaskSuggestionPanel';
import RoleSwitchBanner from '@/components/RoleSwitchBanner';
import { useEnhancedUnifiedConversation } from '@/contexts/EnhancedUnifiedConversationProvider';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  DollarSign, 
  Target,
  FileSpreadsheet,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

// Engagement phases
type EngagementPhase = 'discovery' | 'analysis' | 'decision' | 'action';

// Role-specific component configurations
interface ComponentConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  priority: number;
  phases: EngagementPhase[];
  roles: ('builder' | 'operator')[];
}

const COMPONENT_CONFIGS: ComponentConfig[] = [
  {
    id: 'conversation',
    title: 'Business Intelligence Chat',
    icon: <Lightbulb className="h-4 w-4" />,
    priority: 1,
    phases: ['discovery', 'analysis', 'decision', 'action'],
    roles: ['builder', 'operator']
  },
  {
    id: 'market-analysis',
    title: 'Market Analysis',
    icon: <BarChart3 className="h-4 w-4" />,
    priority: 2,
    phases: ['analysis', 'decision'],
    roles: ['builder']
  },
  {
    id: 'financial-modeling',
    title: 'Financial Projections',
    icon: <DollarSign className="h-4 w-4" />,
    priority: 3,
    phases: ['analysis', 'decision'],
    roles: ['builder']
  },
  {
    id: 'kpi-dashboard',
    title: 'KPI Monitor',
    icon: <Target className="h-4 w-4" />,
    priority: 2,
    phases: ['analysis', 'decision', 'action'],
    roles: ['operator']
  },
  {
    id: 'action-center',
    title: 'Action Center',
    icon: <CheckCircle className="h-4 w-4" />,
    priority: 3,
    phases: ['decision', 'action'],
    roles: ['operator']
  },
  {
    id: 'data-upload',
    title: 'Data Upload',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    priority: 4,
    phases: ['discovery', 'analysis'],
    roles: ['builder']
  },
  {
    id: 'task-automation',
    title: 'Task Suggestions',
    icon: <Settings className="h-4 w-4" />,
    priority: 5,
    phases: ['analysis', 'decision', 'action'],
    roles: ['builder', 'operator']
  }
];

/**
 * AdaptiveBusinessInterface
 * 
 * Dynamically renders UI components based on:
 * - Detected role (builder/operator)
 * - Current engagement phase (discovery/analysis/decision/action)
 * - Available data and context
 * 
 * Replaces cluttered static layouts with progressive disclosure.
 */
export default function AdaptiveBusinessInterface() {
  const {
    uiMode,
    roleContext,
    messages,
    contextCards,
    conversationId,
    lastIntentClassification,
    lastOrchestrationResult
  } = useUnifiedConversation();

  // Detect current engagement phase based on conversation state
  const currentPhase = useMemo((): EngagementPhase => {
    if (!messages || messages.length <= 1) return 'discovery';
    
    const hasData = contextCards && contextCards.length > 0;
    const hasAnalysis = lastOrchestrationResult?.insights?.length > 0;
    const hasRecommendations = lastOrchestrationResult?.recommendations?.length > 0;
    
    if (hasRecommendations) return 'decision';
    if (hasAnalysis || hasData) return 'analysis';
    return 'discovery';
  }, [messages, contextCards, lastOrchestrationResult]);

  // Determine which components to show
  const activeComponents = useMemo(() => {
    const role = roleContext?.role || 'builder';
    
    return COMPONENT_CONFIGS
      .filter(config => 
        config.roles.includes(role) && 
        config.phases.includes(currentPhase)
      )
      .sort((a, b) => a.priority - b.priority);
  }, [roleContext?.role, currentPhase]);

  // Generate contextual insights based on current state
  const contextualInsights = useMemo(() => {
    const insights: string[] = [];
    const role = roleContext?.role || 'builder';
    const intent = lastIntentClassification?.intent;
    
    if (currentPhase === 'discovery') {
      if (role === 'builder') {
        insights.push('Ready to analyze business scenarios and model outcomes');
      } else {
        insights.push('Monitoring system ready for operational insights');
      }
    }
    
    if (currentPhase === 'analysis' && intent) {
      if (intent.includes('BUSINESS') || intent.includes('MARKET')) {
        insights.push('Business intelligence analysis in progress');
      }
      if (role === 'builder') {
        insights.push('Deep analysis tools available for root cause investigation');
      }
    }
    
    return insights;
  }, [currentPhase, roleContext?.role, lastIntentClassification]);

  // Render individual component panels
  const renderComponent = (config: ComponentConfig) => {
    switch (config.id) {
      case 'conversation':
        return (
          <Card key={config.id} className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {config.icon}
                  <CardTitle className="text-lg">{config.title}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {currentPhase}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <WindsurfConversationInterface />
            </CardContent>
          </Card>
        );

      case 'market-analysis':
        return (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {config.icon}
                <CardTitle className="text-lg">{config.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="justify-start">
                    <MapPin className="h-3 w-3 mr-2" />
                    Location Analysis
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Users className="h-3 w-3 mr-2" />
                    Demographics
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="h-3 w-3 mr-2" />
                  Competitive Landscape
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'financial-modeling':
        return (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {config.icon}
                <CardTitle className="text-lg">{config.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <DollarSign className="h-3 w-3 mr-2" />
                  ROI Calculator
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="h-3 w-3 mr-2" />
                  Scenario Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'kpi-dashboard':
        return (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {config.icon}
                <CardTitle className="text-lg">{config.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-sm font-medium">$2.4M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Growth</span>
                  <span className="text-sm font-medium text-green-600">+12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alerts</span>
                  <Badge variant="secondary" className="text-xs">3</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'action-center':
        return (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {config.icon}
                <CardTitle className="text-lg">{config.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button size="sm" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Execute Plan
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <AlertTriangle className="h-3 w-3 mr-2" />
                  Review Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'data-upload':
        return (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {config.icon}
                <CardTitle className="text-lg">{config.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  // Navigate to data uploader or show upload modal
                  alert('Data upload functionality - integrate with existing SemanticFileUpload component');
                }}
              >
                Upload Business Data
              </Button>
            </CardContent>
          </Card>
        );

      case 'task-automation':
        return (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {config.icon}
                <CardTitle className="text-lg">{config.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <TaskSuggestionPanel
                conversationId={conversationId || 'adaptive_interface'}
                messages={messages}
                context={contextCards}
                debounceMs={500}
              />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10">
      {/* Role and Phase Status */}
      <div className="mb-4 space-y-3">
        <RoleSwitchBanner />
        
        {/* Contextual Insights */}
        {contextualInsights.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  {contextualInsights.map((insight, index) => (
                    <p key={index} className="text-sm text-blue-800">{insight}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Phase Indicator */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Phase: {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}</span>
          <span>•</span>
          <span>Role: {roleContext?.role || 'builder'}</span>
          <span>•</span>
          <span>{activeComponents.length} active tools</span>
        </div>
      </div>

      {/* Dynamic Component Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Primary conversation always takes main space */}
        <div className="col-span-12 lg:col-span-8">
          {renderComponent(activeComponents.find(c => c.id === 'conversation') || activeComponents[0])}
        </div>

        {/* Secondary components in sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {activeComponents
            .filter(c => c.id !== 'conversation')
            .slice(0, 3) // Limit to 3 secondary components to avoid clutter
            .map(renderComponent)}
        </div>
      </div>

      {/* Additional components below if needed */}
      {activeComponents.length > 4 && (
        <>
          <Separator className="my-6" />
          <div className="grid grid-cols-12 gap-4">
            {activeComponents
              .slice(4)
              .map(config => (
                <div key={config.id} className="col-span-12 md:col-span-6 lg:col-span-4">
                  {renderComponent(config)}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
