import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRAG } from '@/hooks/useRAG';
import { useSeasonalityAgent } from '@/hooks/useSeasonalityAgent';
import { Loader2, Search, Brain, TestTube, Database, ChevronDown, ChevronUp, BookOpen, Settings } from 'lucide-react';
import { ContextualRetrievalTester } from '@/components/ContextualRetrievalTester';
import { MOLASAnalysisExample } from '@/components/MOLASAnalysisExample';

export const RAGTestingInterface = () => {
  const { searchSemantic, getKnowledgeEntries, isLoading } = useRAG();
  // Use a dummy agent ID for testing purposes
  const { analyzeSeasonality, isAnalyzing } = useSeasonalityAgent('test-seasonality-agent');

  // Test queries for different scenarios
  const testQueries = [
    "Analyze monthly sales patterns for retail seasonality",
    "Detect seasonal trends in quarterly financial data",
    "Apply STL decomposition to time series data",
    "Find weekly patterns in daily web traffic",
    "Identify customer behavior seasonality patterns"
  ];

  const [activeTab, setActiveTab] = useState("rag-test");
  const [query, setQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([]);
  const [molasResults, setMolasResults] = useState<any>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const handleSemanticSearch = async () => {
    if (!query.trim()) return;
    
    console.log('Starting semantic search test:', { query, selectedTeam, selectedClass });
    const results = await searchSemantic(
      query, 
      selectedTeam || undefined, 
      selectedClass || undefined, 
      10
    );
    setSearchResults(results);
    console.log('Semantic search results:', results);
  };

  const handleMolasTest = async () => {
    if (!query.trim()) return;

    console.log('Starting MoLAS pipeline test');
    const result = await analyzeSeasonality({
      query,
      dataDescription: "Sample time series data with monthly observations over 4 years",
      period: 12,
      analysisType: 'stl'
    });
    setMolasResults(result);
    console.log('MoLAS test results:', result);
  };

  const loadKnowledgeBase = async () => {
    const entries = await getKnowledgeEntries();
    setKnowledgeEntries(entries);
  };

  const useTestQuery = (testQuery: string) => {
    setQuery(testQuery);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            RAG & MoLAS Testing Interface
          </CardTitle>
          <CardDescription>
            Test the Retrieval-Augmented Generation, MoLAS pipeline, and Adaptive Retrieval systems
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rag-test" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            RAG Testing
          </TabsTrigger>
          <TabsTrigger value="molas-test" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            MoLAS Pipeline
          </TabsTrigger>
          <TabsTrigger value="molas-service" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            MoLAS Service
          </TabsTrigger>
          <TabsTrigger value="knowledge-base" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="contextual-retrieval" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Contextual Retrieval
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rag-test">
          <Card>
            <CardHeader>
              <CardTitle>Semantic Search & Retrieval Testing</CardTitle>
              <CardDescription>
                Test the RAG system's ability to find relevant prompts and knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Query Shortcuts */}
              <div>
                <Label className="text-sm font-semibold">Quick Test Queries</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {testQueries.map((testQuery, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => useTestQuery(testQuery)}
                      className="text-xs"
                    >
                      {testQuery.substring(0, 30)}...
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Search Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-query">Search Query</Label>
                  <Textarea
                    id="search-query"
                    placeholder="Enter your seasonality analysis query..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-filter">Team Filter (Optional)</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="All teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All teams</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class-filter">Agent Class Filter (Optional)</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All classes</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="strategist">Strategist</SelectItem>
                      <SelectItem value="executor">Executor</SelectItem>
                      <SelectItem value="specialist">Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSemanticSearch} 
                disabled={isLoading || !query.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Test Semantic Search
                  </>
                )}
              </Button>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Search Results ({searchResults.length})</h4>
                  {searchResults.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-semibold">
                                {result.title || result.name || 'Untitled'}
                              </h5>
                              <Badge variant="outline">
                                Similarity: {(result.similarity * 100).toFixed(1)}%
                              </Badge>
                              <Badge variant="secondary">
                                {result.source}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {result.content.substring(0, 200)}...
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                          >
                            {expandedResult === result.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {expandedResult === result.id && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="molas-test">
          <Card>
            <CardHeader>
              <CardTitle>MoLAS Pipeline Testing</CardTitle>
              <CardDescription>
                Test the complete Modular Large Language Model Analysis System
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="molas-query">Analysis Request</Label>
                <Textarea
                  id="molas-query"
                  placeholder="Describe the seasonality analysis you want to test..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleMolasTest} 
                disabled={isAnalyzing || !query.trim()}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running MoLAS Pipeline...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Test MoLAS Pipeline
                  </>
                )}
              </Button>

              {molasResults && (
                <div className="space-y-4">
                  <h4 className="font-semibold">MoLAS Pipeline Results</h4>
                  
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <Badge variant="outline">{molasResults.method}</Badge>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold">Summary</h5>
                          <p className="text-sm text-gray-600">{molasResults.summary}</p>
                        </div>

                        {molasResults.insights && molasResults.insights.length > 0 && (
                          <div>
                            <h5 className="font-semibold">Key Insights</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {molasResults.insights.map((insight: string, index: number) => (
                                <li key={index}>{insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {molasResults.execution_details && (
                          <div>
                            <h5 className="font-semibold">Pipeline Execution Details</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>Discovery Confidence: {(molasResults.execution_details.discovery?.confidence * 100).toFixed(1)}%</div>
                              <div>Verification Status: {molasResults.execution_details.reasoning?.verification_status}</div>
                              <div>Execution Status: {molasResults.execution_details.execution?.status}</div>
                              <div>Data Quality: {molasResults.execution_details.interpretation?.data_quality}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge-base">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Overview</CardTitle>
              <CardDescription>
                View and manage the populated knowledge base for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadKnowledgeBase} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Load Knowledge Base
                  </>
                )}
              </Button>

              {knowledgeEntries.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Knowledge Base Entries ({knowledgeEntries.length})</h4>
                  {knowledgeEntries.map((entry, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold">{entry.title}</h5>
                          <div className="flex gap-2">
                            {entry.team && <Badge variant="outline">{entry.team}</Badge>}
                            {entry.agent_class && <Badge variant="secondary">{entry.agent_class}</Badge>}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {entry.content.substring(0, 200)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contextual-retrieval">
          <ContextualRetrievalTester />
        </TabsContent>

        <TabsContent value="molas-service">
          <MOLASAnalysisExample />
        </TabsContent>
      </Tabs>
    </div>
  );
};
