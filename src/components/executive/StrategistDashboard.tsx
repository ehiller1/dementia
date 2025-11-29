/**
 * Strategist Dashboard - Long-term Planning & Cross-Functional Coordination
 * 
 * Focus: Strategic planning, scenario modeling, cross-functional impact
 * Information Density: Low (strategic overview)
 * Time Horizon: Long-term (weeks to months)
 */

import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, Users, MapPin, Calendar, AlertTriangle, CheckCircle, ArrowRight, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { eventBus } from '@/services/events/EventBus';

interface StrategicInitiative {
  id: string;
  title: string;
  status: 'planning' | 'in_progress' | 'at_risk' | 'completed';
  timeline: string;
  impact: string[];
  confidence: number;
  dependencies: string[];
}

interface Scenario {
  id: string;
  name: string;
  probability: number;
  outcome: 'positive' | 'neutral' | 'negative';
  impact: number;
  kpis: { metric: string; projected: string }[];
}

interface CrossFunctionalImpact {
  department: string;
  impact: string;
  priority: 'low' | 'medium' | 'high';
  alignment: number;
}

export function StrategistDashboard() {
  const [initiatives, setInitiatives] = useState<StrategicInitiative[]>([
    {
      id: '1',
      title: 'Digital Transformation Initiative',
      status: 'in_progress',
      timeline: 'Q4 2025 - Q2 2026',
      impact: ['Operations', 'Technology', 'Customer Experience'],
      confidence: 78,
      dependencies: ['Budget Approval', 'Technical Infrastructure']
    },
    {
      id: '2',
      title: 'Market Expansion Strategy',
      status: 'planning',
      timeline: 'Q1 2026 - Q4 2026',
      impact: ['Sales', 'Marketing', 'Supply Chain'],
      confidence: 65,
      dependencies: ['Market Research', 'Capital Allocation']
    },
    {
      id: '3',
      title: 'Operational Excellence Program',
      status: 'in_progress',
      timeline: 'Q3 2025 - Q1 2026',
      impact: ['Operations', 'Finance', 'HR'],
      confidence: 82,
      dependencies: ['Process Mapping', 'Change Management']
    }
  ]);

  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: '1',
      name: 'Aggressive Growth',
      probability: 35,
      outcome: 'positive',
      impact: 85,
      kpis: [
        { metric: 'Revenue Growth', projected: '+45%' },
        { metric: 'Market Share', projected: '+12%' },
        { metric: 'Customer Acquisition', projected: '+60%' }
      ]
    },
    {
      id: '2',
      name: 'Steady State',
      probability: 50,
      outcome: 'neutral',
      impact: 60,
      kpis: [
        { metric: 'Revenue Growth', projected: '+15%' },
        { metric: 'Market Share', projected: '+3%' },
        { metric: 'Customer Acquisition', projected: '+20%' }
      ]
    },
    {
      id: '3',
      name: 'Market Contraction',
      probability: 15,
      outcome: 'negative',
      impact: 40,
      kpis: [
        { metric: 'Revenue Growth', projected: '-5%' },
        { metric: 'Market Share', projected: '-2%' },
        { metric: 'Customer Acquisition', projected: '+5%' }
      ]
    }
  ]);

  const [crossFunctional, setCrossFunctional] = useState<CrossFunctionalImpact[]>([
    { department: 'Sales', impact: 'New market entry requires expanded sales team', priority: 'high', alignment: 85 },
    { department: 'Operations', impact: 'Process automation reduces manual overhead', priority: 'high', alignment: 92 },
    { department: 'Finance', impact: 'Capital requirements for expansion', priority: 'medium', alignment: 78 },
    { department: 'Technology', impact: 'Infrastructure scaling needed', priority: 'high', alignment: 88 },
    { department: 'HR', impact: 'Talent acquisition and training programs', priority: 'medium', alignment: 75 }
  ]);

  useEffect(() => {
    // Subscribe to strategic planning events
    const strategySub = eventBus.subscribe('strategy.initiative_updated', (event) => {
      setInitiatives(prev => {
        const updated = [...prev];
        const index = updated.findIndex(i => i.id === event.id);
        if (index >= 0) {
          updated[index] = { ...updated[index], ...event.updates };
        }
        return updated;
      });
    });

    return () => {
      strategySub.unsubscribe();
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={20} />;
      case 'in_progress': return <TrendingUp className="text-blue-500" size={20} />;
      case 'at_risk': return <AlertTriangle className="text-orange-500" size={20} />;
      default: return <Calendar className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'in_progress': return 'bg-blue-50 border-blue-200';
      case 'at_risk': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="strategist-dashboard p-6 space-y-6 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Target className="text-purple-600" />
            <span>Strategic Planning Center</span>
          </h1>
          <p className="text-gray-600 mt-1">Long-term planning and cross-functional coordination</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Planning Horizon</div>
          <div className="text-lg font-semibold text-purple-600">12-18 Months</div>
        </div>
      </div>

      {/* Strategic Initiatives */}
      <Card className="p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Strategic Initiatives</h2>
          <Button variant="outline" size="sm">
            <Target size={16} className="mr-1" />
            New Initiative
          </Button>
        </div>
        <div className="space-y-4">
          {initiatives.map((initiative) => (
            <div
              key={initiative.id}
              className={`border rounded-lg p-4 ${getStatusColor(initiative.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(initiative.status)}
                    <h3 className="font-semibold text-gray-900">{initiative.title}</h3>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{initiative.timeline}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Layers size={14} />
                      <span>{initiative.impact.length} departments</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-purple-600">{initiative.confidence}%</div>
                </div>
              </div>
              <div className="mb-3">
                <Progress value={initiative.confidence} className="h-2" />
              </div>
              <div className="flex flex-wrap gap-2">
                {initiative.impact.map((dept) => (
                  <span key={dept} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Scenario Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{scenario.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getOutcomeColor(scenario.outcome)}`}>
                {scenario.outcome}
              </span>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Probability</span>
                <span className="font-semibold">{scenario.probability}%</span>
              </div>
              <Progress value={scenario.probability} className="h-2 mb-3" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Business Impact</span>
                <span className="font-semibold">{scenario.impact}/100</span>
              </div>
              <Progress value={scenario.impact} className="h-2" />
            </div>
            <div className="space-y-2 border-t pt-3">
              <h4 className="text-sm font-semibold text-gray-700">Projected KPIs</h4>
              {scenario.kpis.map((kpi, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{kpi.metric}</span>
                  <span className="font-semibold text-gray-900">{kpi.projected}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Cross-Functional Impact */}
      <Card className="p-6 bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cross-Functional Impact Analysis</h2>
        <div className="space-y-3">
          {crossFunctional.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Users size={16} className="text-purple-600" />
                    <h3 className="font-semibold text-gray-900">{item.department}</h3>
                    <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority} priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.impact}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-500 mb-1">Alignment</div>
                  <div className="text-lg font-bold text-purple-600">{item.alignment}%</div>
                </div>
              </div>
              <div className="mt-2">
                <Progress value={item.alignment} className="h-1" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Strategic Roadmap Timeline */}
      <Card className="p-6 bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Strategic Roadmap</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-purple-200"></div>
          <div className="space-y-6">
            <div className="relative pl-16">
              <div className="absolute left-6 top-2 w-4 h-4 bg-purple-600 rounded-full border-4 border-white"></div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-semibold text-purple-700 mb-1">Q4 2025</div>
                <div className="font-semibold text-gray-900">Foundation Phase</div>
                <p className="text-sm text-gray-600 mt-1">Infrastructure setup, team alignment, initial process design</p>
              </div>
            </div>
            <div className="relative pl-16">
              <div className="absolute left-6 top-2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white"></div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-700 mb-1">Q1-Q2 2026</div>
                <div className="font-semibold text-gray-900">Execution Phase</div>
                <p className="text-sm text-gray-600 mt-1">Core initiatives launch, market expansion begins, automation rollout</p>
              </div>
            </div>
            <div className="relative pl-16">
              <div className="absolute left-6 top-2 w-4 h-4 bg-green-600 rounded-full border-4 border-white"></div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-semibold text-green-700 mb-1">Q3-Q4 2026</div>
                <div className="font-semibold text-gray-900">Optimization Phase</div>
                <p className="text-sm text-gray-600 mt-1">Performance tuning, scaling successful initiatives, continuous improvement</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
