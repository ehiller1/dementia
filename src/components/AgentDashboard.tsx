import { useState } from "react";
import { Agent } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MissionAssignment } from "@/components/MissionAssignment";
import { AgentInteraction } from "@/components/AgentInteraction";

interface AgentDashboardProps {
  agents: Agent[];
  onCreateNewAgent: () => void;
  onGoToCommandCenter: () => void;
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

export const AgentDashboard = ({ agents, onCreateNewAgent, onGoToCommandCenter, setAgents }: AgentDashboardProps) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'finance': return 'from-emerald-600 to-green-700';
      case 'marketing': return 'from-purple-600 to-pink-700';
      case 'sales': return 'from-blue-600 to-cyan-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const assignMission = (agentId: string, mission: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, currentMission: mission } : agent
    ));
  };

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Agent Command Center
          </h1>
          <div className="flex space-x-4">
            <Button 
              onClick={onGoToCommandCenter}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              🏰 Enter Command Center
            </Button>
            <Button 
              onClick={onCreateNewAgent}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              + Recruit New Agent
            </Button>
          </div>
        </div>

        {agents.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-12 text-center">
            <div className="text-6xl mb-4">🏰</div>
            <h2 className="text-2xl font-bold text-white mb-4">Your Academy Awaits</h2>
            <p className="text-gray-400 mb-6">Create your first agent to begin your journey</p>
            <Button 
              onClick={onCreateNewAgent}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg"
            >
              Create Agent
            </Button>
          </Card>
        ) : (
          <Tabs defaultValue="agents" className="space-y-6">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="agents" className="data-[state=active]:bg-slate-700">Agents</TabsTrigger>
              <TabsTrigger value="missions" className="data-[state=active]:bg-slate-700">Missions</TabsTrigger>
              <TabsTrigger value="interactions" className="data-[state=active]:bg-slate-700">Interactions</TabsTrigger>
            </TabsList>

            <TabsContent value="agents">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <Card 
                    key={agent.id}
                    className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6 hover:border-slate-500 transition-all duration-300 cursor-pointer transform hover:scale-105"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">{agent.avatar}</div>
                      <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">{agent.class} • Level {agent.level}</p>
                    </div>

                    <div className={`w-full h-1 bg-gradient-to-r ${getTeamColor(agent.team!)} rounded-full mb-4`} />

                    <div className="space-y-2 mb-4">
                      {Object.entries(agent.skills).map(([skill, value]) => (
                        <div key={skill} className="flex justify-between items-center">
                          <span className="text-xs text-gray-400 capitalize">{skill}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={value} className="w-16 h-1" />
                            <span className="text-xs text-blue-400 w-6">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {agent.equipment.slice(0, 3).map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs bg-slate-700 text-gray-300">
                          {item}
                        </Badge>
                      ))}
                      {agent.equipment.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-slate-700 text-gray-300">
                          +{agent.equipment.length - 3}
                        </Badge>
                      )}
                    </div>

                    {agent.currentMission && (
                      <div className="bg-yellow-900/30 border border-yellow-700 rounded p-2">
                        <p className="text-xs text-yellow-300">Current Mission:</p>
                        <p className="text-xs text-yellow-100">{agent.currentMission}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="missions">
              <MissionAssignment agents={agents} onAssignMission={assignMission} />
            </TabsContent>

            <TabsContent value="interactions">
              <AgentInteraction agents={agents} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
