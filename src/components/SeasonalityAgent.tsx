import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSeasonalityAgent } from '@/hooks/useSeasonalityAgent';
import { Loader2, TrendingUp, Code, Lightbulb, AlertTriangle } from 'lucide-react';

interface SeasonalityAgentProps {
  agentId?: string;
}

export const SeasonalityAgent = ({ agentId = 'default-seasonality-agent' }: SeasonalityAgentProps) => {
  const { analyzeSeasonality, isAnalyzing } = useSeasonalityAgent(agentId);
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
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Seasonality Analysis Agent
          </CardTitle>
          <CardDescription>
            AI-powered seasonality analysis with method discovery and code generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            disabled={isAnalyzing || !query.trim() || !dataDescription.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run Seasonality Analysis'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analysis Results
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{result.method}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-sm text-gray-600">{result.summary}</p>
                </div>

                {result.insights && result.insights.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Key Insights
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.insights.map((insight: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.limitations && result.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Limitations & Considerations
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.limitations.map((limitation: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {result.code && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Generated Analysis Code
                </CardTitle>
                <CardDescription>
                  Production-ready Python code for your seasonality analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{result.code}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
