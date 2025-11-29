import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ApprovalsPanel } from './ApprovalsPanel';
import { PlanAlignmentPanel } from './PlanAlignmentPanel';
import { ExplanationsPanel } from './ExplanationsPanel';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Brain,
  Users,
  Target
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: 'running' | 'stopped' | 'error';
    uptime: number;
    last_activity: string;
  }>;
  knowledge_graph: {
    nodes: number;
    edges: number;
    last_updated: string;
  };
  timestamp: string;
}

export const ForecastPlanDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/forecast-plan/status');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'running': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': case 'error': return 'bg-red-100 text-red-800';
      case 'stopped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'running': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy': case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forecast & Plan Integration</h1>
            <p className="text-gray-600 mt-1">Comprehensive business planning and forecasting dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            {systemHealth && (
              <Badge className={getHealthStatusColor(systemHealth.status)}>
                {getHealthIcon(systemHealth.status)}
                <span className="ml-1 capitalize">{systemHealth.status}</span>
              </Badge>
            )}
            <Button variant="outline" onClick={fetchSystemHealth}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Plan Alignment
            </TabsTrigger>
            <TabsTrigger value="explanations" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* System Health Overview */}
            {systemHealth && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(systemHealth.status)}
                      <span className="text-2xl font-bold capitalize">{systemHealth.status}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Last updated: {new Date(systemHealth.timestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.values(systemHealth.services).filter(s => s.status === 'running').length}
                    </div>
                    <p className="text-xs text-gray-600">
                      of {Object.keys(systemHealth.services).length} services
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Knowledge Graph</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {systemHealth.knowledge_graph.nodes}
                    </div>
                    <p className="text-xs text-gray-600">
                      nodes, {systemHealth.knowledge_graph.edges} edges
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">
                      {new Date(systemHealth.knowledge_graph.last_updated).toLocaleTimeString()}
                    </div>
                    <p className="text-xs text-gray-600">Knowledge graph update</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Services Status */}
            {systemHealth && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(systemHealth.services).map(([serviceName, service]) => (
                      <div key={serviceName} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getHealthIcon(service.status)}
                          <span className="font-medium capitalize">
                            {serviceName.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <Badge className={getHealthStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('approvals')}
                  >
                    <Users className="h-6 w-6" />
                    <span>Review Approvals</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('plans')}
                  >
                    <Target className="h-6 w-6" />
                    <span>Check Plan Alignment</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('explanations')}
                  >
                    <Brain className="h-6 w-6" />
                    <span>View AI Insights</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <ApprovalsPanel />
          </TabsContent>

          {/* Plan Alignment Tab */}
          <TabsContent value="plans">
            <PlanAlignmentPanel />
          </TabsContent>

          {/* AI Explanations Tab */}
          <TabsContent value="explanations">
            <ExplanationsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
