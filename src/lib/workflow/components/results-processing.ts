/**
 * Results Processing Component
 * Processes and formats algorithm execution results
 */

import { 
  ComponentImplementation, 
  ComponentExecutionContext,
  ComponentExecutionResult
} from '../types.ts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Results Processing Component
 * Processes algorithm execution results
 */
export const resultsProcessingComponent: ComponentImplementation = async (
  context: ComponentExecutionContext
): Promise<ComponentExecutionResult> => {
  try {
    const { inputData, memoryIntegration } = context;
    const { 
      results, 
      processingRules,
      outputFormat,
      thresholds,
      metadata
    } = inputData;
    
    if (!results) {
      return {
        success: false,
        errorMessage: 'No results provided for processing',
        outputData: null
      };
    }
    
    // Process the results
    const processedResults = processResults(
      results,
      processingRules,
      outputFormat,
      thresholds
    );
    
    // Create processing metadata
    const processingMetadata = {
      processingId: uuidv4(),
      timestamp: new Date().toISOString(),
      rules: processingRules,
      format: outputFormat,
      thresholds,
      originalMetadata: metadata
    };
    
    // Store processed results in working memory
    const memoryKey = `results:processed:${processingMetadata.processingId}`;
    await memoryIntegration.storeInWorkingMemory(memoryKey, {
      originalResults: results,
      processedResults,
      metadata: processingMetadata
    });
    
    // Store in short-term memory for potential reuse
    await memoryIntegration.storeInShortTermMemory(
      memoryKey,
      {
        processedResults,
        metadata: processingMetadata
      },
      ['processed_results', outputFormat]
    );
    
    return {
      success: true,
      outputData: {
        processedResults,
        metadata: processingMetadata
      }
    };
  } catch (error) {
    console.error('Error in results processing component:', error);
    return {
      success: false,
      errorMessage: error.message || 'Results processing failed',
      outputData: null
    };
  }
};

/**
 * Processes results according to rules and format
 */
function processResults(
  results: any,
  processingRules?: any,
  outputFormat?: string,
  thresholds?: any
): any {
  // Apply processing rules
  let processedResults = applyProcessingRules(results, processingRules);
  
  // Apply thresholds
  processedResults = applyThresholds(processedResults, thresholds);
  
  // Format output
  processedResults = formatOutput(processedResults, outputFormat);
  
  return processedResults;
}

/**
 * Applies processing rules to results
 */
function applyProcessingRules(results: any, rules?: any): any {
  if (!rules) {
    return results;
  }
  
  // Handle array results
  if (Array.isArray(results)) {
    if (rules.filter) {
      // Apply filters
      results = results.filter((item: any) => {
        for (const [field, condition] of Object.entries(rules.filter)) {
          const value = item[field];
          const conditionObj = condition as any;
          
          if (conditionObj.eq !== undefined && value !== conditionObj.eq) {
            return false;
          }
          
          if (conditionObj.neq !== undefined && value === conditionObj.neq) {
            return false;
          }
          
          if (conditionObj.gt !== undefined && value <= conditionObj.gt) {
            return false;
          }
          
          if (conditionObj.gte !== undefined && value < conditionObj.gte) {
            return false;
          }
          
          if (conditionObj.lt !== undefined && value >= conditionObj.lt) {
            return false;
          }
          
          if (conditionObj.lte !== undefined && value > conditionObj.lte) {
            return false;
          }
          
          if (conditionObj.contains !== undefined && 
              (!value || !value.includes(conditionObj.contains))) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    if (rules.sort) {
      // Apply sorting
      const { field, direction } = rules.sort;
      results = [...results].sort((a: any, b: any) => {
        if (direction === 'desc') {
          return b[field] > a[field] ? 1 : -1;
        }
        return a[field] > b[field] ? 1 : -1;
      });
    }
    
    if (rules.limit) {
      // Apply limit
      results = results.slice(0, rules.limit);
    }
    
    if (rules.map) {
      // Apply mapping
      results = results.map((item: any) => {
        const mappedItem: any = {};
        
        for (const [targetField, sourceField] of Object.entries(rules.map)) {
          mappedItem[targetField] = item[sourceField as string];
        }
        
        return mappedItem;
      });
    }
    
    if (rules.aggregate) {
      // Apply aggregation
      const aggregated: any = {};
      
      for (const [field, aggregation] of Object.entries(rules.aggregate)) {
        const aggregationType = aggregation as string;
        
        if (aggregationType === 'sum') {
          aggregated[field] = results.reduce((sum: number, item: any) => 
            sum + (Number(item[field]) || 0), 0);
        } else if (aggregationType === 'avg') {
          aggregated[field] = results.reduce((sum: number, item: any) => 
            sum + (Number(item[field]) || 0), 0) / results.length;
        } else if (aggregationType === 'min') {
          aggregated[field] = Math.min(...results.map((item: any) => 
            Number(item[field]) || 0));
        } else if (aggregationType === 'max') {
          aggregated[field] = Math.max(...results.map((item: any) => 
            Number(item[field]) || 0));
        } else if (aggregationType === 'count') {
          aggregated[field] = results.length;
        }
      }
      
      return aggregated;
    }
  } else if (typeof results === 'object' && results !== null) {
    // Handle object results
    if (rules.select) {
      // Select specific fields
      const selected: any = {};
      
      for (const field of rules.select) {
        if (results[field] !== undefined) {
          selected[field] = results[field];
        }
      }
      
      return selected;
    }
    
    if (rules.rename) {
      // Rename fields
      const renamed: any = { ...results };
      
      for (const [oldName, newName] of Object.entries(rules.rename)) {
        if (renamed[oldName] !== undefined) {
          renamed[newName as string] = renamed[oldName];
          delete renamed[oldName];
        }
      }
      
      return renamed;
    }
    
    if (rules.transform) {
      // Transform fields
      const transformed: any = { ...results };
      
      for (const [field, transformation] of Object.entries(rules.transform)) {
        const transformType = transformation as any;
        
        if (transformed[field] !== undefined) {
          if (transformType.type === 'number') {
            transformed[field] = Number(transformed[field]);
          } else if (transformType.type === 'string') {
            transformed[field] = String(transformed[field]);
          } else if (transformType.type === 'boolean') {
            transformed[field] = Boolean(transformed[field]);
          } else if (transformType.type === 'date') {
            transformed[field] = new Date(transformed[field]).toISOString();
          } else if (transformType.format === 'uppercase') {
            transformed[field] = String(transformed[field]).toUpperCase();
          } else if (transformType.format === 'lowercase') {
            transformed[field] = String(transformed[field]).toLowerCase();
          } else if (transformType.format === 'round') {
            transformed[field] = Math.round(Number(transformed[field]));
          } else if (transformType.format === 'floor') {
            transformed[field] = Math.floor(Number(transformed[field]));
          } else if (transformType.format === 'ceil') {
            transformed[field] = Math.ceil(Number(transformed[field]));
          }
        }
      }
      
      return transformed;
    }
  }
  
  return results;
}

/**
 * Applies thresholds to results
 */
function applyThresholds(results: any, thresholds?: any): any {
  if (!thresholds) {
    return results;
  }
  
  // Add threshold flags to results
  const resultsWithThresholds = { ...results };
  
  // Add thresholds object
  resultsWithThresholds.thresholds = {};
  
  // Apply thresholds
  for (const [field, threshold] of Object.entries(thresholds)) {
    const thresholdObj = threshold as any;
    const value = Array.isArray(results) ? undefined : results[field];
    
    if (value !== undefined) {
      if (thresholdObj.critical !== undefined) {
        resultsWithThresholds.thresholds[`${field}_critical`] = 
          value >= thresholdObj.critical;
      }
      
      if (thresholdObj.warning !== undefined) {
        resultsWithThresholds.thresholds[`${field}_warning`] = 
          value >= thresholdObj.warning;
      }
      
      if (thresholdObj.info !== undefined) {
        resultsWithThresholds.thresholds[`${field}_info`] = 
          value >= thresholdObj.info;
      }
      
      if (thresholdObj.min !== undefined) {
        resultsWithThresholds.thresholds[`${field}_below_min`] = 
          value < thresholdObj.min;
      }
      
      if (thresholdObj.max !== undefined) {
        resultsWithThresholds.thresholds[`${field}_above_max`] = 
          value > thresholdObj.max;
      }
    }
  }
  
  return resultsWithThresholds;
}

/**
 * Formats output according to specified format
 */
function formatOutput(results: any, outputFormat?: string): any {
  if (!outputFormat) {
    return results;
  }
  
  switch (outputFormat) {
    case 'summary':
      return formatSummary(results);
      
    case 'chart':
      return formatChartData(results);
      
    case 'table':
      return formatTableData(results);
      
    case 'metrics':
      return formatMetrics(results);
      
    case 'report':
      return formatReport(results);
      
    default:
      return results;
  }
}

/**
 * Formats results as a summary
 */
function formatSummary(results: any): any {
  if (Array.isArray(results)) {
    return {
      count: results.length,
      summary: {
        items: results.slice(0, 3), // First 3 items
        hasMore: results.length > 3
      }
    };
  }
  
  return {
    summary: results,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formats results for chart visualization
 */
function formatChartData(results: any): any {
  if (Array.isArray(results)) {
    // Extract labels and datasets
    const labels = results.map((item: any) => item.label || item.name || item.id);
    const datasets = [];
    
    // Find numeric fields for datasets
    const sampleItem = results[0] || {};
    const numericFields = Object.entries(sampleItem)
      .filter(([key, value]) => typeof value === 'number' && key !== 'id')
      .map(([key]) => key);
    
    // Create datasets
    for (const field of numericFields) {
      datasets.push({
        label: field,
        data: results.map((item: any) => item[field] || 0)
      });
    }
    
    return {
      type: 'chart',
      chartType: numericFields.length > 1 ? 'bar' : 'line',
      labels,
      datasets
    };
  }
  
  return results;
}

/**
 * Formats results for table visualization
 */
function formatTableData(results: any): any {
  if (Array.isArray(results)) {
    // Extract columns from first item
    const columns = results.length > 0 
      ? Object.keys(results[0]).map(key => ({
          field: key,
          header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
        }))
      : [];
    
    return {
      type: 'table',
      columns,
      data: results
    };
  }
  
  return {
    type: 'table',
    columns: Object.keys(results).map(key => ({
      field: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    })),
    data: [results]
  };
}

/**
 * Formats results as metrics
 */
function formatMetrics(results: any): any {
  if (Array.isArray(results)) {
    // Calculate metrics for numeric fields
    const metrics: any = { count: results.length };
    
    if (results.length > 0) {
      const sampleItem = results[0];
      
      for (const [key, value] of Object.entries(sampleItem)) {
        if (typeof value === 'number') {
          const values = results.map((item: any) => item[key] || 0);
          
          metrics[`${key}_sum`] = values.reduce((sum, val) => sum + val, 0);
          metrics[`${key}_avg`] = metrics[`${key}_sum`] / values.length;
          metrics[`${key}_min`] = Math.min(...values);
          metrics[`${key}_max`] = Math.max(...values);
        }
      }
    }
    
    return {
      type: 'metrics',
      metrics
    };
  }
  
  return {
    type: 'metrics',
    metrics: results
  };
}

/**
 * Formats results as a report
 */
function formatReport(results: any): any {
  const timestamp = new Date().toISOString();
  
  if (Array.isArray(results)) {
    return {
      type: 'report',
      timestamp,
      summary: {
        total: results.length,
        sample: results.slice(0, 3)
      },
      details: results
    };
  }
  
  return {
    type: 'report',
    timestamp,
    data: results
  };
}

/**
 * Register results processing component
 */
export function registerResultsProcessingComponent(componentRegistry: any): void {
  componentRegistry.registerImplementation('results-processing', resultsProcessingComponent);
}
