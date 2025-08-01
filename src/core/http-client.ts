import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ScraperConfig,
  RequestOptions,
  HttpResponse,
  ScraperError,
  ScraperErrorType
} from '../models/types';

/**
 * HTTP client for making requests to Sherdog with retry logic and error handling
 */
export class HttpClient {
  private client: AxiosInstance;
  private config: Required<ScraperConfig>;

  constructor(config: ScraperConfig = {}) {
    // Set default configuration
    this.config = {
      baseUrl: 'https://www.sherdog.com',
      rateLimit: 1000,
      retries: 3,
      cache: true,
      cacheTtl: 3600000, // 1 hour
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeout: 30000,
      verbose: false,
      ...config
    };

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.sherdog.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.verbose) {
          console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (this.config.verbose) {
          console.log(`[HTTP] ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        return Promise.reject(this.handleAxiosError(error));
      }
    );
  }

  /**
   * Make an HTTP request with retry logic
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

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await this.sleep(delay);
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
    
    // Update axios instance if needed
    if (newConfig.baseUrl) {
      this.client.defaults.baseURL = newConfig.baseUrl;
    }
    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout;
    }
    if (newConfig.userAgent) {
      this.client.defaults.headers['User-Agent'] = newConfig.userAgent;
    }
  }
} 