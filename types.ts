
export type ThemeType = 'sea' | 'forest' | 'sky' | 'random';
export type GameLevel = 1 | 2; // 1: Isolated, 2: Positional

export interface GameTheme {
  id: ThemeType;
  name: string;
  backgroundClass: string;
  objectIcon: 'fish' | 'apple' | 'balloon';
  primaryColor: string;
}

export interface GameObjectEntity {
  id: string;
  letter: string; // The display string (could be 'ـبـ' or 'ب')
  originalLetterId: string; // The base ID ('ب') for checking matching
  isTarget: boolean;
  isBonus?: boolean; // New Bonus Flag
  startX: number; // Percentage 0-100
  startY?: number; // For forest static items
  duration: number; // Seconds
  delay: number; // Seconds
  lane?: number; // For vertical separation
  slotIndex?: number; // For grid-based positioning (Forest)
  color?: string; // Tailwind text color class for Fish theme
  spawnTime?: number; // Timestamp for speed bonus calculation
}

export type GameStateStatus = 'menu' | 'level_select' | 'playing' | 'paused' | 'gameover';

export interface GameStats {
  score: number;
  lives: number;
  wave: number;
  mistakes: string[]; // List of letters the user got wrong
  level: GameLevel;
  stars: number; // 1, 2, or 3
}

export interface LetterData {
  id: string;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
  audioUrl: string; // URL for the pronunciation audio
}
