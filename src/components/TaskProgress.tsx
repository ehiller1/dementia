/**
 * Task Progress Component
 * 
 * Shows declarative and procedural tasks with live status updates
 * Windsurf-style task state machine visualization
 */

import React from 'react';
import { CheckCircle, Circle, AlertCircle, Loader, Clock } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'error';
  type: 'declarative' | 'procedural';
  assignedAgent?: string;
  confidence?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

interface TaskProgressProps {
  declarativeTasks: Task[];
  proceduralTasks: Task[];
  activeTaskId?: string;
  className?: string;
  onTaskClick?: (task: Task) => void;
}

export function TaskProgress({
  declarativeTasks = [],
  proceduralTasks = [],
  activeTaskId,
  className = '',
  onTaskClick
}: TaskProgressProps) {
  const renderStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'blocked':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderTask = (task: Task, index: number) => {
    const isActive = task.id === activeTaskId;
    const isClickable = !!onTaskClick;

    return (
      <div
        key={task.id}
        onClick={() => isClickable && onTaskClick?.(task)}
        className={`
          flex items-start gap-3 p-3 rounded-lg border transition-all
          ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
          ${isClickable ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''}
          ${task.status === 'error' ? 'border-red-200 bg-red-50' : ''}
          ${task.status === 'completed' ? 'opacity-75' : ''}
        `}
      >
        <div className="flex-shrink-0 mt-0.5">
          {renderStatusIcon(task.status)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {index + 1}. {task.title}
            </span>
            {task.status === 'in_progress' && (
              <span className="text-xs text-blue-600 font-medium">
                Running
              </span>
            )}
          </div>
          
          {task.description && (
            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {task.assignedAgent && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Agent:</span> {task.assignedAgent}
              </span>
            )}
            
            {task.confidence !== undefined && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Confidence:</span> {Math.round(task.confidence * 100)}%
              </span>
            )}
            
            {task.status === 'completed' && task.completedAt && (
              <span className="text-green-600">
                ✓ Completed
              </span>
            )}
            
            {task.error && (
              <span className="text-red-600">
                Error: {task.error}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, tasks: Task[], emptyMessage: string) => {
    if (tasks.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic py-2">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {tasks.map((task, idx) => renderTask(task, idx))}
      </div>
    );
  };

  const totalTasks = declarativeTasks.length + proceduralTasks.length;
  const completedTasks = [...declarativeTasks, ...proceduralTasks].filter(
    t => t.status === 'completed'
  ).length;
  const inProgressTasks = [...declarativeTasks, ...proceduralTasks].filter(
    t => t.status === 'in_progress'
  ).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Summary */}
      {totalTasks > 0 && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {completedTasks}/{totalTasks} tasks
              </span>
              <span className="text-xs text-gray-500">
                {inProgressTasks > 0 && `${inProgressTasks} running`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Declarative Tasks (Knowledge Gathering) */}
      {declarativeTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>📚</span> Knowledge Gathering
            <span className="text-xs font-normal text-gray-500">
              ({declarativeTasks.filter(t => t.status === 'completed').length}/{declarativeTasks.length})
            </span>
          </h3>
          {renderSection(
            'Knowledge Gathering',
            declarativeTasks,
            'No knowledge gathering tasks'
          )}
        </div>
      )}

      {/* Procedural Tasks (Actions) */}
      {proceduralTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>⚡</span> Actions
            <span className="text-xs font-normal text-gray-500">
              ({proceduralTasks.filter(t => t.status === 'completed').length}/{proceduralTasks.length})
            </span>
          </h3>
          {renderSection(
            'Actions',
            proceduralTasks,
            'No action tasks'
          )}
        </div>
      )}

      {/* Empty State */}
      {totalTasks === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tasks yet</p>
        </div>
      )}
    </div>
  );
}
