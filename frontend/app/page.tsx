import Link from 'next/link'
import { Heart, Users, Shield, Calendar, ShoppingCart, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Memory Care Companion
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered support and companionship for individuals living with dementia
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <Link href="/patient" className="block">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-100 hover:border-blue-300">
              <Heart className="w-12 h-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-semibold mb-3">For Patients</h2>
              <p className="text-gray-600">
                Start a conversation, play activities, and get gentle reminders throughout your day
              </p>
              <div className="mt-4 text-blue-600 font-medium">
                Start Talking →
              </div>
            </div>
          </Link>

          <Link href="/caregiver" className="block">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-green-100 hover:border-green-300">
              <Users className="w-12 h-12 text-green-600 mb-4" />
              <h2 className="text-2xl font-semibold mb-3">For Caregivers</h2>
              <p className="text-gray-600">
                Monitor wellbeing, manage reminders, and receive important alerts about your loved ones
              </p>
              <div className="mt-4 text-green-600 font-medium">
                View Dashboard →
              </div>
            </div>
          </Link>

          <Link href="/marketplace" className="block">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-purple-200 hover:border-purple-400 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                NEW
              </div>
              <Sparkles className="w-12 h-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-semibold mb-3">Storylines</h2>
              <p className="text-gray-600">
                Enhance the experience with specialized modules - family stories, music, hobbies, and more
              </p>
              <div className="mt-4 text-purple-600 font-medium flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse Marketplace →
              </div>
            </div>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <Shield className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="font-semibold mb-2">Safe & Secure</h3>
            <p className="text-sm text-gray-600">
              Built with safety protocols and emergency alerts to ensure wellbeing
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <Calendar className="w-10 h-10 text-orange-600 mb-3" />
            <h3 className="font-semibold mb-2">Daily Support</h3>
            <p className="text-sm text-gray-600">
              Reminders for medications, meals, and activities with gentle escalation
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <Heart className="w-10 h-10 text-red-600 mb-3" />
            <h3 className="font-semibold mb-2">Personalized Care</h3>
            <p className="text-sm text-gray-600">
              Remembers personal history, preferences, and adapts to cognitive needs
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            This system is designed to support, not replace, human care. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </main>
  )
}
