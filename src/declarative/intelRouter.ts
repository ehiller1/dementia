/**
 * Intelligence Router (Declarative Layer)
 * 
 * "Thinking" layer with no side effects:
 * - Memory retrieval (past decisions, analogies, outcomes)
 * - Document search (reports, analyses, market data)
 * - Conceptual mapping (tags, themes, patterns)
 * 
 * Returns JSON that can be shown to executives and fed into agents.
 */

/**
 * Memory index interface
 */
export interface MemoryIndex {
  search(query: string, limit: number): Promise<{
    notes: string[];
    analogies?: string[];
    outcomes?: string[];
  }>;
}

/**
 * Document index interface
 */
export interface DocIndex {
  search(query: string, limit: number): Promise<{
    snippets: Array<{
      text: string;
      source: string;
      relevance: number;
    }>;
  }>;
}

/**
 * Input for Intelligence Router
 */
export interface IntelligenceRouterInput {
  problem_statement: string;
  objectives: string[];
  memoryIndex: MemoryIndex;
  docIndex: DocIndex;
}

/**
 * Output from Intelligence Router
 */
export interface IntelligenceRouterOutput {
  memory_notes: string[];           // Short bullets from memory
  doc_snippets: Array<{             // Citations from documents
    text: string;
    source: string;
    relevance: number;
  }>;
  conceptual_map: string[];         // Optional tags/themes
  analogies?: string[];             // Past similar situations
  outcomes?: string[];              // Past outcomes/learnings
}

/**
 * Run Intelligence Router
 * 
 * Declarative operation: no side effects, pure retrieval
 */
export async function runIntelligenceRouter(
  input: IntelligenceRouterInput
): Promise<IntelligenceRouterOutput> {
  console.log('🧠 [IntelRouter] Running intelligence router');
  
  // Search memory index
  const memoryResults = await input.memoryIndex.search(
    input.problem_statement,
    5
  );
  
  // Search document index
  const docResults = await input.docIndex.search(
    input.problem_statement,
    5
  );
  
  // Extract conceptual map (themes/patterns)
  const conceptualMap = extractConceptualMap(
    input.problem_statement,
    input.objectives
  );
  
  console.log(`✅ [IntelRouter] Found ${memoryResults.notes.length} memory notes, ${docResults.snippets.length} doc snippets`);
  
  return {
    memory_notes: memoryResults.notes,
    doc_snippets: docResults.snippets,
    conceptual_map: conceptualMap,
    analogies: memoryResults.analogies,
    outcomes: memoryResults.outcomes
  };
}

/**
 * Extract conceptual map from problem statement and objectives
 * 
 * Identifies key themes/patterns for cognitive framing
 */
function extractConceptualMap(
  problemStatement: string,
  objectives: string[]
): string[] {
  const text = `${problemStatement} ${objectives.join(' ')}`.toLowerCase();
  const map: string[] = [];
  
  // Demand-related
  if (/demand|forecast|sales|revenue/i.test(text)) {
    map.push('demand-shift');
  }
  
  // Pricing-related
  if (/price|pricing|margin|discount/i.test(text)) {
    map.push('pricing-power');
  }
  
  // Promotion-related
  if (/promo|promotion|campaign|marketing/i.test(text)) {
    map.push('promo-effectiveness');
  }
  
  // Channel-related
  if (/channel|distribution|online|retail/i.test(text)) {
    map.push('channel-mix');
  }
  
  // Inventory-related
  if (/inventory|stock|supply|fulfillment/i.test(text)) {
    map.push('inventory-alignment');
  }
  
  // Competition-related
  if (/compet|rival|market.share/i.test(text)) {
    map.push('competitive-pressure');
  }
  
  // Customer-related
  if (/customer|consumer|behavior|segment/i.test(text)) {
    map.push('customer-behavior');
  }
  
  // Operations-related
  if (/operation|efficiency|cost|process/i.test(text)) {
    map.push('operational-efficiency');
  }
  
  return map.length > 0 ? map : ['general-analysis'];
}

/**
 * Create a simple in-memory memory index for testing
 */
export function createSimpleMemoryIndex(
  notes: string[] = [],
  analogies: string[] = [],
  outcomes: string[] = []
): MemoryIndex {
  return {
    async search(query: string, limit: number) {
      // Simple keyword matching
      const lowerQuery = query.toLowerCase();
      const matchedNotes = notes.filter(note => 
        note.toLowerCase().includes(lowerQuery.split(' ')[0])
      ).slice(0, limit);
      
      return {
        notes: matchedNotes.length > 0 ? matchedNotes : [
          'Past holiday seasons showed 8-12% demand softness in weeks 2-3',
          'Promo fatigue observed when campaign frequency > 2/week',
          'Price elasticity higher in Q4 due to competitive pressure'
        ],
        analogies,
        outcomes
      };
    }
  };
}

/**
 * Create a simple in-memory document index for testing
 */
export function createSimpleDocIndex(
  snippets: Array<{ text: string; source: string; relevance: number }> = []
): DocIndex {
  return {
    async search(query: string, limit: number) {
      // Return provided snippets or defaults
      return {
        snippets: snippets.length > 0 ? snippets.slice(0, limit) : [
          {
            text: 'Holiday demand forecasts should account for promotional lift and competitive dynamics',
            source: 'Q4 Planning Guide 2024',
            relevance: 0.85
          },
          {
            text: 'Price sensitivity increases 15-20% during promotional periods',
            source: 'Pricing Elasticity Study',
            relevance: 0.78
          },
          {
            text: 'Inventory positioning 3-4 weeks ahead of peak demand reduces stockout risk',
            source: 'Supply Chain Best Practices',
            relevance: 0.72
          }
        ]
      };
    }
  };
}
