'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, Settings, Home } from 'lucide-react'
import Link from 'next/link'

export default function PatientInterface() {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Array<{role: string, content: string, timestamp: Date}>>([])
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [textInput, setTextInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Large, accessible design for dementia patients
  const largeTextClass = "text-2xl"
  const extraLargeTextClass = "text-3xl"

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startConversation = () => {
    // In a real implementation, this would connect to WebSocket
    // const ws = new WebSocket('ws://localhost:8000/ws/conversation/1')
    
    // Simulate welcome message
    setMessages([{
      role: 'assistant',
      content: 'Hello! I\'m here to chat with you. How are you feeling today?',
      timestamp: new Date()
    }])
  }

  const handleSendMessage = () => {
    if (!textInput.trim()) return

    const userMessage = {
      role: 'user',
      content: textInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Simulate AI response (in real app, this would be via WebSocket)
    setTimeout(() => {
      const responses = [
        'That\'s wonderful to hear. Tell me more about that.',
        'I understand. How does that make you feel?',
        'That sounds interesting. What happened next?',
        'Thank you for sharing that with me.',
      ]
      
      const assistantMessage = {
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)

    setTextInput('')
  }

  const speakMessage = (text: string) => {
    // Text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85 // Slower for dementia patients
      utterance.pitch = 1
      utterance.volume = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8 large-text">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <Home className="w-8 h-8" />
            <span className={largeTextClass}>Home</span>
          </Link>
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-700">
            <Settings className="w-8 h-8" />
            <span className={largeTextClass}>Settings</span>
          </button>
        </div>
        
        <h1 className="text-5xl font-bold text-center text-gray-900 mb-4">
          Let's Chat
        </h1>
        <p className={`${extraLargeTextClass} text-center text-gray-700`}>
          I'm here to talk with you
        </p>
      </div>

      {/* Conversation Area */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 min-h-[500px] max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Volume2 className="w-24 h-24 mb-4" />
              <p className={extraLargeTextClass}>
                Press the button below to start talking
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-6 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className={extraLargeTextClass}>{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speakMessage(msg.content)}
                        className="mt-3 text-blue-600 hover:text-blue-700 flex items-center gap-2"
                      >
                        <Volume2 className="w-6 h-6" />
                        <span className="text-xl">Read aloud</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message here..."
              className={`${largeTextClass} flex-1 border-2 border-gray-300 rounded-xl px-6 py-4 focus:outline-none focus:border-blue-500`}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl text-2xl font-semibold"
            >
              Send
            </button>
          </div>

          <div className="flex justify-center gap-6">
            {messages.length === 0 && (
              <button
                onClick={startConversation}
                className="bg-green-500 hover:bg-green-600 text-white px-12 py-6 rounded-2xl text-3xl font-bold shadow-lg"
              >
                Start Talking
              </button>
            )}
            
            <button
              onClick={() => setIsListening(!isListening)}
              className={`${
                isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'
              } text-white px-12 py-6 rounded-2xl text-2xl font-bold shadow-lg flex items-center gap-4`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-10 h-10" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-10 h-10" />
                  Use Voice
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto mt-8 grid grid-cols-2 gap-6">
        <Link
          href="/patient/activities"
          className="bg-white hover:bg-gray-50 p-8 rounded-2xl shadow-lg text-center"
        >
          <p className={extraLargeTextClass + " font-semibold text-gray-900"}>
            Play Activities
          </p>
        </Link>
        <Link
          href="/patient/memories"
          className="bg-white hover:bg-gray-50 p-8 rounded-2xl shadow-lg text-center"
        >
          <p className={extraLargeTextClass + " font-semibold text-gray-900"}>
            View Memories
          </p>
        </Link>
      </div>
    </div>
  )
}
