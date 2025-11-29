/**
 * Interpretation Service Component
 * Provides interpretation of algorithm results using LLMs
 */

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
 * Interpretation Service Component
 * Interprets algorithm results using LLMs
 */
export const interpretationComponent: ComponentImplementation = async (
  context: ComponentExecutionContext
): Promise<ComponentExecutionResult> => {
  try {
    const { inputData, memoryIntegration } = context;
    const { 
      results, 
      algorithmType,
      algorithmName,
      interpretationOptions,
      businessContext,
      previousInterpretations
    } = inputData;
    
    if (!results) {
      return {
        success: false,
        errorMessage: 'No results provided for interpretation',
        outputData: null
      };
    }
    
    // Get interpretation method
    const interpretationMethod = interpretationOptions?.method || 'openai';
    
    // Generate interpretation
    const interpretation = await generateInterpretation(
      results,
      algorithmType,
      algorithmName,
      interpretationMethod,
      interpretationOptions,
      businessContext,
      previousInterpretations,
      memoryIntegration
    );
    
    // Create interpretation metadata
    const interpretationMetadata = {
      interpretationId: uuidv4(),
      timestamp: new Date().toISOString(),
      method: interpretationMethod,
      algorithmType,
      algorithmName,
      options: interpretationOptions
    };
    
    // Store interpretation in working memory
    const memoryKey = `interpretation:${interpretationMetadata.interpretationId}`;
    await memoryIntegration.storeInWorkingMemory(memoryKey, {
      results,
      interpretation,
      metadata: interpretationMetadata
    });
    
    // Store in short-term memory for potential reuse
    await memoryIntegration.storeInShortTermMemory(
      memoryKey,
      {
        interpretation,
        metadata: interpretationMetadata
      },
      ['interpretation', algorithmType, algorithmName]
    );
    
    // Store in long-term memory for learning
    await memoryIntegration.storeInLongTermMemory(
      `interpretation:${algorithmType}:${algorithmName}:${interpretationMetadata.interpretationId}`,
      {
        results: JSON.stringify(results).length > 1000 ? 'Results too large' : results,
        interpretation,
        metadata: interpretationMetadata,
        businessContext
      },
      ['interpretation', algorithmType, algorithmName]
    );
    
    return {
      success: true,
      outputData: {
        interpretation,
        metadata: interpretationMetadata
      }
    };
  } catch (error) {
    console.error('Error in interpretation component:', error);
    return {
      success: false,
      errorMessage: error.message || 'Interpretation failed',
      outputData: null
    };
  }
};

/**
 * Generates interpretation of results
 */
async function generateInterpretation(
  results: any,
  algorithmType: string,
  algorithmName: string,
  method: string,
  options: any,
  businessContext?: any,
  previousInterpretations?: any[],
  memoryIntegration?: any
): Promise<any> {
  switch (method) {
    case 'openai':
      return await generateOpenAIInterpretation(
        results,
        algorithmType,
        algorithmName,
        options,
        businessContext,
        previousInterpretations
      );
      
    case 'template':
      return generateTemplateInterpretation(
        results,
        algorithmType,
        options?.template
      );
      
    case 'memory':
      return await generateMemoryBasedInterpretation(
        results,
        algorithmType,
        algorithmName,
        memoryIntegration
      );
      
    default:
      throw new Error(`Unsupported interpretation method: ${method}`);
  }
}

/**
 * Generates interpretation using OpenAI
 */
async function generateOpenAIInterpretation(
  results: any,
  algorithmType: string,
  algorithmName: string,
  options: any,
  businessContext?: any,
  previousInterpretations?: any[]
): Promise<any> {
  try {
    // Construct the prompt for OpenAI
    const prompt = constructInterpretationPrompt(
      results,
      algorithmType,
      algorithmName,
      businessContext,
      previousInterpretations
    );
    
    // Set up OpenAI API parameters
    const openAIParams = {
      model: options?.model || 'gpt-4',
      temperature: options?.temperature || 0.3,
      max_tokens: options?.maxTokens || 1000,
      top_p: options?.topP || 1,
      frequency_penalty: options?.frequencyPenalty || 0,
      presence_penalty: options?.presencePenalty || 0
    };
    
    // Call OpenAI API
    const response = await openai.createCompletion({
      ...openAIParams,
      prompt
    });
    
    // Extract interpretation from response
    const interpretationText = response.data.choices[0].text || '';
    
    // Parse structured interpretation if possible
    try {
      if (interpretationText.includes('{') && interpretationText.includes('}')) {
        const jsonMatch = interpretationText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error('Error parsing structured interpretation:', error);
    }
    
    // Return as text if parsing fails
    return {
      text: interpretationText.trim(),
      format: 'text'
    };
  } catch (error) {
    console.error('Error generating OpenAI interpretation:', error);
    throw error;
  }
}

/**
 * Constructs a prompt for interpretation generation
 */
function constructInterpretationPrompt(
  results: any,
  algorithmType: string,
  algorithmName: string,
  businessContext?: any,
  previousInterpretations?: any[]
): string {
  // Start with the base prompt
  let prompt = `Please interpret the following results from the ${algorithmType} algorithm "${algorithmName}":\n\n`;
  
  // Add results
  prompt += `Results:\n${JSON.stringify(results, null, 2)}\n\n`;
  
  // Add business context if provided
  if (businessContext) {
    prompt += `Business Context:\n${JSON.stringify(businessContext, null, 2)}\n\n`;
  }
  
  // Add previous interpretations if provided
  if (previousInterpretations && previousInterpretations.length > 0) {
    prompt += 'Previous Interpretations:\n';
    previousInterpretations.forEach((interp, index) => {
      prompt += `Interpretation ${index + 1}:\n${JSON.stringify(interp, null, 2)}\n\n`;
    });
  }
  
  // Add format instructions
  prompt += `
Please provide a comprehensive interpretation of these results with the following structure:
{
  "summary": "A brief 1-2 sentence summary of the results",
  "keyInsights": [
    "Key insight 1",
    "Key insight 2",
    ...
  ],
  "detailedAnalysis": "A detailed analysis of the results, including patterns, anomalies, and implications",
  "businessImplications": [
    {
      "area": "Business area affected",
      "impact": "Description of the impact",
      "recommendation": "Recommended action"
    },
    ...
  ],
  "confidenceLevel": "high/medium/low",
  "limitations": [
    "Limitation 1",
    "Limitation 2",
    ...
  ],
  "nextSteps": [
    "Recommended next step 1",
    "Recommended next step 2",
    ...
  ]
}

Ensure your interpretation:
1. Is data-driven and based on the actual results
2. Considers the business context provided
3. Builds upon previous interpretations if available
4. Provides actionable insights and recommendations
5. Acknowledges limitations and uncertainties
6. Is concise yet comprehensive

Return only the JSON structure with your interpretation.`;

  return prompt;
}

/**
 * Generates interpretation using a template
 */
function generateTemplateInterpretation(
  results: any,
  algorithmType: string,
  template?: string
): any {
  // Default template if none provided
  const defaultTemplate = `
    Summary: Results from ${algorithmType} algorithm show {{summary}}.
    
    Key metrics:
    {{#each metrics}}
    - {{@key}}: {{this}}
    {{/each}}
    
    Conclusion: {{conclusion}}
  `;
  
  const templateToUse = template || defaultTemplate;
  
  // Very basic template processing - in production use a proper template engine
  let interpretation = templateToUse;
  
  // Replace summary placeholder
  const summary = generateSummary(results, algorithmType);
  interpretation = interpretation.replace('{{summary}}', summary);
  
  // Replace conclusion placeholder
  const conclusion = generateConclusion(results, algorithmType);
  interpretation = interpretation.replace('{{conclusion}}', conclusion);
  
  // Replace metrics placeholders
  if (interpretation.includes('{{#each metrics}}')) {
    const metrics = extractMetrics(results);
    let metricsHtml = '';
    
    for (const [key, value] of Object.entries(metrics)) {
      metricsHtml += `- ${key}: ${value}\n`;
    }
    
    interpretation = interpretation.replace(
      /{{#each metrics}}[\s\S]*?{{\/each}}/,
      metricsHtml
    );
  }
  
  return {
    text: interpretation.trim(),
    format: 'template'
  };
}

/**
 * Generates interpretation based on similar past interpretations in memory
 */
async function generateMemoryBasedInterpretation(
  results: any,
  algorithmType: string,
  algorithmName: string,
  memoryIntegration: any
): Promise<any> {
  // Search for similar interpretations in long-term memory
  const similarInterpretations = await memoryIntegration.searchLongTermMemory<any>(
    `interpretation ${algorithmType} ${algorithmName} ${JSON.stringify(results).substring(0, 100)}`,
    3
  );
  
  if (similarInterpretations.length === 0) {
    // Fall back to template interpretation if no similar interpretations found
    return generateTemplateInterpretation(results, algorithmType);
  }
  
  // Combine insights from similar interpretations
  const combinedInterpretation = {
    summary: similarInterpretations[0].interpretation.summary || generateSummary(results, algorithmType),
    keyInsights: [] as string[],
    detailedAnalysis: similarInterpretations[0].interpretation.detailedAnalysis || '',
    businessImplications: [] as any[],
    confidenceLevel: 'medium',
    limitations: [] as string[],
    nextSteps: [] as string[]
  };
  
  // Collect unique insights from all similar interpretations
  const uniqueInsights = new Set<string>();
  const uniqueImplications = new Map<string, any>();
  const uniqueLimitations = new Set<string>();
  const uniqueNextSteps = new Set<string>();
  
  similarInterpretations.forEach(interp => {
    if (interp.interpretation.keyInsights) {
      interp.interpretation.keyInsights.forEach((insight: string) => uniqueInsights.add(insight));
    }
    
    if (interp.interpretation.businessImplications) {
      interp.interpretation.businessImplications.forEach((implication: any) => {
        if (implication.area) {
          uniqueImplications.set(implication.area, implication);
        }
      });
    }
    
    if (interp.interpretation.limitations) {
      interp.interpretation.limitations.forEach((limitation: string) => uniqueLimitations.add(limitation));
    }
    
    if (interp.interpretation.nextSteps) {
      interp.interpretation.nextSteps.forEach((step: string) => uniqueNextSteps.add(step));
    }
  });
  
  // Add collected insights to combined interpretation
  combinedInterpretation.keyInsights = Array.from(uniqueInsights);
  combinedInterpretation.businessImplications = Array.from(uniqueImplications.values());
  combinedInterpretation.limitations = Array.from(uniqueLimitations);
  combinedInterpretation.nextSteps = Array.from(uniqueNextSteps);
  
  return {
    ...combinedInterpretation,
    format: 'memory-based',
    source: 'similar_interpretations',
    similarCount: similarInterpretations.length
  };
}

/**
 * Generates a summary of results
 */
function generateSummary(results: any, algorithmType: string): string {
  if (Array.isArray(results)) {
    return `${results.length} items analyzed with ${algorithmType}`;
  }
  
  if (results.summary) {
    return results.summary;
  }
  
  if (typeof results === 'object' && results !== null) {
    const keys = Object.keys(results);
    if (keys.length > 0) {
      return `Analysis of ${keys.join(', ')}`;
    }
  }
  
  return `Results from ${algorithmType} algorithm`;
}

/**
 * Generates a conclusion based on results
 */
function generateConclusion(results: any, algorithmType: string): string {
  if (results.conclusion) {
    return results.conclusion;
  }
  
  if (results.thresholds) {
    const thresholdKeys = Object.keys(results.thresholds);
    const criticalThresholds = thresholdKeys.filter(key => 
      key.includes('_critical') && results.thresholds[key]);
    
    if (criticalThresholds.length > 0) {
      return `Critical thresholds exceeded for ${criticalThresholds.length} metrics`;
    }
    
    const warningThresholds = thresholdKeys.filter(key => 
      key.includes('_warning') && results.thresholds[key]);
    
    if (warningThresholds.length > 0) {
      return `Warning thresholds exceeded for ${warningThresholds.length} metrics`;
    }
  }
  
  return `Analysis complete for ${algorithmType}`;
}

/**
 * Extracts metrics from results
 */
function extractMetrics(results: any): Record<string, any> {
  const metrics: Record<string, any> = {};
  
  if (typeof results !== 'object' || results === null) {
    return metrics;
  }
  
  // Extract numeric values as metrics
  for (const [key, value] of Object.entries(results)) {
    if (typeof value === 'number') {
      metrics[key] = value;
    }
  }
  
  // Extract metrics object if it exists
  if (results.metrics && typeof results.metrics === 'object') {
    Object.assign(metrics, results.metrics);
  }
  
  return metrics;
}

/**
 * Register interpretation component
 */
export function registerInterpretationComponent(componentRegistry: any): void {
  componentRegistry.registerImplementation('interpretation', interpretationComponent);
}
