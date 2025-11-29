/**
 * Distribution Picker Component
 * For selecting and configuring probability distributions
 */

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface DistributionPickerProps {
  parameter: {
    name: string;
    display_name: string;
    constraints: {
      distributions?: string[];
    };
  };
  value: {
    distribution: string;
    mean?: number;
    std_dev?: number;
    min?: number;
    max?: number;
  };
  onChange: (value: any) => void;
  isChanged?: boolean;
}

export const DistributionPicker: React.FC<DistributionPickerProps> = ({
  parameter,
  value,
  onChange,
  isChanged = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const availableDistributions = parameter.constraints.distributions || [
    'normal',
    'lognormal',
    'uniform'
  ];

  const handleDistributionChange = (distribution: string) => {
    onChange({
      ...value,
      distribution
    });
  };

  const handleParamChange = (paramName: string, paramValue: number) => {
    onChange({
      ...value,
      [paramName]: paramValue
    });
  };

  return (
    <div className={`space-y-3 p-3 border rounded-lg ${
      isChanged ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Distribution Type Selector */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-purple-600" />
        <select
          value={value.distribution}
          onChange={(e) => handleDistributionChange(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {availableDistributions.map(dist => (
            <option key={dist} value={dist}>
              {dist.charAt(0).toUpperCase() + dist.slice(1)} Distribution
            </option>
          ))}
        </select>
      </div>

      {/* Distribution Parameters */}
      {(value.distribution === 'normal' || value.distribution === 'lognormal') && (
        <div className="space-y-2 pl-6">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20">Mean (μ):</label>
            <input
              type="number"
              step="0.01"
              value={value.mean || 0}
              onChange={(e) => handleParamChange('mean', parseFloat(e.target.value))}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20">Std Dev (σ):</label>
            <input
              type="number"
              step="0.01"
              value={value.std_dev || 0}
              onChange={(e) => handleParamChange('std_dev', parseFloat(e.target.value))}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {value.distribution === 'uniform' && (
        <div className="space-y-2 pl-6">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20">Min:</label>
            <input
              type="number"
              step="0.01"
              value={value.min || 0}
              onChange={(e) => handleParamChange('min', parseFloat(e.target.value))}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20">Max:</label>
            <input
              type="number"
              step="0.01"
              value={value.max || 1}
              onChange={(e) => handleParamChange('max', parseFloat(e.target.value))}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Visual Preview */}
      <div className="h-12 bg-white rounded border border-gray-200 flex items-end justify-center gap-0.5 p-2">
        {Array.from({ length: 20 }).map((_, i) => {
          let height;
          if (value.distribution === 'normal' || value.distribution === 'lognormal') {
            // Bell curve approximation
            const x = (i - 10) / 3;
            height = Math.exp(-0.5 * x * x) * 100;
          } else if (value.distribution === 'uniform') {
            height = 80;
          } else {
            height = Math.random() * 100;
          }
          return (
            <div
              key={i}
              className={`flex-1 ${isChanged ? 'bg-blue-400' : 'bg-purple-400'} rounded-t`}
              style={{ height: `${height}%`, minHeight: '2px' }}
            />
          );
        })}
      </div>

      <div className="text-xs text-center text-gray-500">
        Distribution Preview
      </div>
    </div>
  );
};
