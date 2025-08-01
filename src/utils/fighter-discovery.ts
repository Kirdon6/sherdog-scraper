import { SherdogScraper } from '../index';
import { Fighter, FighterSearchResult, WeightClass } from '../models/types';

/**
 * Fighter discovery utilities to help find and manage fighter IDs
 */
export class FighterDiscovery {
  private scraper: SherdogScraper;
  private cache = new Map<string, string>(); // name -> ID mapping

  constructor(scraper: SherdogScraper) {
    this.scraper = scraper;
  }

  /**
   * Find fighter ID by name with fuzzy matching
   */
  async findFighterId(name: string, options?: {
    weightClass?: WeightClass;
  }): Promise<string | null> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(name, options);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      // Search for the fighter
      const results = await this.scraper.searchFighters(name, options);
      
      if (results.length === 0) {
        return null;
      }

      // Get the best match (first result)
      const bestMatch = results[0];
      
      // Cache the result
      this.cache.set(cacheKey, bestMatch.id);
      
      return bestMatch.id;
    } catch (error) {
      console.error('Failed to find fighter ID:', error);
      return null;
    }
  }

  /**
   * Get fighter by name (searches and returns full profile)
   */
  async getFighterByName(name: string, options?: {
    weightClass?: WeightClass;
  }): Promise<Fighter | null> {
    const fighterId = await this.findFighterId(name, options);
    
    if (!fighterId) {
      return null;
    }

    return await this.scraper.getFighter(fighterId);
  }

  /**
   * Search for fighters and return with IDs
   */
  async searchFightersWithIds(query: string, options?: {
    weightClass?: WeightClass;
    limit?: number;
  }): Promise<Array<FighterSearchResult & { fullProfile?: Fighter }>> {
    const results = await this.scraper.searchFighters(query, options);
    
    // Limit results if specified
    const limitedResults = options?.limit ? results.slice(0, options.limit) : results;
    
    // Optionally fetch full profiles for first few results
    const enhancedResults = await Promise.all(
      limitedResults.map(async (result, index) => {
        // Only fetch full profile for first 3 results to avoid too many requests
        if (index < 3) {
          try {
            const fullProfile = await this.scraper.getFighter(result.id);
            return { ...result, fullProfile };
          } catch (error) {
            console.warn(`Failed to fetch full profile for ${result.name}:`, error);
            return result;
          }
        }
        return result;
      })
    );

    return enhancedResults;
  }

  /**
   * Get popular fighters by weight class
   */
  async getPopularFighters(weightClass?: WeightClass, organization: 'UFC' | 'Oktagon' = 'UFC'): Promise<FighterSearchResult[]> {
    // Common popular fighter names to search for
    const popularNames = [
      'Conor McGregor',
      'Jon Jones', 
      'Khabib Nurmagomedov',
      'Israel Adesanya',
      'Kamaru Usman',
      'Alexander Volkanovski',
      'Charles Oliveira',
      'Dustin Poirier',
      'Max Holloway',
      'Robert Whittaker'
    ];

    const results: FighterSearchResult[] = [];
    
    for (const name of popularNames) {
      try {
                 const searchResults = await this.scraper.searchFighters(name, {
           weightClass
         });
        
        if (searchResults.length > 0) {
          results.push(searchResults[0]);
        }
      } catch (error) {
        console.warn(`Failed to search for ${name}:`, error);
      }
    }

    return results;
  }

  /**
   * Extract fighter ID from various URL formats
   */
  extractFighterIdFromUrl(url: string): string | null {
    // Handle different URL formats
    const patterns = [
      /\/fighter\/([^\/\?]+)/, // Standard Sherdog format
      /sherdog\.com\/fighter\/([^\/\?]+)/, // Full URL
      /fighter\/([^\/\?]+)/ // Relative URL
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Build Sherdog URL from fighter ID
   */
  buildFighterUrl(fighterId: string): string {
    return `https://www.sherdog.com/fighter/${fighterId}`;
  }

  /**
   * Get cache key for storing fighter ID mappings
   */
  private getCacheKey(name: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${name.toLowerCase()}-${optionsStr}`;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
} 