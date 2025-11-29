import React, { useState, useEffect } from 'react';
import { AlertTriangle, Brain, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useOrchestration } from '@/services/context/OrchestrationContext';

interface MetaThought {
  id: string;
  stage: string;
  finding: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  createdAt: string;
  createdBy: string;
  workflowInstanceId?: string;
  conversationId?: string;
  traceId?: string;
}

interface MetaThoughtDisplayProps {
  className?: string;
}

export const MetaThoughtDisplay: React.FC<MetaThoughtDisplayProps> = ({ className = '' }) => {
  const [metaThoughts, setMetaThoughts] = useState<MetaThought[]>([]);
  const { eventBus } = useOrchestration();

  useEffect(() => {
    const subscription = eventBus.subscribe('meta.thought.created', (event: any) => {
      const thought = event.data || event;
      setMetaThoughts(prev => [thought, ...prev].slice(0, 10)); // Keep last 10 thoughts
    });

    return () => subscription.unsubscribe();
  }, [eventBus]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (metaThoughts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Brain className="w-4 h-4" />
        Meta-Cognitive Review
      </div>
      
      {metaThoughts.map((thought) => (
        <div
          key={thought.id}
          className={`p-3 rounded-lg border ${getSeverityColor(thought.severity)} transition-all duration-200`}
        >
          <div className="flex items-start gap-2">
            {getSeverityIcon(thought.severity)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {thought.stage}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round(thought.confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {thought.finding}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                {new Date(thought.createdAt).toLocaleTimeString()} • {thought.createdBy}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetaThoughtDisplay;
