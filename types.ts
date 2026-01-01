
export type CardColor = 'Vermelho' | 'Azul' | 'Amarelo' | 'Verde' | 'Especial';

export enum CardType {
  NUMBER = 'NUMERO',
  SKIP = 'PULAR', 
  REVERSE = 'INVERTER', 
  DRAW2 = 'COMPRAR_2', 
  DRAW4 = 'COMPRAR_4', 
  WILD = 'CORINGA', 
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
  unlockTime: number; // Em milissegundos
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

export interface GameRoom {
  id: string;
  creatorId: string;
  creatorName: string;
  maxPlayers: number;
  currentPlayers: number;
  betAmount: number;
  timePerTurn: number;
  status: 'Aguardando' | 'Em Jogo';
  arenaName: string;
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

export interface Quest {
  id: string;
  description: string;
  target: number;
  current: number;
  rewardType: 'OURO' | 'GEMAS' | 'BAU';
  rewardValue: any;
  isClaimed: boolean;
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
  inventory: string[]; 
  // Novos campos para Economia e Retenção
  quests: Quest[];
  passXP: number;
  hasPremiumPass: boolean;
  claimedPassFree: number[];
  claimedPassPremium: number[];
  profileBorder?: string;
  profileBanner?: string;
}

export interface ActiveGameState {
  deckCount: number;
  remainingDeck: Card[];
  discardPile: Card[];
  players: {
    id: string;
    name: string;
    avatar: string;
    cardCount: number;
    isBot: boolean;
  }[];
  hands: Record<string, Card[]>;
  turnIndex: number;
  direction: number;
  currentColor: CardColor;
  lastUpdate: number;
  status: 'Em Jogo' | 'Finalizado';
  winnerId?: string;
}

export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'CARREGANDO',
  LOBBY = 'SALA_ESPERA',
  ROOM_WAITING = 'AGUARDANDO_JOGADORES',
  BATTLE = 'BATALHA',
  VICTORY = 'VITORIA',
  DEFEAT = 'DERROTA',
  TROPHY_ROAD = 'CAMINHO_TROFEUS',
  ARENA_SELECTION = 'SELECAO_ARENA',
  LEADERBOARD = 'CLASSIFICACAO',
  PASS_ROYALE = 'PASS_ROYALE'
}

export type ArenaTheme = {
  name: string;
  bots: number;
  minTrophies: number;
  bgColor: string;
  banner: string;
  bossPower?: string;
};

export interface TrophyReward {
  id: string;
  trophiesRequired: number;
  type: 'OURO' | 'BAU' | 'GEMAS' | 'CHEFE' | 'CARTA' | 'BORDA' | 'BANNER';
  value: string | number;
  label: string;
}

export interface ShopItem {
  id: string;
  category: string;
  type: string;
  label: string;
  description: string;
  cost: number;
  currency: 'gold' | 'gems';
  icon: string;
}
