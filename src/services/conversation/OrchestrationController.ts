/**
 * Stub for OrchestrationController
 * Backend services removed for frontend-only build
 */

export class OrchestrationController {
  constructor(options?: any) {
    console.warn('[OrchestrationController] Backend service disabled - frontend-only mode');
  }

  async init(templateId?: string, options?: any) {
    console.warn('[OrchestrationController] init() disabled - frontend-only mode');
    return Promise.resolve();
  }

  async processMessage(message: any) {
    console.warn('[OrchestrationController] processMessage() disabled - frontend-only mode');
    return { messages: [], data: {} };
  }

  stop() {
    console.warn('[OrchestrationController] stop() disabled - frontend-only mode');
  }
}

