'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mic, MicOff, Upload, CheckCircle, XCircle, AlertCircle, BookOpen,
  TrendingUp, MessageSquare, Heart, Award, Play, ArrowLeft, FileText
} from 'lucide-react'

export default function CaregiverTrainingPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [conversationText, setConversationText] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'practice' | 'learn' | 'examples'>('practice')
  
  // Mock patient/caregiver IDs (in production, get from auth)
  const patientId = 1
  const caregiverId = 1
  
  const handleAnalyze = async () => {
    if (!conversationText.trim()) {
      alert('Please enter a conversation to analyze')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/training/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_text: conversationText,
          caregiver_id: caregiverId,
          patient_id: patientId
        })
      })
      
      const result = await response.json()
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Failed to analyze conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'text-green-600 bg-green-100'
    if (grade === 'B') return 'text-blue-600 bg-blue-100'
    if (grade === 'C') return 'text-yellow-600 bg-yellow-100'
    if (grade === 'D') return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <Link 
            href="/caregiver"
            className="inline-flex items-center text-purple-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Family Training</h1>
              <p className="text-purple-100">Learn how to communicate with someone who has memory loss</p>
            </div>
            <BookOpen className="w-16 h-16 opacity-50" />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-2 flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'practice'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Mic className="w-5 h-5 inline mr-2" />
              Practice & Get Feedback
            </button>
            <button
              onClick={() => setActiveTab('learn')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'learn'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              Learn Best Practices
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'examples'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Example Conversations
            </button>
          </div>
          
          {/* Practice Tab */}
          {activeTab === 'practice' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-4">Enter Conversation</h2>
                  <p className="text-gray-600 mb-4 text-sm">
                    Type or paste a conversation between you and your loved one. 
                    Use format: <code className="bg-gray-100 px-2 py-1 rounded">Caregiver: text</code> and <code className="bg-gray-100 px-2 py-1 rounded">Patient: text</code>
                  </p>
                  
                  <textarea
                    value={conversationText}
                    onChange={(e) => setConversationText(e.target.value)}
                    placeholder="Example:
Caregiver: Good morning, Dad. It's time for our visit.
Patient: Oh, hello.
Caregiver: I was thinking about your garden today.
Patient: I loved the garden..."
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  />
                  
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !conversationText.trim()}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Analyzing...' : 'Analyze Conversation'}
                    </button>
                    <button
                      onClick={() => setConversationText('')}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                {/* Recording Option */}
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                    <Mic className="w-5 h-5 mr-2" />
                    Record Live Conversation (Coming Soon)
                  </h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Soon you'll be able to record audio and get instant feedback during actual conversations.
                  </p>
                  <button
                    disabled
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed"
                  >
                    <Mic className="w-4 h-4 inline mr-2" />
                    Start Recording
                  </button>
                </div>
              </div>
              
              {/* Results Section */}
              <div>
                {!analysis && (
                  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      Enter a conversation and click "Analyze" to receive detailed feedback on your interaction.
                    </p>
                  </div>
                )}
                
                {analysis && (
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Overall Score</h2>
                        <div className={`text-4xl font-bold px-6 py-2 rounded-lg ${getGradeColor(analysis.grade)}`}>
                          {analysis.grade}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-purple-600 h-4 rounded-full transition-all"
                            style={{ width: `${analysis.overall_score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-2xl font-bold text-purple-600">
                          {Math.round(analysis.overall_score * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Principle Scores */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-xl font-bold mb-4">Care Principles</h3>
                      <div className="space-y-4">
                        {Object.entries(analysis.principle_scores).map(([key, data]: [string, any]) => (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className={`font-bold ${getScoreColor(data.score)}`}>
                                {Math.round(data.score * 100)}%
                              </span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className={`h-2 rounded-full ${
                                  data.score >= 0.8 ? 'bg-green-500' :
                                  data.score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${data.score * 100}%` }}
                              ></div>
                            </div>
                            {data.evidence && data.evidence.length > 0 && (
                              <ul className="text-sm text-gray-600 space-y-1">
                                {data.evidence.map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start">
                                    {item.startsWith('✓') ? (
                                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                    ) : item.startsWith('✗') ? (
                                      <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                    )}
                                    <span>{item.substring(2)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Violations */}
                    {analysis.violations && analysis.violations.length > 0 && (
                      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                        <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                          <XCircle className="w-6 h-6 mr-2" />
                          What NOT to Do ({analysis.violations.length})
                        </h3>
                        <div className="space-y-4">
                          {analysis.violations.map((violation: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-4 border border-red-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-red-900 capitalize">
                                  {violation.type.replace(/_/g, ' ')}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  violation.severity === 'high'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-yellow-500 text-white'
                                }`}>
                                  {violation.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Issue:</strong> {violation.issue}
                              </p>
                              <p className="text-sm text-green-700">
                                <strong>Instead:</strong> {violation.correction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Strengths */}
                    {analysis.strengths && analysis.strengths.length > 0 && (
                      <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                        <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                          <CheckCircle className="w-6 h-6 mr-2" />
                          What You Did Well
                        </h3>
                        <ul className="space-y-2">
                          {analysis.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="flex items-center text-green-800">
                              <Award className="w-5 h-5 mr-3 text-green-600" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                          <TrendingUp className="w-6 h-6 mr-2" />
                          Recommendations
                        </h3>
                        <div className="space-y-4">
                          {analysis.recommendations.map((rec: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-4 border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  rec.priority === 'immediate' ? 'bg-red-600 text-white' :
                                  rec.priority === 'high' ? 'bg-orange-500 text-white' :
                                  'bg-blue-500 text-white'
                                }`}>
                                  {rec.priority}
                                </span>
                                <h4 className="font-bold text-blue-900">{rec.title}</h4>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                              <p className="text-sm text-blue-900 mb-2">
                                <strong>Action:</strong> {rec.action}
                              </p>
                              {rec.example && (
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">
                                  "{rec.example}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Learn Tab */}
          {activeTab === 'learn' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold mb-4 text-green-800">✓ Do These Things</h2>
                <ul className="space-y-3">
                  {[
                    'Use their name often',
                    'Say "visit" not "session"',
                    'Validate emotions, not facts',
                    'Keep sentences short (10-12 words)',
                    'Follow a predictable routine',
                    'Accept silence',
                    'Respond to feelings',
                    'Give permission to rest',
                    'Say "tomorrow" not "goodbye"',
                    'Be present, not perfect'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-800">✗ Avoid These Things</h2>
                <ul className="space-y-3">
                  {[
                    'Never ask "Do you remember?"',
                    'Don\'t correct their reality',
                    'Don\'t give multiple choices',
                    'Don\'t ask rapid questions',
                    'Don\'t test their memory',
                    'Don\'t rush or pressure',
                    'Don\'t argue about facts',
                    'Don\'t bring up painful topics',
                    'Don\'t expect them to recall you',
                    'Don\'t say "try harder"'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="md:col-span-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border border-purple-200 p-8">
                <h2 className="text-2xl font-bold mb-4">The 7-Minute Ideal Visit</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { phase: '0-1 min', name: 'Arrival', focus: 'Predictability & Safety' },
                    { phase: '1-2 min', name: 'Gentle Orientation', focus: 'Without Testing' },
                    { phase: '2-4 min', name: 'Familiar Thread', focus: 'Memory Without Pressure' },
                    { phase: '4-5 min', name: 'Emotional Reflection', focus: 'Identity Support' },
                    { phase: '5-6 min', name: 'Gentle Presence', focus: 'No Performance Required' },
                    { phase: '6-7 min', name: 'Consistent Closing', focus: 'Trust & Continuity' }
                  ].map((phase, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4">
                      <div className="text-purple-600 font-bold text-sm mb-1">{phase.phase}</div>
                      <div className="font-bold text-gray-900 mb-1">{phase.name}</div>
                      <div className="text-sm text-gray-600">{phase.focus}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h2 className="text-2xl font-bold text-green-800">Good Example</h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-sm space-y-2">
                  <div><span className="font-bold text-blue-600">Caregiver:</span> Good morning, Dad. It's time for our visit. I'm here with you.</div>
                  <div><span className="font-bold text-purple-600">Patient:</span> Oh, hello.</div>
                  <div><span className="font-bold text-blue-600">Caregiver:</span> It's a calm morning. You're at home, and things are okay right now.</div>
                  <div><span className="font-bold text-purple-600">Patient:</span> Yes, it's nice.</div>
                  <div><span className="font-bold text-blue-600">Caregiver:</span> I was thinking about your garden today. You always seemed to enjoy being around plants.</div>
                  <div><span className="font-bold text-purple-600">Patient:</span> Oh yes, I loved the garden.</div>
                  <div><span className="font-bold text-blue-600">Caregiver:</span> What did you like most about being in the garden?</div>
                  <div><span className="font-bold text-purple-600">Patient:</span> The roses. They smelled so good.</div>
                  <div><span className="font-bold text-blue-600">Caregiver:</span> When you talk about the roses, you sound peaceful.</div>
                </div>
                <h3 className="font-bold text-green-800 mb-2">Why This Works:</h3>
                <ul className="space-y-1 text-sm">
                  {[
                    'Started with name and "visit"',
                    'Provided orientation without testing',
                    'Asked about feelings, not facts',
                    'Validated emotions',
                    'Allowed silence',
                    'Promised return'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <h2 className="text-2xl font-bold text-red-800">What NOT to Do</h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-sm space-y-2">
                  <div><span className="font-bold text-blue-600">Caregiver:</span> Hi Dad! Do you remember me?</div>
                  <div><span className="font-bold text-purple-600">Patient:</span> Oh, hello.</div>
                  <div><span className="font-bold text-blue-600">Caregiver:</span> Do you remember that yesterday we went to the park?</div>
                  <div><span className="font-bold text-purple-600">Patient:</span> I... I don't know.</div>
                  <div><span className="font-bold text-blue-600">Caregiver:</span> Come on, try to remember. You had a sandwich.</div>
                  <div><span className="font-bold text-purple-600">Patient:</span> I don't remember!</div>
                  <div><span className="font-bold text-blue-600">Caregiver:</span> You're forgetting everything. The doctor said you need to exercise your memory.</div>
                </div>
                <h3 className="font-bold text-red-800 mb-2">Why This is Harmful:</h3>
                <ul className="space-y-1 text-sm">
                  {[
                    'Asked "Do you remember" multiple times',
                    'Tested memory with facts',
                    'Corrected repeatedly',
                    'Said "try harder"',
                    'Brought up forgetting',
                    'Created anxiety and shame'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center text-red-700">
                      <XCircle className="w-4 h-4 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
