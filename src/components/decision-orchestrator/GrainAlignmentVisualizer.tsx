/**
 * Grain Alignment Visualizer Component
 * 
 * Visualizes how different functions align their grain of analysis
 */

import React from 'react';
import {
  Grid3x3,
  MapPin,
  Calendar,
  Package,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface Grain {
  product?: {
    skuId?: string;
    choiceSetId?: string;
    categoryId?: string;
  };
  location?: {
    storeId?: string;
    regionId?: string;
  };
  time?: {
    dayId?: string;
    weekId?: string;
    monthId?: string;
  };
}

interface FunctionGrain {
  functionName: string;
  grain: Grain;
  aligned: boolean;
}

interface GrainAlignmentVisualizerProps {
  functionGrains: FunctionGrain[];
  targetGrain: Grain;
}

export const GrainAlignmentVisualizer: React.FC<GrainAlignmentVisualizerProps> = ({
  functionGrains,
  targetGrain
}) => {
  // Determine alignment status
  const allAligned = functionGrains.every(fg => fg.aligned);
  const alignmentLevel = calculateAlignmentLevel(functionGrains, targetGrain);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`p-4 rounded-lg border ${
        allAligned 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {allAligned ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          <h3 className={`font-semibold ${
            allAligned ? 'text-green-900' : 'text-yellow-900'
          }`}>
            Grain Alignment Status
          </h3>
        </div>
        <p className={`text-sm ${
          allAligned ? 'text-green-700' : 'text-yellow-700'
        }`}>
          {allAligned 
            ? 'All functions are aligned to the same grain of analysis'
            : 'Some functions require grain coarsening for alignment'
          }
        </p>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Alignment Level:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  alignmentLevel > 80 ? 'bg-green-500' : 
                  alignmentLevel > 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${alignmentLevel}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700">{alignmentLevel}%</span>
          </div>
        </div>
      </div>

      {/* Target Grain */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Grid3x3 className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-900">Target Grain</h4>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <GrainDimensionCard
            icon={<Package className="w-4 h-4" />}
            label="Product"
            grain={targetGrain.product}
            color="blue"
          />
          <GrainDimensionCard
            icon={<MapPin className="w-4 h-4" />}
            label="Location"
            grain={targetGrain.location}
            color="blue"
          />
          <GrainDimensionCard
            icon={<Calendar className="w-4 h-4" />}
            label="Time"
            grain={targetGrain.time}
            color="blue"
          />
        </div>
      </div>

      {/* Function Grains */}
      <div className="space-y-3">
        {functionGrains.map((fg) => (
          <FunctionGrainCard
            key={fg.functionName}
            functionGrain={fg}
            targetGrain={targetGrain}
          />
        ))}
      </div>

      {/* Alignment Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Grain Hierarchy</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              <span className="font-medium">Product:</span> SKU → Choice Set → Category
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              <span className="font-medium">Location:</span> Store → Region → National
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              <span className="font-medium">Time:</span> Day → Week → Month
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Function Grain Card
 */
const FunctionGrainCard: React.FC<{
  functionGrain: FunctionGrain;
  targetGrain: Grain;
}> = ({ functionGrain, targetGrain }) => {
  const { functionName, grain, aligned } = functionGrain;

  return (
    <div className={`border rounded-lg p-4 ${
      aligned ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h5 className="font-semibold text-gray-900">{functionName}</h5>
          {aligned ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowRight className="w-4 h-4 text-orange-600" />
          )}
        </div>
        {!aligned && (
          <span className="text-xs font-medium text-orange-600">
            Requires coarsening
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <GrainDimensionCard
          icon={<Package className="w-4 h-4" />}
          label="Product"
          grain={grain.product}
          color={aligned ? 'green' : 'gray'}
          target={targetGrain.product}
        />
        <GrainDimensionCard
          icon={<MapPin className="w-4 h-4" />}
          label="Location"
          grain={grain.location}
          color={aligned ? 'green' : 'gray'}
          target={targetGrain.location}
        />
        <GrainDimensionCard
          icon={<Calendar className="w-4 h-4" />}
          label="Time"
          grain={grain.time}
          color={aligned ? 'green' : 'gray'}
          target={targetGrain.time}
        />
      </div>
    </div>
  );
};

/**
 * Grain Dimension Card
 */
const GrainDimensionCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  grain?: any;
  color: 'blue' | 'green' | 'gray';
  target?: any;
}> = ({ icon, label, grain, color, target }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  // Determine grain level
  const level = getGrainLevel(grain);
  const targetLevel = target ? getGrainLevel(target) : null;
  const needsCoarsening = targetLevel && level < targetLevel;

  return (
    <div className="bg-white rounded border border-gray-200 p-3">
      <div className={`flex items-center gap-2 mb-2 p-1.5 rounded ${colors[color]}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-xs text-gray-700 space-y-1">
        {grain ? (
          <>
            {grain.skuId && <div>SKU: {grain.skuId}</div>}
            {grain.choiceSetId && <div>Choice Set: {grain.choiceSetId}</div>}
            {grain.categoryId && <div>Category: {grain.categoryId}</div>}
            {grain.storeId && <div>Store: {grain.storeId}</div>}
            {grain.regionId && <div>Region: {grain.regionId}</div>}
            {grain.dayId && <div>Day: {grain.dayId}</div>}
            {grain.weekId && <div>Week: {grain.weekId}</div>}
            {grain.monthId && <div>Month: {grain.monthId}</div>}
          </>
        ) : (
          <div className="text-gray-400 italic">Not specified</div>
        )}
        {needsCoarsening && (
          <div className="mt-2 pt-2 border-t border-orange-200">
            <div className="flex items-center gap-1 text-orange-600">
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium">Coarsen to {getLevelName(targetLevel)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Helper Functions
 */
function getGrainLevel(grain: any): number {
  if (!grain) return 0;
  
  // Product hierarchy: SKU (1) → Choice Set (2) → Category (3)
  if (grain.skuId) return 1;
  if (grain.choiceSetId) return 2;
  if (grain.categoryId) return 3;
  
  // Location hierarchy: Store (1) → Region (2)
  if (grain.storeId) return 1;
  if (grain.regionId) return 2;
  
  // Time hierarchy: Day (1) → Week (2) → Month (3)
  if (grain.dayId) return 1;
  if (grain.weekId) return 2;
  if (grain.monthId) return 3;
  
  return 0;
}

function getLevelName(level: number): string {
  const names = ['', 'Finest', 'Medium', 'Coarsest'];
  return names[level] || 'Unknown';
}

function calculateAlignmentLevel(functionGrains: FunctionGrain[], targetGrain: Grain): number {
  if (functionGrains.length === 0) return 100;
  
  const alignedCount = functionGrains.filter(fg => fg.aligned).length;
  return Math.round((alignedCount / functionGrains.length) * 100);
}
