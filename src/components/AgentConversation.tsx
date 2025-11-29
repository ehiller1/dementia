import { useState, useRef, useEffect } from "react";
import { Agent } from '../pages/Index';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAgentConversation } from '../hooks/useAgentConversation';
import { useSeasonalityAgent } from '../hooks/useSeasonalityAgent';
import { ConversationalFileUpload } from './ConversationalFileUpload';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

interface AgentConversationProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent | null) => void;
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

export const AgentConversation = ({ agents, selectedAgent, onSelectAgent, setAgents }: AgentConversationProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedCsvData, setUploadedCsvData] = useState<{fileName: string, data: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { conversation, messages, sendMessage, sendSystemMessage, isLoading } = useAgentConversation(selectedAgent?.id || null);
  const { analyzeSeasonality, isAnalyzing } = useSeasonalityAgent(selectedAgent?.id || 'default');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectSeasonalityRequest = (message: string): boolean => {
    const seasonalityKeywords = [
      'seasonal', 'seasonality', 'stl', 'decomposition', 'trend', 'time series',
      'periodic', 'cyclical', 'recurring', 'pattern', 'weekly', 'monthly', 
      'quarterly', 'yearly', 'annual', 'seasonal component'
    ];
    
    const analysisKeywords = ['analyze', 'analysis', 'decompose', 'detect', 'identify', 'find'];
    
    const lowerMessage = message.toLowerCase();
    const hasSeasonalityTerm = seasonalityKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasAnalysisTerm = analysisKeywords.some(keyword => lowerMessage.includes(keyword));
    
    return hasSeasonalityTerm && hasAnalysisTerm;
  };

  // Enhanced upload detection function
  const detectUploadRequest = (message: string): boolean => {
    const uploadKeywords = [
      'upload', 'data', 'csv', 'file', 'dataset', 'provide data', 'load data', 
      'import', 'need to upload', 'want to upload', 'have data', 'my data',
      'upload a file', 'upload data', 'upload csv', 'need data', 'share data',
      'analyze my data', 'process my file', 'can i upload', 'can you accept',
      'do you accept', 'accept data', 'accept file', 'accept upload',
      'take data', 'receive data', 'handle data', 'process data',
      'bring data', 'send data', 'give data', 'share file'
    ];
    const lowerMessage = message.toLowerCase();
    return uploadKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const handleFileUpload = async (csvData: string, fileName: string) => {
    console.log('File uploaded:', fileName, 'Data length:', csvData.length);
    
    // Store the CSV data in component state
    setUploadedCsvData({
      fileName,
      data: csvData
    });
    
    // Hide the upload interface
    setShowFileUpload(false);
    
    // Calculate basic stats about the data
    const rowCount = csvData.split('\n').length - 1;
    const fileSizeKB = (csvData.length / 1024).toFixed(1);
    
    // Create metadata for the system message
    const fileMetadata = {
      fileName,
      fileSizeKB,
      rowCount,
      uploadTimestamp: new Date().toISOString(),
      dataAvailable: true,
      dataType: 'csv'
    };
    
    // First, send a SYSTEM message (not through OpenAI) about the successful upload
    await sendSystemMessage(
      `📁 **Data Upload Successful**: ${fileName}\n\n✅ **Upload Details:**\n• File size: ${fileSizeKB} KB\n• Rows detected: ~${rowCount}\n• Status: Ready for analysis`,
      fileMetadata
    );
    
    // Then, after a short delay, send a follow-up system message with next steps
    // This separation helps prevent confusion in the message flow
    setTimeout(async () => {
      await sendSystemMessage(
        `🔍 **Next Steps for Your Data:**\nI can now perform seasonality analysis on your data! Ask me to:\n• Analyze seasonal patterns in your data\n• Perform STL decomposition\n• Generate business insights\n• Detect trends and cycles\n\nYour data is now available for real statistical analysis.`,
        {
          ...fileMetadata,
          isNextStepsMessage: true
        }
      );
    }, 1000);
  };

  const handleCancelUpload = () => {
    console.log('Upload cancelled');
    setShowFileUpload(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedAgent) {
      toast({
        title: "Error",
        description: "Please select an agent and enter a message",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Handling message send for agent:', selectedAgent.name, selectedAgent.id);
      
      // Enhanced upload detection for analyst agents
      const isUploadRequest = selectedAgent.class === 'analyst' && detectUploadRequest(inputValue);
      
      if (isUploadRequest) {
        console.log('Upload request detected for analyst agent - showing upload interface');
        
        // Show the file upload interface
        setShowFileUpload(true);
        
        // Send the user's message first
        await sendMessage(inputValue);
        
        // Then send a separate SYSTEM message (not through OpenAI) about the upload interface
        // This will appear as a system notification, not as a user or AI message
        setTimeout(async () => {
          await sendSystemMessage(
            `📤 **Upload Interface Opened**\n\n✅ **Ready to Accept Your Data!**\n\nPlease use the upload interface below to select your CSV file. I can process:\n• Time series data with dates and values\n• Sales, revenue, performance metrics\n• Any periodic/seasonal business data\n• Custom datasets with temporal patterns\n\nOnce uploaded, I'll analyze it with real statistical methods including STL decomposition and business insights generation.`,
            {
              uploadInterfaceOpened: true,
              timestamp: new Date().toISOString()
            }
          );
        }, 500);
        
        setInputValue("");
        return;
      }

      // Check if this is a data analysis request (seasonality or general analysis)
      const isSeasonalityRequest = selectedAgent.class === 'analyst' && detectSeasonalityRequest(inputValue);
      const isDataAnalysisRequest = selectedAgent.class === 'analyst' && 
        (inputValue.toLowerCase().includes('analyze') || 
         inputValue.toLowerCase().includes('analysis') || 
         inputValue.toLowerCase().includes('data') || 
         inputValue.toLowerCase().includes('insights') || 
         inputValue.toLowerCase().includes('patterns'));

      // Check if we have uploaded CSV data to include with the request
      if (uploadedCsvData && (isSeasonalityRequest || isDataAnalysisRequest)) {
        console.log('Detected analysis request with uploaded data available');
        
        // Prepare CSV data metadata to send with the request
        const csvMetadata = {
          fileName: uploadedCsvData.fileName,
          rowCount: uploadedCsvData.data.split('\n').length - 1,
          fileSizeKB: (uploadedCsvData.data.length / 1024).toFixed(1),
          uploadTimestamp: new Date().toISOString(),
          // We're not sending the full CSV data in every request to avoid performance issues
          // Instead, we're sending metadata and the first few rows as a sample
          csvSample: uploadedCsvData.data.split('\n').slice(0, 5).join('\n')
        };
        
        // Send the original message with CSV metadata
        console.log('Sending message with CSV metadata');
        await sendMessage(inputValue, {
          csvData: csvMetadata,
          hasUploadedData: true,
          analysisType: isSeasonalityRequest ? 'seasonality' : 'general'
        });
        
        // If it's specifically a seasonality request, also trigger the seasonality analysis
        if (isSeasonalityRequest) {
          console.log('Triggering seasonality analysis');
          const analysisResult = await analyzeSeasonality({
            query: inputValue,
            dataDescription: uploadedCsvData.fileName,
            period: 12,
            analysisType: 'stl'
          });

          if (analysisResult) {
            // Send analysis results as follow-up message
            const analysisMessage = `🔍 **Seasonality Analysis Complete**\n\n**Method**: ${analysisResult.method}\n\n**Summary**: ${analysisResult.summary}\n\n**Key Insights**:\n${analysisResult.insights.map(insight => `• ${insight}`).join('\n')}\n\n**Recommendations**:\n${analysisResult.recommendations.map(rec => `• ${rec}`).join('\n')}`;
            
            // Use setTimeout to ensure the analysis message appears after the original
            setTimeout(async () => {
              try {
                await sendMessage(analysisMessage);
              } catch (error) {
                console.error('Error sending analysis results:', error);
              }
            }, 1000);
          }
        }
      } else if (isSeasonalityRequest) {
        // Seasonality request but no data uploaded yet
        console.log('Detected seasonality analysis request without uploaded data');
        
        // Send the original message first
        await sendMessage(inputValue);
        
        // Then trigger seasonality analysis
        const analysisResult = await analyzeSeasonality({
          query: inputValue,
          dataDescription: "Conversational analysis request",
          period: 12,
          analysisType: 'stl'
        });

        if (analysisResult) {
          // Send analysis results as follow-up message
          const analysisMessage = `🔍 **Seasonality Analysis Complete**\n\n**Method**: ${analysisResult.method}\n\n**Summary**: ${analysisResult.summary}\n\n**Key Insights**:\n${analysisResult.insights.map(insight => `• ${insight}`).join('\n')}\n\n**Recommendations**:\n${analysisResult.recommendations.map(rec => `• ${rec}`).join('\n')}`;
          
          // Use setTimeout to ensure the analysis message appears after the original
          setTimeout(async () => {
            try {
              await sendMessage(analysisMessage);
            } catch (error) {
              console.error('Error sending analysis results:', error);
            }
          }, 1000);
        }
      } else {
        // Regular conversation
        console.log('Sending regular message');
        await sendMessage(inputValue);
      }
      
      setInputValue("");
    } catch (error) {
      console.error('Error in conversation:', error);
      // Error is already handled in sendMessage with toast
    }
  };

  const assignQuickTask = async (taskType: string, agent: Agent) => {
    const tasks = {
      analyze: `Analyze market trends for ${agent.team} department`,
      learn: `Learn about customer behavior patterns in ${agent.team}`,
      collaborate: `Collaborate with other teams on cross-functional project`
    };

    const taskDescription = tasks[taskType as keyof typeof tasks];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create mission in database
      const { data: mission, error } = await supabase
        .from('missions')
        .insert({
          user_id: user.id,
          title: `Quick Task: ${taskType}`,
          description: taskDescription,
          assigned_agent_id: agent.id,
          status: 'in_progress',
          difficulty_level: 1,
          experience_reward: 25
        })
        .select()
        .single();

      if (error) throw error;

      // Update agent with current mission
      await supabase
        .from('agents')
        .update({ current_mission_id: mission.id })
        .eq('id', agent.id);

      // Update local state
      setAgents(prev => prev.map(a => 
        a.id === agent.id 
          ? { ...a, currentMission: taskDescription }
          : a
      ));

      toast({
        title: "Task Assigned",
        description: `${agent.name} has been assigned a new task`,
      });

      // Send task assignment message
      if (selectedAgent?.id === agent.id) {
        await sendMessage(`📋 Quick Task: ${taskDescription}`);
      }

    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive"
      });
    }
  };

  // Regular agent conversation interface
  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700 backdrop-blur-sm p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Available Agents</h3>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedAgent?.id === agent.id
                  ? 'bg-blue-600/30 border-blue-500'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
              onClick={() => onSelectAgent(agent)}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-lg">{agent.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium text-sm">{agent.name}</p>
                  <p className="text-xs text-gray-400">{agent.class} • Lv.{agent.level}</p>
                  {agent.class === 'analyst' && (
                    <p className="text-xs text-green-400">✨ Data Upload & Analysis</p>
                  )}
                </div>
              </div>
              {agent.currentMission && (
                <Badge variant="secondary" className="mt-2 text-xs bg-yellow-600/30 text-yellow-300">
                  On Mission
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {selectedAgent ? `Conversing with ${selectedAgent.name}` : "Select an Agent"}
            </h3>
            {selectedAgent && (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => assignQuickTask("analyze", selectedAgent)}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  📊 Analyze
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => assignQuickTask("learn", selectedAgent)}
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  🧠 Learn
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => assignQuickTask("collaborate", selectedAgent)}
                  className="bg-purple-600 hover:bg-purple-700 text-xs"
                >
                  🤝 Collaborate
                </Button>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="h-96 p-4">
          <div className="space-y-4">
            {selectedAgent && messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">{selectedAgent.avatar}</div>
                <p className="text-gray-400">Start a conversation with {selectedAgent.name}!</p>
                {selectedAgent.class === 'analyst' && (
                  <div className="mt-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <p className="text-green-300 text-sm font-medium">✨ Data Upload & Analysis Available</p>
                    <p className="text-green-400/80 text-xs mt-1">
                      Ask me to analyze your data, upload CSV files, or perform seasonality analysis
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-gray-300"
                }`}>
                  {message.sender_type === "agent" && selectedAgent && (
                    <div className="flex items-center space-x-2 mb-1">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {selectedAgent.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {selectedAgent.name}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* File Upload Interface - Shows when upload is requested */}
            {showFileUpload && (
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                <ConversationalFileUpload
                  onFileUpload={handleFileUpload}
                  onCancel={handleCancelUpload}
                  isVisible={showFileUpload}
                />
              </div>
            )}
            
            {(isLoading || isAnalyzing) && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-gray-300 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    {isAnalyzing ? (
                      <span className="text-sm">🔍 Running seasonality analysis...</span>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-700">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={selectedAgent ? 
                selectedAgent.class === 'analyst' ? 
                  `Ask ${selectedAgent.name} about data analysis or upload files...` : 
                  `Message ${selectedAgent.name}...` 
                : "Select an agent first..."
              }
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={!selectedAgent || isLoading || isAnalyzing}
            />
            <Button 
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!selectedAgent || isLoading || isAnalyzing}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
