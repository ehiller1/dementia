/**
 * Focus Rail (Left Sidebar)
 * Category-based filtering system for narrowing interface to specific functional areas
 */

import { useState, useEffect } from 'react';
import { crewService } from '@/services/crew/CrewService';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FocusRailProps {
  activeCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export function FocusRail({ activeCategory, onCategorySelect }: FocusRailProps) {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const cats = crewService.getCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  return (
    <div className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 space-y-4">
      {/* Logo */}
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
        <span className="text-white text-xl font-bold">A</span>
      </div>

      {/* Category Icons */}
      <div className="flex-1 flex flex-col items-center space-y-3">
        {categories.map((category) => {
          const icon = crewService.getCategoryIcon(category);
          const color = crewService.getCategoryColor(category);
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              onClick={() => onCategorySelect(isActive ? null : category)}
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center transition-all relative group",
                isActive
                  ? `bg-${color}-600 shadow-lg shadow-${color}-500/50`
                  : "bg-slate-800 hover:bg-slate-700"
              )}
              title={category}
            >
              <span className="text-2xl">{icon}</span>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {category}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800" />
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className={`absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-${color}-400 rounded-l`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Clear Focus Button (when active) */}
      {activeCategory && (
        <button
          onClick={() => onCategorySelect(null)}
          className="w-14 h-14 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all group"
          title="Clear Focus"
        >
          <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
        </button>
      )}
    </div>
  );
}
