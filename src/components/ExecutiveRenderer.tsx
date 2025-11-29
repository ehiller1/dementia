// src/components/ExecutiveRenderer.tsx
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, Users, TrendingUp, Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import type { CanonicalWire } from '../schema/canonical';
import type { ValidationResult } from '../schema/validation';
import { validateCanonical } from "../schema/validation";
import { daysUntil, humanLabel } from "../schema/date-utils";

type Props = { data: unknown; todayISO?: string };

export const ExecutiveRenderer: React.FC<Props> = ({ data, todayISO }) => {
  const [currentMessage, setCurrentMessage] = useState(1);
  const result = validateCanonical(data);

  if (!result.success) {
    return (
      <div className="p-4 border border-red-300 rounded">
        <h3 className="font-semibold text-red-700">
          {result.executiveSummary || "System issue: Missing structured data. Showing fallback analysis."}
        </h3>
        {result.issues.filter(i => i.severity === 'error').length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-gray-600">Technical details</summary>
            <ul className="list-disc ml-5 mt-2 text-xs">
              {result.issues.map((i, idx) => (
                <li key={idx} className={i.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                  <code>{i.field}</code>: {i.message}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }

  const wire = result.data!;
  const totalMessages = 6;
  
  const getBadgeColor = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'red': return 'bg-red-100 text-red-800';
      case 'blue': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const renderMessage = (messageNum: number) => {
    switch (messageNum) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Role: <span className="font-medium">{wire.roleDetection}</span> • 
                  Template: <span className="font-medium">{wire.templateSnapline}</span>
                </p>
                <div className="space-y-1">
                  {wire.executiveSummary.length > 0 ? (
                    wire.executiveSummary.map((item, idx) => (
                      <p key={idx} className="text-sm">{truncateText(item)}</p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Not specified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
        
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {wire.badges && wire.badges.length > 0 ? (
                    wire.badges.map((badge, idx) => (
                      <Badge key={idx} className={getBadgeColor(badge.color)}>
                        {badge.label}: {badge.value}
                      </Badge>
                    ))
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600">Quality indicators not specified</Badge>
                  )}
                </div>
                <ul className="space-y-1">
                  {wire.whatImSeeing.length > 0 ? (
                    wire.whatImSeeing.map((insight, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {truncateText(insight)}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">Not specified</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        );
        
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ul className="space-y-2">
                  {wire.recommendation.length > 0 ? (
                    wire.recommendation.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-1">→</span>
                        {truncateText(rec)}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">Not specified</li>
                  )}
                </ul>
                {wire.cta && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900">{wire.cta.label}</h5>
                    <p className="text-sm text-blue-700 mt-1">{wire.cta.action}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {wire.nextActions.length > 0 ? (
                  wire.nextActions.map((action, idx) => {
                    const days = action.deadline ? daysUntil(action.deadline, todayISO) : null;
                    const isOverdue = days !== null && days < 0;
                    const isUrgent = days !== null && days <= 3 && days >= 0;
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{truncateText(action.action, 150)}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                            {action.owner && action.owner !== "Not assigned" && (
                              <span>Owner: {action.owner}</span>
                            )}
                            {action.department && action.department !== "Not specified" && (
                              <span>• {action.department}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {action.deadline && action.deadline !== "" ? (
                            <div className={`text-xs px-2 py-1 rounded ${
                              isOverdue ? 'bg-red-100 text-red-700' : 
                              isUrgent ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {humanLabel(action.deadline, todayISO)}
                              {days !== null && (
                                <div className="text-xs mt-1">
                                  {days === 0 ? 'Today' : days > 0 ? `${days}d` : `${Math.abs(days)}d overdue`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No deadline</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">Not specified</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cross-functional Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.keys(wire.crossFunctionalImpact).length > 0 ? (
                  Object.entries(wire.crossFunctionalImpact).map(([dept, impact]) => (
                    <div key={dept} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium text-sm">{impact.department}</span>
                        <p className="text-xs text-gray-600 mt-1">{truncateText(impact.impact, 120)}</p>
                      </div>
                      <Badge className={
                        impact.level === 'high' ? 'bg-red-100 text-red-800' :
                        impact.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {impact.level}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Not specified</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Source & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wire.agentMarketplaceResults.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Agent Executions</h5>
                    <div className="space-y-1">
                      {wire.agentMarketplaceResults.map((result, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                            {result.success ? '✓' : '✗'}
                          </span>
                          <span>{result.agentId}</span>
                          {result.confidence && (
                            <Badge className="bg-gray-100 text-gray-600">
                              {Math.round(result.confidence * 100)}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {wire.timeline.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Timeline</h5>
                    <div className="space-y-1">
                      {wire.timeline.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">•</span>
                          <span className="font-mono">{humanLabel(event.date, todayISO)}</span>
                          <span>{event.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {wire.agentMarketplaceResults.length === 0 && wire.timeline.length === 0 && (
                  <p className="text-sm text-gray-500">Not specified</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progressive Disclosure Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Executive Analysis</span>
          <Badge className="bg-blue-100 text-blue-800">
            Message {currentMessage} of {totalMessages}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {currentMessage > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentMessage(currentMessage - 1)}
            >
              Previous
            </Button>
          )}
          {currentMessage < totalMessages && (
            <Button 
              size="sm"
              onClick={() => setCurrentMessage(currentMessage + 1)}
              className="flex items-center gap-1"
            >
              {currentMessage === 1 ? 'Show Details' : 'Next'}
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
          {currentMessage === totalMessages && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentMessage(1)}
            >
              Back to Summary
            </Button>
          )}
        </div>
      </div>
      
      {/* Current Message */}
      {renderMessage(currentMessage)}
      
      {/* Quality Issues Warning */}
      {result.issues.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <details>
            <summary className="cursor-pointer text-sm font-medium text-yellow-800">
              Data Quality Notice ({result.issues.filter(i => i.severity !== 'error').length} recommendations)
            </summary>
            <ul className="mt-2 space-y-1">
              {result.issues.filter(i => i.severity !== 'error').map((issue, idx) => (
                <li key={idx} className="text-xs text-yellow-700">
                  <strong>{issue.field}:</strong> {issue.message}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
};
