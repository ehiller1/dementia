'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings, Clock, Volume2, Bell, Calendar, Save, Upload, Trash2 } from 'lucide-react'

export default function StorylineConfigurationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const [settings, setSettings] = useState({
    name: id === '1' ? 'Family Story Channel' : id === '2' ? 'Music Memory DJ' : 'Nature Walks',
    enabled: true,
    scheduledTime: '14:00',
    sessionDuration: 7,
    voiceSpeed: 0.85,
    voiceVolume: 80,
    autoPlay: true,
    reminderEnabled: true,
    reminderTime: '13:45'
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <Link 
            href="/my-storylines"
            className="inline-flex items-center text-purple-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Storylines
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{settings.name}</h1>
              <p className="text-purple-100">Configuration & Settings</p>
            </div>
            <Settings className="hidden sm:block w-12 h-12 md:w-16 md:h-16 opacity-50" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Basic Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-purple-600" />
              Basic Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storyline Name</label>
                <input 
                  type="text" 
                  value={settings.name}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Storyline</p>
                  <p className="text-sm text-gray-600">Turn on/off this storyline</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.enabled}
                    onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Ritual Timing Settings */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Ritual Timing (Recommended)
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Memory care research shows:</strong> Consistent daily rituals at the same time reduce anxiety and improve engagement.
              Set a regular time for this storyline to create a comforting routine.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label>
                <input 
                  type="time" 
                  value={settings.scheduledTime}
                  onChange={(e) => setSettings({...settings, scheduledTime: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">Best times are typically 10-11 AM or 2-4 PM</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration (minutes)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="5" 
                    max="15" 
                    step="1"
                    value={settings.sessionDuration}
                    onChange={(e) => setSettings({...settings, sessionDuration: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="font-bold text-2xl text-blue-600 w-12">{settings.sessionDuration}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 min</span>
                  <span className="font-semibold text-green-600">7 min (ideal)</span>
                  <span>15 min</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ✓ 7-minute sessions prevent overstimulation while allowing meaningful engagement
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Auto-Play at Scheduled Time</p>
                  <p className="text-sm text-gray-600">Automatically start the storyline</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.autoPlay}
                    onChange={(e) => setSettings({...settings, autoPlay: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Voice & Audio Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Volume2 className="w-6 h-6 text-purple-600" />
              Voice & Audio
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voice Speed</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.2" 
                    step="0.05"
                    value={settings.voiceSpeed}
                    onChange={(e) => setSettings({...settings, voiceSpeed: parseFloat(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="font-bold text-purple-600 w-12">{settings.voiceSpeed.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Slower</span>
                  <span className="font-semibold text-green-600">0.85x (recommended)</span>
                  <span>Faster</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Volume</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={settings.voiceVolume}
                    onChange={(e) => setSettings({...settings, voiceVolume: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="font-bold text-purple-600 w-12">{settings.voiceVolume}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-orange-600" />
              Reminders
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Reminders</p>
                  <p className="text-sm text-gray-600">Gentle notification before session</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.reminderEnabled}
                    onChange={(e) => setSettings({...settings, reminderEnabled: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {settings.reminderEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Time</label>
                  <input 
                    type="time" 
                    value={settings.reminderTime}
                    onChange={(e) => setSettings({...settings, reminderTime: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">15 minutes before scheduled time is recommended</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Management (for Family Story Channel) */}
          {id === '1' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Upload className="w-6 h-6 text-pink-600" />
                Content Management
              </h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-pink-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-pink-400 mb-3" />
                  <p className="text-gray-600 mb-2">Upload family photos and videos</p>
                  <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium">
                    Choose Files
                  </button>
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-2">Current Content (12 items)</p>
                  <div className="space-y-2">
                    {['Emily\'s graduation', 'Family picnic 1987', 'Dad\'s fishing trip'].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{item}</span>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/my-storylines"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium"
            >
              Cancel
            </Link>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2">
              <Save className="w-5 h-5" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
