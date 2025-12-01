'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, Play, Calendar, Users, Camera, Home } from 'lucide-react'

export default function PatientMemoriesPage() {
  const [selectedMemory, setSelectedMemory] = useState<any>(null)

  // Large, accessible design for dementia patients
  const largeTextClass = "text-2xl"
  const extraLargeTextClass = "text-3xl"
  const hugeTextClass = "text-4xl"

  // Sample memories (in production, fetch from API)
  const memories = [
    {
      id: 1,
      title: "Family Gathering",
      date: "Summer 2020",
      category: "Family",
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800",
      description: "A wonderful day with the whole family at the park.",
      emotion: "happy"
    },
    {
      id: 2,
      title: "Birthday Celebration",
      date: "Last Year",
      category: "Special Days",
      image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800",
      description: "Your birthday party with friends and family.",
      emotion: "joyful"
    },
    {
      id: 3,
      title: "Garden Time",
      date: "Spring 2021",
      category: "Hobbies",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
      description: "Working in the garden you love so much.",
      emotion: "peaceful"
    },
    {
      id: 4,
      title: "Beach Vacation",
      date: "2019",
      category: "Travel",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      description: "Beautiful sunny day at the beach.",
      emotion: "relaxed"
    },
    {
      id: 5,
      title: "Grandchildren Visit",
      date: "Recent",
      category: "Family",
      image: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800",
      description: "Special time with your grandchildren.",
      emotion: "loving"
    },
    {
      id: 6,
      title: "Holiday Dinner",
      date: "Last Holiday",
      category: "Special Days",
      image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800",
      description: "Family gathered around the dinner table.",
      emotion: "warm"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 p-6 sm:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Link href="/patient" className="flex items-center gap-3 text-purple-600 hover:text-purple-700">
            <ArrowLeft className="w-8 h-8" />
            <span className={largeTextClass}>Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 text-purple-600 hover:text-purple-700">
            <Home className="w-8 h-8" />
            <span className={largeTextClass}>Home</span>
          </Link>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-gray-900 mb-4">
          Your Memories
        </h1>
        <p className={`${extraLargeTextClass} text-center text-gray-700`}>
          Special moments from your life
        </p>
      </div>

      {/* Memory Grid */}
      {!selectedMemory ? (
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {memories.map((memory) => (
              <button
                key={memory.id}
                onClick={() => setSelectedMemory(memory)}
                className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow group"
              >
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={memory.image}
                    alt={memory.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-lg font-semibold text-purple-600">{memory.date}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className={`${extraLargeTextClass} font-bold text-gray-900 mb-2`}>
                    {memory.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Camera className="w-6 h-6" />
                    <span className="text-xl">{memory.category}</span>
                  </div>
                  <p className="text-xl text-gray-700">
                    {memory.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Empty State if no memories */}
          {memories.length === 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
              <Camera className="w-24 h-24 mx-auto text-gray-300 mb-6" />
              <p className={`${hugeTextClass} text-gray-500`}>
                No memories yet
              </p>
              <p className={`${largeTextClass} text-gray-400 mt-4`}>
                Your family can add photos and stories for you
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Selected Memory Detail View */
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={selectedMemory.image}
                alt={selectedMemory.title}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className={`${hugeTextClass} font-bold text-gray-900`}>
                  {selectedMemory.title}
                </h2>
                <div className="flex items-center gap-3 bg-purple-100 px-6 py-3 rounded-full">
                  <Calendar className="w-7 h-7 text-purple-600" />
                  <span className="text-2xl font-semibold text-purple-900">
                    {selectedMemory.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 px-5 py-2 rounded-full">
                  <span className="text-xl font-medium text-blue-900">{selectedMemory.category}</span>
                </div>
                <div className="bg-pink-100 px-5 py-2 rounded-full flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-600 fill-current" />
                  <span className="text-xl font-medium text-pink-900 capitalize">{selectedMemory.emotion}</span>
                </div>
              </div>

              <p className={`${extraLargeTextClass} text-gray-700 leading-relaxed mb-8`}>
                {selectedMemory.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg flex items-center justify-center gap-3"
                >
                  <ArrowLeft className="w-8 h-8" />
                  View All Memories
                </button>
                <button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg flex items-center justify-center gap-3"
                >
                  <Play className="w-8 h-8" />
                  Tell Me More
                </button>
              </div>
            </div>
          </div>

          {/* Related Memories */}
          <div className="mt-8">
            <h3 className={`${extraLargeTextClass} font-bold text-gray-900 mb-6 text-center`}>
              Other Memories
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {memories
                .filter(m => m.id !== selectedMemory.id)
                .slice(0, 3)
                .map((memory) => (
                  <button
                    key={memory.id}
                    onClick={() => setSelectedMemory(memory)}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={memory.image}
                        alt={memory.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xl font-semibold text-gray-900">{memory.title}</p>
                    </div>
                  </button>
                ))}
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
            <Link
              href="/patient/activities"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-2xl text-center shadow-lg"
            >
              <p className={`${largeTextClass} font-bold`}>
                Play Activities
              </p>
            </Link>
            <button
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-2xl text-center shadow-lg"
            >
              <p className={`${largeTextClass} font-bold`}>
                View Memories
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
