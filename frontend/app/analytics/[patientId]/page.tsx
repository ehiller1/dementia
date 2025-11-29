'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus, Calendar, MessageSquare, Brain, Eye,
  Heart, Activity, Clock, Award, AlertCircle, ArrowLeft
} from 'lucide-react'

// Mock data - in production, fetch from API
const generateMockData = () => {
  const days = 30
  const data = []
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toISOString().split('T')[0],
      overall: 0.65 + Math.random() * 0.3,
      verbal: Math.floor(3 + Math.random() * 5),
      memory: Math.floor(2 + Math.random() * 4),
      visual: 0.60 + Math.random() * 0.35,
      emotional: -0.2 + Math.random() * 1.0
    })
  }
  return data
}

const COLORS = {
  primary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#A855F7',
  pink: '#EC4899'
}

export default function PatientAnalyticsDashboard() {
  const params = useParams()
  const patientId = params.patientId as string
  
  const [timeRange, setTimeRange] = useState('30')
  const [trendData, setTrendData] = useState(generateMockData())
  const [loading, setLoading] = useState(false)
  
  // Mock overview data
  const overview = {
    patient_name: "Margaret Smith",
    total_sessions: 87,
    avg_engagement_score: 0.76,
    trend: "improving",
    trend_change: +8.3,
    verbal_metrics: {
      avg_responses_per_session: 4.2,
      avg_words_per_session: 45.8,
      conversation_initiation_rate: 0.32,
      avg_clarity: 0.81
    },
    memory_metrics: {
      total_prompts: 156,
      total_attempts: 142,
      accuracy_rate: 0.68,
      avg_confidence: 0.72
    },
    visual_metrics: {
      avg_images_per_session: 3.5,
      recognition_rate: 0.74,
      avg_engagement_duration: 125.3
    },
    emotional_metrics: {
      avg_valence: 0.45,
      positive_rate: 0.78,
      avg_smiles_per_session: 2.8,
      distress_incidents: 3
    },
    best_times: {
      time_of_day: "morning",
      content_type: "family_photos"
    }
  }
  
  // Time of day distribution
  const timeOfDayData = [
    { name: 'Morning', value: 45, score: 0.82 },
    { name: 'Afternoon', value: 30, score: 0.71 },
    { name: 'Evening', value: 12, score: 0.63 }
  ]
  
  // Content effectiveness
  const contentData = [
    { name: 'Family Photos', sessions: 35, score: 0.85 },
    { name: 'Music', sessions: 28, score: 0.79 },
    { name: 'Memory Seeds', sessions: 15, score: 0.72 },
    { name: 'Conversation', sessions: 9, score: 0.68 }
  ]
  
  // Memory accuracy breakdown
  const memoryAccuracyData = [
    { name: 'Accurate', value: 68, color: COLORS.success },
    { name: 'Partial', value: 22, color: COLORS.warning },
    { name: 'No Recall', value: 10, color: COLORS.danger }
  ]
  
  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-600" />
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-600" />
    return <Minus className="w-5 h-5 text-gray-600" />
  }
  
  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-600 bg-green-50'
    if (trend === 'declining') return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <Link 
            href="/caregiver"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Engagement Analytics</h1>
              <p className="text-gray-600 mt-1">{overview.patient_name}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getTrendColor(overview.trend)}`}>
                {getTrendIcon(overview.trend)}
                <span className="font-semibold">{overview.trend_change > 0 ? '+' : ''}{overview.trend_change}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {Math.round(overview.avg_engagement_score * 100)}%
              </span>
            </div>
            <div className="text-sm text-gray-600">Overall Engagement</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {overview.verbal_metrics.avg_responses_per_session.toFixed(1)}
              </span>
            </div>
            <div className="text-sm text-gray-600">Avg Verbal Responses</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {Math.round(overview.memory_metrics.accuracy_rate * 100)}%
              </span>
            </div>
            <div className="text-sm text-gray-600">Memory Accuracy</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {Math.round(overview.visual_metrics.recognition_rate * 100)}%
              </span>
            </div>
            <div className="text-sm text-gray-600">Visual Recognition</div>
          </div>
        </div>
        
        {/* Main Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* Overall Engagement Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4">Overall Engagement Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12}}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                />
                <YAxis domain={[0, 1]} tick={{fontSize: 12}} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [(value * 100).toFixed(0) + '%', 'Engagement']}
                />
                <Area 
                  type="monotone" 
                  dataKey="overall" 
                  stroke={COLORS.primary} 
                  fillOpacity={1} 
                  fill="url(#colorOverall)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Verbal Response Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Verbal Response Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12}}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="verbal" 
                  stroke={COLORS.info} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Verbal Responses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Memory & Visual Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* Memory Recall Accuracy */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-green-600" />
              Memory Recall Accuracy
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12}}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="memory" fill={COLORS.success} name="Accurate Recalls" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Visual Engagement */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-orange-600" />
              Visual Engagement Score
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12}}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                />
                <YAxis domain={[0, 1]} tick={{fontSize: 12}} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [(value * 100).toFixed(0) + '%', 'Recognition']}
                />
                <Line 
                  type="monotone" 
                  dataKey="visual" 
                  stroke="#F97316" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Visual Recognition"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Emotional & Distribution Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          
          {/* Emotional Valence */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-600" />
              Emotional Valence
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorEmotional" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.pink} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.pink} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10}}
                  hide
                />
                <YAxis domain={[-1, 1]} tick={{fontSize: 12}} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [value.toFixed(2), 'Valence']}
                />
                <Area 
                  type="monotone" 
                  dataKey="emotional" 
                  stroke={COLORS.pink} 
                  fillOpacity={1} 
                  fill="url(#colorEmotional)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-green-50 p-2 rounded text-center">
                <div className="font-bold text-green-700">{Math.round(overview.emotional_metrics.positive_rate * 100)}%</div>
                <div className="text-gray-600 text-xs">Positive</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded text-center">
                <div className="font-bold text-yellow-700">{overview.emotional_metrics.avg_smiles_per_session}</div>
                <div className="text-gray-600 text-xs">Smiles/Session</div>
              </div>
            </div>
          </div>
          
          {/* Memory Accuracy Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4">Memory Accuracy Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={memoryAccuracyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {memoryAccuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {memoryAccuracyData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded mr-2" style={{backgroundColor: item.color}}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Time of Day Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Best Times
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeOfDayData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 1]} tick={{fontSize: 12}} />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip formatter={(value: any) => [(value * 100).toFixed(0) + '%', 'Score']} />
                <Bar dataKey="score" fill={COLORS.info} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center text-sm">
                <Award className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-gray-700">
                  <strong>Best time:</strong> {overview.best_times.time_of_day}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Effectiveness */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-bold mb-4">Content Effectiveness</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis yAxisId="left" tick={{fontSize: 12}} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tick={{fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sessions" fill={COLORS.info} name="Sessions" />
              <Bar yAxisId="right" dataKey="score" fill={COLORS.success} name="Engagement Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold">Detailed Metrics Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Measurement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Verbal Response</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Responses per session</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{overview.verbal_metrics.avg_responses_per_session.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Good
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Verbal Response</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Words per session</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{overview.verbal_metrics.avg_words_per_session.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Good
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Verbal Response</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Speech clarity</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{Math.round(overview.verbal_metrics.avg_clarity * 100)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Good
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Memory Recitation</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Accuracy rate</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{Math.round(overview.memory_metrics.accuracy_rate * 100)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Fair
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Memory Recitation</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Recall confidence</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{Math.round(overview.memory_metrics.avg_confidence * 100)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Good
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Visual Engagement</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Recognition rate</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{Math.round(overview.visual_metrics.recognition_rate * 100)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Good
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Visual Engagement</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Avg engagement duration</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{overview.visual_metrics.avg_engagement_duration.toFixed(0)}s</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Good
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Emotional Response</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Positive emotion rate</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{Math.round(overview.emotional_metrics.positive_rate * 100)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Excellent
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Emotional Response</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Smiles per session</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{overview.emotional_metrics.avg_smiles_per_session.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Good
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Emotional Response</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Distress incidents</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{overview.emotional_metrics.distress_incidents}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Low
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  )
}
