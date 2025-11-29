// Pure intent classification logic for use in both React hooks and Node.js tests

export interface IntentClassificationRequest {
  query: string;
  conversationHistory?: Array<{
    role: 'user' | 'system';
    content: string;
  }>;
  context?: string;
}

export interface IntentClassificationResult {
  intent: 'information' | 'action' | 'analysis' | 'seasonality' | 'simulation';
  confidence: number; // 0-1
  suggestedAgentType?: string;
  extractedParameters?: Record<string, any>;
  explanation: string;
  // Executive decision support extensions
  businessCategory?:
    | 'strategic_planning'
    | 'operational_optimization'
    | 'financial_analysis'
    | 'market_expansion'
    | 'risk_management'
    | 'performance_review';
  // Hint to upstream routers for the next journey stage
  journeyHint?: 'discernment' | 'analysis' | 'decision' | 'action';
  domainSpecific?: {
    isSeasonalityQuery: boolean;
    requiresTemplateExecution: boolean;
    requiresConversationalAgent: boolean;
  };
}

/**
 * Core function to classify intent using OpenAI API. Pure, no React dependencies.
 */
export async function classifyIntentCore(
  request: IntentClassificationRequest,
  openAIApiKey: string
): Promise<IntentClassificationResult> {
  const systemPrompt = `
    You are an advanced intent classification system that analyzes user queries and determines 
    their intent type and domain specificity. You classify queries into these intent types:
    
    1. **seasonality** - Queries about seasonal patterns, trends, or time-based analysis
    2. **analysis** - Queries requesting data analysis, insights, or interpretation
    3. **action** - Queries requesting specific actions to be taken
    4. **simulation** - Queries requesting scenario modeling or what-if analysis
    5. **information** - General information-seeking queries
    
    In addition, recognize executive-level business decision categories when applicable:
    - strategic_planning (vision, long-range planning, portfolio bets)
    - operational_optimization (process efficiency, KPI improvement)
    - financial_analysis (P&L, budgeting, margin, ROI)
    - market_expansion (new markets, products, segments, partnerships)
    - risk_management (risk identification, mitigation, compliance)
    - performance_review (QBRs/MBRs, KPI scorecards, accountability)
    
    Also provide a journeyHint reflecting the next best stage in the decision journey:
    - discernment | analysis | decision | action
    Use the hint to guide workflow progression upstream.
    
    Examples by intent type:
    
    **seasonality**:
    - "What is the impact of seasonality on my product revenue?"
    - "How does seasonality affect my e-commerce business?"
    - "Analyze seasonal trends in our sales data"
    - "What are the seasonal patterns in customer behavior?"
    
    **analysis**:
    - "Analyze our customer acquisition costs"
    - "What insights can you provide about our conversion rates?"
    - "Explain the trend in our engagement metrics"
    
    **action**:
    - "Generate a forecast for next quarter's sales"
    - "Create a dashboard showing our seasonal patterns"
    - "Send a weekly report on customer churn"
    
    **simulation**:
    - "What would happen if we increased our marketing budget by 20%?"
    - "Simulate the impact of a price change on revenue"
    - "Model different scenarios for our product launch"
    
    **information**:
    - "What is our current customer retention rate?"
    - "Tell me about our latest campaign performance"
    
    For seasonality queries specifically, also determine:
    - isSeasonalityQuery: true/false
    - requiresTemplateExecution: true if complex analysis needed
    - requiresConversationalAgent: true if interactive dialogue would be beneficial
    
    Response format:
    {
      "intent": "seasonality" | "analysis" | "action" | "simulation" | "information",
      "confidence": (0-1 float, higher means more confident),
      "suggestedAgentType": (suggest appropriate agent type),
      "extractedParameters": (any parameters extracted from the query),
      "explanation": (brief explanation of classification),
      "businessCategory": (one of strategic_planning | operational_optimization | financial_analysis | market_expansion | risk_management | performance_review, or omitted if N/A),
      "journeyHint": (one of discernment | analysis | decision | action, when appropriate),
      "domainSpecific": {
        "isSeasonalityQuery": boolean,
        "requiresTemplateExecution": boolean,
        "requiresConversationalAgent": boolean
      }
    }
  `;

  const conversationContext = [
    { role: 'system', content: systemPrompt },
    ...(request.conversationHistory || []),
    { role: 'user', content: request.query }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: conversationContext,
      temperature: 0.2,
      max_tokens: 500
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  let result: IntentClassificationResult;
  try {
    result = JSON.parse(content);
  } catch (error) {
    // Fallback classification
    result = {
      intent: 'information',
      confidence: 0.5,
      explanation: 'Failed to parse classification response. Defaulting to information intent.'
    };
  }

  return result;
}
