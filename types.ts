
export type CardColor = 'Red' | 'Blue' | 'Yellow' | 'Green' | 'Wild';

export enum CardType {
  NUMBER = 'NUMBER',
  SKIP = 'SKIP', // Freeze
  REVERSE = 'REVERSE', // The Log
  DRAW2 = 'DRAW2', // Rage
  DRAW4 = 'DRAW4', // Skeleton Army
  WILD = 'WILD', // Mirror
}

export type Rarity = 'Comum' | 'Rara' | 'Épica' | 'Lendária';

export interface CardDefinition {
  id: string;
  type: CardType;
  baseColor: CardColor;
  value?: number;
  label: string;
  rarity: Rarity;
  description: string;
}

export interface CardInstance {
  cardId: string;
  level: number;
  count: number;
}

export interface Card extends CardDefinition {
  // Versão estendida usada durante a partida (contendo IDs únicos de instância)
  instanceId: string;
  color: CardColor;
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
  collection: CardInstance[];
  activeDeck: string[]; // IDs das 8 cartas selecionadas
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
