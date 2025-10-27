/**
 * Structured logging utility with environment-aware behavior
 *
 * Development mode: All logs visible with color coding
 * Production mode: Only errors logged to error tracking service
 *
 * Usage:
 * ```typescript
 * import { Logger } from '@/utils/Logger';
 *
 * Logger.debug('Coordinate calculation', { x: 10, y: 20 });
 * Logger.info('Component loaded successfully');
 * Logger.warn('Using fallback value');
 * Logger.error('Failed to load data', error);
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

class LoggerClass {
  private isDevelopment: boolean;
  private errorTracker?: ErrorTracker;

  constructor() {
    // Allow logging in both development and test modes
    const mode = import.meta.env.MODE;
    this.isDevelopment = mode === 'development' || mode === 'test';
  }

  /**
   * Initialize error tracking service (e.g., Sentry)
   * @param tracker Error tracking implementation
   */
  public initErrorTracking(tracker: ErrorTracker): void {
    this.errorTracker = tracker;
  }

  /**
   * Debug-level logging (development only)
   * Use for detailed diagnostic information
   */
  public debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('debug', message, context);
    this.logToConsole(entry, 'color: #888; font-style: italic;');
  }

  /**
   * Info-level logging (development only)
   * Use for general informational messages
   */
  public info(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('info', message, context);
    this.logToConsole(entry, 'color: #0066cc; font-weight: bold;');
  }

  /**
   * Warning-level logging (development only)
   * Use for potentially problematic situations
   */
  public warn(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('warn', message, context);
    this.logToConsole(entry, 'color: #ff9900; font-weight: bold;');
  }

  /**
   * Error-level logging (all environments)
   * Use for error conditions
   */
  public error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, context, error);

    if (this.isDevelopment) {
      this.logToConsole(entry, 'color: #cc0000; font-weight: bold;');
      if (error?.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      // Production: Send to error tracking service
      this.sendToErrorTracker(entry);
    }
  }

  /**
   * Performance logging (development only)
   * Use for tracking operation duration
   */
  public perf(operation: string, durationMs: number, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const message = `${operation} completed in ${durationMs.toFixed(2)}ms`;
    const entry = this.createLogEntry('info', message, { ...context, durationMs });
    this.logToConsole(entry, 'color: #9933cc; font-weight: bold;');
  }

  /**
   * Group logging (development only)
   * Use for grouping related log messages
   */
  public group(label: string): void {
    if (!this.isDevelopment) return;
    console.group(`%c${label}`, 'color: #0066cc; font-weight: bold;');
  }

  public groupEnd(): void {
    if (!this.isDevelopment) return;
    console.groupEnd();
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    };
  }

  private logToConsole(entry: LogEntry, style: string): void {
    const prefix = `[${entry.level.toUpperCase()}]`;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    console.log(
      `%c${prefix} ${timestamp}%c ${entry.message}`,
      style,
      'color: inherit;'
    );

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('Context:', entry.context);
    }

    if (entry.error) {
      console.error('Error:', entry.error);
    }
  }

  private sendToErrorTracker(entry: LogEntry): void {
    if (this.errorTracker) {
      this.errorTracker.captureError(entry);
    } else {
      // Fallback: at least log to console in production for critical errors
      console.error(`[${entry.timestamp}] ${entry.message}`, entry.error);
    }
  }
}

/**
 * Error tracker interface for integration with services like Sentry
 */
export interface ErrorTracker {
  captureError(entry: LogEntry): void;
}

/**
 * Singleton Logger instance
 */
export const Logger = new LoggerClass();

/**
 * Type guard for checking if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
