/**
 * Telemetry and Metrics for Module Processing
 * 
 * Tracks validation failures, timeouts, and performance metrics.
 */

interface TelemetryEvent {
  module: string;
  event: 'NO_VALID_JSON' | 'SCHEMA_VALIDATION_FAILED' | 'LLM_TIMEOUT' | 'SUCCESS' | 'FORMATTER_FAILED';
  timestamp: string;
  durationMs?: number;
  errorDetails?: string;
  metadata?: Record<string, unknown>;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private counters: Map<string, number> = new Map();

  /**
   * Log telemetry event
   */
  log(event: TelemetryEvent) {
    this.events.push(event);
    
    // Increment counter
    const key = `${event.module}:${event.event}`;
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
    
    // Console log for monitoring
    console.log(`[Telemetry] ${event.module} - ${event.event}`, {
      durationMs: event.durationMs,
      errorDetails: event.errorDetails
    });
  }

  /**
   * Get counter value
   */
  getCounter(module: string, event: string): number {
    return this.counters.get(`${module}:${event}`) || 0;
  }

  /**
   * Get all counters for a module
   */
  getModuleCounters(module: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.counters.entries()) {
      if (key.startsWith(`${module}:`)) {
        const eventName = key.split(':')[1];
        result[eventName] = value;
      }
    }
    return result;
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): TelemetryEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clear old events (keep last 1000)
   */
  cleanup() {
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }
}

export const telemetry = new TelemetryService();

/**
 * Timebox an async operation
 * Converts timeouts to errors
 */
export async function timeboxOperation<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutError: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
    )
  ]);
}

/**
 * Track operation with telemetry
 */
export async function trackOperation<T>(
  module: string,
  operation: () => Promise<T>,
  timeoutMs?: number
): Promise<{ success: boolean; data?: T; error?: string; durationMs: number }> {
  const startTime = Date.now();
  
  try {
    const promise = operation();
    const data = timeoutMs 
      ? await timeboxOperation(promise, timeoutMs, 'LLM_TIMEOUT')
      : await promise;
    
    const durationMs = Date.now() - startTime;
    
    telemetry.log({
      module,
      event: 'SUCCESS',
      timestamp: new Date().toISOString(),
      durationMs
    });
    
    return { success: true, data, durationMs };
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const isTimeout = error.message === 'LLM_TIMEOUT';
    
    telemetry.log({
      module,
      event: isTimeout ? 'LLM_TIMEOUT' : 'FORMATTER_FAILED',
      timestamp: new Date().toISOString(),
      durationMs,
      errorDetails: error.message
    });
    
    return {
      success: false,
      error: error.message,
      durationMs
    };
  }
}
