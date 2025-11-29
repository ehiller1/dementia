import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useContextualRetrieval } from '@/lib/memory/contextual-retrieval';
import { useRealIntentRouter } from '@/hooks/useRealIntentRouter';
import { useDiscoveryModule } from '@/hooks/useDiscoveryModule';
import { Loader2, Search, Brain, Database, ChevronDown, ChevronUp, FileText, Tag } from 'lucide-react';
import { simulatedDatasets, getDatasetStatistics } from '@/data/simulatedDatasets';

export const ContextualRetrievalTester = () => {
  const { search, getTopicContext, getConversationContext } = useContextualRetrieval();
  const { processQuery, isProcessing } = useRealIntentRouter();
  const { selectMethod } = useDiscoveryModule();

  // Sample domain-specific test queries
  const testQueries = [
    "What's the impact of seasonality on retail sales during Q4?",
    "How does STL decomposition handle multiple seasonal patterns?",
    "Analyze the correlation between marketing spend and seasonal demand",
    "What methods can detect weekly patterns in daily financial data?",
    "How do I interpret autocorrelation plots for seasonal data?"
  ];

  const [activeTab, setActiveTab] = useState("contextual-search");
  const [query, setQuery] = useState('');
  const [memoryTypes, setMemoryTypes] = useState<string[]>(['working', 'short-term', 'long-term']);
  const [includeKnowledgeGraph, setIncludeKnowledgeGraph] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [intentResults, setIntentResults] = useState<any>(null);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const handleContextualSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      console.log('Starting contextual search test:', { query, memoryTypes, includeKnowledgeGraph });
      
      const results = await search({
        query,
        memoryTypes: memoryTypes as any[],
        includeKnowledgeGraph,
        maxResults: 10,
        minRelevance: 0.5
      });
      
      setSearchResults(results.results || []);
      console.log('Contextual search results:', results);
    } catch (error) {
      console.error('Error in contextual search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleIntentRouting = async () => {
    if (!query.trim()) return;
    
    try {
      const result = await processQuery({
        query,
        userContext: {
          userId: 'test-user',
          sessionId: 'test-session',
          conversationHistory: []
        }
      });
      
      setIntentResults(result);
      console.log('Intent routing results:', result);
    } catch (error) {
      console.error('Error in intent routing:', error);
    }
  };

  const handleDiscoveryTest = async () => {
    if (!query.trim()) return;
    
    try {
      const result = await selectMethod({
        user_query: query,
        enhanced_mode: true
      });
      
      setDiscoveryResults(result);
      console.log('Discovery module results:', result);
    } catch (error) {
      console.error('Error in discovery module:', error);
    }
  };

  const useTestQuery = (testQuery: string) => {
    setQuery(testQuery);
  };

  const toggleMemoryType = (type: string) => {
    if (memoryTypes.includes(type)) {
      setMemoryTypes(memoryTypes.filter(t => t !== type));
    } else {
      setMemoryTypes([...memoryTypes, type]);
    }
  };

  const toggleExpandResult = (id: string) => {
    if (expandedResult === id) {
      setExpandedResult(null);
    } else {
      setExpandedResult(id);
    }
  };

  const datasetStats = getDatasetStatistics();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Contextual Retrieval Integration Tester
          </CardTitle>
          <CardDescription>
            Test the contextual retrieval system with domain-specific terms and knowledge graph enhancement
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Available Datasets Overview */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="h-5 w-5 text-blue-400" />
            Available Simulated Datasets
          </CardTitle>
          <CardDescription className="text-gray-400">
            {datasetStats.total} datasets with {datasetStats.totalRecords} total records across memory types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm text-gray-400 mb-1">Working Memory</div>
              <div className="text-2xl font-bold text-green-400">{datasetStats.byMemoryType.working}</div>
              <div className="text-xs text-gray-500 mt-1">Real-time active data</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm text-gray-400 mb-1">Short-term Memory</div>
              <div className="text-2xl font-bold text-blue-400">{datasetStats.byMemoryType['short-term']}</div>
              <div className="text-xs text-gray-500 mt-1">Recent decisions & analysis</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm text-gray-400 mb-1">Long-term Memory</div>
              <div className="text-2xl font-bold text-purple-400">{datasetStats.byMemoryType['long-term']}</div>
              <div className="text-xs text-gray-500 mt-1">Strategic knowledge</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-300 mb-2">Dataset Categories:</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-cyan-600/20 text-cyan-400 border-cyan-600">
                <FileText className="h-3 w-3 mr-1" />
                Business ({datasetStats.byCategory.business})
              </Badge>
              <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600">
                <FileText className="h-3 w-3 mr-1" />
                Operational ({datasetStats.byCategory.operational})
              </Badge>
              <Badge variant="outline" className="bg-purple-600/20 text-purple-400 border-purple-600">
                <FileText className="h-3 w-3 mr-1" />
                Strategic ({datasetStats.byCategory.strategic})
              </Badge>
              <Badge variant="outline" className="bg-orange-600/20 text-orange-400 border-orange-600">
                <FileText className="h-3 w-3 mr-1" />
                Technical ({datasetStats.byCategory.technical})
              </Badge>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-sm text-gray-400 mb-2">Sample Datasets:</div>
            <div className="space-y-2">
              {simulatedDatasets.slice(0, 3).map((dataset) => (
                <div key={dataset.id} className="flex items-start gap-2 text-sm">
                  <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">{dataset.name}</div>
                    <div className="text-gray-500 text-xs">{dataset.description.substring(0, 80)}...</div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="link" 
              className="text-blue-400 hover:text-blue-300 p-0 h-auto mt-2"
              onClick={() => window.open('/dataset-browser', '_blank')}
            >
              View all datasets →
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contextual-search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Contextual Search
          </TabsTrigger>
          <TabsTrigger value="intent-routing" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Intent Routing
          </TabsTrigger>
          <TabsTrigger value="discovery-module" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Discovery Module
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contextual-search">
          <Card>
            <CardHeader>
              <CardTitle>Contextual Search Testing</CardTitle>
              <CardDescription>
                Test the contextual retrieval system's ability to find relevant information across memory types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Query Shortcuts */}
              <div>
                <Label className="text-sm font-semibold">Test Queries with Domain-Specific Terms</Label>
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-query">Search Query</Label>
                  <Textarea
                    id="search-query"
                    placeholder="Enter your query with domain-specific terms..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Memory Types</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={memoryTypes.includes('working') ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleMemoryType('working')}
                    >
                      Working Memory
                    </Badge>
                    <Badge 
                      variant={memoryTypes.includes('short-term') ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleMemoryType('short-term')}
                    >
                      Short-Term Memory
                    </Badge>
                    <Badge 
                      variant={memoryTypes.includes('long-term') ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleMemoryType('long-term')}
                    >
                      Long-Term Memory
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-kg"
                    checked={includeKnowledgeGraph}
                    onChange={(e) => setIncludeKnowledgeGraph(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="include-kg">Include Knowledge Graph Enhancement</Label>
                </div>
              </div>

              <Button 
                onClick={handleContextualSearch} 
                disabled={isSearching || !query.trim()}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Test Contextual Search
                  </>
                )}
              </Button>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Search Results ({searchResults.length})</h4>
                  <div className="space-y-3">
                    {searchResults.map((result, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer flex justify-between items-center"
                          onClick={() => toggleExpandResult(result.id)}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge>{result.memoryType}</Badge>
                              <Badge variant="outline">{result.contentType}</Badge>
                              <Badge variant="secondary">
                                Relevance: {(result.relevance * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <h5 className="font-medium mt-2">
                              {result.content.substring(0, 100)}
                              {result.content.length > 100 ? '...' : ''}
                            </h5>
                          </div>
                          {expandedResult === result.id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                        
                        {expandedResult === result.id && (
                          <div className="px-4 pb-4 pt-0">
                            <Separator className="my-2" />
                            <div className="whitespace-pre-wrap">{result.content}</div>
                            
                            {result.knowledgeContext && (
                              <div className="mt-4">
                                <h6 className="font-semibold text-sm">Knowledge Graph Context:</h6>
                                <div className="mt-2 text-sm">
                                  <div>
                                    <span className="font-medium">Related Concepts: </span>
                                    {result.knowledgeContext.relatedConcepts?.map((concept: any, i: number) => (
                                      <Badge key={i} variant="outline" className="mr-1">
                                        {concept.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {result.metadata && (
                              <div className="mt-4">
                                <h6 className="font-semibold text-sm">Metadata:</h6>
                                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                  {JSON.stringify(result.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intent-routing">
          <Card>
            <CardHeader>
              <CardTitle>Intent Routing with Contextual Retrieval</CardTitle>
              <CardDescription>
                Test how the intent router uses contextual retrieval for enhanced understanding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Query Shortcuts */}
              <div>
                <Label className="text-sm font-semibold">Test Queries with Domain-Specific Terms</Label>
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

              <div className="space-y-2">
                <Label htmlFor="intent-query">Query</Label>
                <Textarea
                  id="intent-query"
                  placeholder="Enter your query with domain-specific terms..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleIntentRouting} 
                disabled={isProcessing || !query.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Test Intent Routing
                  </>
                )}
              </Button>

              {/* Intent Results */}
              {intentResults && (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-semibold">Intent Classification</h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>Intent</Badge>
                        <span>{intentResults.intentClassification.intent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>Confidence</Badge>
                        <span>{(intentResults.intentClassification.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>Journey Stage</Badge>
                        <span>{intentResults.journeyStage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>Agent Type</Badge>
                        <span>{intentResults.intentClassification.suggestedAgentType || 'Not specified'}</span>
                      </div>
                    </div>
                  </Card>

                  {intentResults.knowledge && intentResults.knowledge.length > 0 && (
                    <Card className="p-4">
                      <h4 className="font-semibold">Contextual Knowledge</h4>
                      <div className="mt-2 space-y-2">
                        {intentResults.knowledge.map((item: any, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <p>{item.content}</p>
                            <div className="mt-1 flex gap-1">
                              <Badge variant="outline" className="text-xs">{item.source}</Badge>
                              {item.relevance && (
                                <Badge variant="secondary" className="text-xs">
                                  Relevance: {(item.relevance * 100).toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {intentResults.recommended && (
                    <Card className="p-4">
                      <h4 className="font-semibold">Recommended {intentResults.recommended.type}</h4>
                      <div className="mt-2">
                        <h5 className="font-medium">{intentResults.recommended.item.title || intentResults.recommended.item.name}</h5>
                        <p className="mt-1 text-sm">{intentResults.recommended.item.description}</p>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discovery-module">
          <Card>
            <CardHeader>
              <CardTitle>Discovery Module with Contextual Retrieval</CardTitle>
              <CardDescription>
                Test how the discovery module uses contextual retrieval for enhanced method selection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Query Shortcuts */}
              <div>
                <Label className="text-sm font-semibold">Test Queries with Domain-Specific Terms</Label>
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

              <div className="space-y-2">
                <Label htmlFor="discovery-query">Query</Label>
                <Textarea
                  id="discovery-query"
                  placeholder="Enter your query with domain-specific terms..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleDiscoveryTest} 
                disabled={isSearching || !query.trim()}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Test Discovery Module
                  </>
                )}
              </Button>

              {/* Discovery Results */}
              {discoveryResults && (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-semibold">Selected Method</h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>Method ID</Badge>
                        <span>{discoveryResults.method_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>Confidence</Badge>
                        <span>{(discoveryResults.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold">Retrieved Context</h4>
                    <div className="mt-2">
                      <Textarea 
                        readOnly 
                        value={discoveryResults.retrieved_context} 
                        className="w-full h-64"
                      />
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
