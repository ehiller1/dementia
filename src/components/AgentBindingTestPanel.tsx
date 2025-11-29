/**
 * Agent Binding Test Panel
 * Interactive UI component to test agent-to-task binding
 * Add this to your app to verify the system works
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { eventBus } from '@/services/events/EventBus';
import { serviceRegistry } from '@/services/ServiceRegistry';
import { runReflectionPacklet } from '@/orchestration/packlets/reflection';
import { CheckCircle, XCircle, Play, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  message?: string;
  details?: any;
}

export function AgentBindingTestPanel() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Event Publishing', status: 'pending' },
    { name: 'agent:assigned Event', status: 'pending' },
    { name: 'agent:completed Event', status: 'pending' },
    { name: 'Runner Field (Declarative)', status: 'pending' },
    { name: 'Runner Field (Procedural)', status: 'pending' },
    { name: 'Provenance Assignments', status: 'pending' }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [capturedEvents, setCapturedEvents] = useState<any[]>([]);
  const [reflectionResult, setReflectionResult] = useState<any>(null);
  
  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((t, i) => i === index ? { ...t, ...updates } : t));
  };
  
  const runTests = async () => {
    setIsRunning(true);
    setCapturedEvents([]);
    setReflectionResult(null);
    
    // Reset all tests
    setTests(prev => prev.map(t => ({ ...t, status: 'pending' as const, message: undefined })));
    
    try {
      // Test 1: Event Publishing
      updateTest(0, { status: 'running' });
      
      const events: any[] = [];
      
      const unsubAssigned = eventBus.subscribe('agent:assigned', (e) => {
        events.push({ type: 'assigned', ...e });
        setCapturedEvents(prev => [...prev, { type: 'assigned', ...e }]);
      });
      
      const unsubCompleted = eventBus.subscribe('agent:completed', (e) => {
        events.push({ type: 'completed', ...e });
        setCapturedEvents(prev => [...prev, { type: 'completed', ...e }]);
      });
      
      // Register test service
      serviceRegistry.registerService({
        id: 'test-agent-binding',
        name: 'Test Agent Binding Service',
        endpoint: 'http://localhost:3000/test',
        capabilities: ['test-task']
      });
      
      // Trigger task
      eventBus.publish('approval:granted', {
        taskId: 'test-task',
        userId: 'test-user'
      });
      
      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (events.length >= 2) {
        updateTest(0, { status: 'pass', message: `${events.length} events captured` });
      } else {
        updateTest(0, { status: 'fail', message: `Only ${events.length} events captured` });
      }
      
      // Test 2: agent:assigned Event
      updateTest(1, { status: 'running' });
      const assignedEvent = events.find(e => e.type === 'assigned');
      if (assignedEvent && assignedEvent.taskId && assignedEvent.runnerId) {
        updateTest(1, { 
          status: 'pass', 
          message: `${assignedEvent.taskId} → ${assignedEvent.runnerId}`,
          details: assignedEvent
        });
      } else {
        updateTest(1, { status: 'fail', message: 'Event not found or incomplete' });
      }
      
      // Test 3: agent:completed Event
      updateTest(2, { status: 'running' });
      const completedEvent = events.find(e => e.type === 'completed');
      if (completedEvent && completedEvent.status) {
        updateTest(2, { 
          status: 'pass', 
          message: `Status: ${completedEvent.status}`,
          details: completedEvent
        });
      } else {
        updateTest(2, { status: 'fail', message: 'Event not found or incomplete' });
      }
      
      // Test 4-6: Reflection Packlet
      updateTest(3, { status: 'running' });
      updateTest(4, { status: 'running' });
      updateTest(5, { status: 'running' });
      
      const reflection = await runReflectionPacklet({
        lastTurn: null,
        results: { notes: ['Test execution completed'] },
        context: {
          tenantId: 'test',
          userId: 'test-user',
          conversationId: 'test-conv'
        }
      });
      
      setReflectionResult(reflection);
      
      // Test 4: Declarative Runner Field
      const declarativeHasRunner = reflection.plan.declarative.every((t: any) => t.runner);
      if (declarativeHasRunner) {
        updateTest(3, { 
          status: 'pass', 
          message: `${reflection.plan.declarative.length} tasks with runner field` 
        });
      } else {
        updateTest(3, { status: 'fail', message: 'Some tasks missing runner field' });
      }
      
      // Test 5: Procedural Runner Field
      const proceduralHasRunner = reflection.plan.procedural.every((t: any) => t.runner);
      if (proceduralHasRunner) {
        updateTest(4, { 
          status: 'pass', 
          message: `${reflection.plan.procedural.length} tasks with runner field` 
        });
      } else {
        updateTest(4, { status: 'fail', message: 'Some tasks missing runner field' });
      }
      
      // Test 6: Provenance Assignments
      if (reflection.provenance.assignments && reflection.provenance.assignments.length > 0) {
        updateTest(5, { 
          status: 'pass', 
          message: `${reflection.provenance.assignments.length} assignments tracked` 
        });
      } else {
        updateTest(5, { status: 'fail', message: 'No assignments in provenance' });
      }
      
      // Cleanup
      unsubAssigned.unsubscribe();
      unsubCompleted.unsubscribe();
      
    } catch (error) {
      console.error('Test execution error:', error);
      setTests(prev => prev.map(t => 
        t.status === 'running' ? { ...t, status: 'fail' as const, message: 'Error during test' } : t
      ));
    } finally {
      setIsRunning(false);
    }
  };
  
  const allPassed = tests.every(t => t.status === 'pass');
  const anyFailed = tests.some(t => t.status === 'fail');
  
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🧪 Agent Binding Test Suite</span>
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tests.map((test, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {test.status === 'pass' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {test.status === 'fail' && <XCircle className="h-5 w-5 text-red-600" />}
                  {test.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />}
                  {test.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                  
                  <div>
                    <div className="font-medium">{test.name}</div>
                    {test.message && (
                      <div className="text-sm text-gray-600">{test.message}</div>
                    )}
                  </div>
                </div>
                
                <Badge variant={
                  test.status === 'pass' ? 'default' : 
                  test.status === 'fail' ? 'destructive' : 
                  'secondary'
                }>
                  {test.status}
                </Badge>
              </div>
            ))}
          </div>
          
          {!isRunning && tests.some(t => t.status !== 'pending') && (
            <div className={`mt-4 p-4 rounded ${allPassed ? 'bg-green-50 border border-green-200' : anyFailed ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="font-bold">
                {allPassed && '🎉 All tests passed!'}
                {anyFailed && '❌ Some tests failed'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {capturedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Captured Events ({capturedEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {capturedEvents.map((event, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded text-sm font-mono">
                  <div className="font-bold">{event.type}</div>
                  <div className="text-gray-600">
                    {event.taskId} → {event.runnerId} ({event.status || 'started'})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {reflectionResult && (
        <Card>
          <CardHeader>
            <CardTitle>Reflection Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Declarative Tasks</h4>
                <div className="space-y-1">
                  {reflectionResult.plan.declarative.map((task: any, i: number) => (
                    <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                      {task.title}
                      {task.runner && (
                        <Badge className="ml-2" variant="secondary">
                          {task.runner.name}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Procedural Tasks</h4>
                <div className="space-y-1">
                  {reflectionResult.plan.procedural.map((task: any, i: number) => (
                    <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                      {task.title}
                      {task.runner && (
                        <Badge className="ml-2" variant="secondary">
                          {task.runner.name}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {reflectionResult.provenance.assignments && (
                <div>
                  <h4 className="font-medium mb-2">Assignments</h4>
                  <div className="space-y-1">
                    {reflectionResult.provenance.assignments.map((a: any, i: number) => (
                      <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                        {a.taskId} → {a.runnerId} ({a.status})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
