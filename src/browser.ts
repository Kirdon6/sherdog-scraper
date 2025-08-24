import puppeteer, { Browser, Page } from 'puppeteer';
import { ScraperConfig, ScraperError } from './types';

/**
 * Simple Puppeteer browser wrapper
 */
export class BrowserClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: Required<ScraperConfig>;

  constructor(config: ScraperConfig = {}) {
    this.config = {
      rateLimit: 2000,
      timeout: 30000,
      verbose: false,
      databasePath: './data/fighters.json',
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.browser && this.page && !this.page.isClosed()) {
      return; // Already initialized
    }

    try {
      if (this.config.verbose) {
        console.log('🚀 Starting browser...');
      }

      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      await this.page.setViewport({ width: 1920, height: 1080 });

      if (this.config.verbose) {
        console.log('✅ Browser ready');
      }
    } catch (error) {
      throw new ScraperError(
        `Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`,
        'BROWSER_INIT_ERROR'
      );
    }
  }

  async navigateToFighter(fighterId: string): Promise<void> {
    if (!this.page) {
      await this.initialize();
    }

    const url = `https://www.sherdog.com/fighter/${fighterId}`;
    
    try {
      if (this.config.verbose) {
        console.log(`📄 Loading: ${url}`);
      }

      await this.page!.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: this.config.timeout 
      });

      // Wait for main content to load
      await this.page!.waitForSelector('h1', { timeout: 5000 });
      
    } catch (error) {
      throw new ScraperError(
        `Failed to navigate to fighter ${fighterId}: ${error instanceof Error ? error.message : String(error)}`,
        'NAVIGATION_ERROR'
      );
    }
  }

  async extractFighterData(): Promise<any> {
    if (!this.page) {
      throw new ScraperError('Browser not initialized', 'BROWSER_NOT_READY');
    }

    try {
      return await this.page.evaluate(() => {
        const data: any = {};
        
        // Name and nickname
        const nameEl = document.querySelector('h1 .fn');
        data.name = nameEl?.textContent?.trim() || '';
        
        const nicknameEl = document.querySelector('h1 .nickname');
        data.nickname = nicknameEl?.textContent?.trim() || '';
        
        // Record - look for pattern like "27-3-0"
        const recordEl = document.querySelector('.record');
        if (recordEl) {
          const recordText = recordEl.textContent?.trim() || '';
          const recordMatch = recordText.match(/(\d+)-(\d+)-(\d+)/);
          if (recordMatch) {
            data.record = {
              wins: parseInt(recordMatch[1]),
              losses: parseInt(recordMatch[2]),
              draws: parseInt(recordMatch[3])
            };
          }
        }
        
        // Weight class
        const weightClassEl = document.querySelector('.item.weight_class span:last-child');
        data.weightClass = weightClassEl?.textContent?.trim() || '';
        
        // Nationality
        const nationalityEl = document.querySelector('[itemprop="nationality"]');
        data.nationality = nationalityEl?.textContent?.trim() || '';
        
        // Age
        const ageEl = document.querySelector('.item.birthday .item_value');
        if (ageEl) {
          const ageText = ageEl.textContent || '';
          const ageMatch = ageText.match(/(\d+)/);
          data.age = ageMatch ? parseInt(ageMatch[1]) : null;
        }
        
        // Height and weight
        const heightEl = document.querySelector('.item.height .item_value');
        data.height = heightEl?.textContent?.trim() || '';
        
        const weightEl = document.querySelector('.item.weight .item_value');
        data.weight = weightEl?.textContent?.trim() || '';
        
        // Active status - assume active if recent fights exist
        // TODO: consider changing this to a more accurate method
        data.isActive = true; // Can be refined based on last fight date
        
        return data;
      });
    } catch (error) {
      throw new ScraperError(
        `Failed to extract fighter data: ${error instanceof Error ? error.message : String(error)}`,
        'EXTRACTION_ERROR'
      );
    }
  }

  async extractLinkedFighters(): Promise<string[]> {
    if (!this.page) {
      throw new ScraperError('Browser not initialized', 'BROWSER_NOT_READY');
    }

    try {
      return await this.page.evaluate(() => {
        const fighterIds: string[] = [];
        
        // Find all fighter links in fight history
        const fighterLinks = document.querySelectorAll('a[href*="/fighter/"]');
        
        fighterLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href) {
            const match = href.match(/\/fighter\/([^\/]+)/);
            if (match && match[1]) {
              fighterIds.push(match[1]);
            }
          }
        });
        
        // Remove duplicates
        return [...new Set(fighterIds)];
      });
    } catch (error) {
      throw new ScraperError(
        `Failed to extract linked fighters: ${error instanceof Error ? error.message : String(error)}`,
        'EXTRACTION_ERROR'
      );
    }
  }

  async waitForRateLimit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.config.rateLimit));
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      
      if (this.config.verbose) {
        console.log('🔒 Browser closed');
      }
    }
  }
}
