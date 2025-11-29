import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, Eye, Users, TrendingUp } from 'lucide-react';

interface ProblemFrame {
  perspective: string;
  icon: React.ReactNode;
  reframedQuestion: string;
  potentialInsights: string[];
  stakeholderView?: string;
}

interface ProblemReframingSuggestionsProps {
  originalProblem: string;
  alternativeFrames: ProblemFrame[];
  onSelectFrame: (frame: ProblemFrame) => void;
  onDismiss: () => void;
}

export const ProblemReframingSuggestions: React.FC<ProblemReframingSuggestionsProps> = ({
  originalProblem,
  alternativeFrames,
  onSelectFrame,
  onDismiss,
}) => {
  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 p-4 my-4">
      <div className="flex items-start space-x-3 mb-4">
        <Lightbulb className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Alternative Problem Framings</h3>
          <p className="text-sm text-gray-400">
            Your question: <span className="italic">"{originalProblem}"</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Consider these different perspectives to uncover new insights:
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-gray-400 hover:text-white"
        >
          ×
        </Button>
      </div>

      <div className="space-y-3">
        {alternativeFrames.map((frame, index) => (
          <div
            key={index}
            className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 hover:border-purple-500/50 transition-all cursor-pointer group"
            onClick={() => onSelectFrame(frame)}
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-900/30 rounded-lg flex-shrink-0">
                {frame.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="outline" className="text-xs border-purple-500/50">
                    {frame.perspective}
                  </Badge>
                  {frame.stakeholderView && (
                    <span className="text-xs text-gray-500">
                      • {frame.stakeholderView} view
                    </span>
                  )}
                </div>
                <p className="text-sm text-white font-medium mb-2">
                  {frame.reframedQuestion}
                </p>
                <div className="space-y-1">
                  {frame.potentialInsights.slice(0, 2).map((insight, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-gray-400">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-400" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFrame(frame);
                }}
              >
                Explore
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <p className="text-xs text-gray-500 text-center">
          Reframing helps surface hidden assumptions and discover new solution paths
        </p>
      </div>
    </Card>
  );
};

// Helper function to generate reframing suggestions based on problem text
export const generateReframingSuggestions = (problem: string): ProblemFrame[] => {
  const lowerProblem = problem.toLowerCase();
  
  // Detect problem domain
  if (lowerProblem.includes('cac') || lowerProblem.includes('cost') || lowerProblem.includes('expensive')) {
    return [
      {
        perspective: 'Value Maximization',
        icon: <TrendingUp className="h-4 w-4 text-green-400" />,
        reframedQuestion: 'How can we increase customer lifetime value to justify current acquisition costs?',
        potentialInsights: [
          'Focus on retention and upselling to existing customers',
          'Identify high-LTV customer segments for targeted acquisition',
        ],
        stakeholderView: 'Finance',
      },
      {
        perspective: 'Attribution Analysis',
        icon: <Eye className="h-4 w-4 text-blue-400" />,
        reframedQuestion: 'What acquisition costs are hidden due to attribution gaps?',
        potentialInsights: [
          'Multi-touch attribution might reveal assisted conversions',
          'Organic and referral channels may be under-credited',
        ],
        stakeholderView: 'Analytics',
      },
      {
        perspective: 'Competitive Context',
        icon: <Users className="h-4 w-4 text-yellow-400" />,
        reframedQuestion: 'How do our acquisition costs compare to competitors and what CAC maintains market position?',
        potentialInsights: [
          'Industry benchmarks may show CAC is acceptable',
          'Customer quality vs. quantity trade-offs with competitors',
        ],
        stakeholderView: 'Strategy',
      },
    ];
  }
  
  if (lowerProblem.includes('roas') || lowerProblem.includes('return')) {
    return [
      {
        perspective: 'Incrementality Focus',
        icon: <TrendingUp className="h-4 w-4 text-green-400" />,
        reframedQuestion: 'What portion of our ROAS represents truly incremental sales vs. baseline?',
        potentialInsights: [
          'Run holdout tests to measure true incrementality',
          'Identify channels with high vs. low incremental impact',
        ],
        stakeholderView: 'Analytics',
      },
      {
        perspective: 'Time Horizon',
        icon: <Eye className="h-4 w-4 text-blue-400" />,
        reframedQuestion: 'How does short-term ROAS differ from long-term customer value creation?',
        potentialInsights: [
          'Brand-building efforts may have delayed ROAS',
          'Customer lifetime value incorporates repeat purchases',
        ],
        stakeholderView: 'Marketing',
      },
      {
        perspective: 'Portfolio Mix',
        icon: <Users className="h-4 w-4 text-yellow-400" />,
        reframedQuestion: 'Should we optimize for blended ROAS or allow channel-specific targets?',
        potentialInsights: [
          'Top-of-funnel channels need different ROAS targets',
          'Cross-channel synergies may justify lower individual ROAS',
        ],
        stakeholderView: 'Executive',
      },
    ];
  }
  
  // Generic reframing for other problems
  return [
    {
      perspective: 'Stakeholder Impact',
      icon: <Users className="h-4 w-4 text-purple-400" />,
      reframedQuestion: 'How does this problem affect different stakeholders differently?',
      potentialInsights: [
        'Customer, employee, and shareholder perspectives may diverge',
        'Short-term pain might be long-term gain for certain groups',
      ],
    },
    {
      perspective: 'Root Cause',
      icon: <Eye className="h-4 w-4 text-blue-400" />,
      reframedQuestion: 'What underlying system creates this symptom?',
      potentialInsights: [
        'Treating symptoms vs. addressing root causes',
        'Systemic issues may require structural changes',
      ],
    },
    {
      perspective: 'Opportunity Reframe',
      icon: <Lightbulb className="h-4 w-4 text-yellow-400" />,
      reframedQuestion: 'What opportunity does this problem reveal?',
      potentialInsights: [
        'Problems often indicate unmet needs or market gaps',
        'Constraints can drive innovation and differentiation',
      ],
    },
  ];
};
