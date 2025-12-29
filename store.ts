
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, GameStatus, CardInstance } from './types';
import { INITIAL_GOLD, INITIAL_GEMS, ALL_CARDS } from './constants';

interface GameStore {
  profile: UserProfile;
  gameStatus: GameStatus;
  currentArenaIndex: number;
  lastRewards: { gold: number, gems: number, bonus: number } | null;
  
  setGameStatus: (status: GameStatus) => void;
  addRewards: (gold: number, gems: number) => void;
  advanceArena: () => void;
  updateTrophies: (amount: number) => void;
  setLastRewards: (rewards: { gold: number, gems: number, bonus: number } | null) => void;
  upgradeCard: (cardId: string) => void;
  toggleDeckCard: (cardId: string) => void;
  buyCard: (cardId: string, cost: number, currency: 'gold' | 'gems') => void;
}

const initialDeck = ALL_CARDS.slice(0, 8).map(c => c.id);
const initialCollection: CardInstance[] = ALL_CARDS.map(c => ({
  cardId: c.id,
  level: 1,
  count: 1
}));

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      profile: {
        name: "Desafiante Real",
        gold: INITIAL_GOLD,
        gems: INITIAL_GEMS,
        xp: 0,
        level: 1,
        trophies: 0,
        currentArena: 0,
        collection: initialCollection,
        activeDeck: initialDeck
      },
      gameStatus: GameStatus.MENU,
      currentArenaIndex: 0,
      lastRewards: null,

      setGameStatus: (status) => set({ gameStatus: status }),
      
      addRewards: (gold, gems) => set((state) => {
        // Bônus de 10% por nível acima do 1
        const levelBonus = Math.floor(gold * (state.profile.level - 1) * 0.1);
        const finalGold = gold + levelBonus;
        
        const totalXp = state.profile.xp + 50;
        const newLevel = Math.floor(totalXp / 1000) + 1;
        
        return {
          profile: {
            ...state.profile,
            gold: state.profile.gold + finalGold,
            gems: state.profile.gems + gems,
            xp: totalXp,
            level: newLevel
          }
        };
      }),

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
      })),

      buyCard: (cardId, cost, currency) => set((state) => {
        if (state.profile[currency] < cost) return state;
        
        const existing = state.profile.collection.find(c => c.cardId === cardId);
        const newCollection = existing 
          ? state.profile.collection.map(c => c.cardId === cardId ? { ...c, count: c.count + 1 } : c)
          : [...state.profile.collection, { cardId, level: 1, count: 1 }];

        return {
          profile: {
            ...state.profile,
            [currency]: state.profile[currency] - cost,
            collection: newCollection
          }
        };
      }),

      upgradeCard: (cardId) => set((state) => {
        const card = state.profile.collection.find(c => c.cardId === cardId);
        if (!card) return state;
        
        const cost = card.level * 500;
        if (state.profile.gold < cost) return state;

        return {
          profile: {
            ...state.profile,
            gold: state.profile.gold - cost,
            xp: state.profile.xp + (card.level * 150),
            collection: state.profile.collection.map(c => 
              c.cardId === cardId ? { ...c, level: c.level + 1 } : c
            )
          }
        };
      }),

      toggleDeckCard: (cardId) => set((state) => {
        const isSelected = state.profile.activeDeck.includes(cardId);
        if (isSelected) {
          if (state.profile.activeDeck.length <= 4) return state;
          return {
            profile: {
              ...state.profile,
              activeDeck: state.profile.activeDeck.filter(id => id !== cardId)
            }
          };
        } else {
          if (state.profile.activeDeck.length >= 8) return state;
          return {
            profile: {
              ...state.profile,
              activeDeck: [...state.profile.activeDeck, cardId]
            }
          };
        }
      })
    }),
    {
      name: 'clash-uno-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
