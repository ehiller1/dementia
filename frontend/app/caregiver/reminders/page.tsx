'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  Bell, 
  Pill, 
  Utensils, 
  Droplet,
  Heart,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle
} from 'lucide-react'

interface Reminder {
  id: number
  title: string
  type: 'medication' | 'meal' | 'hydration' | 'activity' | 'other'
  time: string
  frequency: 'once' | 'daily' | 'weekly'
  days?: string[]
  active: boolean
  patient_name: string
  notes?: string
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 1,
      title: 'Morning Medication',
      type: 'medication',
      time: '08:00',
      frequency: 'daily',
      active: true,
      patient_name: 'Margaret Smith',
      notes: 'Blood pressure medication with breakfast'
    },
    {
      id: 2,
      title: 'Lunch Time',
      type: 'meal',
      time: '12:00',
      frequency: 'daily',
      active: true,
      patient_name: 'Margaret Smith'
    },
    {
      id: 3,
      title: 'Afternoon Walk',
      type: 'activity',
      time: '15:00',
      frequency: 'daily',
      active: true,
      patient_name: 'Robert Johnson',
      notes: 'Weather permitting'
    },
    {
      id: 4,
      title: 'Evening Medication',
      type: 'medication',
      time: '20:00',
      frequency: 'daily',
      active: true,
      patient_name: 'Margaret Smith',
      notes: 'Take with water'
    },
    {
      id: 5,
      title: 'Water Break',
      type: 'hydration',
      time: '10:00',
      frequency: 'daily',
      active: true,
      patient_name: 'Robert Johnson'
    }
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill className="w-6 h-6" />
      case 'meal': return <Utensils className="w-6 h-6" />
      case 'hydration': return <Droplet className="w-6 h-6" />
      case 'activity': return <Heart className="w-6 h-6" />
      default: return <Bell className="w-6 h-6" />
    }
  }

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'medication': return 'from-blue-500 to-blue-600'
      case 'meal': return 'from-orange-500 to-orange-600'
      case 'hydration': return 'from-cyan-500 to-cyan-600'
      case 'activity': return 'from-green-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const toggleReminder = (id: number) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, active: !r.active } : r
    ))
  }

  const deleteReminder = (id: number) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      setReminders(reminders.filter(r => r.id !== id))
    }
  }

  const sortedReminders = [...reminders].sort((a, b) => {
    const timeA = a.time.split(':').map(Number)
    const timeB = b.time.split(':').map(Number)
    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link 
            href="/caregiver"
            className="inline-flex items-center text-orange-100 hover:text-white mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Manage Reminders</h1>
              <p className="text-orange-100 text-sm sm:text-base">Set up medication, meals, and activity reminders</p>
            </div>
            <Calendar className="hidden sm:block w-12 h-12 md:w-16 md:h-16 opacity-50" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Add Reminder Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Reminder
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Create New Reminder</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Morning Medication"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                    <option value="medication">Medication</option>
                    <option value="meal">Meal</option>
                    <option value="hydration">Hydration</option>
                    <option value="activity">Activity</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input 
                    type="time" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">One Time</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea 
                    placeholder="Additional instructions or notes"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-24"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium">
                  Save Reminder
                </button>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Reminders</p>
                  <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
                </div>
                <Bell className="w-10 h-10 text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active</p>
                  <p className="text-2xl font-bold text-green-600">{reminders.filter(r => r.active).length}</p>
                </div>
                <Check className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Medications</p>
                  <p className="text-2xl font-bold text-blue-600">{reminders.filter(r => r.type === 'medication').length}</p>
                </div>
                <Pill className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Today</p>
                  <p className="text-2xl font-bold text-purple-600">{reminders.filter(r => r.frequency === 'daily' && r.active).length}</p>
                </div>
                <Calendar className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Reminders List */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Daily Schedule</h2>
              <p className="text-gray-600 text-sm mt-1">All reminders sorted by time</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {sortedReminders.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No reminders set up yet</p>
                  <p className="text-gray-400 text-sm mt-2">Click "Add New Reminder" to get started</p>
                </div>
              ) : (
                sortedReminders.map((reminder) => (
                  <div 
                    key={reminder.id}
                    className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${!reminder.active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getReminderColor(reminder.type)} flex items-center justify-center text-white flex-shrink-0`}>
                        {getReminderIcon(reminder.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{reminder.title}</h3>
                            <p className="text-sm text-gray-600">{reminder.patient_name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900 text-lg">{reminder.time}</span>
                          </div>
                        </div>

                        {reminder.notes && (
                          <p className="text-sm text-gray-600 mb-2">{reminder.notes}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                            {reminder.type}
                          </span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                            {reminder.frequency}
                          </span>
                          {reminder.active ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium flex items-center gap-1">
                              <X className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleReminder(reminder.id)}
                          className={`p-2 rounded-lg ${reminder.active ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                          title={reminder.active ? 'Deactivate' : 'Activate'}
                        >
                          {reminder.active ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setEditingId(reminder.id)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Add Common Reminders</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-4 text-left transition-colors">
                <Pill className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-semibold text-blue-900">Morning Meds</p>
                <p className="text-sm text-blue-700">8:00 AM</p>
              </button>
              <button className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-lg p-4 text-left transition-colors">
                <Utensils className="w-8 h-8 text-orange-600 mb-2" />
                <p className="font-semibold text-orange-900">Lunch Time</p>
                <p className="text-sm text-orange-700">12:00 PM</p>
              </button>
              <button className="bg-cyan-50 hover:bg-cyan-100 border-2 border-cyan-200 rounded-lg p-4 text-left transition-colors">
                <Droplet className="w-8 h-8 text-cyan-600 mb-2" />
                <p className="font-semibold text-cyan-900">Water Break</p>
                <p className="text-sm text-cyan-700">Every 2 hours</p>
              </button>
              <button className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg p-4 text-left transition-colors">
                <Heart className="w-8 h-8 text-green-600 mb-2" />
                <p className="font-semibold text-green-900">Exercise Time</p>
                <p className="text-sm text-green-700">3:00 PM</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
