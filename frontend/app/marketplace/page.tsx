'use client'

import Link from 'next/link'
import { ShoppingCart, Star, Clock, Users, Sparkles, Music, Camera, Heart, Flower, Flag } from 'lucide-react'

// Mock storyline data (in production, fetch from API)
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
    testimonial: '"Dad lights up when he sees pictures of the grandkids!" - Sarah M.'
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
    testimonial: '"Mom remembers every word to her favorite songs" - James T.'
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
    popular: false
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
    popular: false
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
    popular: false
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
    popular: false
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
                      <div className="flex items-start mb-4">
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <Icon className="w-8 h-8 text-purple-600" />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {storyline.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4">
                        {storyline.description}
                      </p>
                      
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
