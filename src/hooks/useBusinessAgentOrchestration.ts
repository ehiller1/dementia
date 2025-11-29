/**
 * useBusinessAgentOrchestration.ts
 * 
 * Custom hook for orchestrating business agents through the conversation interface.
 * Integrates with agent discovery process, semantic search, and CrewAI-based agent registry.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client.ts';
import { getBusinessAgentIntentDetector, BusinessAgentIntent } from '../services/BusinessAgentIntentDetector.ts';
import { getBusinessAgentResponseGenerator, ResponseType } from '../services/BusinessAgentResponseGenerator.ts';
import { generateEmbedding, cosineSimilarity } from '../lib/embeddings.ts';
import { workflowservice } from '../services/workflowService.ts';
import { MemoryIntegrationService } from '../services/memory-integration/MemoryIntegrationService.ts';

// Agent capability interface
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  domain: BusinessAgentIntent;
  embedding?: number[];
}

// Agent interface
export interface BusinessAgent {
  id: string;
  name: string;
  description: string;
  primaryDomain: BusinessAgentIntent;
  secondaryDomains: BusinessAgentIntent[];
  capabilities: AgentCapability[];
  isActive: boolean;
}

// Agent crew for handling a specific request
export interface AgentCrew {
  leadAgent: BusinessAgent;
  supportAgents: BusinessAgent[];
  workflowInstanceId?: string;
}

// Message interface
export interface BusinessAgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  agentId?: string;
  timestamp: Date;
  metadata?: any;
}

// Response interface
export interface BusinessAgentResponse {
  content: string;
  responseType: ResponseType;
  agentId: string;
  narrativeUpdates?: any[];
  workflowUpdates?: any[];
  metadata?: any;
}

export function useBusinessAgentOrchestration() {
  const [agents, setAgents] = useState<BusinessAgent[]>([]);
  const [messages, setMessages] = useState<BusinessAgentMessage[]>([]);
  const [currentCrew, setCurrentCrew] = useState<AgentCrew | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [workflowInstanceId, setWorkflowInstanceId] = useState<string | null>(null);
  const [institutionalMemory, setInstitutionalMemory] = useState<any[]>([]);
  
  const intentDetector = getBusinessAgentIntentDetector();
  const responseGenerator = getBusinessAgentResponseGenerator();
  const memoryService = new MemoryIntegrationService();
  const workflowservice = new workflowservice();

  // Load available agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  /**
   * Load available business agents from the registry
   */
  const loadAgents = async () => {
    try {
      // Fetch agents from Supabase or other registry
      const { data, error } = await supabase
        .from('business_agents')
        .select('*')
        .eq('isActive', true);
      
      if (error) throw error;
      
      // Transform and store agents
      const transformedAgents: BusinessAgent[] = data.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        primaryDomain: agent.primaryDomain,
        secondaryDomains: agent.secondaryDomains || [],
        capabilities: agent.capabilities || [],
        isActive: agent.isActive
      }));
      
      setAgents(transformedAgents);
      
      // Pre-compute embeddings for agent capabilities
      await Promise.all(transformedAgents.flatMap(agent => 
        agent.capabilities.map(async (capability) => {
          if (!capability.embedding) {
            capability.embedding = await generateEmbedding(
              `${capability.name}: ${capability.description}`
            );
          }
        })
      ));
    } catch (error) {
      console.error('Error loading business agents:', error);
      // Fallback to mock agents if needed
      setAgents(getMockBusinessAgents());
    }
  };

  /**
   * Send a user message and orchestrate agent responses
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    
    // Add user message to the conversation
    const userMessage: BusinessAgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Detect intent from user message
      const intentResult = await intentDetector.detectIntent(
        content, 
        messages.slice(-5)
      );
      
      // Retrieve relevant institutional memory
      const relevantMemory = await retrieveRelevantMemory(
        content,
        intentResult.entities,
        intentResult.primaryIntent
      );
      
      // Assemble agent crew based on intent
      const crew = await assembleAgentCrew(
        intentResult.primaryIntent,
        intentResult.crossFunctionalContext || [],
        intentResult.entities
      );
      
      setCurrentCrew(crew);
      
      // Create or retrieve workflow instance
      let workflowId = workflowInstanceId;
      if (!workflowId) {
        workflowId = await workflowservice.createInstance({
          templateId: 'business-agent-orchestration',
          initialState: {
            intent: intentResult.primaryIntent,
            entities: intentResult.entities,
            crossFunctionalContext: intentResult.crossFunctionalContext
          }
        });
        setWorkflowInstanceId(workflowId);
      }
      
      // Generate cross-functional context
      const crossFunctionalContext = await generateCrossFunctionalContext(
        crew,
        intentResult.entities,
        relevantMemory
      );
      
      // Generate lead agent response
      const leadAgentResponse = await responseGenerator.generateResponse(
        crew.leadAgent.primaryDomain,
        content,
        intentResult.entities,
        relevantMemory,
        messages.slice(-5),
        crossFunctionalContext
      );
      
      // Add lead agent response to conversation
      const agentResponseMessage: BusinessAgentMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: leadAgentResponse.content,
        agentId: crew.leadAgent.id,
        timestamp: new Date(),
        metadata: {
          responseType: leadAgentResponse.responseType,
          agentName: crew.leadAgent.name,
          domain: crew.leadAgent.primaryDomain,
          ...leadAgentResponse.metadata
        }
      };
      
      setMessages(prev => [...prev, agentResponseMessage]);
      
      // Process narrative updates if any
      if (leadAgentResponse.narrativeUpdates && leadAgentResponse.narrativeUpdates.length > 0) {
        await processNarrativeUpdates(leadAgentResponse.narrativeUpdates, workflowId);
      }
      
      // Process workflow updates if any
      if (leadAgentResponse.workflowUpdates && leadAgentResponse.workflowUpdates.length > 0) {
        await processWorkflowUpdates(leadAgentResponse.workflowUpdates, workflowId);
      }
      
      // Generate support agent responses if needed
      if (crew.supportAgents.length > 0 && 
          (leadAgentResponse.responseType === ResponseType.RECOMMENDATION || 
           leadAgentResponse.responseType === ResponseType.ALERT)) {
        
        await generateSupportAgentResponses(
          crew.supportAgents,
          content,
          intentResult.entities,
          relevantMemory,
          messages.slice(-5),
          crossFunctionalContext,
          workflowId
        );
      }
      
      // Update institutional memory with new insights
      await updateInstitutionalMemory(
        content,
        leadAgentResponse,
        intentResult.entities,
        crew
      );
      
    } catch (error) {
      console.error('Error in business agent orchestration:', error);
      
      // Add system error message
      const errorMessage: BusinessAgentMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: 'There was an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, agents, workflowInstanceId, institutionalMemory]);

  /**
   * Assemble a crew of agents based on intent and context
   */
  const assembleAgentCrew = async (
    primaryIntent: BusinessAgentIntent,
    crossFunctionalDomains: string[] = [],
    entities: any[] = []
  ): Promise<AgentCrew> => {
    // Find lead agent based on primary intent
    const leadAgentCandidates = agents.filter(agent => 
      agent.primaryDomain === primaryIntent
    );
    
    let leadAgent: BusinessAgent;
    
    if (leadAgentCandidates.length === 0) {
      // Fallback to semantic matching if no direct match
      leadAgent = await findAgentBySemanticMatch(primaryIntent, entities);
    } else {
      // Use the first matching agent (could be enhanced with more sophisticated selection)
      leadAgent = leadAgentCandidates[0];
    }
    
    // Find support agents based on cross-functional domains
    const supportAgents: BusinessAgent[] = [];
    
    for (const domain of crossFunctionalDomains) {
      const domainEnum = domain as unknown as BusinessAgentIntent;
      const supportCandidate = agents.find(agent => 
        agent.primaryDomain === domainEnum && agent.id !== leadAgent.id
      );
      
      if (supportCandidate) {
        supportAgents.push(supportCandidate);
      }
    }
    
    // Add Institutional Memory Agent if not already included
    const memoryAgentNeeded = primaryIntent !== BusinessAgentIntent.MEMORY && 
      !supportAgents.some(agent => agent.primaryDomain === BusinessAgentIntent.MEMORY);
    
    if (memoryAgentNeeded) {
      const memoryAgent = agents.find(agent => 
        agent.primaryDomain === BusinessAgentIntent.MEMORY
      );
      
      if (memoryAgent) {
        supportAgents.push(memoryAgent);
      }
    }
    
    return {
      leadAgent,
      supportAgents
    };
  };

  /**
   * Find an agent by semantic matching of capabilities
   */
  const findAgentBySemanticMatch = async (
    intent: BusinessAgentIntent,
    entities: any[]
  ): Promise<BusinessAgent> => {
    // Create a query from intent and entities
    const query = `${intent} ${entities.map(e => e.value).join(' ')}`;
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Find best matching agent capability
    let bestMatch: { agent: BusinessAgent, similarity: number } | null = null;
    
    for (const agent of agents) {
      for (const capability of agent.capabilities) {
        if (capability.embedding) {
          const similarity = cosineSimilarity(queryEmbedding, capability.embedding);
          
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = { agent, similarity };
          }
        }
      }
    }
    
    // Return best match or fallback to first agent
    return bestMatch?.agent || agents[0];
  };

  /**
   * Retrieve relevant institutional memory
   */
  const retrieveRelevantMemory = async (
    query: string,
    entities: any[],
    intent: BusinessAgentIntent
  ): Promise<any[]> => {
    try {
      // Use MemoryIntegrationService to retrieve relevant memory
      const memoryResults = await memoryService.retrieveMemory({
        query,
        limit: 5,
        filters: {
          tags: [intent.toLowerCase(), ...entities.map(e => e.value.toLowerCase())]
        }
      });
      
      setInstitutionalMemory(memoryResults);
      return memoryResults;
    } catch (error) {
      console.error('Error retrieving institutional memory:', error);
      return [];
    }
  };

  /**
   * Generate cross-functional context for agent responses
   */
  const generateCrossFunctionalContext = async (
    crew: AgentCrew,
    entities: any[],
    memory: any[]
  ): Promise<Record<string, any>> => {
    const context: Record<string, any> = {};
    
    // Add context from support agents' domains
    for (const supportAgent of crew.supportAgents) {
      context[supportAgent.primaryDomain] = {
        domain: supportAgent.primaryDomain,
        relevantCapabilities: supportAgent.capabilities
          .filter(cap => entities.some(e => 
            cap.description.toLowerCase().includes(e.value.toLowerCase())
          )),
        agentName: supportAgent.name
      };
    }
    
    // Add context from institutional memory
    if (memory.length > 0) {
      context.institutionalMemory = {
        relevantMemories: memory.length,
        domains: [...new Set(memory.flatMap(m => m.tags || []))]
      };
    }
    
    return context;
  };

  /**
   * Process narrative updates from agent responses
   */
  const processNarrativeUpdates = async (
    updates: any[],
    workflowId: string | null
  ): Promise<void> => {
    if (!workflowId) return;
    
    for (const update of updates) {
      try {
        // Store narrative update in workflow state
        await workflowservice.storeWorkflowEvent({
          workflowInstanceId: workflowId,
          eventType: 'narrative_update',
          eventData: update
        });
        
        // Add system message for narrative update
        const narrativeMessage: BusinessAgentMessage = {
          id: `narrative-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'system',
          content: `📝 Narrative Update: ${update.content}`,
          timestamp: new Date(),
          metadata: {
            type: 'narrative',
            updateType: update.type,
            source: update.source
          }
        };
        
        setMessages(prev => [...prev, narrativeMessage]);
      } catch (error) {
        console.error('Error processing narrative update:', error);
      }
    }
  };

  /**
   * Process workflow updates from agent responses
   */
  const processWorkflowUpdates = async (
    updates: any[],
    workflowId: string | null
  ): Promise<void> => {
    if (!workflowId) return;
    
    for (const update of updates) {
      try {
        // Store workflow update
        await workflowservice.storeWorkflowEvent({
          workflowInstanceId: workflowId,
          eventType: update.type,
          eventData: {
            action: update.action,
            parameters: update.parameters
          }
        });
        
        // For decision updates, add a system message
        if (update.type === 'decision') {
          const decisionMessage: BusinessAgentMessage = {
            id: `decision-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'system',
            content: `🔄 Decision: ${update.action}`,
            timestamp: new Date(),
            metadata: {
              type: 'decision',
              parameters: update.parameters
            }
          };
          
          setMessages(prev => [...prev, decisionMessage]);
        }
      } catch (error) {
        console.error('Error processing workflow update:', error);
      }
    }
  };

  /**
   * Generate responses from support agents
   */
  const generateSupportAgentResponses = async (
    supportAgents: BusinessAgent[],
    userMessage: string,
    entities: any[],
    memory: any[],
    conversationHistory: any[],
    crossFunctionalContext: Record<string, any>,
    workflowId: string | null
  ): Promise<void> => {
    for (const agent of supportAgents) {
      try {
        // Generate response from support agent
        const agentResponse = await responseGenerator.generateResponse(
          agent.primaryDomain,
          userMessage,
          entities,
          memory,
          conversationHistory,
          crossFunctionalContext
        );
        
        // Only add to conversation if it adds value
        if (agentResponse.confidence > 0.6) {
          const supportMessage: BusinessAgentMessage = {
            id: `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'agent',
            content: agentResponse.content,
            agentId: agent.id,
            timestamp: new Date(),
            metadata: {
              responseType: agentResponse.responseType,
              agentName: agent.name,
              domain: agent.primaryDomain,
              isSupport: true,
              ...agentResponse.metadata
            }
          };
          
          setMessages(prev => [...prev, supportMessage]);
          
          // Process narrative and workflow updates
          if (agentResponse.narrativeUpdates && agentResponse.narrativeUpdates.length > 0) {
            await processNarrativeUpdates(agentResponse.narrativeUpdates, workflowId);
          }
          
          if (agentResponse.workflowUpdates && agentResponse.workflowUpdates.length > 0) {
            await processWorkflowUpdates(agentResponse.workflowUpdates, workflowId);
          }
        }
      } catch (error) {
        console.error(`Error generating response from support agent ${agent.name}:`, error);
      }
    }
  };

  /**
   * Update institutional memory with new insights
   */
  const updateInstitutionalMemory = async (
    userMessage: string,
    agentResponse: any,
    entities: any[],
    crew: AgentCrew
  ): Promise<void> => {
    // Only update memory for significant interactions
    if (agentResponse.responseType === ResponseType.INFORMATION) {
      return;
    }
    
    try {
      // Create memory entry
      const memoryEntry = {
        title: `Interaction: ${userMessage.substring(0, 50)}...`,
        content: `
User Query: ${userMessage}
Lead Agent (${crew.leadAgent.name}) Response: ${agentResponse.content}
Response Type: ${agentResponse.responseType}
Entities: ${JSON.stringify(entities)}
Cross-Functional Impacts: ${JSON.stringify(agentResponse.metadata?.crossFunctionalImpacts || {})}
`,
        tags: [
          crew.leadAgent.primaryDomain.toLowerCase(),
          ...entities.map(e => e.value.toLowerCase()),
          agentResponse.responseType.toLowerCase()
        ],
        metadata: {
          confidence: agentResponse.confidence,
          timestamp: new Date().toISOString(),
          agentId: crew.leadAgent.id,
          supportAgentIds: crew.supportAgents.map(a => a.id)
        }
      };
      
      // Store memory
      await memoryService.storeMemory(memoryEntry);
    } catch (error) {
      console.error('Error updating institutional memory:', error);
    }
  };

  /**
   * Get mock business agents for testing
   */
  const getMockBusinessAgents = (): BusinessAgent[] => {
    return [
      {
        id: 'marketing-agent-1',
        name: 'Marketing Agent',
        description: 'Specializes in marketing campaigns, customer targeting, and promotions',
        primaryDomain: BusinessAgentIntent.MARKETING,
        secondaryDomains: [BusinessAgentIntent.DECISION],
        capabilities: [
          {
            id: 'campaign-planning',
            name: 'Campaign Planning',
            description: 'Plan and design marketing campaigns for various products and seasons',
            domain: BusinessAgentIntent.MARKETING
          },
          {
            id: 'customer-targeting',
            name: 'Customer Targeting',
            description: 'Identify and target customer segments for marketing initiatives',
            domain: BusinessAgentIntent.MARKETING
          }
        ],
        isActive: true
      },
      {
        id: 'inventory-agent-1',
        name: 'Inventory Agent',
        description: 'Manages inventory levels, stock management, and supply chain',
        primaryDomain: BusinessAgentIntent.INVENTORY,
        secondaryDomains: [BusinessAgentIntent.SIMULATION],
        capabilities: [
          {
            id: 'inventory-forecasting',
            name: 'Inventory Forecasting',
            description: 'Predict future inventory needs based on historical data and trends',
            domain: BusinessAgentIntent.INVENTORY
          },
          {
            id: 'stock-optimization',
            name: 'Stock Optimization',
            description: 'Optimize stock levels to minimize costs while meeting demand',
            domain: BusinessAgentIntent.INVENTORY
          }
        ],
        isActive: true
      },
      {
        id: 'memory-agent-1',
        name: 'Institutional Memory Agent',
        description: 'Maintains and retrieves institutional knowledge and historical data',
        primaryDomain: BusinessAgentIntent.MEMORY,
        secondaryDomains: [],
        capabilities: [
          {
            id: 'historical-retrieval',
            name: 'Historical Retrieval',
            description: 'Retrieve relevant historical data and past decisions',
            domain: BusinessAgentIntent.MEMORY
          },
          {
            id: 'pattern-recognition',
            name: 'Pattern Recognition',
            description: 'Identify patterns and trends in historical business data',
            domain: BusinessAgentIntent.MEMORY
          }
        ],
        isActive: true
      },
      {
        id: 'coordination-agent-1',
        name: 'Coordination Agent',
        description: 'Orchestrates cross-functional activities and ensures alignment',
        primaryDomain: BusinessAgentIntent.COORDINATION,
        secondaryDomains: [BusinessAgentIntent.DECISION],
        capabilities: [
          {
            id: 'cross-functional-coordination',
            name: 'Cross-Functional Coordination',
            description: 'Coordinate activities across different business functions',
            domain: BusinessAgentIntent.COORDINATION
          },
          {
            id: 'workflow-orchestration',
            name: 'Workflow Orchestration',
            description: 'Orchestrate complex workflows involving multiple agents',
            domain: BusinessAgentIntent.COORDINATION
          }
        ],
        isActive: true
      }
    ];
  };

  return {
    agents,
    messages,
    currentCrew,
    isLoading,
    sendMessage,
    institutionalMemory
  };
}
