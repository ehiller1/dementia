'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Clock, Heart, Calendar, Activity, BarChart3, Star } from 'lucide-react'

export default function StorylineAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  // Mock data - in production, fetch based on storyline ID
  const storylineData = {
    id: id,
    name: id === '1' ? 'Family Story Channel' : id === '2' ? 'Music Memory DJ' : 'Nature Walks',
    engagement: 95,
    totalSessions: 23,
    avgSessionLength: '6.8 minutes',
    completionRate: 92,
    lastUsed: 'Today at 2:15 PM',
    topContent: [
      { name: "Emily's graduation photo", views: 18, avgTime: '8:20' },
      { name: 'Family picnic 1987', views: 15, avgTime: '7:45' },
      { name: "Dad's fishing trip", views: 12, avgTime: '6:30' }
    ],
    weeklyData: [
      { day: 'Mon', sessions: 4, engagement: 92 },
      { day: 'Tue', sessions: 3, engagement: 88 },
      { day: 'Wed', sessions: 5, engagement: 95 },
      { day: 'Thu', sessions: 2, engagement: 85 },
      { day: 'Fri', sessions: 4, engagement: 93 },
      { day: 'Sat', sessions: 3, engagement: 90 },
      { day: 'Sun', sessions: 2, engagement: 87 }
    ],
    ritualCompliance: {
      consistency: 96, // Are sessions happening regularly?
      timing: 88, // Are they at consistent times of day?
      duration: 92, // Are sessions lasting the optimal 7 minutes?
      emotional: 94 // Positive emotional responses
    }
  }

  const maxSessions = Math.max(...storylineData.weeklyData.map(d => d.sessions))

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <Link 
            href="/my-storylines"
            className="inline-flex items-center text-purple-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Storylines
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{storylineData.name}</h1>
              <p className="text-purple-100">Analytics & Usage Insights</p>
            </div>
            <BarChart3 className="hidden sm:block w-12 h-12 md:w-16 md:h-16 opacity-50" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <Activity className="w-8 h-8 text-purple-600" />
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-gray-600 text-sm mb-1">Overall Engagement</p>
              <p className="text-3xl font-bold text-purple-600">{storylineData.engagement}%</p>
              <p className="text-xs text-green-600 mt-2">↑ Excellent engagement</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-blue-600">{storylineData.totalSessions}</p>
              <p className="text-xs text-gray-500 mt-2">Last: {storylineData.lastUsed}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm mb-1">Avg. Session</p>
              <p className="text-3xl font-bold text-green-600">{storylineData.avgSessionLength}</p>
              <p className="text-xs text-green-600 mt-2">✓ Ideal 7-min range</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100">
              <div className="flex items-center justify-between mb-3">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-gray-600 text-sm mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-orange-600">{storylineData.completionRate}%</p>
              <p className="text-xs text-gray-500 mt-2">Very consistent</p>
            </div>
          </div>

          {/* Ritual Compliance Score */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-blue-200">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-7 h-7 text-yellow-500 fill-current" />
              Ritual Quality Score
            </h2>
            <p className="text-gray-700 mb-6">
              Based on memory care research, successful rituals require consistency, timing, duration, and positive emotion. 
              Here's how this storyline performs:
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Consistency</span>
                  <span className="text-2xl font-bold text-purple-600">{storylineData.ritualCompliance.consistency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${storylineData.ritualCompliance.consistency}%` }}></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Regular, predictable sessions build trust</p>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Timing Consistency</span>
                  <span className="text-2xl font-bold text-blue-600">{storylineData.ritualCompliance.timing}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${storylineData.ritualCompliance.timing}%` }}></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Same-time sessions create routine</p>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Optimal Duration</span>
                  <span className="text-2xl font-bold text-green-600">{storylineData.ritualCompliance.duration}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: `${storylineData.ritualCompliance.duration}%` }}></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">7-minute sessions prevent overstimulation</p>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Emotional Connection</span>
                  <span className="text-2xl font-bold text-pink-600">{storylineData.ritualCompliance.emotional}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-pink-600 h-3 rounded-full" style={{ width: `${storylineData.ritualCompliance.emotional}%` }}></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Positive responses during sessions</p>
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Weekly Activity</h2>
            <div className="flex items-end justify-between gap-2 h-64">
              {storylineData.weeklyData.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end h-full gap-1">
                    <div 
                      className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                      style={{ height: `${(day.sessions / maxSessions) * 100}%` }}
                      title={`${day.sessions} sessions, ${day.engagement}% engagement`}
                    >
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-medium">{day.day}</p>
                  <p className="text-xs text-gray-500">{day.sessions}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Content */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Most Engaging Content</h2>
            <div className="space-y-3">
              {storylineData.topContent.map((content, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-bold text-purple-600">#{idx + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{content.name}</p>
                      <p className="text-sm text-gray-600">Avg. viewing time: {content.avgTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{content.views}</p>
                    <p className="text-xs text-gray-500">views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights & Recommendations */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
            <h2 className="text-2xl font-bold mb-4 text-green-900">📊 Insights & Recommendations</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-green-900 mb-2">✓ Excellent Ritual Formation</p>
                <p className="text-gray-700 text-sm">
                  Sessions are happening at consistent times with optimal duration. This predictability helps reduce anxiety and builds trust.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-2">💡 Best Time: Afternoons</p>
                <p className="text-gray-700 text-sm">
                  Engagement is highest during 2-4 PM sessions. Consider scheduling daily interactions during this window.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-purple-900 mb-2">⭐ Family Photos Resonate Most</p>
                <p className="text-gray-700 text-sm">
                  Content featuring grandchildren generates 40% longer engagement. Consider adding more recent family photos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
