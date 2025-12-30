
import { create } from 'zustand';
import { UserProfile, GameStatus, CardInstance, Chest, TrophyReward, LobbyPlayer, ShopItem, GameRoom, Quest } from './types.ts';
import { INITIAL_GOLD, INITIAL_GEMS, ALL_CARDS, TROPHY_ROAD_REWARDS, ARENAS, SHOP_ITEMS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';

interface SocialMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: number;
}

interface GameStore {
  profile: UserProfile | null;
  session: any | null;
  gameStatus: GameStatus;
  currentArenaIndex: number;
  isBossBattle: boolean;
  activeBossRewardId: string | null;
  isRanked: boolean;
  selectedOpponent: null | LobbyPlayer;
  activeRoom: GameRoom | null;
  availableRooms: GameRoom[];
  lastRewards: { gold: number, gems: number, bonus: number, chestAcquired: boolean, potWon?: number } | null;
  lobbyPlayers: LobbyPlayer[];
  leaderboardPlayers: LobbyPlayer[];
  socialFeed: SocialMessage[];
  isGuest: boolean;
  
  initialize: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  enterAsGuest: (name: string) => void;
  signOut: () => Promise<void>;
  syncProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  fetchLobbyPlayers: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
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
  updateRoom: (config: Partial<GameRoom>) => void;
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
  addSocialMessage: (msg: SocialMessage) => void;
  updateQuests: (event: { type: 'PLAY_CARD' | 'WIN_MATCH' | 'ARENA_PLAY', color?: string, arena?: number }) => void;
  claimQuest: (questId: string) => void;
  claimPassReward: (tierIndex: number, isPremium: boolean) => void;
}

const DEFAULT_QUESTS: Quest[] = [
  { id: 'q1', description: 'Jogue 15 cartas azuis', target: 15, current: 0, rewardType: 'OURO', rewardValue: 300, isClaimed: false },
  { id: 'q2', description: 'Vença 3 partidas ranqueadas', target: 3, current: 0, rewardType: 'GEMAS', rewardValue: 20, isClaimed: false },
  { id: 'q3', description: 'Jogue na Arena 3', target: 1, current: 0, rewardType: 'BAU', rewardValue: 'Ouro', isClaimed: false }
];

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
  leaderboardPlayers: [],
  isGuest: false,
  socialFeed: [],

  initialize: async () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        set({ session, isGuest: false });
        if (!get().profile) await get().fetchProfile(session.user.id);
      } else if (!get().isGuest) {
        set({ session: null, profile: null });
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ session, isGuest: false });
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
        isFirstTime: finalProfileData.is_first_time ?? true,
        quests: DEFAULT_QUESTS,
        passXP: 0,
        hasPremiumPass: false,
        claimedPassFree: [],
        claimedPassPremium: []
      };
      set({ profile: formattedProfile, currentArenaIndex: formattedProfile.currentArena });
    } catch (e: any) { console.error(e); }
  },

  syncProfile: async (updates) => {
    const { profile, session, isGuest } = get();
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    set({ profile: newProfile });
    
    if (!isGuest && session) {
      try {
        const dbUpdates: any = {};
        if (updates.gold !== undefined) dbUpdates.gold = updates.gold;
        if (updates.gems !== undefined) dbUpdates.gems = updates.gems;
        if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
        if (updates.level !== undefined) dbUpdates.level = updates.level;
        if (updates.trophies !== undefined) dbUpdates.trophies = updates.trophies;
        if (updates.currentArena !== undefined) dbUpdates.current_arena = updates.currentArena;
        
        await supabase.from('profiles').update(dbUpdates).eq('id', session.user.id);
      } catch (e) { console.error(e); }
    }
  },

  updateQuests: (event) => {
    const { profile } = get();
    if (!profile) return;
    
    const newQuests = profile.quests.map(q => {
      if (q.isClaimed) return q;
      if (event.type === 'PLAY_CARD' && q.description.includes(event.color || '')) {
         return { ...q, current: Math.min(q.target, q.current + 1) };
      }
      if (event.type === 'WIN_MATCH' && q.description.includes('Vença')) {
         return { ...q, current: Math.min(q.target, q.current + 1) };
      }
      if (event.type === 'ARENA_PLAY' && q.description.includes(`Arena ${event.arena}`)) {
         return { ...q, current: Math.min(q.target, q.current + 1) };
      }
      return q;
    });
    
    set({ profile: { ...profile, quests: newQuests, passXP: profile.passXP + 5 } });
  },

  claimQuest: (questId) => {
    const { profile } = get();
    if (!profile) return;
    const quest = profile.quests.find(q => q.id === questId);
    if (!quest || quest.current < quest.target || quest.isClaimed) return;

    if (quest.rewardType === 'OURO') get().addRewards(quest.rewardValue, 0);
    if (quest.rewardType === 'GEMAS') get().addRewards(0, quest.rewardValue);
    if (quest.rewardType === 'BAU') get().addChest(quest.rewardValue);

    const newQuests = profile.quests.map(q => q.id === questId ? { ...q, isClaimed: true } : q);
    set({ profile: { ...profile, quests: newQuests } });
  },

  claimPassReward: (tierIndex, isPremium) => {
    const { profile } = get();
    if (!profile) return;
    if (isPremium && !profile.hasPremiumPass) return;
    
    const claimedList = isPremium ? [...profile.claimedPassPremium] : [...profile.claimedPassFree];
    if (claimedList.includes(tierIndex)) return;
    
    claimedList.push(tierIndex);
    get().addRewards(500, 10, 100);

    set({ profile: { 
      ...profile, 
      claimedPassFree: !isPremium ? claimedList : profile.claimedPassFree,
      claimedPassPremium: isPremium ? claimedList : profile.claimedPassPremium
    }});
  },

  startOpeningChest: (index) => {
    const { profile } = get();
    if (!profile || !profile.chestSlots[index]) return;
    const newChests = [...profile.chestSlots];
    const chest = newChests[index]!;
    newChests[index] = { ...chest, isOpening: true, startTime: Date.now() };
    set({ profile: { ...profile, chestSlots: newChests } });
  },

  collectChest: (index) => {
    const { profile } = get();
    if (!profile) return;
    const chest = profile.chestSlots[index];
    if (!chest) return;

    let gold = 0, gems = 0, items: string[] = [];
    if (chest.type === 'Prata') { 
      gold = 200; gems = 5; 
      if (Math.random() < 0.1) items.push('borda-prata'); 
    }
    else if (chest.type === 'Ouro') { 
      gold = 800; gems = 20; 
      if (Math.random() < 0.2) items.push('banner-ouro');
      if (Math.random() < 0.1) items.push('borda-ouro');
    }
    else { 
      gold = 2500; gems = 100; 
      items.push('banner-lendario');
      if (Math.random() < 0.5) items.push('borda-lendaria');
    }

    get().addRewards(gold, gems, 150);
    
    const newChests = [...profile.chestSlots];
    newChests[index] = null;
    set({ profile: { ...profile, chestSlots: newChests, inventory: [...profile.inventory, ...items] } });
  },

  addChest: (type) => {
    const { profile } = get();
    if (!profile) return false;
    const emptySlot = profile.chestSlots.findIndex(s => s === null);
    if (emptySlot === -1) return false;
    
    const unlockTime = type === 'Prata' ? 3 * 3600 * 1000 : type === 'Ouro' ? 8 * 3600 * 1000 : 12 * 3600 * 1000;
    const newChests = [...profile.chestSlots];
    newChests[emptySlot] = { id: `chest-${Date.now()}`, type, rarity: 'Comum', unlockTime, isOpening: false };
    set({ profile: { ...profile, chestSlots: newChests } });
    return true;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  signUp: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if (error) throw error;
  },
  enterAsGuest: (name) => {
    const guest: UserProfile = {
      name: name || 'Rei Convidado', gold: 1000, gems: 100, xp: 0, level: 1, trophies: 0, currentArena: 0,
      collection: [], activeDeck: [], inventory: [], chestSlots: [null, null, null, null],
      claimedRewards: [], isFirstTime: false, quests: DEFAULT_QUESTS, passXP: 0, hasPremiumPass: false,
      claimedPassFree: [], claimedPassPremium: []
    };
    set({ profile: guest, isGuest: true, session: { user: { id: 'guest' } } });
  },
  signOut: async () => { await supabase.auth.signOut(); set({ session: null, profile: null }); },
  setGameStatus: (status) => set({ gameStatus: status }),
  addRewards: (gold, gems, xp = 0) => {
    const p = get().profile; if (!p) return;
    get().syncProfile({ gold: p.gold + gold, gems: p.gems + gems, xp: p.xp + xp });
  },
  updateTrophies: (amt) => {
    const p = get().profile; if (!p) return;
    get().syncProfile({ trophies: Math.max(0, p.trophies + amt) });
  },
  setLastRewards: (r) => set({ lastRewards: r }),
  resetBattle: () => set({ isBossBattle: false, activeBossRewardId: null }),
  startRankedLobby: () => set({ gameStatus: GameStatus.LOBBY }),
  fetchRooms: async () => {},
  fetchLeaderboard: async () => {},
  fetchLobbyPlayers: async () => {},
  createRoom: async () => {},
  updateRoom: () => {},
  joinRoom: async () => {},
  startGame: () => set({ gameStatus: GameStatus.BATTLE }),
  startChallenge: () => {},
  toggleDeckCard: (id) => {
    const p = get().profile; if (!p) return;
    const newDeck = p.activeDeck.includes(id) ? p.activeDeck.filter(x => x !== id) : [...p.activeDeck, id].slice(0, 8);
    get().syncProfile({ activeDeck: newDeck });
  },
  upgradeCard: () => {},
  buyShopItem: () => {},
  quitGame: () => set({ gameStatus: GameStatus.MENU }),
  completeOnboarding: () => get().syncProfile({ isFirstTime: false }),
  startArenaBattle: (idx) => { set({ currentArenaIndex: idx, gameStatus: GameStatus.LOADING }); setTimeout(() => set({ gameStatus: GameStatus.BATTLE }), 1500); },
  startBossBattle: (idx, rid, isB) => { set({ currentArenaIndex: idx, activeBossRewardId: rid, isBossBattle: isB, gameStatus: GameStatus.LOADING }); setTimeout(() => set({ gameStatus: GameStatus.BATTLE }), 1500); },
  advanceArena: () => { const p = get().profile; if (p) get().syncProfile({ currentArena: p.currentArena + 1 }); },
  claimTrophyReward: (rid) => { const p = get().profile; if (p) get().syncProfile({ claimedRewards: [...p.claimedRewards, rid] }); },
  setLobbyPlayers: () => {},
  addSocialMessage: () => {}
})));
