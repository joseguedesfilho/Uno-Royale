
import { create } from 'zustand';
import { UserProfile, GameStatus, CardInstance, Chest, TrophyReward, LobbyPlayer, ShopItem, GameRoom } from './types.ts';
import { INITIAL_GOLD, INITIAL_GEMS, ALL_CARDS, TROPHY_ROAD_REWARDS, ARENAS, SHOP_ITEMS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';

interface GameStore {
  profile: UserProfile | null;
  session: any | null;
  gameStatus: GameStatus;
  currentArenaIndex: number;
  isBossBattle: boolean;
  activeBossRewardId: string | null;
  isRanked: boolean;
  selectedOpponent: LobbyPlayer | null;
  activeRoom: GameRoom | null;
  availableRooms: GameRoom[];
  lastRewards: { gold: number, gems: number, bonus: number, chestAcquired: boolean, potWon?: number } | null;
  lobbyPlayers: LobbyPlayer[];
  
  initialize: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  fetchLobbyPlayers: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  setGameStatus: (status: GameStatus) => void;
  addRewards: (gold: number, gems: number, xpAmount?: number) => void;
  updateTrophies: (amount: number) => void;
  upgradeCard: (cardId: string) => void;
  buyShopItem: (item: ShopItem) => void;
  quitGame: () => void;
  resetBattle: () => void;
  setLastRewards: (rewards: any) => void;
  startRankedLobby: () => void;
  createRoom: (config: Partial<GameRoom>) => Promise<void>;
  joinRoom: (room: GameRoom) => Promise<void>;
  startGame: () => void;
  startChallenge: (opponent: LobbyPlayer) => void;
  toggleDeckCard: (cardId: string) => void;
  startOpeningChest: (index: number) => void;
  collectChest: (index: number) => void;
  completeOnboarding: () => void;
  startArenaBattle: (index: number) => void;
  startBossBattle: (arenaIdx: number, rewardId: string, isBoss: boolean) => void;
  advanceArena: () => void;
  claimTrophyReward: (rewardId: string) => void;
  addChest: (type: 'Prata' | 'Ouro' | 'Lendário') => boolean;
  setLobbyPlayers: (players: LobbyPlayer[]) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  profile: null,
  session: null,
  gameStatus: GameStatus.MENU,
  currentArenaIndex: 0,
  isBossBattle: false,
  activeBossRewardId: null,
  isRanked: false,
  selectedOpponent: null,
  activeRoom: null,
  availableRooms: [],
  lastRewards: null,
  lobbyPlayers: [],

  initialize: async () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        set({ session });
        if (!get().profile) await get().fetchProfile(session.user.id);
      } else {
        set({ session: null, profile: null });
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ session });
      await get().fetchProfile(session.user.id);
    }
  },

  fetchProfile: async (userId: string) => {
    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select(`*, card_collection(*), inventory(*)`)
        .eq('id', userId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      let finalProfileData = profile;

      if (!finalProfileData) {
        const { data: { user } } = await supabase.auth.getUser();
        const displayName = user?.user_metadata?.display_name || 'Desafiante';
        const newProfile = { id: userId, display_name: displayName, gold: INITIAL_GOLD, gems: INITIAL_GEMS, level: 1, xp: 0, trophies: 0, current_arena: 0, is_first_time: true };
        const { data: createdProfile } = await supabase.from('profiles').insert(newProfile).select().single();
        finalProfileData = createdProfile || newProfile;
        
        if (!profile) {
          const initialCards = ALL_CARDS.map(c => ({ profile_id: userId, card_id: c.id, level: 1, count: 5 }));
          await supabase.from('card_collection').insert(initialCards);
        }
      }
      
      const formattedProfile: UserProfile = {
        name: finalProfileData.display_name,
        gold: finalProfileData.gold || INITIAL_GOLD,
        gems: finalProfileData.gems || INITIAL_GEMS,
        xp: finalProfileData.xp || 0,
        level: finalProfileData.level || 1,
        trophies: finalProfileData.trophies || 0,
        currentArena: finalProfileData.current_arena || 0,
        collection: (finalProfileData.card_collection || []).map((c: any) => ({ cardId: c.card_id, level: c.level, count: c.count })),
        activeDeck: ALL_CARDS.slice(0, 8).map(c => c.id),
        inventory: (finalProfileData.inventory || []).map((i: any) => i.item_id),
        chestSlots: [null, null, null, null],
        claimedRewards: [],
        isFirstTime: finalProfileData.is_first_time ?? true
      };
      set({ profile: formattedProfile, currentArenaIndex: formattedProfile.currentArena });
    } catch (e: any) { console.error(e); }
  },

  fetchLobbyPlayers: async () => {
    try {
      const { data } = await supabase.from('profiles')
        .select('id, display_name, level, trophies')
        .neq('id', get().session?.user?.id)
        .order('trophies', { ascending: false })
        .limit(10);
        
      const players: LobbyPlayer[] = (data || []).map(p => ({
        id: p.id, name: p.display_name, level: p.level, trophies: p.trophies, avatar: p.trophies > 1000 ? '🧛‍♂️' : '🧙‍♂️', status: 'Disponível'
      }));
      set({ lobbyPlayers: players });
    } catch (err) { console.error(err); }
  },

  fetchRooms: async () => {
    const mockRooms: GameRoom[] = [
      { id: 'room-1', creatorId: 'bot-1', creatorName: 'Rei Arthur', maxPlayers: 2, currentPlayers: 1, betAmount: 10, timePerTurn: 5, status: 'Aguardando', arenaName: 'Mesa Redonda' },
      { id: 'room-2', creatorId: 'bot-2', creatorName: 'Goblin Rico', maxPlayers: 4, currentPlayers: 2, betAmount: 100, timePerTurn: 10, status: 'Aguardando', arenaName: 'Cofre de Ouro' }
    ];
    set({ availableRooms: mockRooms });
  },

  createRoom: async (config) => {
    const { profile, session } = get();
    if (!profile || !session || profile.gems < (config.betAmount || 0)) return;
    
    const newRoom: GameRoom = {
      id: Math.random().toString(36).substr(2, 9),
      creatorId: session.user.id,
      creatorName: profile.name,
      maxPlayers: config.maxPlayers || 2,
      currentPlayers: 1,
      betAmount: config.betAmount || 0,
      timePerTurn: config.timePerTurn || 10,
      status: 'Aguardando',
      arenaName: config.arenaName || 'Arena de Apostas'
    };

    await get().syncProfile({ gems: profile.gems - newRoom.betAmount });
    set({ activeRoom: newRoom, isRanked: true, gameStatus: GameStatus.ROOM_WAITING });
  },

  joinRoom: async (room) => {
    const { profile } = get();
    if (!profile || profile.gems < room.betAmount) return;

    await get().syncProfile({ gems: profile.gems - room.betAmount });
    // Simula entrar na sala
    const updatedRoom = { ...room, currentPlayers: room.currentPlayers + 1 };
    set({ activeRoom: updatedRoom, isRanked: true, gameStatus: GameStatus.ROOM_WAITING });
  },

  startGame: () => {
    set({ gameStatus: GameStatus.LOADING });
    setTimeout(() => set({ gameStatus: GameStatus.BATTLE }), 800);
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, gameStatus: GameStatus.MENU });
  },

  syncProfile: async (updates) => {
    const { profile, session } = get();
    if (!profile || !session) return;
    try {
      const dbUpdates: any = {};
      if (updates.gold !== undefined) dbUpdates.gold = updates.gold;
      if (updates.gems !== undefined) dbUpdates.gems = updates.gems;
      if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.trophies !== undefined) dbUpdates.trophies = updates.trophies;
      if (updates.currentArena !== undefined) dbUpdates.current_arena = updates.currentArena;

      set({ profile: { ...profile, ...updates } });
      await supabase.from('profiles').update(dbUpdates).eq('id', session.user.id);
    } catch (err) {
      console.warn("Sync failed", err);
    }
  },

  setGameStatus: (status) => set({ gameStatus: status }),

  addRewards: async (gold, gems, xpAmount = 50) => {
    const { profile } = get();
    if (!profile) return;
    const totalXp = profile.xp + xpAmount;
    const newLevel = Math.floor(totalXp / 1000) + 1;
    await get().syncProfile({ gold: profile.gold + gold, gems: profile.gems + gems, xp: totalXp, level: newLevel });
  },

  updateTrophies: async (amount) => {
    const { profile } = get();
    if (!profile) return;
    await get().syncProfile({ trophies: Math.max(0, profile.trophies + amount) });
  },

  upgradeCard: async (cardId) => {
    const { profile, session } = get();
    if (!profile || !session) return;
    const card = profile.collection.find(c => c.cardId === cardId);
    if (!card) return;
    const cost = card.level * 400;
    if (card.count < card.level * 10 || profile.gold < cost) return;
    try {
      const newLevel = card.level + 1;
      const newCount = card.count - card.level * 10;
      await supabase.from('card_collection').update({ level: newLevel, count: newCount }).eq('profile_id', session.user.id).eq('card_id', cardId);
      await get().addRewards(-cost, 0, card.level * 100);
      const newCollection = profile.collection.map(c => c.cardId === cardId ? { ...c, level: newLevel, count: newCount } : c);
      set({ profile: { ...profile, collection: newCollection } });
    } catch (err) { console.error(err); }
  },

  toggleDeckCard: (cardId: string) => {
    const { profile } = get();
    if (!profile) return;
    const isIncluded = profile.activeDeck.includes(cardId);
    let newDeck = [...profile.activeDeck];
    if (isIncluded) { if (newDeck.length <= 4) return; newDeck = newDeck.filter(id => id !== cardId); }
    else { if (newDeck.length >= 8) return; newDeck.push(cardId); }
    set({ profile: { ...profile, activeDeck: newDeck } });
  },

  startOpeningChest: (index: number) => {
    const { profile } = get();
    if (!profile) return;
    const newSlots = [...profile.chestSlots];
    const chest = newSlots[index];
    if (chest) { chest.isOpening = true; chest.startTime = Date.now(); set({ profile: { ...profile, chestSlots: newSlots } }); }
  },

  collectChest: (index: number) => {
    const { profile } = get();
    if (!profile) return;
    const newSlots = [...profile.chestSlots];
    newSlots[index] = null;
    set({ profile: { ...profile, chestSlots: newSlots } });
    get().addRewards(500, 10, 100);
  },

  completeOnboarding: () => {
    const { profile } = get();
    if (!profile) return;
    get().syncProfile({ isFirstTime: false });
  },

  startArenaBattle: (index: number) => {
    set({ gameStatus: GameStatus.LOADING, currentArenaIndex: index, isBossBattle: false, activeBossRewardId: null, isRanked: false, activeRoom: null });
  },

  startBossBattle: (arenaIdx: number, rewardId: string, isBoss: boolean) => {
    set({ gameStatus: GameStatus.LOADING, currentArenaIndex: arenaIdx, isBossBattle: isBoss, activeBossRewardId: rewardId, isRanked: false, activeRoom: null });
  },

  startChallenge: (opponent: LobbyPlayer) => {
    set({ gameStatus: GameStatus.LOADING, isRanked: true, selectedOpponent: opponent, currentArenaIndex: get().profile?.currentArena || 0 });
  },

  advanceArena: () => {
    const { profile } = get();
    if (!profile) return;
    get().syncProfile({ currentArena: profile.currentArena + 1 });
  },

  claimTrophyReward: (rewardId: string) => {
    const { profile } = get();
    if (!profile) return;
    const newClaimed = [...profile.claimedRewards, rewardId];
    set({ profile: { ...profile, claimedRewards: newClaimed } });
  },

  addChest: (type: 'Prata' | 'Ouro' | 'Lendário') => {
    const { profile } = get();
    if (!profile) return false;
    const slotIndex = profile.chestSlots.findIndex(s => s === null);
    if (slotIndex === -1) return false;
    const newSlots = [...profile.chestSlots];
    newSlots[slotIndex] = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      rarity: type === 'Lendário' ? 'Lendária' : type === 'Ouro' ? 'Rara' : 'Comum',
      unlockTime: type === 'Prata' ? 10000 : type === 'Ouro' ? 60000 : 360000,
      isOpening: false
    };
    set({ profile: { ...profile, chestSlots: newSlots } });
    return true;
  },

  buyShopItem: async (item) => {
    const { profile, session } = get();
    if (!profile || !session || profile[item.currency] < item.cost) return;
    if (item.type === 'PACOTE_OURO') {
      await get().syncProfile({ [item.currency]: profile[item.currency] - item.cost, gold: profile.gold + 3000 });
    } else {
      await supabase.from('inventory').insert({ profile_id: session.user.id, item_id: item.id });
      await get().syncProfile({ [item.currency]: profile[item.currency] - item.cost, inventory: [...profile.inventory, item.id] });
    }
  },

  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),
  setLastRewards: (rewards) => set({ lastRewards: rewards }),
  resetBattle: () => set({ isBossBattle: false, activeBossRewardId: null, isRanked: false, selectedOpponent: null, activeRoom: null }),
  startRankedLobby: () => set({ gameStatus: GameStatus.LOBBY, isRanked: true }),
  
  quitGame: async () => {
    const { isRanked, activeRoom, profile } = get();
    // Penalidade apenas em partidas ranqueadas normais, salas têm a aposta já deduzida
    if (isRanked && !activeRoom && profile) {
      await get().updateTrophies(-15);
    }
    set({ 
      gameStatus: GameStatus.MENU, 
      isBossBattle: false, 
      activeBossRewardId: null, 
      isRanked: false, 
      selectedOpponent: null, 
      activeRoom: null,
      lastRewards: null
    });
  }
}));
