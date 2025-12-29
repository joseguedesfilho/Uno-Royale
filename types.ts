
export type CardColor = 'Red' | 'Blue' | 'Yellow' | 'Green' | 'Wild';

export enum CardType {
  NUMBER = 'NUMBER',
  SKIP = 'SKIP', // Freeze
  REVERSE = 'REVERSE', // The Log
  DRAW2 = 'DRAW2', // Rage
  DRAW4 = 'DRAW4', // Skeleton Army
  WILD = 'WILD', // Mirror
}

export interface Card {
  id: string;
  type: CardType;
  color: CardColor;
  value?: number; // For type NUMBER
  label: string;
  imageUrl: string;
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  cards: Card[];
  avatar: string;
}

export interface UserProfile {
  name: string;
  gold: number;
  gems: number;
  xp: number;
  level: number;
  trophies: number;
  currentArena: number;
  unlockedCards: string[];
}

export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'LOADING',
  BATTLE = 'BATTLE',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT'
}

export type ArenaTheme = {
  name: string;
  bots: number;
  minTrophies: number;
  bgColor: string;
  banner: string;
};
