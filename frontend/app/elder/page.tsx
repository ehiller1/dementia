'use client';

/**
 * MVP ELDER INTERFACE - Daily Ritual Mode
 * 
 * ONE BUTTON: "Start My Visit"
 * - Large, simple, voice-first
 * - Fixed duration (10 min)
 * - Natural ending ("I'm tired")
 * - No complex features
 */

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function ElderInterface() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  
  // Start today's ritual
  const startRitual = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/mvp/patients/1/start-ritual', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      setSessionId(data.id);
      setIsSessionActive(true);
      setTimeRemaining(600); // Reset to 10 minutes
      
      // Start with greeting
      const greeting = getGreeting(data.ritual_type, data.ritual_context);
      speakMessage(greeting);
      setMessages([{role: 'assistant', content: greeting}]);
      
    } catch (error) {
      console.error('Error starting ritual:', error);
    }
  };
  
  // Get appropriate greeting based on ritual type
  const getGreeting = (ritualType: string, context: any) => {
    switch(ritualType) {
      case 'good_morning':
        return `Good morning! How lovely to see you today. It's ${context.day_of_week}, ${context.date}.`;
      case 'memory_seed':
        return `Hello! It's so good to see you. I was thinking about ${context.memory_name} today.`;
      case 'gentle_reflection':
        return `Hello! How are you doing today?`;
      default:
        return `Hello! It's wonderful to see you.`;
    }
  };
  
  // Text-to-speech
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slow pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsListening(true); // Auto-start listening after speaking
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // End session (naturally or by user)
  const endSession = async (endedByUser: boolean = false) => {
    if (!sessionId) return;
    
    // Determine mood tag (simple heuristic based on duration)
    const duration = 600 - timeRemaining;
    let moodTag = 'calm';
    if (duration < 120) moodTag = 'tired'; // Ended very quickly
    if (duration > 480) moodTag = 'engaged'; // Stayed for most of session
    
    try {
      await fetch(`http://localhost:8000/api/mvp/ritual-sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood_tag: moodTag,
          ended_by_user: endedByUser,
          summary: `Session lasted ${Math.floor(duration / 60)} minutes. ${messages.length} exchanges.`
        })
      });
      
      // Farewell message
      const farewell = "It's been so nice visiting with you. I'll see you tomorrow.";
      speakMessage(farewell);
      
      setIsSessionActive(false);
      setSessionId(null);
      setMessages([]);
      
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };
  
  // Timer countdown
  useEffect(() => {
    if (!isSessionActive) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endSession(false); // Natural ending
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isSessionActive]);
  
  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8 large-text">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            Welcome
          </h1>
          <p className="text-3xl text-gray-600">
            {isSessionActive ? "I'm glad you're here" : "Ready for today's visit?"}
          </p>
        </div>
        
        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          
          {!isSessionActive ? (
            /* ONE BUTTON: Start My Visit */
            <div className="text-center">
              <button
                onClick={startRitual}
                className="bg-blue-500 hover:bg-blue-600 text-white text-5xl font-bold py-16 px-24 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200"
              >
                Start My Visit
              </button>
              <p className="text-2xl text-gray-500 mt-8">
                Just 10 minutes of friendly conversation
              </p>
            </div>
          ) : (
            /* Active Session UI */
            <div className="space-y-8">
              
              {/* Time Remaining */}
              <div className="text-center">
                <div className="text-8xl font-bold text-blue-600 mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-2xl text-gray-600">minutes remaining</p>
              </div>
              
              {/* Conversation Display */}
              <div className="bg-gray-50 rounded-2xl p-8 h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-3xl mt-20">
                    Conversation will appear here...
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-6 rounded-2xl ${
                          msg.role === 'assistant'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-green-100 text-green-900'
                        }`}
                      >
                        <p className="text-3xl leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Status Indicators */}
              <div className="flex justify-center items-center gap-8">
                {isSpeaking && (
                  <div className="flex items-center gap-3 text-blue-600">
                    <Volume2 className="w-12 h-12 animate-pulse" />
                    <span className="text-2xl font-medium">Speaking...</span>
                  </div>
                )}
                
                {isListening && !isSpeaking && (
                  <div className="flex items-center gap-3 text-green-600">
                    <Mic className="w-12 h-12 animate-pulse" />
                    <span className="text-2xl font-medium">Listening...</span>
                  </div>
                )}
              </div>
              
              {/* End Visit Button */}
              <div className="text-center mt-8">
                <button
                  onClick={() => endSession(true)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-4xl font-bold py-8 px-16 rounded-full"
                >
                  I'm Tired
                </button>
                <p className="text-xl text-gray-500 mt-4">
                  You can stop anytime
                </p>
              </div>
              
            </div>
          )}
          
        </div>
        
        {/* Footer - Simple Navigation */}
        {!isSessionActive && (
          <div className="text-center mt-8">
            <a
              href="/"
              className="text-2xl text-blue-600 hover:underline"
            >
              ← Back to Home
            </a>
          </div>
        )}
        
      </div>
    </div>
  );
}
