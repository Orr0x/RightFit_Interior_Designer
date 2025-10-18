/**
 * A/B Test Logger
 *
 * Purpose: Log and compare performance of legacy vs new implementations
 *
 * Features:
 * - Track execution time
 * - Compare success rates
 * - Log errors
 * - Provide performance analytics
 *
 * Usage:
 * ```typescript
 * // Log single operation
 * await ABTestLogger.logOperation(
 *   'positioning_calculation',
 *   'new',
 *   'calculate_position',
 *   { success: true, executionTime: 12.5 }
 * );
 *
 * // Compare implementations side-by-side
 * const comparison = await ABTestLogger.compareImplementations(
 *   'positioning_calculation',
 *   'calculate_position',
 *   () => legacyFunction(),
 *   () => newFunction()
 * );
 * ```
 */

import { supabase } from '@/integrations/supabase/client';

export interface OperationResult {
  success: boolean;
  executionTime: number;
  error?: string;
  metadata?: any;
}

export interface ComparisonResult<T> {
  legacyResult: T;
  newResult: T;
  legacyTime: number;
  newTime: number;
  resultsMatch: boolean;
  performanceGain: number; // Percentage improvement (positive = new is faster)
}

export class ABTestLogger {
  private static debugMode = false;

  /**
   * Enable debug mode for verbose logging
   */
  static enableDebugMode(enable: boolean = true): void {
    this.debugMode = enable;
    if (enable) {
      console.log('[ABTest] Debug mode enabled');
    }
  }

  /**
   * Log a single operation result
   */
  static async logOperation(
    testName: string,
    variant: 'legacy' | 'new',
    operation: string,
    result: OperationResult,
    options?: {
      componentType?: string;
      viewType?: string;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase.from('ab_test_results').insert({
        test_name: testName,
        variant: variant,
        operation: operation,
        execution_time_ms: Math.round(result.executionTime),
        success: result.success,
        error_message: result.error || null,
        component_type: options?.componentType || null,
        view_type: options?.viewType || null,
        metadata: result.metadata || options?.metadata || null,
        environment: import.meta.env.MODE
      });

      if (error) {
        console.error('[ABTest] Failed to log test result:', error);
      } else if (this.debugMode) {
        console.log(`[ABTest] Logged ${variant} result for "${testName}" (${result.executionTime.toFixed(2)}ms)`);
      }
    } catch (error) {
      console.error('[ABTest] Failed to log test result:', error);
    }
  }

  /**
   * Compare legacy vs new implementation side-by-side
   * Returns comparison data and logs both results
   */
  static async compareImplementations<T>(
    testName: string,
    operation: string,
    legacyFn: () => T | Promise<T>,
    newFn: () => T | Promise<T>,
    options?: {
      componentType?: string;
      viewType?: string;
      metadata?: any;
    }
  ): Promise<ComparisonResult<T>> {
    // Run legacy
    const legacyStart = performance.now();
    let legacyResult: T;
    let legacyError: Error | null = null;

    try {
      legacyResult = await legacyFn();
    } catch (error) {
      legacyError = error as Error;
      throw error; // Re-throw to maintain original behavior
    } finally {
      const legacyTime = performance.now() - legacyStart;

      // Log legacy result
      await this.logOperation(testName, 'legacy', operation, {
        success: !legacyError,
        executionTime: legacyTime,
        error: legacyError?.message
      }, options);
    }

    // Run new
    const newStart = performance.now();
    let newResult: T;
    let newError: Error | null = null;

    try {
      newResult = await newFn();
    } catch (error) {
      newError = error as Error;
    } finally {
      const newTime = performance.now() - newStart;

      // Log new result
      await this.logOperation(testName, 'new', operation, {
        success: !newError,
        executionTime: newTime,
        error: newError?.message
      }, options);
    }

    // Calculate comparison metrics
    const legacyTime = performance.now() - legacyStart;
    const newTime = performance.now() - newStart;
    const resultsMatch = this.compareResults(legacyResult!, newResult!);
    const performanceGain = ((legacyTime - newTime) / legacyTime) * 100;

    // Log comparison summary
    if (this.debugMode) {
      console.group(`[ABTest] Comparison: "${testName}"`);
      console.log(`Legacy: ${legacyTime.toFixed(2)}ms ${legacyError ? '❌' : '✅'}`);
      console.log(`New: ${newTime.toFixed(2)}ms ${newError ? '❌' : '✅'}`);
      console.log(`Results match: ${resultsMatch ? '✅' : '❌'}`);
      console.log(`Performance gain: ${performanceGain > 0 ? '🚀' : '🐌'} ${performanceGain.toFixed(1)}%`);
      console.groupEnd();
    }

    // Warn if results don't match
    if (!resultsMatch && !newError) {
      console.warn(`[ABTest] ⚠️ Results don't match for "${testName}":`, {
        legacy: legacyResult,
        new: newResult
      });
    }

    return {
      legacyResult: legacyResult!,
      newResult: newResult!,
      legacyTime,
      newTime,
      resultsMatch,
      performanceGain
    };
  }

  /**
   * Get test summary for a specific test
   */
  static async getTestSummary(testName: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ab_test_summary')
        .select('*')
        .eq('test_name', testName);

      if (error) {
        console.error('[ABTest] Error fetching test summary:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[ABTest] Error fetching test summary:', error);
      return null;
    }
  }

  /**
   * Get all test summaries
   */
  static async getAllTestSummaries(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ab_test_summary')
        .select('*')
        .order('test_name');

      if (error) {
        console.error('[ABTest] Error fetching test summaries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ABTest] Error fetching test summaries:', error);
      return [];
    }
  }

  /**
   * Compare two values for equality
   * Handles objects, arrays, and primitives
   */
  private static compareResults(a: any, b: any): boolean {
    try {
      // Handle null/undefined
      if (a === null || a === undefined || b === null || b === undefined) {
        return a === b;
      }

      // Handle primitives
      if (typeof a !== 'object' || typeof b !== 'object') {
        return a === b;
      }

      // Handle arrays
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => this.compareResults(item, b[index]));
      }

      // Handle objects
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key => {
        // Skip functions
        if (typeof a[key] === 'function' || typeof b[key] === 'function') {
          return true;
        }
        return this.compareResults(a[key], b[key]);
      });
    } catch (error) {
      console.error('[ABTest] Error comparing results:', error);
      return false;
    }
  }

  /**
   * Clear test results for a specific test (admin only)
   */
  static async clearTestResults(testName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ab_test_results')
        .delete()
        .eq('test_name', testName);

      if (error) {
        console.error(`[ABTest] Error clearing results for "${testName}":`, error);
        return { success: false, error: error.message };
      }

      console.log(`[ABTest] ✅ Cleared results for "${testName}"`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ABTest] Error clearing results for "${testName}":`, error);
      return { success: false, error: message };
    }
  }

  /**
   * Get performance comparison between legacy and new
   */
  static async getPerformanceComparison(testName: string): Promise<{
    legacy: { avgTime: number; successRate: number };
    new: { avgTime: number; successRate: number };
    improvement: number;
  } | null> {
    try {
      const summary = await this.getTestSummary(testName);
      if (!summary || summary.length < 2) {
        return null;
      }

      const legacy = summary.find((s: any) => s.variant === 'legacy');
      const newVariant = summary.find((s: any) => s.variant === 'new');

      if (!legacy || !newVariant) {
        return null;
      }

      const improvement = ((legacy.avg_execution_time_ms - newVariant.avg_execution_time_ms) / legacy.avg_execution_time_ms) * 100;

      return {
        legacy: {
          avgTime: legacy.avg_execution_time_ms,
          successRate: legacy.success_rate
        },
        new: {
          avgTime: newVariant.avg_execution_time_ms,
          successRate: newVariant.success_rate
        },
        improvement
      };
    } catch (error) {
      console.error('[ABTest] Error getting performance comparison:', error);
      return null;
    }
  }
}

// Enable debug mode if localStorage flag is set
if (typeof localStorage !== 'undefined' && localStorage.getItem('debug_ab_testing') === 'true') {
  ABTestLogger.enableDebugMode(true);
}
