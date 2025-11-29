import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowRight, TrendingUp, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface CrossFunctionalDecision {
  id: string;
  sourceFunctionalArea: string;
  targetFunctionalArea: string;
  decisionTitle: string;
  decisionDescription?: string;
  recommendedAction: string;
  likelyAction: string;
  confidenceScore: number;
  businessImpact?: string;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  marketing: 'from-purple-500 to-pink-500',
  inventory: 'from-blue-500 to-cyan-500',
  supply_chain: 'from-green-500 to-emerald-500',
  finance: 'from-yellow-500 to-orange-500',
  sales: 'from-red-500 to-rose-500',
  operations: 'from-indigo-500 to-blue-500',
  product: 'from-violet-500 to-purple-500',
};

const ROLE_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  inventory: 'Inventory',
  supply_chain: 'Supply Chain',
  finance: 'Finance',
  sales: 'Sales',
  operations: 'Operations',
  product: 'Product',
};

export const CrossFunctionalDecisionCard: React.FC = () => {
  const [decisions, setDecisions] = useState<CrossFunctionalDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('marketing');

  useEffect(() => {
    // Fetch user's functional role and decisions
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchDecisions();
    }
  }, [userRole]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.functional_role || 'marketing');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cross-functional-decisions?role=${userRole}`);
      if (response.ok) {
        const data = await response.json();
        setDecisions(data.decisions || []);
      }
    } catch (error) {
      console.error('Error fetching cross-functional decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cross-functional-decisions/refresh?role=${userRole}`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setDecisions(data.decisions || []);
      }
    } catch (error) {
      console.error('Error refreshing decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlignmentStatus = (decision: CrossFunctionalDecision) => {
    const recommended = decision.recommendedAction.toLowerCase();
    const likely = decision.likelyAction.toLowerCase();
    
    if (recommended === likely) {
      return { status: 'aligned', icon: TrendingUp, color: 'text-green-600' };
    }
    return { status: 'misaligned', icon: AlertTriangle, color: 'text-amber-600' };
  };

  if (decisions.length === 0 && !loading) {
    return null; // Don't show card if no decisions
  }

  return (
    <Card className="border-violet-200 bg-white/95 backdrop-blur shadow-xl">
      <CardHeader className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowRight className="h-5 w-5" />
              Cross-Functional Insights
            </CardTitle>
            <CardDescription className="text-violet-100">
              Decisions from {ROLE_LABELS[userRole] || userRole} perspective
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 max-h-[600px] overflow-y-auto">
        {loading && decisions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading insights...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((decision) => {
              const alignment = getAlignmentStatus(decision);
              const isExpanded = expanded === decision.id;
              const AlignmentIcon = alignment.icon;

              return (
                <div
                  key={decision.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-violet-300 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`bg-gradient-to-r ${ROLE_COLORS[decision.sourceFunctionalArea] || 'from-gray-400 to-gray-500'} text-white text-xs`}>
                          {ROLE_LABELS[decision.sourceFunctionalArea] || decision.sourceFunctionalArea}
                        </Badge>
                        <AlignmentIcon className={`h-4 w-4 ${alignment.color}`} />
                        <span className="text-xs text-gray-500">
                          {Math.round(decision.confidenceScore * 100)}% confidence
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900">
                        {decision.decisionTitle}
                      </h4>
                      {decision.decisionDescription && (
                        <p className="text-xs text-gray-600 mt-1">
                          {decision.decisionDescription}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(isExpanded ? null : decision.id)}
                      className="ml-2"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3 border-t pt-3">
                      {/* Recommended Action */}
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="text-xs font-medium text-green-800 mb-1">
                          ✓ Recommended Action
                        </div>
                        <p className="text-sm text-green-900">
                          {decision.recommendedAction}
                        </p>
                      </div>

                      {/* Likely Action */}
                      <div className={`${
                        alignment.status === 'aligned' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-amber-50 border-amber-200'
                      } border rounded p-2`}>
                        <div className={`text-xs font-medium mb-1 ${
                          alignment.status === 'aligned' ? 'text-green-800' : 'text-amber-800'
                        }`}>
                          {alignment.status === 'aligned' ? '✓' : '⚠'} Likely Action
                        </div>
                        <p className={`text-sm ${
                          alignment.status === 'aligned' ? 'text-green-900' : 'text-amber-900'
                        }`}>
                          {decision.likelyAction}
                        </p>
                      </div>

                      {/* Business Impact */}
                      {decision.businessImpact && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="text-xs font-medium text-blue-800 mb-1">
                            📊 Business Impact
                          </div>
                          <p className="text-sm text-blue-900">
                            {decision.businessImpact}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          Coordinate
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          View Details
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrossFunctionalDecisionCard;
