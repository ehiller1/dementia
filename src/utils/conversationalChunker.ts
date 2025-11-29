/**
 * Conversational Message Chunker
 * 
 * Transforms rich backend responses into engaging, bite-sized conversational messages
 * that feel natural and are easy to follow.
 */

export interface ConversationalChunk {
  id: string;
  type: 'intro' | 'insight' | 'data' | 'recommendation' | 'question' | 'transition';
  content: string;
  delay?: number; // ms delay before showing this chunk
  interactive?: boolean;
  metadata?: {
    agent?: string;
    priority?: 'high' | 'medium' | 'low';
    expandable?: boolean;
    followUp?: string;
  };
}

export interface ChunkingOptions {
  maxChunkLength: number;
  includeTransitions: boolean;
  addInteractivity: boolean;
  simulateTyping: boolean;
}

/**
 * Parse rich backend response into conversational chunks
 */
export function chunkConversationalResponse(
  richContent: string,
  options: Partial<ChunkingOptions> = {}
): ConversationalChunk[] {
  const opts: ChunkingOptions = {
    maxChunkLength: 150,
    includeTransitions: true,
    addInteractivity: true,
    simulateTyping: true,
    ...options
  };

  const chunks: ConversationalChunk[] = [];
  let chunkId = 0;

  // Clean and normalize content
  const cleanContent = richContent
    .replace(/[🔍📊🎯💡🚀✨📈📉💰🌟⭐🎨🔧⚡🌊🏢🔗🌍🌐📋📚🎯🔄]/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .trim();

  // Split into logical sections
  const sections = parseContentSections(cleanContent);

  // Add conversational intro
  if (sections.length > 0) {
    chunks.push({
      id: `chunk_${chunkId++}`,
      type: 'intro',
      content: generateIntroMessage(sections),
      delay: opts.simulateTyping ? 500 : 0
    });
  }

  // Process each section
  sections.forEach((section, index) => {
    const sectionChunks = processSectionIntoChunks(section, chunkId, opts);
    chunks.push(...sectionChunks);
    chunkId += sectionChunks.length;

    // Add transition between sections
    if (opts.includeTransitions && index < sections.length - 1) {
      chunks.push({
        id: `chunk_${chunkId++}`,
        type: 'transition',
        content: generateTransitionMessage(sections[index + 1]),
        delay: opts.simulateTyping ? 800 : 0
      });
    }
  });

  // Add interactive follow-up
  if (opts.addInteractivity && chunks.length > 0) {
    chunks.push({
      id: `chunk_${chunkId++}`,
      type: 'question',
      content: generateFollowUpQuestion(sections),
      delay: opts.simulateTyping ? 1200 : 0,
      interactive: true
    });
  }

  return chunks;
}

/**
 * Parse content into logical sections
 */
function parseContentSections(content: string): ContentSection[] {
  const sections: ContentSection[] = [];
  
  // Split by common patterns
  const lines = content.split('\n').filter(line => line.trim());
  let currentSection: ContentSection | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect section headers
    if (isHeaderLine(trimmedLine)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        type: detectSectionType(trimmedLine),
        title: cleanHeaderText(trimmedLine),
        content: [],
        priority: detectPriority(trimmedLine)
      };
    } else if (currentSection && trimmedLine) {
      currentSection.content.push(trimmedLine);
    } else if (!currentSection && trimmedLine) {
      // Handle content without headers
      currentSection = {
        type: 'insight',
        title: 'Analysis',
        content: [trimmedLine],
        priority: 'medium'
      };
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Process a section into conversational chunks
 */
function processSectionIntoChunks(
  section: ContentSection,
  startId: number,
  opts: ChunkingOptions
): ConversationalChunk[] {
  const chunks: ConversationalChunk[] = [];
  let chunkId = startId;

  // Section intro
  chunks.push({
    id: `chunk_${chunkId++}`,
    type: section.type === 'recommendation' ? 'recommendation' : 'insight',
    content: generateSectionIntro(section),
    delay: opts.simulateTyping ? 600 : 0,
    metadata: {
      priority: section.priority,
      expandable: section.content.length > 2
    }
  });

  // Break content into digestible pieces
  const contentChunks = chunkSectionContent(section.content, opts.maxChunkLength);
  
  contentChunks.forEach((contentChunk, index) => {
    chunks.push({
      id: `chunk_${chunkId++}`,
      type: 'data',
      content: contentChunk,
      delay: opts.simulateTyping ? 400 + (index * 200) : 0,
      metadata: {
        priority: section.priority
      }
    });
  });

  return chunks;
}

/**
 * Generate conversational intro message
 */
function generateIntroMessage(sections: ContentSection[]): string {
  const hasInsights = sections.some(s => s.type === 'insight');
  const hasRecommendations = sections.some(s => s.type === 'recommendation');
  
  if (hasInsights && hasRecommendations) {
    return "I've analyzed your request and found some interesting patterns. Let me walk you through what I discovered...";
  } else if (hasInsights) {
    return "Great question! I've uncovered some key insights that should help...";
  } else if (hasRecommendations) {
    return "Based on my analysis, I have some specific recommendations for you...";
  } else {
    return "Let me share what I found...";
  }
}

/**
 * Generate section introduction
 */
function generateSectionIntro(section: ContentSection): string {
  const intros = {
    insight: [
      `Here's what stands out about ${section.title.toLowerCase()}:`,
      `I noticed something important regarding ${section.title.toLowerCase()}:`,
      `Let me highlight the key finding on ${section.title.toLowerCase()}:`
    ],
    recommendation: [
      `My recommendation for ${section.title.toLowerCase()}:`,
      `Here's what I suggest for ${section.title.toLowerCase()}:`,
      `Based on the data, here's my advice on ${section.title.toLowerCase()}:`
    ],
    data: [
      `The numbers show:`,
      `Here's what the data tells us:`,
      `Looking at the metrics:`
    ]
  };

  const options = intros[section.type] || intros.insight;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate transition messages
 */
function generateTransitionMessage(nextSection: ContentSection): string {
  const transitions = [
    "Now, let's look at another important aspect...",
    "There's more to consider here...",
    "Building on that insight...",
    "Here's another key point...",
    "This connects to something else I found..."
  ];
  
  return transitions[Math.floor(Math.random() * transitions.length)];
}

/**
 * Generate follow-up question
 */
function generateFollowUpQuestion(sections: ContentSection[]): string {
  const questions = [
    "What would you like me to explore further?",
    "Which of these insights interests you most?",
    "Should I dive deeper into any specific area?",
    "What questions do you have about these findings?",
    "How would you like to proceed with this analysis?"
  ];
  
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Helper functions
 */
function isHeaderLine(line: string): boolean {
  return line.includes(':') || 
         line.startsWith('**') || 
         line.includes('Key') || 
         line.includes('Insights') ||
         line.includes('Recommendations') ||
         line.includes('Analysis');
}

function detectSectionType(line: string): ContentSection['type'] {
  const lower = line.toLowerCase();
  if (lower.includes('recommend') || lower.includes('suggest')) return 'recommendation';
  if (lower.includes('insight') || lower.includes('finding')) return 'insight';
  return 'data';
}

function cleanHeaderText(line: string): string {
  return line
    .replace(/\*\*/g, '')
    .replace(/:/g, '')
    .replace(/^[•·‣▪▫◦‣]/g, '')
    .trim();
}

function detectPriority(line: string): 'high' | 'medium' | 'low' {
  const lower = line.toLowerCase();
  if (lower.includes('critical') || lower.includes('important') || lower.includes('key')) return 'high';
  if (lower.includes('consider') || lower.includes('note')) return 'medium';
  return 'low';
}

function chunkSectionContent(content: string[], maxLength: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  for (const line of content) {
    if (currentChunk.length + line.length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Supporting interfaces
 */
interface ContentSection {
  type: 'insight' | 'recommendation' | 'data';
  title: string;
  content: string[];
  priority: 'high' | 'medium' | 'low';
}
