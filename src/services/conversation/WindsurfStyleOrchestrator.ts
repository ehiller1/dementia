/**
 * Frontend-only stub for WindsurfStyleOrchestrator.
 * Provides no-op implementations so the UI can function without backend services.
 */

export type WindsurfMessage = {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

export type ConversationPlan = {
  phase?: string;
  steps?: Array<{ id: string; title?: string; status?: string }>;
  status?: 'idle' | 'running' | 'completed' | 'error';
};

export class WindsurfStyleOrchestrator {
  private conversationId: string;
  private messageCallback?: (msg: WindsurfMessage) => void;
  private plan: ConversationPlan | null = null;
  private stopped = false;

  constructor(conversationId: string) {
    this.conversationId = conversationId;
  }

  // Hook expects this to exist
  setMessageCallback(cb: (msg: WindsurfMessage) => void) {
    this.messageCallback = cb;
  }

  // Hook expects this to exist
  getPlan(): ConversationPlan | null {
    return this.plan;
  }

  // Hook expects this to exist
  async startConversation(query: string): Promise<void> {
    this.stopped = false;
    // Minimal simulated plan
    this.plan = {
      phase: 'interpretation',
      status: 'running',
      steps: [
        { id: 'read', title: 'Reading input', status: 'completed' },
        { id: 'think', title: 'Thinking', status: 'running' },
        { id: 'respond', title: 'Responding', status: 'idle' }
      ]
    };

    // Emit a brief simulated response
    await this.emitSystemMessage('Analyzing your request...');
    if (this.stopped) return;

    // Update plan to completed and emit a final message
    this.plan = {
      phase: 'completed',
      status: 'completed',
      steps: [
        { id: 'read', title: 'Reading input', status: 'completed' },
        { id: 'think', title: 'Thinking', status: 'completed' },
        { id: 'respond', title: 'Responding', status: 'completed' }
      ]
    };

    await this.emitAssistantMessage(`Here's a preliminary take on: "${query}"`);
  }

  // Hook expects this to exist
  stop() {
    this.stopped = true;
  }

  // Hook expects this to exist
  cleanup() {
    this.stopped = true;
    this.messageCallback = undefined;
    this.plan = null;
  }

  private async emitSystemMessage(content: string) {
    if (!this.messageCallback) return;
    const msg: WindsurfMessage = {
      id: `sys_${Date.now()}`,
      type: 'system',
      content,
      timestamp: new Date()
    };
    this.messageCallback(msg);
    await Promise.resolve();
  }

  private async emitAssistantMessage(content: string) {
    if (!this.messageCallback) return;
    const msg: WindsurfMessage = {
      id: `asst_${Date.now()}`,
      type: 'assistant',
      content,
      timestamp: new Date()
    };
    this.messageCallback(msg);
    await Promise.resolve();
  }
}

