/**
 * Simple Logger class for development and testing purposes
 * Provides basic logging functionality with configurable context
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, meta?: any): void {
    console.log(`[INFO][${this.context}] ${message}`, meta || '');
  }

  error(message: string, meta?: any): void {
    console.error(`[ERROR][${this.context}] ${message}`, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN][${this.context}] ${message}`, meta || '');
  }

  debug(message: string, meta?: any): void {
    console.debug(`[DEBUG][${this.context}] ${message}`, meta || '');
  }
}
