/**
 * Operator Dashboard - Immediate Tactical Actions
 * 
 * Focus: Execution, monitoring, quick actions
 * Information Density: High
 * Time Horizon: Immediate (hours to days)
 */

import React, { useEffect, useState } from 'react';
import { eventBus } from '@/services/events/EventBus';
import { AlertCircle, CheckCircle, Clock, Zap, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function OperatorDashboard() {
  // Use shared event bus directly (no OrchestrationProvider needed)
  const [urgentActions, setUrgentActions] = useState<any[]>([]);
  const [kpiStatus, setKpiStatus] = useState<any>({});
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<any[]>([]);

  useEffect(() => {
    // Subscribe to action events
    const actionSub = eventBus.subscribe('action.status_changed', (event) => {
      if (event.priority === 'critical' || event.priority === 'high') {
        setUrgentActions(prev => {
          const updated = [...prev];
          const index = updated.findIndex(a => a.id === event.actionId);
          if (index >= 0) {
            updated[index] = { ...updated[index], status: event.status };
          } else {
            updated.unshift({
              id: event.actionId,
              title: event.action || 'Action',
              status: event.status,
              priority: event.priority,
              timestamp: new Date().toISOString()
            });
          }
          return updated.slice(0, 10); // Keep only top 10
        });
      }

      if (event.status === 'completed') {
        setRecentCompletions(prev => [{
          id: event.actionId,
          title: event.action || 'Action',
          completedAt: new Date().toISOString()
        }, ...prev].slice(0, 5));
      }
    });

    // Subscribe to signal events for alerts
    const signalSub = eventBus.subscribe('signal.detected', (event) => {
      if (event.severity === 'critical' || event.severity === 'high') {
        setActiveAlerts(prev => [{
          id: event.id,
          message: event.data?.message || 'Alert',
          severity: event.severity,
          timestamp: event.timestamp
        }, ...prev].slice(0, 5));
      }
    });

    return () => {
      actionSub.unsubscribe();
      signalSub.unsubscribe();
    };
  }, [eventBus]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={20} />;
      case 'in_progress': return <Clock className="text-blue-500 animate-spin" size={20} />;
      case 'pending': return <Clock className="text-gray-500" size={20} />;
      case 'failed': return <AlertCircle className="text-red-500" size={20} />;
      default: return <Clock className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="operator-dashboard p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Zap className="text-red-500" />
            <span>Operator Command Center</span>
          </h1>
          <p className="text-gray-600 mt-1">Immediate actions requiring attention</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last Updated</div>
          <div className="text-lg font-mono">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Alert Banner */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-500 border-2 bg-red-50 p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-lg">Active Alerts ({activeAlerts.length})</h3>
              <div className="mt-2 space-y-2">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="bg-white p-3 rounded border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{alert.message}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* KPI Status Cards */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">System Health</h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Active Processes</span>
                <span className="font-mono">8/10</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Agent Utilization</span>
                <span className="font-mono">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Response Time</span>
                <span className="font-mono">1.2s</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
          </div>
        </Card>

        {/* Pending Actions */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Pending Actions</h3>
          <div className="text-4xl font-bold text-blue-600 mb-2">{urgentActions.filter(a => a.status === 'pending').length}</div>
          <p className="text-sm text-gray-600">Require immediate attention</p>
          <Button className="w-full mt-4" variant="default">
            View All Actions
          </Button>
        </Card>

        {/* Recent Completions */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Recent Completions</h3>
          <div className="text-4xl font-bold text-green-600 mb-2">{recentCompletions.length}</div>
          <p className="text-sm text-gray-600">Completed in last hour</p>
          <div className="mt-4 space-y-2">
            {recentCompletions.slice(0, 3).map(item => (
              <div key={item.id} className="text-xs flex items-center space-x-2">
                <CheckCircle size={14} className="text-green-500" />
                <span className="truncate">{item.title}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Urgent Actions List */}
      <Card className="p-6">
        <h3 className="font-bold text-xl mb-4">Urgent Actions</h3>
        <div className="space-y-3">
          {urgentActions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <CheckCircle size={48} className="mx-auto mb-2 text-green-500" />
              <p>All urgent actions completed! 🎉</p>
            </div>
          ) : (
            urgentActions.map(action => (
              <div key={action.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(action.status)}
                  <div className="flex-1">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(action.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                    {action.priority?.toUpperCase()}
                  </span>
                  <Button size="sm" variant="outline">Execute</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-bold text-xl mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
            <Zap size={24} className="mb-1" />
            <span className="text-xs">Execute Batch</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
            <AlertCircle size={24} className="mb-1" />
            <span className="text-xs">View Alerts</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
            <TrendingUp size={24} className="mb-1" />
            <span className="text-xs">KPI Dashboard</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
            <Clock size={24} className="mb-1" />
            <span className="text-xs">Schedule Task</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
