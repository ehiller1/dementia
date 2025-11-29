
// Define Team interface locally since it's not exported from Index
interface Team {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  abilities: string[];
}
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TeamSelectionProps {
  onTeamSelect: (team: Team) => void;
}

export const TeamSelection = ({ onTeamSelect }: TeamSelectionProps) => {
  const teams = [
    {
      id: "finance" as const,
      name: "Order of Finance",
      description: "Masters of numbers and fiscal strategy",
      icon: "💰",
      color: "from-emerald-600 to-green-700",
      abilities: ["Budget Analysis", "Risk Assessment", "Cost Optimization", "Revenue Forecasting"]
    },
    {
      id: "marketing" as const,
      name: "Guild of Marketing",
      description: "Creative strategists and brand champions",
      icon: "🎯",
      color: "from-purple-600 to-pink-700",
      abilities: ["Campaign Creation", "Brand Analysis", "Customer Insights", "Content Strategy"]
    },
    {
      id: "sales" as const,
      name: "Legion of Sales",
      description: "Persuasive warriors of commerce",
      icon: "⚡",
      color: "from-blue-600 to-cyan-700",
      abilities: ["Lead Generation", "Deal Closing", "Relationship Building", "Pipeline Management"]
    }
  ];

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          AMIGO
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Choose your department and forge the ultimate AI agents to conquer the business realm
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {teams.map((team, index) => (
          <Card 
            key={team.id}
            className="group relative overflow-hidden bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all duration-500 cursor-pointer transform hover:scale-105 animate-fade-in backdrop-blur-sm"
            style={{ animationDelay: `${index * 200}ms` }}
            onClick={() => onTeamSelect(team.id)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${team.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
            
            <div className="relative p-8 text-center">
              <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {team.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                {team.name}
              </h3>
              
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors">
                {team.description}
              </p>

              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">Core Abilities:</h4>
                {team.abilities.map((ability, i) => (
                  <div key={i} className="text-xs text-gray-500 bg-slate-700/50 px-2 py-1 rounded">
                    {ability}
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full bg-gradient-to-r ${team.color} hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform group-hover:scale-105`}
              >
                Enter {team.name}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
