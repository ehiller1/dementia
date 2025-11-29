/**
 * Excel Analyst Agent Registration
 * 
 * Registers the Excel analyst agent with the agent registry system
 * so it can be discovered and executed through the standard agent discovery process.
 */

import { createExcelAnalystAgent, excelAnalysisTasks } from './excel-analyst-agent.ts';

/**
 * Register the Excel Analyst agent with the system
 */
export async function registerExcelAnalystAgent(supabase: any) {
  try {
    // Check if the agent already exists
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('name', 'Excel Analyst')
      .maybeSingle();
    
    if (existingAgent) {
      console.log('Excel Analyst agent already registered with ID:', existingAgent.id);
      return existingAgent.id;
    }
    
    // Create agent record
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        name: 'Excel Analyst',
        description: 'An expert data analyst that can extract insights from Excel files using LangChain tools.',
        capabilities: ['excel_analysis', 'data_insights', 'trend_detection', 'statistical_analysis'],
        integration_type: 'crewai',
        enabled: true,
        parameters: {
          model: 'gpt-3.5-turbo',
          temperature: 0.2,
          maxIterations: 5
        },
        metadata: {
          backstory: `I am an expert data analyst with years of experience in Excel data analysis. 
          I specialize in extracting meaningful insights from complex spreadsheets, 
          identifying patterns, and providing actionable recommendations. 
          My analytical skills combined with my domain knowledge make me the perfect 
          agent for turning raw Excel data into valuable business intelligence.`,
          goal: 'Analyze Excel files to extract insights, patterns, and recommendations',
          uses_langchain: true
        }
      })
      .select('id')
      .single();
      
    if (error) {
      throw error;
    }
    
    // Register agent capabilities
    const capabilities = [
      {
        agent_id: agent.id,
        name: 'analyze_excel',
        description: 'Analyze Excel files to extract insights and patterns',
        parameters_schema: {
          type: 'object',
          required: ['filePath', 'analysisQuery'],
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the Excel file to analyze'
            },
            analysisQuery: {
              type: 'string',
              description: 'Query or objective for the analysis'
            }
          }
        },
        examples: ['Analyze sales trends from Q1-Q4', 'Find outliers in expense data']
      },
      {
        agent_id: agent.id,
        name: 'query_excel_data',
        description: 'Extract specific data from Excel files',
        parameters_schema: {
          type: 'object',
          required: ['filePath', 'dataQuery'],
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the Excel file to query'
            },
            dataQuery: {
              type: 'string',
              description: 'Query to extract specific data'
            }
          }
        },
        examples: ['Show me all sales above $10,000', 'Find entries from the Marketing department']
      }
    ];
    
    // Insert capabilities
    const { error: capabilitiesError } = await supabase
      .from('agent_capabilities')
      .insert(capabilities);
      
    if (capabilitiesError) {
      throw capabilitiesError;
    }
    
    console.log('Excel Analyst agent registered successfully with ID:', agent.id);
    return agent.id;
    
  } catch (error) {
    console.error('Failed to register Excel Analyst agent:', error);
    throw error;
  }
}

/**
 * Setup a function to map agent execution requests to the actual implementation
 */
export function setupExcelAnalystExecutor() {
  return {
    async executeAgent(params: {
      capability: string;
      parameters: Record<string, any>;
      context: Record<string, any>;
      agentId: string;
    }) {
      const { capability, parameters, context } = params;
      
      // Create the Excel Analyst agent
      const agent = await createExcelAnalystAgent();
      
      switch (capability) {
        case 'analyze_excel':
          const { filePath, analysisQuery } = parameters;
          const analysisTask = excelAnalysisTasks.analyzeExcelFile(filePath, analysisQuery);
          return await analysisTask.execute({ agent });
          
        case 'query_excel_data':
          const queryTask = excelAnalysisTasks.queryExcelData(
            parameters.filePath, 
            parameters.dataQuery || parameters.analysisQuery
          );
          return await queryTask.execute({ agent });
          
        default:
          throw new Error(`Unknown capability: ${capability}`);
      }
    }
  };
}

/**
 * Register the agent executor with the agent execution system
 */
export function registerExcelAnalystExecutor(agentExecutionRegistry: any) {
  const executor = setupExcelAnalystExecutor();
  
  // Register the executor for the Excel Analyst agent
  agentExecutionRegistry.registerExecutor('Excel Analyst', executor.executeAgent);
  
  return executor;
}
