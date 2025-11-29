
import { useRAG } from '@/hooks/useRAG';
import { useContextualRetrieval } from '@/lib/memory/contextual-retrieval';

interface DiscoveryInput {
  user_query: string;
  context?: string;
  has_data?: boolean;
  preferred_method?: string;
  enhanced_mode?: boolean;
}

interface DiscoveryOutput {
  method_id: string;
  confidence: number;
  retrieved_context: string;
}

export const useDiscoveryModule = () => {
  const { searchSemantic } = useRAG();
  const { search: contextualSearch } = useContextualRetrieval();

  const METHOD_LIBRARY = {
    'stl': 'STL Decomposition - Seasonal-Trend decomposition using LOESS for additive/multiplicative seasonality',
    'seasonal_naive': 'Seasonal Naive - Simple seasonal pattern detection using naive seasonal methods',
    'x11': 'X-11 Seasonal Adjustment - Census X-11 method for seasonal adjustment and trend analysis',
    'autocorr': 'Autocorrelation Analysis - Correlation-based seasonality detection',
    'fourier': 'Fourier Transform - Frequency domain seasonality analysis'
  };

  const selectMethod = async (input: DiscoveryInput): Promise<DiscoveryOutput> => {
    console.log('Discovery Module Input:', input);

    // Step 1: Initial retrieval using both semantic search and contextual retrieval
    const [semanticResults, contextualResults] = await Promise.all([
      // Traditional semantic search
      searchSemantic(
        `seasonality analysis ${input.user_query}`,
        undefined,
        'analyst',
        input.enhanced_mode ? 8 : 4
      ),
      
      // Enhanced contextual retrieval
      contextualSearch({
        query: input.user_query,
        memoryTypes: ['short-term', 'long-term'],
        contentTypes: ['analysis', 'template', 'method', 'insight'],
        maxResults: input.enhanced_mode ? 8 : 4,
        minRelevance: 0.65,
        includeKnowledgeGraph: true
      }).catch(err => {
        console.error('Contextual search error:', err);
        return { results: [] };
      })
    ]);

    // Combine results from both sources
    const semanticContextText = semanticResults.map(item => item.content).join('\n');
    const semanticAvgScore = semanticResults.length > 0 
      ? semanticResults.reduce((sum, item) => sum + item.similarity, 0) / semanticResults.length 
      : 0;
      
    const contextualContextText = contextualResults.results 
      ? contextualResults.results.map(item => item.content).join('\n') 
      : '';
    const contextualAvgScore = contextualResults.results && contextualResults.results.length > 0 
      ? contextualResults.results.reduce((sum, item) => sum + item.relevance, 0) / contextualResults.results.length 
      : 0;
    
    // Combine contexts and calculate weighted average score
    let finalContext = semanticContextText;
    let finalScore = semanticAvgScore;
    
    if (contextualContextText) {
      finalContext += '\n\n' + contextualContextText;
      // Weight contextual results higher if available
      finalScore = contextualResults.results && contextualResults.results.length > 0 
        ? (semanticAvgScore * 0.4) + (contextualAvgScore * 0.6)
        : semanticAvgScore;
    }

    // Step 2: Adaptive retrieval if confidence is low
    if (finalScore < 0.7) {
      console.log('Low confidence, expanding retrieval context');
      const expandedQuery = `${input.user_query} seasonality patterns time series analysis`;
      
      // Expanded contextual search with broader parameters
      const [expandedSemanticResults, expandedContextualResults] = await Promise.all([
        searchSemantic(
          expandedQuery,
          undefined,
          'analyst',
          input.enhanced_mode ? 12 : 8
        ),
        
        contextualSearch({
          query: expandedQuery,
          memoryTypes: ['working', 'short-term', 'long-term'],
          contentTypes: [],  // No content type filter for expanded search
          maxResults: input.enhanced_mode ? 12 : 8,
          minRelevance: 0.5, // Lower threshold for expanded search
          includeKnowledgeGraph: true
        }).catch(() => ({ results: [] }))
      ]);
      
      // Update final context and score with expanded results
      finalContext = expandedSemanticResults.map(item => item.content).join('\n');
      
      if (expandedContextualResults.results && expandedContextualResults.results.length > 0) {
        finalContext += '\n\n' + expandedContextualResults.results.map(item => item.content).join('\n');
        
        // Calculate new weighted score
        const expandedSemanticScore = expandedSemanticResults.reduce((sum, item) => sum + item.similarity, 0) / expandedSemanticResults.length;
        const expandedContextualScore = expandedContextualResults.results.reduce((sum, item) => sum + item.relevance, 0) / expandedContextualResults.results.length;
        
        finalScore = (expandedSemanticScore * 0.4) + (expandedContextualScore * 0.6);
      } else {
        finalScore = expandedSemanticResults.reduce((sum, item) => sum + item.similarity, 0) / expandedSemanticResults.length;
      }
    }

    // Step 3: Method selection based on query analysis
    let selectedMethod = 'stl'; // default
    const query = input.user_query.toLowerCase();
    
    if (query.includes('naive') || query.includes('simple')) {
      selectedMethod = 'seasonal_naive';
    } else if (query.includes('x11') || query.includes('census')) {
      selectedMethod = 'x11';
    } else if (query.includes('correlation') || query.includes('autocorr')) {
      selectedMethod = 'autocorr';
    } else if (query.includes('fourier') || query.includes('frequency')) {
      selectedMethod = 'fourier';
    }

    const output: DiscoveryOutput = {
      method_id: selectedMethod,
      confidence: finalScore,
      retrieved_context: finalContext
    };

    console.log('Discovery Module Output:', output);
    return output;
  };

  return { selectMethod };
};
