import { Logger } from '@/utils/Logger';

/**
 * CacheService - Intelligent caching layer for database queries
 * Provides TTL-based caching, batch loading, and cache warming
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
  enableBatching?: boolean; // Enable batch loading
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export class IntelligentCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly enableBatching: boolean;
  private batchQueue = new Set<string>();
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.enableBatching = options.enableBatching || false;
  }

  /**
   * Get cached value or return null if expired/missing
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count for LRU
    entry.hits++;
    return entry.data;
  }

  /**
   * Set cached value with optional TTL
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 1
    };

    this.cache.set(key, entry);
  }

  /**
   * Get multiple values at once
   */
  getMultiple(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * Set multiple values at once
   */
  setMultiple(entries: Map<string, T>, ttl?: number): void {
    for (const [key, data] of entries) {
      this.set(key, data, ttl);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    averageAge: number;
  } {
    const now = Date.now();
    let totalHits = 0;
    let totalAge = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalAge += now - entry.timestamp;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0
    };
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    let lruKey = '';
    let minHits = Infinity;
    let oldestTime = Date.now();

    // Find the entry with least hits and oldest timestamp
    for (const [key, entry] of this.cache) {
      if (entry.hits < minHits || (entry.hits === minHits && entry.timestamp < oldestTime)) {
        lruKey = key;
        minHits = entry.hits;
        oldestTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Add key to batch queue for batch loading
   */
  addToBatch(key: string): void {
    if (!this.enableBatching) return;

    this.batchQueue.add(key);
    
    // Debounce batch processing
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, 50); // 50ms debounce
  }

  /**
   * Process batch queue (override in subclasses)
   */
  protected processBatch(): void {
    // Override in subclasses to implement batch loading
    this.batchQueue.clear();
    this.batchTimeout = null;
  }

  /**
   * Warm cache with commonly used data
   */
  async warmCache(warmupData: Map<string, T>): Promise<void> {
    Logger.debug(`🔥 [IntelligentCache] Warming cache with ${warmupData.size} entries`);
    this.setMultiple(warmupData);
  }
}

/**
 * Global cache manager for different data types
 */
export class CacheManager {
  private static instance: CacheManager;
  private caches = new Map<string, IntelligentCache<any>>();

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get or create a cache for a specific data type
   */
  getCache<T>(name: string, options?: CacheOptions): IntelligentCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new IntelligentCache<T>(options));
    }
    return this.caches.get(name)!;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Cleanup expired entries in all caches
   */
  cleanupAll(): number {
    let totalCleaned = 0;
    for (const cache of this.caches.values()) {
      totalCleaned += cache.cleanup();
    }
    return totalCleaned;
  }

  /**
   * Get statistics for all caches
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, cache] of this.caches) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Start periodic cleanup
setInterval(() => {
  const cleaned = cacheManager.cleanupAll();
  if (cleaned > 0) {
    Logger.debug(`🧹 [CacheManager] Cleaned ${cleaned} expired cache entries`);
  }
}, 2 * 60 * 1000); // Cleanup every 2 minutes
