import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, TrendingUp, Code, Lightbulb, AlertTriangle, Users2, BarChart4, Database, RefreshCw } from 'lucide-react';
import { useCrewSeasonalityAgent } from '@/hooks/useCrewSeasonalityAgent';

interface CrewSeasonalityAgentProps {
  agentId?: string;
  defaultEnableCaching?: boolean;
  defaultEnableFeedback?: boolean;
}

export const CrewSeasonalityAgent = ({ 
  agentId = 'default-crew-seasonality-agent',
  defaultEnableCaching = true,
  defaultEnableFeedback = false,
}: CrewSeasonalityAgentProps) => {
  // Feature toggle states
  const [enableCaching, setEnableCaching] = useState<boolean>(defaultEnableCaching);
  const [enableFeedbackLoop, setEnableFeedbackLoop] = useState<boolean>(defaultEnableFeedback);
  const [maxFeedbackIterations, setMaxFeedbackIterations] = useState<number>(3);
  
  const { 
    analyzeSeasonality, 
    isAnalyzing, 
    isCachedResult,
    feedbackIterationCount,
    getFeedbackStats,
    getCacheStats
  } = useCrewSeasonalityAgent(agentId, {
    enableCaching,
    enableFeedbackLoop,
    maxFeedbackIterations,
    verbose: true,
    sequential: true
  });
  const [query, setQuery] = useState('');
  const [dataDescription, setDataDescription] = useState('');
  const [period, setPeriod] = useState(12);
  const [analysisType, setAnalysisType] = useState<'stl' | 'seasonal_naive' | 'x11' | 'custom'>('stl');
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!query.trim() || !dataDescription.trim()) return;

    const analysisResult = await analyzeSeasonality({
      query,
      dataDescription,
      period,
      analysisType,
    });

    if (analysisResult) {
      setResult(analysisResult);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span>CrewAI Seasonality Analysis</span>
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                <Users2 className="h-3 w-3 mr-1" /> Crew-powered
              </Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Multi-agent seasonality analysis with specialized CrewAI agents for comprehensive insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="p-4 bg-muted/40">
            <div className="flex flex-col space-y-4">
              <div className="text-sm font-medium">CrewAI Features</div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="enable-caching" className="text-sm">Enable Result Caching</Label>
                  <span className="text-xs text-muted-foreground">Store results to avoid redundant computations</span>
                </div>
                <Switch
                  id="enable-caching"
                  checked={enableCaching}
                  onCheckedChange={setEnableCaching}
                  disabled={isAnalyzing}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="enable-feedback" className="text-sm">Enable Feedback Loop</Label>
                  <span className="text-xs text-muted-foreground">Agents provide feedback to improve results</span>
                </div>
                <Switch
                  id="enable-feedback"
                  checked={enableFeedbackLoop}
                  onCheckedChange={setEnableFeedbackLoop}
                  disabled={isAnalyzing}
                />
              </div>
              
              {enableFeedbackLoop && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="max-iterations" className="text-sm">Max Iterations</Label>
                  <Select 
                    value={maxFeedbackIterations.toString()} 
                    onValueChange={(val) => setMaxFeedbackIterations(parseInt(val))}
                    disabled={isAnalyzing}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="3" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {isCachedResult && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                    <Database className="h-3 w-3" /> Cached Result
                  </Badge>
                )}
                
                {feedbackIterationCount > 0 && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> {feedbackIterationCount} feedback iterations
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="query">Analysis Request</Label>
            <Textarea
              id="query"
              placeholder="Describe what seasonality analysis you need (e.g., 'Analyze monthly sales patterns and identify peak seasons')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataDescription">Data Description</Label>
            <Textarea
              id="dataDescription"
              placeholder="Describe your dataset (e.g., 'Monthly sales data from 2020-2024, includes revenue and units sold')"
              value={dataDescription}
              onChange={(e) => setDataDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Seasonal Period</Label>
              <Input
                id="period"
                type="number"
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value) || 12)}
                min={2}
                max={365}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="analysisType">Analysis Method</Label>
              <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stl">STL Decomposition</SelectItem>
                  <SelectItem value="seasonal_naive">Seasonal Naive</SelectItem>
                  <SelectItem value="x11">X-11 Adjustment</SelectItem>
                  <SelectItem value="custom">Custom Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleAnalyze} 
            className="w-full"
            disabled={isAnalyzing || !query.trim() || !dataDescription.trim()}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                CrewAI Analysis in Progress...
              </>
            ) : (
              <>Run CrewAI Seasonality Analysis</>
            )}
          </Button>
          
          {isAnalyzing && (
            <div className="space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>⏳ Data Preparation Agent</span>
                <span className="text-blue-500">In Progress</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>⏳ Seasonality Analyst Agent</span>
                <span>Pending</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>⏳ Business Insights Agent</span>
                <span>Pending</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>⏳ Visualization Agent</span>
                <span>Pending</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5" />
              CrewAI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-lg">Summary</h3>
              <div className="mt-2 whitespace-pre-line text-sm">{result.summary}</div>
              
              {/* Display system metrics */}
              {(isCachedResult || feedbackIterationCount > 0) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {isCachedResult && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                      <Database className="h-3 w-3" /> From Cache
                    </Badge>
                  )}
                  
                  {feedbackIterationCount > 0 && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> {feedbackIterationCount} Feedback Iterations
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Business Insights
              </h3>
              <ul className="space-y-2">
                {result.insights.map((insight: string, i: number) => (
                  <li key={i} className="text-sm">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((recommendation: string, i: number) => (
                  <li key={i} className="text-sm">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>

            {result.limitations && result.limitations.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-medium mb-1 flex items-center text-amber-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Limitations
                </h3>
                <ul className="space-y-1">
                  {result.limitations.map((limitation: string, i: number) => (
                    <li key={i} className="text-sm text-amber-700">
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.plots && result.plots.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Visualizations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.plots.map((plot: string, i: number) => (
                    <div key={i} className="p-4 border rounded-md">
                      <pre className="text-xs overflow-auto max-h-40">{plot}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.code && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Generated Code
                </h3>
                <div className="bg-slate-800 rounded-md p-4">
                  <pre className="text-xs text-slate-200 overflow-auto max-h-60">{result.code}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
