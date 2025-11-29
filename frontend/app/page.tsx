import Link from 'next/link'
import Image from 'next/image'
import { Heart, Users, Shield, Calendar, ShoppingCart, Sparkles, Star, Clock, Brain, Smile, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section with Background Image */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=1600')] bg-cover bg-center" />
        </div>
        <div className="container mx-auto px-4 py-20 sm:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Memory Care Companion
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              AI-powered support and companionship for individuals living with dementia
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/patient" className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg">
                Start Now
              </Link>
              <Link href="/training" className="bg-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-600 transition-colors shadow-lg">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          <Link href="/patient" className="block">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-100 hover:border-blue-300 h-full">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">For Patients</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Start a conversation, play activities, and get gentle reminders
              </p>
              <div className="mt-4 text-blue-600 font-medium">
                Start Talking →
              </div>
            </div>
          </Link>

          <Link href="/caregiver" className="block">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-green-100 hover:border-green-300 h-full">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">Caregiver Dashboard</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Monitor wellbeing, manage reminders, and receive alerts
              </p>
              <div className="mt-4 text-green-600 font-medium">
                View Dashboard →
              </div>
            </div>
          </Link>

          <Link href="/training" className="block">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-purple-400 hover:border-purple-600 relative overflow-hidden h-full text-white">
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                MOBILE OPTIMIZED
              </div>
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">Family Training</h2>
              <p className="text-purple-100 text-sm sm:text-base">
                Learn how to communicate with someone who has memory loss
              </p>
              <div className="mt-4 font-medium">
                Start Learning →
              </div>
            </div>
          </Link>

          <Link href="/marketplace" className="block">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-purple-200 hover:border-purple-400 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                NEW
              </div>
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">Storylines</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Specialized modules - family stories, music, hobbies
              </p>
              <div className="mt-4 text-purple-600 font-medium flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse →
              </div>
            </div>
          </Link>
        </div>

        {/* Real-World Use Cases with Images */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">See It In Action</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Real families, real connections, real peace of mind
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="relative group overflow-hidden rounded-2xl shadow-xl">
              <div className="aspect-video relative">
                <Image 
                  src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800" 
                  alt="Caregiver with elderly person" 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Daily Rituals</h3>
                  <p className="text-sm">Consistent, comforting conversations that build trust and reduce anxiety</p>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl shadow-xl">
              <div className="aspect-video relative">
                <Image 
                  src="https://images.unsplash.com/photo-1591035897819-f4bdf739f446?w=800" 
                  alt="Family time with grandparent" 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Family Connection</h3>
                  <p className="text-sm">Keep families informed with real-time updates and insights</p>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl shadow-xl">
              <div className="aspect-video relative">
                <Image 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800" 
                  alt="Memory activities" 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Engaging Activities</h3>
                  <p className="text-sm">Personalized activities based on life history and preferences</p>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl shadow-xl">
              <div className="aspect-video relative">
                <Image 
                  src="https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800" 
                  alt="Peace of mind for caregivers" 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Peace of Mind</h3>
                  <p className="text-sm">24/7 monitoring with intelligent alerts for caregivers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
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

        {/* Stats Section with Icons */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Proven Results</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Smile className="w-10 h-10 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">89%</div>
                <p className="text-gray-700">Reduced anxiety</p>
              </div>
              <div className="text-center">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Heart className="w-10 h-10 text-red-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">95%</div>
                <p className="text-gray-700">Family satisfaction</p>
              </div>
              <div className="text-center">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Clock className="w-10 h-10 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">7 min</div>
                <p className="text-gray-700">Avg. daily session</p>
              </div>
              <div className="text-center">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Brain className="w-10 h-10 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
                <p className="text-gray-700">AI support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials with Pictures */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">What Families Say</h2>
          <p className="text-center text-gray-600 mb-12">Real stories from real caregivers</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "This has been a game-changer for our family. My mother looks forward to her daily conversations, and I finally have peace of mind."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl mr-3">
                  S
                </div>
                <div>
                  <div className="font-semibold">Sarah M.</div>
                  <div className="text-sm text-gray-500">Daughter & Caregiver</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "The training module taught me how to truly connect with my dad. I wish I had found this years ago."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl mr-3">
                  M
                </div>
                <div>
                  <div className="font-semibold">Michael R.</div>
                  <div className="text-sm text-gray-500">Son & Primary Caregiver</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Amazing support system. The alerts help me stay connected while maintaining my own life. It's like having a caring assistant 24/7."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl mr-3">
                  L
                </div>
                <div>
                  <div className="font-semibold">Lisa K.</div>
                  <div className="text-sm text-gray-500">Professional Caregiver</div>
                </div>
              </div>
            </div>
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
