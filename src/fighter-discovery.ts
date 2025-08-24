import { BrowserClient } from './browser';
import { FighterDatabaseManager } from './fighter-database';
import { DiscoveryResult, DiscoveryOptions, ScraperConfig, ScraperError } from './types';

/**
 * Fighter discovery system that builds a database starting from known fighter IDs
 */
export class FighterDiscovery {
  private browser: BrowserClient;
  private database: FighterDatabaseManager;
  private config: Required<ScraperConfig>;
  private processed: Set<string> = new Set();
  private fighterDepthMap: Map<string, number> = new Map(); // Track depth of each fighter

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
  }

  /**
   * Initialize the discovery system
   */
  async initialize(): Promise<void> {
    await this.browser.initialize();
    await this.database.initialize();
    
    if (this.config.verbose) {
      const stats = this.database.getStats();
      console.log(`📊 Database loaded: ${stats.totalFighters} fighters`);
    }
  }

  /**
   * Start BFS discovery from a known fighter ID using depth levels
   */
  async discoverFromFighter(startingFighterId: string, options: DiscoveryOptions): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      newFighters: [],
      totalProcessed: 0,
      errors: [],
      depthReached: 0,
      fightersByDepth: {}
    };

    try {
      // Initialize depth tracking
      this.fighterDepthMap.set(startingFighterId, 0);
      // BFS: Process fighters level by level
      for (let currentDepth = 0; currentDepth <= options.depth; currentDepth++) {
        const fightersAtDepth = this.getFightersAtDepth(currentDepth);

        if (fightersAtDepth.length === 0) {
          break; // No more fighters to process
        }

        result.fightersByDepth[currentDepth] = [];
        result.depthReached = currentDepth;

        if (this.config.verbose) {
          console.log(`📊 Processing depth ${currentDepth}: ${fightersAtDepth.length} fighters`);
        }

        // Process all fighters at current depth
        for (const fighterId of fightersAtDepth) {
          if (this.processed.has(fighterId) || this.database.hasFighterById(fighterId)) {
            continue;
          }

          try {
            if (this.config.verbose) {
              console.log(`🔍 Depth ${currentDepth}: Processing ${fighterId}`);
            }

            const linkedFighters = await this.processFighter(fighterId);
            result.newFighters.push(fighterId);
            result.fightersByDepth[currentDepth].push(fighterId);
            result.totalProcessed++;

            // Add linked fighters to next depth level
            if (currentDepth < options.depth) {
              for (const linkedFighterId of linkedFighters) {
                if (!this.fighterDepthMap.has(linkedFighterId) && 
                    !this.processed.has(linkedFighterId) && 
                    !this.database.hasFighterById(linkedFighterId)) {
                  this.fighterDepthMap.set(linkedFighterId, currentDepth + 1);
                }
              }
            }

            // Rate limiting
            await this.browser.waitForRateLimit();

            // Optional: Limit fighters per depth
            if (options.maxFightersPerDepth &&
                result.fightersByDepth[currentDepth].length >= options.maxFightersPerDepth) {
              if (this.config.verbose) {
                console.log(`⏹️ Reached max fighters per depth (${options.maxFightersPerDepth}) at depth ${currentDepth}`);
              }
              break;
            }

          } catch (error) {
            const errorMsg = `Failed to process ${fighterId} at depth ${currentDepth}: ${error instanceof Error ? error.message : String(error)}`;
            result.errors.push(errorMsg);
            if (this.config.verbose) {
              console.warn(`⚠️ ${errorMsg}`);
            }
          }

          this.processed.add(fighterId);
        }

        if (this.config.verbose) {
          console.log(`✅ Depth ${currentDepth} complete: ${result.fightersByDepth[currentDepth].length} new fighters`);
        }
      }

      // Save database
      await this.database.save();

      if (this.config.verbose) {
        console.log(`🎉 BFS Discovery complete:`);
        console.log(`   Total fighters: ${result.newFighters.length}`);
        console.log(`   Depth reached: ${result.depthReached}`);
        Object.entries(result.fightersByDepth).forEach(([depth, fighters]) => {
          console.log(`   Depth ${depth}: ${fighters.length} fighters`);
        });
      }

    } catch (error) {
      throw new ScraperError(
        `BFS Discovery failed: ${error instanceof Error ? error.message : String(error)}`,
        'DISCOVERY_ERROR'
      );
    }

    return result;
  }

  /**
   * Get all fighters at a specific depth level
   */
  private getFightersAtDepth(depth: number): string[] {
    const fighters: string[] = [];
    
    for (const [fighterId, fighterDepth] of this.fighterDepthMap.entries()) {
      if (fighterDepth === depth) {
        fighters.push(fighterId);
      }
    }
    
    return fighters;
  }

  /**
   * Continue discovery by processing fighters already in the database
   */
  async expandDatabase(options: DiscoveryOptions): Promise<DiscoveryResult> {
    const existingFighters = this.database.getAllFighters();
    console.log(`🔍 Existing fighters: ${existingFighters}`);
    
    if (existingFighters.length === 0) {
      throw new ScraperError('No fighters in database. Use discoverFromFighter() first.', 'NO_STARTING_POINT');
    }

    // Pick random existing fighters as starting points
    const startingPoints = this.getRandomFighters(existingFighters, Math.min(3, existingFighters.length));
    console.log(`🔍 Starting points: ${startingPoints.map(s => s.id)}`);
    
    const result: DiscoveryResult = {
      newFighters: [],
      totalProcessed: 0,
      errors: [],
      depthReached: 0,
      fightersByDepth: {}
    };

    for (const fighter of startingPoints) {
      try {
        const partialResult = await this.discoverFromFighter(fighter.id, options);
        console.log(`🔍 Partial result: ${partialResult.newFighters}`);
        
        // Merge results
        result.newFighters.push(...partialResult.newFighters);
        result.totalProcessed += partialResult.totalProcessed;
        result.errors.push(...partialResult.errors);
        result.depthReached = Math.max(result.depthReached, partialResult.depthReached);
        
        // Merge fighters by depth
        for (const [depth, fighters] of Object.entries(partialResult.fightersByDepth)) {
          const depthNum = parseInt(depth);
          if (!result.fightersByDepth[depthNum]) {
            result.fightersByDepth[depthNum] = [];
          }
          result.fightersByDepth[depthNum].push(...fighters);
        }
        
      } catch (error) {
        result.errors.push(`Failed expanding from ${fighter.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return result;
  }

  /**
   * Process a single fighter: scrape data and find linked fighters
   * Returns the list of linked fighter IDs found
   */
  private async processFighter(fighterId: string): Promise<string[]> {
    // Navigate to fighter page
    await this.browser.navigateToFighter(fighterId);

    // Extract fighter data
    const fighterData = await this.browser.extractFighterData();
    
    if (!fighterData.name) {
      throw new ScraperError(`No name found for fighter ${fighterId}`, 'INVALID_FIGHTER_DATA');
    }

    // Add to database
    this.database.addFighter(fighterData.name, fighterId, fighterData.nickname);

    // Extract linked fighters from fight history
    const linkedFighters = await this.browser.extractLinkedFighters();
    
    if (this.config.verbose) {
      console.log(`  ✅ ${fighterData.name} -> found ${linkedFighters.length} linked fighters`);
    }

    return linkedFighters;
  }

  /**
   * Get random fighters from the list
   */
  private getRandomFighters<T>(fighters: T[], count: number): T[] {
    const shuffled = [...fighters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Get current discovery stats
   */
  getStats() {
    return {
      ...this.database.getStats(),
      depthMapSize: this.fighterDepthMap.size,
      processed: this.processed.size
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.browser.close();
  }
}
