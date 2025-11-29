import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Lightbulb, Play, Check, X, BarChart, Zap, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.js';
import { useDecisionInboxSSE } from '@/hooks/useDecisionInboxSSE';
import { useOrchestrationStream } from '@/hooks/useOrchestrationStream';
import { SimulationParameterPanel } from './simulation/SimulationParameterPanel';

interface Suggestion {
  title: string;
  description: string;
  priority: string;
  action?: string;
}

interface ActionContent {
  suggestions: Suggestion[];
  context: string;
  reasoning: string;
}

interface Decision {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  user_id?: string;
  conversation_id?: string;
  created_at: string;
  context?: string;
  parsed_content?: ActionContent;
  decision_type?: 'action' | 'simulation' | 'analysis' | 'recommendation' | 'monte_carlo_simulation';
  
  // Legacy fields
  recommended_action?: string;
  intuitive_rationale?: string;
  expected_business_impact?: string;
}

export interface DecisionInboxRef {
  fetchData: () => void;
}

interface DecisionInboxProps {
  onSimulate: (decisionId: string) => void;
  templateContext?: any; // Context from template updates
  onGenerateDecisions?: (context: any) => Promise<void>; // Callback to generate decisions
  onAgentCompetition?: (dataFile: File) => void; // Callback for agent competition
  onDynamicAgentCreation?: (query: string, capabilities: string[]) => void; // Callback for dynamic agent creation
  apiResponse?: any; // API response from process-message endpoint
}

// Helper function to format agent ID into readable name (same as LiveNarrativeStream)
const formatAgentName = (agentId: string): string => {
  if (!agentId) return 'Unknown Agent';
  
  const specialCases: Record<string, string> = {
    'walmart-rmn': 'Walmart RMN',
    'tenmilliondollargrowthplan': 'Ten Million Dollar Growth Plan',
    'portfolio': 'Portfolio Agent',
    'audience': 'Audience Agent',
    'attribution': 'Attribution Agent',
    'catalog': 'Catalog Agent'
  };
  
  if (specialCases[agentId]) {
    return specialCases[agentId];
  }
  
  return agentId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const DecisionInbox = forwardRef<DecisionInboxRef, DecisionInboxProps>((
  { onSimulate, templateContext, onGenerateDecisions, onAgentCompetition, onDynamicAgentCreation, apiResponse },
  ref
) => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showParameterPanel, setShowParameterPanel] = useState<string | null>(null);
  const [simulationRunning, setSimulationRunning] = useState<string | null>(null);

  // Process API response and extract decisions
  useEffect(() => {
    if (!apiResponse) return;

    const extractedDecisions: Decision[] = [];

    // PRIORITY 1: Use decisions directly from API response if available
    const apiDecisions = apiResponse.turnEnvelope?.decisions || apiResponse.decisions || [];
    if (apiDecisions.length > 0) {
      console.log('[DecisionInbox] Using decisions directly from API response:', apiDecisions.length);
      // Map API decisions to Decision format
      const mappedDecisions = apiDecisions.map((decision: any) => ({
        id: decision.id || `decision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: decision.title || decision.name || 'Decision',
        description: decision.description || decision.summary || '',
        status: decision.status || 'pending',
        priority: decision.priority || 'medium',
        created_at: decision.created_at || decision.timestamp || apiResponse.processedAt || new Date().toISOString(),
        decision_type: decision.decision_type || decision.type || 'action',
        context: decision.context || '',
        parsed_content: decision.parsed_content || decision.content || {
          suggestions: [],
          context: '',
          reasoning: ''
        },
        recommended_action: decision.recommended_action || decision.action || '',
        intuitive_rationale: decision.intuitive_rationale || decision.rationale || '',
        expected_business_impact: decision.expected_business_impact || decision.impact || ''
      }));
      
      setDecisions(mappedDecisions);
      return; // Exit early if we have decisions from API
    }

    // PRIORITY 2: Extract and construct decisions from API response structure
    console.log('[DecisionInbox] No decisions in API response, constructing from response structure');

    // Show ALL scored templates with their relevance scores
    const templates = apiResponse.turnEnvelope?.plan?.declarative || apiResponse.templates || [];
    const threshold = apiResponse.agentResults?.discovery?.templateRelevanceThreshold || 0.72;
    
    if (templates.length > 0) {
      // Sort by relevance descending (executed template at top)
      const sortedTemplates = [...templates].sort((a: any, b: any) => (b.relevance || 0) - (a.relevance || 0));
      const executedTemplate = sortedTemplates[0];
      const isExecuted = (executedTemplate.relevance || 0) >= threshold;
      const topRelevance = executedTemplate.relevance || 0;
      const topRelevancePercent = (topRelevance * 100).toFixed(0);
      
      // Get agents executed from agentResults.results (only for executed template)
      const agentsExecuted = apiResponse.agentResults?.results || [];
      const executedAgentNames = agentsExecuted
        .filter((r: any) => r.success !== false)
        .map((r: any) => {
          const agentId = r.agentName || r.agentId || r.agent || r.result?.agent;
          return agentId ? formatAgentName(agentId) : null;
        })
        .filter(Boolean);
      
      // Get agents from procedural plan for each template
      // Map procedural tasks to their template by matching service names
      const proceduralTasks = apiResponse.turnEnvelope?.plan?.procedural || [];
      
      // Create decisions for all templates
      const templateDecisions: Decision[] = sortedTemplates.map((template: any, index: number) => {
        const templateId = template.templateId || template.id || `template_${index}`;
        const relevanceScore = ((template.relevance || 0) * 100).toFixed(0);
        const isThisExecuted = index === 0 && isExecuted;
        const isAboveThreshold = (template.relevance || 0) >= threshold;
        
        // For executed template, use executed agents; for others, try to find agents from procedural plan
        let templateAgents: string[] = [];
        if (isThisExecuted) {
          templateAgents = executedAgentNames;
        } else {
          // Try to find agents that might belong to this template from procedural plan
          // This is a heuristic - in practice, templates define their agents in schema
          // For now, we'll show that this template wasn't executed
          templateAgents = [];
        }
        
        return {
          id: `template_${templateId}`,
          title: isThisExecuted 
            ? `✅ Executed Template: ${template.templateName || template.name || 'Unknown Template'}`
            : `📋 Template: ${template.templateName || template.name || 'Unknown Template'}`,
          description: isThisExecuted
            ? `Relevance Score: ${relevanceScore}% - ✅ EXECUTED: This template was selected because it matched your query with ${relevanceScore}% relevance, which exceeds the ${(threshold * 100).toFixed(0)}% threshold`
            : isAboveThreshold
            ? `Relevance Score: ${relevanceScore}% - ⏸️ Not Executed: Policy executes only the single highest-relevance template. This template met the ${(threshold * 100).toFixed(0)}% threshold but was not the highest (top: ${topRelevancePercent}%).`
            : `Relevance Score: ${relevanceScore}% - ⏸️ Not Executed: This template scored ${relevanceScore}% relevance, which is below the ${(threshold * 100).toFixed(0)}% execution threshold`,
          status: isThisExecuted ? 'completed' : 'pending',
          priority: (template.relevance || 0) >= threshold ? 'high' : (template.relevance || 0) >= 0.5 ? 'medium' : 'low',
          created_at: apiResponse.processedAt || new Date().toISOString(),
          decision_type: 'analysis',
          context: `Template ID: ${templateId} | Domain: ${template.domain || 'general'}`,
          parsed_content: {
            suggestions: [
              {
                title: `Template: ${template.templateName || template.name}`,
                description: isThisExecuted
                  ? `Relevance Score: ${relevanceScore}% - ✅ Why executed: Matched query with ${relevanceScore}% relevance (threshold: ${(threshold * 100).toFixed(0)}%)`
                  : isAboveThreshold
                  ? `Relevance Score: ${relevanceScore}% - ⏸️ Not executed: Not the single highest-relevance template (top: ${topRelevancePercent}%).`
                  : `Relevance Score: ${relevanceScore}% - ⏸️ Not executed: Below ${(threshold * 100).toFixed(0)}% threshold`,
                priority: (template.relevance || 0) >= threshold ? 'high' : 'medium'
              },
              ...(isThisExecuted && templateAgents.length > 0
                ? templateAgents.map((name: string) => ({
                    title: `Agent: ${name}`,
                    description: 'Successfully executed as part of this template workflow',
                    priority: 'high' as const
                  }))
                : isThisExecuted
                ? [{
                    title: 'No agents executed',
                    description: 'No agents were executed for this template',
                    priority: 'medium' as const
                  }]
                : [{
                    title: 'Template not executed',
                    description: isAboveThreshold
                      ? `This template met the threshold but was skipped because only the single highest-relevance template is executed (top: ${topRelevancePercent}%).`
                      : `This template was not executed because its relevance score (${relevanceScore}%) is below the threshold`,
                    priority: 'low' as const
                  }]
              )
            ],
            context: isThisExecuted ? `Template Execution Summary` : `Template Evaluation Summary`,
            reasoning: isThisExecuted
              ? `Template "${template.templateName || template.name}" was executed with a relevance score of ${relevanceScore}%. This score indicates how well the template matched your query. ${templateAgents.length} agent(s) were executed: ${templateAgents.length > 0 ? templateAgents.join(', ') : 'None'}`
              : isAboveThreshold
              ? `Template "${template.templateName || template.name}" achieved ${relevanceScore}% (>= ${(threshold * 100).toFixed(0)}%), but it was not the highest. Policy executes only the single top template (top was ${topRelevancePercent}%).`
              : `Template "${template.templateName || template.name}" was evaluated with a relevance score of ${relevanceScore}%, which is below the ${(threshold * 100).toFixed(0)}% execution threshold. This template was not executed.`
          },
          recommended_action: `Template Relevance Score: ${relevanceScore}%`,
          intuitive_rationale: isThisExecuted
            ? `Why this template was executed: The template achieved a ${relevanceScore}% relevance score, which exceeds the ${(threshold * 100).toFixed(0)}% threshold for template execution.`
            : isAboveThreshold
            ? `Why this template was not executed: It met the threshold (${(threshold * 100).toFixed(0)}%) but was not the single highest; policy runs only the top template (top: ${topRelevancePercent}%).`
            : `Why this template was not executed: The template achieved a ${relevanceScore}% relevance score, which is below the ${(threshold * 100).toFixed(0)}% threshold for template execution.`,
          expected_business_impact: isThisExecuted
            ? `Agents Executed: ${templateAgents.length > 0 ? templateAgents.join(', ') : 'None'}`
            : isAboveThreshold
            ? `Status: Not executed (not the highest; top: ${topRelevancePercent}%)`
            : `Status: Not executed (below threshold)`
        };
      });

      // Add template decisions to extracted decisions
      extractedDecisions.push(...templateDecisions);
    }
    
    // If no templates found OR no template was executed, check for dynamic agent creation
    const discovery = apiResponse.agentResults?.discovery;
    const hasTemplates = templates.length > 0;
    const maxRelevance = hasTemplates 
      ? Math.max(...templates.map((t: any) => t.relevance || 0), 0)
      : 0;
    const isExecuted = hasTemplates && (maxRelevance >= threshold);
    
    // Show dynamic agent if: no templates OR no template met threshold
    if ((!hasTemplates || !isExecuted) && discovery && (discovery.dynamicAgentCreated || discovery.agentSpec)) {
      const agentSpec = discovery.agentSpec || {};
      const agentId = discovery.agentId || 'dynamic_agent';
      const maxRelevancePercent = (maxRelevance * 100).toFixed(0);
      
      // Create dynamic agent decision card
      const dynamicAgentDecision: Decision = {
        id: `dynamic_agent_${agentId}`,
        title: `🔧 Dynamic Agent Created: ${agentSpec.agentName || agentSpec.name || 'New Agent'}`,
        description: hasTemplates
          ? `No template met the ${(threshold * 100).toFixed(0)}% threshold (max relevance: ${maxRelevancePercent}%). A dynamic agent was created to handle your query.`
          : `No templates found. A dynamic agent was created to handle your query.`,
        status: 'completed',
        priority: 'high',
        created_at: apiResponse.processedAt || new Date().toISOString(),
        decision_type: 'action',
        context: `Agent ID: ${agentId}${hasTemplates ? ` | Max Template Relevance: ${maxRelevancePercent}%` : ''}`,
        parsed_content: {
          suggestions: [
            {
              title: `Dynamic Agent: ${agentSpec.agentName || agentSpec.name || 'New Agent'}`,
              description: hasTemplates
                ? `Created because no template met the ${(threshold * 100).toFixed(0)}% relevance threshold`
                : `Created because no templates were found for this query`,
              priority: 'high'
            },
            ...(agentSpec.capabilities && Array.isArray(agentSpec.capabilities) 
              ? agentSpec.capabilities.map((cap: string) => ({
                  title: `Capability: ${cap}`,
                  description: 'Agent capability',
                  priority: 'medium' as const
                }))
              : []
            )
          ],
          context: `Dynamic Agent Creation`,
          reasoning: hasTemplates
            ? `No template achieved the required ${(threshold * 100).toFixed(0)}% relevance threshold (highest was ${maxRelevancePercent}%). A specialized dynamic agent was created with ${agentSpec.capabilities?.length || 0} capabilities to handle your query.`
            : `No templates were found for this query. A specialized dynamic agent was created with ${agentSpec.capabilities?.length || 0} capabilities to handle your query.`
        },
        recommended_action: `Agent Role: ${agentSpec.role || 'Specialized Agent'}`,
        intuitive_rationale: agentSpec.backstory || agentSpec.goal || `Dynamic agent created to handle query: ${apiResponse.query || 'N/A'}`,
        expected_business_impact: `Capabilities: ${(agentSpec.capabilities || []).join(', ') || 'N/A'}`
      };
      
      // Get agents executed from dynamic agent
      const agentsExecuted = apiResponse.agentResults?.results || [];
      const executedAgentNames = agentsExecuted
        .filter((r: any) => r.success !== false)
        .map((r: any) => {
          const agentId = r.agentName || r.agentId || r.agent || r.result?.agent;
          return agentId ? formatAgentName(agentId) : null;
        })
        .filter(Boolean);
      
      if (executedAgentNames.length > 0) {
        dynamicAgentDecision.parsed_content!.suggestions.push(
          ...executedAgentNames.map((name: string) => ({
            title: `Agent Executed: ${name}`,
            description: 'Successfully executed as part of dynamic agent workflow',
            priority: 'high' as const
          }))
        );
        dynamicAgentDecision.expected_business_impact = `Agents Executed: ${executedAgentNames.join(', ')}`;
      }
      
      // Add dynamic agent decision at the top
      extractedDecisions.unshift(dynamicAgentDecision);
    }

    // Add agent execution summary decision (for direct agent execution or crew execution)
    const agentResults = apiResponse.agentResults;
    if (agentResults && (agentResults.results || agentResults.agents)) {
      const agentsExecuted = agentResults.results || [];
      const agentList = agentResults.agents || [];
      
      // Extract agent information - check multiple field names
      // IMPORTANT: Check all possible locations for agent identifier
      const executedAgents = agentsExecuted
        .map((r: any) => {
          // Try multiple field names in order of preference
          const agentId = r.agent || r.agentId || r.agentName || r.result?.agent || r.result?.agentId || 'unknown';
          if (agentId === 'unknown') {
            console.warn('[DecisionInbox] Could not extract agent ID from result:', r);
            return null;
          }
          const agentName = r.agentName || formatAgentName(agentId);
          return {
            id: agentId,
            name: agentName,
            success: r.success !== false,
            executionTime: r.executionTime,
            result: r.result
          };
        })
        .filter((a: any) => a !== null && a.id !== 'unknown');
      
      console.log('[DecisionInbox] Extracted agents:', executedAgents.length, executedAgents.map(a => a.name));

      // If we have executed agents, create a crew/team summary decision
      if (executedAgents.length > 0 || agentList.length > 0) {
        const discovery = agentResults.discovery || {};
        const isDirectExecution = discovery.directExecution || discovery.agentTag;
        const agentTag = discovery.agentTag || 'crew_execution';
        
        // Group agents by type/category if possible
        const agentGroups: Record<string, any[]> = {
          'RMN Agents': [],
          'Analysis Agents': [],
          'Planning Agents': [],
          'Other': []
        };

        executedAgents.forEach((agent: any) => {
          const id = agent.id.toLowerCase();
          if (id.includes('rmn') || id.includes('walmart') || id.includes('amazon') || id.includes('target') || id.includes('instacart')) {
            agentGroups['RMN Agents'].push(agent);
          } else if (id.includes('portfolio') || id.includes('audience') || id.includes('attribution') || id.includes('catalog')) {
            agentGroups['Analysis Agents'].push(agent);
          } else if (id.includes('growth') || id.includes('plan')) {
            agentGroups['Planning Agents'].push(agent);
          } else {
            agentGroups['Other'].push(agent);
          }
        });

        // Remove empty groups
        Object.keys(agentGroups).forEach(key => {
          if (agentGroups[key].length === 0) {
            delete agentGroups[key];
          }
        });

        const crewDecision: Decision = {
          id: `crew_execution_${agentTag}`,
          title: isDirectExecution 
            ? `🤖 Direct Agent Execution: ${formatAgentName(agentTag)}`
            : `👥 Crew Execution: ${executedAgents.length} Agent${executedAgents.length !== 1 ? 's' : ''}`,
          description: isDirectExecution
            ? `Agent "${formatAgentName(agentTag)}" was directly executed with ${executedAgents.length} supporting agent${executedAgents.length !== 1 ? 's' : ''}.`
            : `A crew of ${executedAgents.length} agent${executedAgents.length !== 1 ? 's' : ''} was orchestrated to handle your query.`,
          status: 'completed',
          priority: 'high',
          created_at: apiResponse.processedAt || new Date().toISOString(),
          decision_type: 'action',
          context: `Execution Mode: ${isDirectExecution ? 'Direct Agent' : 'Crew Orchestration'} | Agent Tag: ${agentTag}`,
          parsed_content: {
            suggestions: [
              {
                title: isDirectExecution ? `Primary Agent: ${formatAgentName(agentTag)}` : `Crew Size: ${executedAgents.length} Agents`,
                description: isDirectExecution
                  ? `Direct execution mode activated for agent tag "${agentTag}"`
                  : `Orchestrated crew execution with ${executedAgents.length} specialized agents`,
                priority: 'high'
              },
              ...Object.entries(agentGroups).map(([groupName, agents]) => ({
                title: `${groupName} (${agents.length})`,
                description: agents.map((a: any) => a.name).join(', '),
                priority: 'medium' as const
              })),
              ...executedAgents.map((agent: any) => ({
                title: `Agent: ${agent.name}`,
                description: agent.success 
                  ? `Successfully executed${agent.executionTime ? ` in ${agent.executionTime}ms` : ''}`
                  : 'Execution completed',
                priority: agent.success ? 'high' as const : 'medium' as const
              }))
            ],
            context: `Agent Execution Summary`,
            reasoning: isDirectExecution
              ? `Direct agent execution was triggered for "${formatAgentName(agentTag)}". ${executedAgents.length} agent${executedAgents.length !== 1 ? 's were' : ' was'} involved in processing your query.`
              : `A crew of ${executedAgents.length} agent${executedAgents.length !== 1 ? 's' : ''} was orchestrated to handle your query. The crew included agents from ${Object.keys(agentGroups).length} different categories.`
          },
          recommended_action: `Agents Involved: ${executedAgents.map((a: any) => a.name).join(', ')}`,
          intuitive_rationale: isDirectExecution
            ? `The system executed agent "${formatAgentName(agentTag)}" directly based on your query. This agent coordinated with ${executedAgents.length - 1} supporting agent${executedAgents.length - 1 !== 1 ? 's' : ''} to provide a comprehensive response.`
            : `The system orchestrated a crew of ${executedAgents.length} specialized agents to analyze and respond to your query. Each agent contributed their expertise to deliver comprehensive insights.`,
          expected_business_impact: `Execution Summary: ${executedAgents.filter((a: any) => a.success).length} successful, ${executedAgents.filter((a: any) => !a.success).length} with issues. Total agents: ${executedAgents.length}`
        };

        extractedDecisions.unshift(crewDecision);
      }
    }

    // Update decisions state - replace all existing template/dynamic agent decisions
    if (extractedDecisions.length > 0) {
      setDecisions(prev => {
        // Remove any existing template/dynamic agent/crew decisions
        const filteredDecisions = prev.filter(d => 
          !d.id.startsWith('template_') && !d.id.startsWith('dynamic_agent_') && !d.id.startsWith('crew_execution_')
        );
        // Add all decisions (crew execution first, then dynamic agent or executed template)
        return [...extractedDecisions, ...filteredDecisions];
      });
    }
  }, [apiResponse]);

  // Subscribe to EventBus for real-time decisions from DecisionExtractionAgent
  useEffect(() => {
    const handleDecisionCreated = (event: CustomEvent) => {
      const decision = event.detail;
      console.log('[DecisionInbox] 📥 Received decision from agent:', decision);
      
      // Add to decisions list (prepend for newest first)
      setDecisions(prev => [decision, ...prev]);
    };

    window.addEventListener('decision.created', handleDecisionCreated as EventListener);
    
    return () => {
      window.removeEventListener('decision.created', handleDecisionCreated as EventListener);
    };
  }, []);

  /**
   * INPUT: Orchestration updates from /api/orchestration/events SSE stream
   * OUTPUT: Real-time orchestration state updates
   * PURPOSE: Monitor continuous orchestration for decision generation
   * FLOW:
   * 1. Connects to orchestration-specific SSE endpoint
   * 2. Receives phase changes, agent assignments, action updates
   * 3. Triggers decision refresh when new decisions are created
   */
  const { updates, isConnected, latestUpdate } = useOrchestrationStream({
    enabled: true,
    apiUrl: window.location.origin,
    userId: 'anonymous',
    conversationId: 'main_conversation'
  });

  // Log continuous orchestration updates
  useEffect(() => {
    if (latestUpdate) {
      console.log('🔄 [DecisionInbox] Continuous orchestration update:', latestUpdate.type);
      
      // Refresh decisions on relevant updates
      if (latestUpdate.type === 'action_update' || 
          latestUpdate.type === 'agent_completed' ||
          latestUpdate.type === 'completed') {
        console.log('🔄 [DecisionInbox] Refreshing decisions due to orchestration update');
        fetchDecisions();
      }
    }
  }, [latestUpdate]);

  // Live action activity from SSE bridged events
  type ActionEvt = { id: string; status?: string; title?: string; decision_id?: string; updatedAt?: number };
  const [recentActions, setRecentActions] = useState<ActionEvt[]>([]);
  const [actionCounts, setActionCounts] = useState<{ created: number; updated: number }>({ created: 0, updated: 0 });

  const fetchDecisions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // API calls removed - using empty array
      console.log('🔍 DecisionInbox: API calls disabled, using empty decisions list');
      setDecisions([]);
    } catch (error) {
      console.error('Error in fetchDecisions:', error);
      setError('Failed to load decisions');
    } finally {
      setLoading(false);
    }
  };
  
  // StrictMode-safe initialization with useRef
  const didInit = useRef(false);

  // Fetch decisions on mount (idempotent for StrictMode)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    console.log('🔍 DecisionInbox: fetchDecisions called from useEffect');
    fetchDecisions();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      // API call removed - just remove from local state
      console.log('🔍 DecisionInbox: Accepting decision (API disabled):', id);
      setDecisions(prev => prev.filter(decision => decision.id !== id));
    } catch (error) {
      console.error('Error accepting decision:', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      // API call removed - just remove from local state
      console.log('🔍 DecisionInbox: Dismissing decision (API disabled):', id);
      setDecisions(prev => prev.filter(decision => decision.id !== id));
    } catch (error) {
      console.error('Error dismissing decision:', error);
    }
  };

  const { latestUpdate: latestDecisionUpdate } = useDecisionInboxSSE({
    enabled: true,
    userId: 'anonymous',
  });

  useEffect(() => {
    if (latestDecisionUpdate) {
      console.log('⚡️ [DecisionInbox] Received SSE update:', latestDecisionUpdate.event_type);
      fetchDecisions();
    }
  }, [latestDecisionUpdate]);

  useImperativeHandle(ref, () => ({
    fetchData: fetchDecisions,
  }));

  const filteredDecisions = decisions.filter(decision => {
    if (activeFilter === 'all') return true;
    return decision.decision_type === activeFilter || 
          (activeFilter === 'action' && !decision.decision_type); // Default to action for legacy
  });

  return (
    <div className="rounded-lg shadow p-4 bg-white">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="rounded-full w-6 h-6 bg-blue-500 text-white flex items-center justify-center">
            {decisions.length}
          </span>
          Decision Inbox
        </h2>
        
        {/* Live activity strip (compact) */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-gray-100">actions: {actionCounts.created}</span>
          <span className="px-2 py-1 rounded bg-gray-100">updates: {actionCounts.updated}</span>
          {recentActions[0] && (
            <span className="px-2 py-1 rounded bg-gray-50 text-gray-600">
              last: {recentActions[0].title || recentActions[0].id} · {recentActions[0].status || 'created'}
            </span>
          )}
        </div>
      </div>

      {/* Filter Row - Distinct Design */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Filter:</span>
        <div className="flex text-xs space-x-1.5">
          <button 
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              activeFilter === 'all' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
            }`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium transition-all ${
              activeFilter === 'action' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' 
                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
            }`}
            onClick={() => setActiveFilter('action')}
          >
            <Zap size={14} /> Actions
          </button>
          <button 
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium transition-all ${
              activeFilter === 'simulation' 
                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md' 
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
            }`}
            onClick={() => setActiveFilter('simulation')}
          >
            <BarChart size={14} /> Simulations
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center p-4">
          <p>Loading suggestions...</p>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50 my-2">
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && decisions.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          <p>No pending decisions</p>
        </div>
      )}
      
      <div className="space-y-2 p-3">
        {filteredDecisions.map((decision) => {
          // Helper function to get decision title
          const getDecisionTitle = () => {
            if (decision.title) return decision.title;
            if (decision.recommended_action) return decision.recommended_action;
            if (decision.parsed_content?.suggestions?.[0]?.title) {
              return decision.parsed_content.suggestions[0].title;
            }
            return 'Decision suggestion';
          };
          
          // Helper function to get decision description
          const getDecisionDescription = () => {
            if (decision.description) return decision.description;
            if (decision.intuitive_rationale) return decision.intuitive_rationale;
            if (decision.parsed_content?.suggestions?.[0]?.description) {
              return decision.parsed_content.suggestions[0].description;
            }
            return '';
          };
          
          // Helper function to get reasoning or impact
          const getDecisionReasoning = () => {
            if (decision.expected_business_impact) return decision.expected_business_impact;
            if (decision.parsed_content?.reasoning) {
              return decision.parsed_content.reasoning;
            }
            return '';
          };
          
          // Helper function to get priority class
          const getPriorityClass = () => {
            const priority = decision.priority || 
              decision.parsed_content?.suggestions?.[0]?.priority || 
              'medium';
              
            switch(priority.toLowerCase()) {
              case 'high': return 'border-red-400 bg-red-50';
              case 'medium': return 'border-yellow-400 bg-yellow-50';
              case 'low': return 'border-green-400 bg-green-50';
              default: return 'border-gray-300';
            }
          };
          
          const priorityClass = getPriorityClass();
          const title = getDecisionTitle();
          const description = getDecisionDescription();
          const reasoning = getDecisionReasoning();
          
          // Determine decision type for visual styling
          const decisionType = decision.decision_type || 'action'; // Default to action for legacy decisions
          const isSimulation = decisionType === 'simulation';
          
          // Badge styling based on decision type
          const badgeClass = isSimulation 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800';
            
          const badgeIcon = isSimulation 
            ? <BarChart size={12} /> 
            : <Zap size={12} />;
          
          // Check if this is a discovery-related decision
          const isDiscoveryDecision = decision.id?.includes('discovery_');
          const isDynamicAgent = decision.id?.includes('discovery_dynamic_agent');
          const isConfidenceScores = decision.id?.includes('discovery_confidence_scores');
          const isCrewExecution = decision.id?.includes('crew_execution_');
          
          return (
            <div key={decision.id} className={`rounded-lg border-l-4 p-3.5 mb-3 border shadow-sm ${priorityClass} ${isDiscoveryDecision ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : isCrewExecution ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${badgeClass} ${isDiscoveryDecision ? 'bg-indigo-100 text-indigo-800' : isCrewExecution ? 'bg-indigo-100 text-indigo-800' : ''}`}>
                  {isDynamicAgent ? '🔧' : isConfidenceScores ? '📊' : isCrewExecution ? '👥' : badgeIcon} 
                  {isDynamicAgent ? 'Dynamic Agent' : isConfidenceScores ? 'Discovery' : isCrewExecution ? 'Crew Execution' : isSimulation ? 'Simulation' : 'Action'}
                </span>
                {/* Inline status from action lifecycle if present */}
                {decision.status && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    decision.status === 'completed' ? 'bg-green-100 text-green-700' :
                    decision.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    decision.status === 'denied' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {decision.status.replace('_',' ')}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">{title}</p>
              {description && (
                <p className="text-xs text-gray-600 mb-2">{description}</p>
              )}
              
              {/* Special display for dynamic agent creation */}
              {isDynamicAgent && decision.expected_business_impact && (
                <div className="mb-3 p-2 bg-white rounded border border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">Agent Details:</p>
                  <p className="text-xs text-gray-700 mb-1">{decision.recommended_action}</p>
                  <p className="text-xs text-gray-600 mb-1">{decision.expected_business_impact}</p>
                  {decision.intuitive_rationale && (
                    <p className="text-xs text-gray-500 italic mt-1">{decision.intuitive_rationale}</p>
                  )}
                </div>
              )}

              {/* Special display for crew execution - show all agents */}
              {isCrewExecution && decision.parsed_content?.suggestions && (
                <div className="mb-3 p-2 bg-white rounded border border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-700 mb-2">Agents & Teams:</p>
                  <div className="space-y-2">
                    {decision.parsed_content.suggestions.map((suggestion: any, idx: number) => {
                      const isGroup = suggestion.title?.includes('(') && suggestion.title?.includes(')');
                      const isAgent = suggestion.title?.startsWith('Agent:');
                      const isPrimary = suggestion.title?.startsWith('Primary Agent:') || suggestion.title?.startsWith('Crew Size:');
                      
                      return (
                        <div key={idx} className={`text-xs ${isPrimary ? 'pb-2 border-b border-indigo-100' : ''}`}>
                          <div className="flex items-start justify-between">
                            <span className={`font-medium ${isPrimary ? 'text-indigo-800' : isGroup ? 'text-indigo-600' : 'text-gray-700'}`}>
                              {suggestion.title}
                            </span>
                            {suggestion.priority === 'high' && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px]">✓</span>
                            )}
                          </div>
                          {suggestion.description && (
                            <p className={`mt-1 ${isPrimary ? 'text-indigo-600' : 'text-gray-600'}`}>
                              {suggestion.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {decision.context && (
                    <p className="text-xs text-gray-500 mt-2 italic">{decision.context}</p>
                  )}
                </div>
              )}

              {/* Special display for confidence scores */}
              {isConfidenceScores && decision.parsed_content?.suggestions && (
                <div className="mb-3 p-2 bg-white rounded border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-2">Top Agent Matches:</p>
                  <div className="space-y-1">
                    {decision.parsed_content.suggestions.map((suggestion: any, idx: number) => {
                      const confValue = parseFloat(suggestion.description?.replace('Confidence: ', '').replace('%', '') || '0');
                      const confColor = confValue >= 72 ? 'text-green-600' : confValue >= 50 ? 'text-yellow-600' : 'text-red-600';
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{suggestion.title}</span>
                          <span className={`font-semibold ${confColor}`}>{suggestion.description}</span>
                        </div>
                      );
                    })}
                  </div>
                  {decision.context && (
                    <p className="text-xs text-gray-500 mt-2 italic">{decision.context}</p>
                  )}
                </div>
              )}

              {reasoning && !isDiscoveryDecision && (
                <p className="text-xs text-gray-500 italic mb-3">💡 {reasoning}</p>
              )}
              {reasoning && isDiscoveryDecision && (
                <p className="text-xs text-indigo-600 italic mb-3 font-medium">💡 {reasoning}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <TooltipProvider>
                  {!isSimulation && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          onClick={() => handleAccept(decision.id)}
                          className="flex items-center gap-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded px-3 py-1.5 transition-colors whitespace-nowrap"
                        >
                          <Check size={14} />
                          Execute
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Execute this action directly in the system</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => {
                          setShowParameterPanel(
                            showParameterPanel === decision.id ? null : decision.id
                          );
                        }}
                        className={`flex items-center gap-1 text-xs font-medium ${
                          showParameterPanel === decision.id
                            ? 'bg-purple-600 text-white'
                            : isSimulation 
                              ? 'bg-purple-600 text-white hover:bg-purple-700' 
                              : 'border border-purple-500 text-purple-600 hover:bg-purple-50'
                        } rounded px-3 py-1.5 transition-colors whitespace-nowrap`}
                      >
                        <Settings size={14} />
                        {showParameterPanel === decision.id ? 'Hide' : 'Configure'}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        {showParameterPanel === decision.id 
                          ? 'Hide simulation parameter controls'
                          : 'Configure simulation parameters with interactive controls'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => handleDismiss(decision.id)}
                        className="flex items-center gap-1 text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 rounded px-3 py-1.5 transition-colors whitespace-nowrap"
                      >
                        <X size={14} />
                        Dismiss
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">Remove this item from your decision inbox</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Simulation Parameter Panel */}
              {showParameterPanel === decision.id && (
                <div className="mt-4 border-t pt-4">
                  <SimulationParameterPanel
                    decisionId={decision.id}
                    onParametersChange={(params) => {
                      console.log('[DecisionInbox] Parameters changed:', params);
                    }}
                    onRunSimulation={async () => {
                      setSimulationRunning(decision.id);
                      try {
                        // API call removed - just call callback
                        console.log('🔍 DecisionInbox: Running simulation (API disabled):', decision.id);
                        
                        // Call original onSimulate callback
                        onSimulate(decision.id);

                        // Close parameter panel
                        setShowParameterPanel(null);
                      } catch (err) {
                        console.error('Simulation error:', err);
                        setError((err as Error).message);
                      } finally {
                        setSimulationRunning(null);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default DecisionInbox;
