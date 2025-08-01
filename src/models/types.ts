/**
 * Core configuration interface for the Sherdog scraper
 */
export interface ScraperConfig {
  /** Base URL for Sherdog (default: https://www.sherdog.com) */
  baseUrl?: string;
  /** Rate limit in milliseconds between requests (default: 1000ms) */
  rateLimit?: number;
  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number;
  /** Whether to enable caching (default: true) */
  cache?: boolean;
  /** Cache TTL in milliseconds (default: 3600000 = 1 hour) */
  cacheTtl?: number;
  /** User agent string for requests (default: custom scraper UA) */
  userAgent?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Whether to enable verbose logging (default: false) */
  verbose?: boolean;
}

/**
 * HTTP request options
 */
export interface RequestOptions {
  /** HTTP method (GET, POST, etc.) */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body for POST/PUT requests */
  body?: any;
  /** Query parameters */
  params?: Record<string, string | number>;
  /** Whether to retry on failure */
  retry?: boolean;
  /** Custom timeout for this request */
  timeout?: number;
}

/**
 * HTTP response wrapper
 */
export interface HttpResponse<T = string> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response URL (after redirects) */
  url: string;
  /** Request duration in milliseconds */
  duration: number;
}

/**
 * Error types that can occur during scraping
 */
export enum ScraperErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  CLOUDFLARE_BLOCKED = 'CLOUDFLARE_BLOCKED',
  HTTP_ERROR = 'HTTP_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Custom error class for scraper-specific errors
 */
export class ScraperError extends Error {
  public readonly type: ScraperErrorType;
  public readonly status?: number;
  public readonly url?: string;
  public readonly retryable: boolean;
  public readonly cause?: Error;

  constructor(
    message: string,
    type: ScraperErrorType,
    options: {
      status?: number;
      url?: string;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'ScraperError';
    this.type = type;
    this.status = options.status;
    this.url = options.url;
    this.retryable = options.retryable ?? this.isRetryable(type);
    this.cause = options.cause;
  }

  private isRetryable(type: ScraperErrorType): boolean {
    return [
      ScraperErrorType.NETWORK_ERROR,
      ScraperErrorType.RATE_LIMIT_ERROR,
      ScraperErrorType.TIMEOUT_ERROR,
      ScraperErrorType.CLOUDFLARE_BLOCKED
    ].includes(type);
  }
}

/**
 * Cache entry interface
 */
export interface CacheEntry<T = any> {
  /** Cached data */
  data: T;
  /** Timestamp when entry was created */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl: number;
}

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  /** Last request timestamp */
  lastRequest: number;
  /** Queue of pending requests */
  queue: Array<() => void>;
  /** Whether rate limiter is processing queue */
  processing: boolean;
}

/**
 * Log levels for the logging system
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

/**
 * Log entry interface
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional context data */
  context?: Record<string, any>;
  /** Error object if applicable */
  error?: Error;
}

/**
 * Parser result interface for HTML parsing
 */
export interface ParserResult<T = any> {
  /** Parsed data */
  data: T;
  /** Whether parsing was successful */
  success: boolean;
  /** Error message if parsing failed */
  error?: string;
  /** Raw HTML that was parsed */
  rawHtml?: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of validation errors */
  errors: string[];
  /** Validated data */
  data?: any;
}

// Re-export fighter and event types
export * from './fighter';
export * from './event';

/**
 * API response types for the scraper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  requestId?: string;
}

/**
 * Fighter API response
 */
export interface FighterApiResponse extends ApiResponse {
  data?: {
    fighter: import('./fighter').Fighter;
    relatedFighters?: import('./fighter').FighterSearchResult[];
  };
}

/**
 * Event API response
 */
export interface EventApiResponse extends ApiResponse {
  data?: {
    event: import('./event').Event;
    relatedEvents?: import('./event').EventSearchResult[];
  };
}

/**
 * Search API response
 */
export interface SearchApiResponse extends ApiResponse {
  data?: {
    fighters?: import('./fighter').FighterSearchResult[];
    events?: import('./event').EventSearchResult[];
    totalResults: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search options
 */
export interface SearchOptions extends PaginationOptions {
  query: string;
  organization?: 'UFC' | 'Oktagon';
  weightClass?: import('./fighter').WeightClass;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Filter options for data retrieval
 */
export interface FilterOptions {
  organization?: 'UFC' | 'Oktagon';
  weightClass?: import('./fighter').WeightClass;
  isActive?: boolean;
  isChampion?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  status?: import('./event').EventStatus;
  limit?: number;
  offset?: number;
} 