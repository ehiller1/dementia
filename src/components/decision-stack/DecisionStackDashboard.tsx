import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertTriangle,
  BookOpen,
  Activity,
  Brain,
  Network,
  GitBranch,
  MessageSquare,
} from 'lucide-react';
import type { DecisionStack } from '@/pages/DecisionStack';

interface DecisionStackDashboardProps {
  stacks: DecisionStack[];
  onSelectStack: (stack: DecisionStack) => void;
  onCreateStack: (stack: DecisionStack) => void;
  onDeleteStack: (id: string) => void;
  onCloneStack?: (stack: DecisionStack) => void;
}

const STACK_TEMPLATES = [
  { id: 'retail-media', name: 'Retail Media', description: 'Budget allocation, ROAS optimization, incrementality' },
  { id: 'trade-promo', name: 'Trade Promotion', description: 'Promo planning, lift analysis, retailer collaboration' },
  { id: 'allocation', name: 'Allocation & Service', description: 'Inventory allocation, service levels, fulfillment' },
  { id: 'supply-chain', name: 'Supply Chain', description: 'Logistics, transportation, warehouse optimization' },
  { id: 'pricing', name: 'Dynamic Pricing', description: 'Price optimization, elasticity, competitive response' },
];

const MODULE_TOOLTIPS = {
  commonTerms: {
    title: 'Common Terms',
    description: 'The shared glossary and KPIs to prevent cross-team misreads. Ensures everyone speaks the same language when discussing metrics, goals, and outcomes.'
  },
  eventPatterns: {
    title: 'Event Patterns',
    description: 'Named situations the system recognizes (e.g., "Prime Day spike," "post-promo dip," "shortage risk"). Helps identify and respond to recurring business scenarios.'
  },
  tunedModels: {
    title: 'Tuned Models',
    description: 'LLMs/adapters fine-tuned for that function/retailer voice and constraints. Customized AI models that understand your specific business context and requirements.'
  },
  entityMap: {
    title: 'Entity Map',
    description: 'The sub-graph of key entities & relationships (e.g., ASIN↔Family↔DC↔Window). Maps how products, locations, and time periods connect in your business.'
  },
  playsWorkflows: {
    title: 'Plays & Workflows',
    description: 'Templated moves with owners/approvals and guardrails. Pre-defined processes that ensure consistent execution with proper oversight and safety checks.'
  },
  promptTemplates: {
    title: 'Prompt Templates',
    description: 'Standardized prompts with variables, KPIs, and decision criteria. Reusable AI instructions that maintain consistency across similar tasks.'
  }
};

export function DecisionStackDashboard({
  stacks,
  onSelectStack,
  onCreateStack,
  onDeleteStack,
  onCloneStack,
}: DecisionStackDashboardProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStackData, setNewStackData] = useState({
    name: '',
    description: '',
    template: '',
  });

  const handleCreateStack = () => {
    const template = STACK_TEMPLATES.find(t => t.id === newStackData.template);
    const newStack: DecisionStack = {
      id: `stack-${Date.now()}`,
      name: newStackData.name,
      description: newStackData.description,
      status: 'draft',
      version: '0.1.0',
      lastModified: new Date().toISOString().split('T')[0],
      template: template?.name || 'Custom',
      modules: {
        commonTerms: 0,
        eventPatterns: 0,
        tunedModels: 0,
        entityMap: 0,
        playsWorkflows: 0,
        promptTemplates: 0,
      },
    };
    onCreateStack(newStack);
    setCreateModalOpen(false);
    setNewStackData({ name: '', description: '', template: '' });
  };

  const handleCloneStack = (stack: DecisionStack) => {
    if (onCloneStack) {
      onCloneStack(stack);
    } else {
      // Fallback: clone locally
      const clonedStack: DecisionStack = {
        ...stack,
        id: `stack-${Date.now()}`,
        name: `${stack.name} (Copy)`,
        status: 'draft',
        version: '0.1.0',
        lastModified: new Date().toISOString().split('T')[0],
      };
      onCreateStack(clonedStack);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'draft': return 'bg-yellow-600';
      case 'deprecated': return 'bg-gray-600';
      default: return 'bg-blue-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'deprecated': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const filteredStacks = stacks.filter(stack =>
    stack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stack.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stack.template.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = stacks.filter(s => s.status === 'active').length;
  const draftCount = stacks.filter(s => s.status === 'draft').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
                <Layers className="h-10 w-10 mr-3 text-blue-400" />
                Decision Stack
              </h1>
              <p className="text-gray-400 mt-2">
                Configure composable AI decision stacks for intelligent operations
              </p>
            </div>
            <div className="text-right">
              <div className="flex space-x-4 mb-2">
                <div>
                  <div className="text-sm text-gray-400">Active Stacks</div>
                  <div className="text-2xl font-bold text-green-400">{activeCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Draft Stacks</div>
                  <div className="text-2xl font-bold text-yellow-400">{draftCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Input
              type="text"
              placeholder="Search stacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-900 border-slate-700 text-white"
            />
            <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Stack
            </Button>
          </div>
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStacks.map((stack) => (
            <Card key={stack.id} className="bg-slate-900 border-slate-800 p-6 hover:border-slate-600 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1" onClick={() => onSelectStack(stack)}>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">{stack.name}</h3>
                    <Badge className={`${getStatusColor(stack.status)} text-white flex items-center space-x-1`}>
                      {getStatusIcon(stack.status)}
                      <span>{stack.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{stack.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{stack.template}</span>
                    <span>•</span>
                    <span>v{stack.version}</span>
                    <span>•</span>
                    <span>{stack.lastModified}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelectStack(stack)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCloneStack(stack)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Clone
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteStack(stack.id)}
                      className="text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <TooltipProvider>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800 p-2 rounded flex items-center justify-between cursor-help hover:bg-slate-700 transition-colors">
                        <BookOpen className="h-3 w-3 text-blue-400" />
                        <span className="font-semibold">{stack.modules.commonTerms}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold">{MODULE_TOOLTIPS.commonTerms.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{MODULE_TOOLTIPS.commonTerms.description}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800 p-2 rounded flex items-center justify-between cursor-help hover:bg-slate-700 transition-colors">
                        <Activity className="h-3 w-3 text-green-400" />
                        <span className="font-semibold">{stack.modules.eventPatterns}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold">{MODULE_TOOLTIPS.eventPatterns.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{MODULE_TOOLTIPS.eventPatterns.description}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800 p-2 rounded flex items-center justify-between cursor-help hover:bg-slate-700 transition-colors">
                        <Brain className="h-3 w-3 text-purple-400" />
                        <span className="font-semibold">{stack.modules.tunedModels}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold">{MODULE_TOOLTIPS.tunedModels.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{MODULE_TOOLTIPS.tunedModels.description}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800 p-2 rounded flex items-center justify-between cursor-help hover:bg-slate-700 transition-colors">
                        <Network className="h-3 w-3 text-pink-400" />
                        <span className="font-semibold">{stack.modules.entityMap}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold">{MODULE_TOOLTIPS.entityMap.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{MODULE_TOOLTIPS.entityMap.description}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800 p-2 rounded flex items-center justify-between cursor-help hover:bg-slate-700 transition-colors">
                        <GitBranch className="h-3 w-3 text-yellow-400" />
                        <span className="font-semibold">{stack.modules.playsWorkflows}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold">{MODULE_TOOLTIPS.playsWorkflows.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{MODULE_TOOLTIPS.playsWorkflows.description}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-800 p-2 rounded flex items-center justify-between cursor-help hover:bg-slate-700 transition-colors">
                        <MessageSquare className="h-3 w-3 text-orange-400" />
                        <span className="font-semibold">{stack.modules.promptTemplates}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold">{MODULE_TOOLTIPS.promptTemplates.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{MODULE_TOOLTIPS.promptTemplates.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </Card>
          ))}
        </div>

        {filteredStacks.length === 0 && (
          <div className="text-center py-12">
            <Layers className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No decision stacks found</h3>
            <p className="text-gray-400 mb-4">Create your first stack to get started</p>
            <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Stack
            </Button>
          </div>
        )}
      </div>

      {/* Create Stack Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Decision Stack</DialogTitle>
            <DialogDescription className="text-gray-400">
              Start with a template or create a custom stack
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stack Name</Label>
              <Input
                value={newStackData.name}
                onChange={(e) => setNewStackData({ ...newStackData, name: e.target.value })}
                placeholder="e.g., Retail Media Optimization"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newStackData.description}
                onChange={(e) => setNewStackData({ ...newStackData, description: e.target.value })}
                placeholder="Describe what this stack does..."
                className="bg-slate-800 border-slate-700"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={newStackData.template}
                onValueChange={(value) => setNewStackData({ ...newStackData, template: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {STACK_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-semibold">{template.name}</div>
                        <div className="text-xs text-gray-400">{template.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="border-slate-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStack}
              disabled={!newStackData.name || !newStackData.template}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Stack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
