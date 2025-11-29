'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Clock, Users, Star, Play, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

// Mock storyline data (in production, fetch from API based on slug)
const storylineData: Record<string, any> = {
  'family-story-channel': {
    name: 'Family Story Channel',
    description: 'Turn family photos and memories into warm, repeatable conversations',
    longDescription: `The Family Story Channel transforms your family photos and memories into personalized, 
    engaging narratives that create meaningful moments with your loved one. Our AI narrator weaves together 
    images, names, and family notes into gentle stories that validate feelings and spark connection - never 
    testing memory, always celebrating it.`,
    category: 'Family & Connection',
    tier: 'interactive',
    price_monthly: 14.99,
    setup_time_minutes: 15,
    benefits: [
      'Upload unlimited family photos',
      'AI creates warm, personalized narratives',
      'Gentle conversation prompts (never tests memory)',
      'Family can add tone notes and guidance',
      'Weekly engagement reports',
      'Track which photos spark the most joy'
    ],
    howItWorks: [
      'Upload 5-10 meaningful family photos',
      'Add names, dates, and brief descriptions',
      'Include optional "tone notes" (e.g., "This always makes her smile")',
      'AI narrator creates a 5-10 minute story session',
      'Sessions run on schedule or on-demand',
      'Review engagement analytics to see what resonates'
    ],
    requirements: [
      'Requires family photo uploads',
      'Setup takes approximately 15 minutes',
      'Best with 10+ photos for variety',
      'Can add more content anytime'
    ],
    testimonials: [
      {
        name: 'Sarah M.',
        relation: 'Daughter',
        text: 'Dad lights up every time he sees pictures of the grandkids. The AI narrator tells the stories so gently - it feels like talking to an old friend.',
        rating: 5
      },
      {
        name: 'James T.',
        relation: 'Son',
        text: 'I was skeptical at first, but Mom engages more with these photo sessions than anything else we\'ve tried. Worth every penny.',
        rating: 5
      }
    ],
    faqs: [
      {
        question: 'What if my loved one doesn\'t remember the people in photos?',
        answer: 'That\'s perfectly okay! The AI narrator validates any response. If they don\'t remember, it gently shares who they are without testing or correcting.'
      },
      {
        question: 'How often should we run sessions?',
        answer: 'Most families schedule 3-5 times per week. You can set a schedule or run on-demand based on mood and energy.'
      },
      {
        question: 'Can I add more photos later?',
        answer: 'Absolutely! Add photos anytime through the family dashboard. New content is automatically incorporated into future sessions.'
      }
    ]
  },
  'music-memory-dj': {
    name: 'Music Memory DJ',
    description: 'Personalized music sessions from their era that spark joy and memories',
    longDescription: `Music reaches parts of the brain that dementia cannot touch. The Music Memory DJ curates 
    personalized playlists from your loved one's era, creating moments of joy, comfort, and connection through 
    familiar melodies. People who struggle to speak can often sing entire songs from their youth.`,
    category: 'Music & Relaxation',
    tier: 'core',
    price_monthly: 9.99,
    setup_time_minutes: 5,
    benefits: [
      'Curated playlists by decade (1940s-1990s)',
      'Mood-based music selection',
      'Tracks favorite songs automatically',
      'Gentle sing-along encouragement',
      'Calming music for agitation',
      'Family can request specific songs'
    ],
    testimonials: [
      {
        name: 'Linda K.',
        relation: 'Wife',
        text: 'My husband doesn\'t remember much anymore, but he remembers every word to Frank Sinatra. Music brings him back to me.',
        rating: 5
      }
    ]
  },
  'nature-walks': {
    name: 'Nature Walks',
    description: 'Calming virtual nature experiences with soothing narration',
    longDescription: `Take your loved one on peaceful virtual nature walks with gentle narration and calming 
    imagery. Perfect for reducing anxiety, promoting relaxation, and providing sensory comfort through the 
    healing power of nature.`,
    category: 'Music & Relaxation',
    tier: 'core',
    price_monthly: 9.99,
    setup_time_minutes: 0,
    benefits: [
      'Multiple scenic locations (forest, beach, garden, mountain)',
      'Gentle mindfulness guidance',
      'Reduces anxiety and agitation',
      'Soothing nature sounds',
      'Adjusts to energy levels',
      'No setup required - ready to use immediately'
    ]
  }
}

export default function StorylineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [showTrialModal, setShowTrialModal] = useState(false)
  
  const storyline = storylineData[slug]
  
  if (!storyline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Storyline not found</h1>
          <Link href="/marketplace" className="text-purple-600 hover:underline">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <Link 
            href="/marketplace"
            className="inline-flex items-center text-purple-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Link>
          
          <div className="max-w-4xl">
            <div className="inline-block bg-white/20 rounded-full px-3 py-1 text-sm mb-4">
              {storyline.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{storyline.name}</h1>
            <p className="text-xl text-purple-100 mb-6">{storyline.description}</p>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-3xl font-bold">${storyline.price_monthly}/month</div>
              <button
                onClick={() => setShowTrialModal(true)}
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-50 transition-colors"
              >
                Start 7-Day Free Trial →
              </button>
              {storyline.setup_time_minutes > 0 && (
                <div className="flex items-center text-purple-100 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  ~{storyline.setup_time_minutes} min setup
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Long Description */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">About This Storyline</h2>
            <p className="text-gray-700 leading-relaxed">{storyline.longDescription}</p>
          </div>

          {/* Benefits */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">What's Included</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {storyline.benefits.map((benefit: string, idx: number) => (
                <div key={idx} className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          {storyline.howItWorks && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">How It Works</h2>
              <div className="space-y-4">
                {storyline.howItWorks.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-start">
                    <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials */}
          {storyline.testimonials && storyline.testimonials.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">What Families Say</h2>
              <div className="space-y-4">
                {storyline.testimonials.map((testimonial: any, idx: number) => (
                  <div key={idx} className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-3">"{testimonial.text}"</p>
                    <p className="text-sm text-gray-600">
                      — {testimonial.name}, {testimonial.relation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {storyline.faqs && storyline.faqs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {storyline.faqs.map((faq: any, idx: number) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-8 text-center border border-purple-200">
            <h2 className="text-2xl font-bold mb-4">Ready to Try {storyline.name}?</h2>
            <p className="text-gray-700 mb-6">
              Start your 7-day free trial. No credit card required. Cancel anytime.
            </p>
            <button
              onClick={() => setShowTrialModal(true)}
              className="bg-purple-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-purple-700 transition-colors text-lg"
            >
              Start Free Trial →
            </button>
            <p className="text-sm text-gray-600 mt-4">
              After trial: ${storyline.price_monthly}/month • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Trial Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Start Your Free Trial</h3>
            <p className="text-gray-600 mb-6">
              To start your 7-day free trial of {storyline.name}, you'll need to:
            </p>
            <ol className="space-y-3 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">1</span>
                Sign in or create a family account
              </li>
              <li className="flex items-start">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">2</span>
                Select which loved one this is for
              </li>
              <li className="flex items-start">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">3</span>
                Complete quick setup (if required)
              </li>
            </ol>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTrialModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push('/auth/signup?trial=' + slug)}
                className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-700"
              >
                Continue →
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              No credit card required for trial
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
