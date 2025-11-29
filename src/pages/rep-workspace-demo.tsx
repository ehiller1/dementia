/**
 * Rep Workspace Demo
 * Shows realistic call center UI with AI coaching overlay
 * This is the full demo experience showing coaching in context
 */

import React, { useState, useEffect, useRef } from 'react';
import CallCenterRepUI from './CallCenterRepUI';
import { Bot, X, Maximize2, Minimize2, MessageSquare, RefreshCw, User, Zap, AlertCircle, MessageCircle, Shield, TrendingUp, UserPlus } from 'lucide-react';
import { COACHING_SCENARIOS, SCENARIO_LIST, type Scenario } from '@/data/coaching-scenarios';

interface CoachingMessage {
  id: string;
  agent_name: string;
  title: string;
  message: string;
  suggested_responses?: string[];
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  turn_index?: number;  // Turn index that triggered this coaching
}

interface ChatMessage {
  id: string;
  type: 'transcript_customer' | 'transcript_rep' | 'coaching' | 'system';
  speaker?: string;
  text: string;
  timestamp: Date;
  call_id?: string;
  turn_index?: number;  // Turn index for proper ordering (transcript turns and coaching messages)
  coaching_data?: {
    agent_name: string;
    title: string;
    message: string;
    suggested_responses?: string[];
    severity: string;
    issue_type?: string;
    detected_at_turn?: number;
  };
}

// Backend API base URL
const API_BASE_URL = 'https://picked-narwhal-trusty.ngrok-free.app';

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

export default function RepWorkspaceDemo() {
  const [coachingMessages, setCoachingMessages] = useState<CoachingMessage[]>([]);
  const [coachingMinimized, setCoachingMinimized] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Coaching chatbot state
  const [isRunning, setIsRunning] = useState(false);
  const [currentCall, setCurrentCall] = useState<string | null>(null);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState<number>(0);
  const [callOrder, setCallOrder] = useState<string[]>([]);
  const [callMeta, setCallMeta] = useState<Record<string, { scenarioIndex: number; scenarioName: string }>>({});
  const [repName, setRepName] = useState<string>('Demo Rep');
  const [questionInput, setQuestionInput] = useState<string>('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Demo rep ID - in production this would come from auth/session
  const repId = 'demo_rep_1';
  const callId = 'demo_call_1';

  // WebSocket connection for real-time coaching
  useEffect(() => {
    if (!repId) return;

    // Prefer explicit backend URL if provided
    const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
    const wsBase = (import.meta as any)?.env?.VITE_WS_URL || '';

    let wsUrl = '';
    if (wsBase) {
      // Explicit WS base provided
      wsUrl = wsBase.replace(/^http/, 'ws').replace(/\/+$/, '') + `/ws/rep/${repId}`;
    } else if (apiBase) {
      // Convert http(s) API base to ws(s)
      wsUrl = apiBase.replace(/^http/, 'ws').replace(/\/+$/, '') + `/ws/rep/${repId}`;
    } else {
      // Default to ngrok backend for production deployments
      const defaultHttpsBase = 'https://picked-narwhal-trusty.ngrok-free.app';
      wsUrl = defaultHttpsBase.replace(/^http/, 'ws').replace(/\/+$/, '') + `/ws/rep/${repId}`;
    }

    console.log(`[RepWorkspaceDemo] Connecting to WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[RepWorkspaceDemo] ✅ WebSocket connected to:', wsUrl);
      setWsConnected(true);
      addChatMessage({
        id: 'system_connected',
        type: 'system',
        text: 'Connected to coaching system',
        timestamp: new Date()
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[RepWorkspaceDemo] 📨 Received message:', data.event || 'unknown');
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('[RepWorkspaceDemo] Error parsing message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('[RepWorkspaceDemo] ❌ WebSocket disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setWsConnected(false);
      addChatMessage({
        id: 'system_disconnected',
        type: 'system',
        text: `Disconnected from coaching system (code: ${event.code})`,
        timestamp: new Date()
      });
    };

    ws.onerror = (error) => {
      console.error('[RepWorkspaceDemo] ❌ WebSocket error:', error);
      console.error('[RepWorkspaceDemo] Failed to connect to:', wsUrl);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [repId]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Fetch rep name from backend
  useEffect(() => {
    const fetchRepName = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contact-center/reps/${repId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.name) {
            setRepName(data.name);
          }
        }
      } catch (error) {
        console.error('[RepWorkspaceDemo] Error fetching rep name:', error);
      }
    };
    fetchRepName();
  }, [repId]);

  // Auto-start scenarios sequentially when component mounts
  useEffect(() => {
    // Small delay to ensure WebSocket is connected
    const timer = setTimeout(() => {
      if (!isRunning && currentScenarioIndex === 0) {
        runAllScenariosSequentially();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleWebSocketMessage = (data: any) => {
    if (data.event === 'transcript_turn') {
      const turn = data.data;
      // Include call_id in ID to make it unique across different calls/scenarios
      // Use a consistent ID format that matches what we might send manually
      const callId = turn.call_id || currentCall || 'unknown';
      // Track call order if new
      setCallOrder(prev => (callId && !prev.includes(callId) ? [...prev, callId] : prev));
      const chatMsg: ChatMessage = {
        id: `call_${callId}_turn_${turn.turn_index}`,
        type: turn.speaker === 'customer' ? 'transcript_customer' : 'transcript_rep',
        speaker: turn.speaker,
        text: turn.text,
        timestamp: new Date(turn.timestamp),
        call_id: callId,
        turn_index: turn.turn_index  // Store turn index for matching with coaching
      };
      addChatMessage(chatMsg);
    } else if (data.event === 'coaching_message') {
      const coaching = data.data;
      
      // Include call_id in ID to make it unique across different calls/scenarios
      const callId = coaching.call_id || currentCall || 'unknown';
      // Track call order if new
      setCallOrder(prev => (callId && !prev.includes(callId) ? [...prev, callId] : prev));
      
      // Add to chat - include turn_index for proper ordering
      const chatMsg: ChatMessage = {
        id: coaching.session_id || `call_${callId}_coaching_${coaching.detected_at_turn}_${Date.now()}`,
        type: 'coaching',
        text: coaching.message,
        timestamp: new Date(),
        call_id: callId,
        turn_index: coaching.detected_at_turn,  // Link to the turn that triggered this coaching
        coaching_data: {
          agent_name: coaching.agent_name,
          title: coaching.title,
          message: coaching.message,
          suggested_responses: coaching.suggested_responses,
          severity: coaching.severity,
          issue_type: coaching.issue_type,
          detected_at_turn: coaching.detected_at_turn
        }
      };
      addChatMessage(chatMsg);

      // Add to coaching overlay
      const coachingMsg: CoachingMessage = {
        id: coaching.session_id || `coaching_${Date.now()}`,
        agent_name: coaching.agent_name,
        title: coaching.title,
        message: coaching.message,
        suggested_responses: coaching.suggested_responses,
        severity: (coaching.severity || 'medium') as 'low' | 'medium' | 'high',
        timestamp: new Date(),
        turn_index: coaching.detected_at_turn  // Store turn index
      };
      setCoachingMessages(prev => [...prev, coachingMsg]);
    }
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => {
      // Check if message with this ID already exists to prevent duplicates
      const existsById = prev.some(msg => msg.id === message.id);
      if (existsById) {
        return prev;
      }
      
      // Also check for duplicates by content and turn_index (for transcript messages)
      // This prevents duplicates when manual addition and WebSocket use different IDs
      if (message.type === 'transcript_customer' || message.type === 'transcript_rep') {
        const existsByContent = prev.some(msg => 
          msg.type === message.type &&
          msg.text === message.text &&
          msg.turn_index === message.turn_index &&
          msg.speaker === message.speaker &&
          msg.call_id === message.call_id
        );
        if (existsByContent) {
          return prev;
        }
      }
      
      return [...prev, message];
    });
  };

  const addSystemMessage = (text: string) => {
    addChatMessage({
      id: `system_${Date.now()}`,
      type: 'system',
      text,
      timestamp: new Date()
    });
  };

  const runAllScenariosSequentially = async () => {
    setIsRunning(true);
    setChatMessages([]);
    setCurrentScenarioIndex(0);

    // Run all scenarios in sequence
    for (let i = 0; i < SCENARIO_LIST.length; i++) {
      setCurrentScenarioIndex(i);
      const scenario = COACHING_SCENARIOS[SCENARIO_LIST[i].id];
      
      if (!scenario) {
        console.error('Scenario not found:', SCENARIO_LIST[i].id);
        continue;
      }

      addSystemMessage(`🎬 Starting scenario ${i + 1}/${SCENARIO_LIST.length}: ${scenario.name}`);
      
      await runSingleScenario(scenario, i);
      
      // Wait between scenarios (except after the last one)
      if (i < SCENARIO_LIST.length - 1) {
        addSystemMessage('⏸️ Pausing before next scenario...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    addSystemMessage('✅ All scenarios complete');
    setIsRunning(false);
    setCurrentScenarioIndex(0);
  };

  const runSingleScenario = async (scenario: Scenario, scenarioIndex: number) => {
    const demoCallId = `demo_${Date.now()}_${scenarioIndex}`;
    setCurrentCall(demoCallId);
    setCallOrder(prev => (!prev.includes(demoCallId) ? [...prev, demoCallId] : prev));
    setCallMeta(prev => ({
      ...prev,
      [demoCallId]: { scenarioIndex, scenarioName: scenario.name }
    }));

    // Use scenario transcript
    const demoTranscript = scenario.transcript;

    try {
      // Register test participants with scenario profile
      await fetch(`${API_BASE_URL}/api/contact-center/reps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rep_id: repId || 'demo_rep',
          name: repName, // Use actual rep name
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

        // Send to API - the backend will broadcast via WebSocket, so we don't manually add here
        // This prevents duplicate messages (manual + WebSocket)
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
          const coachingMessages: Record<string, any> = {
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
            },
            'escalation_risk': {
              agent_name: 'DeEscalationCoach',
              title: 'Escalation Risk Detected',
              message: 'Customer is showing signs of escalation. Use empathetic language and focus on solutions. Try: "I understand this is frustrating. Let me see what I can do to help resolve this for you right away."',
              suggested_responses: [
                'I understand this is frustrating. Let me see what I can do to help resolve this for you right away.',
                'I want to make this right. Let me work on finding the best solution for you.'
              ],
              severity: 'high',
              issue_type: 'escalation_risk'
            },
            'script_noncompliance': {
              agent_name: 'NewHireCoach',
              title: 'Script Guidance',
              message: 'Follow the standard greeting and discovery process. Use: "Thank you for calling. I\'d be happy to help you with that. Let me gather some information first."',
              suggested_responses: [
                'Thank you for calling. I\'d be happy to help you with that. Let me gather some information first.',
                'I can help you with that. To get started, may I have your [relevant information]?'
              ],
              severity: 'low',
              issue_type: 'script_noncompliance'
            }
          };

          const coaching = coachingMessages[turn.error];
          if (coaching) {
            addChatMessage({
              id: `scenario_${scenarioIndex}_coaching_${i}`,
              type: 'coaching',
              text: coaching.message,
              timestamp: new Date(),
              turn_index: i,
              coaching_data: coaching
            });
          }
        }
      }

      // Scenario complete - don't set isRunning to false here, let runAllScenariosSequentially handle it
    } catch (error) {
      console.error('[RepWorkspaceDemo] Error running scenario:', error);
      addSystemMessage('❌ Error running scenario');
    }
  };

  const handleAskQuestion = async () => {
    if (!questionInput.trim() || isAskingQuestion) return;

    const question = questionInput.trim();
    setQuestionInput('');
    setIsAskingQuestion(true);

    // Add user question to chat
    addChatMessage({
      id: `question_${Date.now()}`,
      type: 'system',
      text: `Question: ${question}`,
      timestamp: new Date()
    });

    try {
      // Get phone conversation transcript (only rep and customer messages)
      const phoneConversation = chatMessages
        .filter(msg => msg.type === 'transcript_rep' || msg.type === 'transcript_customer')
        .sort((a, b) => {
          // Sort by turn_index if available, otherwise by timestamp
          if (a.turn_index !== undefined && b.turn_index !== undefined) {
            return a.turn_index - b.turn_index;
          }
          if (a.turn_index !== undefined) return -1;
          if (b.turn_index !== undefined) return 1;
          return a.timestamp.getTime() - b.timestamp.getTime();
        })
        .map(msg => `${msg.speaker === 'customer' ? 'Customer' : 'Rep'}: ${msg.text}`)
        .join('\n');

      // Get latest coaching recommendation
      const latestCoaching = chatMessages
        .filter(msg => msg.type === 'coaching' && msg.coaching_data)
        .sort((a, b) => {
          // Sort by turn_index if available, otherwise by timestamp
          if (a.turn_index !== undefined && b.turn_index !== undefined) {
            return a.turn_index - b.turn_index;
          }
          if (a.turn_index !== undefined) return -1;
          if (b.turn_index !== undefined) return 1;
          return a.timestamp.getTime() - b.timestamp.getTime();
        })
        .slice(-1)[0];

      const coachRecommendation = latestCoaching?.coaching_data?.message || 'No coaching recommendation available';

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/api/contact-center/coaching/ask-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_conversation: phoneConversation,
          coach_recommendation: coachRecommendation,
          user_question: question
        })
      });

      if (response.ok) {
        const data = await response.json();
        addChatMessage({
          id: `answer_${Date.now()}`,
          type: 'coaching',
          text: data.answer || 'No answer received',
          timestamp: new Date(),
          coaching_data: {
            agent_name: 'CoachingAssistant',
            title: 'Answer to your question',
            message: data.answer || 'No answer received',
            severity: 'low',
            issue_type: 'question'
          }
        });
      } else {
        addChatMessage({
          id: `error_${Date.now()}`,
          type: 'system',
          text: 'Error: Could not get answer to your question',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('[RepWorkspaceDemo] Error asking question:', error);
      addChatMessage({
        id: `error_${Date.now()}`,
        type: 'system',
        text: 'Error: Could not get answer to your question',
        timestamp: new Date()
      });
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleCallStateChange = (state: any) => {
    if (state.active && !callActive) {
      // Call just started
      setCallActive(true);
      setCoachingMessages([]);
      setChatMessages([]);
      addChatMessage({
        id: 'call_started',
        type: 'system',
        text: 'Call started - AI coaching is active',
        timestamp: new Date()
      });
    } else if (!state.active && callActive) {
      // Call ended
      setCallActive(false);
      addChatMessage({
        id: 'call_ended',
        type: 'system',
        text: 'Call ended',
        timestamp: new Date()
      });
    }
  };

  const dismissMessage = (id: string) => {
    setCoachingMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-300';
      case 'medium': return 'bg-yellow-50 border-yellow-300';
      case 'low': return 'bg-blue-50 border-blue-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-200 text-red-900';
      case 'medium': return 'bg-yellow-200 text-yellow-900';
      case 'low': return 'bg-blue-200 text-blue-900';
      default: return 'bg-gray-200 text-gray-900';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'transcript_customer': return 'bg-blue-50 border-blue-200';
      case 'transcript_rep': return 'bg-green-50 border-green-200';
      case 'coaching': return 'bg-purple-50 border-purple-300';
      case 'system': return 'bg-gray-50 border-gray-200';
      default: return 'bg-white border-gray-200';
    }
  };

  // Include all messages (transcript + coaching) and sort by turn_index for proper ordering
  // Coaching messages should appear right after the turn that triggered them
  const sortedMessages = [...chatMessages].sort((a, b) => {
    // First group by call order (scenario order)
    const aOrder = a.call_id ? callOrder.indexOf(a.call_id) : -1;
    const bOrder = b.call_id ? callOrder.indexOf(b.call_id) : -1;
    if (aOrder !== bOrder) {
      // Unknown call_ids go last
      const aRank = aOrder === -1 ? Number.MAX_SAFE_INTEGER : aOrder;
      const bRank = bOrder === -1 ? Number.MAX_SAFE_INTEGER : bOrder;
      return aRank - bRank;
    }
    // Within the same call, sort by turn_index if available, otherwise timestamp
    if (a.turn_index !== undefined && b.turn_index !== undefined) {
      // If turn_index is the same, coaching comes after transcript
      if (a.turn_index === b.turn_index) {
        if (a.type === 'coaching' && b.type !== 'coaching') return 1;
        if (a.type !== 'coaching' && b.type === 'coaching') return -1;
      }
      return a.turn_index - b.turn_index;
    }
    if (a.turn_index !== undefined) return -1;
    if (b.turn_index !== undefined) return 1;
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  // Filter messages for chatbot display - only show transcript (customer/rep)
  // (System messages are not shown here; scenario headers are rendered per-call below)
  const transcriptMessages = sortedMessages.filter(msg => 
    msg.type === 'transcript_customer' || 
    msg.type === 'transcript_rep'
  );

  const navBarHeight = 64; // Navigation bar height (pt-16 = 4rem = 64px)
  const chatHeight = chatMinimized ? 0 : 384; // h-96 = 384px (24rem)
  const totalTopOffset = navBarHeight + chatHeight;

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden" style={{ marginTop: '-4rem' }}>
      {/* Coaching Chatbot Interface - Fixed below Navigation Bar */}
      <div 
        className={`transition-all duration-300 ease-in-out border-b border-gray-200 shadow-md bg-white z-30 ${
          chatMinimized 
            ? 'h-0 overflow-hidden' 
            : 'h-96 flex-shrink-0'
        }`}
        style={{ position: 'fixed', top: `${navBarHeight}px`, left: 0, right: 0 }}
      >
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Coaching Chatbot Header */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AI Coaching Assistant</h2>
                  <p className="text-xs text-slate-500">Real-time guidance for contact center reps</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isRunning && (
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                    Scenario {currentScenarioIndex + 1}/{SCENARIO_LIST.length}
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setChatMessages([]);
                    setCurrentCall(null);
                    setCurrentScenarioIndex(0);
                    setIsRunning(false);
                  }}
                  disabled={isRunning}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🗑️ Clear
                </button>
                
                <button
                  onClick={() => setChatMinimized(true)}
                  className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                  title="Hide chatbot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area - Grouped by scenario (call) with header per scenario */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {callOrder.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-semibold text-slate-400 mb-1">No active call</h3>
                <p className="text-xs text-slate-400">Waiting for call to start...</p>
              </div>
            ) : (
              <>
                {callOrder.map((cid) => {
                  const meta = callMeta[cid];
                  const title = meta ? `🎬 Scenario ${meta.scenarioIndex + 1}/${SCENARIO_LIST.length}: ${meta.scenarioName}` : `🎬 Scenario`;
                  const callMsgs = transcriptMessages.filter(m => m.call_id === cid);
                  return (
                    <div key={cid} className="space-y-2">
                      {/* Scenario Header */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mt-2">
                        <span className="px-2 py-1 rounded bg-slate-200">{title}</span>
                      </div>
                      {/* Call Transcript */}
                      {callMsgs.length === 0 ? (
                        <div className="text-xs text-slate-400 px-2">Waiting for transcript...</div>
                      ) : (
                        callMsgs.map((msg) => (
                          <div key={msg.id} className="animate-fadeIn">
                            {msg.type === 'transcript_customer' && (
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-slate-200 max-w-md">
                                    <div className="text-xs font-semibold text-emerald-600 mb-0.5">CUSTOMER</div>
                                    <p className="text-sm text-slate-900">{msg.text}</p>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                      {msg.timestamp.toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.type === 'transcript_rep' && (
                              <div className="flex items-start gap-2 justify-end">
                                <div className="flex-1 flex justify-end">
                                  <div className="bg-blue-500 text-white rounded-xl rounded-tr-none px-3 py-2 shadow-sm max-w-md">
                                    <div className="text-xs font-semibold opacity-80 mb-0.5">YOU (REP)</div>
                                    <p className="text-sm">{msg.text}</p>
                                    <div className="text-xs opacity-70 mt-0.5">
                                      {msg.timestamp.toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Question Input Area */}
          <div className="border-t border-slate-200 bg-white px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                  }
                }}
                placeholder="Ask a question about the coaching..."
                disabled={isAskingQuestion || chatMessages.filter(msg => msg.type === 'coaching').length === 0}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleAskQuestion}
                disabled={!questionInput.trim() || isAskingQuestion || chatMessages.filter(msg => msg.type === 'coaching').length === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !questionInput.trim() || isAskingQuestion || chatMessages.filter(msg => msg.type === 'coaching').length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isAskingQuestion ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
                    Asking...
                  </>
                ) : (
                  'Ask'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Call Center UI */}
      <div 
        className="flex-1 flex flex-col overflow-hidden"
        style={{ marginTop: `${totalTopOffset}px`, height: `calc(100vh - ${totalTopOffset}px)` }}
      >
      <CallCenterRepUI 
        onCallStateChange={handleCallStateChange}
        autoStartCall={true}
          topOffset={0}
        />
      </div>

      {/* Chat Toggle Button (when minimized) - Top Right */}
      {chatMinimized && (
        <button
          onClick={() => setChatMinimized(false)}
          className="fixed top-20 right-6 z-50 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
          title="Show transcript"
        >
          <MessageSquare className="w-5 h-5" />
          {transcriptMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
              {transcriptMessages.length}
            </span>
          )}
          {wsConnected && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-300 rounded-full border-2 border-white"></span>
          )}
        </button>
      )}

      {/* AI Coaching Overlay */}
      {coachingMessages.length > 0 && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          coachingMinimized ? 'w-16 h-16' : 'w-96 max-h-[80vh]'
        }`}>
          {coachingMinimized ? (
            /* Minimized State */
            <button
              onClick={() => setCoachingMinimized(false)}
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow relative"
            >
              <Bot className="w-8 h-8 text-white" />
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                {coachingMessages.length}
              </span>
            </button>
          ) : (
            /* Expanded State */
            <div className="bg-white rounded-lg shadow-2xl border-2 border-purple-200 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6" />
                  <div>
                    <div className="font-bold">AI Coaching</div>
                    <div className="text-xs opacity-90">{coachingMessages.length} active tips</div>
                  </div>
                </div>
                <button
                  onClick={() => setCoachingMinimized(true)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(80vh-80px)]">
                {coachingMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`border-2 rounded-lg p-4 ${getSeverityColor(msg.severity)} animate-slideIn`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-sm text-gray-900">{msg.agent_name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityBadge(msg.severity)}`}>
                            {msg.severity.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{msg.title}</h3>
                      </div>
                      <button
                        onClick={() => dismissMessage(msg.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-700 mb-3">{msg.message}</p>

                    {/* Suggested Responses */}
                    {msg.suggested_responses && msg.suggested_responses.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-600 uppercase">Try Saying:</div>
                        {msg.suggested_responses.map((response, idx) => (
                          <div
                            key={idx}
                            className="bg-white/70 border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer hover:bg-white hover:border-purple-400 transition-colors"
                          >
                            "{response}"
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demo Instructions Overlay (dismissible) */}
      {!callActive && (
        <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg z-40 max-w-2xl">
          <div className="flex items-start gap-3">
            <Bot className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-1">AI Coaching Demo Ready</h3>
              <p className="text-sm opacity-90">
                A call will start automatically. Watch the transcript at the top for real-time customer and rep messages. 
                AI coaching tips appear in the bottom-right corner overlay. The system detects issues in real-time and provides actionable guidance.
              </p>
              {!wsConnected && (
                <p className="text-xs mt-2 opacity-75">
                  ⚠️ Connecting to coaching system... Make sure the backend is running.
                </p>
              )}
              {chatMinimized && (
                <p className="text-xs mt-2 opacity-75">
                  💡 Click the transcript button in the top-right to view the call transcript.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </div>
  );
}
