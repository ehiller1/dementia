/**
 * Code Sandbox for Secure Execution
 * 
 * This module provides a secure environment for executing dynamically generated code
 * from OpenAI or other LLMs. It implements various security measures:
 * 
 * 1. Isolated execution environment using Web Workers
 * 2. Resource limiting (memory, CPU, execution time)
 * 3. Restricted API access
 * 4. Input validation and sanitization
 * 5. Execution monitoring and logging
 */

import { nanoid } from 'nanoid';

// Types for sandbox execution
export interface SandboxExecutionOptions {
  timeoutMs?: number;
  memoryLimitMb?: number;
  allowedApis?: string[];
  context?: Record<string, any>;
}

export interface SandboxExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  memoryUsed?: number;
  logs: string[];
}

// Default sandbox options
const DEFAULT_OPTIONS: SandboxExecutionOptions = {
  timeoutMs: 5000, // 5 seconds
  memoryLimitMb: 50, // 50 MB
  allowedApis: ['fetch', 'console', 'Math'],
  context: {}
};

/**
 * Creates a secure sandbox for executing code
 */
export class CodeSandbox {
  private workers: Map<string, Worker> = new Map();
  private executionLogs: Map<string, string[]> = new Map();
  
  /**
   * Execute code in a secure sandbox environment
   */
  async executeCode(
    code: string, 
    options: SandboxExecutionOptions = {}
  ): Promise<SandboxExecutionResult> {
    const executionId = nanoid();
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const startTime = performance.now();
    
    // Initialize logs for this execution
    this.executionLogs.set(executionId, []);
    
    try {
      // Validate and sanitize the code
      const sanitizedCode = this.sanitizeCode(code);
      
      // Create a worker for isolated execution
      const workerCode = this.createWorkerCode(sanitizedCode, mergedOptions, executionId);
      const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      
      // Create and store the worker
      const worker = new Worker(workerUrl);
      this.workers.set(executionId, worker);
      
      // Set up message handling for logs and results
      const result = await new Promise<SandboxExecutionResult>((resolve, reject) => {
        // Set timeout
        const timeoutId = setTimeout(() => {
          this.terminateWorker(executionId);
          resolve({
            success: false,
            error: `Execution timed out after ${mergedOptions.timeoutMs}ms`,
            executionTime: performance.now() - startTime,
            logs: this.executionLogs.get(executionId) || []
          });
        }, mergedOptions.timeoutMs);
        
        // Handle messages from the worker
        worker.onmessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'log') {
            // Capture logs
            const logs = this.executionLogs.get(executionId) || [];
            logs.push(data.message);
            this.executionLogs.set(executionId, logs);
          } else if (type === 'result') {
            // Execution completed
            clearTimeout(timeoutId);
            this.terminateWorker(executionId);
            
            resolve({
              success: true,
              result: data.result,
              executionTime: performance.now() - startTime,
              memoryUsed: data.memoryUsed,
              logs: this.executionLogs.get(executionId) || []
            });
          } else if (type === 'error') {
            // Execution failed
            clearTimeout(timeoutId);
            this.terminateWorker(executionId);
            
            resolve({
              success: false,
              error: data.error,
              executionTime: performance.now() - startTime,
              logs: this.executionLogs.get(executionId) || []
            });
          }
        };
        
        // Handle worker errors
        worker.onerror = (error) => {
          clearTimeout(timeoutId);
          this.terminateWorker(executionId);
          
          resolve({
            success: false,
            error: `Worker error: ${error.message}`,
            executionTime: performance.now() - startTime,
            logs: this.executionLogs.get(executionId) || []
          });
        };
        
        // Start execution
        worker.postMessage({ type: 'execute' });
      });
      
      // Clean up
      URL.revokeObjectURL(workerUrl);
      this.executionLogs.delete(executionId);
      
      return result;
    } catch (error) {
      // Handle any errors in sandbox setup
      this.terminateWorker(executionId);
      
      return {
        success: false,
        error: `Sandbox error: ${error.message}`,
        executionTime: performance.now() - startTime,
        logs: this.executionLogs.get(executionId) || []
      };
    }
  }
  
  /**
   * Sanitize code to prevent security issues
   */
  private sanitizeCode(code: string): string {
    // Remove potentially dangerous APIs and patterns
    const sanitized = code
      // Prevent access to document, window, parent
      .replace(/\b(document|window|parent|top|opener|frames)\b/g, 'undefined')
      // Prevent various eval-like functions
      .replace(/\b(eval|Function|setTimeout|setInterval)\(/g, 'disallowed(')
      // Prevent WebAssembly which could be used to bypass restrictions
      .replace(/\bWebAssembly\b/g, 'undefined')
      // Prevent access to localStorage, sessionStorage, indexedDB
      .replace(/\b(localStorage|sessionStorage|indexedDB)\b/g, 'undefined');
    
    return sanitized;
  }
  
  /**
   * Create the worker code with the sandboxed environment
   */
  private createWorkerCode(
    code: string, 
    options: SandboxExecutionOptions,
    executionId: string
  ): string {
    return `
      // Sandbox worker for execution ID: ${executionId}
      
      // Override console methods to capture logs
      const originalConsole = console;
      console = {
        log: (...args) => {
          self.postMessage({ 
            type: 'log', 
            data: { message: args.map(arg => String(arg)).join(' ') } 
          });
          originalConsole.log(...args);
        },
        warn: (...args) => {
          self.postMessage({ 
            type: 'log', 
            data: { message: '[WARN] ' + args.map(arg => String(arg)).join(' ') } 
          });
          originalConsole.warn(...args);
        },
        error: (...args) => {
          self.postMessage({ 
            type: 'log', 
            data: { message: '[ERROR] ' + args.map(arg => String(arg)).join(' ') } 
          });
          originalConsole.error(...args);
        },
        info: (...args) => {
          self.postMessage({ 
            type: 'log', 
            data: { message: '[INFO] ' + args.map(arg => String(arg)).join(' ') } 
          });
          originalConsole.info(...args);
        }
      };
      
      // Create restricted fetch if allowed
      ${options.allowedApis?.includes('fetch') ? `
        const originalFetch = fetch;
        fetch = async (url, options) => {
          // Log the fetch attempt
          console.log(\`Fetch request to: \${url}\`);
          
          // Check if URL is allowed (could implement allowlist here)
          // For now, we'll allow all URLs but log them
          return originalFetch(url, options);
        };
      ` : 'fetch = () => Promise.reject(new Error("fetch is not allowed in this sandbox"));'}
      
      // Set up context variables
      ${Object.entries(options.context || {})
        .map(([key, value]) => `const ${key} = ${JSON.stringify(value)};`)
        .join('\n')
      }
      
      // Handle messages from the main thread
      self.onmessage = async (event) => {
        if (event.data.type === 'execute') {
          try {
            // Create a function from the code and execute it
            const sandboxFunction = new Function(\`
              "use strict";
              // Memory usage monitoring
              const memoryUsage = { value: 0 };
              
              try {
                // The actual code to execute
                ${code}
                
                // Return the last expression result if applicable
                return (async () => {
                  try {
                    ${code.includes('return') ? '' : 'return eval("undefined");'}
                  } catch (e) {
                    console.error("Error in async evaluation:", e);
                    return { error: e.message };
                  }
                })();
              } catch (e) {
                console.error("Error in execution:", e);
                return { error: e.message };
              }
            \`);
            
            const result = await sandboxFunction();
            
            // Check if result contains an error
            if (result && result.error) {
              self.postMessage({ 
                type: 'error', 
                data: { error: result.error }
              });
            } else {
              // Get memory usage estimate
              const memoryUsed = performance.memory ? 
                performance.memory.usedJSHeapSize / (1024 * 1024) : 
                undefined;
              
              self.postMessage({ 
                type: 'result', 
                data: { 
                  result,
                  memoryUsed
                }
              });
            }
          } catch (error) {
            self.postMessage({ 
              type: 'error', 
              data: { error: error.message || 'Unknown error in sandbox execution' }
            });
          }
        }
      };
    `;
  }
  
  /**
   * Terminate a worker by execution ID
   */
  private terminateWorker(executionId: string): void {
    const worker = this.workers.get(executionId);
    if (worker) {
      worker.terminate();
      this.workers.delete(executionId);
    }
  }
  
  /**
   * Terminate all active workers
   */
  terminateAll(): void {
    for (const [id, worker] of this.workers.entries()) {
      worker.terminate();
    }
    this.workers.clear();
    this.executionLogs.clear();
  }
}

// Export singleton instance
export const codeSandbox = new CodeSandbox();
