
export type CardColor = 'Red' | 'Blue' | 'Yellow' | 'Green' | 'Wild';

export enum CardType {
  NUMBER = 'NUMBER',
  SKIP = 'SKIP', 
  REVERSE = 'REVERSE', 
  DRAW2 = 'DRAW2', 
  DRAW4 = 'DRAW4', 
  WILD = 'WILD', 
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
  levelEffect: string;
}

export interface CardInstance {
  cardId: string;
  level: number;
  count: number;
}

export interface Card extends CardDefinition {
  instanceId: string;
  color: CardColor;
  currentLevel?: number;
}

export interface Chest {
  id: string;
  type: 'Prata' | 'Ouro' | 'Lendário';
  rarity: Rarity;
  unlockTime: number; 
  isOpening: boolean;
  startTime?: number;
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  cards: Card[];
  avatar: string;
  isBoss?: boolean;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  level: number;
  trophies: number;
  avatar: string;
  status: 'Disponível' | 'Em Partida' | 'Aguardando';
  quote?: string;
}

export interface TrophyReward {
  id: string;
  trophiesRequired: number;
  type: 'GOLD' | 'GEMS' | 'CHEST' | 'CARD' | 'BOSS';
  value: number | string;
  label: string;
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
  activeDeck: string[]; 
  chestSlots: (Chest | null)[];
  claimedRewards: string[]; 
  isFirstTime: boolean;
}

export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'LOADING',
  LOBBY = 'LOBBY',
  BATTLE = 'BATTLE',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
  TROPHY_ROAD = 'TROPHY_ROAD',
  ARENA_SELECTION = 'ARENA_SELECTION'
}

export type ArenaTheme = {
  name: string;
  bots: number;
  minTrophies: number;
  bgColor: string;
  banner: string;
  bossPower?: string;
};
