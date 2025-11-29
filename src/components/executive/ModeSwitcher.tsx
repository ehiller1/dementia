/**
 * Mode Switcher - Manual role override control
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Wrench, Target, Crown, X } from 'lucide-react';

export type ExecutiveRole = 'Operator' | 'Builder' | 'Strategist' | 'Executive';

interface ModeSwitcherProps {
  currentRole: ExecutiveRole;
  onRoleChange: (role: ExecutiveRole) => void;
  onClearOverride?: () => void;
  isOverridden: boolean;
}

export function ModeSwitcher({
  currentRole,
  onRoleChange,
  onClearOverride,
  isOverridden
}: ModeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const roles: Array<{ role: ExecutiveRole; icon: any; color: string; description: string }> = [
    { role: 'Operator', icon: Zap, color: 'red', description: 'Tactical execution' },
    { role: 'Builder', icon: Wrench, color: 'blue', description: 'System design' },
    { role: 'Strategist', icon: Target, color: 'purple', description: 'Long-term planning' },
    { role: 'Executive', icon: Crown, color: 'green', description: 'Strategic oversight' }
  ];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-30 text-white"
      >
        Switch Mode
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Select Role</h3>
            <p className="text-xs text-gray-600 mt-1">
              Override automatic role detection
            </p>
          </div>

          <div className="p-2 space-y-1">
            {roles.map(({ role, icon: Icon, color, description }) => (
              <button
                key={role}
                onClick={() => {
                  onRoleChange(role);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded hover:bg-gray-50 transition-colors ${
                  currentRole === role ? 'bg-gray-100 ring-2 ring-blue-500' : ''
                }`}
              >
                <div className={`p-2 rounded bg-${color}-100`}>
                  <Icon size={20} className={`text-${color}-600`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{role}</div>
                  <div className="text-xs text-gray-600">{description}</div>
                </div>
                {currentRole === role && (
                  <div className="text-blue-500 text-xs font-medium">Active</div>
                )}
              </button>
            ))}
          </div>

          {isOverridden && onClearOverride && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => {
                  onClearOverride();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
              >
                <X size={16} />
                <span>Clear Override (Auto-Detect)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
