import React, { useState, useEffect } from 'react';
import { useKnowledgeGraph } from '@/services/knowledgeGraphService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ConceptNode {
  id: string;
  name: string;
  type: string;
  description?: string;
  depth: number;
}

interface ConceptEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

const KnowledgeGraphDemo: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conceptName, setConceptName] = useState('Seasonality');
  const [targetConcept, setTargetConcept] = useState('Cannibalization');
  const [enhancedQuery, setEnhancedQuery] = useState<any>(null);
  const [relatedConcepts, setRelatedConcepts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [conceptPath, setConceptPath] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('enhance');

  const { enhanceQuery, getRelatedConcepts, searchConcepts, findPath } = useKnowledgeGraph();

  // Load initial related concepts for Seasonality
  useEffect(() => {
    if (conceptName) {
      handleGetRelatedConcepts();
    }
  }, []);

  const handleEnhanceQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await enhanceQuery(query);
      setEnhancedQuery(result);
    } catch (error) {
      console.error('Error enhancing query:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRelatedConcepts = async () => {
    if (!conceptName.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await getRelatedConcepts(conceptName, 2);
      setRelatedConcepts(result || []);
    } catch (error) {
      console.error('Error getting related concepts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await searchConcepts(searchTerm);
      setSearchResults(result || []);
    } catch (error) {
      console.error('Error searching concepts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindPath = async () => {
    if (!conceptName.trim() || !targetConcept.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await findPath(conceptName, targetConcept, 3);
      setConceptPath(result || []);
    } catch (error) {
      console.error('Error finding path:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderConceptBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      concept: 'bg-blue-500',
      method: 'bg-green-500',
      factor: 'bg-yellow-500',
      metric: 'bg-purple-500'
    };
    
    return (
      <Badge className={`${colorMap[type.toLowerCase()] || 'bg-gray-500'} text-white`}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Knowledge Graph Integration Demo</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="enhance">Enhance Query</TabsTrigger>
          <TabsTrigger value="related">Related Concepts</TabsTrigger>
          <TabsTrigger value="search">Search Concepts</TabsTrigger>
          <TabsTrigger value="path">Find Path</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enhance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enhance Query with Knowledge Graph</CardTitle>
              <CardDescription>
                Enter a query related to demand forecasting or marketing to enhance it with knowledge graph concepts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="E.g., How does seasonality affect demand forecasting?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button onClick={handleEnhanceQuery} disabled={isLoading}>
                  {isLoading ? 'Enhancing...' : 'Enhance'}
                </Button>
              </div>
              
              {enhancedQuery && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Enhanced Query Context:</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p><strong>Original Query:</strong> {enhancedQuery.originalQuery}</p>
                    <div className="mt-2">
                      <p><strong>Related Concepts:</strong></p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {enhancedQuery.enhancedContext.relatedConcepts.map((concept: any) => (
                          <div 
                            key={concept.entity_id}
                            className="bg-white border border-gray-300 rounded-md p-2 text-sm"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span>{concept.name}</span>
                              {renderConceptBadge(concept.type)}
                            </div>
                            {concept.relationship_type && (
                              <Badge variant="outline">
                                {concept.relationship_type}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="related" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Related Concepts</CardTitle>
              <CardDescription>
                Enter a concept name to find related concepts in the knowledge graph
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="E.g., Seasonality"
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                />
                <Button onClick={handleGetRelatedConcepts} disabled={isLoading}>
                  {isLoading ? 'Finding...' : 'Find Related'}
                </Button>
              </div>
              
              {relatedConcepts.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Related Concepts:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {relatedConcepts.map((concept) => (
                      <Card key={concept.entity_id} className="bg-gray-50">
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-md">{concept.name}</CardTitle>
                            {renderConceptBadge(concept.type)}
                          </div>
                          {concept.relationship_type && (
                            <Badge variant="outline" className="mt-1">
                              {concept.relationship_type} (depth: {concept.depth})
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent className="py-2">
                          <p className="text-sm text-gray-600">{concept.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Concepts</CardTitle>
              <CardDescription>
                Search for concepts in the knowledge graph
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="E.g., forecast"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {searchResults.map((concept) => (
                      <div 
                        key={concept.id}
                        className="bg-white border border-gray-300 rounded-md p-3"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-medium">{concept.name}</h4>
                          {renderConceptBadge(concept.type)}
                        </div>
                        <p className="text-sm text-gray-600">{concept.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="path" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Path Between Concepts</CardTitle>
              <CardDescription>
                Find paths between two concepts in the knowledge graph
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Source Concept</label>
                  <Input
                    placeholder="E.g., Seasonality"
                    value={conceptName}
                    onChange={(e) => setConceptName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Concept</label>
                  <Input
                    placeholder="E.g., Cannibalization"
                    value={targetConcept}
                    onChange={(e) => setTargetConcept(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={handleFindPath} disabled={isLoading} className="w-full">
                {isLoading ? 'Finding Path...' : 'Find Path'}
              </Button>
              
              {conceptPath.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Paths Found:</h3>
                  <div className="space-y-4">
                    {conceptPath.map((path, index) => (
                      <div 
                        key={index}
                        className="bg-white border border-gray-300 rounded-md p-3"
                      >
                        <h4 className="font-medium mb-2">Path {index + 1}</h4>
                        <div className="flex flex-wrap items-center">
                          {path.path.map((node: string, nodeIndex: number) => (
                            <React.Fragment key={nodeIndex}>
                              <span className="bg-blue-100 px-2 py-1 rounded text-sm">
                                {node}
                              </span>
                              
                              {nodeIndex < path.path.length - 1 && (
                                <span className="mx-2 text-gray-500 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14"></path>
                                    <path d="m12 5 7 7-7 7"></path>
                                  </svg>
                                  <span className="text-xs ml-1">
                                    {path.relationship_types[nodeIndex]}
                                  </span>
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : conceptPath.length === 0 && !isLoading && activeTab === 'path' ? (
                <div className="mt-4 text-center p-4 bg-gray-50 rounded-md">
                  <p>No paths found between these concepts.</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 bg-gray-100 p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Integration with Message Understanding</h2>
        <p className="mb-4">
          This knowledge graph can be integrated with your message understanding system to provide contextual information
          about demand forecasting and marketing concepts.
        </p>
        <div className="bg-white p-3 rounded-md border border-gray-300">
          <pre className="text-sm overflow-x-auto">
{`// Example integration with message understanding
import { useKnowledgeGraph } from '@/services/knowledgeGraphService';

export const useEnhancedMessageUnderstanding = () => {
  const { enhanceQuery } = useKnowledgeGraph();
  
  const processMessage = async (message: string) => {
    // Enhance the message with knowledge graph context
    const enhanced = await enhanceQuery(message);
    
    // Use the enhanced context in your message understanding pipeline
    return {
      originalMessage: message,
      enhancedContext: enhanced.enhancedContext,
      // Process with your existing message understanding system
      // ...
    };
  };
  
  return { processMessage };
};`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphDemo;
