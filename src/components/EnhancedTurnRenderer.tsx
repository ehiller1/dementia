/**
 * Enhanced Turn Renderer - Renders complete TurnEnvelope with all components
 * Handles: Delta, Memory, Concepts, Plan, Questions, Provenance, Decisions
 */

import React from 'react';
import { DeltaPanel } from './DeltaPanel';
import { MemoryPanel } from './MemoryPanel';
import { ProvenancePanel } from './ProvenancePanel';
import { ApprovalButtonGroup } from './ApprovalButton';
import { eventBus } from '@/services/events/EventBus';
import type { TurnEnvelope, DeclarativeTask, ProceduralTask, Question, Decision } from '../turn/TurnEnvelope';

interface EnhancedTurnRendererProps {
  turnEnvelope?: TurnEnvelope;
  parsedMessages?: any[];
  className?: string;
}

export function EnhancedTurnRenderer({ 
  turnEnvelope,
  parsedMessages = [],
  className = '' 
}: EnhancedTurnRendererProps) {
  // If we have full TurnEnvelope, use it for rich rendering
  if (turnEnvelope) {
    console.log('[EnhancedTurnRenderer] 🎨 Mounted with TurnEnvelope:');
    console.log(`   ├─ declarative: ${turnEnvelope.plan?.declarative?.length || 0}`);
    console.log(`   ├─ procedural: ${turnEnvelope.plan?.procedural?.length || 0}`);
    console.log(`   ├─ asks: ${turnEnvelope.ask?.length || 0}`);
    console.log(`   ├─ delta: ${!!turnEnvelope.delta}`);
    console.log(`   └─ decisions: ${turnEnvelope.decisions?.length || 0}`);
    
    return <TurnEnvelopeRenderer turn={turnEnvelope} className={className} />;
  }
  
  // Otherwise fall back to legacy message rendering
  return <LegacyMessageRenderer messages={parsedMessages} className={className} />;
}

/**
 * Render a complete TurnEnvelope with all panels
 */
function TurnEnvelopeRenderer({ turn, className }: { turn: TurnEnvelope; className?: string }) {
  const mode = turn.meta?.mode || 'explore';
  
  return (
    <div className={`turn-envelope-renderer ${className || ''}`}>
      {/* DELTA FIRST - Show what changed */}
      {turn.delta && <DeltaPanel delta={turn.delta} />}
      
      {/* ACKNOWLEDGMENT */}
      <div className="turn-ack">
        <div className="ack-content">{turn.ack}</div>
      </div>
        
        {/* CONCEPTS FIRST - Executive sees problem framing before details */}
        {turn.meta?.concepts && (
          <div className="conceptualization-section">
            <h3>💡 Conceptualization</h3>
            
            {turn.meta.concepts.summary && turn.meta.concepts.summary.length > 0 && (
              <div className="concept-block">
                <h4>Summary</h4>
                <ul>
                  {turn.meta.concepts.summary.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {turn.meta.concepts.drivers && turn.meta.concepts.drivers.length > 0 && (
              <div className="concept-block">
                <h4>Key Drivers</h4>
                <ul>
                  {turn.meta.concepts.drivers.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {turn.meta.concepts.hypotheses && turn.meta.concepts.hypotheses.length > 0 && (
              <div className="concept-block">
                <h4>Hypotheses</h4>
                <ul>
                  {turn.meta.concepts.hypotheses.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {turn.meta.concepts.unknowns && turn.meta.concepts.unknowns.length > 0 && (
              <div className="concept-block unknowns">
                <h4>❓ Unknowns (To Resolve)</h4>
                <ul>
                  {turn.meta.concepts.unknowns.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {turn.meta.concepts.risks && turn.meta.concepts.risks.length > 0 && (
              <div className="concept-block risks">
                <h4>⚠️ Risks</h4>
                <ul>
                  {turn.meta.concepts.risks.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* MEMORY - Institutional context with HITL approval */}
        {turn.memory && (
          <MemoryPanel
            memory={turn.memory}
            mode={mode}
            onApproveMemoryFetch={() => {
              eventBus.publish('approval:granted', {
                taskId: 'search-memory',
                userId: 'current-user', // TODO: Get from auth context
                timestamp: Date.now(),
                source: 'ui'
              });
            }}
          />
        )}
        
        {/* PLAN - Knowledge + Actions with Approvals */}
        {turn.plan && typeof turn.plan === 'object' && (turn.plan.declarative || turn.plan.procedural) && (
          <div className="plan-section">
            <h3>📋 Plan</h3>
            
            {/* Declarative Tasks (Knowledge Acquisition) */}
            {turn.plan.declarative && Array.isArray(turn.plan.declarative) && turn.plan.declarative.length > 0 && (
              <div className="declarative-tasks">
                <h4>Knowledge to Acquire:</h4>
                <ApprovalButtonGroup
                  tasks={turn.plan.declarative.map((task: DeclarativeTask) => ({
                    id: task.id,
                    label: task.title,
                    status: task.status
                  }))}
                />
              </div>
            )}
            
            {/* Procedural Tasks (Actions) */}
            {turn.plan.procedural && Array.isArray(turn.plan.procedural) && turn.plan.procedural.length > 0 && (
              <div className="procedural-tasks">
                <h4>Actions to Execute:</h4>
                <ApprovalButtonGroup
                  tasks={turn.plan.procedural.map((task: ProceduralTask) => ({
                    id: task.id,
                    label: task.title,
                    service: task.service,
                    status: task.status
                  }))}
                />
              </div>
            )}
          </div>
        )}
        
        {/* ASKS - Interactive clarifications */}
        {(turn.ask?.length ?? 0) > 0 && (
          <div className="questions-section">
            <h3>💬 Questions</h3>
            <div className="questions-list">
              {turn.ask.map((question: Question, index) => (
                <div key={question.id || index} className="question-item">
                  <div className="question-text">{question.text}</div>
                  {question.options && (
                    <select className="question-options">
                      <option value="">Select...</option>
                      {question.options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* DECISIONS - Actionable choices with approve/reject */}
        {(turn.decisions?.length ?? 0) > 0 && (
          <div className="decisions-section">
            <h3>⚖️ Decisions</h3>
            <div className="decisions-list">
              {turn.decisions.map((decision: Decision) => (
                <div key={decision.id} className={`decision-card ${decision.priority}`}>
                  <div className="decision-header">
                    <h4>{decision.title}</h4>
                    <span className={`priority-badge ${decision.priority}`}>
                      {decision.priority}
                    </span>
                  </div>
                  <div className="decision-rationale">{decision.rationale}</div>
                  {decision.risk && (
                    <div className="decision-risk">
                      <strong>Risk:</strong> {decision.risk}
                    </div>
                  )}
                  {decision.upside && (
                    <div className="decision-upside">
                      <strong>Upside:</strong> {decision.upside}
                    </div>
                  )}
                  {decision.status === 'proposed' && (
                    <div className="decision-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => {
                          eventBus.publish('decision:resolved', {
                            decisionId: decision.id,
                            resolution: 'approved',
                            userId: 'current-user',
                            timestamp: Date.now()
                          });
                        }}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => {
                          eventBus.publish('decision:resolved', {
                            decisionId: decision.id,
                            resolution: 'rejected',
                            userId: 'current-user',
                            timestamp: Date.now()
                          });
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* PROVENANCE - Who did what (agents, artifacts, confidence) */}
        {turn.meta?.provenance && (
          <ProvenancePanel
            provenance={turn.meta.provenance}
            mode={mode}
          />
        )}
    </div>
  );
}

/**
 * Legacy message renderer for backward compatibility
 */
function LegacyMessageRenderer({ messages, className }: { messages: any[]; className?: string }) {
  return (
    <div className={`legacy-message-renderer ${className || ''}`}>
      {messages.map((msg, index) => (
        <div key={msg.id || index} className={`message message-${msg.type}`}>
          {typeof msg.content === 'string' ? (
            <div>{msg.content}</div>
          ) : (
            <pre>{JSON.stringify(msg.content, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
