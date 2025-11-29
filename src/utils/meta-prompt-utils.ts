/**
 * Meta-Prompt Utilities for Frontend/Backend API
 * Helper functions for retrieving and applying meta-prompts from the database
 */
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Lazily initialize OpenAI to avoid crashing frontend if key is missing
function getOpenAI(): OpenAI | null {
  const apiKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_OPENAI_API_KEY)
    || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    return new OpenAI({ apiKey });
  } catch (e) {
    console.error('Failed to initialize OpenAI client', e);
    return null;
  }
}

// Default prompt responses when parsing fails
export const DEFAULT_FORMATS = {
  narrative: {
    narrativeText: '',
    mood: 'neutral',
    characters: [],
    setting: '',
    plot: '',
    nextSteps: []
  },
  action: {
    suggestions: [],
    context: '',
    reasoning: ''
  },
  simulator: {
    simulation: '',
    outcome: '',
    probability: 0.5,
    alternatives: []
  }
};

/**
 * Fetches a meta prompt by name from the database
 * @param supabase Supabase client instance
 * @param name Name of the prompt to fetch ('meta', 'dynamic', 'narrative', 'action', 'simulator')
 * @returns The prompt content or null if not found
 */
export async function getMetaPrompt(supabase: any, name: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('meta-prompts')
      .select('content')
      .eq('name', name)
      .single();
    
    if (error) {
      console.error(`Error fetching meta prompt '${name}':`, error);
      return null;
    }
    
    return data?.content;
  } catch (err) {
    console.error(`Exception fetching meta prompt '${name}':`, err);
    return null;
  }
}

/**
 * Applies parameters to a prompt template
 * @param template The prompt template with placeholders
 * @param params Object containing key-value pairs to replace in the template
 * @returns The customized prompt with placeholders replaced
 */
export function applyPromptTemplate(template: string, params: Record<string, any> = {}): string {
  if (!template) return '';
  
  let result = template;
  
  // Replace all placeholders with actual values
  for (const [key, value] of Object.entries(params)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value || '');
  }
  
  return result;
}

/**
 * Parses a prompt response into a structured object
 * @param response The response string to parse
 * @param promptType Type of prompt used ('narrative', 'action', 'simulator')
 * @returns Parsed JSON object or default format
 */
export function parsePromptResponse(response: string, promptType: string): any {
  if (!response) return DEFAULT_FORMATS[promptType] || {};
  
  try {
    // For responses that should be JSON
    return JSON.parse(response);
  } catch (err) {
    console.error(`Error parsing ${promptType} prompt response as JSON:`, err);
    return DEFAULT_FORMATS[promptType] || {};
  }
}

/**
 * Generates a response using OpenAI based on a meta prompt
 * @param supabase Supabase client instance
 * @param promptName Name of the prompt to use ('narrative', 'action', 'simulator')
 * @param params Parameters to apply to the prompt template
 * @returns Structured response based on the prompt type
 */
export async function generatePromptResponse(
  supabase: any,
  promptName: 'narrative' | 'action' | 'simulator' | 'meta' | 'dynamic', 
  params: Record<string, any> = {}
): Promise<Record<string, any>> {
  try {
    // 1. Fetch the meta prompt
    const promptContent = await getMetaPrompt(supabase, promptName);
    
    if (!promptContent) {
      console.error(`Meta prompt '${promptName}' not found`);
      return DEFAULT_FORMATS[promptName] || {};
    }
    
    // 2. Apply parameters to the prompt template
    const finalPrompt = applyPromptTemplate(promptContent, params);
    
    // 3. Generate response with OpenAI (if configured)
    const openai = getOpenAI();
    if (!openai) {
      console.warn('OPENAI API key not configured; returning default format for', promptName);
      return DEFAULT_FORMATS[promptName] || {};
    }
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: finalPrompt }],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const responseContent = response.choices[0]?.message?.content?.trim() || '';
    
    // 4. Parse the response into structured format
    return parsePromptResponse(responseContent, promptName);
  } catch (err) {
    console.error(`Error generating ${promptName} response:`, err);
    return DEFAULT_FORMATS[promptName] || {};
  }
}
