import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Play,
  Pause,
  FastForward
} from 'lucide-react';

interface OrchestrationPhase {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  confidence: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

interface Decision {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
  timestamp: string;
}

export default function OrchestrationState() {
  const [currentPhase, setCurrentPhase] = useState(2);
  const [overallProgress, setOverallProgress] = useState(45);

  const phases: OrchestrationPhase[] = [
    {
      id: 'phase-1',
      name: 'Signal Detection',
      status: 'completed',
      confidence: 0.95,
      startTime: '2025-10-21T16:00:00Z',
      endTime: '2025-10-21T16:02:30Z',
      duration: 150,
    },
    {
      id: 'phase-2',
      name: 'Context Analysis',
      status: 'completed',
      confidence: 0.92,
      startTime: '2025-10-21T16:02:30Z',
      endTime: '2025-10-21T16:05:00Z',
      duration: 150,
    },
    {
      id: 'phase-3',
      name: 'Agent Coordination',
      status: 'in_progress',
      confidence: 0.88,
      startTime: '2025-10-21T16:05:00Z',
    },
    {
      id: 'phase-4',
      name: 'Decision Generation',
      status: 'pending',
      confidence: 0,
    },
    {
      id: 'phase-5',
      name: 'Governance Review',
      status: 'pending',
      confidence: 0,
    },
    {
      id: 'phase-6',
      name: 'Execution',
      status: 'pending',
      confidence: 0,
    },
  ];

  const decisions: Decision[] = [
    {
      id: 'dec-001',
      title: 'Increase inventory allocation for SKU-12345',
      status: 'approved',
      priority: 'high',
      rationale: 'Demand forecast shows 40% increase in next 2 weeks',
      timestamp: '2025-10-21T16:10:00Z',
    },
    {
      id: 'dec-002',
      title: 'Adjust pricing for competitive response',
      status: 'pending',
      priority: 'critical',
      rationale: 'Competitor reduced prices by 12%, need to respond',
      timestamp: '2025-10-21T16:12:00Z',
    },
    {
      id: 'dec-003',
      title: 'Launch promotional campaign',
      status: 'pending',
      priority: 'medium',
      rationale: 'Seasonal opportunity identified for Q4',
      timestamp: '2025-10-21T16:15:00Z',
    },
  ];

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'in_progress': return <Play className="h-5 w-5 text-blue-400 animate-pulse" />;
      case 'pending': return <Clock className="h-5 w-5 text-gray-400" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-400" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-500/10';
      case 'in_progress': return 'border-blue-500 bg-blue-500/10';
      case 'pending': return 'border-gray-600 bg-gray-600/10';
      case 'failed': return 'border-red-500 bg-red-500/10';
      default: return 'border-gray-600 bg-gray-600/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getDecisionStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 border-green-500';
      case 'rejected': return 'text-red-400 border-red-500';
      case 'pending': return 'text-yellow-400 border-yellow-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setOverallProgress(prev => Math.min(prev + 1, 100));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <GitBranch className="h-8 w-8 text-cyan-400" />
            Orchestration State
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor orchestration phases, progress, and decision queue
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Overall Progress</h2>
            <p className="text-sm text-gray-400 mt-1">Current orchestration cycle</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-cyan-400">{overallProgress}%</p>
            <p className="text-sm text-gray-400">Complete</p>
          </div>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </Card>

      {/* Current Phase Highlight */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 p-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-cyan-500/20 rounded-lg">
            <Play className="h-8 w-8 text-cyan-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-1">
              {phases[currentPhase].name}
            </h3>
            <p className="text-gray-300 text-sm mb-2">Currently executing</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">
                  {(phases[currentPhase].confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              {phases[currentPhase].startTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    Started {new Date(phases[currentPhase].startTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Phase Timeline */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Orchestration Phases</h2>
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className={`p-4 rounded-lg border-2 transition-all ${getPhaseStatusColor(phase.status)} ${
                index === currentPhase ? 'ring-2 ring-cyan-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {getPhaseStatusIcon(phase.status)}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{phase.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <Badge variant="outline" className="text-xs capitalize border-slate-600">
                        {phase.status.replace('_', ' ')}
                      </Badge>
                      {phase.confidence > 0 && (
                        <span className="text-sm text-gray-400">
                          Confidence: {(phase.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {phase.duration && (
                        <span className="text-sm text-gray-400">
                          Duration: {phase.duration}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {phase.status === 'completed' && phase.confidence > 0 && (
                  <div className="text-right">
                    <Progress value={phase.confidence * 100} className="w-24 h-2" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Decision Queue */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Decision Queue</h2>
        <div className="space-y-4">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-1 h-8 rounded ${getPriorityColor(decision.priority)}`} />
                    <div>
                      <h3 className="text-white font-semibold">{decision.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${getDecisionStatusColor(decision.status)}`}>
                          {decision.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-slate-600 capitalize">
                          {decision.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 ml-4">{decision.rationale}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 ml-4 mt-2">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(decision.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Phases Completed</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {phases.filter(p => p.status === 'completed').length}/{phases.length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Decisions</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">
                {decisions.filter(d => d.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {(phases.reduce((sum, p) => sum + p.confidence, 0) / phases.filter(p => p.confidence > 0).length * 100).toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-cyan-400" />
          </div>
        </Card>
      </div>
    </div>
  );
}
