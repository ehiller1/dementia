
import { useState } from "react";
import { Agent } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: "novice" | "adept" | "expert" | "master";
  reward: {
    xp: number;
    equipment?: string;
    skill_boost?: string;
  };
  requirements: {
    minLevel: number;
    team?: string;
    skills?: string[];
  };
  status: "available" | "in_progress" | "completed";
  assignedAgent?: string;
  progress: number;
  estimatedTime: string;
}

interface QuestSystemProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

export const QuestSystem = ({ agents, setAgents }: QuestSystemProps) => {
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: "1",
      title: "Market Color Impact Analysis",
      description: "Analyze the impact of product colors on customer purchase behavior across different demographics",
      difficulty: "adept",
      reward: { xp: 150, equipment: "Advanced Analytics Toolkit", skill_boost: "analysis" },
      requirements: { minLevel: 3, team: "marketing", skills: ["analysis"] },
      status: "available",
      progress: 0,
      estimatedTime: "2-3 days"
    },
    {
      id: "2", 
      title: "Cross-Department Revenue Optimization",
      description: "Collaborate with finance and sales teams to identify revenue optimization opportunities",
      difficulty: "expert",
      reward: { xp: 300, equipment: "Strategic Planning Suite", skill_boost: "collaboration" },
      requirements: { minLevel: 5, skills: ["collaboration", "analysis"] },
      status: "available",
      progress: 0,
      estimatedTime: "1 week"
    },
    {
      id: "3",
      title: "Customer Segmentation Deep Dive",
      description: "Develop advanced customer segmentation models using behavioral and demographic data",
      difficulty: "master",
      reward: { xp: 500, equipment: "AI-Powered Segmentation Engine", skill_boost: "learning" },
      requirements: { minLevel: 8, team: "marketing", skills: ["learning", "analysis"] },
      status: "available",
      progress: 0,
      estimatedTime: "2 weeks"
    }
  ]);
  
  const [customQuest, setCustomQuest] = useState({
    title: "",
    description: "",
    difficulty: "novice" as Quest["difficulty"],
    team: "",
    estimatedTime: ""
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "novice": return "bg-green-600";
      case "adept": return "bg-blue-600";
      case "expert": return "bg-purple-600";
      case "master": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const getEligibleAgents = (quest: Quest) => {
    return agents.filter(agent => {
      if (agent.level < quest.requirements.minLevel) return false;
      if (quest.requirements.team && agent.team !== quest.requirements.team) return false;
      return true;
    });
  };

  const assignQuest = (questId: string, agentId: string) => {
    setQuests(prev => prev.map(quest => 
      quest.id === questId 
        ? { ...quest, status: "in_progress" as const, assignedAgent: agentId }
        : quest
    ));

    const quest = quests.find(q => q.id === questId);
    if (quest) {
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, currentMission: quest.title }
          : agent
      ));
    }
  };

  const createCustomQuest = () => {
    if (!customQuest.title || !customQuest.description) return;

    const newQuest: Quest = {
      id: crypto.randomUUID(),
      title: customQuest.title,
      description: customQuest.description,
      difficulty: customQuest.difficulty,
      reward: {
        xp: customQuest.difficulty === "master" ? 500 : 
            customQuest.difficulty === "expert" ? 300 :
            customQuest.difficulty === "adept" ? 150 : 100,
        equipment: `Custom ${customQuest.team} Tool`
      },
      requirements: {
        minLevel: customQuest.difficulty === "master" ? 8 :
                 customQuest.difficulty === "expert" ? 5 :
                 customQuest.difficulty === "adept" ? 3 : 1,
        team: customQuest.team || undefined
      },
      status: "available",
      progress: 0,
      estimatedTime: customQuest.estimatedTime || "TBD"
    };

    setQuests(prev => [...prev, newQuest]);
    setCustomQuest({ title: "", description: "", difficulty: "novice", team: "", estimatedTime: "" });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Available Quests</h2>
          
          <div className="space-y-4">
            {quests.map((quest) => (
              <Card key={quest.id} className="bg-slate-700/50 border-slate-600 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{quest.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{quest.description}</p>
                  </div>
                  <Badge className={`${getDifficultyColor(quest.difficulty)} text-white`}>
                    {quest.difficulty}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Requirements</p>
                    <p className="text-sm text-gray-300">
                      Level {quest.requirements.minLevel}+
                      {quest.requirements.team && ` • ${quest.requirements.team}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Estimated Time</p>
                    <p className="text-sm text-gray-300">{quest.estimatedTime}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">Rewards</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-yellow-600/30 text-yellow-300">
                      +{quest.reward.xp} XP
                    </Badge>
                    {quest.reward.equipment && (
                      <Badge variant="secondary" className="bg-blue-600/30 text-blue-300">
                        {quest.reward.equipment}
                      </Badge>
                    )}
                    {quest.reward.skill_boost && (
                      <Badge variant="secondary" className="bg-green-600/30 text-green-300">
                        +{quest.reward.skill_boost}
                      </Badge>
                    )}
                  </div>
                </div>

                {quest.status === "available" && (
                  <div className="flex items-center space-x-2">
                    <Select onValueChange={(agentId) => assignQuest(quest.id, agentId)}>
                      <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                        <SelectValue placeholder="Assign to agent..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {getEligibleAgents(quest).map((agent) => (
                          <SelectItem key={agent.id} value={agent.id} className="text-white">
                            {agent.avatar} {agent.name} (Lv.{agent.level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {quest.status === "in_progress" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        Assigned to: {agents.find(a => a.id === quest.assignedAgent)?.name}
                      </span>
                      <span className="text-sm text-gray-400">{quest.progress}%</span>
                    </div>
                    <Progress value={quest.progress} className="h-2" />
                  </div>
                )}

                {quest.status === "completed" && (
                  <Badge className="bg-green-600 text-white">Quest Completed!</Badge>
                )}
              </Card>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Create Custom Quest</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Quest Title</label>
            <input
              type="text"
              value={customQuest.title}
              onChange={(e) => setCustomQuest(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-slate-700 border-slate-600 text-white p-2 rounded"
              placeholder="Enter quest title..."
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Description</label>
            <Textarea
              value={customQuest.description}
              onChange={(e) => setCustomQuest(prev => ({ ...prev, description: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Describe the quest objectives..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Difficulty</label>
            <Select value={customQuest.difficulty} onValueChange={(value: Quest["difficulty"]) => 
              setCustomQuest(prev => ({ ...prev, difficulty: value }))
            }>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="novice" className="text-white">Novice</SelectItem>
                <SelectItem value="adept" className="text-white">Adept</SelectItem>
                <SelectItem value="expert" className="text-white">Expert</SelectItem>
                <SelectItem value="master" className="text-white">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Target Team (Optional)</label>
            <Select value={customQuest.team} onValueChange={(value) => 
              setCustomQuest(prev => ({ ...prev, team: value }))
            }>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Any team" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="finance" className="text-white">Finance</SelectItem>
                <SelectItem value="marketing" className="text-white">Marketing</SelectItem>
                <SelectItem value="sales" className="text-white">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Estimated Time</label>
            <input
              type="text"
              value={customQuest.estimatedTime}
              onChange={(e) => setCustomQuest(prev => ({ ...prev, estimatedTime: e.target.value }))}
              className="w-full bg-slate-700 border-slate-600 text-white p-2 rounded"
              placeholder="e.g., 2-3 days"
            />
          </div>

          <Button 
            onClick={createCustomQuest}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Create Quest
          </Button>
        </div>
      </Card>
    </div>
  );
};
