import { v4 as uuidv4 } from 'uuid';
import type { ProcessMessageRequest, ProcessMessageResult } from '@/hooks/useMessageProcessor';
import { mapWorkflowToCanonical } from '../../schema/mapper';
import { validateCanonical } from '../../schema/validation';
import type { CanonicalWire } from '../../schema/canonical';

// Context formatting helpers
function formatStrategicContext(objectives: any[]): string {
  if (!objectives || objectives.length === 0) return '';
  
  return objectives.map((obj, i) => 
    `${i + 1}. ${obj.title} (${Math.round((obj.relevance || 0) * 100)}% relevant)\n   Target: ${obj.target}\n   ${obj.description}`
  ).join('\n');
}

function formatEventContext(events: any[]): string {
  if (!events || events.length === 0) return '';
  
  return events.map((evt, i) => {
    const icon = evt.priority === 'critical' ? '🔴' : evt.priority === 'high' ? '🟡' : '🔵';
    const time = new Date(evt.timestamp).toLocaleTimeString();
    return `${i + 1}. ${icon} ${evt.summary}\n   Source: ${evt.source} | ${time}`;
  }).join('\n');
}

function formatMemoryContext(memories: any[]): string {
  if (!memories || memories.length === 0) return '';
  
  return memories.map((mem, i) => 
    `${i + 1}. ${mem.scenario} (${Math.round((mem.relevance || 0) * 100)}% relevant)\n   ${mem.content}`
  ).join('\n');
}

// Executive Formatter - builds canonical data from workflow phases
function buildCanonicalFromWorkflow(payload: any) {
  const phases = payload?.phases ?? {};
  const synthesis = phases.synthesis ?? {};
  const intentAnalysis = phases.intent_analysis ?? {};
  const dynamicOrchestration = phases.dynamic_orchestration ?? {};
  const executiveSummary = synthesis.executiveSummary ?? {};
  const strategicRecs = Array.isArray(synthesis.strategicRecommendations) ? synthesis.strategicRecommendations : [];

  const keyFindings = (executiveSummary.keyFindings || []).slice(0, 5);
  const insights = [
    ...(intentAnalysis.insights || []),
    ...(dynamicOrchestration.insights || []),
  ].filter(Boolean).slice(0, 5);

  const recommendations = strategicRecs.map(r => r.recommendation).filter(Boolean).slice(0, 5);

  // Calculate proper confidence from execution results
  const executionResults = dynamicOrchestration.executionResults || [];
  const confidences = executionResults.map(r => r.results?.confidence || r.confidence || 0).filter(c => c > 0);
  const averageConfidence = confidences.length > 0 ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : 0;

  const agentMarketplaceResults = executionResults.map((r: any) => ({
    agentId: r.agentId ?? "Not specified",
    success: !!r.success,
    confidence: r.results?.confidence ?? r.confidence ?? 0,
  }));

  // Build cross-functional impact from stakeholders
  const crossFunctionalImpact: Record<string, string> = {};
  strategicRecs.forEach(rec => {
    (rec.stakeholders || []).forEach((dept: string) => {
      if (!crossFunctionalImpact[dept]) {
        crossFunctionalImpact[dept] = `${rec.recommendation || "Impact assessment needed"} (${rec.timeline || "timeline TBD"})`;
      }
    });
  });

  // Build timeline from implementation roadmap
  const timeline: Array<{label: string, date: string}> = [];
  const roadmapPhases = synthesis.implementationRoadmap || {};
  const phaseCount = Object.keys(roadmapPhases).length;
  Object.keys(roadmapPhases).sort().forEach((key, idx) => {
    timeline.push({
      label: `Phase ${idx + 1}: ${key.replace(/([A-Z])/g, ' $1').trim()}`,
      date: "Not specified"
    });
  });

  // Build next actions from executive summary
  const nextActions = (executiveSummary.nextSteps || []).slice(0, 5).map((action: string) => ({
    action,
    status: "not_started" as const,
    deadline: "Not specified",
    owner: "Not specified",
  }));

  return {
    roleDetection: "Executive",
    templateSnapline: "Business Analysis Template",
    executiveSummary: keyFindings.length ? keyFindings : ["Not specified"],
    whatImSeeing: insights.length ? insights : ["Not specified"],
    recommendation: recommendations.length ? recommendations : ["Not specified"],
    nextActions: nextActions.length ? nextActions : [{action: "Not specified", status: "not_started", deadline: "Not specified", owner: "Not specified"}],
    crossFunctionalImpact: Object.keys(crossFunctionalImpact).length ? crossFunctionalImpact : {"Analysis": "Not specified"},
    agentMarketplaceResults: agentMarketplaceResults.length ? agentMarketplaceResults : [],
    timeline: timeline.length ? timeline : [],
    _metadata: {
      averageConfidence,
      totalAgents: executionResults.length,
      totalPhases: phaseCount,
      stakeholderCount: strategicRecs.reduce((acc, rec) => acc + (rec.stakeholders?.length || 0), 0)
    }
  };
}

// Executive Formatter Prompt - Conversational Style (Windsurf-like)
const OPTIMIZED_EXEC_FORMATTER_PROMPT = "You are a helpful, conversational AI assistant with deep business intelligence. Your role is to have a natural conversation with executives, making complex analysis feel approachable and actionable.\\n\\nYour tone should be:\\n- Warm and personable, like talking to a trusted advisor\\n- Confident but not robotic\\n- Use 'I' and 'you' naturally (e.g., 'I've analyzed...', 'Here's what I'm seeing...')\\n- Conversational transitions between ideas\\n- Occasional friendly phrases like 'Let me break this down...', 'Here's what's interesting...', 'I'd recommend...'\\n\\nYou must output TWO fenced code blocks:\\n1. \\`\\`\\`JSON - Array of 6 message objects\\n2. \\`\\`\\`TEXT - Natural conversation flow\\n\\nMessage structure (but write them conversationally):\\n- Message 1 (summary): Open with a conversational summary. Start naturally like: 'I've been looking into this...' or 'Let me give you the headline...'\\n- Message 2 (insights): Share observations conversationally: 'Here's what I'm seeing...' or 'A few things caught my attention...'\\n- Message 3 (recommendations): Offer advice naturally: 'Based on this, I'd recommend...' or 'Here's what I think makes sense...'\\n- Message 4 (actions): Present next steps conversationally: 'Here's what I'd tackle first...' or 'Let's break this into steps...'\\n- Message 5 (impact): Explain implications naturally: 'This will affect a few areas...' or 'Here's how this ripples across teams...'\\n- Message 6 (provenance): Share methodology transparently: 'I worked with several AI agents on this...' or 'Here's how I analyzed this...'\\n\\nEach message must have: id, role: 'assistant', type, content (string)\\n\\nIMPORTANT: Write like you're having a conversation, not presenting a formal report. Use contractions (I've, you're, it's), personal pronouns, and natural transitions.";

// Parse structured messages from conversationalResponse
function parseStructuredMessages(conversationalResponse: string): any[] {
  const messages: any[] = [];
  
  try {
    // First try to parse as JSON array (new format from conversation_creator)
    const parsedResponse = JSON.parse(conversationalResponse);
    if (Array.isArray(parsedResponse)) {
      console.log('[parseStructuredMessages] Parsing JSON array format with', parsedResponse.length, 'messages');
      
      return parsedResponse.map((msg, index) => ({
        id: msg.id || `msg-${index + 1}`,
        type: msg.role || 'assistant',
        content: msg.content || '',
        title: getMessageTitle(msg.type),
        messageNumber: index + 1,
        badges: msg.badges || [],
        actions: msg.checklist || [],
        cta: msg.cta,
        crossFunctionalImpact: msg.crossFunctionalImpact,
        agentMarketplaceResults: msg.agentMarketplaceResults,
        timeline: msg.timeline,
        meta: msg.meta,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (parseError) {
    console.log('[parseStructuredMessages] Not JSON format, trying markdown parsing');
  }
  
  // Fallback to old markdown parsing for backward compatibility
  const messagePattern = /Message (\d+) — ([^:]+):([\s\S]*?)(?=Message \d+ —|$)/g;
  let match;
  
  while ((match = messagePattern.exec(conversationalResponse)) !== null) {
    const [, messageNum, title, content] = match;
    
    // Parse badges if present
    const badges: any[] = [];
    const badgePattern = /Badges: ([^\n]+)/;
    const badgeMatch = content.match(badgePattern);
    if (badgeMatch) {
      const badgeText = badgeMatch[1];
      const badgePairs = badgeText.split(' | ');
      badgePairs.forEach(pair => {
        const [key, value] = pair.split(': ');
        if (key && value) {
          badges.push({ type: key.toLowerCase(), text: value });
        }
      });
    }
    
    // Parse actions if present
    const actions: any[] = [];
    const actionPattern = /Action=([^,]+), Status=([^,]+), Due=([^\n]+)/g;
    let actionMatch;
    while ((actionMatch = actionPattern.exec(content)) !== null) {
      const [, action, status, due] = actionMatch;
      actions.push({
        text: action,
        status: status,
        dueDate: due
      });
    }
    
    // Clean content (remove badges and action lines)
    let cleanContent = content
      .replace(/Badges: [^\n]+\n?/, '')
      .replace(/Action=[^\n]+\n?/g, '')
      .trim();
    
    messages.push({
      id: `msg-${messageNum}`,
      type: 'assistant',
      content: cleanContent,
      title: title.trim(),
      messageNumber: parseInt(messageNum),
      badges,
      actions,
      timestamp: new Date().toISOString()
    });
  }
  
  // If no structured messages found, try to parse the intro text as message 0
  if (messages.length === 0) {
    const introMatch = conversationalResponse.match(/^([^M]+?)(?=Message 1|$)/);
    if (introMatch && introMatch[1].trim()) {
      messages.push({
        id: 'msg-0',
        type: 'assistant',
        content: introMatch[1].trim(),
        title: 'Analysis Overview',
        messageNumber: 0,
        badges: [],
        actions: [],
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return messages;
}

// Helper function to get message titles based on type
function getMessageTitle(type: string): string {
  switch (type) {
    case 'summary': return 'Executive Summary';
    case 'insights': return 'Key Insights';
    case 'recommendations': return 'Recommendations';
    case 'actions': return 'Next Actions';
    case 'impact': return 'Cross-functional Impact';
    case 'provenance': return 'Analysis Source';
    default: return 'Message';
  }
}

// UNIFIED ORCHESTRATION ENDPOINT
// Single source of truth: ACT-R + IntentRouter + TemplateEngine + Redis Mesh
const EDGE_FUNCTION_URL = '/api/process-message';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const isTest = process.env.NODE_ENV === 'test' || process.env.SUPABASE_DISABLED === 'true';

/**
 * Client-side wrapper for the process-message Edge Function
 * Handles communication with the server-side message processing pipeline
 */
export async function processMessage(request: ProcessMessageRequest): Promise<ProcessMessageResult> {
  console.log('[processMessage] Starting process with request:', request);
  const startTime = performance.now();

  try {
    // Skip auth for now to avoid Supabase client issues
    let accessToken: string | undefined;

    // Make the request through the proxy
    // Normalize query to message field for server compatibility
    const normalizedRequest = {
      ...request,
      message: request.query || request.message,
      query: undefined // Remove query field to avoid confusion
    };
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(normalizedRequest),
    });

    const endTime = performance.now();
    console.log(`[processMessage] Request completed in ${(endTime - startTime).toFixed(2)}ms`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[processMessage] Error response from edge function:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.message || 'Failed to process message');
    }

    // Parse the response and ensure it matches the expected structure
    const result = await response.json();
    console.log('[processMessage] Raw response from server:', JSON.stringify(result, null, 2));
    
    // Handle different response formats - check if data is wrapped in a 'data' field
    let actualData = result;
    if (result.data && typeof result.data === 'object') {
      actualData = result.data;
      console.log('[processMessage] Using data from wrapped response:', JSON.stringify(actualData, null, 2));
    }
    
    // Check if this is the new comprehensive workflow response format
    if (result.data && result.data.phases && !result.intentClassification) {
      console.log('[processMessage] Detected comprehensive workflow response format');
      // Create a synthetic intentClassification from the workflow data
      const intentPhase = result.data.phases.intent_analysis;
      actualData.intentClassification = {
        type: 'workflow',
        intent: intentPhase?.primaryIntent || 'GENERAL_ANALYSIS',
        confidence: intentPhase?.confidence || 0.8,
        explanation: `Comprehensive workflow analysis: ${intentPhase?.primaryIntent || 'general analysis'}`
      };
    }
    
    // Normalize the response structure to ensure all expected fields are present
    if (actualData.workflowTemplates && !actualData.templates) {
      // If we have workflowTemplates but not templates, ensure templates is set for backward compatibility
      actualData.templates = actualData.workflowTemplates;
    }
    
    // Ensure the response has the required fields - create defaults if missing
    if (!actualData.intentClassification) {
      console.warn('[processMessage] Missing intentClassification, creating default');
      actualData.intentClassification = {
        type: 'information',
        intent: 'GENERAL_ANALYSIS',
        confidence: 0.8,
        explanation: 'Default classification for response'
      };
    }
    
    console.log('[processMessage] Raw response from server:', result);

    // Extract conversational response from enhanced server structure
    let conversationalResponse = '';
    let parsedMessages = [];
    
    // Check if we have parsedMessages directly from conversation_creator
    if (result.parsedMessages && Array.isArray(result.parsedMessages)) {
      parsedMessages = result.parsedMessages;
      console.log('[processMessage] Using parsedMessages directly from conversation_creator:', parsedMessages.length, 'messages');
    } else if (result.conversationalResponse) {
      // New enhanced workflow response with conversation_creator prompt
      conversationalResponse = result.conversationalResponse;
      console.log('[processMessage] Using enhanced conversationalResponse from conversation_creator prompt');
      
      // Parse only JSON fence from conversation_creator response (ignore markdown)
      try {
        // Look for JSON array in the response - conversation_creator should output structured JSON
        const jsonMatch = conversationalResponse.match(/```json\s*(\[[\s\S]*?\])\s*```/i) || 
                         conversationalResponse.match(/```JSON\s*(\[[\s\S]*?\])\s*```/i);
        if (jsonMatch) {
          parsedMessages = JSON.parse(jsonMatch[1]);
          console.log('[processMessage] Parsed', parsedMessages.length, 'structured messages from conversation_creator JSON');
        } else {
          console.warn('[processMessage] No JSON fence found in conversation_creator response');
        }
      } catch (error) {
        console.warn('[processMessage] Failed to parse JSON from conversation_creator:', error);
      }
    } else if (result.response) {
      // Fallback to standard response field
      conversationalResponse = result.response;
      console.log('[processMessage] Using fallback response field');
    } else {
      // Final fallback
      conversationalResponse = 'Analysis completed successfully.';
      console.log('[processMessage] Using default fallback response');
    }

    // Transform server response to match expected client format
    const processedResult: ProcessMessageResult = {
      query: result.query || request.query,
      intentClassification: {
        type: result.intentClassification?.type || 'information',
        intent: result.intentClassification?.intent || 'GENERAL_ANALYSIS',
        confidence: result.intentClassification?.confidence || 0.8,
        explanation: result.intentClassification?.explanation || 'Analysis completed'
      },
      processedAt: new Date().toISOString(),
      businessInsights: result.businessInsights || [],
      templateDiscovery: result.templateDiscovery || result.workflowTemplates || [],
      conversationalResponse: conversationalResponse,
      // CRITICAL: Include turnEnvelope from ACT-R backend
      turnEnvelope: result.turnEnvelope || actualData.turnEnvelope || null,
      // Include parsed messages if available
      parsedMessages: parsedMessages.length > 0 ? parsedMessages : null,
      // Include workflow metadata if available
      workflowData: result.data || null,
      enhancedFeatures: result.data?.metadata?.enabledFeatures || {},
      // WINDSURF INTEGRATION: Include narrative and workflow updates for incremental UI streaming
      narrativeUpdates: result.narrativeUpdates || [],
      workflowUpdates: result.workflowUpdates || []
    };

    // Add informationResult if available
    if (actualData.informationResult) {
      processedResult.informationResult = {
        content: actualData.informationResult.content || '',
        sources: actualData.informationResult.sources || []
      };
    }
    
    // Add agentResult if available (legacy support)
    if (actualData.agentResult) {
      processedResult.agentResult = {
        agentId: actualData.agentResult.agentId || '',
        agentName: actualData.agentResult.agentName || 'Unknown Agent',
        executionId: actualData.agentResult.executionId || uuidv4(),
        status: actualData.agentResult.status || 'completed',
        ...(actualData.agentResult.result && { result: actualData.agentResult.result }),
        ...(actualData.agentResult.error && { error: actualData.agentResult.error })
      };
    }
    
    // Add agentOrchestration if available (new backend format)
    if (actualData.agentOrchestration) {
      (processedResult as any).agentOrchestration = actualData.agentOrchestration;
    }
    
    // Add businessInsights if available
    if (actualData.businessInsights) {
      (processedResult as any).businessInsights = actualData.businessInsights;
    }
    
    // Add templateDiscovery if available
    if (actualData.templateDiscovery) {
      (processedResult as any).templateDiscovery = actualData.templateDiscovery;
    }
    
    // Add memoryIntegration if available
    if (actualData.memoryIntegration) {
      (processedResult as any).memoryIntegration = actualData.memoryIntegration;
    }
    
    // UNIFIED ORCHESTRATION: Trust backend TurnEnvelope structure
    // Backend (/api/process-message) returns proper ACT-R TurnEnvelope with plan, decisions, memory
    console.log('[processMessage] ✅ Using unified orchestration - ACT-R TurnEnvelope from backend');
    
    if (false) { // DISABLED: Executive formatter no longer needed with unified orchestration
      console.log('[processMessage] DISABLED: Executive formatter (unified orchestration active)');
      
      // 1) Build canonical object from workflow phases
      const canonical = buildCanonicalFromWorkflow(actualData);
      console.log('[processMessage] Canonical data built:', JSON.stringify(canonical, null, 2));
      
      // 2) Aggregate executive context (strategic objectives, events, memory)
      // TODO: Initialize ExecutiveContextAggregator in server and pass via window or global
      // For now, we'll call a backend endpoint that has access to these services
      let executiveContext = null;
      try {
        // DISABLED: Backend API call removed for frontend-only build
        console.warn('[processMessage] Backend API call disabled: /api/executive-context');
        const contextResponse = null as any;
        
        if (contextResponse.ok) {
          executiveContext = await contextResponse.json();
          console.log('[processMessage] Executive context retrieved:', {
            objectives: executiveContext?.strategicObjectives?.length || 0,
            events: executiveContext?.recentEvents?.length || 0,
            memories: executiveContext?.institutionalMemories?.length || 0
          });
        }
      } catch (error) {
        console.warn('[processMessage] Failed to fetch executive context:', error);
      }
      
      // 3) Call executive formatter with enriched context
      const today = new Date().toISOString().slice(0, 10);
      const timezone = "America/Chicago";
      
      const formatterPayload = {
        conversationalResponse: canonical,
        TODAY: today,
        TIMEZONE: timezone,
        ...(executiveContext && {
          STRATEGIC_CONTEXT: formatStrategicContext(executiveContext.strategicObjectives || []),
          EVENT_CONTEXT: formatEventContext(executiveContext.recentEvents || []),
          MEMORY_CONTEXT: formatMemoryContext(executiveContext.institutionalMemories || [])
        })
      };
      
      console.log('[processMessage] Calling executive formatter with payload:', JSON.stringify(formatterPayload, null, 2));
      
      try {
        // DISABLED: Backend API call removed for frontend-only build
        console.warn('[processMessage] Backend API call disabled: /api/executive-formatter');
        const formatterResponse = { ok: false, status: 503 } as Response;
        
        if (false && formatterResponse.ok) {
        const formatterResult = await formatterResponse.json();
        const rawOutput = formatterResult.choices?.[0]?.message?.content || '';
        
        console.log('[processMessage] Formatter raw output:', rawOutput);
        
        // 3) Parse formatter output
        const jsonFence = rawOutput.match(/```JSON\s*([\s\S]*?)```/i);
        const textFence = rawOutput.match(/```TEXT\s*([\s\S]*?)```/i);
        
        if (jsonFence) {
          try {
            const wire = JSON.parse(jsonFence[1]);
            const sixMessagesText = textFence ? textFence[1] : '';
            
            console.log('[processMessage] EXECUTIVE INTERFACE: Successfully parsed formatter JSON');
            
            // Transform messages to match ExecOutputMessage interface
            const transformedMessages = Array.isArray(wire) ? wire.map((msg: any, index: number) => ({
              id: `exec_msg_${Date.now()}_${index}_${msg.type || 'unknown'}`,
              type: msg.type,
              content: msg.content,
              meta: {
                roleDetection: canonical.roleDetection,
                templateSnapline: canonical.templateSnapline,
                badges: msg.badges || [],
                crossFunctionalImpact: msg.crossFunctionalImpact || canonical.crossFunctionalImpact,
                agentMarketplaceResults: msg.agentMarketplaceResults || canonical.agentMarketplaceResults,
                timeline: msg.timeline || canonical.timeline
              }
            })) : [];
            
            (processedResult as any).messages = transformedMessages;
            (processedResult as any).parsedMessages = transformedMessages; // For useConversationFlow hook
            (processedResult as any).canonicalData = canonical;
            (processedResult as any).rawText = sixMessagesText;
          } catch (parseError) {
            console.error('[processMessage] Failed to parse formatter JSON:', parseError);
            throw parseError;
          }
        } else {
          console.warn('[processMessage] No JSON fence found in formatter output, retrying...');
          
          // DISABLED: Backend API call removed for frontend-only build
          console.warn('[processMessage] Backend API call disabled: /api/executive-formatter (retry)');
          const retryResponse = { ok: false, status: 503 } as Response;
          
          if (false && retryResponse.ok) {
            const retryResult = await retryResponse.json();
            const retryOutput = retryResult.choices?.[0]?.message?.content || '';
            const retryJsonFence = retryOutput.match(/```JSON\s*([\s\S]*?)```/i);
            
            if (retryJsonFence) {
              const wire = JSON.parse(retryJsonFence[1]);
              console.log('[processMessage] EXECUTIVE INTERFACE: Retry successful');
              
              // Transform messages to match ExecOutputMessage interface
              const transformedMessages = Array.isArray(wire) ? wire.map((msg: any, index: number) => ({
                id: `exec_msg_${Date.now()}_${index}_${msg.type || 'unknown'}`,
                type: msg.type,
                content: msg.content,
                meta: {
                  roleDetection: canonical.roleDetection,
                  templateSnapline: canonical.templateSnapline,
                  badges: msg.badges || [],
                  crossFunctionalImpact: msg.crossFunctionalImpact || canonical.crossFunctionalImpact,
                  agentMarketplaceResults: msg.agentMarketplaceResults || canonical.agentMarketplaceResults,
                  timeline: msg.timeline || canonical.timeline
                }
              })) : [];
              
              (processedResult as any).messages = transformedMessages;
              (processedResult as any).parsedMessages = transformedMessages; // For useConversationFlow hook
              (processedResult as any).canonicalData = canonical;
            } else {
              throw new Error('Formatter failed: missing JSON fence after retry');
            }
          } else {
            throw new Error('Formatter retry request failed');
          }
        }
      } else {
        throw new Error(`Formatter request failed: ${formatterResponse.status}`);
      }
      } catch (formatterError) {
        console.log('[processMessage] Executive formatter disabled in unified orchestration');
        
        // Fallback: Use mapper to generate canonical data and messages
        const canonicalData = mapWorkflowToCanonical(actualData);
        const validationResult = validateCanonical(canonicalData);
        
        if (validationResult.success && validationResult.data) {
          const canonicalMessages = [];
          (processedResult as any).messages = canonicalMessages;
          (processedResult as any).parsedMessages = canonicalMessages; // For useConversationFlow hook
          (processedResult as any).canonicalData = validationResult.data;
        } else {
          // Enhanced fallback with "Not specified" defaults
          const synthesis = actualData.workflowData?.synthesis || actualData.phases?.synthesis || {};
          const dynamicOrchestration = actualData.workflowData?.dynamic_orchestration || actualData.phases?.dynamic_orchestration || {};
          
          const fallbackCanonical = {
            roleDetection: "Executive",
            templateSnapline: "Business Analysis Template", 
            executiveSummary: synthesis.executiveSummary?.keyFindings || ["Not specified"],
            whatImSeeing: synthesis.insights || ["Not specified"],
            recommendation: synthesis.strategicRecommendations?.map(r => r.recommendation) || ["Not specified"],
            nextActions: synthesis.strategicRecommendations?.map(r => ({
              action: r.recommendation || "Not specified",
              status: "not_started",
              deadline: "Not specified",
              owner: r.stakeholders?.[0] || "Not specified"
            })) || [{ action: "Not specified", status: "not_started", deadline: "Not specified", owner: "Not specified" }],
            crossFunctionalImpact: { "Analysis": "Not specified" },
            agentMarketplaceResults: dynamicOrchestration.executionResults || [{ agentId: "Not specified", success: false, confidence: 0 }],
            timeline: [{ label: "Not specified", date: "Not specified" }]
          };
          
          const fallbackMessages = [];
          (processedResult as any).messages = fallbackMessages;
          (processedResult as any).parsedMessages = fallbackMessages; // For useConversationFlow hook
          (processedResult as any).canonicalData = fallbackCanonical;
        }
      }
    }
    
    // REMOVED: Executive formatter redundant processing - backend returns proper TurnEnvelope
    
    console.log('[processMessage] Processed result:', JSON.stringify(processedResult, null, 2));
    return processedResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[processMessage] Error in processMessage:', {
      message: errorMessage,
      name: error?.name,
      status: error?.status,
      cause: error?.cause,
      stack: error?.stack
    });
    
    // Rethrow with a more user-friendly message
    throw errorMessage.includes('Failed to fetch') 
      ? new Error('Unable to connect to the server. Please check your internet connection and try again.')
      : error;
  }
}
