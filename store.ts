
import { create } from 'zustand';
import { UserProfile, GameStatus } from './types';
import { INITIAL_GOLD, INITIAL_GEMS } from './constants';

interface GameStore {
  profile: UserProfile;
  gameStatus: GameStatus;
  currentArenaIndex: number;
  lastRewards: { gold: number, gems: number } | null;
  
  setGameStatus: (status: GameStatus) => void;
  addRewards: (gold: number, gems: number) => void;
  advanceArena: () => void;
  updateTrophies: (amount: number) => void;
  setLastRewards: (rewards: { gold: number, gems: number } | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  profile: {
    name: "Desafiante",
    gold: INITIAL_GOLD,
    gems: INITIAL_GEMS,
    xp: 0,
    level: 1,
    trophies: 0,
    currentArena: 0,
    unlockedCards: []
  },
  gameStatus: GameStatus.MENU,
  currentArenaIndex: 0,
  lastRewards: null,

  setGameStatus: (status) => set({ gameStatus: status }),
  
  addRewards: (gold, gems) => set((state) => ({
    profile: {
      ...state.profile,
      gold: state.profile.gold + gold,
      gems: state.profile.gems + gems,
      xp: state.profile.xp + 50
    }
  })),

  setLastRewards: (rewards) => set({ lastRewards: rewards }),

  advanceArena: () => set((state) => ({
    currentArenaIndex: Math.min(state.currentArenaIndex + 1, 9),
    profile: {
      ...state.profile,
      currentArena: Math.min(state.profile.currentArena + 1, 9)
    }
  })),

  updateTrophies: (amount) => set((state) => ({
    profile: {
      ...state.profile,
      trophies: Math.max(0, state.profile.trophies + amount)
    }
  }))
}));
