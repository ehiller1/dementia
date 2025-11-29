/**
 * Delta Panel - Shows "Changes Since Last Turn"
 * Renders changes and reflections explaining why they happened
 */

import React, { useState } from 'react';
import { TrendingUp, Plus, Minus, Edit, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import type { TurnDelta, Change } from '../turn/TurnEnvelope';

interface DeltaPanelProps {
  delta: TurnDelta;
  className?: string;
}

export function DeltaPanel({ delta, className = '' }: DeltaPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!delta.hasChanges) {
    return null;
  }
  
  const getChangeIcon = (action: string) => {
    switch (action) {
      case 'added':
        return <Plus className="w-4 h-4" />;
      case 'removed':
        return <Minus className="w-4 h-4" />;
      case 'modified':
        return <Edit className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };
  
  const getChangeColor = (action: string) => {
    switch (action) {
      case 'added':
        return 'added';
      case 'removed':
        return 'removed';
      case 'modified':
        return 'modified';
      default:
        return 'default';
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'concepts':
        return '💡 Concepts';
      case 'memory':
        return '🧠 Memory';
      case 'plan':
        return '📋 Plan';
      case 'decisions':
        return '⚖️ Decisions';
      case 'provenance':
        return '🔍 Provenance';
      default:
        return type;
    }
  };
  
  return (
    <div className={`delta-panel ${className}`}>
      <div className="header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="title-row">
          <TrendingUp className="w-5 h-5 icon" />
          <span className="title">Changes Since Last Turn</span>
          <span className="count-badge">{delta.changes.length} changes</span>
          {delta.eventsSinceLast && delta.eventsSinceLast > 0 && (
            <span className="events-badge">{delta.eventsSinceLast} events</span>
          )}
        </div>
        <button className="expand-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="content">
          <div className="changes-list">
            {delta.changes.map((change, index) => (
              <div key={index} className={`change-item ${getChangeColor(change.action)}`}>
                <div className="change-header">
                  <div className="change-icon">
                    {getChangeIcon(change.action)}
                  </div>
                  <div className="change-info">
                    <div className="change-type">{getTypeLabel(change.type)}</div>
                    <div className="change-field">{change.field}</div>
                  </div>
                  <div className="change-action-badge">{change.action}</div>
                </div>
                
                {change.reason && (
                  <div className="change-reason">{change.reason}</div>
                )}
                
                {change.after && typeof change.after === 'object' && change.after.title && (
                  <div className="change-detail">
                    {change.action === 'added' && `Added: "${change.after.title}"`}
                    {change.action === 'modified' && change.after.status && (
                      `Status: ${change.before?.status || 'pending'} → ${change.after.status}`
                    )}
                  </div>
                )}
                
                {Array.isArray(change.after) && change.after.length > 0 && (
                  <div className="change-detail">
                    {change.after.length} item{change.after.length > 1 ? 's' : ''} {change.action}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {delta.reflections && delta.reflections.length > 0 && (
            <div className="reflections-section">
              <h4>Why These Changes:</h4>
              <ul className="reflections-list">
                {delta.reflections.map((reflection, index) => (
                  <li key={index} className="reflection-item">{reflection}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .delta-panel {
          margin: 1rem 0;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #fbbf24;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid #fbbf24;
          cursor: pointer;
        }
        
        .header:hover {
          background: rgba(255, 255, 255, 0.9);
        }
        
        .title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .icon {
          color: #f59e0b;
        }
        
        .title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #92400e;
        }
        
        .count-badge {
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          background: rgba(245, 158, 11, 0.2);
          color: #92400e;
          border-radius: 0.25rem;
        }
        
        .events-badge {
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          background: white;
          color: #6b7280;
          border-radius: 0.25rem;
        }
        
        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #f59e0b;
        }
        
        .content {
          padding: 1rem;
        }
        
        .changes-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .change-item {
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border-left: 3px solid;
        }
        
        .change-item.added {
          border-left-color: #10b981;
        }
        
        .change-item.removed {
          border-left-color: #ef4444;
        }
        
        .change-item.modified {
          border-left-color: #3b82f6;
        }
        
        .change-item.default {
          border-left-color: #6b7280;
        }
        
        .change-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        
        .change-icon {
          color: #6b7280;
          padding-top: 0.125rem;
        }
        
        .change-item.added .change-icon {
          color: #10b981;
        }
        
        .change-item.removed .change-icon {
          color: #ef4444;
        }
        
        .change-item.modified .change-icon {
          color: #3b82f6;
        }
        
        .change-info {
          flex: 1;
        }
        
        .change-type {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }
        
        .change-field {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }
        
        .change-action-badge {
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 0.25rem;
          text-transform: uppercase;
        }
        
        .change-item.added .change-action-badge {
          background: #d1fae5;
          color: #065f46;
        }
        
        .change-item.removed .change-action-badge {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .change-item.modified .change-action-badge {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .change-reason {
          margin-top: 0.5rem;
          padding-left: 2rem;
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }
        
        .change-detail {
          margin-top: 0.5rem;
          padding: 0.5rem;
          padding-left: 2rem;
          background: #f9fafb;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: #374151;
        }
        
        .reflections-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #fbbf24;
        }
        
        .reflections-section h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 0.5rem;
        }
        
        .reflections-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .reflection-item {
          padding: 0.5rem 0.75rem;
          background: white;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: #374151;
          line-height: 1.5;
        }
        
        .reflection-item::before {
          content: "→ ";
          color: #f59e0b;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
