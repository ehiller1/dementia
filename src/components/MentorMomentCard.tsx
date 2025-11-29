/**
 * Mentor Moment Card Component
 * 
 * Displays contextual micro-mentorship nudges in the conversation stream.
 * Provides actions like "Learn More", "Spawn Full Agent", "Dismiss"
 */

import React, { useState } from 'react';
import { MentorMoment, MentorAction } from '@/services/mentoring/MentorMomentsTypes';
import { Lightbulb, AlertTriangle, Info, Zap, X, ExternalLink, Play, Pin } from 'lucide-react';

interface MentorMomentCardProps {
  moment: MentorMoment;
  onAction: (action: MentorAction) => void;
  onDismiss: () => void;
  onSpawnAgent?: (specialist: string, intent: string) => void;
}

export function MentorMomentCard({ moment, onAction, onDismiss, onSpawnAgent }: MentorMomentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (moment.type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'insight': return <Lightbulb className="w-5 h-5 text-blue-400" />;
      case 'tip': return <Zap className="w-5 h-5 text-green-400" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getColorClasses = () => {
    switch (moment.type) {
      case 'warning': return 'border-amber-500/30 bg-amber-950/20';
      case 'insight': return 'border-blue-500/30 bg-blue-950/20';
      case 'tip': return 'border-green-500/30 bg-green-950/20';
      default: return 'border-slate-500/30 bg-slate-950/20';
    }
  };

  const handleActionClick = (action: MentorAction) => {
    if (action.type === 'spawn_agent' && onSpawnAgent) {
      onSpawnAgent(
        action.payload.specialist || moment.specialist,
        action.payload.intent || 'general_guidance'
      );
    } else {
      onAction(action);
    }
  };

  return (
    <div className={`
      relative rounded-lg border p-4 mb-4 transition-all
      ${getColorClasses()}
      ${expanded ? 'shadow-lg' : 'shadow-md'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-200">
                {moment.snippet.title}
              </h4>
              <span className="text-xs text-slate-500">
                from {moment.specialist}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {moment.type}
              </span>
              <span className="text-xs text-slate-500">
                confidence: {(moment.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="text-sm text-slate-300 leading-relaxed mb-4">
        {moment.snippet.format === 'markdown' ? (
          <div 
            className="prose prose-sm prose-invert max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: formatMarkdown(moment.snippet.content)
            }}
          />
        ) : (
          <p>{moment.snippet.content}</p>
        )}
      </div>

      {/* Actions */}
      {moment.snippet.actions && moment.snippet.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700">
          {moment.snippet.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleActionClick(action)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium
                transition-all hover:scale-105
                ${getActionButtonClasses(action.type)}
              `}
            >
              {getActionIcon(action.type)}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Metadata (for debugging) */}
      {process.env.NODE_ENV === 'development' && expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
          <div>Moment ID: {moment.id}</div>
          <div>Triggered by: {moment.triggeredBy.detectedTopics.join(', ')}</div>
          <div>Playbook: {moment.metadata?.playbook_id}</div>
        </div>
      )}
    </div>
  );
}

function getActionIcon(type: string) {
  switch (type) {
    case 'open_playbook': return <ExternalLink className="w-3 h-3" />;
    case 'spawn_agent': return <Play className="w-3 h-3" />;
    case 'pin_to_sidebar': return <Pin className="w-3 h-3" />;
    case 'show_template': return <ExternalLink className="w-3 h-3" />;
    default: return <Zap className="w-3 h-3" />;
  }
}

function getActionButtonClasses(type: string): string {
  switch (type) {
    case 'spawn_agent':
      return 'bg-blue-600 hover:bg-blue-500 text-white';
    case 'open_playbook':
      return 'bg-slate-700 hover:bg-slate-600 text-slate-200';
    case 'show_template':
      return 'bg-green-700 hover:bg-green-600 text-white';
    case 'pin_to_sidebar':
      return 'bg-amber-700 hover:bg-amber-600 text-white';
    default:
      return 'bg-slate-700 hover:bg-slate-600 text-slate-200';
  }
}

function formatMarkdown(content: string): string {
  // Simple markdown-to-HTML conversion (for production, use a proper library)
  return content
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-2">$1</h3>') // H3
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>') // H2
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-3">$1</h1>') // H1
    .replace(/^\- (.+)$/gm, '<li class="ml-4">$1</li>') // List items
    .replace(/\n\n/g, '</p><p class="mt-2">') // Paragraphs
    .replace(/^(.+)$/gm, '<p>$1</p>'); // Wrap in paragraphs
}
