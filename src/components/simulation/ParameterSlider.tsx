/**
 * Parameter Slider Component
 * Interactive slider for manipulating continuous and discrete parameters
 */

import React, { useState, useEffect } from 'react';

interface ParameterSliderProps {
  parameter: {
    name: string;
    display_name: string;
    data_type: string;
    constraints: {
      min: number;
      max: number;
      step?: number;
    };
  };
  value: number;
  onChange: (value: number) => void;
  isChanged?: boolean;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  parameter,
  value,
  onChange,
  isChanged = false
}) => {
  const [localValue, setLocalValue] = useState<number>(value);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const { min, max, step = 0.01 } = parameter.constraints;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
  };

  const handleSliderCommit = () => {
    setIsDragging(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  // Calculate percentage for gradient fill
  const percentage = ((localValue - min) / (max - min)) * 100;

  // Format display value
  const formatValue = (val: number): string => {
    if (parameter.data_type === 'integer') {
      return val.toFixed(0);
    }
    // Show percentages for values between 0-1
    if (max <= 1 && min >= 0) {
      return `${(val * 100).toFixed(0)}%`;
    }
    // Show multipliers
    if (parameter.name.includes('multiplier')) {
      return `${val.toFixed(2)}x`;
    }
    // Default formatting
    return val.toFixed(2);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        {/* Slider */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={handleSliderCommit}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={handleSliderCommit}
            className="slider-input w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                ${isChanged ? '#3b82f6' : '#8b5cf6'} 0%, 
                ${isChanged ? '#3b82f6' : '#8b5cf6'} ${percentage}%, 
                #e5e7eb ${percentage}%, 
                #e5e7eb 100%)`
            }}
          />
          {/* Slider thumb indicator */}
          <div
            className={`absolute top-0 h-2 pointer-events-none transition-all ${
              isDragging ? 'opacity-30' : 'opacity-0'
            }`}
            style={{
              left: `${percentage}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className={`w-0.5 h-6 -mt-2 ${isChanged ? 'bg-blue-500' : 'bg-purple-500'}`} />
          </div>
        </div>

        {/* Value Input */}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleInputChange}
          className={`w-24 px-3 py-1.5 text-sm border rounded-md text-right font-mono ${
            isChanged 
              ? 'border-blue-300 bg-blue-50 text-blue-900' 
              : 'border-gray-300 bg-white text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />

        {/* Display Value */}
        <div className={`min-w-[80px] text-right font-semibold ${
          isChanged ? 'text-blue-600' : 'text-purple-600'
        }`}>
          {formatValue(localValue)}
        </div>
      </div>

      {/* Range Indicators */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>{formatValue(min)}</span>
        <span className="text-gray-400">|</span>
        <span>{formatValue(max)}</span>
      </div>

      {/* Visual feedback during drag */}
      {isDragging && (
        <div className="text-xs text-center text-gray-600 animate-pulse">
          Adjusting parameter...
        </div>
      )}
    </div>
  );
};
