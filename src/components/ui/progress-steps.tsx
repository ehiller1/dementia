/**
 * Progress Steps Component
 * 
 * A component for displaying step-by-step progress of agent tasks
 * with visual indicators for status and completion percentage.
 */
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export interface ProgressStep {
  id?: string;
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  percentage?: number;
  timestamp?: Date;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  className?: string;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ 
  steps,
  className = ''
}) => {
  // Sort steps by step number
  const sortedSteps = [...steps].sort((a, b) => a.step - b.step);
  
  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {sortedSteps.map((step, idx) => (
        <div 
          key={step.id || `step-${step.step}`}
          className="flex flex-col border rounded-md p-3 bg-secondary/10"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <StatusIcon status={step.status} className="mr-2" />
              <span className="font-medium text-sm">
                Step {step.step}: {step.title}
              </span>
            </div>
            <StatusBadge status={step.status} />
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
          
          {step.percentage !== undefined && (
            <div className="w-full">
              <Progress
                value={step.percentage}
                className="h-1"
                aria-label={`${step.percentage}% complete`}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-muted-foreground">
                  {step.percentage}%
                </span>
              </div>
            </div>
          )}
          
          {idx < sortedSteps.length - 1 && (
            <div className="flex justify-center my-1">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
      
      {steps.length === 0 && (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          No progress updates available
        </div>
      )}
    </div>
  );
};

const StatusIcon: React.FC<{ status: string; className?: string }> = ({ status, className = '' }) => {
  switch (status) {
    case 'pending':
      return <Clock className={`h-4 w-4 text-muted-foreground ${className}`} />;
    case 'in_progress':
      return <Loader2 className={`h-4 w-4 text-blue-500 animate-spin ${className}`} />;
    case 'completed':
      return <CheckCircle className={`h-4 w-4 text-green-500 ${className}`} />;
    case 'failed':
      return <AlertCircle className={`h-4 w-4 text-red-500 ${className}`} />;
    default:
      return null;
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">Pending</Badge>;
    case 'in_progress':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
    case 'completed':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return null;
  }
};
