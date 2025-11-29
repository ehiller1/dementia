
import { useState } from "react";
import { Agent } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MissionAssignmentProps {
  agents: Agent[];
  onAssignMission: (agentId: string, mission: string) => void;
}

export const MissionAssignment = ({ agents, onAssignMission }: MissionAssignmentProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [missionType, setMissionType] = useState<"learn" | "act" | "">("");
  const [customMission, setCustomMission] = useState("");

  const missionTemplates = {
    learn: [
      "Learn about the impact of product color on sales revenue and inventory demand",
      "Analyze customer behavior patterns in Q4 shopping seasons",
      "Study competitor pricing strategies and market positioning",
      "Research emerging trends in your industry sector",
      "Investigate the correlation between marketing spend and customer acquisition"
    ],
    act: [
      "Create a comprehensive budget analysis for next quarter",
      "Launch a targeted email campaign for high-value customers",
      "Negotiate with top 5 vendors for better contract terms",
      "Implement automated reporting system for key metrics",
      "Develop and execute customer retention strategy"
    ]
  };

  const handleAssignMission = (mission: string) => {
    if (selectedAgent && mission) {
      onAssignMission(selectedAgent, mission);
      setCustomMission("");
    }
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Mission Command</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Select Agent</h3>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id} className="text-white">
                    {agent.avatar} {agent.name} ({agent.team})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAgentData && (
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{selectedAgentData.avatar}</span>
                  <div>
                    <h4 className="font-semibold text-white">{selectedAgentData.name}</h4>
                    <p className="text-sm text-gray-400 capitalize">
                      {selectedAgentData.class} • {selectedAgentData.team}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {selectedAgentData.equipment.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs bg-slate-600 text-gray-300">
                      {item}
                    </Badge>
                  ))}
                </div>

                {selectedAgentData.currentMission && (
                  <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded">
                    <p className="text-xs text-yellow-300">Current Mission:</p>
                    <p className="text-xs text-yellow-100">{selectedAgentData.currentMission}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Mission Type</h3>
            <div className="flex space-x-3 mb-4">
              <Button
                variant={missionType === "learn" ? "default" : "outline"}
                onClick={() => setMissionType("learn")}
                className={missionType === "learn" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                🧠 Learn
              </Button>
              <Button
                variant={missionType === "act" ? "default" : "outline"}
                onClick={() => setMissionType("act")}
                className={missionType === "act" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                ⚡ Act
              </Button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Custom Mission</h4>
              <Textarea
                value={customMission}
                onChange={(e) => setCustomMission(e.target.value)}
                placeholder="Describe a custom mission for your agent..."
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
              />
              <Button
                onClick={() => handleAssignMission(customMission)}
                disabled={!selectedAgent || !customMission}
                className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Assign Custom Mission
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {missionType && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {missionType === "learn" ? "🧠 Learning Missions" : "⚡ Action Missions"}
          </h3>
          <div className="grid gap-3">
            {missionTemplates[missionType].map((mission, index) => (
              <div
                key={index}
                className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                onClick={() => handleAssignMission(mission)}
              >
                <p className="text-gray-300">{mission}</p>
                <Button
                  size="sm"
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!selectedAgent}
                >
                  Assign Mission
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
