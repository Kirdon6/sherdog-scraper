import * as fs from 'fs/promises';
import * as path from 'path';
import { FighterDatabase, ScraperError } from './types';

/**
 * Simple JSON database for storing fighter name-to-ID mappings
 */
export class FighterDatabaseManager {
  private databasePath: string;
  private database: FighterDatabase = {};

  constructor(databasePath: string = './data/fighters.json') {
    this.databasePath = databasePath;
  }

  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.databasePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Load existing database
      await this.load();
      
      // If database is empty, try to load starter database
      if (Object.keys(this.database).length === 0) {
        await this.loadStarterDatabase();
      }
    } catch (error) {
      console.warn('Could not initialize database, starting fresh');
      this.database = {};
    }
  }

  private async loadStarterDatabase(): Promise<void> {
    try {
      // Try to load from package's starter database
      const starterPath = path.join(__dirname, '../data/fighters-starter.json');
      const data = await fs.readFile(starterPath, 'utf8');
      this.database = JSON.parse(data);
      
      // Save to user's database location
      await this.save();
      
      console.log('📦 Loaded starter database with popular fighters');
    } catch (error) {
      // Starter database not found, that's okay
      console.log('💡 No starter database found, starting with empty database');
    }
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.databasePath, 'utf8');
      this.database = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty database
      this.database = {};
    }
  }

  async save(): Promise<void> {
    try {
      const data = JSON.stringify(this.database, null, 2);
      await fs.writeFile(this.databasePath, data, 'utf8');
    } catch (error) {
      throw new ScraperError(
        `Failed to save database: ${error instanceof Error ? error.message : String(error)}`,
        'DATABASE_SAVE_ERROR'
      );
    }
  }

  addFighter(name: string, id: string, nickname?: string): void {
    const normalizedName = this.normalizeName(name);
    this.database[normalizedName] = {
      id,
      nickname,
      lastUpdated: new Date().toISOString()
    };
  }

  findFighterById(searchId: string): { name: string; nickname?: string } | null {
    for (const [name, data] of Object.entries(this.database)) {
      if (data.id === searchId) {
        return { name, nickname: data.nickname };
      }
    }
    return null;
  }

  searchFighters(query: string): Array<{ name: string; id: string; nickname?: string }> {
    const normalizedQuery = this.normalizeName(query);
    const results: Array<{ name: string; id: string; nickname?: string }> = [];

    for (const [name, data] of Object.entries(this.database)) {
      // Exact match
      if (name === normalizedQuery) {
        results.unshift({ name, id: data.id, nickname: data.nickname });
        continue;
      }
      
      // Partial match in name
      if (name.includes(normalizedQuery)) {
        results.push({ name, id: data.id, nickname: data.nickname });
        continue;
      }
      
      // Partial match in nickname
      if (data.nickname && this.normalizeName(data.nickname).includes(normalizedQuery)) {
        results.push({ name, id: data.id, nickname: data.nickname });
      }
    }

    return results.slice(0, 20); // Limit results
  }

  hasFighter(name: string): boolean {
    const normalizedName = this.normalizeName(name);
    return normalizedName in this.database;
  }

  hasFighterById(id: string): boolean {
    return Object.values(this.database).some(fighter => fighter.id === id);
  }

  getStats(): { totalFighters: number; lastUpdated?: string } {
    const fighters = Object.values(this.database);
    const lastUpdated = fighters.length > 0 
      ? fighters.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0].lastUpdated
      : undefined;

    return {
      totalFighters: fighters.length,
      lastUpdated
    };
  }

  getAllFighters(): Array<{ name: string; id: string; nickname?: string; lastUpdated: string }> {
    return Object.entries(this.database).map(([name, data]) => ({
      name,
      id: data.id,
      nickname: data.nickname,
      lastUpdated: data.lastUpdated
    }));
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize spaces
  }
}
