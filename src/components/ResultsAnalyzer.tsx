
import { Agent } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgentResult {
  id: string;
  agentId: string;
  mission: string;
  outcome: string;
  impact: {
    metric: string;
    value: string;
    change: number;
  };
  insights: string[];
  recommendations: string[];
  timestamp: Date;
}

interface ResultsAnalyzerProps {
  agents: Agent[];
}

export const ResultsAnalyzer = ({ agents }: ResultsAnalyzerProps) => {
  // Mock results data
  const results: AgentResult[] = [
    {
      id: "1",
      agentId: agents[0]?.id || "1",
      mission: "Analyze customer color preferences",
      outcome: "Successfully identified optimal color schemes for target demographics",
      impact: {
        metric: "Conversion Rate",
        value: "12.5%",
        change: 15
      },
      insights: [
        "Blue and green colors perform 23% better with corporate clients",
        "Younger demographics prefer high-contrast color combinations",
        "Seasonal variations show 18% preference shift during Q4"
      ],
      recommendations: [
        "Implement dynamic color schemes based on user demographics",
        "A/B test seasonal color variations",
        "Update product catalog with optimized color hierarchy"
      ],
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: "2",
      agentId: agents[1]?.id || "2",
      mission: "Cross-department collaboration analysis",
      outcome: "Identified 3 key collaboration bottlenecks and solutions",
      impact: {
        metric: "Team Efficiency",
        value: "89%",
        change: 22
      },
      insights: [
        "Communication delays account for 34% of project delays",
        "Tool fragmentation reduces productivity by 12%",
        "Cross-training increases team versatility by 28%"
      ],
      recommendations: [
        "Implement unified communication platform",
        "Standardize tool stack across departments",
        "Create monthly cross-training programs"
      ],
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000)
    }
  ];

  const getAgentById = (agentId: string) => {
    return agents.find(a => a.id === agentId);
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-400" : "text-red-400";
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? "↗️" : "↘️";
  };

  const teamPerformance = agents.reduce((acc, agent) => {
    const team = agent.team || 'unassigned';
    if (!acc[team]) {
      acc[team] = { completed: 0, total: 0, avgLevel: 0 };
    }
    acc[team].total += 1;
    acc[team].avgLevel += agent.level;
    if (agent.currentMission) {
      acc[team].completed += 1;
    }
    return acc;
  }, {} as Record<string, { completed: number; total: number; avgLevel: number }>);

  Object.keys(teamPerformance).forEach(team => {
    teamPerformance[team].avgLevel = Math.round(teamPerformance[team].avgLevel / teamPerformance[team].total);
  });

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Performance Dashboard</h2>
        
        <Tabs defaultValue="individual" className="space-y-4">
          <TabsList className="bg-slate-700 border-slate-600">
            <TabsTrigger value="individual" className="data-[state=active]:bg-slate-600 text-white">
              Individual Results
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-slate-600 text-white">
              Team Performance
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-slate-600 text-white">
              Strategic Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4">
            {results.map((result) => {
              const agent = getAgentById(result.agentId);
              return (
                <Card key={result.id} className="bg-slate-700/50 border-slate-600 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{agent?.avatar}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{agent?.name}</h3>
                        <p className="text-sm text-gray-400">{result.mission}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white">Completed</Badge>
                  </div>

                  <div className="bg-slate-600/50 rounded-lg p-4 mb-4">
                    <p className="text-gray-300">{result.outcome}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Key Impact</h4>
                      <div className="bg-slate-600/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">{result.impact.metric}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-bold">{result.impact.value}</span>
                            <span className={`text-sm ${getChangeColor(result.impact.change)}`}>
                              {getChangeIcon(result.impact.change)} {Math.abs(result.impact.change)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">Key Insights</h4>
                      <div className="space-y-1">
                        {result.insights.slice(0, 2).map((insight, index) => (
                          <div key={index} className="text-sm text-gray-300 bg-slate-600/30 rounded p-2">
                            • {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold text-white mb-2">Recommendations</h4>
                    <div className="grid gap-2">
                      {result.recommendations.map((rec, index) => (
                        <div key={index} className="text-sm text-blue-300 bg-blue-600/20 rounded p-2 border border-blue-600/30">
                          💡 {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(teamPerformance).map(([team, stats]) => (
                <Card key={team} className="bg-slate-700/50 border-slate-600 p-4">
                  <h3 className="text-lg font-semibold text-white capitalize mb-3">{team} Team</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Active Missions</span>
                        <span className="text-white">{stats.completed}/{stats.total}</span>
                      </div>
                      <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Avg Level</span>
                      <Badge variant="secondary" className="bg-purple-600 text-white">
                        {stats.avgLevel}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Agents</span>
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        {stats.total}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card className="bg-slate-700/50 border-slate-600 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Strategic Insights</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-600/20 border border-green-600/30 rounded-lg">
                  <h4 className="font-semibold text-green-300 mb-2">🎯 High-Impact Opportunities</h4>
                  <p className="text-green-100 text-sm">
                    Color optimization initiatives show consistent 15%+ improvement in conversion rates across teams.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">🔄 Process Improvements</h4>
                  <p className="text-blue-100 text-sm">
                    Cross-department collaboration tools reduce project timelines by an average of 22%.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-600/20 border border-purple-600/30 rounded-lg">
                  <h4 className="font-semibold text-purple-300 mb-2">📈 Growth Recommendations</h4>
                  <p className="text-purple-100 text-sm">
                    Agents with level 5+ show 40% better mission success rates. Consider advanced training programs.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
