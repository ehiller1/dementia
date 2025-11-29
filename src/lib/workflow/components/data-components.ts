/**
 * Data Components for Workflow System
 * Specialized components for data receipt, normalization, and processing
 */

import { 
  ComponentImplementation, 
  ComponentExecutionContext,
  ComponentExecutionResult,
  WorkflowComponentType
} from '../types.ts';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Receipt Component
 * Handles receiving data from various sources and formats
 */
export const dataReceiptComponent: ComponentImplementation = async (
  context: ComponentExecutionContext
): Promise<ComponentExecutionResult> => {
  try {
    const { inputData, memoryIntegration } = context;
    const { source, format, parameters } = inputData;
    
    let receivedData: any = null;
    let metadata: any = {
      receivedAt: new Date().toISOString(),
      source,
      format
    };
    
    // Process based on source type
    switch (source) {
      case 'api':
        // Handle API data source
        receivedData = await handleApiDataSource(inputData);
        break;
        
      case 'file':
        // Handle file data source
        receivedData = await handleFileDataSource(inputData);
        break;
        
      case 'database':
        // Handle database data source
        receivedData = await handleDatabaseDataSource(inputData);
        break;
        
      case 'memory':
        // Retrieve from memory system
        if (parameters.memoryType === 'working') {
          receivedData = await memoryIntegration.getFromWorkingMemory(parameters.key);
        } else if (parameters.memoryType === 'short-term') {
          receivedData = await memoryIntegration.getFromShortTermMemory(parameters.key);
        } else if (parameters.memoryType === 'long-term') {
          receivedData = await memoryIntegration.getFromLongTermMemory(parameters.key);
        }
        break;
        
      case 'user-input':
        // Use provided user input
        receivedData = inputData.userData;
        break;
        
      default:
        throw new Error(`Unsupported data source: ${source}`);
    }
    
    // Store received data in working memory
    if (receivedData) {
      const memoryKey = `data:receipt:${uuidv4()}`;
      await memoryIntegration.storeInWorkingMemory(memoryKey, {
        data: receivedData,
        metadata
      });
      
      // Also store in short-term memory for potential reuse
      await memoryIntegration.storeInShortTermMemory(
        memoryKey,
        {
          data: receivedData,
          metadata
        },
        ['data_receipt', source, format]
      );
    }
    
    return {
      success: true,
      outputData: {
        data: receivedData,
        metadata
      }
    };
  } catch (error) {
    console.error('Error in data receipt component:', error);
    return {
      success: false,
      errorMessage: error.message || 'Data receipt failed',
      outputData: null
    };
  }
};

/**
 * Data Normalization Component
 * Normalizes data into a standard format
 */
export const dataNormalizationComponent: ComponentImplementation = async (
  context: ComponentExecutionContext
): Promise<ComponentExecutionResult> => {
  try {
    const { inputData, memoryIntegration } = context;
    const { data, schema, normalizationRules } = inputData;
    
    // Apply normalization rules
    const normalizedData = await normalizeData(data, schema, normalizationRules);
    
    // Store normalized data in working memory
    const memoryKey = `data:normalized:${uuidv4()}`;
    await memoryIntegration.storeInWorkingMemory(memoryKey, {
      originalData: data,
      normalizedData,
      schema,
      normalizationRules
    });
    
    return {
      success: true,
      outputData: {
        normalizedData,
        schema
      }
    };
  } catch (error) {
    console.error('Error in data normalization component:', error);
    return {
      success: false,
      errorMessage: error.message || 'Data normalization failed',
      outputData: null
    };
  }
};

/**
 * Data Validation Component
 * Validates data against a schema or rules
 */
export const dataValidationComponent: ComponentImplementation = async (
  context: ComponentExecutionContext
): Promise<ComponentExecutionResult> => {
  try {
    const { inputData } = context;
    const { data, validationRules, schema } = inputData;
    
    // Validate data
    const validationResult = validateData(data, validationRules, schema);
    
    if (!validationResult.valid) {
      return {
        success: false,
        errorMessage: 'Data validation failed',
        outputData: {
          valid: false,
          errors: validationResult.errors
        }
      };
    }
    
    return {
      success: true,
      outputData: {
        valid: true,
        validatedData: data
      }
    };
  } catch (error) {
    console.error('Error in data validation component:', error);
    return {
      success: false,
      errorMessage: error.message || 'Data validation failed',
      outputData: {
        valid: false,
        errors: [error.message]
      }
    };
  }
};

/**
 * Data Transformation Component
 * Transforms data from one format to another
 */
export const dataTransformationComponent: ComponentImplementation = async (
  context: ComponentExecutionContext
): Promise<ComponentExecutionResult> => {
  try {
    const { inputData, memoryIntegration } = context;
    const { data, transformationRules, targetFormat } = inputData;
    
    // Transform data
    const transformedData = transformData(data, transformationRules, targetFormat);
    
    // Store transformed data in working memory
    const memoryKey = `data:transformed:${uuidv4()}`;
    await memoryIntegration.storeInWorkingMemory(memoryKey, {
      originalData: data,
      transformedData,
      transformationRules,
      targetFormat
    });
    
    return {
      success: true,
      outputData: {
        transformedData,
        format: targetFormat
      }
    };
  } catch (error) {
    console.error('Error in data transformation component:', error);
    return {
      success: false,
      errorMessage: error.message || 'Data transformation failed',
      outputData: null
    };
  }
};

/**
 * Data Enrichment Component
 * Enriches data with additional information
 */
export const dataEnrichmentComponent: ComponentImplementation = async (
  context: ComponentExecutionContext
): Promise<ComponentExecutionResult> => {
  try {
    const { inputData, memoryIntegration } = context;
    const { data, enrichmentSources } = inputData;
    
    // Enrich data from various sources
    const enrichedData = await enrichData(data, enrichmentSources, memoryIntegration);
    
    return {
      success: true,
      outputData: {
        enrichedData
      }
    };
  } catch (error) {
    console.error('Error in data enrichment component:', error);
    return {
      success: false,
      errorMessage: error.message || 'Data enrichment failed',
      outputData: null
    };
  }
};

// Helper functions

/**
 * Handles API data source
 */
async function handleApiDataSource(inputData: any): Promise<any> {
  const { parameters } = inputData;
  const { url, method, headers, body } = parameters;
  
  try {
    const response = await fetch(url, {
      method: method || 'GET',
      headers: headers || {},
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching API data:', error);
    throw error;
  }
}

/**
 * Handles file data source
 */
async function handleFileDataSource(inputData: any): Promise<any> {
  const { parameters } = inputData;
  const { fileContent, format } = parameters;
  
  try {
    if (format === 'json') {
      return JSON.parse(fileContent);
    } else if (format === 'csv') {
      // Simple CSV parsing (in production, use a proper CSV library)
      return fileContent.split('\n').map(line => line.split(','));
    } else {
      return fileContent;
    }
  } catch (error) {
    console.error('Error parsing file data:', error);
    throw error;
  }
}

/**
 * Handles database data source
 */
async function handleDatabaseDataSource(inputData: any): Promise<any> {
  const { parameters } = inputData;
  const { table, query, filters } = parameters;
  
  try {
    let dbQuery = supabase.from(table).select(query || '*');
    
    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        dbQuery = dbQuery.eq(key, value);
      });
    }
    
    const { data, error } = await dbQuery;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching database data:', error);
    throw error;
  }
}

/**
 * Normalizes data according to schema and rules
 */
function normalizeData(data: any, schema: any, rules: any): any {
  // Basic implementation - in production, use a more robust solution
  if (Array.isArray(data)) {
    return data.map(item => normalizeData(item, schema, rules));
  }
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const normalized: any = {};
  
  // Apply schema
  if (schema) {
    Object.keys(schema).forEach(key => {
      if (data[key] !== undefined) {
        normalized[key] = data[key];
      } else if (schema[key].default !== undefined) {
        normalized[key] = schema[key].default;
      }
    });
  } else {
    Object.assign(normalized, data);
  }
  
  // Apply normalization rules
  if (rules) {
    Object.entries(rules).forEach(([key, rule]: [string, any]) => {
      if (normalized[key] !== undefined) {
        if (rule.type === 'string' && typeof normalized[key] !== 'string') {
          normalized[key] = String(normalized[key]);
        } else if (rule.type === 'number' && typeof normalized[key] !== 'number') {
          normalized[key] = Number(normalized[key]);
        } else if (rule.type === 'boolean' && typeof normalized[key] !== 'boolean') {
          normalized[key] = Boolean(normalized[key]);
        } else if (rule.type === 'date' && !(normalized[key] instanceof Date)) {
          normalized[key] = new Date(normalized[key]);
        }
        
        // Apply transformations
        if (rule.transform === 'lowercase' && typeof normalized[key] === 'string') {
          normalized[key] = normalized[key].toLowerCase();
        } else if (rule.transform === 'uppercase' && typeof normalized[key] === 'string') {
          normalized[key] = normalized[key].toUpperCase();
        } else if (rule.transform === 'trim' && typeof normalized[key] === 'string') {
          normalized[key] = normalized[key].trim();
        }
      }
    });
  }
  
  return normalized;
}

/**
 * Validates data against schema and rules
 */
function validateData(data: any, rules: any, schema: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Basic implementation - in production, use a validation library
  if (schema) {
    Object.entries(schema).forEach(([key, fieldSchema]: [string, any]) => {
      if (fieldSchema.required && (data[key] === undefined || data[key] === null)) {
        errors.push(`Field '${key}' is required`);
      }
      
      if (data[key] !== undefined) {
        if (fieldSchema.type === 'string' && typeof data[key] !== 'string') {
          errors.push(`Field '${key}' must be a string`);
        } else if (fieldSchema.type === 'number' && typeof data[key] !== 'number') {
          errors.push(`Field '${key}' must be a number`);
        } else if (fieldSchema.type === 'boolean' && typeof data[key] !== 'boolean') {
          errors.push(`Field '${key}' must be a boolean`);
        }
        
        if (fieldSchema.minLength && typeof data[key] === 'string' && data[key].length < fieldSchema.minLength) {
          errors.push(`Field '${key}' must be at least ${fieldSchema.minLength} characters long`);
        }
        
        if (fieldSchema.maxLength && typeof data[key] === 'string' && data[key].length > fieldSchema.maxLength) {
          errors.push(`Field '${key}' must be at most ${fieldSchema.maxLength} characters long`);
        }
      }
    });
  }
  
  // Apply validation rules
  if (rules) {
    Object.entries(rules).forEach(([key, rule]: [string, any]) => {
      if (rule.required && (data[key] === undefined || data[key] === null)) {
        errors.push(`Field '${key}' is required`);
      }
      
      if (data[key] !== undefined) {
        if (rule.pattern && typeof data[key] === 'string') {
          const regex = new RegExp(rule.pattern);
          if (!regex.test(data[key])) {
            errors.push(`Field '${key}' does not match pattern ${rule.pattern}`);
          }
        }
        
        if (rule.min !== undefined && typeof data[key] === 'number' && data[key] < rule.min) {
          errors.push(`Field '${key}' must be at least ${rule.min}`);
        }
        
        if (rule.max !== undefined && typeof data[key] === 'number' && data[key] > rule.max) {
          errors.push(`Field '${key}' must be at most ${rule.max}`);
        }
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Transforms data according to rules and target format
 */
function transformData(data: any, rules: any, targetFormat: string): any {
  // Basic implementation - in production, use a more robust solution
  if (targetFormat === 'json') {
    return data; // Already in JS object format
  } else if (targetFormat === 'csv') {
    if (Array.isArray(data)) {
      // Convert array of objects to CSV
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      );
      
      return [headers, ...rows].join('\n');
    } else {
      return Object.values(data).join(',');
    }
  } else if (targetFormat === 'xml') {
    // Very basic XML conversion - use a proper XML library in production
    const toXml = (obj: any, rootName: string): string => {
      if (typeof obj !== 'object' || obj === null) {
        return `<${rootName}>${obj}</${rootName}>`;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => toXml(item, 'item')).join('');
      }
      
      return `<${rootName}>${
        Object.entries(obj).map(([key, value]) => 
          toXml(value, key)
        ).join('')
      }</${rootName}>`;
    };
    
    return toXml(data, 'root');
  }
  
  // Apply transformation rules
  if (rules) {
    if (Array.isArray(data)) {
      return data.map(item => {
        const transformed: any = { ...item };
        
        Object.entries(rules).forEach(([key, rule]: [string, any]) => {
          if (rule.rename) {
            transformed[rule.rename] = transformed[key];
            delete transformed[key];
          }
          
          if (rule.format === 'date' && transformed[key]) {
            transformed[key] = new Date(transformed[key]).toISOString();
          }
        });
        
        return transformed;
      });
    } else {
      const transformed: any = { ...data };
      
      Object.entries(rules).forEach(([key, rule]: [string, any]) => {
        if (rule.rename) {
          transformed[rule.rename] = transformed[key];
          delete transformed[key];
        }
        
        if (rule.format === 'date' && transformed[key]) {
          transformed[key] = new Date(transformed[key]).toISOString();
        }
      });
      
      return transformed;
    }
  }
  
  return data;
}

/**
 * Enriches data with additional information
 */
async function enrichData(data: any, sources: any[], memoryIntegration: any): Promise<any> {
  const enriched = { ...data };
  
  for (const source of sources) {
    try {
      switch (source.type) {
        case 'memory':
          // Enrich from memory
          if (source.memoryType === 'short-term') {
            const memoryData = await memoryIntegration.getFromShortTermMemory(source.key);
            if (memoryData) {
              enriched[source.targetField] = memoryData;
            }
          } else if (source.memoryType === 'long-term') {
            const memoryData = await memoryIntegration.getFromLongTermMemory(source.key);
            if (memoryData) {
              enriched[source.targetField] = memoryData;
            }
          }
          break;
          
        case 'api':
          // Enrich from API
          const apiData = await handleApiDataSource({ parameters: source.parameters });
          if (apiData) {
            enriched[source.targetField] = apiData;
          }
          break;
          
        case 'database':
          // Enrich from database
          const dbData = await handleDatabaseDataSource({ parameters: source.parameters });
          if (dbData) {
            enriched[source.targetField] = dbData;
          }
          break;
          
        case 'computed':
          // Compute a new field based on existing data
          if (source.formula === 'concat') {
            enriched[source.targetField] = source.fields.map((field: string) => enriched[field]).join(source.separator || '');
          } else if (source.formula === 'sum') {
            enriched[source.targetField] = source.fields.reduce((sum: number, field: string) => sum + (Number(enriched[field]) || 0), 0);
          } else if (source.formula === 'average') {
            const values = source.fields.map((field: string) => Number(enriched[field]) || 0);
            enriched[source.targetField] = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
          }
          break;
      }
    } catch (error) {
      console.error(`Error enriching data from source ${source.type}:`, error);
      // Continue with other sources even if one fails
    }
  }
  
  return enriched;
}

/**
 * Register data components
 */
export function registerDataComponents(componentRegistry: any): void {
  componentRegistry.registerImplementation('data-receipt', dataReceiptComponent);
  componentRegistry.registerImplementation('data-normalization', dataNormalizationComponent);
  componentRegistry.registerImplementation('data-validation', dataValidationComponent);
  componentRegistry.registerImplementation('data-transformation', dataTransformationComponent);
  componentRegistry.registerImplementation('data-enrichment', dataEnrichmentComponent);
}
