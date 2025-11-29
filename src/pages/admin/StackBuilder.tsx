import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  Eye,
  Copy,
  BookOpen,
  Activity,
  Brain,
  Network,
  GitBranch,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface StackComponent {
  id: string;
  type: 'commonTerms' | 'eventPatterns' | 'tunedModels' | 'entityMap' | 'playsWorkflows' | 'promptTemplates';
  name: string;
  content: string;
  icon: any;
  color: string;
}

interface TemplateStack {
  id: string;
  name: string;
  description: string;
  components: StackComponent[];
  version: string;
  createdAt: string;
}

export default function StackBuilder() {
  const [activeTab, setActiveTab] = useState('builder');
  const [stackName, setStackName] = useState('');
  const [stackDescription, setStackDescription] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<StackComponent[]>([]);
  const [previewPrompt, setPreviewPrompt] = useState('');

  const availableComponents: StackComponent[] = [
    {
      id: 'comp-1',
      type: 'commonTerms',
      name: 'Retail Media Glossary',
      content: 'ROAS: Return on Ad Spend\nCTR: Click-Through Rate\nCPC: Cost Per Click',
      icon: BookOpen,
      color: 'blue',
    },
    {
      id: 'comp-2',
      type: 'eventPatterns',
      name: 'Seasonality Patterns',
      content: 'Prime Day Spike: 200% increase in traffic\nHoliday Season: 150% baseline increase',
      icon: Activity,
      color: 'green',
    },
    {
      id: 'comp-3',
      type: 'tunedModels',
      name: 'Pricing Model - Retail',
      content: 'Fine-tuned GPT-4 for retail pricing optimization with elasticity constraints',
      icon: Brain,
      color: 'purple',
    },
    {
      id: 'comp-4',
      type: 'entityMap',
      name: 'Product Hierarchy',
      content: 'SKU → Product Family → Category → Department',
      icon: Network,
      color: 'pink',
    },
    {
      id: 'comp-5',
      type: 'playsWorkflows',
      name: 'Price Adjustment Workflow',
      content: 'Detect anomaly → Analyze impact → Generate recommendation → Require approval if >10%',
      icon: GitBranch,
      color: 'yellow',
    },
    {
      id: 'comp-6',
      type: 'promptTemplates',
      name: 'Demand Forecast Template',
      content: 'Analyze historical sales data for {SKU} considering {seasonality} and {external_factors}',
      icon: MessageSquare,
      color: 'orange',
    },
  ];

  const [savedStacks, setSavedStacks] = useState<TemplateStack[]>([
    {
      id: 'stack-1',
      name: 'Retail Media Optimization',
      description: 'Complete stack for retail media campaign optimization',
      components: [availableComponents[0], availableComponents[1], availableComponents[2]],
      version: '1.0.0',
      createdAt: '2025-10-20T10:00:00Z',
    },
  ]);

  const handleAddComponent = (component: StackComponent) => {
    if (!selectedComponents.find(c => c.id === component.id)) {
      setSelectedComponents([...selectedComponents, component]);
    }
  };

  const handleRemoveComponent = (componentId: string) => {
    setSelectedComponents(selectedComponents.filter(c => c.id !== componentId));
  };

  const handleSaveStack = () => {
    const newStack: TemplateStack = {
      id: `stack-${Date.now()}`,
      name: stackName,
      description: stackDescription,
      components: selectedComponents,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
    };
    setSavedStacks([...savedStacks, newStack]);
    setStackName('');
    setStackDescription('');
    setSelectedComponents([]);
  };

  const handleGeneratePreview = () => {
    const prompt = `
# Decision Stack: ${stackName || 'Untitled Stack'}

## Common Terms
${selectedComponents.filter(c => c.type === 'commonTerms').map(c => c.content).join('\n')}

## Event Patterns
${selectedComponents.filter(c => c.type === 'eventPatterns').map(c => c.content).join('\n')}

## Entity Relationships
${selectedComponents.filter(c => c.type === 'entityMap').map(c => c.content).join('\n')}

## Workflows
${selectedComponents.filter(c => c.type === 'playsWorkflows').map(c => c.content).join('\n')}

## Prompt Templates
${selectedComponents.filter(c => c.type === 'promptTemplates').map(c => c.content).join('\n')}
    `.trim();
    
    setPreviewPrompt(prompt);
  };

  const getComponentIcon = (type: string) => {
    const component = availableComponents.find(c => c.type === type);
    return component?.icon || Layers;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Layers className="h-8 w-8 text-pink-400" />
            Template Stack Builder
          </h1>
          <p className="text-gray-400 mt-1">
            Compose reusable decision stacks from modular components
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="builder" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
            Stack Builder
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Saved Stacks
          </TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="mt-6 space-y-6">
          {/* Stack Info */}
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Stack Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Stack Name</Label>
                <Input
                  value={stackName}
                  onChange={(e) => setStackName(e.target.value)}
                  placeholder="e.g., Retail Media Optimization"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Version</Label>
                <Input
                  value="1.0.0"
                  disabled
                  className="bg-slate-800 border-slate-700 text-gray-400"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-gray-300">Description</Label>
                <Textarea
                  value={stackDescription}
                  onChange={(e) => setStackDescription(e.target.value)}
                  placeholder="Describe what this stack does..."
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            {/* Component Library */}
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Component Library</h2>
              <div className="space-y-3">
                {availableComponents.map((component) => {
                  const Icon = component.icon;
                  const isSelected = selectedComponents.find(c => c.id === component.id);
                  
                  return (
                    <div
                      key={component.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                      onClick={() => handleAddComponent(component)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 bg-${component.color}-500/20 rounded-lg`}>
                          <Icon className={`h-4 w-4 text-${component.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium text-sm">{component.name}</h3>
                          <Badge variant="outline" className="text-xs border-slate-600 mt-1">
                            {component.type}
                          </Badge>
                        </div>
                        {isSelected && <CheckCircle className="h-5 w-5 text-pink-400" />}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{component.content}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Selected Components */}
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Selected Components</h2>
                <Badge variant="outline" className="border-pink-500 text-pink-400">
                  {selectedComponents.length} components
                </Badge>
              </div>

              {selectedComponents.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No components selected</p>
                  <p className="text-sm text-gray-500 mt-1">Click components from the library to add them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedComponents.map((component) => {
                    const Icon = component.icon;
                    
                    return (
                      <div
                        key={component.id}
                        className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 bg-${component.color}-500/20 rounded-lg`}>
                              <Icon className={`h-4 w-4 text-${component.color}-400`} />
                            </div>
                            <div>
                              <h3 className="text-white font-medium text-sm">{component.name}</h3>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{component.content}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveComponent(component.id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Button
                  onClick={handleGeneratePreview}
                  disabled={selectedComponents.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Stack
                </Button>
                <Button
                  onClick={handleSaveStack}
                  disabled={!stackName || selectedComponents.length === 0}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Stack
                </Button>
              </div>
            </Card>
          </div>

          {/* Preview */}
          {previewPrompt && (
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Stack Preview</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(previewPrompt)}
                  className="border-slate-700 text-gray-300"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-slate-700">
                {previewPrompt}
              </pre>
            </Card>
          )}
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="mt-6 space-y-4">
          {savedStacks.map((stack) => (
            <Card key={stack.id} className="bg-slate-900/50 border-slate-800 p-6 hover:border-pink-500/50 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{stack.name}</h3>
                    <Badge variant="outline" className="border-slate-600">
                      v{stack.version}
                    </Badge>
                  </div>
                  <p className="text-gray-400 mb-4">{stack.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {stack.components.map((component) => {
                      const Icon = getComponentIcon(component.type);
                      return (
                        <Badge key={component.id} variant="secondary" className="bg-slate-800 text-gray-300">
                          <Icon className="h-3 w-3 mr-1" />
                          {component.name}
                        </Badge>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{stack.components.length} components</span>
                    <span>•</span>
                    <span>Created {new Date(stack.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" className="border-slate-700">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-700">
                    <Copy className="h-4 w-4 mr-2" />
                    Clone
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-700 text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {savedStacks.length === 0 && (
            <Card className="bg-slate-900/50 border-slate-800 p-12 text-center">
              <Layers className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No saved stacks</h3>
              <p className="text-gray-400 mb-4">Create your first template stack to get started</p>
              <Button onClick={() => setActiveTab('builder')} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Stack
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
