import { CacheEntry } from '../models/types';

/**
 * Simple in-memory cache for storing HTTP responses
 * This reduces the load on Sherdog's servers and improves performance
 */
export class Cache {
  protected cache: Map<string, CacheEntry>;
  private defaultTtl: number;
  private maxSize: number;

  constructor(defaultTtl: number = 3600000, maxSize: number = 1000) {
    this.cache = new Map();
    this.defaultTtl = defaultTtl; // 1 hour default
    this.maxSize = maxSize;
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Clean up expired entries first
    this.cleanup();

    // Check if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if a key exists in cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
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
    totalHits: number;
    totalMisses: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      totalHits: this.totalHits,
      totalMisses: this.totalMisses
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Generate a cache key from URL and options
   */
  static generateKey(url: string, options?: Record<string, any>): string {
    if (!options || Object.keys(options).length === 0) {
      return url;
    }

    // Sort options to ensure consistent keys
    const sortedOptions = Object.keys(options)
      .sort()
      .reduce((result, key) => {
        result[key] = options[key];
        return result;
      }, {} as Record<string, any>);

    return `${url}:${JSON.stringify(sortedOptions)}`;
  }

  /**
   * Check if an entry has expired
   */
  protected isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    return now - entry.timestamp > entry.ttl;
  }

  /**
   * Evict the oldest entry from cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Simple hit/miss tracking for statistics
  private totalHits = 0;
  private totalMisses = 0;

  /**
   * Calculate hit rate
   */
  private calculateHitRate(): number {
    const total = this.totalHits + this.totalMisses;
    return total === 0 ? 0 : this.totalHits / total;
  }

  /**
   * Record a cache hit
   */
  private recordHit(): void {
    this.totalHits++;
  }

  /**
   * Record a cache miss
   */
  private recordMiss(): void {
    this.totalMisses++;
  }
}

/**
 * File-based cache for persistent storage
 * This allows caching to survive application restarts
 */
export class FileCache extends Cache {
  private filePath: string;
  private fs: any;

  constructor(
    filePath: string = './cache.json',
    defaultTtl: number = 3600000,
    maxSize: number = 1000
  ) {
    super(defaultTtl, maxSize);
    this.filePath = filePath;
    
    // Try to load existing cache
    this.loadFromFile();
  }

  /**
   * Load cache from file
   */
  private async loadFromFile(): Promise<void> {
    try {
      // Dynamic import to avoid issues in browser environments
      const fs = await import('fs/promises');
      this.fs = fs;
      
      const data = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Restore cache entries
      for (const [key, entry] of Object.entries(parsed)) {
        if (!this.isExpired(entry as CacheEntry)) {
          this.cache.set(key, entry as CacheEntry);
        }
      }
    } catch (error) {
      // File doesn't exist or is invalid, start with empty cache
      console.warn('Could not load cache from file:', error);
    }
  }

  /**
   * Save cache to file
   */
  private async saveToFile(): Promise<void> {
    try {
      if (!this.fs) {
        const fs = await import('fs/promises');
        this.fs = fs;
      }

      const data = JSON.stringify(Object.fromEntries(this.cache), null, 2);
      await this.fs.writeFile(this.filePath, data, 'utf8');
    } catch (error) {
      console.error('Could not save cache to file:', error);
    }
  }

  /**
   * Override set to save to file
   */
  set<T>(key: string, data: T, ttl?: number): void {
    super.set(key, data, ttl);
    this.saveToFile();
  }

  /**
   * Override delete to save to file
   */
  delete(key: string): boolean {
    const result = super.delete(key);
    if (result) {
      this.saveToFile();
    }
    return result;
  }

  /**
   * Override clear to save to file
   */
  clear(): void {
    super.clear();
    this.saveToFile();
  }
} 