/**
 * ApprovalButton - Interactive button for approving procedural tasks
 * Publishes approval events to EventBus to kick orchestration loop
 */

import React, { useState } from 'react';
import { eventBus } from '@/services/events/EventBus';

interface ApprovalButtonProps {
  taskId: string;
  taskLabel?: string;
  onApprove?: (taskId: string) => void;
  onSkip?: (taskId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ApprovalButton({
  taskId,
  taskLabel,
  onApprove,
  onSkip,
  disabled = false,
  className = ''
}: ApprovalButtonProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'skipped'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    if (isProcessing || disabled) return;
    
    setIsProcessing(true);
    console.log(`[ApprovalButton] Approving task: ${taskId}`);
    
    try {
      // Publish approval event to EventBus
      eventBus.publish('approval:granted', {
        taskId,
        userId: 'anonymous',
        timestamp: Date.now(),
        source: 'ui'
      });
      
      setStatus('approved');
      
      // Call optional callback
      if (onApprove) {
        onApprove(taskId);
      }
      
      console.log(`[ApprovalButton] ✅ Task approved: ${taskId}`);
    } catch (error) {
      console.error(`[ApprovalButton] Error approving task:`, error);
      setStatus('pending');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    if (isProcessing || disabled) return;
    
    console.log(`[ApprovalButton] Skipping task: ${taskId}`);
    
    // Publish skip event
    eventBus.publish('approval:skipped', {
      taskId,
      userId: 'anonymous',
      timestamp: Date.now(),
      source: 'ui'
    });
    
    setStatus('skipped');
    
    // Call optional callback
    if (onSkip) {
      onSkip(taskId);
    }
  };

  if (status === 'approved') {
    return (
      <div className={`approval-button-container approved ${className}`}>
        <div className="approval-status">
          <span className="status-icon">✅</span>
          <span className="status-text">Approved</span>
        </div>
        <style jsx>{`
          .approval-button-container.approved {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: #10b981;
            color: white;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .status-icon {
            font-size: 1rem;
          }
        `}</style>
      </div>
    );
  }

  if (status === 'skipped') {
    return (
      <div className={`approval-button-container skipped ${className}`}>
        <div className="approval-status">
          <span className="status-icon">⏭️</span>
          <span className="status-text">Skipped</span>
        </div>
        <style jsx>{`
          .approval-button-container.skipped {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: #6b7280;
            color: white;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .status-icon {
            font-size: 1rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`approval-button-container pending ${className}`}>
      <div className="task-label">
        {taskLabel || taskId}
      </div>
      <div className="button-group">
        <button
          onClick={handleApprove}
          disabled={disabled || isProcessing}
          className="approve-btn"
          aria-label={`Approve ${taskId}`}
        >
          {isProcessing ? '⏳ Approving...' : '✓ Approve'}
        </button>
        <button
          onClick={handleSkip}
          disabled={disabled || isProcessing}
          className="skip-btn"
          aria-label={`Skip ${taskId}`}
        >
          Skip
        </button>
      </div>
      
      <style jsx>{`
        .approval-button-container.pending {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        
        .task-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          flex: 1;
        }
        
        .button-group {
          display: flex;
          gap: 0.5rem;
        }
        
        .approve-btn,
        .skip-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .approve-btn {
          background: #3b82f6;
          color: white;
        }
        
        .approve-btn:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .approve-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .skip-btn {
          background: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }
        
        .skip-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .skip-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

/**
 * ApprovalButtonGroup - Render multiple approval buttons for a list of tasks
 */
interface ApprovalButtonGroupProps {
  tasks: Array<{ id: string; label?: string }>;
  onApprove?: (taskId: string) => void;
  onSkip?: (taskId: string) => void;
  className?: string;
}

export function ApprovalButtonGroup({
  tasks,
  onApprove,
  onSkip,
  className = ''
}: ApprovalButtonGroupProps) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div className={`approval-button-group ${className}`}>
      <div className="group-header">
        <span className="header-icon">🔐</span>
        <span className="header-text">Approval Required</span>
      </div>
      <div className="buttons-container">
        {tasks.map(task => (
          <ApprovalButton
            key={task.id}
            taskId={task.id}
            taskLabel={task.label}
            onApprove={onApprove}
            onSkip={onSkip}
          />
        ))}
      </div>
      
      <style jsx>{`
        .approval-button-group {
          margin: 1rem 0;
          padding: 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
        }
        
        .group-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }
        
        .header-icon {
          font-size: 1.25rem;
        }
        
        .buttons-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
