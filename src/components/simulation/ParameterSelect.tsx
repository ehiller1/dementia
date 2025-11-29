/**
 * Parameter Select Component
 * Dropdown selector for discrete parameter values
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ParameterSelectProps {
  parameter: {
    name: string;
    display_name: string;
    constraints: {
      options?: number[];
      min?: number;
      max?: number;
    };
  };
  value: number;
  onChange: (value: number) => void;
  isChanged?: boolean;
}

export const ParameterSelect: React.FC<ParameterSelectProps> = ({
  parameter,
  value,
  onChange,
  isChanged = false
}) => {
  const options = parameter.constraints.options || [];

  const formatValue = (val: number): string => {
    // Format based on parameter name
    if (parameter.name === 'monte_carlo_iterations') {
      return val.toLocaleString();
    }
    if (parameter.name === 'confidence_level') {
      return `${(val * 100).toFixed(0)}%`;
    }
    return val.toString();
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full px-4 py-2.5 pr-10 text-sm font-medium border rounded-lg appearance-none cursor-pointer transition-all ${
          isChanged
            ? 'border-blue-300 bg-blue-50 text-blue-900 focus:ring-blue-500'
            : 'border-gray-300 bg-white text-gray-900 focus:ring-purple-500'
        } focus:outline-none focus:ring-2 hover:border-gray-400`}
      >
        {options.map(option => (
          <option key={option} value={option}>
            {formatValue(option)}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className={`w-4 h-4 ${
          isChanged ? 'text-blue-600' : 'text-gray-500'
        }`} />
      </div>

      {/* Selected value badge */}
      {isChanged && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
          Custom
        </div>
      )}
    </div>
  );
};
