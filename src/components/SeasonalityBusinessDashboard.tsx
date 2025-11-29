
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Download, Upload, BarChart3, FileText, Loader2, CheckCircle } from 'lucide-react';

interface AnalysisPhase {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed';
  businessDescription: string;
  progress: number;
}

interface BusinessInsight {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

interface SeasonalityBusinessDashboardProps {
  isAnalyzing: boolean;
  currentPhase?: string;
  insights?: BusinessInsight[];
  onStartAnalysis: () => void;
  onExportResults: () => void;
}

export const SeasonalityBusinessDashboard = ({
  isAnalyzing,
  currentPhase = 'discovery',
  insights = [],
  onStartAnalysis,
  onExportResults
}: SeasonalityBusinessDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  const analysisPhases: AnalysisPhase[] = [
    {
      id: 'discovery',
      name: 'Understanding Your Data',
      businessDescription: 'Analyzing data patterns and characteristics',
      status: currentPhase === 'discovery' ? 'running' : 'completed',
      progress: currentPhase === 'discovery' ? 60 : 100
    },
    {
      id: 'planning',
      name: 'Selecting Best Approach',
      businessDescription: 'Choosing optimal analysis method for your business',
      status: currentPhase === 'planning' ? 'running' : currentPhase === 'discovery' ? 'pending' : 'completed',
      progress: currentPhase === 'planning' ? 75 : currentPhase === 'discovery' ? 0 : 100
    },
    {
      id: 'analysis',
      name: 'Generating Insights',
      businessDescription: 'Processing data and identifying seasonal patterns',
      status: currentPhase === 'reasoning' ? 'running' : ['discovery', 'planning'].includes(currentPhase) ? 'pending' : 'completed',
      progress: currentPhase === 'reasoning' ? 85 : ['discovery', 'planning'].includes(currentPhase) ? 0 : 100
    },
    {
      id: 'results',
      name: 'Creating Business Reports',
      businessDescription: 'Preparing actionable insights and recommendations',
      status: currentPhase === 'interpretation' ? 'running' : ['discovery', 'planning', 'reasoning'].includes(currentPhase) ? 'pending' : 'completed',
      progress: currentPhase === 'interpretation' ? 90 : ['discovery', 'planning', 'reasoning'].includes(currentPhase) ? 0 : 100
    }
  ];

  const sampleInsights: BusinessInsight[] = insights.length > 0 ? insights : [
    {
      title: 'Seasonal Peak',
      value: 'Q4 2024',
      change: '+23% vs Q3',
      trend: 'up',
      confidence: 95
    },
    {
      title: 'Trend Strength',
      value: 'Strong',
      change: '8.2/10 rating',
      trend: 'up',
      confidence: 88
    },
    {
      title: 'Next Forecast',
      value: 'Q1 2025',
      change: '-15% seasonal dip',
      trend: 'down',
      confidence: 92
    }
  ];

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Seasonality Analysis Dashboard
          </CardTitle>
          <CardDescription>
            Business-friendly seasonal pattern analysis and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={onStartAnalysis}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
            </Button>
            <Button 
              variant="outline" 
              onClick={onExportResults}
              disabled={isAnalyzing}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Analysis Progress</TabsTrigger>
          <TabsTrigger value="insights">Business Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleInsights.map((insight, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                    {getTrendIcon(insight.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{insight.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{insight.change}</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Progress</CardTitle>
              <CardDescription>
                Real-time progress of your seasonality analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisPhases.map((phase) => (
                <div key={phase.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPhaseIcon(phase.status)}
                      <span className="font-medium">{phase.name}</span>
                    </div>
                    <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                      {phase.status === 'running' ? 'In Progress' : 
                       phase.status === 'completed' ? 'Complete' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {phase.businessDescription}
                  </p>
                  <Progress value={phase.progress} className="ml-6" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Business Insights</CardTitle>
              <CardDescription>
                Actionable insights from your seasonal analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900">Key Finding</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Your data shows strong seasonal patterns with Q4 consistently performing 23% above average.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900">Recommendation</h4>
                  <p className="text-sm text-green-800 mt-1">
                    Plan inventory increases 2 months before Q4 to capitalize on seasonal demand.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900">Caution</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Q1 typically shows 15% decline - adjust marketing spend accordingly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
