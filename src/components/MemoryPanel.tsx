/**
 * Memory Panel - Renders institutional memory references
 * Shows memory confidence, refs with "show more" affordance
 */

import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, ExternalLink, Lightbulb } from 'lucide-react';

interface MemoryRef {
  id: string;
  title: string;
  why: string; // Relevance explanation
  confidence: number;
  snippet?: string;
}

interface MemoryBlock {
  refs: MemoryRef[];
  snippets?: string[];
  confidence: number;
  pending?: boolean; // Awaiting approval to fetch
}

interface MemoryPanelProps {
  memory: MemoryBlock;
  mode: 'explore' | 'confident';
  onApproveMemoryFetch?: () => void;
  className?: string;
}

export function MemoryPanel({ memory, mode, onApproveMemoryFetch, className = '' }: MemoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  const displayedRefs = showAll ? memory.refs : memory.refs.slice(0, 3);
  
  // If memory fetch is pending, show approval request
  if (memory.pending) {
    return (
      <div className={`memory-panel pending ${className}`}>
        <div className="pending-content">
          <Brain className="w-8 h-8 pending-icon" />
          <div className="pending-text">
            <h3>Institutional Memory Available</h3>
            <p>I can search institutional memory for relevant context, patterns, and historical insights.</p>
          </div>
          {onApproveMemoryFetch && (
            <button 
              className="approve-btn"
              onClick={onApproveMemoryFetch}
            >
              <Lightbulb className="w-4 h-4" />
              Approve Memory Search
            </button>
          )}
        </div>
        
        <style jsx>{`
          .memory-panel.pending {
            margin: 1rem 0;
            padding: 1.5rem;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 2px dashed #3b82f6;
            border-radius: 0.5rem;
          }
          
          .pending-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            text-align: center;
          }
          
          .pending-icon {
            color: #3b82f6;
          }
          
          .pending-text h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 0.5rem;
          }
          
          .pending-text p {
            font-size: 0.875rem;
            color: #1e3a8a;
          }
          
          .approve-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .approve-btn:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    );
  }
  
  // If no memory refs, don't render
  if (memory.refs.length === 0) {
    return null;
  }
  
  return (
    <div className={`memory-panel ${className}`}>
      <div className="header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="title-row">
          <Brain className="w-5 h-5 icon" />
          <span className="title">Institutional Memory</span>
          <span className={`confidence-badge ${memory.confidence > 0.7 ? 'high' : memory.confidence > 0.4 ? 'medium' : 'low'}`}>
            {(memory.confidence * 100).toFixed(0)}% confidence
          </span>
          <span className="count-badge">{memory.refs.length} references</span>
        </div>
        <button className="expand-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="content">
          <div className="refs-list">
            {displayedRefs.map((ref) => (
              <div key={ref.id} className="ref-card">
                <div className="ref-header">
                  <h4 className="ref-title">{ref.title}</h4>
                  <div className="ref-confidence">
                    {(ref.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="ref-why">{ref.why}</div>
                {ref.snippet && (
                  <div className="ref-snippet">
                    <div className="snippet-label">Relevant excerpt:</div>
                    <div className="snippet-text">"{ref.snippet}"</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {memory.refs.length > 3 && (
            <button 
              className="show-more-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show less' : `Show ${memory.refs.length - 3} more`}
            </button>
          )}
          
          {memory.snippets && memory.snippets.length > 0 && (
            <div className="snippets-section">
              <h4>Additional Context</h4>
              <div className="snippets-list">
                {memory.snippets.map((snippet, index) => (
                  <div key={index} className="snippet-item">
                    "{snippet}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .memory-panel {
          margin: 1rem 0;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border: 1px solid #e9d5ff;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid #e9d5ff;
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
          color: #7c3aed;
        }
        
        .title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #5b21b6;
        }
        
        .confidence-badge {
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 0.25rem;
        }
        
        .confidence-badge.high {
          background: #d1fae5;
          color: #065f46;
        }
        
        .confidence-badge.medium {
          background: #fef3c7;
          color: #92400e;
        }
        
        .confidence-badge.low {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .count-badge {
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          background: rgba(124, 58, 237, 0.1);
          color: #5b21b6;
          border-radius: 0.25rem;
        }
        
        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #7c3aed;
        }
        
        .content {
          padding: 1rem;
        }
        
        .refs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .ref-card {
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e9d5ff;
        }
        
        .ref-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        
        .ref-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #5b21b6;
          flex: 1;
        }
        
        .ref-confidence {
          padding: 0.125rem 0.375rem;
          background: #f3e8ff;
          color: #6b21a8;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 0.25rem;
        }
        
        .ref-why {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }
        
        .ref-snippet {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #faf5ff;
          border-left: 3px solid #7c3aed;
          border-radius: 0.25rem;
        }
        
        .snippet-label {
          font-size: 0.75rem;
          color: #7c3aed;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        
        .snippet-text {
          font-size: 0.875rem;
          color: #374151;
          font-style: italic;
          line-height: 1.5;
        }
        
        .show-more-btn {
          width: 100%;
          padding: 0.5rem;
          margin-top: 0.75rem;
          background: white;
          border: 1px solid #e9d5ff;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #7c3aed;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .show-more-btn:hover {
          background: #faf5ff;
          border-color: #d8b4fe;
        }
        
        .snippets-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e9d5ff;
        }
        
        .snippets-section h4 {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7c3aed;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        
        .snippets-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .snippet-item {
          padding: 0.5rem;
          background: white;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: #374151;
          font-style: italic;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
