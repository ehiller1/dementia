'use client'

import Link from 'next/link'
import { Menu, X, Home, Users, BookOpen, Heart, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-900 hidden sm:inline">Memory Care</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link href="/patient" className="text-gray-700 hover:text-blue-600 font-medium">
              For Patients
            </Link>
            <Link href="/caregiver" className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Caregivers
            </Link>
            <Link 
              href="/training" 
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Family Training
            </Link>
            <Link href="/marketplace" className="text-gray-700 hover:text-purple-600 font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Storylines
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link 
                href="/patient" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Patients
              </Link>
              <Link 
                href="/caregiver" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="w-4 h-4" />
                Caregivers
              </Link>
              <Link 
                href="/training" 
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 rounded-lg font-bold hover:from-purple-600 hover:to-blue-600 transition-all flex items-center gap-2 justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="w-5 h-5" />
                Family Training (Mobile Optimized)
              </Link>
              <Link 
                href="/marketplace" 
                className="text-gray-700 hover:text-purple-600 font-medium py-2 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart className="w-4 h-4" />
                Storylines
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
