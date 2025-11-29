/**
 * Quality Badges Component
 * 
 * Displays quality metrics from the enhanced orchestrator:
 * - Mode (Confident vs Explore)
 * - Completeness percentage
 * - Accuracy percentage
 * - Warnings/blockers
 * 
 * Updated to use centralized branding system
 */

import React from 'react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AlertCircle, CheckCircle, HelpCircle, TrendingUp, Target } from 'lucide-react';
import { brandColors } from '@/config/branding';

export interface QualityMetrics {
  mode: 'confident' | 'explore';
  completeness: number; // 0-1
  accuracy: number; // 0-1
  reasons?: string[];
  gates?: {
    has_insights: boolean;
    has_next_actions: boolean;
    has_owners_deadlines: boolean;
    has_cross_impact: boolean;
    has_citations: boolean;
    agent_success_rate: number;
  };
}

interface QualityBadgesProps {
  quality: QualityMetrics;
  compact?: boolean;
  showDetails?: boolean;
}

export function QualityBadges({ quality, compact = false, showDetails = true }: QualityBadgesProps) {
  const completenessPercent = Math.round(quality.completeness * 100);
  const accuracyPercent = Math.round(quality.accuracy * 100);
  const isConfident = quality.mode === 'confident';
  
  // Determine color variants
  const modeVariant = isConfident ? 'default' : 'secondary';
  const completenessVariant = completenessPercent >= 80 ? 'default' : completenessPercent >= 60 ? 'secondary' : 'destructive';
  const accuracyVariant = accuracyPercent >= 80 ? 'default' : accuracyPercent >= 60 ? 'secondary' : 'destructive';
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant={modeVariant} className="flex items-center gap-1">
                {isConfident ? <CheckCircle className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
                {isConfident ? 'Confident' : 'Explore'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isConfident ? 'High confidence recommendations' : 'More information needed'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Badge variant="outline" className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          {completenessPercent}%
        </Badge>
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Mode Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant={modeVariant} className="flex items-center gap-1.5 px-3 py-1">
              {isConfident ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <HelpCircle className="h-4 w-4" />
              )}
              <span className="font-medium">
                {isConfident ? '✓ Confident' : '? Explore'}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1">
              {isConfident ? 'Confident Mode' : 'Explore Mode'}
            </p>
            <p className="text-sm">
              {isConfident 
                ? 'System has sufficient evidence and approvals to make recommendations'
                : 'System needs more information or approvals before making recommendations'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Completeness Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant={completenessVariant} className="flex items-center gap-1.5 px-3 py-1">
              <Target className="h-4 w-4" />
              <span className="font-medium">
                Completeness: {completenessPercent}%
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1">Data Completeness</p>
            <p className="text-sm mb-2">
              Measures how much required information is available
            </p>
            {quality.gates && showDetails && (
              <ul className="text-xs space-y-1">
                <li style={{ color: quality.gates.has_insights ? brandColors.success : brandColors.destructive }}>
                  {quality.gates.has_insights ? '✓' : '✗'} Insights
                </li>
                <li style={{ color: quality.gates.has_next_actions ? brandColors.success : brandColors.destructive }}>
                  {quality.gates.has_next_actions ? '✓' : '✗'} Next Actions
                </li>
                <li style={{ color: quality.gates.has_cross_impact ? brandColors.success : brandColors.destructive }}>
                  {quality.gates.has_cross_impact ? '✓' : '✗'} Cross-functional Impact
                </li>
                <li style={{ color: quality.gates.has_citations ? brandColors.success : brandColors.destructive }}>
                  {quality.gates.has_citations ? '✓' : '✗'} Citations
                </li>
              </ul>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Accuracy Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant={accuracyVariant} className="flex items-center gap-1.5 px-3 py-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">
                Accuracy: {accuracyPercent}%
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1">Confidence Score</p>
            <p className="text-sm mb-2">
              Based on agent execution success and uncertainty levels
            </p>
            {quality.gates && showDetails && (
              <p className="text-xs">
                Agent success rate: {Math.round(quality.gates.agent_success_rate * 100)}%
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Warnings Badge */}
      {quality.reasons && quality.reasons.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {quality.reasons.length} {quality.reasons.length === 1 ? 'Warning' : 'Warnings'}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="font-semibold mb-2">Quality Warnings</p>
              <ul className="text-sm space-y-1">
                {quality.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span style={{ color: brandColors.destructive }} className="mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Simplified quality indicator for inline use
 */
export function QualityIndicator({ quality }: { quality: QualityMetrics }) {
  const isConfident = quality.mode === 'confident';
  const completenessPercent = Math.round(quality.completeness * 100);
  
  return (
    <div className="inline-flex items-center gap-1.5 text-sm">
      {isConfident ? (
        <CheckCircle className="h-4 w-4" style={{ color: brandColors.success }} />
      ) : (
        <HelpCircle className="h-4 w-4" style={{ color: brandColors.warning }} />
      )}
      <span className="font-medium">
        {completenessPercent}%
      </span>
    </div>
  );
}
