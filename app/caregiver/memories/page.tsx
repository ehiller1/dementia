'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Plus, Upload, Heart, Calendar, Tag, Search, Image as ImageIcon } from 'lucide-react'

export default function MemoryBookPage() {
  const [showUpload, setShowUpload] = useState(false)

  const memories = [
    {
      id: 1,
      title: "Family Reunion 2020",
      date: "2020-07-15",
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800",
      tags: ["family", "celebration"],
      patient: "Margaret Smith",
      description: "Wonderful family gathering with everyone together"
    },
    {
      id: 2,
      title: "Garden Blooms",
      date: "2021-05-10",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
      tags: ["hobbies", "garden"],
      patient: "Margaret Smith",
      description: "Beautiful roses in full bloom"
    },
    {
      id: 3,
      title: "Birthday Celebration",
      date: "2022-03-22",
      image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800",
      tags: ["birthday", "celebration"],
      patient: "Robert Johnson",
      description: "80th birthday party"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link 
            href="/caregiver"
            className="inline-flex items-center text-pink-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Memory Book</h1>
              <p className="text-pink-100">Add and manage photos and stories</p>
            </div>
            <Heart className="hidden sm:block w-12 h-12 md:w-16 md:h-16 opacity-50" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Memory
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search memories..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {showUpload && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-pink-200 p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Upload New Memory</h3>
              <div className="border-2 border-dashed border-pink-300 rounded-lg p-8 text-center mb-4">
                <Upload className="w-12 h-12 mx-auto text-pink-400 mb-3" />
                <p className="text-gray-600 mb-2">Drag and drop photos here, or click to browse</p>
                <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium">
                  Choose Files
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Title" className="border border-gray-300 rounded-lg px-4 py-2" />
                <input type="date" className="border border-gray-300 rounded-lg px-4 py-2" />
                <textarea placeholder="Description" className="md:col-span-2 border border-gray-300 rounded-lg px-4 py-2 h-24"></textarea>
                <input type="text" placeholder="Tags (comma separated)" className="md:col-span-2 border border-gray-300 rounded-lg px-4 py-2" />
              </div>
              <div className="flex gap-3 mt-4">
                <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium">Upload</button>
                <button onClick={() => setShowUpload(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video relative">
                  <Image src={memory.image} alt={memory.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{memory.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{memory.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    {new Date(memory.date).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {memory.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {memories.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No memories yet</p>
              <p className="text-gray-400 mt-2">Upload photos and stories to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
