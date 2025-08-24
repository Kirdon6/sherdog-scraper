import { BrowserClient } from './browser';
import { FighterDatabaseManager } from './fighter-database';
import { FighterDiscovery } from './fighter-discovery';
import {
  ScraperConfig,
  Fighter,
  FighterSearchResult,
  DiscoveryResult,
  DiscoveryOptions,
  ScraperError
} from './types';

/**
 * Simple Sherdog scraper for fighter data with discovery and search capabilities
 */
export class SherdogScraper {
  private browser: BrowserClient;
  private database: FighterDatabaseManager;
  private discovery: FighterDiscovery;
  private config: Required<ScraperConfig>;

  constructor(config: ScraperConfig = {}) {
    this.config = {
      rateLimit: 2000,
      timeout: 30000,
      verbose: false,
      databasePath: './data/fighters.json',
      ...config
    };

    this.browser = new BrowserClient(this.config);
    this.database = new FighterDatabaseManager(this.config.databasePath);
    this.discovery = new FighterDiscovery(this.config);
  }

  /**
   * Initialize the scraper (must be called before use)
   */
  async initialize(): Promise<void> {
    await this.browser.initialize();
    await this.database.initialize();
    
    if (this.config.verbose) {
      const stats = this.database.getStats();
      console.log(`🥊 Sherdog Scraper initialized with ${stats.totalFighters} fighters in database`);
    }
  }

  /**
   * Get complete fighter data by fighter ID
   */
  async getFighter(fighterId: string): Promise<Fighter> {
    try {
      await this.browser.navigateToFighter(fighterId);
      const data = await this.browser.extractFighterData();
      
      if (!data.name) {
        throw new ScraperError(`Fighter not found: ${fighterId}`, 'FIGHTER_NOT_FOUND');
      }

      const fighter: Fighter = {
        id: fighterId,
        name: data.name,
        nickname: data.nickname,
        record: data.record || { wins: 0, losses: 0, draws: 0 },
        weightClass: data.weightClass,
        nationality: data.nationality,
        age: data.age,
        height: data.height,
        weight: data.weight,
        isActive: data.isActive || true,
        url: `https://www.sherdog.com/fighter/${fighterId}`
      };

      // Add/update in database
      this.database.addFighter(fighter.name, fighter.id, fighter.nickname);
      await this.database.save();

      return fighter;

    } catch (error) {
      throw new ScraperError(
        `Failed to get fighter ${fighterId}: ${error instanceof Error ? error.message : String(error)}`,
        'SCRAPING_ERROR'
      );
    }
  }

  /**
   * Get fighter by full Sherdog URL
   */
  async getFighterByUrl(url: string): Promise<Fighter> {
    const match = url.match(/\/fighter\/([^\/]+)/);
    if (!match) {
      throw new ScraperError(`Invalid Sherdog URL: ${url}`, 'INVALID_URL');
    }
    
    return this.getFighter(match[1]);
  }

  /**
   * Search for fighters by name (uses local database)
   */
  searchFighters(query: string): FighterSearchResult[] {
    const results = this.database.searchFighters(query);
    
    return results.map(result => ({
      id: result.id,
      name: result.name,
      nickname: result.nickname,
      record: '', // Would need to fetch from web for full record
      weightClass: undefined, // Would need to fetch from web
      url: `https://www.sherdog.com/fighter/${result.id}`
    }));
  }

  /**
   * Find fighter by exact name match (uses local database)
   */
  findFighterByName(name: string): { id: string; nickname?: string } | null {
    const results = this.database.searchFighters(name);
    
    // Look for exact match first
    const exactMatch = results.find(r => 
      r.name.toLowerCase() === name.toLowerCase() ||
      (r.nickname && r.nickname.toLowerCase() === name.toLowerCase())
    );
    
    return exactMatch || (results.length > 0 ? results[0] : null);
  }

  /**
   * Build fighter database using BFS starting from known fighter IDs
   * Example: await scraper.buildDatabase(['Jon-Jones-27944'], { depth: 2 })
   */
  async buildDatabase(startingFighterIds: string[], options: DiscoveryOptions): Promise<DiscoveryResult> {
    await this.discovery.initialize();
    
    const results: DiscoveryResult = {
      newFighters: [],
      totalProcessed: 0,
      errors: [],
      depthReached: 0,
      fightersByDepth: {}
    };

    for (const startingId of startingFighterIds) {
      console.log(`Starting discovery from ${startingId}`);
      try {
        const partialResult = await this.discovery.discoverFromFighter(startingId, options);
        console.log(`Partial result: ${JSON.stringify(partialResult)}`);
        
        // Merge results
        results.newFighters.push(...partialResult.newFighters);
        results.totalProcessed += partialResult.totalProcessed;
        results.errors.push(...partialResult.errors);
        results.depthReached = Math.max(results.depthReached, partialResult.depthReached);
        
        // Merge fighters by depth
        for (const [depth, fighters] of Object.entries(partialResult.fightersByDepth)) {
          const depthNum = parseInt(depth);
          if (!results.fightersByDepth[depthNum]) {
            results.fightersByDepth[depthNum] = [];
          }
          results.fightersByDepth[depthNum].push(...fighters);
        }
        
      } catch (error) {
        results.errors.push(`Failed starting from ${startingId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return results;
  }

  /**
   * Expand existing database by discovering more fighters using BFS
   */
  async expandDatabase(options: DiscoveryOptions): Promise<DiscoveryResult> {
    await this.discovery.initialize();
    return this.discovery.expandDatabase(options);
  }

  /**
   * Get database statistics
   */
  getDatabaseStats() {
    return this.database.getStats();
  }

  /**
   * Get all fighters in database (for export/backup)
   */
  getAllFighters() {
    return this.database.getAllFighters();
  }

  /**
   * Export database to JSON string
   */
  exportDatabase(): string {
    const fighters = this.database.getAllFighters();
    return JSON.stringify(fighters, null, 2);
  }

  /**
   * Clean up resources (close browser)
   */
  async cleanup(): Promise<void> {
    await this.browser.close();
    await this.discovery.cleanup();
  }
}

// Export classes
export {
  BrowserClient,
  FighterDatabaseManager,
  FighterDiscovery,
  ScraperError
};

// Export types
export type {
  ScraperConfig,
  Fighter,
  FighterSearchResult,
  DiscoveryResult,
  DiscoveryOptions
};

// Default export
export default SherdogScraper;