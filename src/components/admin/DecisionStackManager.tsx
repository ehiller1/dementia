/**
 * Decision Stack Manager UI
 * 
 * Single-click deployment and management of complete decision stacks:
 * - Browse available stacks
 * - View stack configuration
 * - Deploy with validation
 * - Monitor deployment status
 * - Enable/disable stacks
 * - View governance policies
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Package, 
  PlayCircle,
  StopCircle,
  Settings,
  FileText,
  Shield,
  Activity
} from 'lucide-react';

interface DecisionStack {
  name: string;
  displayName: string;
  version: string;
  description: string;
  function: string;
  enabled: boolean;
  terms: {
    kpis: any[];
    ontology_concepts: string[];
  };
  patterns: any[];
  plays: any[];
  crew: {
    manager: string;
    workers: string[];
  };
  governance: {
    constraints: any[];
    approval_workflows: Record<string, any>;
  };
}

interface DeploymentStatus {
  stack_name: string;
  deployed: boolean;
  deployment_date?: string;
  components: {
    ontology_concepts: { status: string; count: number };
    kpis: { status: string; count: number };
    event_patterns: { status: string; count: number };
    playbooks: { status: string; count: number };
    crew: { status: string; manager: string; workers: number };
    governance: { status: string };
    integrations: { status: string; count: number };
  };
  validation?: {
    passed: boolean;
    checks: Array<{ name: string; passed: boolean; message?: string }>;
  };
}

export function DecisionStackManager() {
  const [stacks, setStacks] = useState<DecisionStack[]>([]);
  const [selectedStack, setSelectedStack] = useState<DecisionStack | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<Record<string, DeploymentStatus>>({});
  const [deploying, setDeploying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStacks();
  }, []);

  const loadStacks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/decision-stacks');
      const data = await response.json();
      setStacks(data.stacks || []);
      
      // Load deployment status for each stack
      const statusPromises = data.stacks.map((s: DecisionStack) =>
        fetch(`/api/decision-stacks/${s.name}/status`).then(r => r.json())
      );
      const statuses = await Promise.all(statusPromises);
      
      const statusMap: Record<string, DeploymentStatus> = {};
      statuses.forEach((status, idx) => {
        statusMap[data.stacks[idx].name] = status;
      });
      setDeploymentStatus(statusMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deployStack = async (stackName: string) => {
    try {
      setDeploying(stackName);
      setError(null);

      const response = await fetch('/api/decision-stacks/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stack_name: stackName })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Deployment failed');
      }

      // Refresh status
      await loadStacks();

      if (result.success) {
        alert(`✅ ${stackName} deployed successfully!`);
      } else {
        alert(`⚠️ ${stackName} deployment completed with warnings. Check details.`);
      }
    } catch (err: any) {
      setError(err.message);
      alert(`❌ Deployment failed: ${err.message}`);
    } finally {
      setDeploying(null);
    }
  };

  const toggleStack = async (stackName: string, enabled: boolean) => {
    try {
      await fetch(`/api/decision-stacks/${stackName}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      await loadStacks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusBadge = (deployed: boolean, enabled: boolean) => {
    if (!deployed) {
      return <Badge variant="secondary">Not Deployed</Badge>;
    }
    if (!enabled) {
      return <Badge variant="destructive">Disabled</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Decision Stack Manager</h1>
          <p className="text-muted-foreground">
            Deploy and manage integrated decision stacks
          </p>
        </div>
        <Button onClick={loadStacks} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stack List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Stacks</CardTitle>
              <CardDescription>
                {stacks.length} stack{stacks.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stacks.map((stack) => (
                <Card
                  key={stack.name}
                  className={`cursor-pointer transition-colors ${
                    selectedStack?.name === stack.name
                      ? 'ring-2 ring-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedStack(stack)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4" />
                          <h3 className="font-semibold">{stack.displayName}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {stack.description}
                        </p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(
                            deploymentStatus[stack.name]?.deployed,
                            stack.enabled
                          )}
                          <Badge variant="outline" className="text-xs">
                            v{stack.version}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Stack Details */}
        <div className="lg:col-span-2">
          {selectedStack ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="governance">Governance</TabsTrigger>
                <TabsTrigger value="deployment">Deployment</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedStack.displayName}</CardTitle>
                        <CardDescription>
                          {selectedStack.function} • v{selectedStack.version}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {deploymentStatus[selectedStack.name]?.deployed ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleStack(selectedStack.name, !selectedStack.enabled)
                              }
                            >
                              {selectedStack.enabled ? (
                                <>
                                  <StopCircle className="h-4 w-4 mr-2" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Enable
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => deployStack(selectedStack.name)}
                              disabled={deploying === selectedStack.name}
                            >
                              {deploying === selectedStack.name ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Redeploying...
                                </>
                              ) : (
                                <>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Redeploy
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => deployStack(selectedStack.name)}
                            disabled={deploying === selectedStack.name}
                          >
                            {deploying === selectedStack.name ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deploying...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Deploy Stack
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{selectedStack.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">KPIs</h4>
                        <div className="space-y-1">
                          {selectedStack.terms.kpis.slice(0, 3).map((kpi) => (
                            <div key={kpi.name} className="text-sm flex items-center gap-2">
                              <Badge variant="outline">{kpi.name}</Badge>
                              <span className="text-muted-foreground">
                                Target: {kpi.target}
                              </span>
                            </div>
                          ))}
                          {selectedStack.terms.kpis.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{selectedStack.terms.kpis.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Event Patterns</h4>
                        <div className="space-y-1">
                          {selectedStack.patterns.slice(0, 3).map((pattern) => (
                            <div key={pattern.name} className="text-sm">
                              <Badge variant="outline">{pattern.displayName}</Badge>
                            </div>
                          ))}
                          {selectedStack.patterns.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{selectedStack.patterns.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Components Tab */}
              <TabsContent value="components" className="space-y-4">
                {deploymentStatus[selectedStack.name]?.components && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Deployment Components</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(
                        deploymentStatus[selectedStack.name].components
                      ).map(([name, component]: [string, any]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(component.status)}
                            <div>
                              <p className="font-medium capitalize">
                                {name.replace(/_/g, ' ')}
                              </p>
                              {component.count !== undefined && (
                                <p className="text-sm text-muted-foreground">
                                  {component.count} item{component.count !== 1 ? 's' : ''}
                                </p>
                              )}
                              {component.manager && (
                                <p className="text-sm text-muted-foreground">
                                  Manager: {component.manager} | Workers:{' '}
                                  {component.workers}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              component.status === 'success'
                                ? 'default'
                                : component.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {component.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Plays & Workflows</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedStack.plays.map((play) => (
                      <div
                        key={play.name}
                        className="flex items-start justify-between p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">{play.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {play.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">SLA: {play.sla_hours}h</Badge>
                            {play.auto_execute && (
                              <Badge variant="default">Auto-execute</Badge>
                            )}
                            {play.requires_approval_above_usd > 0 && (
                              <Badge variant="secondary">
                                Approval &gt; ${play.requires_approval_above_usd}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Governance Tab */}
              <TabsContent value="governance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Governance Constraints
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedStack.governance.constraints.map((constraint, idx) => (
                      <div key={idx} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{constraint.type}</Badge>
                          <Badge
                            variant={
                              constraint.severity === 'block'
                                ? 'destructive'
                                : constraint.severity === 'approve'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {constraint.severity}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{constraint.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {constraint.field} {constraint.operator} {constraint.value}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Approval Workflows</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(selectedStack.governance.approval_workflows).map(
                      ([action, limits]: [string, any]) => (
                        <div key={action} className="p-3 border rounded">
                          <p className="font-medium mb-2 capitalize">
                            {action.replace(/_/g, ' ')}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(limits).map(([role, limit]: [string, any]) => (
                              <div
                                key={role}
                                className="text-sm flex items-center justify-between"
                              >
                                <span className="text-muted-foreground capitalize">
                                  {role}:
                                </span>
                                <span className="font-medium">${limit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Deployment Tab */}
              <TabsContent value="deployment" className="space-y-4">
                {deploymentStatus[selectedStack.name]?.validation && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Validation Checks</CardTitle>
                      <CardDescription>
                        {deploymentStatus[selectedStack.name].validation.passed
                          ? '✅ All checks passed'
                          : '⚠️ Some checks failed'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {deploymentStatus[selectedStack.name].validation.checks.map(
                        (check, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center gap-2">
                              {check.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">{check.name}</span>
                            </div>
                            {check.message && (
                              <span className="text-xs text-muted-foreground">
                                {check.message}
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Crew Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Manager</p>
                        <Badge variant="default">{selectedStack.crew.manager}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Workers</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedStack.crew.workers.map((worker) => (
                            <Badge key={worker} variant="outline">
                              {worker}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a stack to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
