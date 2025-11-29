import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Bot, User } from 'lucide-react';

interface RoleSwitchBannerProps {
  role: 'operator' | 'builder';
  confidence?: number;
  reasons?: string[];
  manualOverride?: boolean;
  onSwitch: (mode: 'operator' | 'builder') => void;
}

export const RoleSwitchBanner: React.FC<RoleSwitchBannerProps> = ({
  role,
  confidence,
  reasons,
  manualOverride,
  onSwitch
}) => {
  const other = role === 'operator' ? 'builder' : 'operator';
  return (
    <Card className="mb-3 border-slate-700 bg-slate-800/70 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {role === 'operator' ? (
            <User className="h-5 w-5 text-emerald-400" />
          ) : (
            <Bot className="h-5 w-5 text-sky-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {role === 'operator' ? 'Operator Console' : 'Builder Workbench'}
              </span>
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                role: {role}
              </Badge>
              {typeof confidence === 'number' && (
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                  confidence: {confidence.toFixed(2)}
                </Badge>
              )}
              {manualOverride && (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-400">
                  manual override
                </Badge>
              )}
            </div>
            {reasons && reasons.length > 0 && (
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>reason: {reasons[reasons.length - 1]}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="border-slate-600" onClick={() => onSwitch(other)}>
            Switch to {other === 'operator' ? 'Operator' : 'Builder'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RoleSwitchBanner;
