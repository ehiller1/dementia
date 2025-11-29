import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeasonalityAgent } from './SeasonalityAgent.js';
import { CrewSeasonalityAgent } from './CrewSeasonalityAgent.js';
import { Badge } from '@/components/ui/badge';
import { Info, Users2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SeasonalityAgentSwitcherProps {
  agentId?: string;
}

export const SeasonalityAgentSwitcher = ({ agentId = 'seasonality-agent' }: SeasonalityAgentSwitcherProps) => {
  const [activeTab, setActiveTab] = useState<string>('traditional');

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <Tabs
          defaultValue="traditional"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Seasonality Analysis</h2>
            <TabsList>
              <TabsTrigger value="traditional" className="flex items-center gap-1">
                Traditional Agent
              </TabsTrigger>
              <TabsTrigger value="crew" className="flex items-center gap-1">
                <Users2 className="h-4 w-4 mr-1" />
                CrewAI Agent
                <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs">
                  New
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="p-4">
            {activeTab === 'crew' && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-start">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p><strong>Multi-Agent Approach:</strong> The CrewAI version utilizes specialized agents working together for more comprehensive analysis:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Data Preparation Specialist – Cleans and prepares your time series data</li>
                    <li>Seasonality Analyst – Identifies seasonal patterns with statistical rigor</li>
                    <li>Business Insights Specialist – Translates findings into actionable recommendations</li>
                    <li>Visualization Specialist – Creates clear visualizations of detected patterns</li>
                  </ul>
                </div>
              </div>
            )}

            <TabsContent value="traditional" className="m-0">
              <SeasonalityAgent agentId={`${agentId}-traditional`} />
            </TabsContent>
            <TabsContent value="crew" className="m-0">
              <CrewSeasonalityAgent agentId={`${agentId}-crew`} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
