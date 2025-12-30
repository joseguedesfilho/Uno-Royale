
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, GameStatus, CardInstance, Chest, TrophyReward, LobbyPlayer } from './types.ts';
import { INITIAL_GOLD, INITIAL_GEMS, ALL_CARDS, TROPHY_ROAD_REWARDS, ARENAS } from './constants.tsx';

interface GameStore {
  profile: UserProfile;
  gameStatus: GameStatus;
  currentArenaIndex: number;
  isBossBattle: boolean;
  activeBossRewardId: string | null;
  isRanked: boolean;
  lastRewards: { gold: number, gems: number, bonus: number, chestAcquired: boolean } | null;
  lobbyPlayers: LobbyPlayer[];
  
  setGameStatus: (status: GameStatus) => void;
  addRewards: (gold: number, gems: number, xpAmount?: number) => void;
  advanceArena: () => void;
  updateTrophies: (amount: number) => void;
  setLastRewards: (rewards: any) => void;
  upgradeCard: (cardId: string) => void;
  toggleDeckCard: (cardId: string) => void;
  buyCard: (cardId: string, cost: number, currency: 'gold' | 'gems', qty?: number) => void;
  buyGoldPack: () => void;
  addChest: (type: Chest['type']) => boolean;
  startOpeningChest: (slotIndex: number) => void;
  collectChest: (slotIndex: number) => void;
  claimTrophyReward: (rewardId: string) => void;
  startBossBattle: (arenaIndex: number, rewardId: string, isBoss: boolean) => void;
  startRankedLobby: () => void;
  startArenaBattle: (arenaIndex: number) => void;
  setLobbyPlayers: (players: LobbyPlayer[]) => void;
  quitGame: () => void;
  completeOnboarding: () => void;
  resetBattle: () => void;
}

const initialDeck = ALL_CARDS.slice(0, 8).map(c => c.id);
const initialCollection: CardInstance[] = ALL_CARDS.map(c => ({
  cardId: c.id,
  level: 1,
  count: 5 
}));

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      profile: {
        name: "Desafiante",
        gold: INITIAL_GOLD,
        gems: INITIAL_GEMS,
        xp: 0,
        level: 1,
        trophies: 0,
        currentArena: 0,
        collection: initialCollection,
        activeDeck: initialDeck,
        chestSlots: [null, null, null, null],
        claimedRewards: [],
        isFirstTime: true
      },
      gameStatus: GameStatus.MENU,
      currentArenaIndex: 0,
      isBossBattle: false,
      activeBossRewardId: null,
      isRanked: false,
      lastRewards: null,
      lobbyPlayers: [],

      setGameStatus: (status) => set({ gameStatus: status }),
      
      addRewards: (gold, gems, xpAmount = 50) => set((state) => {
        const totalXp = Math.max(0, state.profile.xp + xpAmount);
        const newLevel = Math.floor(totalXp / 1000) + 1;
        return {
          profile: {
            ...state.profile,
            gold: state.profile.gold + gold,
            gems: state.profile.gems + gems,
            xp: totalXp,
            level: newLevel
          }
        };
      }),

      setLastRewards: (rewards) => set({ lastRewards: rewards }),

      advanceArena: () => set((state) => ({
        currentArenaIndex: Math.min(state.currentArenaIndex + 1, ARENAS.length - 1),
        profile: {
          ...state.profile,
          currentArena: Math.min(state.profile.currentArena + 1, ARENAS.length - 1)
        }
      })),

      updateTrophies: (amount) => set((state) => ({
        profile: {
          ...state.profile,
          trophies: Math.max(0, state.profile.trophies + amount)
        }
      })),

      addChest: (type) => {
        const slots = get().profile.chestSlots;
        const emptyIndex = slots.findIndex(s => s === null);
        if (emptyIndex === -1) return false;

        const unlockMinutes = type === 'Prata' ? 180 : type === 'Ouro' ? 480 : 1440;
        const newChest: Chest = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          rarity: type === 'Prata' ? 'Comum' : type === 'Ouro' ? 'Rara' : 'Lendária',
          unlockTime: unlockMinutes * 60 * 1000, 
          isOpening: false
        };

        set(state => {
          const newSlots = [...state.profile.chestSlots];
          newSlots[emptyIndex] = newChest;
          return { profile: { ...state.profile, chestSlots: newSlots } };
        });
        return true;
      },

      startOpeningChest: (index) => set(state => {
        const slots = [...state.profile.chestSlots];
        const chest = slots[index];
        if (!chest || chest.isOpening) return state;
        const isAlreadyOpening = slots.some(s => s?.isOpening);
        if (isAlreadyOpening) return state;
        slots[index] = { ...chest, isOpening: true, startTime: Date.now() };
        return { profile: { ...state.profile, chestSlots: slots } };
      }),

      collectChest: (index) => set(state => {
        const chest = state.profile.chestSlots[index];
        if (!chest) return state;
        const timeLeft = (chest.startTime || 0) + chest.unlockTime - Date.now();
        if (timeLeft > 0) return state;
        let goldReward = chest.type === 'Prata' ? 100 : chest.type === 'Ouro' ? 500 : 2500;
        let gemReward = chest.type === 'Prata' ? 2 : chest.type === 'Ouro' ? 10 : 50;
        const newCollection = [...state.profile.collection];
        const randomCardId = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)].id;
        const cardIdx = newCollection.findIndex(c => c.cardId === randomCardId);
        newCollection[cardIdx].count += 10;
        const newSlots = [...state.profile.chestSlots];
        newSlots[index] = null;
        return {
          profile: {
            ...state.profile,
            gold: state.profile.gold + goldReward,
            gems: state.profile.gems + gemReward,
            collection: newCollection,
            chestSlots: newSlots
          }
        };
      }),

      claimTrophyReward: (rewardId) => set(state => {
        if (state.profile.claimedRewards.includes(rewardId)) return state;
        const reward = TROPHY_ROAD_REWARDS.find(r => r.id === rewardId);
        if (!reward) return state;
        const p = { ...state.profile };
        p.claimedRewards = [...p.claimedRewards, rewardId];
        p.xp += 150; 
        p.level = Math.floor(p.xp / 1000) + 1;
        if (reward.type === 'GOLD') p.gold += (reward.value as number);
        if (reward.type === 'GEMS') p.gems += (reward.value as number);
        if (reward.type === 'CARD') {
          const cardId = reward.value as string;
          p.collection = p.collection.map(c => c.cardId === cardId ? { ...c, count: c.count + 5 } : c);
        }
        return { profile: p };
      }),

      startBossBattle: (arenaIdx, rewardId, isBoss) => set({
        gameStatus: GameStatus.LOADING,
        isBossBattle: isBoss,
        activeBossRewardId: rewardId,
        isRanked: false,
        currentArenaIndex: arenaIdx
      }),

      startRankedLobby: () => set({
        gameStatus: GameStatus.LOBBY,
        isRanked: true,
        isBossBattle: false,
        currentArenaIndex: get().profile.currentArena
      }),

      startArenaBattle: (arenaIndex) => set({
        gameStatus: GameStatus.LOADING,
        isRanked: false,
        isBossBattle: false,
        currentArenaIndex: arenaIndex
      }),

      setLobbyPlayers: (players) => set({ lobbyPlayers: players }),

      quitGame: () => set((state) => {
        const p = { ...state.profile };
        let nextStatus = GameStatus.MENU;
        if (state.isBossBattle || !!state.activeBossRewardId) {
          nextStatus = GameStatus.TROPHY_ROAD;
        } else if (state.isRanked) {
          p.trophies = Math.max(0, p.trophies - 30);
          p.xp = Math.max(0, p.xp - 50);
        } else {
          p.xp = Math.max(0, p.xp - 20);
        }
        p.level = Math.floor(p.xp / 1000) + 1;
        return {
          profile: p,
          gameStatus: nextStatus,
          isBossBattle: false,
          activeBossRewardId: null,
          isRanked: false
        };
      }),

      buyCard: (cardId, cost, currency, qty = 1) => set((state) => {
        if (state.profile[currency] < cost) return state;
        const newCollection = state.profile.collection.map(c => 
          c.cardId === cardId ? { ...c, count: c.count + qty } : c
        );
        return { profile: { ...state.profile, [currency]: state.profile[currency] - cost, collection: newCollection } };
      }),

      buyGoldPack: () => set((state) => {
        if (state.profile.gems < 50) return state;
        return {
          profile: {
            ...state.profile,
            gems: state.profile.gems - 50,
            gold: state.profile.gold + 1000
          }
        };
      }),

      upgradeCard: (cardId) => set((state) => {
        const card = state.profile.collection.find(c => c.cardId === cardId);
        if (!card) return state;
        const cost = card.level * 400;
        if (card.count < card.level * 10 || state.profile.gold < cost) return state;
        const newXp = state.profile.xp + (card.level * 100);
        return {
          profile: {
            ...state.profile,
            gold: state.profile.gold - cost,
            xp: newXp,
            level: Math.floor(newXp / 1000) + 1,
            collection: state.profile.collection.map(c => 
              c.cardId === cardId ? { ...c, level: c.level + 1, count: c.count - card.level * 10 } : c
            )
          }
        };
      }),

      toggleDeckCard: (cardId) => set((state) => {
        const isSelected = state.profile.activeDeck.includes(cardId);
        if (isSelected) {
          if (state.profile.activeDeck.length <= 4) return state;
          return { profile: { ...state.profile, activeDeck: state.profile.activeDeck.filter(id => id !== cardId) } };
        } else {
          if (state.profile.activeDeck.length >= 8) return state;
          return { profile: { ...state.profile, activeDeck: [...state.profile.activeDeck, cardId] } };
        }
      }),

      completeOnboarding: () => set(state => ({ profile: { ...state.profile, isFirstTime: false } })),

      resetBattle: () => set({ 
        isBossBattle: false, 
        activeBossRewardId: null, 
        isRanked: false 
      })
    }),
    {
      name: 'uno-royale-v13',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
