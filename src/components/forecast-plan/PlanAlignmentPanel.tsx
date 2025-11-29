import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Target, Calendar, DollarSign } from 'lucide-react';

interface PlanHierarchy {
  strategic: {
    goals: Array<{
      id: string;
      title: string;
      target_value: number;
      current_value: number;
      unit: string;
      deadline: string;
      status: 'on_track' | 'at_risk' | 'behind';
    }>;
    kpis: Array<{
      name: string;
      target: number;
      actual: number;
      variance_pct: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  operational: {
    initiatives: Array<{
      id: string;
      name: string;
      progress: number;
      budget_allocated: number;
      budget_spent: number;
      expected_completion: string;
      risk_level: 'low' | 'medium' | 'high';
    }>;
    metrics: Array<{
      name: string;
      current: number;
      target: number;
      unit: string;
      variance_pct: number;
    }>;
  };
  execution: {
    tasks: Array<{
      id: string;
      title: string;
      assignee: string;
      due_date: string;
      status: 'pending' | 'in_progress' | 'completed' | 'blocked';
      priority: 'low' | 'medium' | 'high' | 'critical';
    }>;
    resource_utilization: {
      capacity: number;
      allocated: number;
      available: number;
    };
  };
}

interface PlanVariance {
  id: string;
  scope: 'strategic' | 'operational' | 'execution';
  variance_type: 'budget' | 'timeline' | 'performance' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact_assessment: string;
  recommended_actions: string[];
  detected_at: string;
}

export const PlanAlignmentPanel: React.FC = () => {
  const [planHierarchy, setPlanHierarchy] = useState<PlanHierarchy | null>(null);
  const [variances, setVariances] = useState<PlanVariance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScope, setSelectedScope] = useState<'strategic' | 'operational' | 'execution'>('strategic');

  useEffect(() => {
    fetchPlanData();
    const interval = setInterval(fetchPlanData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchPlanData = async () => {
    try {
      // Fetch plan hierarchies
      const hierarchyResponse = await fetch('/api/forecast-plan/plans/hierarchy');
      if (hierarchyResponse.ok) {
        const hierarchyData = await hierarchyResponse.json();
        setPlanHierarchy(hierarchyData.hierarchy);
      }

      // Fetch variances
      const variancesResponse = await fetch('/api/forecast-plan/plans/variances');
      if (variancesResponse.ok) {
        const variancesData = await variancesResponse.json();
        setVariances(variancesData.variances || []);
      }
    } catch (error) {
      console.error('Failed to fetch plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': case 'completed': return 'bg-green-100 text-green-800';
      case 'at_risk': case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'behind': case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Alignment Dashboard</CardTitle>
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
      {/* Plan Hierarchy Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Plan Alignment Dashboard
          </CardTitle>
          <div className="flex gap-2">
            {(['strategic', 'operational', 'execution'] as const).map((scope) => (
              <Button
                key={scope}
                variant={selectedScope === scope ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedScope(scope)}
                className="capitalize"
              >
                {scope}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Strategic Level */}
      {selectedScope === 'strategic' && planHierarchy?.strategic && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategic Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planHierarchy.strategic.goals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{goal.title}</h4>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                      </div>
                      <Progress 
                        value={(goal.current_value / goal.target_value) * 100} 
                        className="h-2"
                      />
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategic KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planHierarchy.strategic.kpis.map((kpi, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{kpi.name}</div>
                      <div className="text-sm text-gray-600">
                        {kpi.actual} / {kpi.target}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(kpi.trend)}
                      <Badge variant={kpi.variance_pct > 0 ? 'default' : 'destructive'}>
                        {kpi.variance_pct > 0 ? '+' : ''}{kpi.variance_pct.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Operational Level */}
      {selectedScope === 'operational' && planHierarchy?.operational && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operational Initiatives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planHierarchy.operational.initiatives.map((initiative) => (
                  <div key={initiative.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{initiative.name}</h4>
                      <Badge className={getSeverityColor(initiative.risk_level)}>
                        {initiative.risk_level} risk
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{initiative.progress}%</span>
                      </div>
                      <Progress value={initiative.progress} className="h-2" />
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${initiative.budget_spent.toLocaleString()} / ${initiative.budget_allocated.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(initiative.expected_completion).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operational Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planHierarchy.operational.metrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-sm text-gray-600">
                        {metric.current} / {metric.target} {metric.unit}
                      </div>
                    </div>
                    <Badge variant={metric.variance_pct >= 0 ? 'default' : 'destructive'}>
                      {metric.variance_pct > 0 ? '+' : ''}{metric.variance_pct.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Execution Level */}
      {selectedScope === 'execution' && planHierarchy?.execution && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {planHierarchy.execution.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-600">
                        Assigned to: {task.assignee}
                      </div>
                      <div className="text-sm text-gray-600">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getSeverityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Capacity Utilization</span>
                    <span>{((planHierarchy.execution.resource_utilization.allocated / planHierarchy.execution.resource_utilization.capacity) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(planHierarchy.execution.resource_utilization.allocated / planHierarchy.execution.resource_utilization.capacity) * 100} 
                    className="h-3"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {planHierarchy.execution.resource_utilization.capacity}
                    </div>
                    <div className="text-sm text-gray-600">Total Capacity</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {planHierarchy.execution.resource_utilization.allocated}
                    </div>
                    <div className="text-sm text-gray-600">Allocated</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {planHierarchy.execution.resource_utilization.available}
                    </div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Variances */}
      {variances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Plan Variances
              <Badge variant="outline">{variances.length} detected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {variances.map((variance) => (
                <Card key={variance.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(variance.severity)}>
                            {variance.severity}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {variance.scope}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {variance.variance_type}
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-2">{variance.description}</h4>
                        <p className="text-sm text-gray-600 mb-3">{variance.impact_assessment}</p>
                        
                        <div>
                          <span className="text-sm font-medium">Recommended Actions:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {variance.recommended_actions.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {new Date(variance.detected_at).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
