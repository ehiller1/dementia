/**
 * Action Confirmation Dialog
 * Modal for confirming data-modifying actions (Microsoft AI Principle: Human Agency)
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActionStep {
  agentName: string;
  action: string;
  recordsAffected: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ActionConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  steps: ActionStep[];
  estimatedTime?: string;
  decisionId?: string;
  actionId?: string;
}

const RISK_CONFIG = {
  low: { 
    bgColor: 'bg-green-50', 
    textColor: 'text-green-700', 
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    label: 'Low Risk', 
    icon: CheckCircle2 
  },
  medium: { 
    bgColor: 'bg-yellow-50', 
    textColor: 'text-yellow-700', 
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    label: 'Medium Risk', 
    icon: AlertTriangle 
  },
  high: { 
    bgColor: 'bg-red-50', 
    textColor: 'text-red-700', 
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    label: 'High Risk', 
    icon: ShieldAlert 
  }
};

export function ActionConfirmationDialog({
  open, onClose, onConfirm, title, description, steps, estimatedTime, decisionId, actionId
}: ActionConfirmationDialogProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const totalRecords = steps.reduce((sum, step) => sum + step.recordsAffected, 0);
  const highestRisk = steps.some(s => s.riskLevel === 'high') ? 'high' 
    : steps.some(s => s.riskLevel === 'medium') ? 'medium' : 'low';
  const riskConfig = RISK_CONFIG[highestRisk];
  const RiskIcon = riskConfig.icon;

  const handleConfirm = async () => {
    setIsExecuting(true);
    try {
      // Execute action via backend API
      if (decisionId && actionId) {
        const response = await fetch('/api/rmn/execute-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decisionId, action: actionId })
        });
        
        if (!response.ok) throw new Error('Failed to execute action');
      }
      
      await onConfirm();
      toast.success('Action executed successfully');
      onClose();
    } catch (error) {
      console.error('Action execution failed:', error);
      toast.error('Failed to execute action');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="action-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            {title}
          </DialogTitle>
          <DialogDescription id="action-description">
            Review the following actions before confirming execution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">{description}</p>

          {/* Risk Summary Card */}
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-lg border-2",
            riskConfig.bgColor,
            riskConfig.borderColor
          )}>
            <RiskIcon className={cn("w-5 h-5", riskConfig.iconColor)} />
            <div className="flex-1 space-y-1">
              <div className={cn("text-sm font-semibold", riskConfig.textColor)}>
                {riskConfig.label}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span><strong>{totalRecords}</strong> records will be affected</span>
                {estimatedTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Est. {estimatedTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Actions to be performed:</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {steps.map((step, idx) => {
                const stepRiskConfig = RISK_CONFIG[step.riskLevel];
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-3 border-l-4 rounded-r-lg bg-white shadow-sm",
                      stepRiskConfig.borderColor
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{step.agentName}</span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", stepRiskConfig.textColor)}
                        >
                          {step.riskLevel}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">
                        Step {idx + 1}/{steps.length}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">{step.action}</p>
                    <p className="text-xs text-slate-500">
                      Affects <strong>{step.recordsAffected}</strong> records
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isExecuting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isExecuting}
            className="min-w-[140px]"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              'Confirm & Execute'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
