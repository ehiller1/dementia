/**
 * Rep Console Component
 * Shows live call transcript + real-time AI coaching popup
 * Reuses existing WebSocket infrastructure from quest-agent-forge
 */

import React, { useEffect, useState, useRef } from 'react';
import { Bot, Zap, X, AlertCircle, TrendingUp, Shield, UserPlus, MessageCircle } from 'lucide-react';

// Types
interface TranscriptTurn {
  turn_index: number;
  speaker: 'customer' | 'rep';
  text: string;
  timestamp: string;
}

interface CoachingMessage {
  session_id: string;
  call_id: string;
  rep_id: string;
  issue_id: string;
  agent_name: string;
  title: string;
  message: string;
  suggested_responses?: string[];
  micro_exercise?: string;
  severity: 'low' | 'medium' | 'high';
}

interface RepProfile {
  rep_id: string;
  name: string;
  skill_level: string;
  avg_csat: number;
  compliance_score: number;
  upsell_rate: number;
}

interface Props {
  repId: string;
  callId?: string;
}

const COACH_ICONS: Record<string, React.ReactNode> = {
  'EmpathyCoach': <MessageCircle className="w-5 h-5 text-pink-500" />,
  'PolicyCoach': <Shield className="w-5 h-5 text-blue-500" />,
  'UpsellCoach': <TrendingUp className="w-5 h-5 text-green-500" />,
  'NewHireCoach': <UserPlus className="w-5 h-5 text-purple-500" />,
  'DeEscalationCoach': <AlertCircle className="w-5 h-5 text-orange-500" />
};

const SEVERITY_COLORS = {
  low: 'bg-blue-50 border-blue-200',
  medium: 'bg-yellow-50 border-yellow-200',
  high: 'bg-red-50 border-red-200'
};

export default function RepConsole({ repId, callId }: Props) {
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [coaching, setCoaching] = useState<CoachingMessage | null>(null);
  const [repProfile, setRepProfile] = useState<RepProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/rep/${repId}`;

    console.log('[RepConsole] Connecting to:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[RepConsole] Connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('[RepConsole] Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[RepConsole] WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('[RepConsole] Disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [repId]);

  // Load rep profile
  useEffect(() => {
    loadRepProfile();
  }, [repId]);

  const loadRepProfile = async () => {
    try {
      const response = await fetch(`/api/contact-center/reps/${repId}`);
      if (response.ok) {
        const data = await response.json();
        setRepProfile(data);
      }
    } catch (error) {
      console.error('[RepConsole] Error loading rep profile:', error);
    }
  };

  const handleMessage = (message: any) => {
    switch (message.event) {
      case 'transcript_turn':
        setTranscript(prev => [...prev, message.data]);
        break;
      
      case 'coaching_message':
        setCoaching(message.data);
        // Auto-dismiss after 30 seconds if not manually dismissed
        setTimeout(() => {
          setCoaching(prev => 
            prev?.session_id === message.data.session_id ? null : prev
          );
        }, 30000);
        break;
      
      case 'rep_profile_updated':
        setRepProfile(message.data);
        break;
      
      default:
        console.log('[RepConsole] Unknown event:', message.event);
    }
  };

  const dismissCoaching = () => {
    setCoaching(null);
  };

  const useScript = (script: string) => {
    // In production, this could copy to clipboard or inject into call software
    navigator.clipboard?.writeText(script);
    console.log('[RepConsole] Script copied:', script);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left: Live Transcript */}
      <div className="w-2/3 p-6 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-500" />
            Live Call Transcript
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {callId && (
          <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            Call ID: <span className="font-mono">{callId}</span>
          </div>
        )}

        <div className="space-y-3">
          {transcript.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Waiting for call to start...</p>
            </div>
          ) : (
            transcript.map((turn, idx) => (
              <div
                key={idx}
                className={`flex ${turn.speaker === 'rep' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${
                    turn.speaker === 'rep'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase opacity-70">
                      {turn.speaker === 'rep' ? 'You' : 'Customer'}
                    </span>
                    <span className="text-xs opacity-50">
                      {new Date(turn.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{turn.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Right: Rep Snapshot + Coaching */}
      <div className="w-1/3 p-6 border-l border-slate-200 bg-white relative overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Rep Snapshot</h2>
        
        {repProfile ? (
          <div className="space-y-3 mb-6">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 uppercase mb-1">Name</div>
              <div className="font-semibold">{repProfile.name}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase mb-1">Skill Level</div>
                <div className="font-semibold capitalize">{repProfile.skill_level}</div>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase mb-1">Avg CSAT</div>
                <div className="font-semibold">{repProfile.avg_csat.toFixed(2)} / 5.0</div>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase mb-1">Compliance</div>
                <div className="font-semibold">{repProfile.compliance_score.toFixed(1)}%</div>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase mb-1">Upsell Rate</div>
                <div className="font-semibold">{(repProfile.upsell_rate * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse space-y-3 mb-6">
            <div className="h-16 bg-slate-200 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-slate-200 rounded-lg" />
              <div className="h-16 bg-slate-200 rounded-lg" />
              <div className="h-16 bg-slate-200 rounded-lg" />
              <div className="h-16 bg-slate-200 rounded-lg" />
            </div>
          </div>
        )}

        {/* Coaching Popup */}
        {coaching && (
          <div
            className={`fixed bottom-6 right-6 w-96 shadow-2xl rounded-2xl p-5 border-2 transition-all ${
              SEVERITY_COLORS[coaching.severity]
            }`}
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {COACH_ICONS[coaching.agent_name] || <Zap className="w-5 h-5 text-blue-500" />}
                <div>
                  <div className="text-xs text-slate-500 uppercase">AI Coach</div>
                  <div className="font-semibold text-slate-900">{coaching.agent_name}</div>
                </div>
              </div>
              <button
                onClick={dismissCoaching}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-slate-900 mb-2">
                {coaching.title}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {coaching.message}
              </p>
            </div>

            {coaching.suggested_responses && coaching.suggested_responses.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 uppercase font-semibold">
                  Try saying:
                </div>
                {coaching.suggested_responses.map((script, idx) => (
                  <button
                    key={idx}
                    onClick={() => useScript(script)}
                    className="w-full text-left text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  >
                    "{script}"
                  </button>
                ))}
              </div>
            )}

            {coaching.micro_exercise && (
              <div className="mt-3 p-3 bg-white/50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
                  After this call:
                </div>
                <p className="text-xs text-slate-700">{coaching.micro_exercise}</p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase ${
                coaching.severity === 'high' ? 'text-red-600' :
                coaching.severity === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {coaching.severity} priority
              </span>
              <button
                onClick={dismissCoaching}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                Got it ✓
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

