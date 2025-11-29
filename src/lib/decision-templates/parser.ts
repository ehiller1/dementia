/**
 * Decision Template Parser and Validator
 * 
 * This module provides utilities to parse, validate, and transform decision templates.
 * It ensures that templates are well-formed before they are stored or used.
 */
import { DecisionTemplate, TemplateInput, TemplateOutput, DeclarativePrompt, AgenticTask } from './types.ts';
import { z } from 'zod';

/**
 * Zod schema for template input validation
 */
const templateInputSchema = z.object({
  name: z.string().min(1, "Input name is required"),
  description: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  required: z.boolean(),
  defaultValue: z.any().optional(),
  enum: z.array(z.any()).optional(),
  format: z.string().optional(),
  nested: z.record(z.lazy(() => templateInputSchema)).optional(),
});

/**
 * Zod schema for template output validation
 */
const templateOutputSchema = z.object({
  name: z.string().min(1, "Output name is required"),
  description: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
});

/**
 * Zod schema for declarative prompt validation
 */
const declarativePromptSchema = z.object({
  prompt: z.string().min(1, "Prompt text is required"),
  description: z.string().optional(),
});

/**
 * Zod schema for agentic task validation
 */
const agenticTaskSchema = z.object({
  task: z.string().min(1, "Task description is required"),
  description: z.string().optional(),
  input_fields: z.array(z.string()),
  output: z.string().min(1, "Output field name is required"),
});

/**
 * Zod schema for full template validation
 */
const decisionTemplateSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters"),
  description: z.string().min(10, "Please provide a meaningful description"),
  inputs: z.array(templateInputSchema).min(1, "At least one input is required"),
  outputs: z.array(templateOutputSchema).min(1, "At least one output is required"),
  declarative_prompts: z.array(declarativePromptSchema).optional().default([]),
  agentic_tasks: z.array(agenticTaskSchema).min(1, "At least one agentic task is required"),
  tags: z.array(z.string()).optional().default([]),
  is_public: z.boolean().optional().default(false),
});

/**
 * Parse and validate a decision template
 * @param templateData The template data to validate
 * @returns The validated template or throws validation errors
 */
export function validateTemplate(templateData: any): DecisionTemplate {
  try {
    return decisionTemplateSchema.parse(templateData);
  } catch (error) {
    console.error('Template validation failed:', error);
    throw error;
  }
}

/**
 * Convert template inputs to JSON Schema for validation
 * @param inputs The template inputs
 * @returns A JSON Schema object for input validation
 */
export function generateInputSchema(inputs: TemplateInput[]): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  
  for (const input of inputs) {
    properties[input.name] = convertInputToJsonSchema(input);
    
    if (input.required) {
      required.push(input.name);
    }
  }
  
  return {
    type: 'object',
    properties,
    required
  };
}

/**
 * Convert template outputs to JSON Schema
 * @param outputs The template outputs
 * @returns A JSON Schema object for output validation
 */
export function generateOutputSchema(outputs: TemplateOutput[]): any {
  const properties: Record<string, any> = {};
  
  for (const output of outputs) {
    properties[output.name] = convertOutputToJsonSchema(output);
  }
  
  return {
    type: 'object',
    properties
  };
}

/**
 * Convert a template input to JSON Schema
 * @param input The input definition
 * @returns A JSON Schema for the input
 */
function convertInputToJsonSchema(input: TemplateInput): any {
  const schema: any = {
    type: input.type,
  };
  
  if (input.description) {
    schema.description = input.description;
  }
  
  if (input.enum) {
    schema.enum = input.enum;
  }
  
  if (input.format) {
    schema.format = input.format;
  }
  
  if (input.defaultValue !== undefined) {
    schema.default = input.defaultValue;
  }
  
  if (input.type === 'object' && input.nested) {
    schema.properties = {};
    schema.required = [];
    
    for (const [key, nestedInput] of Object.entries(input.nested)) {
      schema.properties[key] = convertInputToJsonSchema(nestedInput);
      
      if (nestedInput.required) {
        schema.required.push(key);
      }
    }
    
    if (schema.required.length === 0) {
      delete schema.required;
    }
  }
  
  if (input.type === 'array' && input.nested && Object.keys(input.nested)[0]) {
    const itemKey = Object.keys(input.nested)[0];
    schema.items = convertInputToJsonSchema(input.nested[itemKey]);
  }
  
  return schema;
}

/**
 * Convert a template output to JSON Schema
 * @param output The output definition
 * @returns A JSON Schema for the output
 */
function convertOutputToJsonSchema(output: TemplateOutput): any {
  const schema: any = {
    type: output.type,
  };
  
  if (output.description) {
    schema.description = output.description;
  }
  
  return schema;
}

/**
 * Prepare a template for storage in the database
 * @param template The validated template
 * @returns The prepared template ready for database storage
 */
export function prepareTemplateForStorage(template: DecisionTemplate): any {
  const inputSchema = generateInputSchema(template.inputs);
  const outputSchema = generateOutputSchema(template.outputs);
  
  return {
    name: template.name,
    description: template.description,
    template_schema: template,
    inputs_schema: inputSchema,
    outputs_schema: outputSchema,
    declarative_prompts: template.declarative_prompts,
    agentic_tasks: template.agentic_tasks,
    is_public: template.is_public ?? false,
    tags: template.tags ?? [],
  };
}

/**
 * Parse template string from YAML or JSON format
 * @param templateString The template as a string (YAML or JSON)
 * @returns The parsed template object
 */
export function parseTemplateString(templateString: string): any {
  try {
    // First try to parse as JSON
    return JSON.parse(templateString);
  } catch (e) {
    // If that fails, assume it's YAML
    try {
      // Simplified YAML-like parser - in a real implementation, use a proper YAML library
      const lines = templateString.split("\n");
      const result: any = { inputs: [], outputs: [], declarative_prompts: [], agentic_tasks: [] };
      let currentSection: string | null = null;
      let currentObject: any = null;
      
      for (const line of lines) {
        // Skip empty lines and comments
        if (line.trim() === '' || line.trim().startsWith('#')) {
          continue;
        }
        
        // Check for main sections
        if (line.match(/^[a-z_]+:/)) {
          const section = line.split(':')[0].trim();
          currentSection = section;
          
          if (section === 'inputs' || section === 'outputs' || 
              section === 'declarative_prompts' || section === 'agentic_tasks') {
            result[section] = [];
          }
          continue;
        }
        
        // Check for properties at the root level
        if (line.match(/^  [a-z_]+:/) && !line.trim().endsWith(':')) {
          const [key, value] = line.trim().split(':').map(part => part.trim());
          result[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
          continue;
        }
        
        // Handle array items
        if (line.match(/^  - /)) {
          if (currentSection === 'inputs' || currentSection === 'outputs' || 
              currentSection === 'declarative_prompts' || currentSection === 'agentic_tasks') {
            currentObject = {};
            result[currentSection].push(currentObject);
          }
          continue;
        }
        
        // Handle object properties
        if (line.match(/^    [a-z_]+:/) && currentObject) {
          const [key, value] = line.trim().split(':').map(part => part.trim());
          
          if (!value || value.endsWith(':')) {
            // This is a nested object or array
            currentObject[key] = line.includes('[') ? [] : {};
          } else {
            // This is a simple value
            currentObject[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
            
            // Convert to appropriate type
            if (value === 'true') currentObject[key] = true;
            if (value === 'false') currentObject[key] = false;
            if (!isNaN(Number(value))) currentObject[key] = Number(value);
          }
        }
      }
      
      return result;
    } catch (yamlError) {
      throw new Error(`Failed to parse template: ${yamlError.message}`);
    }
  }
}

/**
 * Validate template parameters against the schema
 * @param template The template with schema
 * @param params The parameters to validate
 * @returns Validated parameters or throws validation errors
 */
export function validateParameters(template: any, params: any): any {
  // Create a Zod schema from the template's input schema
  const inputSchema = generateZodSchemaFromJsonSchema(template.inputs_schema);
  
  try {
    return inputSchema.parse(params);
  } catch (error) {
    console.error('Parameter validation failed:', error);
    throw error;
  }
}

/**
 * Convert JSON Schema to Zod schema for runtime validation
 * @param jsonSchema The JSON Schema object
 * @returns A Zod schema for validation
 */
function generateZodSchemaFromJsonSchema(jsonSchema: any): z.ZodType<any> {
  if (jsonSchema.type === 'object') {
    const shape: Record<string, z.ZodType<any>> = {};
    
    for (const [key, propSchema] of Object.entries(jsonSchema.properties || {})) {
      shape[key] = generateZodSchemaFromJsonSchema(propSchema);
    }
    
    let schema = z.object(shape);
    
    // Handle required fields
    if (jsonSchema.required && jsonSchema.required.length > 0) {
      // No need to modify the schema, Zod handles required fields differently
    } else {
      // Make all fields optional if not required
      schema = schema.partial();
    }
    
    return schema;
  }
  
  if (jsonSchema.type === 'array') {
    const itemSchema = jsonSchema.items ? 
      generateZodSchemaFromJsonSchema(jsonSchema.items) : 
      z.any();
    
    return z.array(itemSchema);
  }
  
  if (jsonSchema.type === 'string') {
    let schema = z.string();
    
    if (jsonSchema.format === 'date') {
      schema = z.string().refine(val => !isNaN(Date.parse(val)), {
        message: "Invalid date format"
      });
    }
    
    if (jsonSchema.enum) {
      schema = z.enum(jsonSchema.enum as [string, ...string[]]);
    }
    
    return schema;
  }
  
  if (jsonSchema.type === 'number' || jsonSchema.type === 'integer') {
    return z.number();
  }
  
  if (jsonSchema.type === 'boolean') {
    return z.boolean();
  }
  
  return z.any();
}

/**
 * Fill a template string with parameter values
 * @param template The template string with {{param}} placeholders
 * @param params The parameter values
 * @returns The filled template string
 */
export function fillPromptTemplate(template: string, params: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    // Handle nested parameters like "user.name"
    const keys = key.trim().split('.');
    let value = params;
    
    for (const k of keys) {
      if (value === undefined || value === null) {
        return match; // Keep the original placeholder if value is undefined
      }
      value = value[k];
    }
    
    if (value === undefined || value === null) {
      return match; // Keep the original placeholder if value is undefined
    }
    
    return String(value);
  });
}
