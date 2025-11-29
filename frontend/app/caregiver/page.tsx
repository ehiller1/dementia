'use client'

import { useState, useEffect } from 'react'
import { 
  AlertCircle, 
  Bell, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShoppingCart,
  Sparkles,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'

interface PatientCard {
  patient_id: number
  patient_name: string
  last_interaction: string | null
  conversations_today: number
  conversations_this_week: number
  active_alerts: number
  average_sentiment_7d: number | null
  engagement_trend: string
}

export default function CaregiverDashboard() {
  const [patients, setPatients] = useState<PatientCard[]>([])
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])

  // Mock data for demonstration
  useEffect(() => {
    const mockPatients: PatientCard[] = [
      {
        patient_id: 1,
        patient_name: 'Margaret Smith',
        last_interaction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        conversations_today: 3,
        conversations_this_week: 18,
        active_alerts: 0,
        average_sentiment_7d: 0.65,
        engagement_trend: 'stable'
      },
      {
        patient_id: 2,
        patient_name: 'Robert Johnson',
        last_interaction: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        conversations_today: 5,
        conversations_this_week: 24,
        active_alerts: 1,
        average_sentiment_7d: 0.45,
        engagement_trend: 'declining'
      }
    ]
    setPatients(mockPatients)

    const mockAlerts = [
      {
        id: 1,
        patient_name: 'Robert Johnson',
        alert_type: 'distress',
        severity: 'warning',
        title: 'Reported Confusion',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        acknowledged: false
      }
    ]
    setAlerts(mockAlerts)
  }, [])

  const getTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 60) return `${diffMins} minutes ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  }

  const getSentimentLabel = (sentiment: number | null) => {
    if (sentiment === null) return { label: 'Unknown', color: 'text-gray-500' }
    if (sentiment >= 0.6) return { label: 'Positive', color: 'text-green-600' }
    if (sentiment >= 0.3) return { label: 'Neutral', color: 'text-yellow-600' }
    return { label: 'Needs Attention', color: 'text-red-600' }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'declining':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Caregiver Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor and support your patients</p>
            </div>
            <div className="flex gap-4">
              <Link 
                href="/my-storylines" 
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium flex items-center gap-2 relative"
              >
                <Sparkles className="w-5 h-5" />
                My Storylines
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  NEW
                </span>
              </Link>
              <button className="relative p-3 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6" />
                {alerts.filter(a => !a.acknowledged).length > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
              <Link href="/" className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Alerts Section */}
        {alerts.filter(a => !a.acknowledged).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Active Alerts
            </h2>
            <div className="space-y-3">
              {alerts.filter(a => !a.acknowledged).map(alert => (
                <div key={alert.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{alert.patient_name}</span>
                      <span className="text-sm text-gray-600">{getTimeAgo(alert.created_at)}</span>
                    </div>
                    <p className="text-gray-900 mt-1">{alert.title}</p>
                    <p className="text-sm text-gray-600 mt-1">Type: {alert.alert_type}</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Patients Overview</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map(patient => {
              const sentiment = getSentimentLabel(patient.average_sentiment_7d)
              return (
                <div
                  key={patient.patient_id}
                  className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-100 hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => setSelectedPatient(patient.patient_id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{patient.patient_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Last active: {getTimeAgo(patient.last_interaction)}
                      </p>
                    </div>
                    {patient.active_alerts > 0 && (
                      <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                        {patient.active_alerts} Alert{patient.active_alerts > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Today
                      </span>
                      <span className="font-semibold">{patient.conversations_today} chats</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        This Week
                      </span>
                      <span className="font-semibold">{patient.conversations_this_week} chats</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Mood
                      </span>
                      <span className={`font-semibold ${sentiment.color}`}>{sentiment.label}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Engagement</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(patient.engagement_trend)}
                        <span className="font-semibold capitalize">{patient.engagement_trend}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <Link 
                      href={`/analytics/${patient.patient_id}`}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-center"
                    >
                      Analytics
                    </Link>
                    <button className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                      Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-5 gap-6">
          <Link href="/training" className="bg-gradient-to-br from-purple-500 to-blue-500 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all relative">
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
              NEW
            </div>
            <BookOpen className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-1">Family Training</h3>
            <p className="text-sm text-purple-100">Learn & get feedback</p>
          </Link>
          
          <Link href="/caregiver/reminders" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <Calendar className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Reminders</h3>
            <p className="text-sm text-gray-600">Set up and edit reminders</p>
          </Link>

          <Link href="/caregiver/memories" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <Heart className="w-8 h-8 text-pink-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Memory Book</h3>
            <p className="text-sm text-gray-600">Add photos and stories</p>
          </Link>

          <Link href="/caregiver/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Reports</h3>
            <p className="text-sm text-gray-600">View analytics and trends</p>
          </Link>

          <Link href="/caregiver/settings" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <Clock className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
            <p className="text-sm text-gray-600">Configure preferences</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
