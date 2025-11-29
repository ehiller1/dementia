import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessGroup {
  id: string;
  name: string;
  icon: string;
}

interface RMNFocusRailProps {
  activeGroup: string | null;
  onSelectGroup: (group: string | null) => void;
  groups: BusinessGroup[];
}

export const RMNFocusRail = ({ activeGroup, onSelectGroup, groups }: RMNFocusRailProps) => {
  return (
    <div className="w-20 border-r border-border bg-card/20 flex flex-col items-center py-4 gap-3">
      {groups.map((group) => {
        const Icon = Icons[group.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
        
        return (
          <button
            key={group.id}
            onClick={() => onSelectGroup(activeGroup === group.id ? null : group.id)}
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-all relative group",
              activeGroup === group.id
                ? "bg-primary text-primary-foreground shadow-lg scale-110"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            )}
            title={group.name}
          >
            {Icon && <Icon className="w-5 h-5" />}
            
            {/* Tooltip on hover */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {group.name}
            </div>
          </button>
        );
      })}
    </div>
  );
};
