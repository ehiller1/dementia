/**
 * Executive Turn Renderer
 * Clean, scannable, deterministic presentation of TurnEnvelope
 * Order: Delta → Ack → Concepts → Memory → Plan → Ask → Decisions → Provenance
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import type { TurnEnvelope } from '@/presentation/types';

// Configurable limits (can be overridden via props or env)
const DEFAULT_LIMITS = {
  MAX_LIST: 5,
  MAX_TASKS: 5,
  MAX_ASKS_VISIBLE: 3,
  MAX_TAGS: 8,
  MAX_KEY_POINTS: 7,
  MAX_MEMORY_REFS: 5
};

interface ExecutiveTurnProps {
  turn: TurnEnvelope;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  limits?: Partial<typeof DEFAULT_LIMITS>;
}

export function ExecutiveTurn({ turn, onApprove, onReject, limits }: ExecutiveTurnProps) {
  const LIMITS = { ...DEFAULT_LIMITS, ...limits };
  const [provenanceFilter, setProvenanceFilter] = useState<{ runnerId?: string } | null>(null);
  
  return (
    <div className="space-y-4 max-w-4xl">
      {/* Delta */}
      {turn.delta?.hasChanges && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base">Changes since last turn</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {turn.delta.changes?.slice(0, 5).map((c, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{c.type}</span> → {c.field} <em>({c.action})</em>
                  {c.reason ? <> — {c.reason}</> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ack / Summary */}
      {turn.ack && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[15px] leading-6">{turn.ack}</p>
            {/* tags */}
            {!!turn.meta?.concepts?.tags?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {turn.meta.concepts.tags.slice(0, LIMITS.MAX_TAGS).map((t: string) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Concepts */}
      {turn.meta?.concepts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conceptualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <ConceptBlock title="Drivers" items={turn.meta.concepts.drivers} />
              <ConceptBlock title="Hypotheses" items={turn.meta.concepts.hypotheses} />
              <ConceptBlock title="Unknowns" items={turn.meta.concepts.unknowns} />
              <ConceptBlock title="Risks" items={turn.meta.concepts.risks} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory */}
      {turn.memory && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Institutional Memory</CardTitle>
            {turn.memory.confidence !== undefined && (
              <ConfidenceBadge value={turn.memory.confidence} />
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 divide-y">
              {(turn.memory.refs ?? []).slice(0, LIMITS.MAX_MEMORY_REFS).map(r => (
                <li key={r.id} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{r.title}</div>
                    {r.confidence !== undefined && <ConfidenceBadge value={r.confidence} />}
                  </div>
                  {r.snippet && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{r.snippet}</p>}
                  {r.why && <p className="text-xs text-gray-500 mt-1">Why relevant: {r.why}</p>}
                </li>
              ))}
            </ul>
            {turn.memory.pending && (
              <Button size="sm" className="mt-3" onClick={() => onApprove?.('search-memory')}>
                Approve Memory Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan */}
      {(turn.plan?.declarative?.length || turn.plan?.procedural?.length) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <TaskList 
                title="Knowledge (Declarative)" 
                tasks={turn.plan.declarative}
                onRunnerClick={(runnerId) => setProvenanceFilter({ runnerId })}
              />
              <TaskList 
                title="Actions (Procedural)" 
                tasks={turn.plan.procedural} 
                showService
                onRunnerClick={(runnerId) => setProvenanceFilter({ runnerId })}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Questions (Ask) */}
      {!!turn.ask?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Questions / Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {turn.ask.slice(0, LIMITS.MAX_ASKS_VISIBLE).map(q => (
                <li key={q.id} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-50">
                  <span className="text-[15px] leading-6">{q.text}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onApprove?.(q.id)}>
                      Yes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onReject?.(q.id)}>
                      No
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {turn.ask.length > LIMITS.MAX_ASKS_VISIBLE && (
              <ExpandableSection label={`Show ${turn.ask.length - LIMITS.MAX_ASKS_VISIBLE} more questions`}>
                <ul className="space-y-2 mt-2">
                  {turn.ask.slice(LIMITS.MAX_ASKS_VISIBLE).map(q => (
                    <li key={q.id} className="flex items-center justify-between gap-3 p-2">
                      <span className="text-sm">{q.text}</span>
                    </li>
                  ))}
                </ul>
              </ExpandableSection>
            )}
          </CardContent>
        </Card>
      )}

      {/* Decisions */}
      {!!turn.decisions?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {turn.decisions.map(d => (
                <li key={d.id} className="p-3 rounded-lg border bg-white">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{d.title}</div>
                    {d.priority && <PriorityBadge value={d.priority} />}
                  </div>
                  {d.rationale && <p className="text-sm text-gray-600 mt-1">{d.rationale}</p>}
                  {d.risk && <p className="text-xs text-amber-700 mt-1">⚠️ Risk: {d.risk}</p>}
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="default" onClick={() => onApprove?.(d.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onReject?.(d.id)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Provenance (artifacts accordion for code + agent assignments) */}
      {(!!turn.meta?.provenance?.artifacts?.length || !!turn.meta?.provenance?.assignments?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provenance & Artifacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Agent Assignments */}
            {!!turn.meta.provenance.assignments?.length && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Assignments (this turn)</h4>
                <AgentAssignmentsList 
                  assignments={turn.meta.provenance.assignments}
                  filter={provenanceFilter}
                />
              </div>
            )}
            
            {/* Code Artifacts */}
            {!!turn.meta.provenance.artifacts?.length && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Code Artifacts</h4>
                <ArtifactsAccordion artifacts={turn.meta.provenance.artifacts} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components

function ConceptBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="font-medium text-sm text-gray-700 mb-2">{title}</h4>
      <ul className="list-disc pl-5 space-y-1">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="text-sm text-gray-600 line-clamp-2">{item}</li>
        ))}
      </ul>
      {items.length > 5 && (
        <p className="text-xs text-gray-500 mt-1">+{items.length - 5} more</p>
      )}
    </div>
  );
}

function TaskList({ 
  title, 
  tasks, 
  showService,
  onRunnerClick 
}: { 
  title: string; 
  tasks?: any[]; 
  showService?: boolean;
  onRunnerClick?: (runnerId: string) => void;
}) {
  if (!tasks?.length) return null;
  return (
    <div>
      <h4 className="font-medium text-sm text-gray-700 mb-2">{title}</h4>
      <ul className="space-y-2">
        {tasks.slice(0, 5).map(task => (
          <li key={task.id} className="text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <StatusDot status={task.status} />
                <span className="line-clamp-1 flex-1">{task.title}</span>
              </div>
              
              {/* Runner badge */}
              {(task.runner || task.service) && (
                <span 
                  className="text-xs px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer flex-shrink-0"
                  title={`Runner: ${task.runner?.type ?? 'service'} • ${task.runner?.id ?? task.service ?? 'unknown'}`}
                  onClick={() => onRunnerClick?.(task.runner?.id ?? task.service)}
                >
                  {task.runner?.name ?? task.service ?? task.runner?.id ?? 'LLM'}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {tasks.length > 5 && (
        <p className="text-xs text-gray-500 mt-1">+{tasks.length - 5} more tasks</p>
      )}
    </div>
  );
}

function StatusDot({ status }: { status?: string }) {
  const colors = {
    completed: 'bg-green-500',
    in_progress: 'bg-blue-500',
    pending: 'bg-gray-400',
    failed: 'bg-red-500'
  };
  const color = colors[status as keyof typeof colors] || 'bg-gray-400';
  return <div className={`w-2 h-2 rounded-full ${color}`} />;
}

function ConfidenceBadge({ value }: { value: number }) {
  const percentage = Math.round(value * 100);
  const color = value >= 0.8 ? 'bg-green-100 text-green-800' : 
                value >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800';
  return (
    <Badge variant="secondary" className={`text-xs ${color}`}>
      {percentage}% confidence
    </Badge>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  const color = colors[value as keyof typeof colors] || colors.medium;
  return (
    <Badge variant="outline" className={`text-xs ${color}`}>
      {value.toUpperCase()}
    </Badge>
  );
}

function ExpandableSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="mt-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs"
      >
        {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
        {label}
      </Button>
      {isExpanded && children}
    </div>
  );
}

function AgentAssignmentsList({ 
  assignments, 
  filter 
}: { 
  assignments: any[]; 
  filter?: { runnerId?: string } | null;
}) {
  const visibleAssignments = assignments.filter(a => 
    !filter?.runnerId || a.runnerId === filter.runnerId
  );
  
  if (visibleAssignments.length === 0) {
    return <p className="text-sm text-gray-500">No assignments match the filter.</p>;
  }
  
  return (
    <ul className="space-y-2">
      {visibleAssignments.map((assignment, i) => {
        const duration = assignment.completedAt 
          ? ((assignment.completedAt - assignment.startedAt) / 1000).toFixed(1) + 's'
          : 'in progress';
        const time = new Date(assignment.startedAt).toLocaleTimeString();
        
        return (
          <li key={i} className="text-sm flex items-center justify-between p-2 rounded bg-gray-50">
            <div className="flex-1">
              <span className="font-medium">{assignment.taskId}</span>
              <span className="text-gray-600"> → </span>
              <span className="text-blue-600">{assignment.runnerId}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <StatusDot status={assignment.status} />
              <span>{assignment.status}</span>
              <span>•</span>
              <span>{time}</span>
              {assignment.completedAt && (
                <>
                  <span>•</span>
                  <span>{duration}</span>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ArtifactsAccordion({ artifacts }: { artifacts: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  return (
    <div className="space-y-2">
      {artifacts.map(artifact => (
        <div key={artifact.id} className="border rounded">
          <button
            className="w-full px-3 py-2 text-left text-sm font-medium flex items-center justify-between hover:bg-gray-50"
            onClick={() => setExpandedId(expandedId === artifact.id ? null : artifact.id)}
          >
            <span>{artifact.title}</span>
            {expandedId === artifact.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expandedId === artifact.id && artifact.content && (
            <div className="px-3 py-2 border-t bg-gray-50">
              <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                <code className={`language-${artifact.lang || 'text'}`}>{artifact.content}</code>
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
