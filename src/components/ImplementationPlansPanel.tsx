import React, { useState } from 'react';
import { useEnhancedUnifiedConversation } from '../contexts/EnhancedUnifiedConversationProvider';
import { ImplementationPlan } from '../services/ImplementationPlanningService.js';
import ImplementationPlanView from './ImplementationPlanView.js';
import { Button } from './ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';

const ImplementationPlansPanel: React.FC = () => {
  const { 
    // TODO: Implementation plans not yet integrated with EnhancedUnifiedConversationProvider
    // implementationPlans, 
    // currentImplementationPlan,
    // getImplementationPlan
  } = useEnhancedUnifiedConversation();
  
  // Local state to track the selected plan - placeholder until implementation plans are integrated
  const [selectedPlan, setSelectedPlan] = useState<ImplementationPlan | null>(null);
  const implementationPlans: ImplementationPlan[] = []; // Placeholder
  
  const [activeTab, setActiveTab] = useState<string>('all');

  // Filter plans based on status
  const filterPlansByStatus = (status?: string) => {
    if (!status || status === 'all') {
      return implementationPlans;
    }
    return implementationPlans.filter(plan => plan.status === status);
  };

  // Get filtered plans based on active tab
  const getFilteredPlans = () => {
    switch (activeTab) {
      case 'in_progress':
        return filterPlansByStatus('in_progress');
      case 'completed':
        return filterPlansByStatus('completed');
      case 'not_started':
        return filterPlansByStatus('not_started');
      default:
        return implementationPlans;
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handlePlanSelect = async (plan: ImplementationPlan) => {
    // Fetch the latest version of the plan
    const latestPlan = await getImplementationPlan(plan.id);
    setSelectedPlan(latestPlan || plan);
  };

  const filteredPlans = getFilteredPlans();

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>Implementation Plans</CardTitle>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <div className="px-4">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="in_progress" className="flex-1">In Progress</TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value={activeTab} className="flex-1 overflow-auto p-4">
            {filteredPlans.length > 0 ? (
              <div className="space-y-4">
                {filteredPlans.map(plan => (
                  <Card 
                    key={plan.id} 
                    className={`cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'border-primary' : ''}`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{plan.title}</h3>
                          <p className="text-sm text-muted-foreground">{plan.description.substring(0, 100)}...</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-xs px-2 py-1 rounded-full ${plan.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {plan.status}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p>No implementation plans found.</p>
                <p className="text-sm mt-1">Plans will appear here when you create them.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
      
      {selectedPlan && (
        <div className="mt-4">
          <ImplementationPlanView plan={selectedPlan} />
        </div>
      )}
    </div>
  );
};

export default ImplementationPlansPanel;
