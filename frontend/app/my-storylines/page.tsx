'use client'

import Link from 'next/link'
import { ArrowLeft, Star, TrendingUp, Calendar, Settings, Plus, BarChart3, Camera, Music, Flower } from 'lucide-react'

// Mock data (in production, fetch from API)
const activeStorylines = [
  {
    id: 1,
    name: 'Family Story Channel',
    icon: Camera,
    status: 'active',
    price: 14.99,
    startedAt: '2024-11-15',
    nextBilling: '2024-12-15',
    lastUsed: 'Today at 2:15 PM',
    engagement: 95, // 0-100
    totalSessions: 23,
    completionRate: 92,
    favoriteMoments: [
      'Emily\'s graduation photo',
      'Family picnic 1987',
      'Dad\'s fishing trip'
    ]
  },
  {
    id: 2,
    name: 'Music Memory DJ',
    icon: Music,
    status: 'active',
    price: 9.99,
    startedAt: '2024-11-20',
    nextBilling: '2024-12-20',
    lastUsed: 'Yesterday at 10:30 AM',
    engagement: 88,
    totalSessions: 15,
    completionRate: 87,
    favoriteMoments: [
      'Frank Sinatra classics',
      '1960s Motown',
      'Elvis Presley hits'
    ]
  },
  {
    id: 3,
    name: 'Nature Walks',
    icon: Flower,
    status: 'trial',
    price: 9.99,
    startedAt: '2024-11-25',
    trialEnds: '2024-12-02',
    lastUsed: '3 days ago',
    engagement: 72,
    totalSessions: 5,
    completionRate: 80,
    favoriteMoments: []
  }
]

const monthlyTotal = activeStorylines
  .filter(s => s.status === 'active')
  .reduce((sum, s) => sum + s.price, 0)

const recommendedStorylines = [
  {
    name: 'Grandchild Messenger',
    reason: 'Based on high engagement with family content',
    price: 14.99
  },
  {
    name: 'Gardener\'s Corner',
    reason: 'High engagement with Nature Walks',
    price: 19.99
  }
]

export default function MyStorylinesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <Link 
            href="/"
            className="inline-flex items-center text-purple-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Storylines</h1>
              <p className="text-purple-100">Managing storylines for Mom</p>
            </div>
            <Link
              href="/marketplace"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-50 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Browse More
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Active Storylines</div>
              <div className="text-3xl font-bold text-purple-600">
                {activeStorylines.filter(s => s.status === 'active').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Monthly Cost</div>
              <div className="text-3xl font-bold text-green-600">
                ${monthlyTotal.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Avg Engagement</div>
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(activeStorylines.reduce((sum, s) => sum + s.engagement, 0) / activeStorylines.length)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
              <div className="text-3xl font-bold text-orange-600">
                {activeStorylines.reduce((sum, s) => sum + s.totalSessions, 0)}
              </div>
            </div>
          </div>

          {/* Active Storylines */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Active Storylines</h2>
            
            <div className="space-y-4">
              {activeStorylines.map(storyline => {
                const Icon = storyline.icon
                return (
                  <div key={storyline.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start">
                          <div className="bg-purple-100 p-3 rounded-lg mr-4">
                            <Icon className="w-8 h-8 text-purple-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-bold">{storyline.name}</h3>
                              {storyline.status === 'trial' && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                                  TRIAL
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {storyline.status === 'trial' 
                                ? `Trial ends ${storyline.trialEnds}`
                                : `Started ${storyline.startedAt} • Next billing ${storyline.nextBilling}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            ${storyline.price}
                          </div>
                          <div className="text-xs text-gray-500">/month</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Last Used</div>
                          <div className="font-semibold text-sm">{storyline.lastUsed}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Engagement</div>
                          <div className="font-semibold text-sm flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                            {storyline.engagement}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Sessions</div>
                          <div className="font-semibold text-sm">{storyline.totalSessions}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Completion</div>
                          <div className="font-semibold text-sm">{storyline.completionRate}%</div>
                        </div>
                      </div>

                      {/* Favorite Moments */}
                      {storyline.favoriteMoments.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Star className="w-4 h-4 mr-2 text-yellow-500" />
                            Most Popular Content
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {storyline.favoriteMoments.map((moment, idx) => (
                              <span key={idx} className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full">
                                {moment}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Link 
                          href={`/my-storylines/analytics/${storyline.id}`}
                          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </Link>
                        <Link 
                          href={`/my-storylines/configuration/${storyline.id}`}
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Link>
                        {storyline.status === 'trial' ? (
                          <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                            Activate Subscription
                          </button>
                        ) : (
                          <button className="px-4 py-2 text-gray-500 hover:text-red-600 transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Recommended for Mom</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendedStorylines.map((rec, idx) => (
                <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">{rec.name}</h3>
                    <span className="text-purple-600 font-bold">${rec.price}/mo</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">💡 {rec.reason}</p>
                  <Link
                    href={`/marketplace/${rec.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`}
                    className="block bg-purple-600 text-white text-center px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Learn More →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Billing Summary</h3>
              <button className="text-purple-600 hover:underline text-sm font-medium">
                Manage Billing
              </button>
            </div>
            <div className="space-y-3">
              {activeStorylines.filter(s => s.status === 'active').map(s => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{s.name}</span>
                  <span className="font-semibold">${s.price}/month</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Monthly Total</span>
                <span className="text-purple-600">${monthlyTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
