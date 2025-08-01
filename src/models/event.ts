import { WeightClass, WinMethod } from './fighter';

/**
 * Event status
 */
export enum EventStatus {
  UPCOMING = 'Upcoming',
  LIVE = 'Live',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  POSTPONED = 'Postponed'
}

/**
 * Event type
 */
export enum EventType {
  FIGHT_NIGHT = 'Fight Night',
  PAY_PER_VIEW = 'Pay Per View',
  TUF_FINALE = 'TUF Finale',
  CONTENDER_SERIES = 'Contender Series',
  CHAMPIONSHIP = 'Championship',
  REGULAR = 'Regular'
}

/**
 * Individual fight on the card
 */
export interface Fight {
  id: string;
  fighter1: {
    id: string;
    name: string;
    record: string; // e.g., "22-3-0"
    weightClass: WeightClass;
    isChampion: boolean;
  };
  fighter2: {
    id: string;
    name: string;
    record: string;
    weightClass: WeightClass;
    isChampion: boolean;
  };
  weightClass: WeightClass;
  isMainEvent: boolean;
  isCoMainEvent: boolean;
  isTitleFight: boolean;
  isPrelim: boolean;
  isEarlyPrelim: boolean;
  scheduledRounds: number;
  order: number; // Fight order on the card
  
  // Results (if event is completed)
  result?: {
    winner: 'fighter1' | 'fighter2' | 'draw' | 'no_contest';
    method: WinMethod;
    round: number;
    time: string; // e.g., "2:34"
    fightTime: string; // Total fight duration
    judges?: string[];
    scorecards?: string[]; // e.g., ["29-28", "29-28", "28-29"]
    isSubmission: boolean;
    isKnockout: boolean;
    isDecision: boolean;
    isFinish: boolean;
  };
  
  // Fantasy relevant data
  odds?: {
    fighter1Odds: number; // e.g., -150
    fighter2Odds: number; // e.g., +130
    favorite: 'fighter1' | 'fighter2' | 'even';
  };
  
  // Performance bonuses
  bonuses?: {
    performanceOfTheNight: boolean;
    fightOfTheNight: boolean;
    knockoutOfTheNight: boolean;
    submissionOfTheNight: boolean;
  };
}

/**
 * Event venue information
 */
export interface Venue {
  name: string;
  city: string;
  state?: string;
  country: string;
  capacity?: number;
  address?: string;
}

/**
 * Event timing information
 */
export interface EventTiming {
  startTime: Date;
  mainCardStartTime?: Date;
  prelimStartTime?: Date;
  earlyPrelimStartTime?: Date;
}

/**
 * Complete event information
 */
export interface Event {
  id: string;
  name: string;
  organization: 'UFC' | 'Oktagon';
  date: Date;
  status: EventStatus;
  type: EventType;
  venue: Venue;
  timing: EventTiming;
  
  // Fight card
  fights: Fight[];
  totalFights: number;
  mainCardFights: number;
  prelimFights: number;
  earlyPrelimFights: number;
  
  // Event statistics (if completed)
  statistics?: {
    totalFightTime: string;
    finishes: number;
    decisions: number;
    submissions: number;
    knockouts: number;
    averageFightTime: string;
    fightOfTheNight?: string; // Fight ID
    performanceOfTheNight?: string[]; // Fighter IDs
    knockoutOfTheNight?: string; // Fight ID
    submissionOfTheNight?: string; // Fight ID
  };
  
  // Metadata
  lastUpdated: Date;
  dataSource: 'Sherdog';
}

/**
 * Event search result
 */
export interface EventSearchResult {
  id: string;
  name: string;
  organization: 'UFC' | 'Oktagon';
  date: Date;
  status: EventStatus;
  venue: Venue;
  totalFights: number;
  isCompleted: boolean;
}

/**
 * Event statistics for analytics
 */
export interface EventStats {
  eventId: string;
  totalFights: number;
  finishRate: number;
  averageFightTime: string;
  weightClassBreakdown: Record<WeightClass, number>;
  methodBreakdown: Record<WinMethod, number>;
}

/**
 * Upcoming event with basic info
 */
export interface UpcomingEvent {
  id: string;
  name: string;
  organization: 'UFC' | 'Oktagon';
  date: Date;
  venue: Venue;
  mainEvent?: {
    fighter1: string;
    fighter2: string;
    weightClass: WeightClass;
  };
  totalFights: number;
  isConfirmed: boolean;
} 