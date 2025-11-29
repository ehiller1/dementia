import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Zap, 
  Target, 
  HelpCircle, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ConversationStep, ConversationalAgentService } from '@/services/ConversationalAgentService';

interface ConversationalMessageProps {
  conversationId: string;
  userQuery: string;
  onContinue?: (response: string) => void;
}

export const ConversationalMessage: React.FC<ConversationalMessageProps> = ({
  conversationId,
  userQuery,
  onContinue
}) => {
  const [steps, setSteps] = useState<ConversationStep[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [agentService] = useState(() => new ConversationalAgentService());

  useEffect(() => {
    // Start the conversational flow
    agentService.startConversation(
      conversationId,
      userQuery,
      (step: ConversationStep) => {
        setSteps(prev => [...prev, step]);
      }
    ).then(conversation => {
      setIsActive(conversation.isActive);
    });

    return () => {
      agentService.endConversation(conversationId);
    };
  }, [conversationId, userQuery, agentService]);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'thinking':
        return <Brain className="h-4 w-4 text-blue-500" />;
      case 'action':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'result':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'question':
        return <HelpCircle className="h-4 w-4 text-orange-500" />;
      case 'recommendation':
        return <Target className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'thinking':
        return 'bg-blue-50 border-blue-200';
      case 'action':
        return 'bg-green-50 border-green-200';
      case 'result':
        return 'bg-purple-50 border-purple-200';
      case 'question':
        return 'bg-orange-50 border-orange-200';
      case 'recommendation':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleQuickResponse = (response: string) => {
    if (onContinue) {
      onContinue(response);
    }
    agentService.continueConversation(conversationId, response);
    setIsActive(true);
  };

  const formatContent = (content: string) => {
    // Convert markdown-style formatting to JSX
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <div key={index} className="font-semibold text-gray-800 mb-1">
            {line.replace(/\*\*/g, '')}
          </div>
        );
      }
      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <div key={index} className="ml-4 text-gray-700 text-sm">
            {line}
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      return (
        <div key={index} className="text-gray-700 text-sm mb-1">
          {line}
        </div>
      );
    });
  };

  const lastStep = steps[steps.length - 1];
  const isQuestion = lastStep?.type === 'question';

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <Card 
          key={step.id} 
          className={`${getStepColor(step.type)} transition-all duration-300 ${
            index === steps.length - 1 ? 'animate-in slide-in-from-left-2' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getStepIcon(step.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {step.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {step.timestamp.toLocaleTimeString()}
                  </span>
                  {step.metadata?.confidence && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(step.metadata.confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  {formatContent(step.content)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quick response buttons for questions */}
      {isQuestion && !isActive && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-700 mb-3">
              Quick responses:
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickResponse('simulate')}
                className="text-xs"
              >
                🎯 Run Simulation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickResponse('implement')}
                className="text-xs"
              >
                ⚡ Implement Strategy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickResponse('explore historical data')}
                className="text-xs"
              >
                📊 Explore Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickResponse('review options')}
                className="text-xs"
              >
                🔍 Review Options
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-500 rounded-full" />
          <span>Agent is thinking...</span>
        </div>
      )}
    </div>
  );
};

export default ConversationalMessage;
