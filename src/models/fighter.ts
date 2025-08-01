/**
 * Weight class enumeration
 */
export enum WeightClass {
  STRAWWEIGHT = 'Strawweight', // 115 lbs
  FLYWEIGHT = 'Flyweight', // 125 lbs
  BANTAMWEIGHT = 'Bantamweight', // 135 lbs
  FEATHERWEIGHT = 'Featherweight', // 145 lbs
  LIGHTWEIGHT = 'Lightweight', // 155 lbs
  WELTERWEIGHT = 'Welterweight', // 170 lbs
  MIDDLEWEIGHT = 'Middleweight', // 185 lbs
  LIGHT_HEAVYWEIGHT = 'Light Heavyweight', // 205 lbs
  HEAVYWEIGHT = 'Heavyweight', // 265 lbs
  WOMENS_STRAWWEIGHT = "Women's Strawweight",
  WOMENS_FLYWEIGHT = "Women's Flyweight",
  WOMENS_BANTAMWEIGHT = "Women's Bantamweight",
  WOMENS_FEATHERWEIGHT = "Women's Featherweight",
  CATCH_WEIGHT = 'Catch Weight'
}

/**
 * Fight result methods
 */
export enum FightResultType {
  WIN = 'Win',
  LOSS = 'Loss',
  DRAW = 'Draw',
  NO_CONTEST = 'No Contest'
}

/**
 * Win methods
 */
export enum WinMethod {
  DECISION = 'Decision',
  UNANIMOUS_DECISION = 'Unanimous Decision',
  SPLIT_DECISION = 'Split Decision',
  MAJORITY_DECISION = 'Majority Decision',
  TECHNICAL_DECISION = 'Technical Decision',
  SUBMISSION = 'Submission',
  KNOCKOUT = 'KO',
  TECHNICAL_KNOCKOUT = 'TKO',
  DOCTOR_STOPPAGE = 'Doctor Stoppage',
  CORNER_STOPPAGE = 'Corner Stoppage',
  DISQUALIFICATION = 'DQ',
  FORFEIT = 'Forfeit'
}

/**
 * Round information
 */
export interface Round {
  round: number;
  time: string; // e.g., "2:34"
  method: WinMethod;
}

/**
 * Individual fight result
 */
export interface FightResult {
  opponent: string;
  opponentId?: string; // Link to fighter data
  result: FightResultType;
  method?: WinMethod;
  round?: Round;
  date: Date;
  event: string;
  eventId?: string; // Link to event data
  organization: 'UFC' | 'Oktagon';
  weightClass: WeightClass;
  isMainEvent: boolean;
  isTitleFight: boolean;
  isCoMainEvent: boolean;
  fightTime?: string; // Total fight duration
  judges?: string[]; // For decisions
  scorecards?: string[]; // e.g., ["29-28", "29-28", "28-29"]
}

/**
 * Fight record statistics
 */
export interface FightRecord {
  wins: number;
  losses: number;
  draws: number;
  noContests: number;
  totalFights: number;
  winPercentage: number;
  
  // Win methods breakdown
  winsByKo: number;
  winsBySubmission: number;
  winsByDecision: number;
  winsByOther: number;
  
  // Loss methods breakdown
  lossesByKo: number;
  lossesBySubmission: number;
  lossesByDecision: number;
  lossesByOther: number;
  
  // Performance metrics
  averageFightTime: string;
  finishRate: number; // Percentage of fights won by finish
  decisionRate: number; // Percentage of fights won by decision
}

/**
 * Fighter basic information
 */
export interface FighterBasicInfo {
  id: string; // Unique identifier
  name: string;
  nickname?: string;
  age?: number;
  dateOfBirth?: Date;
  nationality: string;
  hometown?: string;
  height?: string; // e.g., "5'11"
  weight?: string; // e.g., "170 lbs"
  reach?: string; // e.g., "72 inches"
  stance?: 'Orthodox' | 'Southpaw' | 'Switch';
  team?: string;
  coach?: string;
  isActive: boolean;
  lastFightDate?: Date;
  nextFightDate?: Date;
  currentWeightClass?: WeightClass;
  ranking?: number; // Current ranking in division
  isChampion: boolean;
  championshipWeightClass?: WeightClass;
}

/**
 * Complete fighter profile
 */
export interface Fighter {
  basicInfo: FighterBasicInfo;
  record: FightRecord;
  fightHistory: FightResult[];
  currentWeightClass: WeightClass;
  careerWeightClasses: WeightClass[];
  
  // Fantasy/analytics relevant stats
  averageFightTime: string;
  finishRate: number;
  decisionRate: number;
  winStreak: number;
  lossStreak: number;
  lastFiveResults: FightResult[];
  
  // Performance trends
  recentPerformance: 'Improving' | 'Declining' | 'Stable';
  averageFightsPerYear: number;
  totalFightTime: string;
  
  // Metadata
  lastUpdated: Date;
  dataSource: 'Sherdog';
}

/**
 * Fighter search result
 */
export interface FighterSearchResult {
  id: string;
  name: string;
  nickname?: string;
  record: string; // e.g., "22-3-0"
  weightClass: WeightClass;
  organization: 'UFC' | 'Oktagon';
  isActive: boolean;
  lastFightDate?: Date;
}

/**
 * Fighter statistics for analytics
 */
export interface FighterStats {
  fighterId: string;
  totalFights: number;
  winRate: number;
  finishRate: number;
  averageFightTime: string;
  weightClassPerformance: Record<WeightClass, {
    fights: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  opponentStrength: number; // Average opponent win rate
  recentForm: number; // Performance in last 5 fights
  consistency: number; // Standard deviation of fight times
} 