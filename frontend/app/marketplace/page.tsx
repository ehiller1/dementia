'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Star, Clock, Users, Sparkles, Music, Camera, Heart, Flower, Flag, Play, Pause, Volume2 } from 'lucide-react'

// Mock storyline data (in production, fetch from API)
// Based on memory care ritual research: consistent, predictable, emotionally positive interactions
const featuredStorylines = [
  {
    id: 1,
    slug: 'family-story-channel',
    name: 'Family Story Channel',
    description: 'Turn family photos and memories into warm, repeatable conversations',
    category: 'family_specific',
    tier: 'interactive',
    price_monthly: 14.99,
    thumbnail_url: '/images/family-story.jpg',
    icon: Camera,
    features: [
      'Upload unlimited photos & memories',
      'AI narrator personalizes each story',
      'Gentle memory prompts',
      'Weekly usage reports'
    ],
    popular: true,
    testimonial: '"Dad lights up when he sees pictures of the grandkids!" - Sarah M.',
    ritualType: 'Connection Ritual',
    audioSample: 'Let\'s look at some wonderful memories together. Here\'s a beautiful photo from your granddaughter Emily\'s graduation. You must have been so proud that day. Can you tell me what you remember?'
  },
  {
    id: 2,
    slug: 'music-memory-dj',
    name: 'Music Memory DJ',
    description: 'Personalized music sessions from their era that spark joy and memories',
    category: 'sensory_mood',
    tier: 'core',
    price_monthly: 9.99,
    thumbnail_url: '/images/music-dj.jpg',
    icon: Music,
    features: [
      'Curated playlists by decade',
      'Mood-based music selection',
      'Favorite songs tracking',
      'Sing-along encouragement'
    ],
    popular: true,
    testimonial: '"Mom remembers every word to her favorite songs" - James T.',
    ritualType: 'Comfort Ritual',
    audioSample: 'Good afternoon. It\'s time for our music session. I have some wonderful songs from the 1960s lined up for you today. Let\'s start with your favorite, Moon River. Feel free to sing along.'
  },
  {
    id: 3,
    slug: 'nature-walks',
    name: 'Nature Walks',
    description: 'Calming virtual nature experiences with soothing narration',
    category: 'sensory_mood',
    tier: 'core',
    price_monthly: 9.99,
    thumbnail_url: '/images/nature.jpg',
    icon: Flower,
    features: [
      'Peaceful nature scenes',
      'Gentle mindfulness guidance',
      'Reduces anxiety and agitation',
      'Multiple scenic locations'
    ],
    popular: false,
    ritualType: 'Calming Ritual',
    audioSample: 'Let\'s take a peaceful walk through the garden today. Listen to the gentle sounds of birds singing and leaves rustling in the breeze. Take a deep breath and feel the calm wash over you.'
  },
  {
    id: 4,
    slug: 'grandchild-messenger',
    name: 'Grandchild Messenger',
    description: 'Bridge communication between grandparents and grandchildren',
    category: 'family_specific',
    tier: 'interactive',
    price_monthly: 14.99,
    thumbnail_url: '/images/grandchild.jpg',
    icon: Heart,
    features: [
      'Simplifies messages from grandkids',
      'Helps express love easily',
      'Voice note exchanges',
      'Captures precious moments'
    ],
    popular: false,
    ritualType: 'Connection Ritual',
    audioSample: 'You have a message from your grandson Tommy. He says: Hi Grandma! I got an A on my science project! I used the volcano idea you told me about. I miss you and can\'t wait to see you this weekend!'
  },
  {
    id: 5,
    slug: 'gardeners-corner',
    name: "Gardener's Corner",
    description: 'For lifelong gardeners - talk plants, flowers, and growing',
    category: 'interest_history',
    tier: 'specialty',
    price_monthly: 19.99,
    thumbnail_url: '/images/garden.jpg',
    icon: Flower,
    features: [
      'Garden planning activities',
      'Seasonal gardening topics',
      'Plant identification games',
      'Shares gardening wisdom'
    ],
    popular: false,
    ritualType: 'Identity Ritual',
    audioSample: 'Welcome to your garden time. The roses are blooming beautifully this season. Tell me about your favorite rose variety. I remember you mentioned you love the Peace roses with their yellow and pink petals.'
  },
  {
    id: 6,
    slug: 'veteran-companion',
    name: 'Veteran Companion',
    description: 'Honor military service with respect and dignity',
    category: 'interest_history',
    tier: 'specialty',
    price_monthly: 19.99,
    thumbnail_url: '/images/veteran.jpg',
    icon: Flag,
    features: [
      'Service recognition',
      'Camaraderie stories',
      'Era-specific content',
      'Avoids trauma triggers'
    ],
    popular: false,
    ritualType: 'Identity Ritual',
    audioSample: 'Good morning, soldier. Thank you for your service. Today I\'d like to hear about your time in the service. What was your favorite memory from your days in uniform? Your country is grateful for your dedication.'
  }
]

const categories = [
  { id: 'all', name: 'All Storylines', count: 15 },
  { id: 'family_specific', name: 'Family & Connection', count: 4 },
  { id: 'sensory_mood', name: 'Music & Relaxation', count: 3 },
  { id: 'interest_history', name: 'Hobbies & Interests', count: 5 },
  { id: 'relationship_legacy', name: 'Legacy & Heritage', count: 3 }
]

export default function MarketplacePage() {
  const [playingAudio, setPlayingAudio] = useState<number | null>(null)
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)

  // Initialize speech synthesis on client side
  useState(() => {
    if (typeof window !== 'undefined') {
      setSpeechSynthesis(window.speechSynthesis)
    }
  })

  const handlePlayAudio = (storylineId: number, audioText: string) => {
    if (!speechSynthesis) return

    // Stop any currently playing audio
    speechSynthesis.cancel()

    if (playingAudio === storylineId) {
      setPlayingAudio(null)
      return
    }

    // Play new audio
    const utterance = new SpeechSynthesisUtterance(audioText)
    utterance.rate = 0.85 // Slower, clearer speech
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onend = () => {
      setPlayingAudio(null)
    }

    speechSynthesis.speak(utterance)
    setPlayingAudio(storylineId)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-12 h-12 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold">Storyline Marketplace</h1>
            </div>
            <p className="text-xl text-purple-100 mb-6">
              Enhance your loved one's experience with specialized interactive modules
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <Star className="w-4 h-4 mr-2" />
                7-day free trial
              </div>
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                Personalized for each person
              </div>
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        
        {/* Ritual Research Explanation */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border-2 border-blue-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-500 fill-current" />
              Built on Memory Care Research
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Our storylines are designed based on <strong>ritual research in dementia care</strong>. Studies show that 
              consistent, predictable, emotionally positive interactions at the same time each day create 
              comforting rituals that reduce anxiety and improve wellbeing.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">🔄 Connection Rituals</h3>
                <p className="text-sm text-gray-600">
                  Regular interactions with family photos, messages, and memories that maintain emotional bonds
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-green-900 mb-2">💚 Comfort Rituals</h3>
                <p className="text-sm text-gray-600">
                  Music, nature, and sensory experiences that provide predictable calm and joy
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">⭐ Identity Rituals</h3>
                <p className="text-sm text-gray-600">
                  Activities honoring lifelong interests that reinforce sense of self and purpose
                </p>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Key Finding:</strong> 7-minute daily sessions at consistent times show the best results. 
                Each storyline is optimized for this "ideal visit" duration to prevent overstimulation while maximizing engagement.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category.id === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                  <span className="ml-2 text-xs opacity-75">({category.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Storylines */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex items-center mb-6">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Most Popular</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStorylines.map(storyline => {
              const Icon = storyline.icon
              return (
                <Link 
                  href={`/marketplace/${storyline.slug}`} 
                  key={storyline.id}
                  className="block"
                >
                  <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-2 ${
                    storyline.popular ? 'border-purple-300' : 'border-gray-200'
                  } hover:border-purple-400 relative overflow-hidden`}>
                    {storyline.popular && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <Icon className="w-8 h-8 text-purple-600" />
                        </div>
                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                          {storyline.ritualType}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {storyline.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4">
                        {storyline.description}
                      </p>
                      
                      {/* Audio Preview */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handlePlayAudio(storyline.id, storyline.audioSample)
                        }}
                        className="w-full mb-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 hover:border-green-300 rounded-lg p-3 flex items-center justify-center gap-2 text-green-700 font-medium transition-all"
                      >
                        {playingAudio === storyline.id ? (
                          <>
                            <Pause className="w-5 h-5" />
                            Playing Sample...
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-5 h-5" />
                            🎧 Hear Audio Sample
                          </>
                        )}
                      </button>
                      
                      <ul className="space-y-2 mb-4">
                        {storyline.features.slice(0, 2).map((feature, idx) => (
                          <li key={idx} className="flex items-start text-xs text-gray-600">
                            <span className="text-green-500 mr-2">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-purple-600">
                              ${storyline.price_monthly}
                            </span>
                            <span className="text-gray-500 text-sm">/month</span>
                          </div>
                          <div className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                            Try Free →
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Pricing Info */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              How Storyline Pricing Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">$9.99</div>
                <div className="font-semibold mb-2">Core Storylines</div>
                <div className="text-sm text-gray-600">
                  Music, Nature Walks, Comfort
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">$14.99</div>
                <div className="font-semibold mb-2">Interactive</div>
                <div className="text-sm text-gray-600">
                  Family Stories, Grandchild Messenger
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">$19.99</div>
                <div className="font-semibold mb-2">Specialty</div>
                <div className="text-sm text-gray-600">
                  Hobby Clubs, Veteran Companion
                </div>
              </div>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                All storylines include: 7-day free trial • Cancel anytime • No setup fees
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="max-w-5xl mx-auto text-center">
          <Link 
            href="/"
            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
