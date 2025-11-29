/**
 * Module Drawer
 * Panel for managing crews - enable/disable, subscribe, pin/unpin
 */

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { crewService, Crew } from '@/services/crew/CrewService';
import { Search, Pin, X, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { eventBus } from '@/services/events/EventBus';

interface ModuleDrawerProps {
  open: boolean;
  onClose: () => void;
  activeCategory: string | null;
}

export function ModuleDrawer({ open, onClose, activeCategory }: ModuleDrawerProps) {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCrews, setFilteredCrews] = useState<Crew[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingCrewId, setSavingCrewId] = useState<string | null>(null);

  useEffect(() => {
    const loadCrews = async () => {
      if (!open) return; // Only load when drawer is open
      setIsLoading(true);
      try {
        const allCrews = activeCategory
          ? await crewService.fetchCrewsByCategory(activeCategory)
          : await crewService.fetchCrews();
        setCrews(allCrews);
        setFilteredCrews(allCrews);
      } catch (error) {
        console.error('[ModuleDrawer] Error loading crews:', error);
        toast.error('Failed to load crews');
      } finally {
        setIsLoading(false);
      }
    };
    loadCrews();
  }, [activeCategory, open]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = crews.filter(crew =>
        crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crew.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCrews(filtered);
    } else {
      setFilteredCrews(crews);
    }
  }, [searchQuery, crews]);

  const groupedCrews = filteredCrews.reduce((acc, crew) => {
    if (!acc[crew.category]) acc[crew.category] = [];
    acc[crew.category].push(crew);
    return acc;
  }, {} as Record<string, Crew[]>);

  const handleTogglePin = async (crew: Crew) => {
    setSavingCrewId(crew.id);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/rmn/crews/${crew.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !crew.isPinned })
      });

      if (!response.ok) throw new Error('Failed to update pin status');

      // Update local state
      const updatedCrews = crews.map(c =>
        c.id === crew.id ? { ...c, isPinned: !c.isPinned } : c
      );
      setCrews(updatedCrews);
      setFilteredCrews(updatedCrews.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      ));

      toast.success(crew.isPinned ? 'Crew unpinned' : 'Crew pinned to top');
      
      // Notify PinnedModules to refresh
      eventBus.publish('crew.pin_changed', { crewId: crew.id, isPinned: !crew.isPinned });
    } catch (error) {
      console.error('[ModuleDrawer] Error toggling pin:', error);
      toast.error('Failed to update pin status');
    } finally {
      setSavingCrewId(null);
    }
  };

  const handleToggleEnabled = async (crew: Crew, enabled: boolean) => {
    setSavingCrewId(crew.id);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/rmn/crews/${crew.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) throw new Error('Failed to toggle crew');

      toast.success(enabled ? 'Crew enabled' : 'Crew disabled');
    } catch (error) {
      console.error('[ModuleDrawer] Error toggling crew:', error);
      toast.error('Failed to toggle crew');
    } finally {
      setSavingCrewId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Manage Crews</SheetTitle>
          <SheetDescription>
            Enable, disable, and pin your most-used agent crews
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="mt-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crews..."
              className="pl-10"
              disabled={isLoading}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCrews.length === 0 && (
          <div className="py-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No crews found</p>
            {searchQuery && (
              <Button
                variant="link"
                onClick={() => setSearchQuery('')}
                className="text-xs mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Crews by Category */}
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
          {!isLoading && Object.entries(groupedCrews).map(([category, categoryCrews]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">{category}</h3>
                <Badge variant="secondary" className="text-xs">
                  {categoryCrews.length} {categoryCrews.length === 1 ? 'crew' : 'crews'}
                </Badge>
              </div>
              <div className="space-y-3">
                {categoryCrews.map((crew) => {
                  const isSaving = savingCrewId === crew.id;
                  return (
                  <div 
                    key={crew.id} 
                    className={cn(
                      "p-4 border rounded-lg transition-all",
                      crew.isPinned ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white",
                      isSaving && "opacity-50 pointer-events-none"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{crew.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-slate-900">{crew.name}</h4>
                            {crew.isPinned && (
                              <Pin className="w-3 h-3 text-blue-600" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600">{crew.description}</p>
                        </div>
                      </div>
                      <Switch 
                        defaultChecked 
                        onCheckedChange={(checked) => handleToggleEnabled(crew, checked)}
                        disabled={isSaving}
                      />
                    </div>

                    {/* Agent Count */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                      <Badge variant="secondary" className="text-xs">
                        {crew.agents.length} agents
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleTogglePin(crew)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : crew.isPinned ? (
                          <>
                            <Pin className="w-3 h-3 mr-1 fill-current" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="w-3 h-3 mr-1" />
                            Pin to Top
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
