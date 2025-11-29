/**
 * Conversational Message Renderer
 * 
 * Renders rich backend responses as engaging, bite-sized conversational messages
 * with progressive disclosure and natural pacing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { chunkConversationalResponse, type ConversationalChunk } from '@/utils/conversationalChunker';
import { 
  MessageCircle, 
  Brain, 
  Lightbulb, 
  Target, 
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles
} from 'lucide-react';

interface ConversationalMessageRendererProps {
  content: string;
  isUser?: boolean;
  workflowMetadata?: any;
  onInteraction?: (action: string, data?: any) => void;
}

export const ConversationalMessageRenderer: React.FC<ConversationalMessageRendererProps> = ({
  content,
  isUser = false,
  workflowMetadata,
  onInteraction
}) => {
  // Validate and normalize content at entry point
  console.log('[ConversationalMessageRenderer] Component rendered with:', {
    contentType: typeof content,
    isString: typeof content === 'string',
    isArray: Array.isArray(content),
    isObject: typeof content === 'object' && !Array.isArray(content),
    contentLength: typeof content === 'string' ? content.length : 0,
    contentPreview: typeof content === 'string' ? content.substring(0, 200) : content
  });
  
  // Normalize content to string
  let normalizedContent: string;
  if (typeof content === 'string') {
    normalizedContent = content;
    console.log('[ConversationalMessageRenderer] Content is string, length:', normalizedContent.length);
  } else if (Array.isArray(content)) {
    console.warn('[ConversationalMessageRenderer] Content is array, converting to string');
    normalizedContent = (content as any[]).join('\n');
  } else if (typeof content === 'object' && content !== null) {
    console.warn('[ConversationalMessageRenderer] Content is object, converting to JSON string');
    normalizedContent = JSON.stringify(content, null, 2);
  } else {
    console.error('[ConversationalMessageRenderer] Invalid content type:', typeof content);
    normalizedContent = String(content || 'No content');
  }
  
  console.log('[ConversationalMessageRenderer] Normalized content length:', normalizedContent.length);
  
  const [chunks, setChunks] = useState<ConversationalChunk[]>([]);
  const [visibleChunks, setVisibleChunks] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

  // Determine if content should be chunked (only for rich backend responses)
  const shouldChunkContent = (contentStr: string, metadata?: any): boolean => {
    // Don't chunk user messages
    if (isUser) return false;
    
    // Safety check for undefined content
    if (!contentStr || typeof contentStr !== 'string') return false;
    
    // Don't chunk short messages
    if (contentStr.length < 800) return false;
    
    // Don't chunk if it looks like a simple response
    const simplePatterns = [
      /welcome/i,
      /hello/i,
      /hi there/i,
      /great question/i,
      /let me highlight/i,
      /here's another key point/i,
      /i've analyzed/i,
      /let me walk you through/i
    ];
    
    const isSimpleMessage = simplePatterns.some(pattern => pattern.test(contentStr));
    if (isSimpleMessage && contentStr.length < 1500) return false;
    
    // Only chunk very long, complex responses with clear structure
    const hasComplexStructure = contentStr.includes('\n\n') && 
                               (contentStr.includes('•') || contentStr.includes('**') || contentStr.includes(':'));
    
    // Must be very long AND have complex structure AND have workflow metadata
    return contentStr.length > 1500 && hasComplexStructure && (metadata && Object.keys(metadata).length > 0);
  };

  // Initialize chunks when content changes
  useEffect(() => {
    if (shouldChunkContent(normalizedContent, workflowMetadata)) {
      const conversationalChunks = chunkConversationalResponse(normalizedContent, {
        maxChunkLength: 120,
        includeTransitions: true,
        addInteractivity: true,
        simulateTyping: true
      });
      
      setChunks(conversationalChunks);
      setVisibleChunks(0);
      
      // Start revealing chunks progressively
      if (conversationalChunks.length > 0) {
        revealNextChunk(conversationalChunks, 0);
      }
    } else {
      // For simple messages, show immediately without chunking
      setChunks([]);
      setVisibleChunks(0);
    }
  }, [content, isUser, workflowMetadata]);

  // Progressively reveal chunks with natural timing
  const revealNextChunk = useCallback((allChunks: ConversationalChunk[], currentIndex: number) => {
    if (currentIndex >= allChunks.length) return;

    const chunk = allChunks[currentIndex];
    const delay = chunk.delay || 500;

    setIsTyping(true);
    
    setTimeout(() => {
      setVisibleChunks(prev => prev + 1);
      setIsTyping(false);
      
      // Continue to next chunk
      if (currentIndex + 1 < allChunks.length) {
        setTimeout(() => {
          revealNextChunk(allChunks, currentIndex + 1);
        }, 300);
      }
    }, delay);
  }, []);

  // Handle chunk expansion
  const toggleChunkExpansion = (chunkId: string) => {
    setExpandedChunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  };

  // Handle interactive responses
  const handleInteractiveResponse = (chunk: ConversationalChunk, response: string) => {
    if (onInteraction) {
      onInteraction('chunk_response', { chunkId: chunk.id, response });
    }
  };

  // Render user messages normally
  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-lg p-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-white leading-relaxed">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  // If content should be chunked, render conversational chunks
  if (shouldChunkContent(content, workflowMetadata)) {
    return (
      <div className="space-y-3">
        {/* Workflow metadata header */}
        {workflowMetadata && (
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <Badge className="bg-purple-100 text-purple-800">
              {workflowMetadata.phase?.toUpperCase() || 'ANALYSIS'}
            </Badge>
            {workflowMetadata.multiAgent && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                🎭 {workflowMetadata.agentsInvolved} Agents
              </Badge>
            )}
          </div>
        )}

        {/* Conversational chunks */}
        {chunks.slice(0, visibleChunks).map((chunk, index) => (
          <ConversationalChunkRenderer
            key={chunk.id}
            chunk={chunk}
            isExpanded={expandedChunks.has(chunk.id)}
            onToggleExpansion={() => toggleChunkExpansion(chunk.id)}
            onInteraction={(response) => handleInteractiveResponse(chunk, response)}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Analyzing...</span>
          </div>
        )}
      </div>
    );
  }

  // For simple messages, render with proper markdown formatting
  const renderFormattedContent = (text: string | any) => {
    if (!text) {
      return <p className="text-gray-500 italic">No content to display</p>;
    }
    
    // Convert to string if needed
    let textString: string;
    if (typeof text === 'string') {
      textString = text;
    } else if (Array.isArray(text)) {
      textString = text.join('\n');
    } else if (typeof text === 'object') {
      textString = JSON.stringify(text, null, 2);
    } else {
      textString = String(text);
    }
    
    // Helper function to render inline markdown (bold, italic, etc.)
    const renderInlineMarkdown = (line: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let currentIndex = 0;
      
      // Match **bold** text
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let match;
      let lastIndex = 0;
      
      while ((match = boldRegex.exec(line)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        // Add bold text
        parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : [line];
    };
    
    const lines = textString.split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeLanguage = '';
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' = 'ul';

    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        // Close any open list
        if (inList && listItems.length > 0) {
          const ListTag = listType === 'ul' ? 'ul' : 'ol';
          const listClass = listType === 'ul'
            ? "list-disc list-inside space-y-1 my-2 ml-4"
            : "list-decimal list-inside space-y-1 my-2 ml-4";
          elements.push(
            <ListTag key={`list-${index}`} className={listClass}>
              {listItems}
            </ListTag>
          );
          listItems = [];
          inList = false;
        }
        
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.trim().substring(3);
          codeBlockLines = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <pre key={`code-${index}`} className="bg-gray-800 text-gray-100 p-3 rounded my-2 overflow-x-auto">
              <code className={`language-${codeLanguage}`}>{codeBlockLines.join('\n')}</code>
            </pre>
          );
          codeBlockLines = [];
          codeLanguage = '';
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        return;
      }

      // Handle headers
      if (line.startsWith('### ')) {
        if (inList) {
          const ListTag = listType === 'ul' ? 'ul' : 'ol';
          const listClass = listType === 'ul' 
            ? "list-disc list-inside space-y-1 my-2 ml-4" 
            : "list-decimal list-inside space-y-1 my-2 ml-4";
          elements.push(
            <ListTag key={`list-${index}`} className={listClass}>
              {listItems}
            </ListTag>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<h3 key={index} className="text-lg font-bold mt-4 mb-2">{renderInlineMarkdown(line.substring(4))}</h3>);
      } else if (line.startsWith('## ')) {
        if (inList) {
          const ListTag = listType === 'ul' ? 'ul' : 'ol';
          const listClass = listType === 'ul' 
            ? "list-disc list-inside space-y-1 my-2 ml-4" 
            : "list-decimal list-inside space-y-1 my-2 ml-4";
          elements.push(
            <ListTag key={`list-${index}`} className={listClass}>
              {listItems}
            </ListTag>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<h2 key={index} className="text-xl font-bold mt-4 mb-2">{renderInlineMarkdown(line.substring(3))}</h2>);
      } else if (line.startsWith('# ')) {
        if (inList) {
          const ListTag = listType === 'ul' ? 'ul' : 'ol';
          const listClass = listType === 'ul' 
            ? "list-disc list-inside space-y-1 my-2 ml-4" 
            : "list-decimal list-inside space-y-1 my-2 ml-4";
          elements.push(
            <ListTag key={`list-${index}`} className={listClass}>
              {listItems}
            </ListTag>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<h1 key={index} className="text-2xl font-bold mt-4 mb-2">{renderInlineMarkdown(line.substring(2))}</h1>);
      }
      // Handle bullet points
      else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        if (!inList) {
          inList = true;
          listType = 'ul';
        }
        const content = line.trim().substring(2);
        listItems.push(<li key={index}>{renderInlineMarkdown(content)}</li>);
      }
      // Handle numbered lists (e.g., "1. **text**" or "1. text")
      else if (/^\d+\.\s/.test(line.trim())) {
        if (!inList || listType === 'ul') {
          if (inList && listItems.length > 0) {
            elements.push(
              <ul key={`list-${index}`} className="list-disc list-inside space-y-1.5 my-2 ml-4">
                {listItems}
              </ul>
            );
            listItems = [];
          }
          inList = true;
          listType = 'ol';
        }
        const content = line.trim().replace(/^\d+\.\s/, '').trim();
        listItems.push(<li key={index} className="mb-1.5">{renderInlineMarkdown(content)}</li>);
      }
      // Handle horizontal rules
      else if (line.trim() === '---') {
        if (inList && listItems.length > 0) {
          const ListTag = listType === 'ul' ? 'ul' : 'ol';
          const listClass = listType === 'ul' 
            ? "list-disc list-inside space-y-1.5 my-3 ml-6" 
            : "list-decimal list-inside space-y-1.5 my-3 ml-6";
          elements.push(
            <ListTag key={`list-${index}`} className={listClass}>
              {listItems}
            </ListTag>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<hr key={index} className="my-4 border-gray-300" />);
      }
      // Handle empty lines
      else if (line.trim() === '') {
        // Do not close lists on blank lines to allow spaced list items
        // Only render a break if not currently inside a list
        if (!inList) {
          elements.push(<br key={index} />);
        }
      }
      // Regular text with markdown
      else {
        if (inList && listItems.length > 0) {
          const ListTag = listType === 'ul' ? 'ul' : 'ol';
          const listClass = listType === 'ul' 
            ? "list-disc list-inside space-y-1.5 my-3 ml-6" 
            : "list-decimal list-inside space-y-1.5 my-3 ml-6";
          elements.push(
            <ListTag key={`list-${index}`} className={listClass}>
              {listItems}
            </ListTag>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <p key={index} className="mb-3 leading-relaxed text-gray-800">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    });

    // Close any remaining list
    if (inList && listItems.length > 0) {
      const ListTag = listType === 'ul' ? 'ul' : 'ol';
      const listClass = listType === 'ul' 
        ? "list-disc list-inside space-y-1.5 my-3 ml-6" 
        : "list-decimal list-inside space-y-1.5 my-3 ml-6";
      elements.push(
        <ListTag key="list-final" className={listClass}>
          {listItems}
        </ListTag>
      );
    }

    return <div className="space-y-0">{elements}</div>;
  };

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[85%]">
        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {renderFormattedContent(normalizedContent)}
        </div>
      </div>
    </div>
  );
};

/**
 * Individual chunk renderer
 */
interface ConversationalChunkRendererProps {
  chunk: ConversationalChunk;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onInteraction: (response: string) => void;
}

const ConversationalChunkRenderer: React.FC<ConversationalChunkRendererProps> = ({
  chunk,
  isExpanded,
  onToggleExpansion,
  onInteraction
}) => {
  const getChunkIcon = () => {
    switch (chunk.type) {
      case 'intro': return <MessageCircle className="h-4 w-4 text-blue-600" />;
      case 'insight': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'recommendation': return <Target className="h-4 w-4 text-green-600" />;
      case 'question': return <Sparkles className="h-4 w-4 text-purple-600" />;
      default: return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChunkStyle = () => {
    switch (chunk.type) {
      case 'intro':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'insight':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'recommendation':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'question':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'transition':
        return 'bg-gray-50 border-gray-200 text-gray-700 text-sm italic';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const isHighPriority = chunk.metadata?.priority === 'high';
  const isExpandable = chunk.metadata?.expandable;

  return (
    <Card className={`${getChunkStyle()} border animate-fade-in`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {getChunkIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="leading-relaxed text-sm">
                {chunk.content}
              </p>
              {isExpandable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpansion}
                  className="ml-2 h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>

            {/* Priority indicator */}
            {isHighPriority && (
              <Badge variant="outline" className="mt-1 text-xs">
                High Priority
              </Badge>
            )}

            {/* Interactive elements for questions */}
            {chunk.interactive && chunk.type === 'question' && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInteraction('tell_me_more')}
                  className="text-xs"
                >
                  Tell me more
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInteraction('next_steps')}
                  className="text-xs"
                >
                  What's next?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInteraction('different_angle')}
                  className="text-xs"
                >
                  Different angle
                </Button>
              </div>
            )}

            {/* Expandable content */}
            {isExpandable && isExpanded && chunk.metadata?.followUp && (
              <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                {chunk.metadata.followUp}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Add fade-in animation styles
const styles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
