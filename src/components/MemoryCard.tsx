import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, TrendingUp, Users, AlertCircle } from 'lucide-react';

interface MemoryCardProps {
  id: string;
  type: 'institutional_memory' | 'working_memory' | 'short_term_memory';
  title: string;
  content: string;
  insights?: string[];
  outcomes?: Record<string, any>;
  relevance_score: number;
  visual_style?: {
    cardType: string;
    backgroundColor: string;
    borderColor: string;
    iconType: string;
    priority: 'high' | 'medium' | 'low';
  };
  metadata?: {
    memory_type: string;
    created_at: string;
    tags: string[];
    triggered_by: string;
  };
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  id,
  type,
  title,
  content,
  insights = [],
  outcomes = {},
  relevance_score,
  visual_style,
  metadata
}) => {
  const getIcon = () => {
    switch (visual_style?.iconType) {
      case 'brain':
        return <Brain className="h-5 w-5 text-purple-600" />;
      case 'clock':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'trending':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'users':
        return <Users className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = () => {
    switch (visual_style?.priority) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const formatOutcome = (key: string, value: any) => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return JSON.stringify(value);
  };

  return (
    <Card className={`mb-4 transition-all duration-300 hover:shadow-md ${getPriorityColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <CardTitle className="text-sm font-semibold text-gray-800">
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {type.replace('_', ' ')}
            </Badge>
            <Badge 
              variant={relevance_score > 0.9 ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {Math.round(relevance_score * 100)}% relevant
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
          {content}
        </p>
        
        {insights.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Key Insights
            </h4>
            <ul className="space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {Object.keys(outcomes).length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Outcomes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(outcomes).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="font-medium text-gray-700">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-gray-600 ml-1">
                    {formatOutcome(key, value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {metadata && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>{new Date(metadata.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex space-x-1">
              {metadata.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemoryCard;
