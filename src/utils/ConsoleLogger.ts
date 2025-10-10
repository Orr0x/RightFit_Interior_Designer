/**
 * ConsoleLogger - Automatic browser console log capture
 * Intercepts all console methods and stores logs for download
 *
 * Usage: Call setupConsoleLogger() once at app startup
 */

export interface LogEntry {
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: any[];
}

class ConsoleLoggerService {
  private logs: LogEntry[] = [];
  private isCapturing: boolean = false;
  private maxLogs: number = 5000; // Prevent memory issues

  // Store original console methods
  private originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  /**
   * Start capturing console logs
   */
  public startCapture(): void {
    if (this.isCapturing) {
      console.warn('[ConsoleLogger] Already capturing logs');
      return;
    }

    this.isCapturing = true;
    this.logs = [];

    // Intercept console.log
    console.log = (...args: any[]) => {
      this.originalConsole.log(...args);
      this.captureLog('log', args);
    };

    // Intercept console.info
    console.info = (...args: any[]) => {
      this.originalConsole.info(...args);
      this.captureLog('info', args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args);
      this.captureLog('warn', args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      this.originalConsole.error(...args);
      this.captureLog('error', args);
    };

    // Intercept console.debug
    console.debug = (...args: any[]) => {
      this.originalConsole.debug(...args);
      this.captureLog('debug', args);
    };

    this.originalConsole.info('✅ [ConsoleLogger] Log capture started');
  }

  /**
   * Stop capturing console logs and restore original methods
   */
  public stopCapture(): void {
    if (!this.isCapturing) return;

    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.isCapturing = false;
    this.originalConsole.info('⏹️ [ConsoleLogger] Log capture stopped');
  }

  /**
   * Capture a log entry
   */
  private captureLog(level: LogEntry['level'], args: any[]): void {
    // Prevent infinite loops by not logging our own messages
    const firstArg = args[0];
    if (typeof firstArg === 'string' && firstArg.includes('[ConsoleLogger]')) {
      return;
    }

    const timestamp = new Date().toISOString();
    const message = args.map(arg => this.formatArg(arg)).join(' ');

    const entry: LogEntry = {
      timestamp,
      level,
      message,
      args: args // Keep raw args for potential future use
    };

    this.logs.push(entry);

    // Prevent memory overflow
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Auto-save to localStorage as backup
    this.autoSaveToStorage();
  }

  /**
   * Format an argument for display
   */
  private formatArg(arg: any): string {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);

    try {
      return JSON.stringify(arg, null, 2);
    } catch (e) {
      return String(arg);
    }
  }

  /**
   * Auto-save logs to localStorage (backup in case of crash)
   */
  private autoSaveToStorage(): void {
    try {
      // Only save last 1000 logs to localStorage to avoid quota issues
      const recentLogs = this.logs.slice(-1000);
      localStorage.setItem('console-logger-backup', JSON.stringify(recentLogs));
    } catch (e) {
      // Ignore localStorage errors (quota exceeded, etc.)
    }
  }

  /**
   * Get current log count
   */
  public getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Get all captured logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Download logs as a text file
   */
  public downloadLogs(filename: string = 'browser-console-logs.txt'): void {
    const content = this.formatLogsForDownload();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    this.originalConsole.info(`📥 [ConsoleLogger] Downloaded ${this.logs.length} logs to ${filename}`);
  }

  /**
   * Format logs for download
   */
  private formatLogsForDownload(): string {
    const header = `
================================================================================
BROWSER CONSOLE LOGS
================================================================================
Captured: ${this.logs.length} log entries
Session Start: ${this.logs[0]?.timestamp || 'N/A'}
Session End: ${this.logs[this.logs.length - 1]?.timestamp || 'N/A'}
================================================================================

`;

    const logLines = this.logs.map(entry => {
      const levelIcon = this.getLevelIcon(entry.level);
      return `[${entry.timestamp}] ${levelIcon} [${entry.level.toUpperCase()}] ${entry.message}`;
    }).join('\n');

    const footer = `

================================================================================
END OF LOGS (${this.logs.length} entries)
================================================================================
`;

    return header + logLines + footer;
  }

  /**
   * Get icon for log level
   */
  private getLevelIcon(level: LogEntry['level']): string {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔍';
      case 'log': return '📝';
      default: return '•';
    }
  }

  /**
   * Clear all captured logs
   */
  public clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('console-logger-backup');
    this.originalConsole.info('🗑️ [ConsoleLogger] Logs cleared');
  }

  /**
   * Get summary of log counts by level
   */
  public getSummary(): Record<LogEntry['level'], number> {
    const summary: Record<LogEntry['level'], number> = {
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0
    };

    this.logs.forEach(entry => {
      summary[entry.level]++;
    });

    return summary;
  }

  /**
   * Check if currently capturing
   */
  public isActive(): boolean {
    return this.isCapturing;
  }
}

// Singleton instance
export const consoleLogger = new ConsoleLoggerService();

/**
 * Convenience function to set up console logging
 * Call this once at app startup
 */
export function setupConsoleLogger(): void {
  consoleLogger.startCapture();

  // Expose to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).consoleLogger = consoleLogger;
    (window as any).downloadLogs = () => consoleLogger.downloadLogs();
  }
}
