/**
 * Algorithm Retrieval Component
 * Retrieves algorithms from database or generates them using OpenAI
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  ComponentImplementation, 
  ComponentExecutionContext,
  ComponentExecutionResult
} from '../types.ts';
import { Configuration, OpenAIApi } from 'openai';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Algorithm Retrieval Component
 * Retrieves algorithms from database or generates them using OpenAI
 */
export const algorithmRetrievalComponent: ComponentImplementation = async (
  context: ComponentExecutionContext
): Promise<ComponentExecutionResult> => {
  try {
    const { inputData, memoryIntegration } = context;
    const { 
      retrievalMethod, 
      algorithmType, 
      algorithmName,
      algorithmId,
      algorithmParameters,
      generationPrompt,
      generationParameters,
      searchCriteria
    } = inputData;
    
    let algorithm: any = null;
    let metadata: any = {
      retrievedAt: new Date().toISOString(),
      retrievalMethod,
      algorithmType
    };
    
    // Retrieve algorithm based on method
    switch (retrievalMethod) {
      case 'database':
        // Retrieve from database
        algorithm = await retrieveAlgorithmFromDatabase(
          algorithmId, 
          algorithmName, 
          algorithmType, 
          searchCriteria
        );
        break;
        
      case 'openai':
        // Generate using OpenAI
        algorithm = await generateAlgorithmWithOpenAI(
          algorithmType,
          algorithmName,
          generationPrompt,
          generationParameters,
          algorithmParameters
        );
        break;
        
      case 'memory':
        // Retrieve from memory
        algorithm = await retrieveAlgorithmFromMemory(
          algorithmType,
          algorithmName,
          memoryIntegration
        );
        break;
        
      default:
        throw new Error(`Unsupported algorithm retrieval method: ${retrievalMethod}`);
    }
    
    if (!algorithm) {
      return {
        success: false,
        errorMessage: `Algorithm not found using method: ${retrievalMethod}`,
        outputData: null
      };
    }
    
    // Store algorithm in working memory
    const memoryKey = `algorithm:${algorithm.id || uuidv4()}`;
    await memoryIntegration.storeInWorkingMemory(memoryKey, {
      algorithm,
      metadata
    });
    
    // Also store in short-term memory for potential reuse
    await memoryIntegration.storeInShortTermMemory(
      memoryKey,
      {
        algorithm,
        metadata
      },
      ['algorithm', algorithmType, algorithm.name]
    );
    
    return {
      success: true,
      outputData: {
        algorithm,
        metadata
      }
    };
  } catch (error) {
    console.error('Error in algorithm retrieval component:', error);
    return {
      success: false,
      errorMessage: error.message || 'Algorithm retrieval failed',
      outputData: null
    };
  }
};

/**
 * Retrieves an algorithm from the database
 */
async function retrieveAlgorithmFromDatabase(
  algorithmId?: string,
  algorithmName?: string,
  algorithmType?: string,
  searchCriteria?: any
): Promise<any> {
  try {
    let query = supabase.from('algorithms').select('*');
    
    // Apply filters
    if (algorithmId) {
      query = query.eq('id', algorithmId);
    } else if (algorithmName) {
      query = query.eq('name', algorithmName);
    } else if (algorithmType) {
      query = query.eq('type', algorithmType);
    }
    
    // Apply additional search criteria
    if (searchCriteria) {
      if (searchCriteria.tags && searchCriteria.tags.length > 0) {
        query = query.contains('tags', searchCriteria.tags);
      }
      
      if (searchCriteria.version) {
        query = query.eq('version', searchCriteria.version);
      }
      
      if (searchCriteria.isActive !== undefined) {
        query = query.eq('is_active', searchCriteria.isActive);
      }
    }
    
    // Get latest version if not specified
    if (!searchCriteria?.version) {
      query = query.order('version', { ascending: false });
    }
    
    // Execute query
    const { data, error } = await query.limit(1);
    
    if (error) {
      console.error('Error retrieving algorithm from database:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Exception retrieving algorithm from database:', error);
    return null;
  }
}

/**
 * Generates an algorithm using OpenAI
 */
async function generateAlgorithmWithOpenAI(
  algorithmType: string,
  algorithmName: string,
  generationPrompt: string,
  generationParameters: any,
  algorithmParameters: any
): Promise<any> {
  try {
    // Construct the prompt for OpenAI
    const prompt = constructAlgorithmPrompt(
      algorithmType,
      algorithmName,
      generationPrompt,
      algorithmParameters
    );
    
    // Set up OpenAI API parameters
    const openAIParams = {
      model: generationParameters?.model || 'gpt-4',
      temperature: generationParameters?.temperature || 0.2,
      max_tokens: generationParameters?.maxTokens || 2000,
      top_p: generationParameters?.topP || 1,
      frequency_penalty: generationParameters?.frequencyPenalty || 0,
      presence_penalty: generationParameters?.presencePenalty || 0
    };
    
    // Call OpenAI API
    const response = await openai.createCompletion({
      ...openAIParams,
      prompt
    });
    
    // Extract algorithm code from response
    const algorithmCode = extractAlgorithmCode(response.data.choices[0].text || '');
    
    if (!algorithmCode) {
      throw new Error('Failed to generate valid algorithm code');
    }
    
    // Create algorithm object
    const algorithm = {
      id: uuidv4(),
      name: algorithmName,
      type: algorithmType,
      code: algorithmCode,
      parameters: algorithmParameters,
      source: 'openai',
      created_at: new Date().toISOString(),
      version: 1,
      is_active: true,
      metadata: {
        generationPrompt,
        generationParameters,
        model: openAIParams.model
      }
    };
    
    // Optionally save to database
    await saveGeneratedAlgorithm(algorithm);
    
    return algorithm;
  } catch (error) {
    console.error('Error generating algorithm with OpenAI:', error);
    throw error;
  }
}

/**
 * Constructs a prompt for algorithm generation
 */
function constructAlgorithmPrompt(
  algorithmType: string,
  algorithmName: string,
  basePrompt: string,
  parameters: any
): string {
  // Start with the base prompt
  let prompt = basePrompt || '';
  
  // Add algorithm type and name
  prompt += `\n\nAlgorithm Type: ${algorithmType}`;
  prompt += `\nAlgorithm Name: ${algorithmName}`;
  
  // Add parameters
  if (parameters) {
    prompt += '\n\nParameters:';
    Object.entries(parameters).forEach(([key, value]) => {
      prompt += `\n- ${key}: ${value}`;
    });
  }
  
  // Add format instructions
  prompt += `
\n\nPlease generate a JavaScript algorithm with the following structure:
\`\`\`javascript
/**
 * ${algorithmName}
 * ${algorithmType} algorithm
 * 
 * @param {Object} data - Input data for the algorithm
 * @param {Object} parameters - Algorithm parameters
 * @returns {Object} - Algorithm results
 */
function ${algorithmName.replace(/\s+/g, '')}(data, parameters) {
  // Algorithm implementation
  
  return {
    // Results
  };
}

module.exports = ${algorithmName.replace(/\s+/g, '')};
\`\`\`

Ensure the algorithm:
1. Is fully functional and handles edge cases
2. Includes proper error handling
3. Is optimized for performance
4. Returns results in the specified format
5. Uses only the input data and parameters provided
6. Includes comments explaining complex logic

Only respond with the algorithm code, nothing else.`;

  return prompt;
}

/**
 * Extracts algorithm code from OpenAI response
 */
function extractAlgorithmCode(response: string): string | null {
  // Extract code between markdown code blocks
  const codeRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/;
  const match = response.match(codeRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no code blocks, try to extract the entire response if it looks like code
  if (response.includes('function') && response.includes('return')) {
    return response.trim();
  }
  
  return null;
}

/**
 * Saves a generated algorithm to the database
 */
async function saveGeneratedAlgorithm(algorithm: any): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('algorithms')
      .insert({
        id: algorithm.id,
        name: algorithm.name,
        type: algorithm.type,
        code: algorithm.code,
        parameters: algorithm.parameters,
        source: algorithm.source,
        version: algorithm.version,
        is_active: algorithm.is_active,
        metadata: algorithm.metadata
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving generated algorithm:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Exception saving generated algorithm:', error);
    return null;
  }
}

/**
 * Retrieves an algorithm from memory
 */
async function retrieveAlgorithmFromMemory(
  algorithmType: string,
  algorithmName: string,
  memoryIntegration: any
): Promise<any> {
  try {
    // Try short-term memory first
    const shortTermKey = `algorithm:${algorithmName}:${algorithmType}`;
    const shortTermResult = await memoryIntegration.getFromShortTermMemory(shortTermKey);
    
    if (shortTermResult && shortTermResult.algorithm) {
      return shortTermResult.algorithm;
    }
    
    // Try long-term memory
    const searchResults = await memoryIntegration.searchLongTermMemory(
      `${algorithmName} ${algorithmType}`,
      1
    );
    
    if (searchResults && searchResults.length > 0 && searchResults[0].algorithm) {
      return searchResults[0].algorithm;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving algorithm from memory:', error);
    return null;
  }
}

/**
 * Register algorithm retrieval component
 */
export function registerAlgorithmRetrievalComponent(componentRegistry: any): void {
  componentRegistry.registerImplementation('algorithm-retrieval', algorithmRetrievalComponent);
}
