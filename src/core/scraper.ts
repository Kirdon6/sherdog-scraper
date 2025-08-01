import { PuppeteerClient } from './puppeteer-client';
import { RateLimiter, AdaptiveRateLimiter } from './rate-limiter';
import { Cache } from './cache';
import {
  ScraperConfig,
  RequestOptions,
  HttpResponse,
  ScraperError,
  ScraperErrorType,
  LogLevel,
  LogEntry,
  ParserResult
} from '../models/types';

/**
 * Base scraper class that provides common functionality for all scrapers
 * This includes HTTP requests, rate limiting, caching, and logging
 */
export abstract class BaseScraper {
  protected puppeteerClient: PuppeteerClient;
  protected rateLimiter: RateLimiter;
  protected cache: Cache;
  protected config: Required<ScraperConfig>;
  protected logger: Logger;

  constructor(config: ScraperConfig = {}) {
    // Set default configuration
    this.config = {
      baseUrl: 'https://www.sherdog.com',
      rateLimit: 3000, // Increased for Puppeteer
      retries: 3,
      cache: true,
      cacheTtl: 3600000, // 1 hour
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeout: 30000,
      verbose: false,
      ...config
    };

    // Initialize components
    this.puppeteerClient = new PuppeteerClient(this.config);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.cache = this.config.cache ? new Cache(this.config.cacheTtl) : new NoOpCache();
    this.logger = new Logger(this.config.verbose ? LogLevel.DEBUG : LogLevel.INFO);
  }

  /**
   * Make an HTTP request with rate limiting and caching
   */
  protected async request<T = string>(
    url: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const cacheKey = Cache.generateKey(url, options);
    
    // Check cache first
    if (this.config.cache) {
      const cached = this.cache.get<HttpResponse<T>>(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', { url, cacheKey });
        return cached;
      }
    }

    // Wait for rate limiter
    await this.rateLimiter.waitForNextRequest();

    try {
      // Make the request
      const response = await this.puppeteerClient.request<T>(url, options);
      
      // Cache the response
      if (this.config.cache) {
        this.cache.set(cacheKey, response);
      }

      // Record success for adaptive rate limiting
      if (this.rateLimiter instanceof AdaptiveRateLimiter) {
        this.rateLimiter.recordSuccess();
      }

      this.logger.debug('Request successful', { 
        url, 
        status: response.status, 
        duration: response.duration 
      });

      return response;
    } catch (error) {
      // Record failure for adaptive rate limiting
      if (this.rateLimiter instanceof AdaptiveRateLimiter) {
        this.rateLimiter.recordFailure();
      }

      this.logger.error('Request failed', { 
        url, 
        error: error instanceof Error ? error.message : String(error) 
      });

      throw error;
    }
  }

  /**
   * Make a GET request
   */
  protected async get<T = string>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  protected async post<T = string>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body: data });
  }

  /**
   * Extract data from current page using Puppeteer
   */
  protected async extractData(extractors: { [key: string]: string }): Promise<{ [key: string]: string }> {
    return this.puppeteerClient.extractData(extractors);
  }

  /**
   * Evaluate JavaScript on the current page
   */
  protected async evaluate<T>(pageFunction: () => T): Promise<T> {
    return this.puppeteerClient.evaluate(pageFunction);
  }

  /**
   * Wait for element to appear
   */
  protected async waitForSelector(selector: string, timeout?: number): Promise<void> {
    return this.puppeteerClient.waitForSelector(selector, timeout);
  }

  // Removed old Cheerio methods - now using Puppeteer's extractData and evaluate methods

  /**
   * Extract number from text, with fallback
   */
  protected extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  /**
   * Extract date from text
   */
  protected extractDate(text: string): Date | null {
    try {
      return new Date(text);
    } catch {
      return null;
    }
  }

  /**
   * Validate that required fields are present
   */
  protected validateRequired(data: any, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new ScraperError(
        `Missing required fields: ${missing.join(', ')}`,
        ScraperErrorType.VALIDATION_ERROR
      );
    }
  }

  /**
   * Clean and normalize text
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Get the current configuration
   */
  getConfig(): Required<ScraperConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ScraperConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Note: PuppeteerClient doesn't need updateConfig method
    
    if (newConfig.rateLimit) {
      this.rateLimiter.setRateLimit(newConfig.rateLimit);
    }
  }

  /**
   * Clean up resources (close browser)
   */
  async cleanup(): Promise<void> {
    await this.puppeteerClient.close();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get rate limiter statistics
   */
  getRateLimiterStats() {
    if (this.rateLimiter instanceof AdaptiveRateLimiter) {
      return this.rateLimiter.getAdaptiveStats();
    }
    return this.rateLimiter.getState();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset rate limiter
   */
  resetRateLimiter(): void {
    this.rateLimiter.reset();
    if (this.rateLimiter instanceof AdaptiveRateLimiter) {
      this.rateLimiter.resetAdaptiveCounters();
    }
  }
}

/**
 * Simple logger class for the scraper
 */
class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level > this.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    const prefix = `[${LogLevel[level]}]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    
    console.log(`${prefix} ${message}${contextStr}`);
  }
}

/**
 * No-op cache for when caching is disabled
 */
class NoOpCache extends Cache {
  constructor() {
    super(0, 0);
  }

  get<T>(): T | null {
    return null;
  }

  set<T>(): void {
    // Do nothing
  }

  has(): boolean {
    return false;
  }

  delete(): boolean {
    return false;
  }

  clear(): void {
    // Do nothing
  }

  getStats() {
    return {
      size: 0,
      maxSize: 0,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0
    };
  }
} 