/**
 * Provenance Panel - Shows agents, tools, confidence, and artifacts
 * Renders provenance information inline with conversational turns
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Database, BarChart, ExternalLink } from 'lucide-react';

interface Agent {
  agentId: string;
  name?: string;
  confidence: number;
  success: boolean;
  result?: any;
}

interface Artifact {
  id: string;
  type: string; // 'report', 'dataset', 'model', 'analysis'
  uri: string;
  title: string;
  createdAt?: number;
}

interface ProvenanceData {
  total: number;
  breakdown?: Record<string, number>;
  agents?: Agent[];
  artifacts?: Artifact[];
}

interface ProvenancePanelProps {
  provenance: ProvenanceData;
  mode: 'explore' | 'confident';
  className?: string;
}

export function ProvenancePanel({ provenance, mode, className = '' }: ProvenancePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [showAllArtifacts, setShowAllArtifacts] = useState(false);
  
  const agents = provenance.agents || [];
  const artifacts = provenance.artifacts || [];
  
  const displayedAgents = showAllAgents ? agents : agents.slice(0, 3);
  const displayedArtifacts = showAllArtifacts ? artifacts : artifacts.slice(0, 3);
  
  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <FileText className="w-4 h-4" />;
      case 'dataset':
        return <Database className="w-4 h-4" />;
      case 'model':
      case 'analysis':
        return <BarChart className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  
  if (provenance.total === 0 && agents.length === 0 && artifacts.length === 0) {
    return null;
  }
  
  return (
    <div className={`provenance-panel ${className}`}>
      <div className="header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="title-row">
          <span className="icon">🔍</span>
          <span className="title">Provenance</span>
          <span className={`mode-badge ${mode}`}>{mode}</span>
          <span className="total-badge">{provenance.total} sources</span>
        </div>
        <button className="expand-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="content">
          {/* Breakdown */}
          {provenance.breakdown && Object.keys(provenance.breakdown).length > 0 && (
            <div className="breakdown-section">
              <h4>Source Breakdown</h4>
              <div className="breakdown-grid">
                {Object.entries(provenance.breakdown).map(([source, count]) => (
                  <div key={source} className="breakdown-item">
                    <span className="source-name">{source}</span>
                    <span className="source-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Agents */}
          {agents.length > 0 && (
            <div className="agents-section">
              <h4>Agents Used ({agents.length})</h4>
              <div className="agents-list">
                {displayedAgents.map((agent, index) => (
                  <div key={agent.agentId || index} className="agent-card">
                    <div className="agent-header">
                      <span className="agent-name">{agent.name || agent.agentId}</span>
                      <span className={`agent-status ${agent.success ? 'success' : 'failed'}`}>
                        {agent.success ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="agent-confidence">
                      <div className="confidence-label">Confidence:</div>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill" 
                          style={{ width: `${agent.confidence * 100}%` }}
                        />
                      </div>
                      <div className="confidence-value">{(agent.confidence * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                ))}
              </div>
              {agents.length > 3 && (
                <button 
                  className="show-more-btn"
                  onClick={() => setShowAllAgents(!showAllAgents)}
                >
                  {showAllAgents ? 'Show less' : `Show ${agents.length - 3} more`}
                </button>
              )}
            </div>
          )}
          
          {/* Artifacts */}
          {artifacts.length > 0 && (
            <div className="artifacts-section">
              <h4>Artifacts ({artifacts.length})</h4>
              <div className="artifacts-list">
                {displayedArtifacts.map((artifact) => (
                  <a 
                    key={artifact.id} 
                    href={artifact.uri} 
                    className="artifact-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="artifact-icon">
                      {getArtifactIcon(artifact.type)}
                    </div>
                    <div className="artifact-info">
                      <div className="artifact-title">{artifact.title}</div>
                      <div className="artifact-type">{artifact.type}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 link-icon" />
                  </a>
                ))}
              </div>
              {artifacts.length > 3 && (
                <button 
                  className="show-more-btn"
                  onClick={() => setShowAllArtifacts(!showAllArtifacts)}
                >
                  {showAllArtifacts ? 'Show less' : `Show ${artifacts.length - 3} more`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .provenance-panel {
          margin: 1rem 0;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
        }
        
        .header:hover {
          background: #f9fafb;
        }
        
        .title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .icon {
          font-size: 1.25rem;
        }
        
        .title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }
        
        .mode-badge {
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 0.25rem;
        }
        
        .mode-badge.explore {
          background: #fef3c7;
          color: #92400e;
        }
        
        .mode-badge.confident {
          background: #d1fae5;
          color: #065f46;
        }
        
        .total-badge {
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          background: #e5e7eb;
          color: #374151;
          border-radius: 0.25rem;
        }
        
        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
        }
        
        .content {
          padding: 1rem;
        }
        
        .breakdown-section,
        .agents-section,
        .artifacts-section {
          margin-bottom: 1rem;
        }
        
        .breakdown-section:last-child,
        .agents-section:last-child,
        .artifacts-section:last-child {
          margin-bottom: 0;
        }
        
        h4 {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        
        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.5rem;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: white;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        
        .source-name {
          color: #374151;
          text-transform: capitalize;
        }
        
        .source-count {
          font-weight: 600;
          color: #6b7280;
        }
        
        .agents-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .agent-card {
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }
        
        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .agent-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        
        .agent-status.success {
          color: #10b981;
        }
        
        .agent-status.failed {
          color: #ef4444;
        }
        
        .agent-confidence {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
        }
        
        .confidence-label {
          color: #6b7280;
        }
        
        .confidence-bar {
          height: 0.5rem;
          background: #e5e7eb;
          border-radius: 0.25rem;
          overflow: hidden;
        }
        
        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          transition: width 0.3s;
        }
        
        .confidence-value {
          color: #374151;
          font-weight: 600;
        }
        
        .artifacts-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .artifact-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }
        
        .artifact-link:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        .artifact-icon {
          color: #6b7280;
        }
        
        .artifact-info {
          flex: 1;
        }
        
        .artifact-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        
        .artifact-type {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }
        
        .link-icon {
          color: #9ca3af;
        }
        
        .artifact-link:hover .link-icon {
          color: #3b82f6;
        }
        
        .show-more-btn {
          width: 100%;
          padding: 0.5rem;
          margin-top: 0.5rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .show-more-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
      `}</style>
    </div>
  );
}
