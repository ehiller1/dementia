/**
 * ExcelAnalystAgent.ts
 *
 * A CrewAI agent specialized in Excel file analysis using Langchain's Excel loading capabilities
 */

import { Tool } from 'langchain/tools';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { ExcelLoader } from '@langchain/community/document_loaders/fs/excel';
import { useContextualRetrieval, ContextualSearchParams } from '../memory/contextual-retrieval.ts';
import { KnowledgeGraphService } from '../../services/knowledgeGraphService.ts';

// A simplified serialization type for the tool
export type SerializedObject = {
  type: string;
  id: string;
  name?: string;
  description?: string;
  [key: string]: any;
};

export class ExcelAnalysisTool extends Tool {
  name = 'excel-analysis';
  description =
    'Load and analyze Excel files with various operations like filtering, sorting, and statistical analysis';

  private excelLoader: typeof ExcelLoader | null = null;
  private vectorStore: MemoryVectorStore | null = null;
  private filePath: string | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private conversationId: string | null = null;
  private contextualRetrieval: ReturnType<typeof useContextualRetrieval> | null = null;

  constructor(options?: { userId?: string; sessionId?: string; conversationId?: string }) {
    super();
    this.userId = options?.userId ?? null;
    this.sessionId = options?.sessionId ?? null;
    this.conversationId = options?.conversationId ?? null;
    this.initializeLangchainComponents();
    this.initializeContextualRetrieval();
  }

  private async initializeLangchainComponents(): Promise<void> {
    try {
      // Dynamically import other loaders if needed
      await import('langchain/document_loaders/fs/csv');
      await import('langchain/document_loaders/fs/docx');
      this.excelLoader = ExcelLoader;
      console.log('Langchain Excel loader initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Langchain components:', error);
    }
  }

  private initializeContextualRetrieval(): void {
    try {
      this.contextualRetrieval = useContextualRetrieval();
      console.log('Contextual retrieval system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize contextual retrieval system:', error);
    }
  }

  public async loadExcelFile(filePath: string): Promise<Document[]> {
    if (!this.excelLoader) {
      await this.initializeLangchainComponents();
    }
    if (!this.excelLoader) {
      throw new Error('ExcelLoader is not available');
    }

    const loader = new this.excelLoader(filePath);
    const docs = await loader.load();
    this.filePath = filePath;

    // Split for semantic chunks
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Build vector store
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      new OpenAIEmbeddings()
    );

    return docs;
  }

  public async queryData(query: string): Promise<string> {
    if (!this.vectorStore) {
      throw new Error('No Excel file has been loaded. Please load a file first.');
    }

    const enhanced = await this.enhanceQueryWithKnowledge(query);
    const contextualInfo = await this.getContextualInformation(enhanced.enhancedQuery || query);
    const results = await this.vectorStore.similaritySearch(enhanced.enhancedQuery || query, 5);
    const resultContent = results.map(doc => doc.pageContent).join('\n\n');

    await this.storeInWorkingMemory(query, resultContent);

    let response = resultContent;
    if (contextualInfo) {
      response += `\n\n**Related Context:**\n${contextualInfo}`;
    }
    const relatedConcepts = enhanced.enhancedContext?.relatedConcepts;
    if (Array.isArray(relatedConcepts) && relatedConcepts.length > 0) {
      const concepts = relatedConcepts.slice(0, 3).map((c: any) => c.name).join(', ');
      response += `\n\n**Related Concepts:** ${concepts}`;
    }

    return response;
  }

  private async enhanceQueryWithKnowledge(query: string): Promise<any> {
    try {
      return await KnowledgeGraphService.enhanceQueryWithKnowledge(query);
    } catch (error) {
      console.error('Error enhancing query with knowledge graph:', error);
      return { enhancedQuery: query };
    }
  }

  private async getContextualInformation(query: string): Promise<string> {
    if (!this.contextualRetrieval) return '';

    const params: ContextualSearchParams = {
      query,
      userId: this.userId,
      sessionId: this.sessionId,
      conversationId: this.conversationId,
      memoryTypes: ['working', 'short-term', 'long-term'],
      contentTypes: ['excel_analysis'],
      maxResults: 3,
      minRelevance: 0.7,
      includeKnowledgeGraph: true,
    };

    try {
      const { results } = await this.contextualRetrieval.searchMemory(params);
      if (results?.length) {
        return results
          .map(r => `- ${r.content.substring(0, 200)}${r.content.length > 200 ? '...' : ''}`)
          .join('\n');
      }
    } catch (error) {
      console.error('Error getting contextual information:', error);
    }
    return '';
  }

  private async storeInWorkingMemory(query: string, result: string): Promise<void> {
    if (!this.contextualRetrieval) return;

    const fileName = this.filePath?.split('/').pop() || 'unknown-file';
    const content = `Analysis of ${fileName}: ${query}\n\nResults: ${result.substring(0, 500)}${
      result.length > 500 ? '...' : ''
    }`;

    try {
      await this.contextualRetrieval.storeMemory({
        content,
        contentType: 'excel_analysis',
        memoryType: 'working',
        userId: this.userId,
        sessionId: this.sessionId,
        conversationId: this.conversationId,
        metadata: { fileName, analysisType: 'excel', query, timestamp: new Date().toISOString() }
      });

      if (result.length > 200) {
        await this.contextualRetrieval.storeMemory({
          content: `Key insight from Excel analysis (${fileName}): ${result.substring(0, 300)}...`,
          contentType: 'excel_analysis_insight',
          memoryType: 'short-term',
          userId: this.userId,
          metadata: { fileName, analysisType: 'excel', query, timestamp: new Date().toISOString() }
        });
      }
    } catch (error) {
      console.error('Error storing analysis in memory:', error);
    }
  }

  public async _call(input: string): Promise<string> {
    const { operation, filePath, query, userId, sessionId, conversationId } = JSON.parse(input);
    if (userId) this.userId = userId;
    if (sessionId) this.sessionId = sessionId;
    if (conversationId) this.conversationId = conversationId;

    switch (operation) {
      case 'load': {
        if (!filePath) return 'Error: File path is required for load operation';
        try {
          const docs = await this.loadExcelFile(filePath);
          return `Successfully loaded Excel file with ${docs.length} sheets/sections`;
        } catch (err: any) {
          return `Error loading file: ${err.message}`;
        }
      }
      case 'query': {
        if (!query) return 'Error: Query is required for query operation';
        try {
          return await this.queryData(query);
        } catch (err: any) {
          return `Error querying data: ${err.message}`;
        }
      }
      case 'analyze': {
        if (!this.filePath) return 'Error: No Excel file has been loaded. Please load a file first.';
        if (!query) return 'Error: Analysis query is required';
        try {
          const data = await this.queryData(query);
          const llm = new ChatOpenAI({ temperature: 0.2 });
          return await llm.predict(
            `You are an Excel data analysis expert. Analyze the following data from an Excel file:\n\n${data}\n\nAnalysis request: ${query}\n\nProvide a detailed analysis with insights, patterns, and recommendations.`
          );
        } catch (err: any) {
          return `Error analyzing data: ${err.message}`;
        }
      }
      default:
        return `Unsupported operation: ${operation}. Supported operations are: load, query, analyze`;
    }
  }

  public _serialize(): SerializedObject {
    return {
      type: this.constructor.name,
      id: this.name,
      name: this.name,
      description: this.description
    };
  }
}

export async function createExcelAnalystAgent(options?: {
  name?: string;
  verbose?: boolean;
  maxIterations?: number;
  userId?: string;
  sessionId?: string;
  conversationId?: string;
}): Promise<any> {
  const excelTool = new ExcelAnalysisTool({
    userId: options?.userId,
    sessionId: options?.sessionId,
    conversationId: options?.conversationId
  });
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL_NAME || 'gpt-4',
    temperature: 0.2,
    verbose: options?.verbose ?? false
  });
  const agent: any = {
    name: options?.name || 'Excel Analyst',
    goal: 'Analyze Excel files and extract meaningful insights with contextual awareness',
    backstory: 'You are an expert data analyst specializing in Excel file analysis. You can extract insights, perform statistical analysis, and answer questions about Excel data. You have access to historical analyses and domain knowledge to enhance your insights.',
    verbose: options?.verbose ?? false,
    allowDelegation: false,
    tools: [excelTool],
    llm: model,
    maxIterations: options?.maxIterations ?? 5
  };
  return agent;
}

export const excelAnalysisTasks = {
  analyzeExcelFile:
    (filePath: string, analysisQuery: string) => ({
      description: `Analyze the Excel file at ${filePath} with the following objective: ${analysisQuery}`,
      expected_output: 'A detailed analysis with insights, patterns, and recommendations',
      agent_scratchpad: '',
      async execute({ agent }: { agent: any }) {
        try {
          const loadResult = await agent.invoke(JSON.stringify({ operation: 'load', filePath }));
          console.log('Excel file loaded:', loadResult);
          const analysisResult = await agent.invoke(JSON.stringify({ operation: 'analyze', query: analysisQuery }));
          return analysisResult;
        } catch (err: any) {
          console.error('Error executing Excel analysis task:', err);
          return `Failed to analyze Excel file: ${err.message}`;
        }
      }
    }),

  queryExcelData:
    (filePath: string, dataQuery: string) => ({
      description: `Extract specific data from the Excel file at ${filePath} based on this query: ${dataQuery}`,
      expected_output: 'Relevant data extracted from the Excel file',
      agent_scratchpad: '',
      async execute({ agent }: { agent: any }) {
        try {
          await agent.invoke(JSON.stringify({ operation: 'load', filePath }));
          const result = await agent.invoke(JSON.stringify({ operation: 'query', query: dataQuery }));
          return result;
        } catch (err: any) {
          console.error('Error executing Excel query task:', err);
          return `Failed to query Excel file: ${err.message}`;
        }
      }
    })
};
