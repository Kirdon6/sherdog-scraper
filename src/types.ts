/**
 * Essential types for Sherdog scraper
 */

export interface ScraperConfig {
  /** Rate limit in milliseconds between requests (default: 2000ms) */
  rateLimit?: number;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Whether to enable verbose logging (default: false) */
  verbose?: boolean;
  /** Path to fighter database JSON file (default: './data/fighters.json') */
  databasePath?: string;
}

export interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  record: {
    wins: number;
    losses: number;
    draws: number;
  };
  weightClass?: string;
  nationality?: string;
  age?: number;
  height?: string;
  weight?: string;
  isActive: boolean;
  url: string;
}

export interface FighterSearchResult {
  id: string;
  name: string;
  nickname?: string;
  record: string;
  weightClass?: string;
  url: string;
}

export interface FighterDatabase {
  [name: string]: {
    id: string;
    nickname?: string;
    lastUpdated: string;
  };
}

export interface DiscoveryResult {
  newFighters: string[];
  totalProcessed: number;
  errors: string[];
  depthReached: number;
  fightersByDepth: { [depth: number]: string[] };
}

export interface DiscoveryOptions {
  depth: number;
  maxFightersPerDepth?: number; // Optional limit per depth level
}

export class ScraperError extends Error {
  public readonly code: string;
  
  constructor(message: string, code: string = 'SCRAPER_ERROR') {
    super(message);
    this.name = 'ScraperError';
    this.code = code;
  }
}
