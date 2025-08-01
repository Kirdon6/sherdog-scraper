import puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
import {
  ScraperConfig,
  RequestOptions,
  HttpResponse,
  ScraperError,
  ScraperErrorType
} from '../models/types';

/**
 * PuppeteerClient - Browser automation client for scraping Sherdog
 * Replaces HttpClient with full browser automation to bypass Cloudflare
 */
export class PuppeteerClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: Required<ScraperConfig>;
  private sessionCookies: string[] = [];

  constructor(config: ScraperConfig = {}) {
    this.config = {
      baseUrl: 'https://www.sherdog.com',
      rateLimit: 3000, // Increased for Puppeteer
      retries: 3,
      cache: true,
      cacheTtl: 3600000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeout: 30000,
      verbose: false,
      ...config
    };
  }

  /**
   * Initialize browser and page
   */
  async initialize(): Promise<void> {
    if (this.browser && this.page && !this.page.isClosed()) {
      return; // Already initialized and valid
    }

    try {
      if (this.config.verbose) {
        console.log('🚀 Initializing Puppeteer browser...');
      }

      // Close existing browser if it exists
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (closeError) {
          // Ignore close errors
        }
        this.browser = null;
        this.page = null;
      }

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });

      this.page = await this.browser.newPage();

      // Set user agent
      await this.page.setUserAgent(this.config.userAgent);

      // Set viewport
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      if (this.config.verbose) {
        console.log('✅ Puppeteer browser initialized');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ScraperError(
        `Failed to initialize Puppeteer: ${errorMessage}`,
        ScraperErrorType.INITIALIZATION_ERROR,
        { status: 500 }
      );
    }
  }

  /**
   * Navigate to URL and get page content
   */
  async request<T = string>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    await this.initialize();

    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        if (this.config.verbose) {
          console.log(`🔍 Attempt ${attempt}: Navigating to ${fullUrl}`);
        }

        // Check if page is still valid, create new one if needed
        if (!this.page || this.page.isClosed() || !(await this.isHealthy())) {
          if (this.config.verbose) {
            console.log('🔄 Creating new page (previous page was closed or unhealthy)');
          }
          this.page = await this.browser!.newPage();
          await this.page.setUserAgent(this.config.userAgent);
          await this.page.setViewport({ width: 1920, height: 1080 });
          await this.page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          });
        }

        // Navigate to page
        const response = await this.page.goto(fullUrl, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.timeout
        });

        if (!response) {
          throw new Error('No response received');
        }

        // Check for Cloudflare blocking
        const content = await this.page!.content();
        if (content.includes('Just a moment') || content.includes('Checking your browser')) {
          throw new ScraperError(
            'Cloudflare protection detected',
            ScraperErrorType.CLOUDFLARE_BLOCKED,
            { status: 403, url: fullUrl }
          );
        }

        // Check response status
        const status = response.status();
        if (status >= 400) {
          throw new ScraperError(
            `HTTP ${status}: ${response.statusText()}`,
            status === 403 ? ScraperErrorType.CLOUDFLARE_BLOCKED : ScraperErrorType.HTTP_ERROR,
            { status, url: fullUrl }
          );
        }

        if (this.config.verbose) {
          console.log(`✅ Successfully loaded page (${status})`);
        }

        // Return response
        return {
          data: content as T,
          status,
          headers: response.headers(),
          url: fullUrl,
          duration: 0 // Puppeteer doesn't provide duration directly
        };

          } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (this.config.verbose) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Attempt ${attempt} failed: ${errorMessage}`);
      }

      // If frame is detached, close the page to force recreation on next attempt
      if (error instanceof Error && error.message.includes('detached')) {
        if (this.page && !this.page.isClosed()) {
          try {
            await this.page.close();
          } catch (closeError) {
            // Ignore close errors
          }
        }
        this.page = null;
      }

        if (attempt < this.config.retries) {
          const delay = this.calculateDelay(attempt);
          if (this.config.verbose) {
            console.log(`⏳ Waiting ${delay}ms before retry...`);
          }
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    throw this.handleError(lastError || new Error('Unknown error'));
  }

  /**
   * Get page content (alias for request)
   */
  async get<T = string>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, options);
  }

  /**
   * Evaluate JavaScript on the current page
   */
  async evaluate<T>(pageFunction: () => T): Promise<T> {
    await this.initialize();
    return this.page!.evaluate(pageFunction);
  }

  /**
   * Extract data from current page using selectors
   */
  async extractData(extractors: { [key: string]: string }): Promise<{ [key: string]: string }> {
    await this.initialize();
    
    return this.page!.evaluate((selectors) => {
      const results: { [key: string]: string } = {};
      
      for (const [key, selector] of Object.entries(selectors)) {
        const element = document.querySelector(selector);
        results[key] = element ? element.textContent?.trim() || '' : '';
      }
      
      return results;
    }, extractors);
  }

  /**
   * Wait for element to appear
   */
  async waitForSelector(selector: string, timeout: number = 5000): Promise<void> {
    await this.initialize();
    await this.page!.waitForSelector(selector, { timeout });
  }

  /**
   * Take screenshot (useful for debugging)
   */
  async screenshot(path: string): Promise<void> {
    await this.initialize();
    await this.page!.screenshot({ path: path as `${string}.png`, fullPage: true });
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl(): Promise<string> {
    await this.initialize();
    return this.page!.url();
  }

  /**
   * Clear session (cookies, cache)
   */
  async clearSession(): Promise<void> {
    if (this.page) {
      await this.page.deleteCookie(...await this.page.cookies());
      this.sessionCookies = [];
    }
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      
      if (this.config.verbose) {
        console.log('🔴 Puppeteer browser closed');
      }
    }
  }

  /**
   * Calculate progressive delay for retries
   */
  private calculateDelay(attempt: number): number {
    const baseDelay = this.config.rateLimit;
    return baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any): ScraperError {
    if (error instanceof ScraperError) {
      return error;
    }

    if (error.message?.includes('timeout')) {
      return new ScraperError(
        'Request timeout - page took too long to load',
        ScraperErrorType.TIMEOUT_ERROR,
        { status: 408 }
      );
    }

    if (error.message?.includes('detached')) {
      return new ScraperError(
        'Browser frame was detached - page may have crashed',
        ScraperErrorType.NETWORK_ERROR,
        { status: 0, retryable: true }
      );
    }

    if (error.message?.includes('net::ERR_')) {
      return new ScraperError(
        `Network error: ${error.message}`,
        ScraperErrorType.NETWORK_ERROR,
        { status: 0 }
      );
    }

    return new ScraperError(
      `Puppeteer error: ${error.message}`,
      ScraperErrorType.UNKNOWN_ERROR,
      { status: 500 }
    );
  }

  /**
   * Get session info for debugging
   */
  getSessionInfo(): { cookies: string[]; isInitialized: boolean; isHealthy: boolean } {
    const isHealthy = this.browser !== null && 
                     this.page !== null && 
                     !this.page.isClosed() && 
                     this.browser.process() !== null;
    
    return {
      cookies: this.sessionCookies,
      isInitialized: this.browser !== null && this.page !== null,
      isHealthy
    };
  }

  /**
   * Check if browser is healthy and ready for requests
   */
  private async isHealthy(): Promise<boolean> {
    try {
      if (!this.browser || !this.page) return false;
      if (this.page.isClosed()) return false;
      
      // Try a simple operation to test if page is responsive
      await this.page.evaluate(() => document.readyState);
      return true;
    } catch {
      return false;
    }
  }
}