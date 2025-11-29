/**
 * Parameter Toggle Component
 * Switch/toggle for boolean parameters
 */

import React from 'react';

interface ParameterToggleProps {
  parameter: {
    name: string;
    display_name: string;
  };
  value: boolean;
  onChange: (value: boolean) => void;
  isChanged?: boolean;
}

export const ParameterToggle: React.FC<ParameterToggleProps> = ({
  parameter,
  value,
  onChange,
  isChanged = false
}) => {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          value
            ? isChanged
              ? 'bg-blue-600 focus:ring-blue-500'
              : 'bg-purple-600 focus:ring-purple-500'
            : 'bg-gray-300 focus:ring-gray-500'
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>

      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${
          value
            ? isChanged
              ? 'text-blue-700'
              : 'text-purple-700'
            : 'text-gray-500'
        }`}>
          {value ? 'Enabled' : 'Disabled'}
        </span>
        {isChanged && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Custom
          </span>
        )}
      </div>
    </div>
  );
};
