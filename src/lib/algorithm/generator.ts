/**
 * Algorithm Generator
 * 
 * This module handles the generation of algorithm implementations using LLMs.
 * It prompts the LLM with context about a problem and dataset to generate executable code.
 */
import OpenAI from 'openai';
import { AlgorithmDefinition, AlgorithmParameter } from './types.ts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an algorithm implementation using an LLM
 * 
 * @param problem The problem description
 * @param datasetDescription Description of the dataset
 * @param sampleData Sample data to help the LLM understand the structure
 * @param constraints Any constraints on the algorithm implementation
 * @returns A fully defined algorithm that can be executed
 */
export async function generateAlgorithm(
  problem: string,
  datasetDescription: string,
  sampleData: any,
  constraints: string[] = [],
  language: 'python' | 'javascript' | 'sql' = 'python'
): Promise<AlgorithmDefinition> {
  // Build a comprehensive prompt for the LLM
  const prompt = buildAlgorithmPrompt(problem, datasetDescription, sampleData, constraints, language);
  
  // Get completion from OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 4000,
  });
  
  // Parse the LLM response into a structured algorithm definition
  const response = completion.choices[0].message.content;
  return parseAlgorithmFromLLMResponse(response, language);
}

/**
 * Build a prompt for algorithm generation
 */
function buildAlgorithmPrompt(
  problem: string,
  datasetDescription: string,
  sampleData: any,
  constraints: string[],
  language: string
): string {
  return `
You are an expert algorithm designer tasked with creating a ${language} implementation for a data analysis problem.

PROBLEM:
${problem}

DATASET DESCRIPTION:
${datasetDescription}

SAMPLE DATA:
\`\`\`json
${JSON.stringify(sampleData, null, 2)}
\`\`\`

${constraints.length > 0 ? `CONSTRAINTS:\n${constraints.join('\n')}` : ''}

I need you to generate a complete algorithm implementation in ${language} that solves this problem.
Your response should strictly follow this JSON format:

\`\`\`json
{
  "name": "Algorithm name",
  "description": "Detailed algorithm description",
  "inputSchema": {
    "type": "object",
    "properties": {
      "datasetKey": {
        "type": "array",
        "description": "Description of input"
      }
    },
    "required": ["datasetKey"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "resultKey": {
        "type": "string",
        "description": "Description of output"
      }
    }
  },
  "parameters": [
    {
      "name": "paramName",
      "description": "Parameter description",
      "type": "string|number|boolean|object|array",
      "default": "defaultValue",
      "required": true|false
    }
  ],
  "implementation": "# Full code implementation here\\n..."
}
\`\`\`

Important requirements:
1. The implementation must be complete and executable
2. Handle edge cases and errors gracefully
3. Include informative comments
4. Be efficient and follow best practices
5. The code must work directly with the sample data format provided

Do not include backticks or markdown in the implementation field itself, just the raw code.
`;
}

/**
 * Parse an LLM response into a structured algorithm definition
 */
function parseAlgorithmFromLLMResponse(
  response: string,
  language: 'python' | 'javascript' | 'sql'
): AlgorithmDefinition {
  // Extract JSON from the response
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                   response.match(/```\n([\s\S]*?)\n```/) ||
                   response.match(/\{[\s\S]*\}/);
  
  let algorithmJson: string;
  
  if (jsonMatch) {
    algorithmJson = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
  } else {
    throw new Error('Failed to extract JSON from LLM response');
  }
  
  try {
    const parsed = JSON.parse(algorithmJson);
    
    // Validate the parsed algorithm has required fields
    const requiredFields = ['name', 'description', 'inputSchema', 'outputSchema', 'implementation'];
    for (const field of requiredFields) {
      if (!parsed[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Ensure parameters is an array
    if (!parsed.parameters || !Array.isArray(parsed.parameters)) {
      parsed.parameters = [];
    }
    
    // Add language if not specified
    parsed.language = parsed.language || language;
    
    return parsed as AlgorithmDefinition;
  } catch (error) {
    throw new Error(`Failed to parse algorithm JSON: ${error.message}`);
  }
}

/**
 * Generate algorithm input examples based on sample data
 */
export function generateInputExamples(
  sampleData: any,
  inputSchema: any
): Record<string, any> {
  // Extract sample inputs that match the input schema
  const examples: Record<string, any> = {};
  
  if (inputSchema.properties) {
    Object.keys(inputSchema.properties).forEach(key => {
      if (sampleData[key] !== undefined) {
        examples[key] = sampleData[key];
      }
    });
  }
  
  return examples;
}
