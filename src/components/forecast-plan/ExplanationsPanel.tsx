import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { HelpCircle, Brain, TrendingUp, AlertCircle, ChevronDown, ChevronRight, Search } from 'lucide-react';

interface Explanation {
  id: string;
  type: 'forecast_delta' | 'recommendation' | 'simulation_outcome' | 'policy_violation' | 'plan_variance';
  title: string;
  summary: string;
  rationale: {
    primary_factors: string[];
    contributing_factors: string[];
    assumptions: string[];
    confidence_level: number;
  };
  evidence: {
    data_sources: string[];
    historical_patterns: string[];
    external_factors: string[];
  };
  implications: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  alternatives: {
    option: string;
    pros: string[];
    cons: string[];
    risk_level: 'low' | 'medium' | 'high';
  }[];
  context: any;
  created_at: string;
  updated_at: string;
}

interface KnowledgeGraphQuery {
  query: string;
  results: {
    nodes: Array<{
      id: string;
      type: string;
      properties: Record<string, any>;
    }>;
    relationships: Array<{
      from: string;
      to: string;
      type: string;
      properties: Record<string, any>;
    }>;
  };
}

export const ExplanationsPanel: React.FC = () => {
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExplanation, setSelectedExplanation] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [knowledgeGraphQuery, setKnowledgeGraphQuery] = useState('');
  const [kgResults, setKgResults] = useState<KnowledgeGraphQuery | null>(null);
  const [kgLoading, setKgLoading] = useState(false);

  useEffect(() => {
    fetchExplanations();
  }, []);

  const fetchExplanations = async () => {
    try {
      // Mock data for now - in real implementation, this would fetch from the backend
      const mockExplanations: Explanation[] = [
        {
          id: 'exp_001',
          type: 'forecast_delta',
          title: 'Q4 Revenue Forecast Adjustment',
          summary: 'Revenue forecast decreased by 12% due to market conditions and seasonal patterns',
          rationale: {
            primary_factors: ['Seasonal demand decline', 'Economic uncertainty', 'Supply chain disruptions'],
            contributing_factors: ['Competitor pricing pressure', 'Customer budget constraints'],
            assumptions: ['Market conditions remain stable', 'No major economic shocks', 'Current trends continue'],
            confidence_level: 0.78
          },
          evidence: {
            data_sources: ['Historical sales data', 'Market research reports', 'Customer surveys'],
            historical_patterns: ['Q4 typically shows 15% decline', 'Similar patterns in 2019, 2021'],
            external_factors: ['Federal interest rate changes', 'Industry consolidation trends']
          },
          implications: {
            immediate: ['Adjust Q4 marketing spend', 'Review inventory levels'],
            short_term: ['Reassess hiring plans', 'Optimize operational costs'],
            long_term: ['Strategic market positioning', 'Product portfolio review']
          },
          alternatives: [
            {
              option: 'Aggressive marketing campaign',
              pros: ['Potential to maintain forecast', 'Market share protection'],
              cons: ['Higher costs', 'Uncertain ROI'],
              risk_level: 'high'
            },
            {
              option: 'Conservative approach',
              pros: ['Cost savings', 'Predictable outcomes'],
              cons: ['Market share loss', 'Revenue decline'],
              risk_level: 'low'
            }
          ],
          context: { forecast_id: 'f_001', delta_magnitude: -0.12 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setExplanations(mockExplanations);
    } catch (error) {
      console.error('Failed to fetch explanations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKnowledgeGraphQuery = async () => {
    if (!knowledgeGraphQuery.trim()) return;
    
    setKgLoading(true);
    try {
      const response = await fetch('/api/forecast-plan/knowledge-graph/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: knowledgeGraphQuery })
      });
      
      if (response.ok) {
        const data = await response.json();
        setKgResults({
          query: knowledgeGraphQuery,
          results: data.results || { nodes: [], relationships: [] }
        });
      }
    } catch (error) {
      console.error('Knowledge graph query failed:', error);
    } finally {
      setKgLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'forecast_delta': return 'bg-blue-100 text-blue-800';
      case 'recommendation': return 'bg-green-100 text-green-800';
      case 'simulation_outcome': return 'bg-purple-100 text-purple-800';
      case 'policy_violation': return 'bg-red-100 text-red-800';
      case 'plan_variance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExplanations = explanations.filter(exp =>
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Explanations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Explanations & Insights
            <Badge variant="outline">{explanations.length} available</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search explanations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Knowledge Graph Query */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Knowledge Graph Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Query knowledge graph (e.g., 'find suppliers for SKU-001')"
              value={knowledgeGraphQuery}
              onChange={(e) => setKnowledgeGraphQuery(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleKnowledgeGraphQuery}
              disabled={kgLoading || !knowledgeGraphQuery.trim()}
            >
              {kgLoading ? 'Querying...' : 'Query'}
            </Button>
          </div>
          
          {kgResults && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Query: "{kgResults.query}"</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-sm mb-2">Nodes ({kgResults.results.nodes.length})</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {kgResults.results.nodes.map((node) => (
                      <div key={node.id} className="text-xs p-2 bg-white rounded border">
                        <span className="font-medium">{node.id}</span> ({node.type})
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-sm mb-2">Relationships ({kgResults.results.relationships.length})</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {kgResults.results.relationships.map((rel, index) => (
                      <div key={index} className="text-xs p-2 bg-white rounded border">
                        {rel.from} → {rel.to} ({rel.type})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanations List */}
      <div className="space-y-4">
        {filteredExplanations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              No explanations found matching your search
            </CardContent>
          </Card>
        ) : (
          filteredExplanations.map((explanation) => (
            <Card key={explanation.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTypeColor(explanation.type)}>
                        {explanation.type.replace('_', ' ')}
                      </Badge>
                      <span className={`text-sm font-medium ${getConfidenceColor(explanation.rationale.confidence_level)}`}>
                        {(explanation.rationale.confidence_level * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{explanation.title}</h3>
                    <p className="text-gray-600 mb-4">{explanation.summary}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExplanation(
                      selectedExplanation === explanation.id ? null : explanation.id
                    )}
                  >
                    {selectedExplanation === explanation.id ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>

                {selectedExplanation === explanation.id && (
                  <div className="space-y-4 border-t pt-4">
                    {/* Rationale Section */}
                    <div>
                      <button
                        onClick={() => toggleSection(`${explanation.id}-rationale`)}
                        className="flex items-center gap-2 font-medium text-sm mb-2 hover:text-blue-600"
                      >
                        {expandedSections.has(`${explanation.id}-rationale`) ? 
                          <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        }
                        Rationale & Analysis
                      </button>
                      {expandedSections.has(`${explanation.id}-rationale`) && (
                        <div className="ml-6 space-y-3">
                          <div>
                            <span className="text-sm font-medium">Primary Factors:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.rationale.primary_factors.map((factor, index) => (
                                <li key={index}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Contributing Factors:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.rationale.contributing_factors.map((factor, index) => (
                                <li key={index}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Key Assumptions:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.rationale.assumptions.map((assumption, index) => (
                                <li key={index}>{assumption}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Evidence Section */}
                    <div>
                      <button
                        onClick={() => toggleSection(`${explanation.id}-evidence`)}
                        className="flex items-center gap-2 font-medium text-sm mb-2 hover:text-blue-600"
                      >
                        {expandedSections.has(`${explanation.id}-evidence`) ? 
                          <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        }
                        Supporting Evidence
                      </button>
                      {expandedSections.has(`${explanation.id}-evidence`) && (
                        <div className="ml-6 space-y-3">
                          <div>
                            <span className="text-sm font-medium">Data Sources:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.evidence.data_sources.map((source, index) => (
                                <li key={index}>{source}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Historical Patterns:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.evidence.historical_patterns.map((pattern, index) => (
                                <li key={index}>{pattern}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-sm font-medium">External Factors:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.evidence.external_factors.map((factor, index) => (
                                <li key={index}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Implications Section */}
                    <div>
                      <button
                        onClick={() => toggleSection(`${explanation.id}-implications`)}
                        className="flex items-center gap-2 font-medium text-sm mb-2 hover:text-blue-600"
                      >
                        {expandedSections.has(`${explanation.id}-implications`) ? 
                          <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        }
                        Business Implications
                      </button>
                      {expandedSections.has(`${explanation.id}-implications`) && (
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="text-sm font-medium text-red-600">Immediate</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.implications.immediate.map((implication, index) => (
                                <li key={index}>{implication}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-orange-600">Short-term</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.implications.short_term.map((implication, index) => (
                                <li key={index}>{implication}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-blue-600">Long-term</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {explanation.implications.long_term.map((implication, index) => (
                                <li key={index}>{implication}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Alternatives Section */}
                    {explanation.alternatives.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleSection(`${explanation.id}-alternatives`)}
                          className="flex items-center gap-2 font-medium text-sm mb-2 hover:text-blue-600"
                        >
                          {expandedSections.has(`${explanation.id}-alternatives`) ? 
                            <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          }
                          Alternative Options
                        </button>
                        {expandedSections.has(`${explanation.id}-alternatives`) && (
                          <div className="ml-6 space-y-3">
                            {explanation.alternatives.map((alternative, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{alternative.option}</span>
                                  <Badge className={getRiskColor(alternative.risk_level)}>
                                    {alternative.risk_level} risk
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-sm font-medium text-green-600">Pros:</span>
                                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                      {alternative.pros.map((pro, proIndex) => (
                                        <li key={proIndex}>{pro}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-red-600">Cons:</span>
                                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                      {alternative.cons.map((con, conIndex) => (
                                        <li key={conIndex}>{con}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
