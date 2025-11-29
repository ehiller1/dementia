import React from 'react';
import { ImplementationPlan, ImplementationStep } from '../services/ImplementationPlanningService.js';
import { useEnhancedUnifiedConversation } from '../contexts/EnhancedUnifiedConversationProvider';
import { Button } from './ui/button.js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card.js';
import { Badge } from './ui/badge.js';

interface ImplementationPlanViewProps {
  plan: ImplementationPlan;
  showControls?: boolean;
}

export const ImplementationPlanView: React.FC<ImplementationPlanViewProps> = ({ 
  plan, 
  showControls = true 
}) => {
  const { 
    updateImplementationPlanStatus, 
    updateImplementationStepStatus 
  } = useUnifiedConversation();

  // Calculate overall progress
  const completedSteps = plan.steps.filter(step => step.status === 'completed').length;
  const totalSteps = plan.steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Handle plan status update
  const handlePlanStatusUpdate = async (status: string) => {
    if (updateImplementationPlanStatus) {
      await updateImplementationPlanStatus(plan.id, status);
    }
  };

  // Handle step status update
  const handleStepStatusUpdate = async (stepId: string, status: string) => {
    if (updateImplementationStepStatus) {
      await updateImplementationStepStatus(plan.id, stepId, status);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-200 text-gray-800';
      case 'in_progress':
        return 'bg-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'blocked':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <Card className="w-full mb-4 border border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{plan.title}</CardTitle>
          <Badge className={getStatusColor(plan.status)}>
            {plan.status.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <h3 className="text-lg font-medium mb-2">Steps</h3>
        <ul className="space-y-3">
          {plan.steps.map((step) => (
            <li key={step.id} className="border rounded-md p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <div className="flex items-center">
                  <Badge className={getStatusColor(step.status)}>
                    {step.status.replace('_', ' ')}
                  </Badge>
                  
                  {showControls && (
                    <div className="ml-2">
                      {step.status !== 'in_progress' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStepStatusUpdate(step.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      
                      {step.status !== 'completed' && step.status !== 'blocked' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="ml-1"
                          onClick={() => handleStepStatusUpdate(step.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      
                      {step.status !== 'blocked' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="ml-1"
                          onClick={() => handleStepStatusUpdate(step.id, 'blocked')}
                        >
                          Block
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {plan.metrics && plan.metrics.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Expected Metrics</h3>
            <ul className="list-disc pl-5">
              {plan.metrics.map((metric) => (
                <li key={metric.name}>
                  <span className="font-medium">{metric.name}:</span> {metric.currentValue || 0} / {metric.target} {metric.unit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {showControls && (
        <CardFooter className="flex justify-end space-x-2">
          {plan.status !== 'in_progress' && (
            <Button 
              variant="outline"
              onClick={() => handlePlanStatusUpdate('in_progress')}
            >
              Start Plan
            </Button>
          )}
          
          {plan.status !== 'completed' && (
            <Button 
              variant="default"
              onClick={() => handlePlanStatusUpdate('completed')}
            >
              Complete Plan
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default ImplementationPlanView;
