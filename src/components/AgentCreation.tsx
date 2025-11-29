
import { useState } from "react";
import { Team, Agent } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { TrendingUp, BarChart3, Target, Zap, Brain, Users } from "lucide-react";

interface AgentCreationProps {
  team: Team;
  onAgentCreate: (agent: Agent) => void;
  onBack: () => void;
}

export const AgentCreation = ({ team, onAgentCreate, onBack }: AgentCreationProps) => {
  const [agentName, setAgentName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [skills, setSkills] = useState({
    learning: 50,
    action: 50,
    collaboration: 50,
    analysis: 50
  });
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isSeasonalityAgent, setIsSeasonalityAgent] = useState(false);

  const teamData = {
    finance: {
      name: "Order of Finance",
      classes: [
        { id: "analyst", name: "Financial Analyst", description: "Expert in data analysis and reporting", avatar: "🧙‍♂️" },
        { id: "strategist", name: "Strategic Advisor", description: "Master of long-term planning", avatar: "🏰" },
        { id: "auditor", name: "Risk Guardian", description: "Protector against financial threats", avatar: "🛡️" }
      ],
      equipment: ["Excel Mastery", "Financial Models", "Risk Algorithms", "Budget Tracker", "Audit Tools", "Compliance Framework"]
    },
    marketing: {
      name: "Guild of Marketing",
      classes: [
        { id: "creative", name: "Creative Visionary", description: "Master of brand and content", avatar: "🎨" },
        { id: "analyst", name: "Data Sage", description: "Expert in marketing analytics", avatar: "🔮" },
        { id: "growth", name: "Growth Hacker", description: "Specialist in rapid expansion", avatar: "🚀" }
      ],
      equipment: ["Analytics Dashboard", "Content Templates", "Social Media Tools", "A/B Testing Kit", "Customer Insights", "Brand Guidelines"]
    },
    sales: {
      name: "Legion of Sales",
      classes: [
        { id: "hunter", name: "Lead Hunter", description: "Expert at finding new opportunities", avatar: "🏹" },
        { id: "closer", name: "Deal Closer", description: "Master of negotiations", avatar: "⚔️" },
        { id: "farmer", name: "Relationship Farmer", description: "Specialist in long-term relationships", avatar: "🌱" }
      ],
      equipment: ["CRM System", "Sales Scripts", "Proposal Templates", "Negotiation Tactics", "Pipeline Tools", "Customer Database"]
    }
  };

  const currentTeamData = teamData[team!];

  const handleSkillChange = (skill: string, value: number[]) => {
    setSkills(prev => ({ ...prev, [skill]: value[0] }));
  };

  const toggleEquipment = (item: string) => {
    setSelectedEquipment(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const handleSeasonalityToggle = () => {
    setIsSeasonalityAgent(!isSeasonalityAgent);
    
    if (!isSeasonalityAgent) {
      // Auto-configure for seasonality analysis
      setSkills({
        learning: 80,
        action: 60,
        collaboration: 70,
        analysis: 90
      });
      setSelectedEquipment(prev => [...prev, "STL Decomposition", "Time Series Analysis", "Pattern Recognition"]);
      
      // Auto-select analyst class if not already selected
      if (!selectedClass) {
        setSelectedClass("analyst");
      }
    } else {
      // Reset to default
      setSkills({
        learning: 50,
        action: 50,
        collaboration: 50,
        analysis: 50
      });
      setSelectedEquipment(prev => prev.filter(item => 
        !["STL Decomposition", "Time Series Analysis", "Pattern Recognition"].includes(item)
      ));
    }
  };

  const handleCreateAgent = () => {
    if (!agentName || !selectedClass) return;

    const agent: Agent = {
      id: crypto.randomUUID(),
      name: agentName,
      team,
      class: selectedClass,
      level: 1,
      skills,
      equipment: selectedEquipment,
      avatar: currentTeamData.classes.find(c => c.id === selectedClass)?.avatar || "👤"
    };

    onAgentCreate(agent);
  };

  const skillTotal = Object.values(skills).reduce((sum, val) => sum + val, 0);
  const maxSkillPoints = 200;

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="outline" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
            ← Back to Teams
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create Agent - {currentTeamData.name}
          </h1>
          <div className="w-20" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Basic Info & Class Selection */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Agent Identity</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-gray-300">Agent Name</Label>
                <Input 
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Enter your agent's name..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <Separator className="bg-slate-600 my-6" />

            <h3 className="text-xl font-bold text-white mb-4">Choose Class</h3>
            <div className="space-y-3">
              {currentTeamData.classes.map((cls) => (
                <Card 
                  key={cls.id}
                  className={`p-4 cursor-pointer transition-all duration-300 ${
                    selectedClass === cls.id 
                      ? 'bg-blue-600/30 border-blue-500' 
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => setSelectedClass(cls.id)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{cls.avatar}</span>
                    <div>
                      <h4 className="font-semibold text-white">{cls.name}</h4>
                      <p className="text-sm text-gray-400">{cls.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Skills Configuration */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Skill Allocation 
              <span className="text-sm text-gray-400 ml-2">
                ({skillTotal}/{maxSkillPoints} points)
              </span>
            </h2>
            
            <div className="space-y-6">
              {Object.entries(skills).map(([skill, value]) => (
                <div key={skill}>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-gray-300 capitalize">{skill}</Label>
                    <span className="text-blue-400 font-semibold">{value}</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={(val) => handleSkillChange(skill, val)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <Separator className="bg-slate-600 my-6" />

            {/* Specialist Selection */}
            <h3 className="text-xl font-bold text-white mb-4">Demand Specialists</h3>
            <div className="mb-6">
              <Carousel className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {/* Active Seasonality Specialist */}
                  <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
                    <Card 
                      className={`p-4 cursor-pointer transition-all duration-300 ${
                        isSeasonalityAgent 
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-purple-500' 
                          : 'bg-slate-700/50 border-slate-600 hover:border-purple-400'
                      }`}
                      onClick={handleSeasonalityToggle}
                    >
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-6 w-6 text-purple-400" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            <span>Seasonality Specialist</span>
                            {isSeasonalityAgent && <Badge variant="secondary" className="text-xs">Active</Badge>}
                          </h4>
                          <p className="text-sm text-gray-400">
                            Auto-configure agent for advanced seasonality analysis with specialized skills and equipment
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>

                  {/* Demand Forecasting Specialist - Coming Soon */}
                  <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
                    <Card className="p-4 bg-slate-700/30 border-slate-600 opacity-60">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="h-6 w-6 text-gray-500" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-400 flex items-center gap-2">
                            <span>Demand Forecasting Specialist</span>
                            <Badge variant="outline" className="text-xs border-gray-500 text-gray-500">Coming Soon</Badge>
                          </h4>
                          <p className="text-sm text-gray-500">
                            Advanced predictive modeling for demand forecasting and capacity planning
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>

                  {/* Market Response Specialist - Coming Soon */}
                  <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
                    <Card className="p-4 bg-slate-700/30 border-slate-600 opacity-60">
                      <div className="flex items-center space-x-3">
                        <Target className="h-6 w-6 text-gray-500" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-400 flex items-center gap-2">
                            <span>Market Response Specialist</span>
                            <Badge variant="outline" className="text-xs border-gray-500 text-gray-500">Coming Soon</Badge>
                          </h4>
                          <p className="text-sm text-gray-500">
                            Analyze campaign effectiveness and market response patterns
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>

                  {/* Demand Generation Specialist - Coming Soon */}
                  <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
                    <Card className="p-4 bg-slate-700/30 border-slate-600 opacity-60">
                      <div className="flex items-center space-x-3">
                        <Zap className="h-6 w-6 text-gray-500" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-400 flex items-center gap-2">
                            <span>Demand Generation Specialist</span>
                            <Badge variant="outline" className="text-xs border-gray-500 text-gray-500">Coming Soon</Badge>
                          </h4>
                          <p className="text-sm text-gray-500">
                            Optimize lead generation and customer acquisition strategies
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>

                  {/* Customer Behavior Analyst - Coming Soon */}
                  <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
                    <Card className="p-4 bg-slate-700/30 border-slate-600 opacity-60">
                      <div className="flex items-center space-x-3">
                        <Brain className="h-6 w-6 text-gray-500" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-400 flex items-center gap-2">
                            <span>Customer Behavior Analyst</span>
                            <Badge variant="outline" className="text-xs border-gray-500 text-gray-500">Coming Soon</Badge>
                          </h4>
                          <p className="text-sm text-gray-500">
                            Deep dive into customer journey and behavioral patterns
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>

                  {/* Cross-Channel Attribution Specialist - Coming Soon */}
                  <CarouselItem className="pl-2 md:pl-4 md:basis-1/2">
                    <Card className="p-4 bg-slate-700/30 border-slate-600 opacity-60">
                      <div className="flex items-center space-x-3">
                        <Users className="h-6 w-6 text-gray-500" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-400 flex items-center gap-2">
                            <span>Cross-Channel Attribution Specialist</span>
                            <Badge variant="outline" className="text-xs border-gray-500 text-gray-500">Coming Soon</Badge>
                          </h4>
                          <p className="text-sm text-gray-500">
                            Track and optimize multi-channel marketing attribution
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600" />
                <CarouselNext className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600" />
              </Carousel>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">Equipment & Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {currentTeamData.equipment.map((item) => (
                <Button
                  key={item}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${
                    selectedEquipment.includes(item)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                  }`}
                  onClick={() => toggleEquipment(item)}
                >
                  {item}
                </Button>
              ))}
              
              {/* Seasonality-specific equipment */}
              {isSeasonalityAgent && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-purple-600 border-purple-500 text-white"
                    disabled
                  >
                    STL Decomposition
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-purple-600 border-purple-500 text-white"
                    disabled
                  >
                    Time Series Analysis
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-purple-600 border-purple-500 text-white"
                    disabled
                  >
                    Pattern Recognition
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={handleCreateAgent}
            disabled={!agentName || !selectedClass}
            className={`font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSeasonalityAgent 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            }`}
          >
            {isSeasonalityAgent ? 'Forge Seasonality Agent' : 'Forge Agent'}
          </Button>
        </div>
      </div>
    </div>
  );
};
