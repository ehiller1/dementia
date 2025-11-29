import React, { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button,
  Textarea,
  Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Badge
} from '@/components/ui/index.js';
import { Loader2, Brain } from 'lucide-react';
import { MOLASService } from '@/services/index.js';

/**
 * MOLASAnalysisExample Component
 * 
 * This component demonstrates the direct usage of the new MOLASService
 * rather than individual hooks, showing how the refactored service simplifies
 * the implementation compared to the previous approach.
 */
export const MOLASAnalysisExample: React.FC = () => {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('12');
  const [analysisType, setAnalysisType] = useState<'stl' | 'seasonal_naive' | 'x11' | 'custom'>('stl');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [phaseProgress, setPhaseProgress] = useState<Record<string, boolean>>({
    discovery: false,
    planning: false,
    reasoning: false,
    execution: false,
    interpretation: false
  });

  // Create a single instance of MOLAS service
  const molasService = new MOLASService();

  const handleAnalysis = async () => {
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    setResults(null);
    resetProgress();

    try {
      // 1. Planning phase (we skip discovery as it's not in the service)
      setCurrentPhase('planning');
      updateProgress('planning', true);
      
      const planningResult = await molasService.planning({
        method_id: analysisType,
        params: {
          period: parseInt(period),
          data_source: 'synthetic',
          enhanced_processing: true,
          real_data_integration: false,
          decomposition_type: 'multiplicative'
        }
      });
      
      // 2. Reasoning phase
      setCurrentPhase('reasoning');
      updateProgress('reasoning', true);
      
      const reasoningResult = await molasService.reasoning({
        func_prompt: planningResult.func_prompt,
        required_steps: planningResult.required_steps,
        max_attempts: 3,
        include_data_processing: true,
        real_data_support: false
      });
      
      // 3. Execution phase
      setCurrentPhase('execution');
      updateProgress('execution', true);
      
      const executionResult = await molasService.execute({
        code: reasoningResult.code,
        execution_context: {
          user_query: query,
          analysis_type: analysisType,
          ...planningResult.analysis_config
        }
      });
      
      // 4. Interpretation phase
      setCurrentPhase('interpretation');
      updateProgress('interpretation', true);
      
      const interpretationResult = await molasService.interpret({
        result: {
          dataframes: executionResult.dataframes || {},
          plots: executionResult.plots || [],
          metrics: executionResult.metrics || {},
          status: executionResult.status
        },
        method_id: analysisType,
        user_query: query,
        business_context: true,
        enhanced_insights: true,
        real_data_analysis: false
      });
      
      // Set final results
      setResults({
        planning: {
          prompt: planningResult.func_prompt,
          steps: planningResult.required_steps
        },
        summary: interpretationResult.summary,
        insights: interpretationResult.key_insights,
        recommendations: interpretationResult.message.recommendations,
        execution_details: {
          reasoning: { verification_status: reasoningResult.verification_status },
          execution: { status: executionResult.status },
          interpretation: { data_quality: interpretationResult.message.data_quality }
        },
        statisticalMetrics: executionResult.metrics,
        dataQuality: interpretationResult.message.data_quality
      });
    } catch (error) {
      console.error('MOLAS Analysis error:', error);
      setResults({
        planning: {
          prompt: 'Error occurred',
          steps: []
        },
        summary: 'Analysis failed to complete',
        insights: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Try again with a different query or analysis type']
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentPhase('');
    }
  };
  
  const resetProgress = () => {
    setPhaseProgress({
      discovery: false,
      planning: false,
      reasoning: false,
      execution: false,
      interpretation: false
    });
  };
  
  const updateProgress = (phase: string, value: boolean) => {
    setPhaseProgress(prev => ({
      ...prev,
      [phase]: value
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            MOLAS Service Example
          </CardTitle>
          <CardDescription>
            Demonstrating the unified MOLASService approach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="analysis-query">Analysis Query</Label>
            <Textarea
              id="analysis-query"
              placeholder="Describe the seasonality analysis you want to perform..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period-select">Time Series Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">Quarterly (4)</SelectItem>
                  <SelectItem value="7">Weekly (7)</SelectItem>
                  <SelectItem value="12">Monthly (12)</SelectItem>
                  <SelectItem value="24">Bi-monthly (24)</SelectItem>
                  <SelectItem value="52">Weekly (52)</SelectItem>
                  <SelectItem value="365">Daily (365)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="analysis-type">Analysis Method</Label>
              <Select 
                value={analysisType} 
                onValueChange={(value) => setAnalysisType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stl">STL Decomposition</SelectItem>
                  <SelectItem value="seasonal_naive">Seasonal Naive</SelectItem>
                  <SelectItem value="x11">X-11 Method</SelectItem>
                  <SelectItem value="custom">Custom Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {Object.entries(phaseProgress).map(([phase, completed]) => (
                <Badge 
                  key={phase} 
                  variant={completed ? "default" : "outline"}
                  className={currentPhase === phase ? "animate-pulse" : ""}
                >
                  {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </Badge>
              ))}
            </div>
            
            <Button 
              onClick={handleAnalysis} 
              disabled={isAnalyzing || !query.trim()}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentPhase ? `${currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase...` : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Run MOLAS Analysis
                </>
              )}
            </Button>
          </div>
          
          {results && (
            <Card className="mt-4 border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">Analysis Results</h4>
                    <Badge variant="outline">{results.method}</Badge>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold">Summary</h5>
                    <p className="text-sm text-gray-600">{results.summary}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold">Key Insights</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {results.insights.map((insight: string, index: number) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold">Recommendations</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {results.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {results.execution_details && (
                    <div>
                      <h5 className="font-semibold">Pipeline Execution Details</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Discovery Confidence: {(results.execution_details.discovery?.confidence * 100 || 0).toFixed(1)}%</div>
                        <div>Verification Status: {results.execution_details.reasoning?.verification_status || 'N/A'}</div>
                        <div>Execution Status: {results.execution_details.execution?.status || 'N/A'}</div>
                        <div>Data Quality: {results.execution_details.interpretation?.data_quality || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
