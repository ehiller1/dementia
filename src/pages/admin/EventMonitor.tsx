import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Activity, 
  Play, 
  Pause, 
  Download, 
  Filter,
  Zap,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface Event {
  id: string;
  type: string;
  source: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  metadata?: any;
}

export default function EventMonitor() {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState([1]);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);

  // Simulate live events
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const eventTypes = [
        { type: 'data.anomaly', source: 'DataTriggerMonitor', severity: 'warning', message: 'Unusual spike in demand detected' },
        { type: 'agent.task.completed', source: 'PricingOptimizer', severity: 'success', message: 'Pricing optimization completed successfully' },
        { type: 'system.health', source: 'HealthCheck', severity: 'info', message: 'System health check passed' },
        { type: 'decision.approved', source: 'GovernanceEngine', severity: 'success', message: 'Budget allocation decision approved' },
        { type: 'threshold.breach', source: 'AlertSystem', severity: 'error', message: 'Inventory threshold breached for SKU-12345' },
      ];

      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const newEvent: Event = {
        id: `evt-${Date.now()}-${Math.random()}`,
        ...randomEvent,
        severity: randomEvent.severity as any,
        timestamp: new Date().toISOString(),
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
    }, 3000 / speed[0]); // Speed multiplier

    return () => clearInterval(interval);
  }, [isPaused, speed]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || event.severity === filterType;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: events.length,
    info: events.filter(e => e.severity === 'info').length,
    warning: events.filter(e => e.severity === 'warning').length,
    error: events.filter(e => e.severity === 'error').length,
    success: events.filter(e => e.severity === 'success').length,
    eventsPerMin: Math.round((events.length / 5) * 10) / 10, // Rough estimate
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events-export-${new Date().toISOString()}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-orange-400" />
            Event Bus Monitor
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time event stream monitoring and analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isPaused ? 'default' : 'outline'}
            onClick={() => setIsPaused(!isPaused)}
            className={isPaused ? 'bg-green-600 hover:bg-green-700' : 'border-slate-700 text-gray-300'}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-slate-700 text-gray-300 hover:bg-slate-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Events</p>
              <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Info</p>
              <p className="text-xl font-bold text-blue-400 mt-1">{stats.info}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${getSeverityColor('info')} animate-pulse`} />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Success</p>
              <p className="text-xl font-bold text-green-400 mt-1">{stats.success}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${getSeverityColor('success')} animate-pulse`} />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Warning</p>
              <p className="text-xl font-bold text-yellow-400 mt-1">{stats.warning}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${getSeverityColor('warning')} animate-pulse`} />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Error</p>
              <p className="text-xl font-bold text-red-400 mt-1">{stats.error}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${getSeverityColor('error')} animate-pulse`} />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Events/min</p>
              <p className="text-xl font-bold text-purple-400 mt-1">{stats.eventsPerMin}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-sm text-gray-300 font-medium">Search Events</label>
            <Input
              placeholder="Search by message, type, or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm text-gray-300 font-medium">Filter by Severity</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300 font-medium">Playback Speed</label>
              <span className="text-white font-semibold">{speed[0]}x</span>
            </div>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={0.5}
              max={5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.5x</span>
              <span>5x</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Event Stream */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-white">Live Event Stream</h2>
          {!isPaused && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2" />}
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-orange-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-1.5 rounded ${getSeverityColor(event.severity)}/20`}>
                      <div className={`${getSeverityColor(event.severity).replace('bg-', 'text-')}`}>
                        {getSeverityIcon(event.severity)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-slate-600">
                      {event.type}
                    </Badge>
                    <span className="text-xs text-gray-400">{event.source}</span>
                  </div>
                  <p className="text-white text-sm mb-2">{event.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No events to display</h3>
              <p className="text-gray-400">
                {isPaused ? 'Event stream is paused' : 'Waiting for events...'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
