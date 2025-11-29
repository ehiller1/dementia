
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSeasonalityAgentSetup } from '@/hooks/useSeasonalityAgentSetup';
import { SeasonalityConversationAgent } from '@/components/SeasonalityConversationAgent';
import { SeasonalityAgentSwitcher } from '@/components/SeasonalityAgentSwitcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Agent } from '@/pages/Index';
import { TrendingUp, MessageSquare, ChevronDown } from 'lucide-react';

interface SeasonalitySessionManagerProps {
  agent: Agent;
}

export const SeasonalitySessionManager = ({ agent }: SeasonalitySessionManagerProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'conversation' | 'direct'>('conversation');

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Seasonality Analysis with {agent.name}
          </CardTitle>
          <CardDescription>
            Advanced seasonality analysis with both conversational and direct interfaces
          </CardDescription>
          <div className="flex gap-2">
            <Badge variant="outline">{agent.class}</Badge>
            <Badge variant="outline">Level {agent.level}</Badge>
            <Badge variant="secondary">Enhanced MoLAS Pipeline</Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">CrewAI Enabled</Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
        <div className="flex justify-center mb-4">
          <TabsList>
            <TabsTrigger value="conversation" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Conversational Interface
            </TabsTrigger>
            <TabsTrigger value="direct" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Direct Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conversation" className="mt-0">
          <SeasonalityConversationAgent 
            agent={agent}
            conversationId={selectedConversationId || undefined}
          />
        </TabsContent>

        <TabsContent value="direct" className="mt-0">
          <SeasonalityAgentSwitcher agentId={`${agent.id}-seasonality`} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
