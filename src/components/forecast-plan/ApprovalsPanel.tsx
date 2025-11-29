import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { CheckCircle, XCircle, Clock, AlertTriangle, User } from 'lucide-react';

interface Approval {
  id: string;
  action_id: string;
  action_type: string;
  action_summary: string;
  required_roles: string[];
  granted_roles: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimated_impact: {
    revenue?: number;
    cost?: number;
    risk_level?: string;
  };
  context: any;
  created_at: string;
  expires_at?: string;
}

interface ApprovalsResponse {
  approvals: Approval[];
  count: number;
  timestamp: string;
}

export const ApprovalsPanel: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [approverRole, setApproverRole] = useState('');
  const [approverId, setApproverId] = useState('');
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState('');

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/forecast-plan/approvals');
      if (response.ok) {
        const data: ApprovalsResponse = await response.json();
        setApprovals(data.approvals);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantApproval = async (approvalId: string) => {
    if (!approverRole.trim()) {
      alert('Please specify your role');
      return;
    }

    try {
      const response = await fetch(`/api/forecast-plan/approvals/${approvalId}/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver_role: approverRole,
          approver_id: approverId || undefined,
          conditions: conditions || undefined,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Approval granted:', result);
        
        // Reset form
        setSelectedApproval(null);
        setApproverRole('');
        setApproverId('');
        setNotes('');
        setConditions('');
        
        // Refresh approvals
        fetchApprovals();
      } else {
        const error = await response.json();
        alert(`Failed to grant approval: ${error.message}`);
      }
    } catch (error) {
      console.error('Error granting approval:', error);
      alert('Failed to grant approval');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (approval: Approval) => {
    const isFullyApproved = approval.required_roles.every(role => 
      approval.granted_roles.includes(role)
    );
    
    if (isFullyApproved) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (approval.granted_roles.length > 0) {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approvals Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Approvals Dashboard
            <Badge variant="outline">{approvals.length} pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approvals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending approvals
              </div>
            ) : (
              approvals.map((approval) => (
                <Card key={approval.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(approval)}
                          <h3 className="font-semibold">{approval.action_type}</h3>
                          <Badge className={getUrgencyColor(approval.urgency)}>
                            {approval.urgency}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{approval.action_summary}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm font-medium">Required Roles:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {approval.required_roles.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium">Granted by:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {approval.granted_roles.length > 0 ? (
                                approval.granted_roles.map((role) => (
                                  <Badge key={role} variant="default" className="text-xs bg-green-100 text-green-800">
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">None</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {approval.estimated_impact && (
                          <div className="bg-gray-50 p-3 rounded-md mb-3">
                            <span className="text-sm font-medium">Estimated Impact:</span>
                            <div className="text-sm text-gray-600 mt-1">
                              {approval.estimated_impact.revenue && (
                                <div>Revenue: ${approval.estimated_impact.revenue.toLocaleString()}</div>
                              )}
                              {approval.estimated_impact.cost && (
                                <div>Cost: ${approval.estimated_impact.cost.toLocaleString()}</div>
                              )}
                              {approval.estimated_impact.risk_level && (
                                <div>Risk Level: {approval.estimated_impact.risk_level}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          onClick={() => setSelectedApproval(approval.id)}
                          disabled={approval.required_roles.every(role => 
                            approval.granted_roles.includes(role)
                          )}
                          size="sm"
                        >
                          {approval.granted_roles.length > 0 ? 'Add Approval' : 'Approve'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Modal */}
      {selectedApproval && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Grant Approval</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Role *</label>
                <Input
                  value={approverRole}
                  onChange={(e) => setApproverRole(e.target.value)}
                  placeholder="e.g., finance_manager, operations_director"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Your ID (optional)</label>
                <Input
                  value={approverId}
                  onChange={(e) => setApproverId(e.target.value)}
                  placeholder="e.g., john.doe@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Conditions (optional)</label>
                <Textarea
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="Any conditions or requirements..."
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or comments..."
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => handleGrantApproval(selectedApproval)}
                className="flex-1"
              >
                Grant Approval
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedApproval(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
