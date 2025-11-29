/**
 * Pinned Modules (Top Bar)
 * Quick access to frequently used crews without navigating drawers
 */

import { useState, useEffect } from 'react';
import { crewService, Crew } from '@/services/crew/CrewService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { eventBus } from '@/services/events/EventBus';
import { toast } from 'sonner';

interface PinnedModulesProps {
  onEditClick: () => void;
  onModuleClick: (crew: Crew) => void;
}

const CREW_COLORS = {
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', hover: 'hover:bg-blue-100' },
  green: { border: 'border-green-200', bg: 'bg-green-50', hover: 'hover:bg-green-100' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', hover: 'hover:bg-purple-100' },
  orange: { border: 'border-orange-200', bg: 'bg-orange-50', hover: 'hover:bg-orange-100' },
  pink: { border: 'border-pink-200', bg: 'bg-pink-50', hover: 'hover:bg-pink-100' },
  cyan: { border: 'border-cyan-200', bg: 'bg-cyan-50', hover: 'hover:bg-cyan-100' },
};

export function PinnedModules({ onEditClick, onModuleClick }: PinnedModulesProps) {
  const [pinnedCrews, setPinnedCrews] = useState<Crew[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPinnedCrews = async () => {
      setIsLoading(true);
      try {
        const crews = await crewService.fetchPinnedCrews();
        setPinnedCrews(crews.slice(0, 4)); // Show max 4
      } catch (error) {
        console.error('[PinnedModules] Error loading pinned crews:', error);
        toast.error('Failed to load pinned crews');
      } finally {
        setIsLoading(false);
      }
    };
    loadPinnedCrews();

    // Subscribe to pin changes from ModuleDrawer
    const pinChangeSub = eventBus.subscribe('crew.pin_changed', (event: any) => {
      console.log('[PinnedModules] Pin changed:', event);
      loadPinnedCrews(); // Refresh pins
    });

    // Refresh every 30 seconds for consistency
    const interval = setInterval(loadPinnedCrews, 30000);

    return () => {
      pinChangeSub.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Pinned Crews</span>
          </div>
          
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-40" />
              ))}
            </div>
          ) : pinnedCrews.length === 0 ? (
            <div className="text-xs text-slate-400 italic">
              No crews pinned. Click "Edit Pins" to pin your favorites.
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {pinnedCrews.map((crew) => {
                const colors = CREW_COLORS[crew.color as keyof typeof CREW_COLORS] || CREW_COLORS.blue;
                return (
                <button
                  key={crew.id}
                  onClick={() => onModuleClick(crew)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:shadow-md",
                    colors.border,
                    colors.bg,
                    colors.hover
                  )}
                >
                  <span className="text-xl">{crew.icon}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-slate-900">{crew.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {crew.category}
                    </Badge>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Edit Pins
        </Button>
      </div>
    </div>
  );
}
