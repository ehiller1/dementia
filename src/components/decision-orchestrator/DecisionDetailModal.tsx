/**
 * Decision Detail Modal Component
 * 
 * Comprehensive view of decision with all details
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Package,
  TrendingUp,
  Target,
  FileText
} from 'lucide-react';
import { DecisionLedgerEntry } from '@/services/decision-ledger/types';
import { ExecutionMonitor } from './ExecutionMonitor';
import { OutcomeTracker } from './OutcomeTracker';

interface DecisionDetailModalProps {
  decision: DecisionLedgerEntry;
  onClose: () => void;
}

export const DecisionDetailModal: React.FC<DecisionDetailModalProps> = ({
  decision,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'options' | 'context' | 'execution' | 'outcomes'>('overview');
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [expandedContext, setExpandedContext] = useState<string | null>(null);

  const chosenOption = decision.approval?.chosenOptionId
    ? decision.optionsConsidered.find(opt => opt.id === decision.approval?.chosenOptionId)
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Decision Details</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(decision.audit.createdAt).toLocaleString()}</span>
              </div>
              <span>•</span>
              <StatusBadge status={decision.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <TabButton
            label="Overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            label={`Options (${decision.optionsConsidered.length})`}
            active={activeTab === 'options'}
            onClick={() => setActiveTab('options')}
          />
          <TabButton
            label={`Context (${decision.contextPackIds.length})`}
            active={activeTab === 'context'}
            onClick={() => setActiveTab('context')}
          />
          {decision.status !== 'PENDING' && (
            <>
              <TabButton
                label="Execution"
                active={activeTab === 'execution'}
                onClick={() => setActiveTab('execution')}
              />
              <TabButton
                label="Outcomes"
                active={activeTab === 'outcomes'}
                onClick={() => setActiveTab('outcomes')}
              />
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab decision={decision} chosenOption={chosenOption} />
          )}
          {activeTab === 'options' && (
            <OptionsTab
              decision={decision}
              expandedOption={expandedOption}
              setExpandedOption={setExpandedOption}
            />
          )}
          {activeTab === 'context' && (
            <ContextTab
              decision={decision}
              expandedContext={expandedContext}
              setExpandedContext={setExpandedContext}
            />
          )}
          {activeTab === 'execution' && (
            <ExecutionTab decisionId={decision.id} />
          )}
          {activeTab === 'outcomes' && (
            <OutcomesTab
              decisionId={decision.id}
              projectedDelta={chosenOption?.aggregatedExpectedDelta || {}}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Overview Tab
 */
const OverviewTab: React.FC<{
  decision: DecisionLedgerEntry;
  chosenOption: any;
}> = ({ decision, chosenOption }) => {
  return (
    <div className="space-y-6">
      {/* Incident Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Incident</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Scope" value={JSON.stringify(decision.incident.scope, null, 2)} />
            <InfoItem label="Signal" value={JSON.stringify(decision.incident.signal, null, 2)} />
          </div>
        </div>
      </div>

      {/* Chosen Option (if approved) */}
      {chosenOption && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Chosen Option</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-900">{chosenOption.label}</h4>
              <span className="text-sm text-blue-700">
                Score: {chosenOption.objectiveScore?.toFixed(0)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <KPICard
                label="Gross Profit"
                value={chosenOption.aggregatedExpectedDelta.grossProfit || 0}
                format="currency"
              />
              <KPICard
                label="Revenue"
                value={chosenOption.aggregatedExpectedDelta.revenue || 0}
                format="currency"
              />
              <KPICard
                label="Units"
                value={chosenOption.aggregatedExpectedDelta.units || 0}
                format="number"
              />
              <KPICard
                label="Margin"
                value={chosenOption.aggregatedExpectedDelta.marginPct || 0}
                format="percent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Approval Details */}
      {decision.approval && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Approval</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">
                {decision.approval.approver.name}
              </span>
              <span className="text-sm text-green-700">
                ({decision.approval.approver.role})
              </span>
            </div>
            <div className="text-sm text-green-700 mb-2">
              Approved: {new Date(decision.approval.approvedAt).toLocaleString()}
            </div>
            {decision.approval.rationale && (
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                <div className="text-xs font-medium text-green-700 mb-1">Rationale</div>
                <div className="text-sm text-gray-700">{decision.approval.rationale}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
        <div className="space-y-2">
          <TimelineItem
            icon={<Calendar className="w-4 h-4" />}
            label="Created"
            time={decision.audit.createdAt}
            color="gray"
          />
          {decision.audit.updatedAt && (
            <TimelineItem
              icon={<Clock className="w-4 h-4" />}
              label="Updated"
              time={decision.audit.updatedAt}
              color="blue"
            />
          )}
          {decision.approval && (
            <TimelineItem
              icon={<CheckCircle className="w-4 h-4" />}
              label="Approved"
              time={decision.approval.approvedAt}
              color="green"
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Options Tab
 */
const OptionsTab: React.FC<{
  decision: DecisionLedgerEntry;
  expandedOption: string | null;
  setExpandedOption: (id: string | null) => void;
}> = ({ decision, expandedOption, setExpandedOption }) => {
  return (
    <div className="space-y-3">
      {decision.optionsConsidered.map((option) => (
        <div key={option.id} className="border border-gray-200 rounded-lg">
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedOption(expandedOption === option.id ? null : option.id)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">{option.label}</h4>
                {decision.approval?.chosenOptionId === option.id && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Chosen
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{option.actions.length} actions</span>
                <span>Score: {option.objectiveScore?.toFixed(0)}</span>
                {option.constraintBinders.length > 0 && (
                  <span className="text-orange-600">
                    {option.constraintBinders.length} constraint(s) tight
                  </span>
                )}
              </div>
            </div>
            {expandedOption === option.id ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedOption === option.id && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="grid grid-cols-4 gap-3 my-4">
                <KPICard
                  label="Gross Profit"
                  value={option.aggregatedExpectedDelta.grossProfit || 0}
                  format="currency"
                />
                <KPICard
                  label="Revenue"
                  value={option.aggregatedExpectedDelta.revenue || 0}
                  format="currency"
                />
                <KPICard
                  label="Units"
                  value={option.aggregatedExpectedDelta.units || 0}
                  format="number"
                />
                <KPICard
                  label="OOS Risk"
                  value={option.aggregatedExpectedDelta.oosRiskPct || 0}
                  format="percent"
                />
              </div>

              <h5 className="text-sm font-semibold text-gray-700 mb-2">Actions</h5>
              <div className="space-y-2">
                {option.actions.map((action, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                    <div className="font-medium text-gray-900">
                      {action.functionName} • {action.type}
                    </div>
                    <div className="text-gray-600 mt-1">
                      GP: ${(action.expectedDelta.grossProfit || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Context Tab
 */
const ContextTab: React.FC<{
  decision: DecisionLedgerEntry;
  expandedContext: string | null;
  setExpandedContext: (id: string | null) => void;
}> = ({ decision, expandedContext, setExpandedContext }) => {
  return (
    <div className="space-y-3">
      {decision.contextPackIds.map((packId) => (
        <div key={packId} className="border border-gray-200 rounded-lg">
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedContext(expandedContext === packId ? null : packId)}
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Context Pack: {packId}</h4>
              <p className="text-sm text-gray-500 mt-1">Click to view details</p>
            </div>
            {expandedContext === packId ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedContext === packId && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mt-3">
                Context pack details would be loaded from API here.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Execution Tab
 */
const ExecutionTab: React.FC<{ decisionId: string }> = ({ decisionId }) => {
  return <ExecutionMonitor decisionId={decisionId} autoRefresh={true} />;
};

/**
 * Outcomes Tab
 */
const OutcomesTab: React.FC<{
  decisionId: string;
  projectedDelta: any;
}> = ({ decisionId, projectedDelta }) => {
  return <OutcomeTracker decisionId={decisionId} projectedDelta={projectedDelta} />;
};

/**
 * Helper Components
 */
const TabButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium text-sm transition-colors ${
        active
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    EXECUTED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-900 font-mono text-xs whitespace-pre-wrap">{value}</div>
    </div>
  );
};

const KPICard: React.FC<{
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
}> = ({ label, value, format }) => {
  let formatted = '';
  if (format === 'currency') {
    formatted = `$${Math.abs(value).toLocaleString()}`;
  } else if (format === 'percent') {
    formatted = `${(Math.abs(value) * 100).toFixed(1)}%`;
  } else {
    formatted = Math.abs(value).toLocaleString();
  }

  return (
    <div className="p-3 bg-white rounded border border-gray-200">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900">
        {value >= 0 ? '+' : '-'}{formatted}
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  time: string;
  color: 'gray' | 'blue' | 'green';
}> = ({ icon, label, time, color }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{new Date(time).toLocaleString()}</div>
      </div>
    </div>
  );
};
