import { BaseScraper } from '../core/scraper';
import {
  Fighter,
  FighterBasicInfo,
  FightRecord,
  WeightClass,
  WinMethod,
  FighterSearchResult,
  ScraperError,
  ScraperErrorType
} from '../models/types';
import { FightResult, FightResultType } from '../models/fighter';

/**
 * Fighter scraper for extracting fighter data from Sherdog using Puppeteer
 */
export class FighterScraper extends BaseScraper {

  /**
   * Get a complete fighter profile by fighter ID or URL slug
   */
  async getFighter(fighterId: string): Promise<Fighter> {
    try {
      // Normalize the fighter ID
      const normalizedId = this.normalizeFighterId(fighterId);
      console.log('normalizedId', normalizedId);
      
      // Construct the URL
      const url = `/fighter/${normalizedId}`;
      
      // Navigate to the fighter page
      await this.request(url);
      
      // Extract basic fighter data using Puppeteer
      const basicData = await this.evaluate(() => {
        const data: { [key: string]: string } = {};
        
        // Name
        const nameEl = document.querySelector('h1 .fn');
        data.name = nameEl?.textContent?.trim() || '';
        
        // Nickname - it's in a separate h1 with nickname class
        const nicknameEl = document.querySelector('h1 .nickname');
        data.nickname = nicknameEl?.textContent?.trim() || '';
        
        // Age - find row containing "AGE" text
        const ageRow = Array.from(document.querySelectorAll('table tr')).find(row => 
          row.textContent?.includes('AGE')
        );
        const ageEl = ageRow?.querySelector('td:nth-child(2) b');
        data.age = ageEl?.textContent?.trim() || '';
        
        // Birth date - it's in the same row as age
        const birthDateEl = ageRow?.querySelector('[itemprop="birthDate"]');
        let birthDateRaw = birthDateEl?.textContent?.trim() || '';
        // Try to extract and format as YYYY-MM-DD if possible
        if (birthDateRaw) {
          // Try to match YYYY-MM-DD or similar
          const match = birthDateRaw.match(/(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/);
          if (match) {
            // Pad month and day if needed
            const year = match[1];
            const month = match[2].padStart(2, '0');
            const day = match[3].padStart(2, '0');
            data.birthDate = `${year}-${month}-${day}`;
          } else {
            // Fallback: try to parse with Date
            const d = new Date(birthDateRaw);
            if (!isNaN(d.getTime())) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              data.birthDate = `${year}-${month}-${day}`;
            } else {
              data.birthDate = birthDateRaw; // fallback to raw
            }
          }
        } else {
          data.birthDate = '';
        }
        
        // Height - find row containing "HEIGHT" text
        const heightRow = Array.from(document.querySelectorAll('table tr')).find(row => 
          row.textContent?.includes('HEIGHT')
        );
        const heightEl = heightRow?.querySelector('[itemprop="height"]');
        data.height = heightEl?.textContent?.trim() || '';
        
        // Weight - find row containing "WEIGHT" text
        const weightRow = Array.from(document.querySelectorAll('table tr')).find(row => 
          row.textContent?.includes('WEIGHT')
        );
        const weightEl = weightRow?.querySelector('[itemprop="weight"]');
        data.weight = weightEl?.textContent?.trim() || '';
        
        // Nationality
        const nationalityEl = document.querySelector('[itemprop="nationality"]');
        data.nationality = nationalityEl?.textContent?.trim() || '';
        
        // Hometown
        const hometownEl = document.querySelector('[itemprop="addressLocality"]');
        data.hometown = hometownEl?.textContent?.trim() || '';
        
        // Association - it's in a span with class "association"
        const associationEl = document.querySelector('.association span[itemprop="name"]');
        data.association = associationEl?.textContent?.trim() || '';
        
        // Weight class - it's in a link with weightclass parameter
        const weightClassEl = document.querySelector('a[href*="fightfinder?weightclass="]');
        data.weightClass = weightClassEl?.textContent?.trim() || '';
        
        return data;
      });

      // Extract record data
      const recordData = await this.evaluate(() => {
        const data: { [key: string]: string } = {};
        
        // Wins - look for .winloses.win span:last-child
        const winsEl = document.querySelector('.winloses.win span:last-child');
        data.wins = winsEl?.textContent?.trim() || '';
        
        // Losses - look for .winloses.lose span:last-child
        const lossesEl = document.querySelector('.winloses.lose span:last-child');
        data.losses = lossesEl?.textContent?.trim() || '';
        
        // No Contests - look for .winloses.nc span:last-child
        const noContestsEl = document.querySelector('.winloses.nc span:last-child');
        data.noContests = noContestsEl?.textContent?.trim() || '';
        
        return data;
      });

      // Extract win/loss breakdown
      const breakdownData = await this.evaluate(() => {
        const winMeters = document.querySelectorAll('.wins .meter');
        const lossMeters = document.querySelectorAll('.loses .meter');
        
        const extractMeterData = (meters: NodeListOf<Element>) => {
          const data: { [key: string]: { count: number; percentage: number } } = {};
          meters.forEach(meter => {
            const title = meter.previousElementSibling?.textContent?.trim();
            const count = parseInt(meter.querySelector('.pl')?.textContent || '0');
            const percentage = parseInt(meter.querySelector('.pr')?.textContent?.replace('%', '') || '0');
            
            if (title) {
              const key = title.toLowerCase().replace(/\s+/g, '_').replace('/', '_');
              data[key] = { count, percentage };
            }
          });
          return data;
        };

        return {
          wins: extractMeterData(winMeters),
          losses: extractMeterData(lossMeters)
        };
      });

      // Extract fight history
      const fightHistory = await this.evaluate(() => {
        const fightRows = document.querySelectorAll('.new_table.fighter tr:not(.table_head)');
        const fights: any[] = [];
        
        fightRows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
            const result = cells[0].querySelector('.final_result')?.textContent?.trim();
            const opponentLink = cells[1].querySelector('a');
            const eventLink = cells[2].querySelector('a');
            const dateText = cells[2].querySelector('.sub_line')?.textContent?.trim();
            const methodText = cells[3].querySelector('b')?.textContent?.trim();
            const refereeLink = cells[3].querySelector('a[href*="/referee/"]');
            const round = cells[4].textContent?.trim();
            const time = cells[5].textContent?.trim();

            if (result && opponentLink && eventLink) {
              fights.push({
                result,
                opponent: opponentLink.textContent?.trim(),
                opponentId: opponentLink.getAttribute('href')?.split('/').pop(),
                event: eventLink.textContent?.trim(),
                eventId: eventLink.getAttribute('href')?.split('/').pop(),
                date: dateText,
                method: methodText,
                referee: refereeLink?.textContent?.trim(),
                refereeId: refereeLink?.getAttribute('href')?.split('/').pop(),
                round: parseInt(round || '0'),
                time
              });
            }
          }
        });
        
        return fights;
      });

      // Parse and construct the Fighter object
      const fighter = this.constructFighterObject(basicData, recordData, breakdownData, fightHistory, normalizedId);
      
      this.logger.info('Fighter scraped successfully', { 
        fighterId: normalizedId, 
        name: fighter.basicInfo.name 
      });
      
      return fighter;
    } catch (error) {
      this.logger.error('Failed to scrape fighter', { fighterId, error });
      throw error;
    }
  }

  /**
   * Construct Fighter object from extracted data
   */
  private constructFighterObject(
    basicData: { [key: string]: string },
    recordData: { [key: string]: string },
    breakdownData: any,
    fightHistory: any[],
    fighterId: string
  ): Fighter {
    // Parse basic info
    const basicInfo: FighterBasicInfo = {
      id: fighterId,
      name: basicData.name || '',
      nickname: basicData.nickname?.replace(/[""]/g, '') || undefined,
      age: parseInt(basicData.age) || undefined,
      dateOfBirth: basicData.birthDate ? new Date(basicData.birthDate) : undefined,
      nationality: basicData.nationality || '',
      hometown: basicData.hometown || undefined,
      height: basicData.height || undefined,
      weight: basicData.weight || undefined,
      team: basicData.association || undefined,
      isActive: true,
      currentWeightClass: this.parseWeightClass(basicData.weightClass),
      isChampion: false
    };

    // Parse record
    const record: FightRecord = {
      wins: parseInt(recordData.wins) || 0,
      losses: parseInt(recordData.losses) || 0,
      draws: 0,
      noContests: parseInt(recordData.noContests) || 0,
      totalFights: 0,
      winPercentage: 0,
      winsByKo: breakdownData.wins.ko_tko?.count || 0,
      winsBySubmission: breakdownData.wins.submissions?.count || 0,
      winsByDecision: breakdownData.wins.decisions?.count || 0,
      winsByOther: breakdownData.wins.others?.count || 0,
      lossesByKo: breakdownData.losses.ko_tko?.count || 0,
      lossesBySubmission: breakdownData.losses.submissions?.count || 0,
      lossesByDecision: breakdownData.losses.decisions?.count || 0,
      lossesByOther: breakdownData.losses.others?.count || 0,
      averageFightTime: '0:00',
      finishRate: 0,
      decisionRate: 0
    };

    // Calculate totals
    record.totalFights = record.wins + record.losses + record.draws + record.noContests;
    record.winPercentage = record.totalFights > 0 ? (record.wins / record.totalFights) * 100 : 0;

    // Parse fight history
    const parsedFightHistory: FightResult[] = fightHistory.map(fight => ({
      opponent: fight.opponent,
      opponentId: fight.opponentId,
      result: this.parseFightResult(fight.result),
      method: this.parseWinMethod(fight.method),
      date: this.parseDate(fight.date),
      event: fight.event,
      eventId: fight.eventId,
      organization: 'UFC',
      weightClass: basicInfo.currentWeightClass || WeightClass.HEAVYWEIGHT,
      isMainEvent: false,
      isTitleFight: fight.event?.toLowerCase().includes('title') || false,
      isCoMainEvent: false,
      round: fight.round ? { 
        round: fight.round, 
        time: fight.time, 
        method: this.parseWinMethod(fight.method) 
      } : undefined,
      fightTime: fight.time
    }));

    // Calculate additional stats
    const stats = this.calculateFighterStats(record, parsedFightHistory);

    const fighter: Fighter = {
      basicInfo,
      record,
      fightHistory: parsedFightHistory,
      currentWeightClass: basicInfo.currentWeightClass || WeightClass.HEAVYWEIGHT,
      careerWeightClasses: [basicInfo.currentWeightClass || WeightClass.HEAVYWEIGHT],
      ...stats,
      lastUpdated: new Date(),
      dataSource: 'Sherdog'
    };

    return fighter;
  }

  /**
   * Parse fight result string to enum
   */
  private parseFightResult(result: string): FightResultType {
    const lowerResult = result.toLowerCase();
    if (lowerResult.includes('win')) return FightResultType.WIN;
    if (lowerResult.includes('loss')) return FightResultType.LOSS;
    if (lowerResult.includes('draw')) return FightResultType.DRAW;
    if (lowerResult.includes('nc') || lowerResult.includes('no contest')) return FightResultType.NO_CONTEST;
    return FightResultType.NO_CONTEST;
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    
    // Parse format like "Nov / 16 / 2024"
    const cleanDate = dateStr.replace(/\s*\/\s*/g, '/');
    const date = new Date(cleanDate);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  /**
   * Find fighter by name and return the best match
   */
  async findFighterByName(name: string, options?: {
    weightClass?: WeightClass;
  }): Promise<Fighter | null> {
    try {
      const searchResults = await this.searchFighters(name, options);
      
      if (searchResults.length === 0) {
        this.logger.warn('No fighters found with name', { name });
        return null;
      }
      
      const bestMatch = searchResults[0];
      
      this.logger.info('Found fighter by name', { 
        searchName: name, 
        foundName: bestMatch.name,
        fighterId: bestMatch.id 
      });
      
      return await this.getFighter(bestMatch.id);
    } catch (error) {
      this.logger.error('Failed to find fighter by name', { name, error });
      throw error;
    }
  }

  /**
   * Get fighter by exact URL
   */
  async getFighterByUrl(url: string): Promise<Fighter> {
    try {
      const fighterId = this.extractFighterIdFromUrl(url);
      if (!fighterId) {
        throw new Error(`Invalid fighter URL: ${url}`);
      }
      
      return await this.getFighter(fighterId);
    } catch (error) {
      this.logger.error('Failed to get fighter by URL', { url, error });
      throw error;
    }
  }

  /**
   * Search for fighters by name
   */
  async searchFighters(query: string, options?: {
    weightClass?: WeightClass;
  }): Promise<FighterSearchResult[]> {
    try {
      // Build the search URL with query parameters
      const params = new URLSearchParams({
        SearchTxt: query,
        weight: options?.weightClass || '',
        association: ''
      });
      
      const searchUrl = `/stats/fightfinder?${params.toString()}`;
      
      // Navigate to search page
      await this.request(searchUrl);
      
      // Extract search results using Puppeteer
      const results = await this.evaluate(() => {
        const searchResults: any[] = [];
        
        // Look for fighter results in the table
        const resultRows = document.querySelectorAll('table tr:not(:first-child)');
        
        resultRows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const fighterLink = cells[0].querySelector('a');
            const record = cells[1]?.textContent?.trim();
            const weightClass = cells[2]?.textContent?.trim();
            const organization = cells[3]?.textContent?.trim();
            
            if (fighterLink) {
              const href = fighterLink.getAttribute('href');
              const name = fighterLink.textContent?.trim();
              const id = href?.split('/').pop()?.split('-').pop();
              
              if (id && name) {
                searchResults.push({
                  id,
                  name,
                  record: record || '0-0-0',
                  weightClass: weightClass || '',
                  organization: organization || '',
                  isActive: true
                });
              }
            }
          }
        });
        
        return searchResults;
      });
      
      // Convert to proper FighterSearchResult format
      const formattedResults: FighterSearchResult[] = results.map(result => ({
        id: result.id,
        name: result.name,
        nickname: undefined,
        record: result.record,
        weightClass: this.parseWeightClass(result.weightClass),
        organization: this.parseOrganization(result.organization),
        isActive: result.isActive
      }));
      
      this.logger.info('Fighter search completed', { 
        query, 
        resultsCount: formattedResults.length 
      });
      
      return formattedResults;
    } catch (error) {
      this.logger.error('Failed to search fighters', { query, error });
      throw error;
    }
  }

  /**
   * Parse weight class from text
   */
  private parseWeightClass(weightClassText?: string): WeightClass {
    if (!weightClassText) return WeightClass.LIGHTWEIGHT;
    
    const lowerText = weightClassText.toLowerCase();
    if (lowerText.includes('strawweight')) return WeightClass.STRAWWEIGHT;
    if (lowerText.includes('flyweight')) return WeightClass.FLYWEIGHT;
    if (lowerText.includes('bantamweight')) return WeightClass.BANTAMWEIGHT;
    if (lowerText.includes('featherweight')) return WeightClass.FEATHERWEIGHT;
    if (lowerText.includes('lightweight')) return WeightClass.LIGHTWEIGHT;
    if (lowerText.includes('welterweight')) return WeightClass.WELTERWEIGHT;
    if (lowerText.includes('middleweight')) return WeightClass.MIDDLEWEIGHT;
    if (lowerText.includes('light heavyweight')) return WeightClass.LIGHT_HEAVYWEIGHT;
    if (lowerText.includes('heavyweight')) return WeightClass.HEAVYWEIGHT;
    if (lowerText.includes("women's strawweight")) return WeightClass.WOMENS_STRAWWEIGHT;
    if (lowerText.includes("women's flyweight")) return WeightClass.WOMENS_FLYWEIGHT;
    if (lowerText.includes("women's bantamweight")) return WeightClass.WOMENS_BANTAMWEIGHT;
    if (lowerText.includes("women's featherweight")) return WeightClass.WOMENS_FEATHERWEIGHT;
    if (lowerText.includes('catch weight')) return WeightClass.CATCH_WEIGHT;
    
    return WeightClass.LIGHTWEIGHT;
  }

  /**
   * Parse win method from text
   */
  private parseWinMethod(methodText?: string): WinMethod {
    if (!methodText) return WinMethod.DECISION;
    
    const text = methodText.toLowerCase();
    if (text.includes('unanimous decision')) return WinMethod.UNANIMOUS_DECISION;
    if (text.includes('split decision')) return WinMethod.SPLIT_DECISION;
    if (text.includes('majority decision')) return WinMethod.MAJORITY_DECISION;
    if (text.includes('technical decision')) return WinMethod.TECHNICAL_DECISION;
    if (text.includes('submission')) return WinMethod.SUBMISSION;
    if (text.includes('ko') || text.includes('knockout')) return WinMethod.KNOCKOUT;
    if (text.includes('tko')) return WinMethod.TECHNICAL_KNOCKOUT;
    if (text.includes('doctor')) return WinMethod.DOCTOR_STOPPAGE;
    if (text.includes('corner')) return WinMethod.CORNER_STOPPAGE;
    if (text.includes('dq') || text.includes('disqualification')) return WinMethod.DISQUALIFICATION;
    if (text.includes('forfeit')) return WinMethod.FORFEIT;
    return WinMethod.DECISION;
  }

  /**
   * Parse organization from text
   */
  private parseOrganization(orgText?: string): 'UFC' | 'Oktagon' {
    if (!orgText) return 'UFC';
    
    const text = orgText.toLowerCase();
    if (text.includes('oktagon')) return 'Oktagon';
    return 'UFC';
  }

  /**
   * Normalize fighter ID to handle different input formats
   */
  private normalizeFighterId(fighterId: string): string {
    if (fighterId.includes('sherdog.com/fighter/')) {
      const extracted = this.extractFighterIdFromUrl(fighterId);
      if (extracted) return extracted;
    }
    
    if (/^\d+$/.test(fighterId)) {
      return fighterId;
    }
    
    if (fighterId.includes('-')) {
      return fighterId;
    }
    
    return fighterId;
  }

  /**
   * Extract fighter ID from Sherdog URL
   */
  private extractFighterIdFromUrl(url: string): string | null {
    const match = url.match(/\/fighter\/([^\/\?]+)/);
    if (match) {
      return match[1];
    }
    return null;
  }

  /**
   * Calculate fighter statistics
   */
  private calculateFighterStats(record: FightRecord, fightHistory: FightResult[]): {
    averageFightTime: string;
    finishRate: number;
    decisionRate: number;
    winStreak: number;
    lossStreak: number;
    lastFiveResults: FightResult[];
    recentPerformance: 'Improving' | 'Declining' | 'Stable';
    averageFightsPerYear: number;
    totalFightTime: string;
  } {
    // Calculate streaks
    let winStreak = 0;
    let lossStreak = 0;
    
    for (let i = fightHistory.length - 1; i >= 0; i--) {
      if (fightHistory[i].result === FightResultType.WIN) {
        if (lossStreak > 0) break;
        winStreak++;
      } else if (fightHistory[i].result === FightResultType.LOSS) {
        if (winStreak > 0) break;
        lossStreak++;
      } else {
        break;
      }
    }
    
    // Get last 5 results
    const lastFiveResults = fightHistory.slice(-5);
    
    // Calculate finish rate
    const finishes = fightHistory.filter(f => 
      f.result === FightResultType.WIN && f.method && [WinMethod.KNOCKOUT, WinMethod.TECHNICAL_KNOCKOUT, WinMethod.SUBMISSION].includes(f.method)
    ).length;
    const finishRate = fightHistory.length > 0 ? (finishes / fightHistory.length) * 100 : 0;
    
    // Calculate decision rate
    const decisions = fightHistory.filter(f => 
      f.result === FightResultType.WIN && f.method && f.method.toString().includes('Decision')
    ).length;
    const decisionRate = fightHistory.length > 0 ? (decisions / fightHistory.length) * 100 : 0;
    
    // Determine recent performance
    const recentPerformance = this.calculateRecentPerformance(fightHistory);
    
    // Calculate average fights per year
    const firstFight = fightHistory[0]?.date;
    const lastFight = fightHistory[fightHistory.length - 1]?.date;
    const yearsActive = firstFight && lastFight ? 
      (lastFight.getTime() - firstFight.getTime()) / (1000 * 60 * 60 * 24 * 365) : 1;
    const averageFightsPerYear = yearsActive > 0 ? fightHistory.length / yearsActive : 0;
    
    return {
      averageFightTime: '0:00',
      finishRate,
      decisionRate,
      winStreak,
      lossStreak,
      lastFiveResults,
      recentPerformance,
      averageFightsPerYear,
      totalFightTime: '0:00'
    };
  }

  /**
   * Calculate recent performance trend
   */
  private calculateRecentPerformance(fightHistory: FightResult[]): 'Improving' | 'Declining' | 'Stable' {
    if (fightHistory.length < 3) return 'Stable';
    
    const recent = fightHistory.slice(-3);
    const wins = recent.filter(f => f.result === FightResultType.WIN).length;
    
    if (wins === 3) return 'Improving';
    if (wins === 0) return 'Declining';
    return 'Stable';
  }

  /**
   * Clean up resources (close browser)
   */
  async cleanup(): Promise<void> {
    await super.cleanup();
  }
}