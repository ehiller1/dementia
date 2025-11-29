import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Save,
  BookOpen,
  Activity,
  Brain,
  Network,
  GitBranch,
  MessageSquare,
} from 'lucide-react';
import type { DecisionStack } from '@/pages/DecisionStack';
import { CommonTermsTab } from './tabs/CommonTermsTab';
import { EventPatternsTab } from './tabs/EventPatternsTab';
import { TunedModelsTab } from './tabs/TunedModelsTab';
import { EntityMapTab } from './tabs/EntityMapTab';
import { PlaysWorkflowsTab } from './tabs/PlaysWorkflowsTab';
import { PromptTemplatesTab } from './tabs/PromptTemplatesTab';

interface DecisionStackDetailProps {
  stack: DecisionStack;
  onBack: () => void;
  onUpdate: (stack: DecisionStack) => void;
}

export function DecisionStackDetail({ stack, onBack, onUpdate }: DecisionStackDetailProps) {
  const [activeTab, setActiveTab] = useState('common-terms');

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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-400 hover:text-white"
        >
          ← Back to Stacks
        </Button>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold">{stack.name}</h1>
              <Badge className={`${getStatusColor(stack.status)} text-white flex items-center space-x-1`}>
                {getStatusIcon(stack.status)}
                <span>{stack.status}</span>
              </Badge>
              <Badge variant="outline" className="text-gray-400">
                v{stack.version}
              </Badge>
            </div>
            <p className="text-gray-400">{stack.description}</p>
            <p className="text-sm text-gray-500 mt-1">
              Template: {stack.template} • Last modified: {stack.lastModified}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" className="border-slate-700">
              <Play className="h-4 w-4 mr-2" />
              Test Stack
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full bg-slate-800">
              <TabsTrigger value="common-terms" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Common Terms</span>
                <Badge variant="secondary" className="ml-1">{stack.modules.commonTerms}</Badge>
              </TabsTrigger>
              <TabsTrigger value="event-patterns" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Event Patterns</span>
                <Badge variant="secondary" className="ml-1">{stack.modules.eventPatterns}</Badge>
              </TabsTrigger>
              <TabsTrigger value="tuned-models" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Tuned Models</span>
                <Badge variant="secondary" className="ml-1">{stack.modules.tunedModels}</Badge>
              </TabsTrigger>
              <TabsTrigger value="entity-map" className="flex items-center space-x-2">
                <Network className="h-4 w-4" />
                <span>Entity Map</span>
                <Badge variant="secondary" className="ml-1">{stack.modules.entityMap}</Badge>
              </TabsTrigger>
              <TabsTrigger value="plays-workflows" className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4" />
                <span>Plays & Workflows</span>
                <Badge variant="secondary" className="ml-1">{stack.modules.playsWorkflows}</Badge>
              </TabsTrigger>
              <TabsTrigger value="prompt-templates" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Prompt Templates</span>
                <Badge variant="secondary" className="ml-1">{stack.modules.promptTemplates}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="common-terms" className="mt-6">
              <CommonTermsTab />
            </TabsContent>

            <TabsContent value="event-patterns" className="mt-6">
              <EventPatternsTab />
            </TabsContent>

            <TabsContent value="tuned-models" className="mt-6">
              <TunedModelsTab />
            </TabsContent>

            <TabsContent value="entity-map" className="mt-6">
              <EntityMapTab />
            </TabsContent>

            <TabsContent value="plays-workflows" className="mt-6">
              <PlaysWorkflowsTab />
            </TabsContent>

            <TabsContent value="prompt-templates" className="mt-6">
              <PromptTemplatesTab />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
