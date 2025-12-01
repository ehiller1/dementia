'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Music, BookOpen, Palette, Puzzle, Heart, Sun, Home, Play, Star } from 'lucide-react'

export default function PatientActivitiesPage() {
  const [selectedActivity, setSelectedActivity] = useState<any>(null)

  // Large, accessible design for dementia patients
  const largeTextClass = "text-2xl"
  const extraLargeTextClass = "text-3xl"
  const hugeTextClass = "text-4xl"

  const activities = [
    {
      id: 1,
      title: "Listen to Music",
      icon: Music,
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Play your favorite songs and reminisce",
      options: ["Classical Music", "Old Favorites", "Nature Sounds"]
    },
    {
      id: 2,
      title: "Memory Games",
      icon: Puzzle,
      color: "from-purple-400 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Simple, fun puzzles and matching games",
      options: ["Picture Matching", "Word Games", "Color Sorting"]
    },
    {
      id: 3,
      title: "Story Time",
      icon: BookOpen,
      color: "from-green-400 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Listen to familiar stories and poems",
      options: ["Classic Tales", "Poetry", "Family Stories"]
    },
    {
      id: 4,
      title: "Art & Colors",
      icon: Palette,
      color: "from-pink-400 to-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      description: "Simple drawing and coloring activities",
      options: ["Color Selection", "Simple Drawing", "Picture Viewing"]
    },
    {
      id: 5,
      title: "Relaxation",
      icon: Heart,
      color: "from-red-400 to-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Gentle breathing and calming exercises",
      options: ["Deep Breathing", "Gentle Music", "Guided Relaxation"]
    },
    {
      id: 6,
      title: "Daily Routine",
      icon: Sun,
      color: "from-yellow-400 to-orange-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      description: "Review your daily schedule and activities",
      options: ["Morning Routine", "Meal Times", "Evening Wind-Down"]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6 sm:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Link href="/patient" className="flex items-center gap-3 text-green-600 hover:text-green-700">
            <ArrowLeft className="w-8 h-8" />
            <span className={largeTextClass}>Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 text-green-600 hover:text-green-700">
            <Home className="w-8 h-8" />
            <span className={largeTextClass}>Home</span>
          </Link>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-gray-900 mb-4">
          Activities
        </h1>
        <p className={`${extraLargeTextClass} text-center text-gray-700`}>
          Choose something fun to do
        </p>
      </div>

      {/* Activities Grid */}
      {!selectedActivity ? (
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {activities.map((activity) => {
              const IconComponent = activity.icon
              return (
                <button
                  key={activity.id}
                  onClick={() => setSelectedActivity(activity)}
                  className={`${activity.bgColor} rounded-3xl shadow-xl p-8 border-4 ${activity.borderColor} hover:shadow-2xl transition-all hover:scale-105`}
                >
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br ${activity.color} rounded-full flex items-center justify-center`}>
                    <IconComponent className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                  </div>
                  
                  <h3 className={`${extraLargeTextClass} font-bold text-gray-900 mb-3 text-center`}>
                    {activity.title}
                  </h3>
                  
                  <p className="text-xl text-gray-700 text-center">
                    {activity.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        /* Selected Activity Detail View */
        <div className="max-w-4xl mx-auto">
          <div className={`${selectedActivity.bgColor} rounded-3xl shadow-2xl border-4 ${selectedActivity.borderColor} overflow-hidden`}>
            <div className={`bg-gradient-to-r ${selectedActivity.color} p-8 sm:p-12 text-white text-center`}>
              {(() => {
                const IconComponent = selectedActivity.icon
                return (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <IconComponent className="w-16 h-16 sm:w-20 sm:h-20" />
                  </div>
                )
              })()}
              
              <h2 className={`${hugeTextClass} sm:text-5xl font-bold mb-4`}>
                {selectedActivity.title}
              </h2>
              <p className={`${largeTextClass} opacity-90`}>
                {selectedActivity.description}
              </p>
            </div>
            
            <div className="p-8 sm:p-12">
              <h3 className={`${extraLargeTextClass} font-bold text-gray-900 mb-6 text-center`}>
                Choose an option:
              </h3>

              <div className="space-y-4 mb-8">
                {selectedActivity.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    className="w-full bg-white hover:bg-gray-50 border-4 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
                  >
                    <span className={`${extraLargeTextClass} font-semibold text-gray-900`}>
                      {option}
                    </span>
                    <div className="flex items-center gap-3">
                      <Play className="w-8 h-8 text-green-600 group-hover:text-green-700" />
                      <Star className="w-8 h-8 text-yellow-400 fill-current" />
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSelectedActivity(null)}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg flex items-center justify-center gap-3"
              >
                <ArrowLeft className="w-8 h-8" />
                Choose Different Activity
              </button>
            </div>
          </div>

          {/* Suggested Activities */}
          <div className="mt-8">
            <h3 className={`${extraLargeTextClass} font-bold text-gray-900 mb-6 text-center`}>
              Other Activities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {activities
                .filter(a => a.id !== selectedActivity.id)
                .slice(0, 3)
                .map((activity) => {
                  const IconComponent = activity.icon
                  return (
                    <button
                      key={activity.id}
                      onClick={() => setSelectedActivity(activity)}
                      className={`${activity.bgColor} border-4 ${activity.borderColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}
                    >
                      <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${activity.color} rounded-full flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 text-center">{activity.title}</p>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/patient"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-2xl text-center shadow-lg"
            >
              <p className={`${largeTextClass} font-bold`}>
                Start Talking
              </p>
            </Link>
            <button
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-2xl text-center shadow-lg"
            >
              <p className={`${largeTextClass} font-bold`}>
                Play Activities
              </p>
            </button>
            <Link
              href="/patient/memories"
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-2xl text-center shadow-lg"
            >
              <p className={`${largeTextClass} font-bold`}>
                View Memories
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
