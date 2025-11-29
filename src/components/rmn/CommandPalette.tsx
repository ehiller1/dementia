/**
 * Command Palette
 * Quick navigation and action execution via keyboard shortcut (⌘K)
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, Search, ArrowRight } from 'lucide-react';
import { crewService, Crew, QuickAction } from '@/services/crew/CrewService';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectCrew: (crew: Crew) => void;
  onExecuteAction: (action: QuickAction) => void;
}

export function CommandPalette({ open, onClose, onSelectCrew, onExecuteAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [crews, setCrews] = useState<Crew[]>([]);
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [filteredItems, setFilteredItems] = useState<Array<{type: 'crew' | 'action', item: Crew | QuickAction}>>([]);

  useEffect(() => {
    const loadData = async () => {
      const [crewData, actionData] = await Promise.all([
        crewService.fetchCrews(),
        crewService.fetchQuickActions()
      ]);
      setCrews(crewData);
      setActions(actionData);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!query) {
      const recent = [
        ...crews.slice(0, 3).map(c => ({ type: 'crew' as const, item: c })),
        ...actions.slice(0, 3).map(a => ({ type: 'action' as const, item: a }))
      ];
      setFilteredItems(recent);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matchedCrews = crews
      .filter(c => c.name.toLowerCase().includes(lowerQuery) || c.description.toLowerCase().includes(lowerQuery))
      .map(c => ({ type: 'crew' as const, item: c }));
    
    const matchedActions = actions
      .filter(a => a.title.toLowerCase().includes(lowerQuery) || a.description.toLowerCase().includes(lowerQuery))
      .map(a => ({ type: 'action' as const, item: a }));

    setFilteredItems([...matchedCrews, ...matchedActions].slice(0, 10));
  }, [query, crews, actions]);

  const handleSelect = (item: { type: 'crew' | 'action', item: Crew | QuickAction }) => {
    if (item.type === 'crew') {
      onSelectCrew(item.item as Crew);
    } else {
      onExecuteAction(item.item as QuickAction);
    }
    onClose();
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex items-center border-b border-slate-200 px-4 py-3">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crews, agents, actions..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <Badge variant="secondary" className="text-xs ml-2">
            <Command className="w-3 h-3 mr-1" />
            K
          </Badge>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No results found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-left"
                >
                  <span className="text-2xl">
                    {item.type === 'crew' ? (item.item as Crew).icon : (item.item as QuickAction).icon}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">
                      {item.type === 'crew' ? (item.item as Crew).name : (item.item as QuickAction).title}
                    </div>
                    <div className="text-xs text-slate-600">
                      {item.type === 'crew' ? (item.item as Crew).description : (item.item as QuickAction).description}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.type === 'crew' ? 'Crew' : 'Action'}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
