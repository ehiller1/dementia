/**
 * Editable Plan Pane
 * 
 * Windsurf-style visible task list with inline editing
 * Shows problem space conceptualization and task breakdown
 */

import React, { useState } from 'react';
import { Task, TaskStatus, ConversationPlan } from '@/services/conversation/WindsurfStyleOrchestrator';
import { Check, Circle, Clock, AlertCircle, X, Plus, Edit2, Trash2 } from 'lucide-react';

interface EditablePlanPaneProps {
  plan: ConversationPlan | null;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onAddTask?: (task: Omit<Task, 'id'>) => void;
  onDeleteTask?: (taskId: string) => void;
  editable?: boolean;
}

export const EditablePlanPane: React.FC<EditablePlanPaneProps> = ({
  plan,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  editable = true
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'declarative' | 'procedural'>('declarative');

  if (!plan) {
    return (
      <div className="p-4 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4" />
          <span>No active plan</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'error':
        return <X className="w-4 h-4 text-red-400" />;
      default:
        return <Circle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-blue-400';
      case 'blocked':
        return 'text-orange-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = (taskId: string) => {
    if (onUpdateTask && editingTitle.trim()) {
      onUpdateTask(taskId, { title: editingTitle });
    }
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleAddTask = () => {
    if (onAddTask && newTaskTitle.trim()) {
      onAddTask({
        title: newTaskTitle,
        description: '',
        status: 'pending',
        type: newTaskType
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleToggleStatus = (task: Task) => {
    if (!onUpdateTask) return;
    
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
      blocked: 'pending',
      error: 'pending'
    };
    
    onUpdateTask(task.id, { status: nextStatus[task.status] });
  };

  const renderTask = (task: Task) => {
    const isEditing = editingTaskId === task.id;

    return (
      <div
        key={task.id}
        className="group flex items-start gap-3 p-2 rounded hover:bg-slate-700/30 transition-colors"
      >
        {/* Status icon (clickable to toggle) */}
        <button
          onClick={() => handleToggleStatus(task)}
          className="mt-0.5 hover:scale-110 transition-transform"
          disabled={!editable}
        >
          {getStatusIcon(task.status)}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(task.id);
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="flex-1 px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={() => handleSaveEdit(task.id)}
                className="p-1 text-green-400 hover:bg-green-400/10 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-red-400 hover:bg-red-400/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                  {task.title}
                </span>
                <span className="text-xs text-slate-500 uppercase">
                  {task.type}
                </span>
              </div>
              
              {task.description && (
                <p className="text-xs text-slate-400 mt-1">{task.description}</p>
              )}
              
              {task.assignedAgent && (
                <p className="text-xs text-slate-500 mt-1">
                  Assigned: {task.assignedAgent}
                </p>
              )}
              
              {task.confidence !== undefined && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 w-16 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 transition-all"
                      style={{ width: `${task.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(task.confidence * 100)}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons (show on hover) */}
        {editable && !isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleStartEdit(task)}
              className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"
              title="Edit task"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDeleteTask?.(task.id)}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
              title="Delete task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const allTasks = [...plan.declarativeTasks, ...plan.proceduralTasks];
  const completedCount = allTasks.filter(t => t.status === 'completed').length;
  const totalCount = allTasks.length;

  return (
    <div className="h-full flex flex-col bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-200">Execution Plan</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{completedCount}/{totalCount} complete</span>
            <div className="h-1 w-20 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        
        {plan.problemSpace && (
          <p className="text-xs text-slate-400 italic">{plan.problemSpace}</p>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Declarative tasks */}
        {plan.declarativeTasks.length > 0 && (
          <div>
            <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase">
              Declarative Tasks
            </div>
            {plan.declarativeTasks.map(renderTask)}
          </div>
        )}

        {/* Procedural tasks */}
        {plan.proceduralTasks.length > 0 && (
          <div className="mt-2">
            <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase">
              Procedural Tasks
            </div>
            {plan.proceduralTasks.map(renderTask)}
          </div>
        )}

        {/* Add task form */}
        {editable && isAddingTask && (
          <div className="p-2 bg-slate-700/30 rounded border border-slate-600 mt-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') setIsAddingTask(false);
              }}
              placeholder="Task title..."
              className="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    checked={newTaskType === 'declarative'}
                    onChange={() => setNewTaskType('declarative')}
                    className="text-blue-500"
                  />
                  <span className="text-slate-300">Declarative</span>
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    checked={newTaskType === 'procedural'}
                    onChange={() => setNewTaskType('procedural')}
                    className="text-blue-500"
                  />
                  <span className="text-slate-300">Procedural</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddTask}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-700 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with add button */}
      {editable && !isAddingTask && (
        <div className="p-2 border-t border-slate-700">
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      )}
    </div>
  );
};
