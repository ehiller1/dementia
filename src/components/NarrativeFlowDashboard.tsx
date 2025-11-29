import React, { useState, useEffect, useRef } from 'react';
import { EnhancedConversationInterfaceComponent as EnhancedConversationInterface } from './EnhancedConversationInterface.js';
import LiveNarrativeStream from './LiveNarrativeStream.js';
import DecisionInbox, { DecisionInboxRef } from './DecisionInbox.js';
import ScenarioSimulator from './ScenarioSimulator.js';
import ExecutiveObservationPanel from './ExecutiveObservationPanel.js';
import { useEnhancedUnifiedConversation } from '@/contexts/EnhancedUnifiedConversationProvider';
import { useSessionService } from '@/hooks/useSessionService';

/**
 * NarrativeFlowDashboard Component
 * 
 * This component integrates the conversational interface with the NarrativeFlow components:
 * - LiveNarrativeStream: Continuous context and ambient awareness
 * - DecisionInbox: Explicit actionable recommendations
 * - ScenarioSimulator: Instant narrative-driven scenario validation
 */
interface TemplateContext {
  templateId: string;
  variables: Record<string, any>;
  updatedAt: string;
  // Add other template context properties as needed
}

const NarrativeFlowDashboard: React.FC = () => {
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const [templateContext, setTemplateContext] = useState<TemplateContext | null>(null);
  const { sendMessage, messages } = useEnhancedUnifiedConversation();
  const { session } = useSessionService();
  const conversationId = session?.id;
  // Local helper to surface system notes without requiring ConversationContext
  const addSystemMessage = (msg: string, _meta?: any) => {
    try { 
      console.info('🎭 NarrativeFlowDashboard:', msg, _meta || ''); 
      console.log('🎭 NarrativeFlowDashboard: System message added:', msg);
    } catch {}
  };
  const decisionInboxRef = useRef<DecisionInboxRef>(null);

  useEffect(() => {
    console.log('🎭 NarrativeFlowDashboard: Component mounted');
    console.log('🎭 NarrativeFlowDashboard: Session ID:', conversationId);
    console.log('🎭 NarrativeFlowDashboard: Initializing narrative flow components');
    
    return () => {
      console.log('🎭 NarrativeFlowDashboard: Component unmounting');
    };
  }, [conversationId]);
  
  // Handler for when "Simulate" is clicked in DecisionInbox
  const handleSimulate = async (decisionId: string) => {
    console.log('🎭 NarrativeFlowDashboard: handleSimulate called for decision:', decisionId);
    setActiveDecisionId(decisionId);
    try {
      console.log('🎭 NarrativeFlowDashboard: Sending simulation request to API...');
      const resp = await fetch(`/api/decisions/${decisionId}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.id ? { 'x-session-id': session.id } : {}),
          ...(session?.userId ? { 'x-user-id': session.userId } : {}),
        },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error('🎭 NarrativeFlowDashboard: Simulation API error:', resp.status, txt);
        throw new Error(`Backend error ${resp.status}: ${txt}`);
      }
      console.log('🎭 NarrativeFlowDashboard: Simulation request successful, refreshing inbox...');
      // refresh inbox after triggering
      decisionInboxRef.current?.fetchData();
      addSystemMessage(`Simulation started for decision ${decisionId}`, { decisionId });
    } catch (e: any) {
      console.error('🎭 NarrativeFlowDashboard: Failed to trigger simulation', e);
      addSystemMessage(`Failed to start simulation: ${e?.message || 'Unknown error'}`);
    }
  };
  
  // Handler for when "Back" is clicked in ScenarioSimulator
  const handleBack = () => {
    console.log('🎭 NarrativeFlowDashboard: handleBack called, returning to decision inbox');
    setActiveDecisionId(null);
  };

  // Generate decisions based on template context
  const generateDecisions = async (context: any) => {
    console.log('🎭 NarrativeFlowDashboard: generateDecisions called with context:', context);
    if (!context) {
      console.log('🎭 NarrativeFlowDashboard: No context provided, skipping decision generation');
      return;
    }
    
    try {
      console.log('🎭 NarrativeFlowDashboard: Sending decision generation request...');
      const response = await fetch('/api/decisions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          userId: 'system', // or get from auth context
          conversationId
        }),
      });
      
      if (!response.ok) {
        console.error('🎭 NarrativeFlowDashboard: Decision generation API error:', response.status);
        throw new Error('Failed to generate decisions');
      }
      
      const result = await response.json();
      console.log('🎭 NarrativeFlowDashboard: Decision generation successful:', result);
      return result;
    } catch (error) {
      console.error('🎭 NarrativeFlowDashboard: Error generating decisions:', error);
      addSystemMessage('Failed to generate decisions. Please try again.');
    }
  };
  
  // Update template context when conversation changes
  useEffect(() => {
    console.log('🎭 NarrativeFlowDashboard: Messages updated, checking for template context...');
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const context = (lastMessage.metadata as any)?.templateContext;
      if (context) {
        console.log('🎭 NarrativeFlowDashboard: Template context found:', context);
        setTemplateContext(context);
      } else {
        console.log('🎭 NarrativeFlowDashboard: No template context in last message');
      }
    }
  }, [messages]);

  // Handler for when "Commit" is clicked in ScenarioSimulator
  const handleCommit = async (decisionId: string) => {
    try {
      // When a decision is committed, also send a message to the conversational interface
      // to maintain context across components
      const response = await fetch(`/api/decisions/${decisionId}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to commit decision');
      }
      
      // Get the decision details to include in the conversation
      const decisionResponse = await fetch(`/api/decisions/${decisionId}`);
      if (decisionResponse.ok) {
        const decision = await decisionResponse.json();
        // Add the decision to the conversation context
        addSystemMessage(`I've committed the decision: "${decision.recommended_action}"`, { decisionId });
      }
      
      // Return to Decision Inbox after successful commit
      setActiveDecisionId(null);
    } catch (error) {
      console.error('Error committing decision:', error);
    }
  };

  // Allow conversational interface to trigger scenario simulation
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Only process user messages
      if (lastMessage.role === 'user') {
        const content = lastMessage.content.toLowerCase();
        
        // Check if the message is asking to simulate a scenario
        if (content.includes('simulate') || content.includes('scenario')) {
          // Find a matching decision
          const fetchMatchingDecision = async () => {
            try {
              const response = await fetch('/api/decisions/suggestions');
              const decisions = await response.json();
              
              // Find a decision that matches keywords in the message
              const matchingDecision = decisions.find(decision => {
                const action = decision.recommended_action.toLowerCase();
                return content.includes(action) || 
                       action.split(' ').some(word => content.includes(word));
              });
              
              if (matchingDecision) {
                setActiveDecisionId(matchingDecision.id);
                // Acknowledge in the conversation that we're simulating
                addSystemMessage(`Simulating the scenario for: "${matchingDecision.recommended_action}"`, { decisionId: matchingDecision.id });
              }
            } catch (error) {
              console.error('Error finding matching decision:', error);
            }
          };
          
          fetchMatchingDecision();
        }
      }
    }
  }, [messages, sendMessage, addSystemMessage]);

  const handleObservationClick = (observation: any) => {
    console.log('🎭 NarrativeFlowDashboard: Executive observation clicked:', observation);
    // Could trigger specific conversation or action
    if (observation.metadata?.query) {
      sendMessage(observation.metadata.query);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left column: Enhanced Conversational Interface with Knowledge Graph */}
      <div className="w-1/2 border-r">
        <EnhancedConversationInterface />
      </div>
      
      {/* Right column: NarrativeFlow components */}
      <div className="w-1/2 flex flex-col h-full">
        {/* Executive Observations (top priority) */}
        <div className="h-1/4 p-4 border-b overflow-auto">
          <ExecutiveObservationPanel 
            onObservationClick={handleObservationClick}
            className="h-full"
          />
        </div>
        
        {/* LiveNarrativeStream */}
        <div className="h-1/4 p-4 border-b overflow-auto">
          <LiveNarrativeStream 
            maxEntries={8} 
          />
        </div>
        
        {/* DecisionInbox or ScenarioSimulator */}
        <div className="h-2/4 p-4 overflow-auto">
          {activeDecisionId ? (
            <ScenarioSimulator 
              decisionId={activeDecisionId} 
              onBack={handleBack} 
              onCommit={() => handleCommit(activeDecisionId)}
            />
          ) : (
            <DecisionInbox 
              onSimulate={handleSimulate}
              templateContext={templateContext}
              onGenerateDecisions={generateDecisions}
              ref={decisionInboxRef} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NarrativeFlowDashboard;
