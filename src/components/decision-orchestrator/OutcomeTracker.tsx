/**
 * Outcome Tracker Component
 * 
 * Tracks and visualizes decision outcomes vs projections
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  DollarSign,
  Package,
  AlertCircle
} from 'lucide-react';

interface Outcome {
  id: string;
  measuredAt: string;
  actual: {
    units?: number;
    revenue?: number;
    grossProfit?: number;
    marginPct?: number;
    oosRiskPct?: number;
  };
  attributionNotes?: string;
}

interface OutcomeVariance {
  revenue_variance_pct: number;
  units_variance_pct: number;
  gross_profit_variance_pct: number;
  margin_variance_pct: number;
  measurement_count: number;
  avg_confidence_pct?: number;
  latest_measured_at?: string;
}

interface OutcomeTrackerProps {
  decisionId: string;
  projectedDelta: {
    grossProfit?: number;
    revenue?: number;
    units?: number;
    marginPct?: number;
    oosRiskPct?: number;
  };
}

export const OutcomeTracker: React.FC<OutcomeTrackerProps> = ({
  decisionId,
  projectedDelta
}) => {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [variance, setVariance] = useState<OutcomeVariance | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOutcomes = async () => {
    setLoading(true);
    try {
      // Fetch outcomes from decision summary
      const summaryResponse = await fetch(`/api/decisions/${decisionId}/summary`);
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        setOutcomes(summary.outcomes || []);
      }

      // Fetch variance
      const varianceResponse = await fetch(`/api/decisions/${decisionId}/variance`);
      if (varianceResponse.ok) {
        const varianceData = await varianceResponse.json();
        setVariance(varianceData);
      }
    } catch (error) {
      console.error('[OutcomeTracker] Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();
  }, [decisionId]);

  if (loading && outcomes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading outcome data...
      </div>
    );
  }

  if (outcomes.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">No outcome measurements yet</span>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          Outcomes will be recorded after decision execution completes
        </p>
      </div>
    );
  }

  const latestOutcome = outcomes[outcomes.length - 1];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Outcome Performance
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{outcomes.length} measurement{outcomes.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Variance Summary */}
      {variance && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Variance vs Projection
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VarianceMetric
              label="Gross Profit"
              variance={variance.gross_profit_variance_pct}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <VarianceMetric
              label="Revenue"
              variance={variance.revenue_variance_pct}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <VarianceMetric
              label="Units"
              variance={variance.units_variance_pct}
              icon={<Package className="w-4 h-4" />}
            />
            <VarianceMetric
              label="Margin"
              variance={variance.margin_variance_pct}
              icon={<Target className="w-4 h-4" />}
            />
          </div>
        </div>
      )}

      {/* Latest Outcome */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Latest Measurement
          </h4>
          <span className="text-xs text-gray-500">
            {new Date(latestOutcome.measuredAt).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {latestOutcome.actual.grossProfit !== undefined && (
            <OutcomeMetric
              label="Gross Profit"
              actual={latestOutcome.actual.grossProfit}
              projected={projectedDelta.grossProfit || 0}
              format="currency"
            />
          )}
          {latestOutcome.actual.revenue !== undefined && (
            <OutcomeMetric
              label="Revenue"
              actual={latestOutcome.actual.revenue}
              projected={projectedDelta.revenue || 0}
              format="currency"
            />
          )}
          {latestOutcome.actual.units !== undefined && (
            <OutcomeMetric
              label="Units"
              actual={latestOutcome.actual.units}
              projected={projectedDelta.units || 0}
              format="number"
            />
          )}
          {latestOutcome.actual.marginPct !== undefined && (
            <OutcomeMetric
              label="Margin"
              actual={latestOutcome.actual.marginPct}
              projected={projectedDelta.marginPct || 0}
              format="percent"
            />
          )}
        </div>

        {latestOutcome.attributionNotes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Attribution Notes
            </div>
            <div className="text-sm text-gray-600">
              {latestOutcome.attributionNotes}
            </div>
          </div>
        )}
      </div>

      {/* Outcome History */}
      {outcomes.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Measurement History
          </h4>
          <div className="space-y-2">
            {outcomes.slice().reverse().map((outcome, index) => (
              <div
                key={outcome.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500 w-32">
                    {new Date(outcome.measuredAt).toLocaleString()}
                  </div>
                  {outcome.actual.grossProfit !== undefined && (
                    <div className="text-sm text-gray-900">
                      GP: ${outcome.actual.grossProfit.toLocaleString()}
                    </div>
                  )}
                </div>
                {index === 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    Latest
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Variance Metric Component
 */
interface VarianceMetricProps {
  label: string;
  variance: number;
  icon: React.ReactNode;
}

const VarianceMetric: React.FC<VarianceMetricProps> = ({ label, variance, icon }) => {
  const isPositive = variance > 0;
  const isSignificant = Math.abs(variance) > 5; // >5% variance is significant

  return (
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`text-sm font-semibold flex items-center gap-1 ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>
            {isPositive ? '+' : ''}{variance.toFixed(1)}%
          </span>
          {isSignificant && (
            <AlertCircle className="w-3 h-3 text-orange-500" />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Outcome Metric Component
 */
interface OutcomeMetricProps {
  label: string;
  actual: number;
  projected: number;
  format: 'currency' | 'number' | 'percent';
}

const OutcomeMetric: React.FC<OutcomeMetricProps> = ({
  label,
  actual,
  projected,
  format
}) => {
  const variance = projected !== 0 ? ((actual - projected) / Math.abs(projected)) * 100 : 0;
  const isPositive = actual >= projected;

  let formattedActual = '';
  let formattedProjected = '';

  if (format === 'currency') {
    formattedActual = `$${actual.toLocaleString()}`;
    formattedProjected = `$${projected.toLocaleString()}`;
  } else if (format === 'percent') {
    formattedActual = `${(actual * 100).toFixed(1)}%`;
    formattedProjected = `${(projected * 100).toFixed(1)}%`;
  } else {
    formattedActual = actual.toLocaleString();
    formattedProjected = projected.toLocaleString();
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-lg font-semibold text-gray-900">
          {formattedActual}
        </div>
        <div className="text-xs text-gray-500">
          vs {formattedProjected}
        </div>
      </div>
      <div className={`text-xs font-medium mt-1 flex items-center gap-1 ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>
          {isPositive ? '+' : ''}{variance.toFixed(1)}% variance
        </span>
      </div>
    </div>
  );
};
