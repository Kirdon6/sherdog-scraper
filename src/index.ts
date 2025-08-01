// Core infrastructure exports
export { PuppeteerClient } from './core/puppeteer-client';
export { RateLimiter, AdaptiveRateLimiter } from './core/rate-limiter';
export { Cache, FileCache } from './core/cache';
export { BaseScraper } from './core/scraper';

// Utility exports
export { FighterDiscovery } from './utils/fighter-discovery';

// Type exports
export type {
  ScraperConfig,
  RequestOptions,
  HttpResponse,
  CacheEntry,
  RateLimiterState,
  LogLevel,
  LogEntry,
  ParserResult,
  ValidationResult
} from './models/types';

export { ScraperError, ScraperErrorType } from './models/types';

// Main scraper class (will be implemented in Phase 4)
import { BaseScraper } from './core/scraper';
import { ScraperConfig } from './models/types';
import { FighterScraper } from './scrapers/fighter-scraper';
import { Fighter, FighterSearchResult } from './models/types';

export class SherdogScraper extends BaseScraper {
  private fighterScraper: FighterScraper;

  constructor(config?: ScraperConfig) {
    super(config);
    this.fighterScraper = new FighterScraper(config);
  }

  // Fighter methods
  async getFighter(fighterId: string): Promise<Fighter> {
    return this.fighterScraper.getFighter(fighterId);
  }

  async getFighterByUrl(url: string): Promise<Fighter> {
    return this.fighterScraper.getFighterByUrl(url);
  }

  async findFighterByName(name: string, options?: {
    weightClass?: import('./models/fighter').WeightClass;
  }): Promise<Fighter | null> {
    return this.fighterScraper.findFighterByName(name, options);
  }

  async searchFighters(query: string, options?: {
    weightClass?: import('./models/fighter').WeightClass;
  }): Promise<FighterSearchResult[]> {
    return this.fighterScraper.searchFighters(query, options);
  }

  // Placeholder methods - will be implemented next
  async getEvent(eventId: string) {
    throw new Error('Event scraping not yet implemented');
  }

  // Cleanup method to close browser
  async cleanup(): Promise<void> {
    await this.fighterScraper.cleanup();
  }
}

// Default export
export default SherdogScraper; 