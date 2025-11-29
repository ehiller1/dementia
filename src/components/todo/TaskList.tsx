import React, { useMemo, useState } from 'react';
import { useEnhancedUnifiedConversation } from '@/contexts/EnhancedUnifiedConversationProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const priorityColor: Record<'low'|'medium'|'high', string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-amber-200 text-amber-900',
  high: 'bg-red-200 text-red-900'
};

export default function TaskList() {
  const { todoTemplate, applyTodoOp, refreshTodoTemplate, isProcessing, requestTodoOpApproval } = useEnhancedUnifiedConversation();
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low'|'medium'|'high'>('medium');

  const tasksSorted = useMemo(() => {
    if (!todoTemplate?.tasks) return [];
    const sortBy = todoTemplate?.config?.sortBy || 'order';
    const list = [...todoTemplate.tasks];
    list.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const weight = { low: 0, medium: 1, high: 2 } as const;
          return weight[b.priority] - weight[a.priority];
        }
        case 'dueDate': {
          const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return ad - bd;
        }
        case 'createdAt':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'order':
        default:
          return a.order - b.order;
      }
    });
    // Optional filter
    const f = todoTemplate?.config?.filter;
    return list.filter(t => {
      const statusOk = !f?.status || f.status.includes(t.status);
      const tagsOk = !f?.tags || (t.tags || []).some(tag => f.tags!.includes(tag));
      return statusOk && tagsOk;
    });
  }, [todoTemplate]);

  async function handleAdd() {
    if (!newTitle.trim()) return;
    await applyTodoOp({ type: 'add', task: { title: newTitle.trim(), priority: newPriority, status: 'pending' } as any });
    setNewTitle('');
    setNewPriority('medium');
  }

  async function handleToggle(id: string, completed: boolean) {
    await applyTodoOp({ type: 'toggle', id, completed });
  }

  async function handleDelete(id: string) {
    // Governance-gated destructive operation
    requestTodoOpApproval(
      { type: 'delete', id },
      'Requesting approval to delete one task from the to-do list.',
      'medium'
    );
  }

  async function handleClearCompleted() {
    // Governance-gated destructive bulk operation
    requestTodoOpApproval(
      { type: 'clear_completed' },
      'Requesting approval to clear all completed tasks from the to-do list.',
      'high'
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refreshTodoTemplate()} disabled={isProcessing}>Refresh</Button>
              <Button variant="destructive" size="sm" onClick={handleClearCompleted} disabled={isProcessing}>Clear Completed</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Add a task title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            />
            <Select value={newPriority} onValueChange={(v: 'low'|'medium'|'high') => setNewPriority(v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!newTitle.trim() || isProcessing}>Add</Button>
          </div>
          <Separator className="my-3" />

          {!todoTemplate && (
            <div className="text-sm text-muted-foreground">No template loaded yet. Start a conversation or click Refresh.</div>
          )}

          <ul className="space-y-2">
            {tasksSorted.map(task => (
              <li key={task.id} className="flex items-center justify-between p-3 rounded-md border bg-white">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={(checked) => handleToggle(task.id, !!checked)}
                  />
                  <div>
                    <div className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={priorityColor[task.priority]}>{task.priority}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
