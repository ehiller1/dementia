/**
 * Action Primitive Builder Component
 * 
 * Interactive builder for creating and editing action primitives
 */

import React, { useState } from 'react';
import {
  Plus,
  X,
  Save,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';

interface ActionPrimitive {
  id: string;
  functionName: 'PRICING' | 'MARKETING' | 'INVENTORY_OPS' | 'FINANCE';
  type: string;
  payload: Record<string, any>;
  expectedDelta: {
    grossProfit?: number;
    revenue?: number;
    units?: number;
    marginPct?: number;
    oosRiskPct?: number;
  };
  resourceUsage: {
    BUDGET?: number;
    DC_SLOT?: number;
    LABOR_HOURS?: number;
  };
  rollbackable: boolean;
  prerequisites?: string[];
}

interface ActionPrimitiveBuilderProps {
  onSave: (action: ActionPrimitive) => void;
  onCancel: () => void;
  initialAction?: ActionPrimitive;
}

export const ActionPrimitiveBuilder: React.FC<ActionPrimitiveBuilderProps> = ({
  onSave,
  onCancel,
  initialAction
}) => {
  const [action, setAction] = useState<Partial<ActionPrimitive>>(
    initialAction || {
      functionName: 'PRICING',
      type: '',
      payload: {},
      expectedDelta: {},
      resourceUsage: {},
      rollbackable: true,
      prerequisites: []
    }
  );

  const [payloadFields, setPayloadFields] = useState<Array<{ key: string; value: string }>>(
    initialAction ? Object.entries(initialAction.payload).map(([k, v]) => ({ key: k, value: String(v) })) : []
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSave = () => {
    const errors: string[] = [];

    if (!action.functionName) errors.push('Function name is required');
    if (!action.type) errors.push('Action type is required');
    if (payloadFields.length === 0) errors.push('At least one payload field is required');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Convert payload fields to object
    const payload: Record<string, any> = {};
    payloadFields.forEach(({ key, value }) => {
      if (key) {
        // Try to parse as number if possible
        const numValue = parseFloat(value);
        payload[key] = isNaN(numValue) ? value : numValue;
      }
    });

    const finalAction: ActionPrimitive = {
      id: initialAction?.id || `action-${Date.now()}`,
      functionName: action.functionName!,
      type: action.type!,
      payload,
      expectedDelta: action.expectedDelta || {},
      resourceUsage: action.resourceUsage || {},
      rollbackable: action.rollbackable !== undefined ? action.rollbackable : true,
      prerequisites: action.prerequisites || []
    };

    onSave(finalAction);
  };

  const addPayloadField = () => {
    setPayloadFields([...payloadFields, { key: '', value: '' }]);
  };

  const removePayloadField = (index: number) => {
    setPayloadFields(payloadFields.filter((_, i) => i !== index));
  };

  const updatePayloadField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...payloadFields];
    updated[index][field] = value;
    setPayloadFields(updated);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">
          {initialAction ? 'Edit Action Primitive' : 'Create Action Primitive'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Validation Errors</span>
          </div>
          <ul className="text-sm text-red-600 space-y-1 ml-7">
            {validationErrors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Basic Information
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Function Name *
            </label>
            <select
              value={action.functionName}
              onChange={(e) => setAction({ ...action, functionName: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PRICING">PRICING</option>
              <option value="MARKETING">MARKETING</option>
              <option value="INVENTORY_OPS">INVENTORY_OPS</option>
              <option value="FINANCE">FINANCE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type *
            </label>
            <input
              type="text"
              value={action.type || ''}
              onChange={(e) => setAction({ ...action, type: e.target.value })}
              placeholder="e.g., price_change, budget_allocation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rollbackable"
            checked={action.rollbackable}
            onChange={(e) => setAction({ ...action, rollbackable: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="rollbackable" className="text-sm text-gray-700">
            Action is rollbackable
          </label>
        </div>
      </div>

      {/* Payload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Payload *
          </h4>
          <button
            onClick={addPayloadField}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        <div className="space-y-2">
          {payloadFields.map((field, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={field.key}
                onChange={(e) => updatePayloadField(index, 'key', e.target.value)}
                placeholder="Key"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={field.value}
                onChange={(e) => updatePayloadField(index, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removePayloadField(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {payloadFields.length === 0 && (
            <div className="text-sm text-gray-500 italic text-center py-4 border border-dashed border-gray-300 rounded-lg">
              No payload fields yet. Click "Add Field" to add parameters.
            </div>
          )}
        </div>
      </div>

      {/* Expected Delta */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Expected Delta
        </h4>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gross Profit ($)
            </label>
            <input
              type="number"
              value={action.expectedDelta?.grossProfit || ''}
              onChange={(e) => setAction({
                ...action,
                expectedDelta: {
                  ...action.expectedDelta,
                  grossProfit: parseFloat(e.target.value) || undefined
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Revenue ($)
            </label>
            <input
              type="number"
              value={action.expectedDelta?.revenue || ''}
              onChange={(e) => setAction({
                ...action,
                expectedDelta: {
                  ...action.expectedDelta,
                  revenue: parseFloat(e.target.value) || undefined
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Units
            </label>
            <input
              type="number"
              value={action.expectedDelta?.units || ''}
              onChange={(e) => setAction({
                ...action,
                expectedDelta: {
                  ...action.expectedDelta,
                  units: parseFloat(e.target.value) || undefined
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Resource Usage
        </h4>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget ($)
            </label>
            <input
              type="number"
              value={action.resourceUsage?.BUDGET || ''}
              onChange={(e) => setAction({
                ...action,
                resourceUsage: {
                  ...action.resourceUsage,
                  BUDGET: parseFloat(e.target.value) || undefined
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DC Slots
            </label>
            <input
              type="number"
              value={action.resourceUsage?.DC_SLOT || ''}
              onChange={(e) => setAction({
                ...action,
                resourceUsage: {
                  ...action.resourceUsage,
                  DC_SLOT: parseFloat(e.target.value) || undefined
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labor Hours
            </label>
            <input
              type="number"
              value={action.resourceUsage?.LABOR_HOURS || ''}
              onChange={(e) => setAction({
                ...action,
                resourceUsage: {
                  ...action.resourceUsage,
                  LABOR_HOURS: parseFloat(e.target.value) || undefined
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Action
        </button>
      </div>
    </div>
  );
};

/**
 * Action Primitive List Component
 */
export const ActionPrimitiveList: React.FC<{
  actions: ActionPrimitive[];
  onEdit: (action: ActionPrimitive) => void;
  onDelete: (actionId: string) => void;
}> = ({ actions, onEdit, onDelete }) => {
  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <div
          key={action.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  {action.functionName}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {action.type}
                </span>
                {action.rollbackable && (
                  <CheckCircle className="w-4 h-4 text-green-500" title="Rollbackable" />
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                {action.expectedDelta.grossProfit && (
                  <div>
                    GP: ${action.expectedDelta.grossProfit.toLocaleString()}
                  </div>
                )}
                {action.resourceUsage.BUDGET && (
                  <div>
                    Budget: ${action.resourceUsage.BUDGET.toLocaleString()}
                  </div>
                )}
                <div>
                  {Object.keys(action.payload).length} param{Object.keys(action.payload).length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(action)}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(action.id)}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {actions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No action primitives yet</p>
          <p className="text-sm mt-1">Create your first action to get started</p>
        </div>
      )}
    </div>
  );
};
