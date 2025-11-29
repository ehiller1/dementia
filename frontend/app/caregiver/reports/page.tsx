'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Heart, MessageSquare, Clock } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link 
            href="/caregiver"
            className="inline-flex items-center text-green-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Analytics & Reports</h1>
              <p className="text-green-100">View engagement trends and insights</p>
            </div>
            <TrendingUp className="hidden sm:block w-12 h-12 md:w-16 md:h-16 opacity-50" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-8 h-8 text-blue-500" />
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-gray-600 text-sm">Conversations This Week</p>
              <p className="text-3xl font-bold text-gray-900">42</p>
              <p className="text-green-600 text-sm mt-2">↑ 12% from last week</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Heart className="w-8 h-8 text-red-500" />
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-600 text-sm">Avg. Sentiment Score</p>
              <p className="text-3xl font-bold text-gray-900">0.72</p>
              <p className="text-green-600 text-sm mt-2">↑ Positive trend</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-purple-500" />
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-gray-600 text-sm">Avg. Session Length</p>
              <p className="text-3xl font-bold text-gray-900">6.5m</p>
              <p className="text-gray-500 text-sm mt-2">Within target range</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-orange-500" />
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-gray-600 text-sm">Missed Reminders</p>
              <p className="text-3xl font-bold text-gray-900">3</p>
              <p className="text-red-600 text-sm mt-2">↓ Better than last week</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Weekly Activity Overview</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const height = Math.random() * 100
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-green-200 rounded-t" style={{ height: `${height}%` }}>
                      <div className="w-full bg-green-500 rounded-t" style={{ height: '60%' }}></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{day}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Top Conversation Topics</h3>
              <div className="space-y-3">
                {[
                  { topic: 'Family Memories', count: 15, color: 'bg-blue-500' },
                  { topic: 'Gardening', count: 12, color: 'bg-green-500' },
                  { topic: 'Daily Activities', count: 10, color: 'bg-purple-500' },
                  { topic: 'Weather', count: 8, color: 'bg-yellow-500' }
                ].map((item) => (
                  <div key={item.topic} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.topic}</span>
                        <span className="text-sm text-gray-500">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / 15) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Engagement Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Improved Morning Engagement</p>
                    <p className="text-sm text-gray-600">Morning sessions showing 20% increase in positive sentiment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Consistent Routine</p>
                    <p className="text-sm text-gray-600">Daily interactions maintaining steady pattern</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-900">Optimal Session Length</p>
                    <p className="text-sm text-gray-600">Sessions averaging 6-7 minutes, within ideal range</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
