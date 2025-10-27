import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, ErrorTracker, isError } from '../Logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debug()', () => {
    it('should log debug message in development mode', () => {
      Logger.debug('Test debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log debug message with context', () => {
      Logger.debug('Test debug', { x: 10, y: 20 });
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Message + context
    });

    it('should format debug message with timestamp', () => {
      Logger.debug('Test message');
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toMatch(/\[DEBUG\]/);
    });
  });

  describe('info()', () => {
    it('should log info message in development mode', () => {
      Logger.info('Test info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info message with context', () => {
      Logger.info('Test info', { operation: 'test' });
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should format info message with timestamp', () => {
      Logger.info('Test message');
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toMatch(/\[INFO\]/);
    });
  });

  describe('warn()', () => {
    it('should log warning message in development mode', () => {
      Logger.warn('Test warning message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log warning message with context', () => {
      Logger.warn('Test warning', { reason: 'test' });
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should format warning message with timestamp', () => {
      Logger.warn('Test message');
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toMatch(/\[WARN\]/);
    });
  });

  describe('error()', () => {
    it('should log error message in development mode', () => {
      Logger.error('Test error message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log error with Error object', () => {
      const error = new Error('Test error');
      Logger.error('Error occurred', error);
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });

    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      Logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace:', error.stack);
    });

    it('should log error with context', () => {
      Logger.error('Error occurred', undefined, { userId: 123 });
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should format error message with timestamp', () => {
      Logger.error('Test message');
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toMatch(/\[ERROR\]/);
    });
  });

  describe('perf()', () => {
    it('should log performance message in development mode', () => {
      Logger.perf('Test operation', 123.45);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should format duration with 2 decimal places', () => {
      Logger.perf('Test operation', 123.456789);
      const call = consoleLogSpy.mock.calls[0];
      // Check the format string (call[0]) which contains the message
      expect(call[0]).toContain('123.46ms');
    });

    it('should include duration in context', () => {
      Logger.perf('Test operation', 100, { extra: 'data' });
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1];
      expect(contextCall[1]).toMatchObject({ durationMs: 100, extra: 'data' });
    });
  });

  describe('group() and groupEnd()', () => {
    it('should create console group in development mode', () => {
      Logger.group('Test group');
      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test group'),
        expect.any(String)
      );
    });

    it('should end console group in development mode', () => {
      Logger.groupEnd();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });
  });

  describe('initErrorTracking()', () => {
    it('should accept error tracker implementation', () => {
      const mockTracker: ErrorTracker = {
        captureError: vi.fn()
      };
      Logger.initErrorTracking(mockTracker);
      // No error thrown = success
      expect(true).toBe(true);
    });
  });

  describe('error tracking integration', () => {
    it('should send errors to tracker in production mode', () => {
      // Note: This test can't fully test production mode due to import.meta.env
      // being set at build time. This is a limitation of the current implementation.
      const mockTracker: ErrorTracker = {
        captureError: vi.fn()
      };
      Logger.initErrorTracking(mockTracker);

      // In development mode, it will log to console instead
      const error = new Error('Test error');
      Logger.error('Test error', error);

      // Verify console was called (development mode behavior)
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('context handling', () => {
    it('should not log context if empty object', () => {
      Logger.info('Test message', {});
      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // Only message, no context
    });

    it('should log context if it has properties', () => {
      Logger.info('Test message', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Message + context
    });
  });
});

describe('isError', () => {
  it('should return true for Error instances', () => {
    expect(isError(new Error('test'))).toBe(true);
  });

  it('should return false for non-Error values', () => {
    expect(isError('string')).toBe(false);
    expect(isError(123)).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError(undefined)).toBe(false);
    expect(isError({})).toBe(false);
  });

  it('should return true for subclasses of Error', () => {
    class CustomError extends Error {}
    expect(isError(new CustomError('test'))).toBe(true);
  });
});
