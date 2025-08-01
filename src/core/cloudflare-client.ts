import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ScraperConfig,
  RequestOptions,
  HttpResponse,
  ScraperError,
  ScraperErrorType
} from '../models/types';

/**
 * HTTP client specifically designed to handle Cloudflare protection
 */
export class CloudflareClient {
  private client: AxiosInstance;
  private config: Required<ScraperConfig>;
  private sessionCookies: string[] = [];
  private lastRequestTime = 0;

  constructor(config: ScraperConfig = {}) {
    // Set default configuration optimized for Cloudflare
    this.config = {
      baseUrl: 'https://www.sherdog.com',
      rateLimit: 2000,
      retries: 3,
      cache: true,
      cacheTtl: 3600000, // 1 hour
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeout: 30000,
      verbose: false,
      ...config
    };

    // Create axios instance with Cloudflare-optimized configuration
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1'
      }
    });

    // Add request interceptor for session management
    this.client.interceptors.request.use(
      (config) => {
        // Add session cookies if we have them
        if (this.sessionCookies.length > 0) {
          config.headers['Cookie'] = this.sessionCookies.join('; ');
        }

        // Add referer for better authenticity
        if (config.url && !config.url.startsWith('/')) {
          config.headers['Referer'] = this.config.baseUrl;
        }

        if (this.config.verbose) {
          console.log(`[CF] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for session management
    this.client.interceptors.response.use(
      (response) => {
        // Extract and store cookies for session management
        const setCookieHeaders = response.headers['set-cookie'];
        if (setCookieHeaders) {
          this.sessionCookies = setCookieHeaders.map(cookie => cookie.split(';')[0]);
        }

        if (this.config.verbose) {
          console.log(`[CF] ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        return Promise.reject(this.handleAxiosError(error));
      }
    );
  }

  /**
   * Make an HTTP request with Cloudflare-aware retry logic
   */
  async request<T = string>(
    url: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    let lastError: Error;

    // Determine retry attempts
    const maxRetries = options.retry !== false ? this.config.retries : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Progressive delay - start longer, get shorter
        const delay = Math.max(1000, this.config.rateLimit - (attempt * 500));
        await this.sleep(delay);

        const response = await this.makeRequest<T>(url, options);
        
        return {
          data: response.data,
          status: response.status,
          headers: response.headers as Record<string, string>,
          url: response.config.url || url,
          duration: Date.now() - startTime
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof ScraperError && !error.retryable) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // For Cloudflare errors, wait longer
        if (error instanceof ScraperError && error.status === 403) {
          const cloudflareDelay = Math.min(5000 * Math.pow(2, attempt), 30000);
          console.log(`[CF] Cloudflare detected, waiting ${cloudflareDelay}ms before retry...`);
          await this.sleep(cloudflareDelay);
        } else {
          // Regular exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Make a GET request
   */
  async get<T = string>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T = string>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body: data });
  }

  /**
   * Make the actual HTTP request using axios
   */
  private async makeRequest<T>(
    url: string,
    options: RequestOptions
  ): Promise<AxiosResponse<T>> {
    const config: AxiosRequestConfig = {
      method: options.method || 'GET',
      url,
      timeout: options.timeout || this.config.timeout,
      headers: {
        ...this.client.defaults.headers as any,
        ...options.headers
      } as any
    };

    // Add query parameters
    if (options.params) {
      config.params = options.params;
    }

    // Add request body for POST/PUT requests
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method || 'GET')) {
      config.data = options.body;
    }

    return this.client.request<T>(config);
  }

  /**
   * Handle axios errors and convert them to ScraperError
   */
  private handleAxiosError(error: any): ScraperError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const url = error.config?.url || 'unknown';
      
      if (status === 404) {
        return new ScraperError(
          `Page not found: ${url}`,
          ScraperErrorType.NOT_FOUND_ERROR,
          { status, url, retryable: false }
        );
      } else if (status === 429) {
        return new ScraperError(
          `Rate limited: ${url}`,
          ScraperErrorType.RATE_LIMIT_ERROR,
          { status, url, retryable: true }
        );
      } else if (status === 403) {
        return new ScraperError(
          `Cloudflare protection: ${url}`,
          ScraperErrorType.NETWORK_ERROR,
          { status, url, retryable: true }
        );
      } else if (status >= 500) {
        return new ScraperError(
          `Server error (${status}): ${url}`,
          ScraperErrorType.NETWORK_ERROR,
          { status, url, retryable: true }
        );
      } else {
        return new ScraperError(
          `HTTP error (${status}): ${url}`,
          ScraperErrorType.NETWORK_ERROR,
          { status, url, retryable: false }
        );
      }
    } else if (error.request) {
      // Request was made but no response received
      return new ScraperError(
        `No response received: ${error.config?.url || 'unknown'}`,
        ScraperErrorType.NETWORK_ERROR,
        { url: error.config?.url, retryable: true, cause: error }
      );
    } else {
      // Something else happened
      return new ScraperError(
        `Request failed: ${error.message}`,
        ScraperErrorType.NETWORK_ERROR,
        { retryable: false, cause: error }
      );
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
  }

  /**
   * Clear session cookies
   */
  clearSession(): void {
    this.sessionCookies = [];
  }

  /**
   * Get session info
   */
  getSessionInfo(): { cookies: string[] } {
    return { cookies: [...this.sessionCookies] };
  }
} 