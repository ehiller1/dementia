
import { useState, useEffect } from "react";
import { Agent } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WindsurfConversationInterface } from "@/components/WindsurfConversationInterface";
import { QuestSystem } from "@/components/QuestSystem";
import { ResultsAnalyzer } from "@/components/ResultsAnalyzer";
import { CommandCenterHeader } from "@/components/CommandCenterHeader";
import { useConversation } from "@/contexts/ConversationContext";
import { v4 as uuidv4 } from "uuid";

interface CommandCenterProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  onCreateNewAgent: () => void;
  onBackToDashboard: () => void;
}

export const CommandCenter = ({ agents, setAgents, onCreateNewAgent, onBackToDashboard }: CommandCenterProps) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState("conversation");

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={onBackToDashboard}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            ← Back to Dashboard
          </Button>
        </div>

        <CommandCenterHeader 
          agents={agents} 
          onCreateNewAgent={onCreateNewAgent}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="conversation" className="data-[state=active]:bg-slate-700 text-white">
              🏰 Guild Hall
            </TabsTrigger>
            <TabsTrigger value="quests" className="data-[state=active]:bg-slate-700 text-white">
              ⚔️ Quest Board
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-700 text-white">
              📊 Results Chamber
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversation">
            <WindsurfConversationInterface
              conversationId="command_center_conversation"
              onConversationChange={(messages) => {
                // Handle conversation changes if needed
                console.log('Conversation updated:', messages.length, 'messages');
              }}
            />
          </TabsContent>

          <TabsContent value="quests">
            <QuestSystem 
              agents={agents}
              setAgents={setAgents}
            />
          </TabsContent>

          <TabsContent value="results">
            <ResultsAnalyzer 
              agents={agents}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
