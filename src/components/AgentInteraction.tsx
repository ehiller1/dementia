
import { useState } from "react";
import { Agent } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgentInteractionProps {
  agents: Agent[];
}

interface Interaction {
  id: string;
  type: "collaboration" | "knowledge_share" | "joint_mission";
  participants: Agent[];
  description: string;
  status: "active" | "completed" | "pending";
  result?: string;
}

export const AgentInteraction = ({ agents }: AgentInteractionProps) => {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [interactionType, setInteractionType] = useState<string>("");
  const [interactions, setInteractions] = useState<Interaction[]>([
    {
      id: "1",
      type: "knowledge_share",
      participants: agents.slice(0, 2),
      description: "Marketing agent sharing customer insights with Sales agent to optimize lead scoring",
      status: "active",
      result: "Improved lead conversion rate by 15%"
    }
  ]);

  const interactionTypes = [
    {
      id: "collaboration",
      name: "Joint Collaboration",
      description: "Agents work together on a shared objective",
      icon: "🤝"
    },
    {
      id: "knowledge_share",
      name: "Knowledge Transfer",
      description: "One agent teaches another from their learnings",
      icon: "🧠"
    },
    {
      id: "joint_mission",
      name: "Joint Mission",
      description: "Multiple agents tackle a complex multi-departmental task",
      icon: "🎯"
    }
  ];

  const generateInteractionDescription = (type: string, participants: Agent[]) => {
    const names = participants.map(a => a.name).join(" and ");
    const teams = [...new Set(participants.map(a => a.team))].join(" and ");
    
    switch (type) {
      case "collaboration":
        return `${names} collaborate on cross-${teams} initiative to improve business outcomes`;
      case "knowledge_share":
        return `${participants[0]?.name} shares domain expertise with ${participants.slice(1).map(a => a.name).join(', ')}`;
      case "joint_mission":
        return `${names} unite for comprehensive ${teams} strategic mission`;
      default:
        return "Agents working together on business objectives";
    }
  };

  const createInteraction = () => {
    if (selectedAgents.length < 2 || !interactionType) return;

    const participants = agents.filter(a => selectedAgents.includes(a.id));
    const newInteraction: Interaction = {
      id: crypto.randomUUID(),
      type: interactionType as Interaction["type"],
      participants,
      description: generateInteractionDescription(interactionType, participants),
      status: "pending"
    };

    setInteractions(prev => [...prev, newInteraction]);
    setSelectedAgents([]);
    setInteractionType("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-600";
      case "completed": return "bg-green-600";
      case "pending": return "bg-yellow-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Agent Interactions</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Create Interaction</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Select Agents (min 2)</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAgents.includes(agent.id)
                          ? 'bg-blue-600/30 border-blue-500'
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      }`}
                      onClick={() => {
                        setSelectedAgents(prev => 
                          prev.includes(agent.id)
                            ? prev.filter(id => id !== agent.id)
                            : [...prev, agent.id]
                        );
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{agent.avatar}</span>
                        <div>
                          <p className="text-white font-medium">{agent.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{agent.team} • {agent.class}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Interaction Type</label>
                <Select value={interactionType} onValueChange={setInteractionType}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Choose interaction type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {interactionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-white">
                        {type.icon} {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={createInteraction}
                disabled={selectedAgents.length < 2 || !interactionType}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Create Interaction
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Interaction Types</h3>
            <div className="space-y-3">
              {interactionTypes.map((type) => (
                <div key={type.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{type.icon}</span>
                    <h4 className="font-semibold text-white">{type.name}</h4>
                  </div>
                  <p className="text-sm text-gray-400">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Active Interactions</h3>
        
        {interactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤝</div>
            <p className="text-gray-400">No interactions yet. Create one to see agents collaborate!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <Card key={interaction.id} className="bg-slate-700/50 border-slate-600 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {interactionTypes.find(t => t.id === interaction.type)?.icon}
                    </span>
                    <h4 className="font-semibold text-white">
                      {interactionTypes.find(t => t.id === interaction.type)?.name}
                    </h4>
                  </div>
                  <Badge className={`${getStatusColor(interaction.status)} text-white`}>
                    {interaction.status}
                  </Badge>
                </div>

                <p className="text-gray-300 mb-3">{interaction.description}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {interaction.participants.map((agent) => (
                    <div key={agent.id} className="flex items-center space-x-1 bg-slate-600 px-2 py-1 rounded">
                      <span className="text-sm">{agent.avatar}</span>
                      <span className="text-xs text-gray-300">{agent.name}</span>
                    </div>
                  ))}
                </div>

                {interaction.result && (
                  <div className="p-3 bg-green-900/30 border border-green-700 rounded">
                    <p className="text-sm text-green-300">Result: {interaction.result}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
