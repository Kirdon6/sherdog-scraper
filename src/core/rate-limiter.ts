import { RateLimiterState } from '../models/types';

/**
 * Rate limiter to ensure requests are spaced out properly
 * This prevents overwhelming the target server and reduces the chance of being blocked
 */
export class RateLimiter {
  private state: RateLimiterState;
  private rateLimitMs: number;

  constructor(rateLimitMs: number = 1000) {
    this.rateLimitMs = rateLimitMs;
    this.state = {
      lastRequest: 0,
      queue: [],
      processing: false
    };
  }

  /**
   * Wait for the rate limit to allow the next request
   * This method ensures requests are properly spaced out
   */
  async waitForNextRequest(): Promise<void> {
    return new Promise((resolve) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.state.lastRequest;
      const timeToWait = Math.max(0, this.rateLimitMs - timeSinceLastRequest);

      if (timeToWait === 0) {
        // No wait needed, proceed immediately
        this.state.lastRequest = now;
        resolve();
      } else {
        // Add to queue and wait
        this.state.queue.push(() => {
          this.state.lastRequest = Date.now();
          resolve();
        });

        // Process queue if not already processing
        if (!this.state.processing) {
          this.processQueue();
        }
      }
    });
  }

  /**
   * Process the request queue with proper timing
   */
  private async processQueue(): Promise<void> {
    if (this.state.processing || this.state.queue.length === 0) {
      return;
    }

    this.state.processing = true;

    while (this.state.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.state.lastRequest;
      const timeToWait = Math.max(0, this.rateLimitMs - timeSinceLastRequest);

      if (timeToWait > 0) {
        // Wait before processing next request
        await this.sleep(timeToWait);
      }

      // Process the next request in queue
      const nextRequest = this.state.queue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }

    this.state.processing = false;
  }

  /**
   * Execute a function with rate limiting
   * This is a convenience method that combines waiting and execution
   */
  async execute<T>(fn: () => Promise<T> | T): Promise<T> {
    await this.waitForNextRequest();
    return fn();
  }

  /**
   * Update the rate limit
   */
  setRateLimit(rateLimitMs: number): void {
    this.rateLimitMs = rateLimitMs;
  }

  /**
   * Get the current rate limit
   */
  getRateLimit(): number {
    return this.rateLimitMs;
  }

  /**
   * Get the current state of the rate limiter
   */
  getState(): RateLimiterState {
    return {
      lastRequest: this.state.lastRequest,
      queue: [...this.state.queue],
      processing: this.state.processing
    };
  }

  /**
   * Reset the rate limiter state
   * Useful for testing or when you want to start fresh
   */
  reset(): void {
    this.state = {
      lastRequest: 0,
      queue: [],
      processing: false
    };
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.state.queue.length;
  }

  /**
   * Check if the rate limiter is currently processing requests
   */
  isProcessing(): boolean {
    return this.state.processing;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Advanced rate limiter with burst handling and adaptive rate limiting
 */
export class AdaptiveRateLimiter extends RateLimiter {
  private burstLimit: number;
  private burstWindow: number;
  private requestCount: number;
  private windowStart: number;
  private adaptiveMode: boolean;
  private successCount: number;
  private failureCount: number;

  constructor(
    baseRateLimitMs: number = 1000,
    burstLimit: number = 5,
    burstWindow: number = 10000
  ) {
    super(baseRateLimitMs);
    this.burstLimit = burstLimit;
    this.burstWindow = burstWindow;
    this.requestCount = 0;
    this.windowStart = Date.now();
    this.adaptiveMode = false;
    this.successCount = 0;
    this.failureCount = 0;
  }

  /**
   * Wait for the next request with burst handling
   */
  async waitForNextRequest(): Promise<void> {
    const now = Date.now();

    // Reset burst window if needed
    if (now - this.windowStart > this.burstWindow) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    // Check burst limit
    if (this.requestCount >= this.burstLimit) {
      // Wait for the burst window to reset
      const timeToWait = this.burstWindow - (now - this.windowStart);
      if (timeToWait > 0) {
        await this.sleep(timeToWait);
        this.requestCount = 0;
        this.windowStart = Date.now();
      }
    }

    this.requestCount++;
    await super.waitForNextRequest();
  }

  /**
   * Record a successful request for adaptive rate limiting
   */
  recordSuccess(): void {
    this.successCount++;
    this.adaptiveMode = false;
  }

  /**
   * Record a failed request for adaptive rate limiting
   */
  recordFailure(): void {
    this.failureCount++;
    
    // If we're getting too many failures, slow down
    if (this.failureCount > 3 && this.successCount < 10) {
      this.adaptiveMode = true;
      const currentRate = this.getRateLimit();
      this.setRateLimit(currentRate * 2); // Double the wait time
    }
  }

  /**
   * Reset adaptive counters
   */
  resetAdaptiveCounters(): void {
    this.successCount = 0;
    this.failureCount = 0;
    this.adaptiveMode = false;
  }

  /**
   * Get adaptive statistics
   */
  getAdaptiveStats(): {
    successCount: number;
    failureCount: number;
    adaptiveMode: boolean;
    currentRateLimit: number;
  } {
    return {
      successCount: this.successCount,
      failureCount: this.failureCount,
      adaptiveMode: this.adaptiveMode,
      currentRateLimit: this.getRateLimit()
    };
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 