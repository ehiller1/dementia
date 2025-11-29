/**
 * Decision Orchestrator Card Component
 * 
 * Displays cross-functional decision with option bundles (Plans A/B/C)
 * Optimized for decision inbox view
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  Package,
  Target,
  BarChart3
} from 'lucide-react';
import { DecisionLedgerEntry, OptionBundle } from '@/services/decision-ledger/types';

interface DecisionOrchestratorCardProps {
  decision: DecisionLedgerEntry;
  onApprove: (decisionId: string, optionId: string, rationale: string) => void;
  onDismiss?: (decisionId: string) => void;
}

export const DecisionOrchestratorCard: React.FC<DecisionOrchestratorCardProps> = ({
  decision,
  onApprove,
  onDismiss
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Extract incident signal
  const signal = decision.incident.signal;
  const deltaDemandPct = signal.deltaDemandPct;
  const isNegative = deltaDemandPct < 0;

  // Get recommended option (first one)
  const recommendedOption = decision.optionsConsidered[0];

  const handleApprove = () => {
    if (!selectedOption || !rationale.trim()) {
      alert('Please select an option and provide rationale');
      return;
    }
    onApprove(decision.id, selectedOption, rationale);
    setShowApprovalModal(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-5 h-5 ${isNegative ? 'text-red-500' : 'text-green-500'}`} />
              <h3 className="text-lg font-semibold text-gray-900">
                Cross-Functional Decision Required
              </h3>
              {decision.status === 'PENDING' && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Awaiting Approval
                </span>
              )}
            </div>
            
            {/* Signal Summary */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                  {isNegative ? '' : '+'}{(deltaDemandPct * 100).toFixed(1)}%
                </span>
                <span>demand shift</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                <span>{decision.contextPackIds.length} functions involved</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>{decision.optionsConsidered.length} options generated</span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Recommended Option Quick View */}
      {!expanded && recommendedOption && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-900 mb-1">
                {recommendedOption.label}
              </div>
              <div className="flex items-center gap-4 text-sm text-blue-700">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">
                    ${(recommendedOption.aggregatedExpectedDelta.grossProfit || 0).toLocaleString()}
                  </span>
                  <span className="text-blue-600">GP impact</span>
                </div>
                <div>
                  {recommendedOption.actions.length} coordinated actions
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedOption(recommendedOption.id);
                setShowApprovalModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Quick Approve
            </button>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div className="p-4">
          {/* Option Bundles Comparison */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Option Bundles ({decision.optionsConsidered.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {decision.optionsConsidered.map((option) => (
                <OptionBundleCard
                  key={option.id}
                  option={option}
                  isSelected={selectedOption === option.id}
                  onClick={() => setSelectedOption(option.id)}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Created {new Date(decision.audit.createdAt).toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              {onDismiss && (
                <button
                  onClick={() => onDismiss(decision.id)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Dismiss
                </button>
              )}
              <button
                onClick={() => setShowApprovalModal(true)}
                disabled={!selectedOption}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedOption
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Approve Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Approve Decision
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Option
                </label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    {decision.optionsConsidered.find(o => o.id === selectedOption)?.label}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Rationale *
                </label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why you chose this option..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!rationale.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    rationale.trim()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Option Bundle Card Component
 */
interface OptionBundleCardProps {
  option: OptionBundle;
  isSelected: boolean;
  onClick: () => void;
}

const OptionBundleCard: React.FC<OptionBundleCardProps> = ({
  option,
  isSelected,
  onClick
}) => {
  const delta = option.aggregatedExpectedDelta;
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-semibold text-gray-900">{option.label}</h5>
        {isSelected && (
          <Check className="w-5 h-5 text-blue-600" />
        )}
      </div>

      {/* KPI Deltas */}
      <div className="space-y-2 mb-3">
        <KPIBadge
          label="Gross Profit"
          value={delta.grossProfit || 0}
          format="currency"
        />
        <KPIBadge
          label="Revenue"
          value={delta.revenue || 0}
          format="currency"
        />
        <KPIBadge
          label="Units"
          value={delta.units || 0}
          format="number"
        />
        {delta.oosRiskPct !== undefined && (
          <KPIBadge
            label="OOS Risk"
            value={delta.oosRiskPct}
            format="percent"
            inverted
          />
        )}
      </div>

      {/* Actions Count */}
      <div className="text-xs text-gray-500">
        {option.actions.length} actions • Score: {option.objectiveScore?.toFixed(0)}
      </div>

      {/* Constraint Binders */}
      {option.constraintBinders.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
          <AlertTriangle className="w-3 h-3" />
          <span>{option.constraintBinders.length} constraint(s) tight</span>
        </div>
      )}
    </button>
  );
};

/**
 * KPI Badge Component
 */
interface KPIBadgeProps {
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  inverted?: boolean;
}

const KPIBadge: React.FC<KPIBadgeProps> = ({ label, value, format, inverted = false }) => {
  const isPositive = inverted ? value < 0 : value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

  let formattedValue = '';
  if (format === 'currency') {
    formattedValue = `$${Math.abs(value).toLocaleString()}`;
  } else if (format === 'percent') {
    formattedValue = `${(Math.abs(value) * 100).toFixed(1)}%`;
  } else {
    formattedValue = Math.abs(value).toLocaleString();
  }

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600">{label}</span>
      <div className={`flex items-center gap-1 font-semibold ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span>{value >= 0 ? '+' : '-'}{formattedValue}</span>
      </div>
    </div>
  );
};
