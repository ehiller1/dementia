'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, CreditCard, Lock, Heart, BookOpen, Sparkles } from 'lucide-react'

const checkoutStorylines: Record<string, {
  name: string
  priceMonthly: number
  ritualType: string
  description: string
}> = {
  'family-story-channel': {
    name: 'Family Story Channel',
    priceMonthly: 14.99,
    ritualType: 'Connection Ritual',
    description: 'Turn family photos into a daily connection ritual using gentle stories and prompts.'
  },
  'music-memory-dj': {
    name: 'Music Memory DJ',
    priceMonthly: 9.99,
    ritualType: 'Comfort Ritual',
    description: 'Predictable music sessions from their era that bring comfort and joy.'
  },
  'nature-walks': {
    name: 'Nature Walks',
    priceMonthly: 9.99,
    ritualType: 'Comfort Ritual',
    description: 'Calming nature scenes with soothing narration for a daily relaxation ritual.'
  },
  'grandchild-messenger': {
    name: 'Grandchild Messenger',
    priceMonthly: 14.99,
    ritualType: 'Connection Ritual',
    description: 'Simple, guided messages between grandchildren and grandparents.'
  },
  'gardeners-corner': {
    name: "Gardener's Corner",
    priceMonthly: 19.99,
    ritualType: 'Identity Ritual',
    description: 'Honor lifelong gardening identity with daily plant and garden conversations.'
  },
  'veteran-companion': {
    name: 'Veteran Companion',
    priceMonthly: 19.99,
    ritualType: 'Identity Ritual',
    description: 'Respectful conversations that honor military service without triggering trauma.'
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = searchParams.get('slug') ?? 'family-story-channel'
  const trial = searchParams.get('trial') === 'true'
  const storyline = checkoutStorylines[slug] ?? checkoutStorylines['family-story-channel']

  const [caregiverName, setCaregiverName] = useState('')
  const [email, setEmail] = useState('')
  const [completed, setCompleted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation this would call your backend / payment provider
    setCompleted(true)
    // Optionally, you could also route to /my-storylines after a delay
    // setTimeout(() => router.push('/my-storylines'), 1500)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center text-purple-100 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Checkout</h1>
            <p className="text-purple-100 text-sm sm:text-base">
              Complete your {trial ? 'free trial' : 'subscription'} for
              {" "}
              <span className="font-semibold">{storyline.name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-8 items-start">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-4">Caregiver Details</h2>

            {completed ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="w-6 h-6 text-green-600" />
                  <p className="text-lg font-semibold text-green-800">Trial activated</p>
                </div>
                <p className="text-sm text-green-900 mb-2">
                  Your {trial ? '7-day free trial' : 'subscription'} for {storyline.name} is now active.
                </p>
                <p className="text-sm text-gray-700">
                  You can manage this storyline from <Link href="/my-storylines" className="text-purple-600 underline">My Storylines</Link>.
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                  <input
                    type="text"
                    value={caregiverName}
                    onChange={(e) => setCaregiverName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Sarah Johnson"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {!trial && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    Payment details (demo)
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Card number"
                    />
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="MM/YY"
                    />
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="CVC"
                    />
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="ZIP / Postal code"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    This is a demo checkout; no real payment is processed.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                {trial ? 'Start Free Trial' : 'Complete Purchase'}
              </button>
            </form>
          </div>

          {/* Order Summary & Coaching Integration */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-4">Order summary</h2>
              <div className="mb-4">
                <p className="font-semibold text-gray-900">{storyline.name}</p>
                <p className="text-sm text-gray-600 mb-1">{storyline.ritualType}</p>
                <p className="text-sm text-gray-700">{storyline.description}</p>
              </div>
              <div className="border-t pt-4 mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Today</span>
                <span className="text-base font-semibold text-gray-900">{trial ? '$0.00 (7-day trial)' : `$${storyline.priceMonthly.toFixed(2)}`}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                <span>After trial</span>
                <span>${storyline.priceMonthly.toFixed(2)}/month</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-6 h-6 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">Coaching & Training</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                For best results, pair this storyline with the{' '}
                <span className="font-semibold">Family Training</span> module. It coaches family members on how to
                talk with someone living with memory loss using the same ritual patterns.
              </p>
              <Link
                href="/training"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                Open Training Module
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 flex items-start gap-3">
              <Heart className="w-5 h-5 text-pink-500 mt-1" />
              <p className="text-xs text-gray-600">
                Short, predictable daily rituals (about 7 minutes) work best. This checkout flow is designed so
                every storyline can be scheduled as part of a gentle daily pattern for your loved one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
