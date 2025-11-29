/**
 * Structured Message Renderer
 * Renders structured executive messages with Windsurf-style visual treatment
 */

import React, { useState, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActionSelector } from './ActionSelector';
import {
  TrendingUp,
  Eye,
  Lightbulb,
  CheckSquare,
  Users,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Target,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface StructuredMessageRendererProps {
  message: {
    id: string;
    content: string;
    metadata?: {
      conversationId?: string;
      originalQuery?: string;
      context?: any;
    };
    workflowMetadata?: {
      messageId?: string | number;
      sequenceIndex?: number;
      totalMessages?: number;
      title?: string;
      messageNumber?: number;
      badges?: (string | { label?: string; value?: string })[];
      actions?: string[];
      cta?: string;
      crossFunctionalImpact?: Record<string, string>;
      agentMarketplaceResults?: Array<{
        agentId?: string;
        success?: boolean;
        confidence?: number;
      }>;
      timeline?: Array<{
        label?: string;
        date?: string;
      }>;
      meta?: Record<string, any>;
      messageType?: string;
    };
  };
  onActionProcessed?: (result: any) => void;
}

// Internal component implementation
const StructuredMessageRendererComponent: React.FC<StructuredMessageRendererProps> = ({ message, onActionProcessed }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const metadata = message.workflowMetadata;
  const messageType = metadata?.messageType;
  
  // Parse actions from content for recommendations/actions messages
  const parseActions = () => {
    if (messageType !== 'recommendations' && messageType !== 'actions') {
      return [];
    }
    
    const content = message.content || '';
    const lines = content.split('\n');
    const actions: Array<{id: string; content: string; category?: string}> = [];
    
    lines.forEach((line, idx) => {
      // Match bullet points, numbered lists, or checkboxes
      const match = line.match(/^[\d\.\-\•]\s*(.+)$/) || line.match(/^- \[ \]\s*(.+)$/);
      if (match && match[1]) {
        actions.push({
          id: `action_${message.id}_${idx}`,
          content: match[1].trim(),
          category: messageType === 'recommendations' ? 'recommendation' : 'action'
        });
      }
    });
    
    return actions;
  };
  
  const actions = parseActions();

  // Get icon and color based on message type
  const getTypeConfig = (type?: string) => {
    switch (type) {
      case 'summary':
        return {
          icon: TrendingUp,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Executive Summary'
        };
      case 'insights':
        return {
          icon: Eye,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          title: 'What I\'m Seeing'
        };
      case 'recommendations':
        return {
          icon: Lightbulb,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Recommendations'
        };
      case 'actions':
        return {
          icon: CheckSquare,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Next Actions'
        };
      case 'events':
        return {
          icon: Activity,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          title: 'Institutional Context'
        };
      case 'memory':
        return {
          icon: Users,
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          borderColor: 'border-pink-200',
          title: 'Cross-Functional Learnings'
        };
      case 'impact':
        return {
          icon: Users,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'Cross-Functional Impact'
        };
      case 'provenance':
        return {
          icon: Activity,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Agent Provenance'
        };
      default:
        return {
          icon: Sparkles,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          title: 'System Message'
        };
    }
  };

  const config = getTypeConfig(messageType);
  const IconComponent = config.icon;

  // Render badges from metadata
  const renderBadges = () => {
    if (!metadata?.badges || metadata.badges.length === 0) {
      return null;
    }

    return (
      <>
        {metadata.badges.map((badge, idx) => {
          // Handle both string and object badge formats
          const badgeText = typeof badge === 'string' ? badge : ((badge as any)?.label || (badge as any)?.value || String(badge));
          const badgeValue = typeof badge === 'object' && badge !== null && (badge as any).value ? (badge as any).value : null;
          
          // Determine badge color based on content
          let badgeVariant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
          let badgeClass = '';
          
          const lowerText = badgeText.toLowerCase();
          if (lowerText.includes('urgent') || lowerText.includes('critical')) {
            badgeVariant = 'destructive';
            badgeClass = 'bg-red-100 text-red-800 border-red-300';
          } else if (lowerText.includes('important') || lowerText.includes('high')) {
            badgeClass = 'bg-orange-100 text-orange-800 border-orange-300';
          } else if (lowerText.includes('complex')) {
            badgeClass = 'bg-purple-100 text-purple-800 border-purple-300';
          } else {
            badgeClass = 'bg-gray-100 text-gray-800 border-gray-300';
          }
          
          return (
            <Badge 
              key={idx} 
              variant={badgeVariant}
              className={`text-xs ${badgeClass}`}
            >
              {badgeText}{badgeValue ? `: ${badgeValue}` : ''}
            </Badge>
          );
        })}
      </>
    );
  };

  // Parse content for markdown-style formatting
  const renderContent = () => {
    // Ensure content is a string
    let content = message.content || '';
    if (typeof content !== 'string') {
      console.warn('[StructuredMessageRenderer] Content is not a string:', typeof content, content);
      // Try to stringify if it's an object or array
      if (Array.isArray(content)) {
        content = (content as any[]).join('\n');
      } else if (typeof content === 'object') {
        content = JSON.stringify(content, null, 2);
      } else {
        content = String(content);
      }
    }
    // Split by lines
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Handle checkboxes
      if (line.includes('- [ ]') || line.includes('- [x]')) {
        const isChecked = line.includes('- [x]');
        const text = line.replace(/- \[([ x])\]/, '').trim();
        return (
          <div key={index} className="flex items-start gap-2 my-1">
            <CheckSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isChecked ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={isChecked ? 'line-through text-gray-500' : ''}>{text}</span>
          </div>
        );
      }
      
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        const text = line.replace(/^[•\-]\s*/, '').trim();
        return (
          <div key={index} className="flex items-start gap-2 my-1 ml-4">
            <span className="text-gray-400 flex-shrink-0">•</span>
            <span>{text}</span>
          </div>
        );
      }
      
      // Handle bold text **text**
      const boldText = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      
      // Regular line
      if (line.trim()) {
        return (
          <p key={index} className="my-1" dangerouslySetInnerHTML={{ __html: boldText }} />
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  // Render agent results (defensive against non-array data)
  const renderAgentResults = () => {
    const resultsArray = Array.isArray(metadata?.agentMarketplaceResults)
      ? metadata.agentMarketplaceResults
      : [];

    if (resultsArray.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Agent Coordination</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {resultsArray.map((agent, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm bg-white rounded p-2 border border-gray-200">
              <span className="font-medium">{agent.agentId || `Agent ${idx + 1}`}</span>
              <div className="flex items-center gap-2">
                {agent.confidence !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(agent.confidence * 100)}% confidence
                  </Badge>
                )}
                {agent.success && (
                  <CheckSquare className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render cross-functional impact (defensive against invalid data)
  const renderCrossFunctionalImpact = () => {
    if (!metadata?.crossFunctionalImpact || typeof metadata.crossFunctionalImpact !== 'object') {
      return null;
    }

    const departments = Object.keys(metadata.crossFunctionalImpact).filter(key => 
      metadata.crossFunctionalImpact[key] && typeof metadata.crossFunctionalImpact[key] === 'string'
    );

    if (departments.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Impact by Function</p>
        <div className="grid gap-2">
          {Object.entries(metadata.crossFunctionalImpact).map(([dept, impact]) => (
            <div key={dept} className="bg-white rounded p-2 border border-gray-200">
              <span className="font-semibold text-sm capitalize">{dept}:</span>
              <span className="text-sm ml-2 text-gray-700">{impact}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render timeline (defensive against non-array data)
  const renderTimeline = () => {
    // Ensure timeline is an array
    const timelineArray = Array.isArray(metadata?.timeline) 
      ? metadata.timeline 
      : metadata?.timeline && typeof metadata.timeline === 'object'
      ? Object.values(metadata.timeline)
      : [];

    if (timelineArray.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Timeline</p>
        <div className="space-y-1">
          {timelineArray.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm bg-white rounded p-2 border border-gray-200">
              <span>{(item as any)?.label || `Phase ${idx + 1}`}</span>
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {(item as any)?.date || 'TBD'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={`${config.borderColor} border-l-4 ${config.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconComponent className={`h-5 w-5 ${config.color}`} />
            <span className="font-semibold">{config.title}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {renderBadges()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {renderContent()}
          
          {messageType === 'impact' && renderCrossFunctionalImpact()}
          {messageType === 'provenance' && renderAgentResults()}
          {messageType === 'provenance' && renderTimeline()}

          {/* Action Selector for recommendations/actions */}
          {actions.length > 0 && (
            <div className="mt-4">
              <ActionSelector
                actions={actions}
                conversationId={message.metadata?.conversationId || 'unknown'}
                originalQuery={message.metadata?.originalQuery || ''}
                context={message.metadata?.context}
                onComplete={(result) => {
                  console.log('[StructuredMessageRenderer] Actions processed:', result);
                  if (onActionProcessed) {
                    onActionProcessed(result);
                  }
                }}
              />
            </div>
          )}

          {/* Call to Action */}
          {metadata?.cta && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <Button 
                className={`w-full ${config.color.replace('text-', 'bg-').replace('600', '500')} hover:${config.color.replace('text-', 'bg-').replace('600', '600')} text-white`}
                size="sm"
              >
                <Target className="h-4 w-4 mr-2" />
                {metadata.cta}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders during progressive streaming
export const StructuredMessageRenderer = memo(StructuredMessageRendererComponent, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if message ID changes
  return prevProps.message.id === nextProps.message.id;
});

// Display name for debugging
StructuredMessageRenderer.displayName = 'StructuredMessageRenderer';

export default StructuredMessageRenderer;
