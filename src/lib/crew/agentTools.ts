/**
 * Agent Tools for External Resources
 * 
 * Provides tools for agents to access external resources and services.
 * These tools can be assigned to agents in a crew to extend their capabilities.
 */

import { nanoid } from 'nanoid';
import { supabase } from '@/integrations/supabase/client';

// Types for agent tools
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: ToolParameter[];
  returns: ToolReturnType;
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

export interface ToolReturnType {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
}

export interface ToolExecutionResult {
  toolId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs: number;
}

/**
 * Tool registry for managing and executing agent tools
 */
export class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();
  
  constructor() {
    // Register built-in tools
    this.registerBuiltInTools();
  }
  
  /**
   * Register a new tool
   */
  registerTool(tool: AgentTool): void {
    this.tools.set(tool.id, tool);
    
    // Save to database
    this.saveToolToDatabase(tool).catch(err => {
      console.error('Error saving tool to database:', err);
    });
  }
  
  /**
   * Get a tool by ID
   */
  getTool(toolId: string): AgentTool | undefined {
    return this.tools.get(toolId);
  }
  
  /**
   * Get all tools
   */
  getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): AgentTool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }
  
  /**
   * Execute a tool with the given parameters
   */
  async executeTool(
    toolId: string,
    params: Record<string, any>
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      const tool = this.getTool(toolId);
      if (!tool) {
        throw new Error(`Tool with ID ${toolId} not found`);
      }
      
      // Validate parameters
      this.validateToolParameters(tool, params);
      
      // Execute the tool
      const result = await tool.execute(params);
      
      // Log execution
      this.logToolExecution(toolId, params, result, true).catch(err => {
        console.error('Error logging tool execution:', err);
      });
      
      return {
        toolId,
        success: true,
        result,
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      // Log execution error
      this.logToolExecution(toolId, params, null, false, error.message).catch(err => {
        console.error('Error logging tool execution:', err);
      });
      
      return {
        toolId,
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime
      };
    }
  }
  
  /**
   * Validate tool parameters
   */
  private validateToolParameters(
    tool: AgentTool,
    params: Record<string, any>
  ): void {
    for (const param of tool.parameters) {
      // Check if required parameter is missing
      if (param.required && (params[param.name] === undefined || params[param.name] === null)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }
      
      // Check parameter type if provided
      if (params[param.name] !== undefined && params[param.name] !== null) {
        const paramValue = params[param.name];
        const expectedType = param.type;
        
        let actualType = typeof paramValue;
        if (Array.isArray(paramValue)) {
          actualType = 'array';
        } else if (actualType === 'object' && paramValue !== null) {
          actualType = 'object';
        }
        
        if (actualType !== expectedType) {
          throw new Error(
            `Parameter '${param.name}' has incorrect type. Expected '${expectedType}', got '${actualType}'`
          );
        }
      }
    }
  }
  
  /**
   * Register built-in tools
   */
  private registerBuiltInTools(): void {
    // Web Search Tool
    this.registerTool({
      id: 'web-search',
      name: 'Web Search',
      description: 'Search the web for information',
      category: 'information',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'The search query',
          required: true
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results to return',
          required: false,
          default: 5
        }
      ],
      returns: {
        type: 'array',
        description: 'Array of search results with title, url, and snippet'
      },
      execute: async (params) => {
        try {
          // In a real implementation, this would use a search API
          // For now, we'll simulate search results
          const results = [
            {
              title: `Result for "${params.query}" - 1`,
              url: `https://example.com/search?q=${encodeURIComponent(params.query)}&result=1`,
              snippet: `This is a snippet for the search query "${params.query}". It contains relevant information about the topic.`
            },
            {
              title: `Result for "${params.query}" - 2`,
              url: `https://example.com/search?q=${encodeURIComponent(params.query)}&result=2`,
              snippet: `Another snippet for the search query "${params.query}". It provides additional context and information.`
            }
          ];
          
          return results.slice(0, params.limit || 5);
        } catch (error) {
          console.error('Error executing web search:', error);
          throw new Error(`Web search failed: ${error.message}`);
        }
      }
    });
    
    // Weather API Tool
    this.registerTool({
      id: 'weather-api',
      name: 'Weather API',
      description: 'Get current weather information for a location',
      category: 'information',
      parameters: [
        {
          name: 'location',
          type: 'string',
          description: 'The location to get weather for (city name or coordinates)',
          required: true
        },
        {
          name: 'units',
          type: 'string',
          description: 'Units for temperature (metric, imperial, standard)',
          required: false,
          default: 'metric'
        }
      ],
      returns: {
        type: 'object',
        description: 'Weather information including temperature, conditions, and forecast'
      },
      execute: async (params) => {
        try {
          // In a real implementation, this would call a weather API
          // For now, we'll return simulated weather data
          return {
            location: params.location,
            temperature: 22,
            units: params.units || 'metric',
            conditions: 'Partly Cloudy',
            humidity: 65,
            windSpeed: 10,
            forecast: [
              { day: 'Today', high: 24, low: 18, conditions: 'Partly Cloudy' },
              { day: 'Tomorrow', high: 26, low: 19, conditions: 'Sunny' }
            ]
          };
        } catch (error) {
          console.error('Error executing weather API:', error);
          throw new Error(`Weather API failed: ${error.message}`);
        }
      }
    });
    
    // Database Query Tool
    this.registerTool({
      id: 'database-query',
      name: 'Database Query',
      description: 'Query the database for information',
      category: 'data',
      parameters: [
        {
          name: 'table',
          type: 'string',
          description: 'The table to query',
          required: true
        },
        {
          name: 'columns',
          type: 'array',
          description: 'The columns to select',
          required: false,
          default: ['*']
        },
        {
          name: 'filters',
          type: 'object',
          description: 'Filters to apply to the query',
          required: false
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results to return',
          required: false,
          default: 10
        }
      ],
      returns: {
        type: 'array',
        description: 'Array of query results'
      },
      execute: async (params) => {
        try {
          // Build the query
          let query = supabase
            .from(params.table)
            .select(params.columns ? params.columns.join(',') : '*');
          
          // Apply filters if provided
          if (params.filters) {
            for (const [key, value] of Object.entries(params.filters)) {
              query = query.eq(key, value);
            }
          }
          
          // Apply limit
          if (params.limit) {
            query = query.limit(params.limit);
          }
          
          // Execute the query
          const { data, error } = await query;
          
          if (error) {
            throw new Error(`Database query error: ${error.message}`);
          }
          
          return data;
        } catch (error) {
          console.error('Error executing database query:', error);
          throw new Error(`Database query failed: ${error.message}`);
        }
      }
    });
    
    // File Storage Tool
    this.registerTool({
      id: 'file-storage',
      name: 'File Storage',
      description: 'Store and retrieve files',
      category: 'storage',
      parameters: [
        {
          name: 'action',
          type: 'string',
          description: 'The action to perform (upload, download, list)',
          required: true
        },
        {
          name: 'path',
          type: 'string',
          description: 'The file path or directory',
          required: true
        },
        {
          name: 'content',
          type: 'string',
          description: 'The file content (for upload)',
          required: false
        },
        {
          name: 'metadata',
          type: 'object',
          description: 'File metadata',
          required: false
        }
      ],
      returns: {
        type: 'object',
        description: 'Result of the file operation'
      },
      execute: async (params) => {
        try {
          switch (params.action) {
            case 'upload':
              if (!params.content) {
                throw new Error('Content is required for upload action');
              }
              
              const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('agent-files')
                .upload(params.path, params.content, {
                  contentType: 'text/plain',
                  upsert: true,
                  metadata: params.metadata
                });
              
              if (uploadError) {
                throw new Error(`File upload error: ${uploadError.message}`);
              }
              
              return {
                success: true,
                path: params.path,
                ...uploadData
              };
              
            case 'download':
              const { data: downloadData, error: downloadError } = await supabase
                .storage
                .from('agent-files')
                .download(params.path);
              
              if (downloadError) {
                throw new Error(`File download error: ${downloadError.message}`);
              }
              
              // Convert blob to text
              const content = await downloadData.text();
              
              return {
                success: true,
                path: params.path,
                content
              };
              
            case 'list':
              const { data: listData, error: listError } = await supabase
                .storage
                .from('agent-files')
                .list(params.path);
              
              if (listError) {
                throw new Error(`File list error: ${listError.message}`);
              }
              
              return {
                success: true,
                path: params.path,
                files: listData
              };
              
            default:
              throw new Error(`Unknown action: ${params.action}`);
          }
        } catch (error) {
          console.error('Error executing file storage operation:', error);
          throw new Error(`File storage operation failed: ${error.message}`);
        }
      }
    });
    
    // External API Tool
    this.registerTool({
      id: 'external-api',
      name: 'External API',
      description: 'Make requests to external APIs',
      category: 'integration',
      parameters: [
        {
          name: 'url',
          type: 'string',
          description: 'The API endpoint URL',
          required: true
        },
        {
          name: 'method',
          type: 'string',
          description: 'HTTP method (GET, POST, PUT, DELETE)',
          required: false,
          default: 'GET'
        },
        {
          name: 'headers',
          type: 'object',
          description: 'HTTP headers',
          required: false,
          default: { 'Content-Type': 'application/json' }
        },
        {
          name: 'body',
          type: 'object',
          description: 'Request body (for POST, PUT)',
          required: false
        }
      ],
      returns: {
        type: 'object',
        description: 'API response data'
      },
      execute: async (params) => {
        try {
          // In a real implementation, this would make an actual API request
          // For now, we'll simulate an API response
          
          // Validate URL
          if (!params.url.startsWith('http')) {
            throw new Error('URL must start with http:// or https://');
          }
          
          // Simulate different responses based on URL
          if (params.url.includes('example.com')) {
            return {
              status: 200,
              data: {
                message: 'Success',
                timestamp: new Date().toISOString(),
                method: params.method,
                url: params.url
              }
            };
          } else {
            return {
              status: 404,
              data: {
                message: 'Not found',
                timestamp: new Date().toISOString(),
                method: params.method,
                url: params.url
              }
            };
          }
        } catch (error) {
          console.error('Error executing external API request:', error);
          throw new Error(`External API request failed: ${error.message}`);
        }
      }
    });
  }
  
  /**
   * Save a tool to the database
   */
  private async saveToolToDatabase(tool: AgentTool): Promise<void> {
    try {
      // Convert tool to database format
      const toolData = {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        parameters: tool.parameters.map(p => ({
          name: p.name,
          type: p.type,
          description: p.description,
          required: p.required,
          default: p.default
        })),
        returns: {
          type: tool.returns.type,
          description: tool.returns.description
        }
      };
      
      // Save to database
      const { error } = await supabase
        .from('agent_tools')
        .upsert(toolData);
        
      if (error) {
        console.error('Error saving tool to database:', error);
      }
    } catch (err) {
      console.error('Exception saving tool to database:', err);
    }
  }
  
  /**
   * Log tool execution
   */
  private async logToolExecution(
    toolId: string,
    params: Record<string, any>,
    result: any,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const { error: dbError } = await supabase
        .from('agent_tool_executions')
        .insert({
          tool_id: toolId,
          parameters: params,
          result: success ? result : null,
          success,
          error: error || null,
          execution_time_ms: Date.now(),
          timestamp: new Date().toISOString()
        });
        
      if (dbError) {
        console.error('Error logging tool execution to database:', dbError);
      }
    } catch (err) {
      console.error('Exception logging tool execution to database:', err);
    }
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
