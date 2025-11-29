import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAgentConversation } from '@/hooks/useAgentConversation';
import { useSeasonalityAgent } from '@/hooks/useSeasonalityAgent';
import { ConversationalFileUpload } from '@/components/ConversationalFileUpload';
import { ConversationSelector } from '@/components/ConversationSelector';
import { Agent } from '@/pages/Index';
import { TrendingUp, Loader2, Upload, BarChart3, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { categorizeMessage, getSystemCategory, formatAnalysisResult, EnhancedMessage } from '@/utils/messageUtils';

interface SeasonalityConversationAgentProps {
  agent: Agent;
  conversationId?: string;
}

interface DataUploadState {
  csvData: string;
  fileName: string;
  isProcessed: boolean;
  processingError?: string;
  dataQuality?: string;
}

export const SeasonalityConversationAgent = ({ agent, conversationId: initialConversationId }: SeasonalityConversationAgentProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedData, setUploadedData] = useState<DataUploadState | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(initialConversationId);
  
  const { 
    conversation, 
    messages, 
    conversations,
    sendMessage, 
    createNewConversation,
    switchToConversation,
    loadConversations,
    isLoading 
  } = useAgentConversation(agent.id, currentConversationId);
  
  const { analyzeSeasonality, isAnalyzing } = useSeasonalityAgent(agent.id);

  // Enhanced messages with proper categorization
  const [enhancedMessages, setEnhancedMessages] = useState<EnhancedMessage[]>([]);

  useEffect(() => {
    // Categorize messages for proper display
    const categorized = messages.map(msg => ({
      ...msg,
      message_type: categorizeMessage(msg.content, msg.sender_type),
      system_category: msg.sender_type === 'system' ? getSystemCategory(msg.content) : undefined
    })) as EnhancedMessage[];
    
    setEnhancedMessages(categorized);
  }, [messages]);

  // Enhanced upload detection with more comprehensive keywords
  const shouldShowUpload = (content: string) => {
    const uploadKeywords = [
      'upload', 'data', 'csv', 'file', 'dataset', 'provide data', 'load data', 
      'import', 'need to upload', 'want to upload', 'have data', 'my data',
      'upload a file', 'upload data', 'upload csv', 'need data', 'share data',
      'analyze my data', 'process my file', 'can i upload', 'can you accept',
      'do you accept', 'accept data', 'accept file', 'accept upload',
      'take data', 'receive data', 'handle data', 'process data',
      'bring data', 'send data', 'give data', 'share file'
    ];
    const lowerContent = content.toLowerCase();
    return uploadKeywords.some(keyword => lowerContent.includes(keyword));
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    switchToConversation(conversationId);
    // Clear uploaded data when switching conversations
    setUploadedData(null);
    setShowFileUpload(false);
  };

  const handleCreateNewConversation = async (title?: string) => {
    const newConversation = await createNewConversation(title);
    if (newConversation) {
      setCurrentConversationId(newConversation.id);
      // Clear uploaded data for new conversation
      setUploadedData(null);
      setShowFileUpload(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    console.log('Enhanced message handling for agent:', agent.name, agent.id);
    console.log('Input message:', inputValue);
    console.log('Upload detection result:', shouldShowUpload(inputValue));

    try {
      // IMMEDIATELY check for upload requests and show interface
      if (shouldShowUpload(inputValue)) {
        console.log('Upload request detected - showing enhanced upload interface');
        setShowFileUpload(true);
        
        // Send enhanced message about opening upload interface
        await sendMessage(`📤 **Enhanced Data Upload Interface Opened**\n\n${inputValue}\n\n✨ **Yes, I can accept your data uploads!**\n\n**New Features Available:**\n• Real-time data validation\n• Automatic quality assessment\n• Business insights generation\n• STL decomposition with your data\n\nPlease drag and drop your CSV file or click "Browse Files" to select it. I'll validate the data and provide quality insights before analysis.`);
        setInputValue("");
        return;
      }

      // Enhanced seasonality analysis detection
      const isSeasonalityRequest = inputValue.toLowerCase().includes('seasonal') || 
                                  inputValue.toLowerCase().includes('stl') ||
                                  inputValue.toLowerCase().includes('decomposition') ||
                                  inputValue.toLowerCase().includes('trend') ||
                                  inputValue.toLowerCase().includes('analyze') ||
                                  inputValue.toLowerCase().includes('pattern');

      if (isSeasonalityRequest && (inputValue.toLowerCase().includes('analyze') || uploadedData)) {
        console.log('Enhanced seasonality analysis request detected');
        
        // Send user message first
        await sendMessage(inputValue);
        
        // Prepare enhanced analysis request
        const analysisRequest = {
          query: inputValue,
          dataDescription: uploadedData ? 
            `Real user data: ${uploadedData.fileName} (Quality: ${uploadedData.dataQuality || 'Processing'})` : 
            "Conversational analysis request with synthetic data",
          period: 12,
          analysisType: 'stl' as const,
          csvData: uploadedData?.csvData,
          parameters: {
            useRealData: !!uploadedData,
            fileName: uploadedData?.fileName,
            enhancedProcessing: true
          }
        };

        // Run enhanced seasonality analysis
        const analysisResult = await analyzeSeasonality(analysisRequest);

        if (analysisResult) {
          // Enhanced formatting for real data analysis
          const formattedResult = formatEnhancedAnalysisResult(analysisResult, !!uploadedData);
          
          // Send as enhanced agent message
          await sendMessage(`[ENHANCED SYSTEM ANALYSIS]\n\n${formattedResult}`);
          
          // If data was processed, update the upload state
          if (uploadedData && analysisResult.execution_details?.dataQuality) {
            setUploadedData(prev => prev ? {
              ...prev,
              isProcessed: true,
              dataQuality: analysisResult.execution_details.dataQuality
            } : null);
          }
        }
      } else {
        // Regular conversation
        console.log('Sending regular message');
        await sendMessage(inputValue);
      }
      
      setInputValue("");
    } catch (error) {
      console.error('Error in enhanced seasonality conversation:', error);
    }
  };

  const handleFileUpload = async (csvData: string, fileName: string) => {
    console.log('Enhanced file upload:', fileName, 'Data length:', csvData.length);
    
    // Set initial upload state
    setUploadedData({ 
      csvData, 
      fileName, 
      isProcessed: false,
      dataQuality: 'Processing...'
    });
    setShowFileUpload(false);
    
    // Send enhanced confirmation message
    await sendMessage(`📁 **Enhanced Data Upload Successful**: ${fileName}\n\n✅ **Upload Details:**\n• File size: ${(csvData.length / 1024).toFixed(1)} KB\n• Rows detected: ~${csvData.split('\n').length - 1}\n• Status: Ready for analysis\n\n🔍 **Next Steps:**\nI can now perform real seasonality analysis on your data! Ask me to:\n• Analyze seasonal patterns in your data\n• Perform STL decomposition\n• Generate business insights\n• Detect trends and cycles\n\nYour data will be processed with real statistical calculations instead of synthetic examples.`);
  };

  const handleCancelUpload = () => {
    console.log('Enhanced upload cancelled');
    setShowFileUpload(false);
  };

  const handleForceUpload = () => {
    console.log('Force showing enhanced upload interface');
    setShowFileUpload(true);
  };

  // Enhanced quick test queries
  const quickTestQueries = [
    "Can I upload my CSV file for real analysis?",
    "Analyze my data for seasonal patterns using STL", 
    "What seasonality insights can you find in my data?",
    "Generate Python code for analyzing my dataset",
    "Show me trend analysis and business recommendations"
  ];

  const handleQuickTest = (query: string) => {
    setInputValue(query);
  };

  const getEnhancedMessageStyle = (msg: EnhancedMessage) => {
    const baseStyle = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg`;
    
    if (msg.message_type === 'analysis_result' || msg.content.includes('[ENHANCED SYSTEM ANALYSIS]')) {
      return `${baseStyle} bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 text-green-800 shadow-sm`;
    }
    
    if (msg.content.includes('📁 **Enhanced Data Upload Successful**')) {
      return `${baseStyle} bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-800`;
    }
    
    if (msg.sender_type === "user") {
      return `${baseStyle} bg-blue-600 text-white`;
    }
    
    return `${baseStyle} bg-gray-100 text-gray-800`;
  };

  const getEnhancedMessageIcon = (msg: EnhancedMessage) => {
    if (msg.message_type === 'analysis_result' || msg.content.includes('[ENHANCED SYSTEM ANALYSIS]')) {
      return <BarChart3 className="w-5 h-5 text-green-600" />;
    }
    if (msg.content.includes('📁 **Enhanced Data Upload Successful**')) {
      return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
    if (msg.message_type === 'data_upload') {
      return <Upload className="w-5 h-5" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Enhanced Seasonality Agent
            {conversation && (
              <Badge variant="outline" className="ml-2">
                {conversation.title || `Session: ${conversation.id.slice(-8)}`}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real data processing • Advanced STL decomposition • Business insights generation
          </CardDescription>
          <div className="flex gap-2">
            <Badge variant="outline">{agent.class}</Badge>
            <Badge variant="outline">Level {agent.level}</Badge>
            <Badge variant="secondary" className="bg-green-600/20 text-green-700">✨ Enhanced MoLAS</Badge>
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-700">🔍 Real Data Processing</Badge>
            {uploadedData && (
              <Badge variant="outline" className={`${uploadedData.isProcessed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                📁 {uploadedData.fileName}
                {uploadedData.isProcessed ? <CheckCircle className="w-3 h-3 ml-1" /> : <Loader2 className="w-3 h-3 ml-1 animate-spin" />}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      

      <div className="grid lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Enhanced Features</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadConversations}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConversationSelector
              conversations={conversations}
              currentConversationId={conversation?.id}
              onSelectConversation={handleSelectConversation}
              onCreateNew={handleCreateNewConversation}
              onRefresh={loadConversations}
            />
            
            {/* Enhanced features showcase */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">🚀 New Capabilities</h4>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Real CSV data processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Data quality assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Business insights generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Enhanced STL decomposition</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Actions</h4>
              {quickTestQueries.slice(0, 3).map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left text-xs h-auto p-2"
                  onClick={() => handleQuickTest(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback>{agent.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-sm text-gray-500">Enhanced Seasonality Analysis Expert</p>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="h-96 px-4">
            <div className="space-y-4">
              {enhancedMessages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">{agent.avatar}</div>
                  <p className="text-gray-500 mb-2">
                    Hi! I'm your enhanced seasonality analysis expert.
                  </p>
                  <div className="text-sm text-gray-400 mb-4">
                    <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Real data processing</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>STL decomposition</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Business insights</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Quality assessment</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={handleForceUpload}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your Data for Real Analysis
                    </Button>
                  </div>
                </div>
              )}
              
              {enhancedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={getEnhancedMessageStyle(message)}>
                    {message.sender_type !== "user" && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">
                            {message.content.includes('[ENHANCED SYSTEM ANALYSIS]') ? '🤖' : agent.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium flex items-center gap-1">
                          {getEnhancedMessageIcon(message)}
                          {message.content.includes('[ENHANCED SYSTEM ANALYSIS]') ? 'Enhanced Analysis' : agent.name}
                        </span>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content.replace('[ENHANCED SYSTEM ANALYSIS]\n\n', '')}
                    </div>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {(isLoading || isAnalyzing) && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {isAnalyzing ? "🔍 Running enhanced seasonality analysis with real data..." : "Thinking..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced file upload interface */}
              {showFileUpload && (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                  <ConversationalFileUpload
                    onFileUpload={handleFileUpload}
                    onCancel={handleCancelUpload}
                    isVisible={showFileUpload}
                  />
                  <div className="mt-2 text-xs text-blue-600">
                    ✨ Enhanced processing: Real-time validation • Quality assessment • Business insights
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Ask ${agent.name} about real data analysis or upload CSV files...`}
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading || isAnalyzing}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || isAnalyzing || !inputValue.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Send
              </Button>
            </div>
            
            {/* Enhanced upload controls */}
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceUpload}
                className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload Real Data
              </Button>
              
              {uploadedData && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedData(null)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Clear Data
                  </Button>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {uploadedData.isProcessed ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                    )}
                    <span>{uploadedData.dataQuality}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Enhanced result formatting function
function formatEnhancedAnalysisResult(result: any, hasRealData: boolean): string {
  const dataSource = hasRealData ? "🔍 **Real User Data Analysis**" : "📊 **Synthetic Data Demo**";
  
  return `${dataSource}

📋 **Method**: ${result.method}
⏱️ **Processing**: ${result.execution_details?.execution?.execution_time || 'N/A'}ms

${result.summary}

🎯 **Enhanced Insights**:
${result.insights.map((insight: string) => `${insight}`).join('\n')}

💡 **Business Recommendations**:
${result.recommendations.map((rec: string) => `• ${rec}`).join('\n')}

📊 **Data Quality**: ${result.execution_details?.dataQuality || 'High quality synthetic data'}

${result.statisticalMetrics ? `
📈 **Statistical Metrics**:
• Mean: ${result.statisticalMetrics.mean?.toFixed(2) || 'N/A'}
• Trend Slope: ${result.statisticalMetrics.trendSlope?.toFixed(4) || 'N/A'}
• Seasonality Strength: ${((result.statisticalMetrics.seasonalityStrength || 0) * 100).toFixed(1)}%
• Autocorrelation: ${((result.statisticalMetrics.autocorrelation || 0) * 100).toFixed(1)}%
` : ''}

${hasRealData ? '✅ Analysis completed using your real data with enhanced statistical processing.' : '💡 Upload your CSV file to see analysis of your actual data instead of this synthetic example.'}`;
}
