import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { formatDistanceToNow } from 'date-fns';
import MemoryCard from './MemoryCard';
import { supabase } from '@/integrations/supabase/client';
import { useSessionService } from '@/hooks/useSessionService';
import { useOrchestration } from '@/services/context/OrchestrationContext';

interface NarrativeContent {
  title?: string;
  content: string;
  mood?: string;
  characters?: string[];
  setting?: string;
  plot?: string;
  nextSteps?: string[];
  timestamp?: string;
  source?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

interface Narrative {
  id: string;
  created_at?: string;
  timestamp?: string;
  content: string | NarrativeContent;
  parsed_content?: NarrativeContent;
  title?: string;
  source?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

interface LiveNarrativeStreamProps {
  maxEntries?: number;
  apiResponse?: any;
}

export interface LiveNarrativeStreamRef {
  fetchData: () => void;
}

// Helper function to format agent ID into readable name
const formatAgentName = (agentId: string): string => {
  if (!agentId) return 'Unknown Agent';
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    'walmart-rmn': 'Walmart RMN',
    'tenmilliondollargrowthplan': 'Ten Million Dollar Growth Plan',
    'portfolio': 'Portfolio Agent',
    'audience': 'Audience Agent',
    'attribution': 'Attribution Agent',
    'catalog': 'Catalog Agent'
  };
  
  if (specialCases[agentId]) {
    return specialCases[agentId];
  }
  
  // Format kebab-case and snake_case to Title Case
  return agentId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const LiveNarrativeStream = forwardRef<LiveNarrativeStreamRef, LiveNarrativeStreamProps>((
  { maxEntries = 10, apiResponse },
  ref
) => {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [newEntryIndex, setNewEntryIndex] = useState<number | null>(null);
  const { session } = useSessionService();

  // Process API response and add insights as narratives
  useEffect(() => {
    if (!apiResponse) return;

    // Extract insights from API response - ONLY individual agent responses
    const insights: Narrative[] = [];

    // Add individual agent outputs as insights (only these should be displayed in Live Insights)
    if (apiResponse.agentResults?.results && Array.isArray(apiResponse.agentResults.results)) {
      apiResponse.agentResults.results.forEach((result: any, index: number) => {
        if (result.success && result.result?.output) {
          // Extract agent name/ID - check multiple possible field names
          const agentId = result.agentId || result.agent || result.result?.agent || `agent_${index}`;
          const agentName = result.agentName || formatAgentName(agentId);
          
          insights.push({
            id: `insight_${Date.now()}_agent_${index}`,
            content: result.result.output,
            timestamp: apiResponse.processedAt || new Date().toISOString(),
            source: `agent_${agentId}`,
            confidence: result.result?.confidence || 0.8,
            metadata: {
              agentName: agentName,
              agentId: agentId,
              executionTime: result.executionTime
            }
          });
        }
      });
    }

    // Replace narratives with only current query's agent responses (not historical)
    if (insights.length > 0) {
      setNarratives(insights);
      setNewEntryIndex(0);
      setTimeout(() => setNewEntryIndex(null), 2000);
    } else {
      // Clear narratives if no insights in current response
      setNarratives([]);
    }
  }, [apiResponse]);

  // Subscribe to EventBus for real-time narratives from NarrativeBuilderAgent
  useEffect(() => {
    const handleNarrativeCreated = (event: CustomEvent) => {
      const narrative = event.detail;
      console.log('[LiveNarrativeStream] 📥 Received narrative from agent:', narrative);
      
      // Add to narratives list (prepend for newest first)
      setNarratives(prev => [narrative, ...prev].slice(0, maxEntries));
      
      // Highlight new entry
      setNewEntryIndex(0);
      setTimeout(() => setNewEntryIndex(null), 2000);
    };

    window.addEventListener('narrative.created', handleNarrativeCreated as EventListener);
    
    return () => {
      window.removeEventListener('narrative.created', handleNarrativeCreated as EventListener);
    };
  }, [maxEntries]);

  const fetchNarratives = async (conversationId?: string, lastActivity?: string) => {
    try {
      console.log('📚 [LiveNarrativeStream] API disabled - no narratives to fetch');

      // No placeholder data - return empty array
      setNarratives([]);
    } catch (error) {
      console.error('Error setting narratives:', error);
      setNarratives([]);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchData: (conversationId?: string, lastActivity?: string) => fetchNarratives(conversationId, lastActivity),
  }));

  useEffect(() => {
    // Initial fetch with no context
    fetchNarratives();

    // Listen for institutional memory events
    const handleMemoryRetrieved = (event: CustomEvent) => {
      console.log('📚 LiveNarrativeStream: Received institutional memory cards', event.detail);
      const { memoryCards: newMemoryCards } = event.detail || {};
      
      // Safety check: ensure newMemoryCards is an array
      if (!Array.isArray(newMemoryCards)) {
        console.warn('📚 LiveNarrativeStream: memoryCards is not an array, normalizing...', typeof newMemoryCards);
        // Try to normalize the data
        if (newMemoryCards && typeof newMemoryCards === 'object') {
          // Convert object to array
          const normalized = Object.values(newMemoryCards);
          if (Array.isArray(normalized) && normalized.length > 0) {
            setMemoryCards(normalized);
            return;
          }
        }
        // If we can't normalize, just use empty array
        setMemoryCards([]);
        return;
      }
      
      setMemoryCards(prevCards => {
        // Add new memory cards with animation trigger
        const updatedCards = [...prevCards, ...newMemoryCards];
        console.log('📚 Updated memory cards in narrative:', updatedCards.length);
        return updatedCards;
      });
    };

    // Add event listener for institutional memory
    window.addEventListener('institutionalMemoryRetrieved', handleMemoryRetrieved as EventListener);


    // Bridge disabled: Do not open SSE connection in frontend-only mode
    const es: EventSource | null = null;

    // Cleanup event listener
    return () => {
      window.removeEventListener('institutionalMemoryRetrieved', handleMemoryRetrieved as EventListener);
      try { es?.close(); } catch {}
    };
  }, [session?.id]);

  // Helper function to get narrative text content from various possible formats
  const getNarrativeText = (narrative: Narrative): string => {
    if (!narrative) return 'No narrative content available';
    
    // If content is a string, return it directly
    if (typeof narrative.content === 'string') {
      return narrative.content;
    }
    
    // If content is an object, try to extract text
    if (typeof narrative.content === 'object' && narrative.content !== null) {
      const content = narrative.content as any;
      // Check for reflection format first (has narrative_update field)
      return content.narrative_update || 
             content.content || 
             content.narrativeText || 
             content.text || 
             content.title || 
             'Narrative update';
    }
    
    // Fallback to any other possible text fields
    return narrative.title || 'New narrative update';
  };
  
  // Helper function to get mood from narrative
  const getNarrativeMood = (narrative: Narrative): string => {
    if (narrative.parsed_content?.mood) {
      return narrative.parsed_content.mood;
    }
    
    if (narrative.content && typeof narrative.content === 'object') {
      return (narrative.content as NarrativeContent).mood || 'neutral';
    }
    
    if (narrative.content && typeof narrative.content === 'string') {
      try {
        const parsedContent = JSON.parse(narrative.content);
        return parsedContent.mood || 'neutral';
      } catch {
        return 'neutral';
      }
    }
    
    return 'neutral';
  };
  
  // Get color class based on mood
  const getMoodColorClass = (mood: string): string => {
    switch (mood.toLowerCase()) {
      case 'happy': return 'border-green-400';
      case 'sad': return 'border-blue-400';
      case 'tense': return 'border-yellow-400';
      case 'dangerous': return 'border-red-400';
      case 'mysterious': return 'border-purple-400';
      case 'romantic': return 'border-pink-400';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="rounded-lg shadow p-4 bg-white">
      <h2 className="text-lg font-semibold mb-3">Story Building</h2>
      
      {/* Institutional Memory Cards */}
      {memoryCards.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
            <span className="mr-2">📚</span>
            Institutional Memory
          </h3>
          <div className="space-y-2">
            {memoryCards.map((card, index) => (
              <MemoryCard
                key={card.id}
                id={card.id}
                type={card.type}
                title={card.title}
                content={card.content}
                insights={card.insights}
                outcomes={card.outcomes}
                relevance_score={card.relevance_score}
                visual_style={card.visual_style}
                metadata={card.metadata}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {narratives.length > 0 ? (
          narratives.map((narrative, index) => {
            const narrativeText = getNarrativeText(narrative);
            const mood = getNarrativeMood(narrative);
            const moodClass = getMoodColorClass(mood);
            
            // Extract agent name from metadata or source
            const rawAgentId = narrative.metadata?.agentName || 
                             (narrative.source?.startsWith('agent_') ? narrative.source.replace('agent_', '') : null) ||
                             narrative.title ||
                             'Agent';
            const agentName = narrative.metadata?.agentName || formatAgentName(rawAgentId);
            
            return (
              <div 
                key={narrative.id || narrative.created_at} 
                className={`transition-opacity duration-1000 border-l-4 ${moodClass} pl-3 ${index === newEntryIndex ? 'animate-fade-in' : 'opacity-100'}`}
              >
                {/* Agent Name Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    {agentName}
                  </span>
                </div>
                
                {/* Agent Response */}
                <p className="text-sm text-gray-800 mb-2">{narrativeText}</p>
                
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400 italic">
                    {(() => {
                      try {
                        const dateValue = narrative.timestamp || narrative.created_at || new Date().toISOString();
                        const date = new Date(dateValue);
                        if (isNaN(date.getTime())) {
                          return 'Just now';
                        }
                        return formatDistanceToNow(date, { addSuffix: true });
                      } catch (error) {
                        return 'Just now';
                      }
                    })()} 
                  </p>
                  {mood !== 'neutral' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">No narratives available</p>
        )}
      </div>
    </div>
  );
});

// Define the fade-in animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animate-fade-in {
    animation: fadeIn 1s ease-in-out;
  }
`;
document.head.appendChild(style);

export default LiveNarrativeStream;
