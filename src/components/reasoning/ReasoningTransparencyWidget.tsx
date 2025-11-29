import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff,
  Sparkles,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';
import ReasoningChainViewer from './ReasoningChainViewer';
import ReasoningInsightsPanel from './ReasoningInsightsPanel';

interface ReasoningStep {
  id: string;
  stepNumber: number;
  description: string;
  reasoning: string;
  conclusion: string;
  confidence: number;
  dependencies?: string[];
  evidence?: string[];
  assumptions?: string[];
  timestamp: string;
}

interface ReasoningChain {
  id: string;
  templateId: string;
  businessContext: string;
  steps: ReasoningStep[];
  finalConclusion: string;
  overallConfidence: number;
  qualityMetrics: {
    completeness: number;
    coherence: number;
    logicalFlow: number;
  };
  executionTime: number;
  createdAt: string;
}

interface ReasoningTransparencyWidgetProps {
  messageId: string;
  reasoningChain?: ReasoningChain;
  isVisible?: boolean;
  compact?: boolean;
  className?: string;
}

export const ReasoningTransparencyWidget: React.FC<ReasoningTransparencyWidgetProps> = ({
  messageId,
  reasoningChain,
  isVisible = false,
  compact = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(isVisible);
  const [showInsights, setShowInsights] = useState(false);

  // Mock data for demonstration - in real implementation, this would come from the reasoning service
  const mockReasoningChain: ReasoningChain = reasoningChain || {
    id: `reasoning_${messageId}`,
    templateId: 'business_analysis_template',
    businessContext: 'Seasonal demand analysis for retail inventory optimization',
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        description: 'Analyze historical seasonal patterns',
        reasoning: 'To understand demand fluctuations, I need to examine historical sales data across different seasons and identify recurring patterns that indicate seasonal demand cycles.',
        conclusion: 'Historical data shows consistent 40% increase in demand during Q4 holiday season and 25% decrease in Q1 post-holiday period.',
        confidence: 0.92,
        evidence: [
          '3-year sales data showing Q4 peaks',
          'Industry benchmarks confirming seasonal patterns',
          'Customer behavior analytics supporting holiday shopping trends'
        ],
        assumptions: [
          'Historical patterns will continue',
          'No major market disruptions expected'
        ],
        timestamp: new Date().toISOString()
      },
      {
        id: 'step_2',
        stepNumber: 2,
        description: 'Evaluate current inventory levels',
        reasoning: 'Current inventory must be assessed against projected seasonal demand to identify potential stockouts or overstock situations.',
        conclusion: 'Current inventory is 15% below optimal levels for projected Q4 demand, requiring immediate restocking of key SKUs.',
        confidence: 0.87,
        dependencies: ['step_1'],
        evidence: [
          'Real-time inventory management system data',
          'Supplier lead time analysis',
          'SKU-level demand forecasts'
        ],
        assumptions: [
          'Supplier delivery schedules remain consistent',
          'No supply chain disruptions'
        ],
        timestamp: new Date().toISOString()
      },
      {
        id: 'step_3',
        stepNumber: 3,
        description: 'Calculate optimal reorder quantities',
        reasoning: 'Using demand forecasts and current inventory levels, I can calculate the optimal reorder quantities that minimize both stockout risk and carrying costs.',
        conclusion: 'Recommend increasing orders by 35% for top 20 SKUs and 20% for secondary SKUs to meet projected demand while maintaining 5% safety stock.',
        confidence: 0.89,
        dependencies: ['step_1', 'step_2'],
        evidence: [
          'Economic order quantity calculations',
          'Safety stock optimization models',
          'Cost-benefit analysis of inventory levels'
        ],
        timestamp: new Date().toISOString()
      }
    ],
    finalConclusion: 'Implement immediate inventory restocking strategy with 35% increase for top SKUs and 20% for secondary items to capture Q4 seasonal demand opportunity while maintaining optimal inventory costs.',
    overallConfidence: 0.89,
    qualityMetrics: {
      completeness: 0.91,
      coherence: 0.88,
      logicalFlow: 0.93
    },
    executionTime: 1247,
    createdAt: new Date().toISOString()
  };

  // Mock insights data
  const mockInsights = {
    reasoningQuality: {
      score: 0.89,
      confidence: 0.89,
      completeness: 0.91,
      coherence: 0.88,
      logicalFlow: 0.93,
      evidenceSupport: 0.85
    },
    patterns: [
      {
        id: 'pattern_1',
        pattern: 'Historical data → Current state → Future projection',
        frequency: 12,
        successRate: 0.87,
        averageConfidence: 0.84,
        contexts: ['inventory', 'demand_planning', 'forecasting']
      }
    ],
    insights: [
      {
        id: 'insight_1',
        type: 'strength' as const,
        title: 'Strong Evidence Foundation',
        description: 'Reasoning is well-supported by multiple data sources and industry benchmarks.',
        impact: 'high' as const,
        actionable: false
      },
      {
        id: 'insight_2',
        type: 'recommendation' as const,
        title: 'Consider Market Volatility',
        description: 'Add sensitivity analysis for potential market disruptions or economic changes.',
        impact: 'medium' as const,
        actionable: true
      }
    ],
    executionMetrics: {
      totalSteps: 3,
      averageStepTime: 415,
      selfCorrections: 0,
      confidenceVariance: 0.05
    }
  };

  if (!reasoningChain && !mockReasoningChain) {
    return null;
  }

  const chainData = reasoningChain || mockReasoningChain;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 px-2 text-xs"
        >
          <Brain className="h-3 w-3 mr-1" />
          CoT
          <Badge variant="secondary" className="ml-1 text-xs">
            {chainData.steps.length}
          </Badge>
        </Button>
        
        {isExpanded && (
          <div className="absolute z-50 mt-2 w-96">
            <ReasoningChainViewer
              reasoningChain={chainData}
              isExpanded={true}
              showQualityMetrics={false}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-10 text-sm"
          >
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span>Chain-of-Thought Reasoning</span>
              <Badge variant="secondary" className="text-xs">
                {chainData.steps.length} steps
              </Badge>
              <Badge className="text-xs bg-purple-100 text-purple-700">
                {Math.round(chainData.overallConfidence * 100)}% confidence
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {chainData.executionTime}ms
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ReasoningChainViewer
                  reasoningChain={chainData}
                  isExpanded={true}
                  showQualityMetrics={true}
                />
              </div>
              
              <div className="lg:col-span-1">
                <ReasoningInsightsPanel
                  reasoningQuality={mockInsights.reasoningQuality}
                  patterns={mockInsights.patterns}
                  insights={mockInsights.insights}
                  executionMetrics={mockInsights.executionMetrics}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ReasoningTransparencyWidget;
