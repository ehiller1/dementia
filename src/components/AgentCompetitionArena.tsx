import React, { useState, useEffect } from 'react';
import { Upload, Trophy, Brain, TrendingUp, BarChart3, Users } from 'lucide-react';

interface CompetingAgent {
  id: string;
  name: string;
  specialty: string;
  icon: string;
  confidence: number;
  insights: number;
  analysis: string;
  reasoning: string[];
  status: 'analyzing' | 'complete' | 'selected';
}

interface AgentCompetitionArenaProps {
  onAnalysisComplete?: (winningAnalysis: CompetingAgent, allAnalyses: CompetingAgent[]) => void;
  demoMode?: boolean;
}

const AgentCompetitionArena: React.FC<AgentCompetitionArenaProps> = ({
  onAnalysisComplete,
  demoMode = false
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [competitionStarted, setCompetitionStarted] = useState(false);
  const [agents, setAgents] = useState<CompetingAgent[]>([]);
  const [winner, setWinner] = useState<CompetingAgent | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const initialAgents: CompetingAgent[] = [
    {
      id: 'financial-analyst',
      name: 'Financial Analyst',
      specialty: 'Revenue & Profitability Analysis',
      icon: '💰',
      confidence: 0,
      insights: 0,
      analysis: '',
      reasoning: [],
      status: 'analyzing'
    },
    {
      id: 'operations-expert',
      name: 'Operations Expert',
      specialty: 'Supply Chain & Inventory',
      icon: '⚙️',
      confidence: 0,
      insights: 0,
      analysis: '',
      reasoning: [],
      status: 'analyzing'
    },
    {
      id: 'marketing-strategist',
      name: 'Marketing Strategist',
      specialty: 'Customer & Campaign Analysis',
      icon: '📈',
      confidence: 0,
      insights: 0,
      analysis: '',
      reasoning: [],
      status: 'analyzing'
    },
    {
      id: 'data-scientist',
      name: 'Data Scientist',
      specialty: 'Statistical & Predictive Analysis',
      icon: '🔬',
      confidence: 0,
      insights: 0,
      analysis: '',
      reasoning: [],
      status: 'analyzing'
    }
  ];

  useEffect(() => {
    if (demoMode) {
      // Auto-start demo with sample data
      setTimeout(() => {
        handleDemoUpload();
      }, 1000);
    }
  }, [demoMode]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDemoUpload = () => {
    setUploadedFile(new File(['demo'], 'quarterly-performance.xlsx'));
    startCompetition();
  };

  const startCompetition = async () => {
    setCompetitionStarted(true);
    setIsAnalyzing(true);
    setAgents(initialAgents);
    setAnalysisProgress(0);

    // Simulate agent competition with realistic timing
    const competitionDuration = 8000; // 8 seconds
    const updateInterval = 200; // Update every 200ms

    const progressTimer = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = prev + (100 / (competitionDuration / updateInterval));
        return Math.min(newProgress, 100);
      });
    }, updateInterval);

    // Simulate agents completing analysis at different times
    const agentCompletionTimes = [3000, 4500, 6000, 7500];
    
    agentCompletionTimes.forEach((time, index) => {
      setTimeout(() => {
        setAgents(prevAgents => {
          const updatedAgents = [...prevAgents];
          const agent = updatedAgents[index];
          
          // Generate realistic analysis results
          const analysisResults = generateAgentAnalysis(agent);
          updatedAgents[index] = {
            ...agent,
            ...analysisResults,
            status: 'complete'
          };
          
          return updatedAgents;
        });
      }, time);
    });

    // Determine winner after all agents complete
    setTimeout(() => {
      clearInterval(progressTimer);
      setAnalysisProgress(100);
      setIsAnalyzing(false);
      determineWinner();
    }, competitionDuration);
  };

  const generateAgentAnalysis = (agent: CompetingAgent) => {
    const analyses = {
      'financial-analyst': {
        confidence: 94,
        insights: 12,
        analysis: "Revenue declined 8% QoQ with 23% margin compression. Customer acquisition costs increased 45% while inventory carrying costs rose 15%. Critical cash flow impact requiring immediate action.",
        reasoning: [
          "Identified 23% margin compression trend",
          "Detected rising customer acquisition costs",
          "Calculated inventory carrying cost impact",
          "Projected cash flow implications"
        ]
      },
      'operations-expert': {
        confidence: 89,
        insights: 10,
        analysis: "Inventory turnover dropped 18% indicating demand forecasting issues. Safety stock levels exceeded by 25%, suggesting overstock in slow-moving categories.",
        reasoning: [
          "Analyzed inventory turnover ratios",
          "Identified demand forecasting gaps",
          "Calculated safety stock optimization",
          "Detected category performance variance"
        ]
      },
      'marketing-strategist': {
        confidence: 87,
        insights: 8,
        analysis: "Customer acquisition costs rising while conversion rates dropped 12%. Campaign efficiency declining across all channels, particularly digital advertising.",
        reasoning: [
          "Tracked customer acquisition cost trends",
          "Measured conversion rate performance",
          "Analyzed campaign efficiency metrics",
          "Identified channel-specific issues"
        ]
      },
      'data-scientist': {
        confidence: 82,
        insights: 15,
        analysis: "Statistical analysis reveals strong seasonal correlation (r=0.78) but underlying trend shows systematic decline. Predictive models suggest continued deterioration without intervention.",
        reasoning: [
          "Performed correlation analysis",
          "Built predictive models",
          "Identified statistical patterns",
          "Quantified trend significance"
        ]
      }
    };

    return analyses[agent.id as keyof typeof analyses] || {
      confidence: 75,
      insights: 5,
      analysis: "Analysis in progress...",
      reasoning: ["Processing data..."]
    };
  };

  const determineWinner = () => {
    setAgents(prevAgents => {
      const sortedAgents = [...prevAgents].sort((a, b) => b.confidence - a.confidence);
      const winningAgent = sortedAgents[0];
      
      const updatedAgents = sortedAgents.map(agent => ({
        ...agent,
        status: agent.id === winningAgent.id ? 'selected' : 'complete'
      })) as CompetingAgent[];
      
      setWinner(winningAgent);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(winningAgent, updatedAgents);
      }
      
      return updatedAgents;
    });
  };

  const getRankIcon = (index: number) => {
    const icons = ['🥇', '🥈', '🥉', '🏅'];
    return icons[index] || '🏅';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzing': return 'bg-yellow-100 text-yellow-800';
      case 'complete': return 'bg-blue-100 text-blue-800';
      case 'selected': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
        <h2 className="text-2xl font-bold">Agent Competition Arena</h2>
      </div>

      {!competitionStarted ? (
        <div className="text-center py-12">
          <div className="mb-8">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Business Data</h3>
            <p className="text-gray-600 mb-6">
              Upload a spreadsheet and watch our agents compete to provide the best analysis
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose Spreadsheet
            </label>

            {demoMode && (
              <button
                onClick={handleDemoUpload}
                className="ml-4 inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Use Demo Data
              </button>
            )}
          </div>

          {uploadedFile && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Selected: <span className="font-medium">{uploadedFile.name}</span>
              </p>
              <button
                onClick={startCompetition}
                className="mt-3 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Start Agent Competition
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Analysis Progress</span>
                <span className="text-sm text-gray-600">{Math.round(analysisProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Competition Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Competing Agents</h3>
              {agents
                .sort((a, b) => b.confidence - a.confidence)
                .map((agent, index) => (
                  <div
                    key={agent.id}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      agent.status === 'selected'
                        ? 'border-green-500 bg-green-50'
                        : agent.status === 'complete'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getRankIcon(index)}</span>
                        <span className="text-xl mr-2">{agent.icon}</span>
                        <div>
                          <h4 className="font-semibold">{agent.name}</h4>
                          <p className="text-sm text-gray-600">{agent.specialty}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status === 'analyzing' ? 'Analyzing...' : 
                         agent.status === 'selected' ? 'Winner!' : 'Complete'}
                      </span>
                    </div>

                    {agent.status !== 'analyzing' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Confidence: <strong>{agent.confidence}%</strong></span>
                          <span>Insights: <strong>{agent.insights}</strong></span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${agent.confidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Winning Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              
              {winner ? (
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                    <h4 className="text-lg font-semibold text-green-800">
                      {winner.name} Wins!
                    </h4>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Key Insights:</h5>
                    <p className="text-sm text-gray-700">{winner.analysis}</p>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Reasoning Process:</h5>
                    <ul className="space-y-1">
                      {winner.reasoning.map((reason, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-center">
                    <Brain className="h-8 w-8 text-gray-400 mr-3 animate-pulse" />
                    <p className="text-gray-600">Agents are analyzing your data...</p>
                  </div>
                </div>
              )}

              {!isAnalyzing && agents.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setCompetitionStarted(false);
                      setUploadedFile(null);
                      setWinner(null);
                      setAgents([]);
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Start New Competition
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCompetitionArena;
