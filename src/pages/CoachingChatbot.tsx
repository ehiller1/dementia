/**
 * Coaching Chatbot Component
 * Shows call transcript and coaching responses in a chatbot-style interface
 * Demonstrates the end-to-end flow of detection → coaching
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Zap, AlertCircle, CheckCircle, MessageCircle, Shield, TrendingUp, UserPlus, RefreshCw } from 'lucide-react';
import { COACHING_SCENARIOS, SCENARIO_LIST, type Scenario } from '@/data/coaching-scenarios';

interface Message {
  id: string;
  type: 'transcript_customer' | 'transcript_rep' | 'coaching' | 'system';
  speaker?: string;
  text: string;
  timestamp: Date;
  coaching_data?: CoachingData;
}

interface CoachingData {
  agent_name: string;
  title: string;
  message: string;
  suggested_responses?: string[];
  severity: 'low' | 'medium' | 'high';
  issue_type: string;
}

interface Props {
  callId?: string;
  repId?: string;
  autoStart?: boolean;
  scenarioId?: string;
}

const COACH_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  'EmpathyCoach': { icon: <MessageCircle className="w-5 h-5" />, color: 'text-pink-500' },
  'PolicyCoach': { icon: <Shield className="w-5 h-5" />, color: 'text-blue-500' },
  'UpsellCoach': { icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-500' },
  'NewHireCoach': { icon: <UserPlus className="w-5 h-5" />, color: 'text-purple-500' },
  'DeEscalationCoach': { icon: <AlertCircle className="w-5 h-5" />, color: 'text-orange-500' }
};

const SEVERITY_COLORS = {
  low: 'bg-blue-50 border-blue-300 text-blue-900',
  medium: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  high: 'bg-red-50 border-red-300 text-red-900'
};

// Backend API base URL
const API_BASE_URL = 'https://picked-narwhal-trusty.ngrok-free.app';

export default function CoachingChatbot({ callId, repId, autoStart = false, scenarioId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCall, setCurrentCall] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>(scenarioId || 'hotel_overbooking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    if (!repId) return;

    // Use ngrok URL for WebSocket (convert https to wss)
    const wsUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + `/ws/rep/${repId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[CoachingChatbot] WebSocket connected');
      addSystemMessage('Connected to coaching system');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('[CoachingChatbot] Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[CoachingChatbot] WebSocket disconnected');
      addSystemMessage('Disconnected from coaching system');
    };

    return () => {
      ws.close();
    };
  }, [repId]);

  // Auto-start demo
  useEffect(() => {
    if (autoStart && !isRunning) {
      setTimeout(() => runDemo(), 1000);
    }
  }, [autoStart]);

  const handleWebSocketMessage = (data: any) => {
    if (data.event === 'transcript_turn') {
      const turn = data.data;
      addMessage({
        id: `turn_${turn.turn_index}`,
        type: turn.speaker === 'customer' ? 'transcript_customer' : 'transcript_rep',
        speaker: turn.speaker,
        text: turn.text,
        timestamp: new Date(turn.timestamp)
      });
    } else if (data.event === 'coaching_message') {
      const coaching = data.data;
      addMessage({
        id: coaching.session_id,
        type: 'coaching',
        text: coaching.message,
        timestamp: new Date(),
        coaching_data: {
          agent_name: coaching.agent_name,
          title: coaching.title,
          message: coaching.message,
          suggested_responses: coaching.suggested_responses,
          severity: coaching.severity,
          issue_type: coaching.issue_type || 'unknown'
        }
      });
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => {
      // Check if message with this ID already exists to prevent duplicates
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const addSystemMessage = (text: string) => {
    addMessage({
      id: `system_${Date.now()}`,
      type: 'system',
      text,
      timestamp: new Date()
    });
  };

  const runDemo = async (customScenarioId?: string) => {
    setIsRunning(true);
    setMessages([]);
    
    const demoCallId = `demo_${Date.now()}`;
    setCurrentCall(demoCallId);

    // Get scenario
    const scenarioToUse = customScenarioId || selectedScenario;
    const scenario = COACHING_SCENARIOS[scenarioToUse];
    
    if (!scenario) {
      console.error('Scenario not found:', scenarioToUse);
      return;
    }

    addSystemMessage(`🎬 Starting demo: ${scenario.name}`);

    // Use scenario transcript
    const demoTranscript = scenario.transcript;

    try {
      // Register test participants with scenario profile
      await fetch(`${API_BASE_URL}/api/contact-center/reps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rep_id: repId || 'demo_rep',
          name: 'Demo Rep',
          tenure_months: scenario.repProfile.tenure_months,
          skill_level: scenario.repProfile.skill_level,
          vertical_specialty: 'hotel',
          language: 'EN',
          avg_aht_seconds: 420,
          avg_csat: 3.6,
          compliance_score: 72.0,
          upsell_rate: 0.08,
          top_training_needs: scenario.repProfile.top_training_needs
        })
      });

      await fetch(`${API_BASE_URL}/api/contact-center/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: 'demo_customer',
          segment: scenario.customerProfile.segment,
          vertical: 'hotel',
          sentiment_tendency: scenario.customerProfile.sentiment_tendency
        })
      });

      // Start call
      await fetch(`${API_BASE_URL}/api/contact-center/calls/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: demoCallId,
          rep_id: repId || 'demo_rep',
          customer_id: 'demo_customer'
        })
      });

      // Stream transcript turns
      for (let i = 0; i < demoTranscript.length; i++) {
        const turn = demoTranscript[i];
        
        await new Promise(resolve => setTimeout(resolve, turn.delay));

        // Add turn to UI
        addMessage({
          id: `turn_${i}`,
          type: turn.speaker === 'customer' ? 'transcript_customer' : 'transcript_rep',
          speaker: turn.speaker,
          text: turn.text,
          timestamp: new Date()
        });

        // Send to API
        await fetch(`${API_BASE_URL}/api/contact-center/calls/${demoCallId}/turns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turn_index: i,
            speaker: turn.speaker,
            text: turn.text,
            timestamp: new Date().toISOString()
          })
        });

        // Simulate coaching response after error turns
        if (turn.error) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Simulate coaching based on error type
          const coachingMessages: Record<string, CoachingData> = {
            'no_empathy': {
              agent_name: 'EmpathyCoach',
              title: 'Empathy Opportunity Detected',
              message: 'Customer expressed frustration but wasn\'t acknowledged. Try: "I\'m so sorry for the confusion. Let me help you fix this right away."',
              suggested_responses: [
                'I\'m so sorry this happened. Let me make this right for you.',
                'I completely understand how frustrating this must be. I\'m here to help.'
              ],
              severity: 'medium',
              issue_type: 'no_empathy'
            },
            'missing_verification': {
              agent_name: 'PolicyCoach',
              title: 'Verification Required',
              message: 'You accessed the account without verification. Say: "For security, let me first verify your last name and check-in date."',
              suggested_responses: [
                'Before I access your booking, can I verify your last name and check-in date?',
                'For security purposes, let me confirm your account details first.'
              ],
              severity: 'high',
              issue_type: 'missing_verification'
            },
            'policy_violation': {
              agent_name: 'PolicyCoach',
              title: 'Policy Check Required',
              message: 'This refund needs manager approval. Say: "Let me check what I\'m authorized to do under our policy and get you the best solution."',
              suggested_responses: [
                'Let me check our policy to see what options I can offer you.',
                'I want to help you with the best solution. Let me see what I\'m authorized to do.'
              ],
              severity: 'high',
              issue_type: 'policy_violation'
            },
            'missed_upsell': {
              agent_name: 'UpsellCoach',
              title: 'Upsell Opportunity',
              message: 'Customer travels often - loyalty program opportunity. Try: "Since you travel frequently for business, you might benefit from our rewards program."',
              suggested_responses: [
                'Since you travel for business often, would you like to hear about our corporate rewards program?',
                'I can note your preferences for future stays to ensure this doesn\'t happen again.'
              ],
              severity: 'low',
              issue_type: 'missed_upsell'
            }
          };

          const coaching = coachingMessages[turn.error];
          if (coaching) {
            addMessage({
              id: `coaching_${i}`,
              type: 'coaching',
              text: coaching.message,
              timestamp: new Date(),
              coaching_data: coaching
            });
          }
        }
      }

      addSystemMessage('✅ Demo call complete');
      
    } catch (error) {
      console.error('[CoachingChatbot] Error running demo:', error);
      addSystemMessage('❌ Error running demo');
    } finally {
      setIsRunning(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentCall(null);
  };

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    if (isRunning) {
      clearChat();
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Coaching Assistant</h1>
              <p className="text-sm text-slate-500">Real-time guidance for contact center reps</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedScenario}
              onChange={(e) => handleScenarioChange(e.target.value)}
              disabled={isRunning}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {SCENARIO_LIST.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => runDemo()}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isRunning
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                '▶️ Run Demo'
              )}
            </button>
            
            <button
              onClick={clearChat}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-400 mb-2">No active call</h2>
            <p className="text-slate-400 mb-6">Click "Run Demo" to see AI coaching in action</p>
            <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md">
              <h3 className="font-semibold text-slate-900 mb-3">Demo Features:</h3>
              <ul className="text-sm text-slate-600 space-y-2 text-left">
                <li>✅ Real-time error detection</li>
                <li>✅ 5 specialized AI coaches</li>
                <li>✅ Instant actionable feedback</li>
                <li>✅ Context-aware suggestions</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="animate-fadeIn">
            {message.type === 'system' && (
              <div className="flex justify-center">
                <div className="bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm">
                  {message.text}
                </div>
              </div>
            )}

            {message.type === 'transcript_customer' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200 max-w-xl">
                    <div className="text-xs font-semibold text-emerald-600 mb-1">CUSTOMER</div>
                    <p className="text-slate-900">{message.text}</p>
                    <div className="text-xs text-slate-400 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {message.type === 'transcript_rep' && (
              <div className="flex items-start gap-3 justify-end">
                <div className="flex-1 flex justify-end">
                  <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm max-w-xl">
                    <div className="text-xs font-semibold opacity-80 mb-1">YOU (REP)</div>
                    <p>{message.text}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            )}

            {message.type === 'coaching' && message.coaching_data && (
              <div className="flex items-start gap-3 my-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 max-w-2xl">
                  <div className={`rounded-2xl rounded-tl-none p-5 shadow-lg border-2 ${
                    SEVERITY_COLORS[message.coaching_data.severity]
                  }`}>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={COACH_ICONS[message.coaching_data.agent_name]?.color || 'text-purple-500'}>
                        {COACH_ICONS[message.coaching_data.agent_name]?.icon || <Bot className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide opacity-70">
                          AI COACH
                        </div>
                        <div className="font-bold text-sm">
                          {message.coaching_data.agent_name}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          message.coaching_data.severity === 'high' ? 'bg-red-200' :
                          message.coaching_data.severity === 'medium' ? 'bg-yellow-200' :
                          'bg-blue-200'
                        }`}>
                          {message.coaching_data.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="font-semibold text-base mb-2">
                      {message.coaching_data.title}
                    </div>

                    {/* Message */}
                    <p className="text-sm leading-relaxed mb-3">
                      {message.coaching_data.message}
                    </p>

                    {/* Suggested Responses */}
                    {message.coaching_data.suggested_responses && message.coaching_data.suggested_responses.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wide opacity-70">
                          TRY SAYING:
                        </div>
                        {message.coaching_data.suggested_responses.map((response, idx) => (
                          <div
                            key={idx}
                            className="bg-white/70 border border-slate-300 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-white hover:border-slate-400 transition-colors"
                          >
                            "{response}"
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs opacity-60 mt-3">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
