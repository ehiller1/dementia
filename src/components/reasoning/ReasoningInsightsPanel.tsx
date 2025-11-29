import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  ArrowRight,
  Eye,
  RefreshCw
} from 'lucide-react';

interface ReasoningQuality {
  score: number;
  confidence: number;
  completeness: number;
  coherence: number;
  logicalFlow: number;
  evidenceSupport: number;
}

interface ReasoningPattern {
  id: string;
  pattern: string;
  frequency: number;
  successRate: number;
  averageConfidence: number;
  contexts: string[];
}

interface ReasoningInsight {
  id: string;
  type: 'strength' | 'weakness' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  relatedSteps?: string[];
}

interface ReasoningInsightsPanelProps {
  reasoningQuality: ReasoningQuality;
  patterns: ReasoningPattern[];
  insights: ReasoningInsight[];
  executionMetrics: {
    totalSteps: number;
    averageStepTime: number;
    selfCorrections: number;
    confidenceVariance: number;
  };
  onPatternClick?: (pattern: ReasoningPattern) => void;
  onInsightAction?: (insight: ReasoningInsight) => void;
}

export const ReasoningInsightsPanel: React.FC<ReasoningInsightsPanelProps> = ({
  reasoningQuality,
  patterns,
  insights,
  executionMetrics,
  onPatternClick,
  onInsightAction
}) => {
  const [selectedTab, setSelectedTab] = useState('quality');

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'weakness': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pattern': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      default: return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          Reasoning Analysis
          <Badge variant="outline" className="text-xs">
            Quality: {Math.round(reasoningQuality.score * 100)}%
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quality" className="text-xs">Quality</TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs">Patterns</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="quality" className="space-y-4 mt-4">
            <div className="space-y-3">
              {/* Overall Quality Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Quality</span>
                <div className="flex items-center gap-2">
                  <Progress value={reasoningQuality.score * 100} className="w-20" />
                  <span className={`text-sm font-medium ${getQualityColor(reasoningQuality.score)}`}>
                    {Math.round(reasoningQuality.score * 100)}%
                  </span>
                </div>
              </div>

              {/* Quality Dimensions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Completeness</span>
                  <div className="flex items-center gap-2">
                    <Progress value={reasoningQuality.completeness * 100} className="w-16" />
                    <span className="text-xs w-8">{Math.round(reasoningQuality.completeness * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Coherence</span>
                  <div className="flex items-center gap-2">
                    <Progress value={reasoningQuality.coherence * 100} className="w-16" />
                    <span className="text-xs w-8">{Math.round(reasoningQuality.coherence * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Logical Flow</span>
                  <div className="flex items-center gap-2">
                    <Progress value={reasoningQuality.logicalFlow * 100} className="w-16" />
                    <span className="text-xs w-8">{Math.round(reasoningQuality.logicalFlow * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Evidence Support</span>
                  <div className="flex items-center gap-2">
                    <Progress value={reasoningQuality.evidenceSupport * 100} className="w-16" />
                    <span className="text-xs w-8">{Math.round(reasoningQuality.evidenceSupport * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Confidence */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Confidence Level</span>
                  <Badge className={getQualityColor(reasoningQuality.confidence)}>
                    {Math.round(reasoningQuality.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-3 mt-4">
            {patterns.length > 0 ? (
              <div className="space-y-2">
                {patterns.slice(0, 5).map((pattern) => (
                  <div
                    key={pattern.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onPatternClick?.(pattern)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{pattern.pattern}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {pattern.frequency}x
                        </Badge>
                        <Badge className={getQualityColor(pattern.successRate)}>
                          {Math.round(pattern.successRate * 100)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Avg Confidence: {Math.round(pattern.averageConfidence * 100)}%</span>
                      <span>{pattern.contexts.length} contexts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No patterns detected yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-3 mt-4">
            {insights.length > 0 ? (
              <div className="space-y-2">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-3 border rounded-lg ${getImpactColor(insight.impact)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{insight.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {insight.impact}
                          </Badge>
                        </div>
                        
                        <p className="text-xs leading-relaxed mb-2">
                          {insight.description}
                        </p>
                        
                        {insight.actionable && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => onInsightAction?.(insight)}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No insights available
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {executionMetrics.totalSteps}
                </div>
                <div className="text-xs text-blue-600">Total Steps</div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {executionMetrics.averageStepTime}ms
                </div>
                <div className="text-xs text-green-600">Avg Step Time</div>
              </div>

              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {executionMetrics.selfCorrections}
                </div>
                <div className="text-xs text-yellow-600">Self-Corrections</div>
              </div>

              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(executionMetrics.confidenceVariance * 100)}%
                </div>
                <div className="text-xs text-purple-600">Confidence Var</div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Reasoning Efficiency</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(executionMetrics.totalSteps / (executionMetrics.averageStepTime / 1000))} steps/sec
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReasoningInsightsPanel;
