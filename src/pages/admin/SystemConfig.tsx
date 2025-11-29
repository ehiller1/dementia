import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Zap, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

export default function SystemConfig() {
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Confidence Thresholds
  const [confidenceThresholds, setConfidenceThresholds] = useState({
    seasonality: 90,
    demandForecast: 88,
    pricing: 92,
    general: 85,
  });

  // Reflective Loop Settings
  const [reflectiveSettings, setReflectiveSettings] = useState({
    maxIterations: 3,
    escalationThreshold: 75,
    autoImprovement: true,
  });

  // Simulation Settings
  const [simulationSettings, setSimulationSettings] = useState({
    eventInterval: 15,
    scenarioInterval: 60,
    paused: false,
  });

  // Presentation Limits
  const [presentationLimits, setPreset] = useState({
    maxTasks: 5,
    maxAsks: 3,
    maxMemoryRefs: 5,
    maxKeyPoints: 7,
  });

  const handleSave = () => {
    // Save to localStorage or API
    localStorage.setItem('systemConfig', JSON.stringify({
      confidenceThresholds,
      reflectiveSettings,
      simulationSettings,
      presentationLimits,
    }));
    
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    // Reset to defaults
    setConfidenceThresholds({ seasonality: 90, demandForecast: 88, pricing: 92, general: 85 });
    setReflectiveSettings({ maxIterations: 3, escalationThreshold: 75, autoImprovement: true });
    setSimulationSettings({ eventInterval: 15, scenarioInterval: 60, paused: false });
    setPresent({ maxTasks: 5, maxAsks: 3, maxMemoryRefs: 5, maxKeyPoints: 7 });
    setHasChanges(false);
  };

  const sections: ConfigSection[] = [
    { id: 'confidence', title: 'Confidence Thresholds', description: 'Minimum confidence levels for different analysis types', icon: TrendingUp, color: 'blue' },
    { id: 'reflective', title: 'Reflective Loop Settings', description: 'Auto-improvement and iteration controls', icon: RotateCcw, color: 'purple' },
    { id: 'simulation', title: 'Simulation Controls', description: 'Event generation and timing settings', icon: Zap, color: 'orange' },
    { id: 'presentation', title: 'Presentation Limits', description: 'UI display limits and truncation', icon: Settings, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-400" />
            System Configuration
          </h1>
          <p className="text-gray-400 mt-1">
            Fine-tune system behavior and performance parameters
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Saved successfully</span>
            </div>
          )}
          {hasChanges && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-400">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-slate-700 text-gray-300 hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Confidence Thresholds */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Confidence Thresholds</h2>
              <p className="text-sm text-gray-400">Minimum confidence levels required before accepting analysis results</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {Object.entries(confidenceThresholds).map(([key, value]) => (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <span className="text-white font-semibold">{value}%</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([v]) => {
                    setConfidenceThresholds({ ...confidenceThresholds, [key]: v });
                    setHasChanges(true);
                  }}
                  min={50}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Reflective Loop Settings */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <RotateCcw className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Reflective Loop Settings</h2>
              <p className="text-sm text-gray-400">Controls for automatic analysis improvement iterations</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-gray-300">Max Iterations</Label>
              <Input
                type="number"
                value={reflectiveSettings.maxIterations}
                onChange={(e) => {
                  setReflectiveSettings({ ...reflectiveSettings, maxIterations: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                min={1}
                max={10}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-gray-500">Maximum number of improvement iterations</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Escalation Threshold</Label>
                <span className="text-white font-semibold">{reflectiveSettings.escalationThreshold}%</span>
              </div>
              <Slider
                value={[reflectiveSettings.escalationThreshold]}
                onValueChange={([v]) => {
                  setReflectiveSettings({ ...reflectiveSettings, escalationThreshold: v });
                  setHasChanges(true);
                }}
                min={50}
                max={100}
                step={5}
              />
              <p className="text-xs text-gray-500">Confidence level that triggers escalation</p>
            </div>

            <div className="col-span-2 flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <Label className="text-gray-300">Auto-Improvement</Label>
                <p className="text-xs text-gray-500 mt-1">Automatically improve low-confidence analyses</p>
              </div>
              <Switch
                checked={reflectiveSettings.autoImprovement}
                onCheckedChange={(checked) => {
                  setReflectiveSettings({ ...reflectiveSettings, autoImprovement: checked });
                  setHasChanges(true);
                }}
              />
            </div>
          </div>
        </Card>

        {/* Simulation Controls */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Zap className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Simulation Controls</h2>
              <p className="text-sm text-gray-400">Event generation timing and simulation state</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-gray-300">Event Interval (seconds)</Label>
              <Input
                type="number"
                value={simulationSettings.eventInterval}
                onChange={(e) => {
                  setSimulationSettings({ ...simulationSettings, eventInterval: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                min={1}
                max={300}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-gray-500">Time between random events</p>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-300">Scenario Interval (seconds)</Label>
              <Input
                type="number"
                value={simulationSettings.scenarioInterval}
                onChange={(e) => {
                  setSimulationSettings({ ...simulationSettings, scenarioInterval: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                min={10}
                max={600}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-gray-500">Time between scenario executions</p>
            </div>

            <div className="col-span-2 flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <Label className="text-gray-300">Simulation Paused</Label>
                <p className="text-xs text-gray-500 mt-1">Temporarily stop event generation</p>
              </div>
              <Switch
                checked={simulationSettings.paused}
                onCheckedChange={(checked) => {
                  setSimulationSettings({ ...simulationSettings, paused: checked });
                  setHasChanges(true);
                }}
              />
            </div>
          </div>
        </Card>

        {/* Presentation Limits */}
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Settings className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Presentation Limits</h2>
              <p className="text-sm text-gray-400">Maximum items displayed in UI components</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {Object.entries(presentationLimits).map(([key, value]) => (
              <div key={key} className="space-y-3">
                <Label className="text-gray-300 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace('max', 'Max')}
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => {
                    setPresent({ ...presentationLimits, [key]: parseInt(e.target.value) });
                    setHasChanges(true);
                  }}
                  min={1}
                  max={20}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Warning Banner */}
      {hasChanges && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-yellow-400 font-medium">You have unsaved changes</p>
              <p className="text-yellow-400/70 text-sm">Click "Save Changes" to apply your configuration updates</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
