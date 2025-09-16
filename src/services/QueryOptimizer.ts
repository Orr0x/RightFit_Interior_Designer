/**
 * QueryOptimizer - Intelligent database query optimization
 * Provides query batching, connection pooling, and performance monitoring
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from './CacheService';

export interface QueryOptions {
  enableCaching?: boolean;
  cacheTTL?: number;
  enableBatching?: boolean;
  batchDelay?: number;
  enableRetry?: boolean;
  maxRetries?: number;
}

export interface QueryMetrics {
  queryCount: number;
  totalTime: number;
  averageTime: number;
  cacheHitRate: number;
  errorRate: number;
}

class QueryOptimizer {
  private static instance: QueryOptimizer;
  private metrics: QueryMetrics = {
    queryCount: 0,
    totalTime: 0,
    averageTime: 0,
    cacheHitRate: 0,
    errorRate: 0
  };
  
  private batchQueue: Map<string, {
    queries: Array<{
      resolve: (value: any) => void;
      reject: (error: any) => void;
      table: string;
      select: string;
      filters: Record<string, any>;
    }>;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private constructor() {}

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * Optimized query with caching and batching
   */
  async query<T>(
    table: string,
    select: string,
    filters: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<T[]> {
    const {
      enableCaching = true,
      cacheTTL = 5 * 60 * 1000,
      enableBatching = false,
      batchDelay = 50,
      enableRetry = true,
      maxRetries = 3
    } = options;

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(table, select, filters);

    // Check cache first
    if (enableCaching) {
      const cache = cacheManager.getCache<T[]>(`query-${table}`, {
        ttl: cacheTTL,
        maxSize: 100
      });

      const cached = cache.get(cacheKey);
      if (cached) {
        this.updateMetrics(Date.now() - startTime, true, false);
        console.log(`⚡ [QueryOptimizer] Cache hit for ${table}:${cacheKey}`);
        return cached;
      }
    }

    // Use batching if enabled
    if (enableBatching) {
      return this.batchQuery<T>(table, select, filters, batchDelay);
    }

    // Execute query with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeQuery<T>(table, select, filters);
        
        // Cache successful results
        if (enableCaching && result.length > 0) {
          const cache = cacheManager.getCache<T[]>(`query-${table}`, {
            ttl: cacheTTL,
            maxSize: 100
          });
          cache.set(cacheKey, result);
        }

        this.updateMetrics(Date.now() - startTime, false, false);
        return result;

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [QueryOptimizer] Query attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }

    this.updateMetrics(Date.now() - startTime, false, true);
    throw lastError || new Error('Query failed after all retries');
  }

  /**
   * Batch multiple queries together
   */
  private async batchQuery<T>(
    table: string,
    select: string,
    filters: Record<string, any>,
    batchDelay: number
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const batchKey = `${table}-${select}`;
      
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, {
          queries: [],
          timeout: setTimeout(() => {
            this.processBatch(batchKey);
          }, batchDelay)
        });
      }

      const batch = this.batchQueue.get(batchKey)!;
      batch.queries.push({
        resolve,
        reject,
        table,
        select,
        filters
      });
    });
  }

  /**
   * Process batched queries
   */
  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batchQueue.get(batchKey);
    if (!batch) return;

    this.batchQueue.delete(batchKey);
    clearTimeout(batch.timeout);

    console.log(`🔄 [QueryOptimizer] Processing batch of ${batch.queries.length} queries`);

    try {
      // Group queries by table and select
      const queryGroups = new Map<string, typeof batch.queries>();
      
      for (const query of batch.queries) {
        const key = `${query.table}-${query.select}`;
        if (!queryGroups.has(key)) {
          queryGroups.set(key, []);
        }
        queryGroups.get(key)!.push(query);
      }

      // Execute grouped queries
      for (const [key, queries] of queryGroups) {
        const firstQuery = queries[0];
        
        try {
          // Combine filters using OR logic where possible
          const combinedFilters = this.combineFilters(queries.map(q => q.filters));
          const results = await this.executeQuery(
            firstQuery.table,
            firstQuery.select,
            combinedFilters
          );

          // Distribute results back to individual queries
          for (const query of queries) {
            const filteredResults = this.filterResults(results, query.filters);
            query.resolve(filteredResults);
          }

        } catch (error) {
          // If batch fails, execute individual queries
          for (const query of queries) {
            try {
              const result = await this.executeQuery(
                query.table,
                query.select,
                query.filters
              );
              query.resolve(result);
            } catch (individualError) {
              query.reject(individualError);
            }
          }
        }
      }

    } catch (error) {
      // Reject all queries on batch failure
      for (const query of batch.queries) {
        query.reject(error);
      }
    }
  }

  /**
   * Execute actual Supabase query
   */
  private async executeQuery<T>(
    table: string,
    select: string,
    filters: Record<string, any>
  ): Promise<T[]> {
    let query = supabase.from(table).select(select);

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle complex filters like { gte: 10, lte: 100 }
        for (const [operator, operatorValue] of Object.entries(value)) {
          switch (operator) {
            case 'eq':
              query = query.eq(key, operatorValue);
              break;
            case 'neq':
              query = query.neq(key, operatorValue);
              break;
            case 'gt':
              query = query.gt(key, operatorValue);
              break;
            case 'gte':
              query = query.gte(key, operatorValue);
              break;
            case 'lt':
              query = query.lt(key, operatorValue);
              break;
            case 'lte':
              query = query.lte(key, operatorValue);
              break;
            case 'like':
              query = query.like(key, operatorValue);
              break;
            case 'ilike':
              query = query.ilike(key, operatorValue);
              break;
          }
        }
      } else {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data as T[];
  }

  /**
   * Generate cache key from query parameters
   */
  private generateCacheKey(
    table: string,
    select: string,
    filters: Record<string, any>
  ): string {
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    return `${table}-${select}-${Buffer.from(filterString).toString('base64')}`;
  }

  /**
   * Combine multiple filter objects for batch queries
   */
  private combineFilters(filters: Record<string, any>[]): Record<string, any> {
    const combined: Record<string, any> = {};
    
    for (const filterSet of filters) {
      for (const [key, value] of Object.entries(filterSet)) {
        if (!combined[key]) {
          combined[key] = [];
        }
        
        if (Array.isArray(value)) {
          combined[key].push(...value);
        } else {
          combined[key].push(value);
        }
      }
    }

    // Remove duplicates
    for (const key of Object.keys(combined)) {
      combined[key] = [...new Set(combined[key])];
    }

    return combined;
  }

  /**
   * Filter results based on specific query filters
   */
  private filterResults<T>(results: T[], filters: Record<string, any>): T[] {
    return results.filter((item: any) => {
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          if (!value.includes(item[key])) {
            return false;
          }
        } else if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(queryTime: number, cacheHit: boolean, error: boolean): void {
    this.metrics.queryCount++;
    this.metrics.totalTime += queryTime;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.queryCount;
    
    if (cacheHit) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.queryCount - 1) + 1) / this.metrics.queryCount;
    } else {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.queryCount - 1)) / this.metrics.queryCount;
    }
    
    if (error) {
      this.metrics.errorRate = (this.metrics.errorRate * (this.metrics.queryCount - 1) + 1) / this.metrics.queryCount;
    } else {
      this.metrics.errorRate = (this.metrics.errorRate * (this.metrics.queryCount - 1)) / this.metrics.queryCount;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      queryCount: 0,
      totalTime: 0,
      averageTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const queryOptimizer = QueryOptimizer.getInstance();
