/**
 * MOLASAnalysisExample Component
 * 
 * This is an example component showing how to refactor existing code
 * to use the new MOLASService via the adapter hooks.
 */

import React, { useState, useEffect } from 'react';
import { useMOLASPipelineAdapter } from '../../hooks/adapters/useMOLASAdapter.js';
import { Button } from '../ui/button.js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card.js';
import { Input } from '../ui/input.js';
import { Label } from '../ui/label.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.js';
import { Textarea } from '../ui/textarea.js';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert.js';

type AnalysisMethod = {
  id: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: 'number' | 'string' | 'boolean';
    default?: any;
    description: string;
  }>;
};

// Example methods - in a real app, these might come from a database or API
const ANALYSIS_METHODS: AnalysisMethod[] = [
  {
    id: 'stl',
    name: 'Seasonal-Trend Decomposition',
    description: 'Decomposes time series into seasonal, trend, and remainder components',
    parameters: [
      { name: 'period', type: 'number', default: 12, description: 'Number of observations per season' },
      { name: 'seasonal_window', type: 'number', default: 7, description: 'Window length for seasonal extraction' }
    ]
  },
  {
    id: 'arima',
    name: 'ARIMA Analysis',
    description: 'Autoregressive Integrated Moving Average model for forecasting',
    parameters: [
      { name: 'p', type: 'number', default: 1, description: 'Order of the autoregressive part' },
      { name: 'd', type: 'number', default: 1, description: 'Degree of differencing' },
      { name: 'q', type: 'number', default: 1, description: 'Order of the moving average part' }
    ]
  },
  {
    id: 'clustering',
    name: 'Time Series Clustering',
    description: 'Groups similar time periods based on patterns',
    parameters: [
      { name: 'n_clusters', type: 'number', default: 3, description: 'Number of clusters to form' },
      { name: 'window_size', type: 'number', default: 30, description: 'Size of the sliding window' }
    ]
  }
];

export const MOLASAnalysisExample: React.FC = () => {
  // State for form values
  const [selectedMethodId, setSelectedMethodId] = useState<string>(ANALYSIS_METHODS[0].id);
  const [userQuery, setUserQuery] = useState<string>('');
  const [csvData, setCsvData] = useState<string | undefined>(undefined);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<string>('input');

  // Get the MOLAS pipeline adapter
  const { 
    runPipeline, 
    isPipelineRunning, 
    currentPhase, 
    error: pipelineError, 
    pipelineResult 
  } = useMOLASPipelineAdapter();
  
  // Get the selected method
  const selectedMethod = ANALYSIS_METHODS.find(method => method.id === selectedMethodId) || ANALYSIS_METHODS[0];
  
  // Initialize default parameters when method changes
  useEffect(() => {
    const defaultParams: Record<string, any> = {};
    selectedMethod.parameters.forEach(param => {
      if ('default' in param) {
        defaultParams[param.name] = param.default;
      }
    });
    setParameters(defaultParams);
  }, [selectedMethodId]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null);
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setFileUploadError('Please upload a CSV file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
    };
    reader.onerror = () => {
      setFileUploadError('Error reading file');
    };
    reader.readAsText(file);
  };

  // Handle parameter change
  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userQuery.trim()) {
      return;
    }
    
    try {
      const result = await runPipeline(
        userQuery,
        selectedMethodId,
        parameters,
        csvData,
        {
          include_data_processing: true,
          real_data_support: !!csvData,
          enhanced_insights: true,
          business_context: true,
          persist_state: true
        }
      );
      
      if (result) {
        setActiveTab('results');
      }
    } catch (err) {
      console.error('Analysis error:', err);
    }
  };

  // Render parameter inputs based on the selected method
  const renderParameterInputs = () => {
    return selectedMethod.parameters.map(param => (
      <div key={param.name} className="mb-4">
        <Label htmlFor={param.name}>{param.name}</Label>
        <Input
          id={param.name}
          type={param.type === 'number' ? 'number' : 'text'}
          value={parameters[param.name] || ''}
          onChange={(e) => {
            const value = param.type === 'number' ? parseFloat(e.target.value) : e.target.value;
            handleParameterChange(param.name, value);
          }}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">{param.description}</p>
      </div>
    ));
  };

  // Render result visualization (simplified for this example)
  const renderVisualization = () => {
    if (!pipelineResult || !pipelineResult.execution) {
      return <p>No visualization data available</p>;
    }
    
    return (
      <div>
        <h4 className="text-lg font-medium mb-2">Analysis Results</h4>
        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
          {JSON.stringify(pipelineResult.execution.metrics, null, 2)}
        </pre>
      </div>
    );
  };

  // Render insights from interpretation
  const renderInsights = () => {
    if (!pipelineResult || !pipelineResult.interpretation) {
      return <p>No insights available</p>;
    }
    
    const { summary, key_insights, recommendations } = pipelineResult.interpretation;
    
    return (
      <div>
        <h4 className="text-lg font-medium mb-2">Summary</h4>
        <p className="mb-4">{summary}</p>
        
        <h4 className="text-lg font-medium mb-2">Key Insights</h4>
        <ul className="list-disc pl-5 mb-4">
          {key_insights.map((insight: string, i: number) => (
            <li key={i} className="mb-1">{insight}</li>
          ))}
        </ul>
        
        <h4 className="text-lg font-medium mb-2">Recommendations</h4>
        <ul className="list-disc pl-5">
          {recommendations.map((rec: string, i: number) => (
            <li key={i} className="mb-1">{rec}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>MOLAS Analysis Example</CardTitle>
          <CardDescription>
            Run advanced time series analysis using the MOLAS pipeline
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="input">Analysis Input</TabsTrigger>
              <TabsTrigger value="results" disabled={!pipelineResult}>Results</TabsTrigger>
              <TabsTrigger value="code" disabled={!pipelineResult?.reasoning?.code}>Generated Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="input">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Label htmlFor="userQuery">Analysis Question</Label>
                  <Textarea
                    id="userQuery"
                    placeholder="E.g., Analyze sales data for seasonal patterns and predict next quarter"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="method">Analysis Method</Label>
                  <Select
                    value={selectedMethodId}
                    onValueChange={setSelectedMethodId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANALYSIS_METHODS.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">{selectedMethod.description}</p>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="file">Upload CSV Data (Optional)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                  {fileUploadError && (
                    <p className="text-red-500 text-sm mt-1">{fileUploadError}</p>
                  )}
                  {csvData && (
                    <p className="text-green-500 text-sm mt-1">
                      <Check className="inline mr-1 h-4 w-4" /> CSV file loaded successfully
                    </p>
                  )}
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Parameters</h3>
                  {renderParameterInputs()}
                </div>
                
                <Button type="submit" disabled={isPipelineRunning || !userQuery.trim()}>
                  {isPipelineRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running {currentPhase || 'analysis'}...
                    </>
                  ) : (
                    'Run Analysis'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="results">
              {pipelineError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{pipelineError}</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xl font-medium mb-4">Business Insights</h3>
                    {renderInsights()}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-4">Analysis Visualization</h3>
                    {renderVisualization()}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="code">
              {pipelineResult?.reasoning?.code && (
                <div>
                  <h3 className="text-xl font-medium mb-4">Generated Analysis Code</h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px]">
                    {pipelineResult.reasoning.code}
                  </pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Powered by MOLAS Service - Production Ready Analysis Pipeline
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MOLASAnalysisExample;
