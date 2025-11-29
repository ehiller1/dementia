import React, { useEffect, useState } from 'react';
import { ConversationMessage } from '../contexts/ConversationContext.js';
import { ImplementationPlan } from '../services/ImplementationPlanningService.js';
import { useEnhancedUnifiedConversation } from '../contexts/EnhancedUnifiedConversationProvider';
import ImplementationPlanView from './ImplementationPlanView.js';
import { Button } from './ui/button.js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible.js';

interface ImplementationPlanMessageProps {
  message: ConversationMessage;
}

const ImplementationPlanMessage: React.FC<ImplementationPlanMessageProps> = ({ message }) => {
  const [plan, setPlan] = useState<ImplementationPlan | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleExecuteStep = async (stepId: string) => {
      if (plan) {
        try {
          setIsLoading(true);
          // TODO: Implement execution of implementation plan step in EnhancedUnifiedConversationProvider
          // const executedPlan = await executeImplementationPlanStep(plan, stepId);
          // if (executedPlan) {
          //   setPlan(executedPlan);
          // }
        } catch (error) {
          console.error('Error executing implementation plan step:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const fetchPlan = async () => {
      if (message.metadata?.implementationPlanId) {
        setIsLoading(true);
        try {
          // TODO: Implement implementation plan fetching in EnhancedUnifiedConversationProvider
          const fetchedPlan = null; // Placeholder until implementation plan service is integrated
          if (fetchedPlan) {
            setPlan(fetchedPlan);
          }
        } catch (error) {
          console.error('Error fetching implementation plan:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPlan();
  }, [message.metadata?.implementationPlanId]);

  // If there's no implementation plan ID in the metadata, just render the message content
  if (!message.metadata?.implementationPlanId) {
    return <div className="whitespace-pre-wrap">{message.content}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap">{message.content}</div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Implementation Plan</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? 'Hide Details' : 'Show Details'}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-2">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : plan ? (
            <ImplementationPlanView plan={plan} />
          ) : (
            <div className="p-4 border rounded-md bg-gray-50">
              Implementation plan details not available
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ImplementationPlanMessage;
