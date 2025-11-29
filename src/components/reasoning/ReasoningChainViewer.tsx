import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Target,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';

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

interface ReasoningChainViewerProps {
  reasoningChain: ReasoningChain;
  isExpanded?: boolean;
  showQualityMetrics?: boolean;
  onStepClick?: (step: ReasoningStep) => void;
}

export const ReasoningChainViewer: React.FC<ReasoningChainViewerProps> = ({
  reasoningChain,
  isExpanded = false,
  showQualityMetrics = true,
  onStepClick
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(isExpanded);

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-500" />
            Chain-of-Thought Reasoning
            <Badge variant="outline" className="text-xs">
              {reasoningChain.steps.length} steps
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getConfidenceColor(reasoningChain.overallConfidence)}`}>
              {Math.round(reasoningChain.overallConfidence * 100)}% confidence
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 w-6 p-0"
            >
              {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        
        {showQualityMetrics && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <span>Completeness:</span>
              <div className={`w-12 h-1 rounded ${getQualityColor(reasoningChain.qualityMetrics.completeness)}`} />
              <span>{Math.round(reasoningChain.qualityMetrics.completeness * 100)}%</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span>Coherence:</span>
              <div className={`w-12 h-1 rounded ${getQualityColor(reasoningChain.qualityMetrics.coherence)}`} />
              <span>{Math.round(reasoningChain.qualityMetrics.coherence * 100)}%</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{reasoningChain.executionTime}ms</span>
            </div>
          </div>
        )}
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Business Context */}
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              <strong>Context:</strong> {reasoningChain.businessContext}
            </div>

            {/* Reasoning Steps */}
            <div className="space-y-2">
              {reasoningChain.steps.map((step, index) => (
                <Collapsible
                  key={step.id}
                  open={expandedSteps.has(step.id)}
                  onOpenChange={() => toggleStep(step.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto text-left hover:bg-gray-50"
                      onClick={() => onStepClick?.(step)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {expandedSteps.has(step.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        
                        <div className="flex items-center gap-2 flex-1">
                          <Badge variant="outline" className="text-xs">
                            Step {step.stepNumber}
                          </Badge>
                          
                          <span className="text-sm font-medium flex-1">
                            {step.description}
                          </span>
                          
                          <Badge className={`text-xs ${getConfidenceColor(step.confidence)}`}>
                            {Math.round(step.confidence * 100)}%
                          </Badge>
                        </div>
                        
                        {index < reasoningChain.steps.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pl-6 pr-2 pb-2">
                    <div className="space-y-3 text-sm">
                      {/* Reasoning */}
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Lightbulb className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-medium text-muted-foreground">Reasoning:</span>
                        </div>
                        <p className="text-sm leading-relaxed pl-4 border-l-2 border-yellow-200">
                          {step.reasoning}
                        </p>
                      </div>
                      
                      {/* Conclusion */}
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Target className="h-3 w-3 text-blue-500" />
                          <span className="text-xs font-medium text-muted-foreground">Conclusion:</span>
                        </div>
                        <p className="text-sm leading-relaxed pl-4 border-l-2 border-blue-200">
                          {step.conclusion}
                        </p>
                      </div>
                      
                      {/* Evidence */}
                      {step.evidence && step.evidence.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs font-medium text-muted-foreground">Evidence:</span>
                          </div>
                          <ul className="text-xs space-y-1 pl-4">
                            {step.evidence.map((evidence, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-500 mt-0.5">•</span>
                                <span>{evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Assumptions */}
                      {step.assumptions && step.assumptions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span className="text-xs font-medium text-muted-foreground">Assumptions:</span>
                          </div>
                          <ul className="text-xs space-y-1 pl-4">
                            {step.assumptions.map((assumption, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>{assumption}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Dependencies */}
                      {step.dependencies && step.dependencies.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <ArrowRight className="h-3 w-3 text-gray-500" />
                            <span className="text-xs font-medium text-muted-foreground">Dependencies:</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pl-4">
                            {step.dependencies.map((dep, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                Step {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {/* Final Conclusion */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Final Conclusion</span>
                <Badge className={`text-xs ${getConfidenceColor(reasoningChain.overallConfidence)}`}>
                  {Math.round(reasoningChain.overallConfidence * 100)}% confidence
                </Badge>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed">
                {reasoningChain.finalConclusion}
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ReasoningChainViewer;
