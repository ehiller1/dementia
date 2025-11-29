import React, { useState, useEffect, useRef } from 'react';
import { TaskAutomationService } from '../../services/TaskAutomationService';
import { Button } from '../ui/button';
import { Check, Plus, Clock, AlertCircle, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrchestration } from '@/services/context/OrchestrationContext';

interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  context: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: number;
  relatedTemplates?: string[];
  confidence: number;
  reason?: string;
  requiredInputs?: Array<{ name: string; type: 'string' | 'number' | 'file'; optional?: boolean }>;
  ctaOptions?: string[];
}

interface TaskSuggestionPanelProps {
  conversation: Array<{ role: string; content: string }>;
  context?: Record<string, any>;
  onTaskCreate?: (task: TaskSuggestion) => void;
  automationService: TaskAutomationService;
}

export function TaskSuggestionPanel({
  conversation = [],
  context = {},
  onTaskCreate,
  automationService
}: TaskSuggestionPanelProps) {
  const { eventBus } = useOrchestration();
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inputState, setInputState] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const taskSuggestions = await automationService.suggestTasksFromConversation(
          conversation,
          context
        );
        setSuggestions(taskSuggestions);
      } catch (err) {
        setError('Failed to load task suggestions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Clear any existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (conversation && conversation.length > 0) {
      // Debounce the fetch to prevent rapid successive calls
      debounceRef.current = setTimeout(() => {
        fetchSuggestions();
      }, 500); // 500ms debounce
    } else {
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [conversation, context]);

  const handleCreateTask = (suggestion: TaskSuggestion) => {
    if (onTaskCreate) {
      onTaskCreate(suggestion);
    }
    // Remove the suggestion after creation
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleCollectInputToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleInputChange = (key: string, value: any) => {
    setInputState(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitInputs = (suggestion: TaskSuggestion) => {
    try {
      eventBus.publish('tasks.input_collected', {
        suggestionId: suggestion.id,
        title: suggestion.title,
        inputs: inputState,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('EventBus publish failed for tasks.input_collected', e);
    }
    console.log('Collected inputs for', suggestion.title, inputState);
    setExpandedId(null);
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Analyzing conversation for task suggestions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 border-destructive/30">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center">
        <Lightbulb className="h-4 w-4 mr-2" />
        Suggested Tasks
      </h3>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={cn(
              'p-3 border rounded-lg group hover:bg-accent/50 transition-colors',
              {
                'border-primary/30': suggestion.priority === 'high',
                'border-border': suggestion.priority !== 'high'
              }
            )}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{suggestion.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {suggestion.description}
                </p>
                {suggestion.reason && (
                  <p className="text-xs mt-2"><span className="font-medium">Reason:</span> {suggestion.reason}</p>
                )}
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{suggestion.estimatedEffort} min</span>
                  <span className="mx-2">•</span>
                  <span
                    className={cn('px-2 py-0.5 rounded-full text-xs', {
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300':
                        suggestion.priority === 'high',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300':
                        suggestion.priority === 'medium',
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300':
                        suggestion.priority === 'low'
                    })}
                  >
                    {suggestion.priority} priority
                  </span>
                  <span className="mx-2">•</span>
                  <span className="text-xs">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {suggestion.requiredInputs && suggestion.requiredInputs.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCollectInputToggle(suggestion.id)}
                  >
                    Collect Input
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCreateTask(suggestion)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            {expandedId === suggestion.id && suggestion.requiredInputs && (
              <div className="mt-3 pt-3 border-t">
                <div className="grid gap-2">
                  {suggestion.ctaOptions && suggestion.ctaOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {suggestion.ctaOptions.map((cta) => (
                        <Button key={cta} variant="secondary" size="sm" onClick={() => console.log('CTA clicked', cta)}>
                          {cta}
                        </Button>
                      ))}
                    </div>
                  )}
                  {suggestion.requiredInputs.map((ri) => (
                    <div key={ri.name} className="flex items-center gap-2">
                      <span className="w-48 text-xs text-muted-foreground">
                        {ri.name}{ri.optional ? ' (optional)' : ''}
                      </span>
                      {ri.type === 'number' ? (
                        <input
                          type="number"
                          className="flex-1 px-2 py-1 border rounded"
                          onChange={(e) => handleInputChange(ri.name, Number(e.target.value))}
                        />
                      ) : ri.type === 'file' ? (
                        <input
                          type="file"
                          className="flex-1 px-2 py-1 border rounded"
                          onChange={(e) => handleInputChange(ri.name, e.target.files?.[0] || null)}
                        />
                      ) : (
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 border rounded"
                          onChange={(e) => handleInputChange(ri.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleSubmitInputs(suggestion)}>
                      Submit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setExpandedId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {suggestion.context && (
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                <p className="font-medium">Context:</p>
                <p className="italic">{suggestion.context}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
