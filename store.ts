
import { create } from 'zustand';
import { UserProfile, GameStatus, CardInstance, Chest, TrophyReward, LobbyPlayer, ShopItem, GameRoom, Quest, ActiveGameState, Card, CardColor, CardType } from './types.ts';
import { INITIAL_GOLD, INITIAL_GEMS, ALL_CARDS, TROPHY_ROAD_REWARDS, ARENAS, SHOP_ITEMS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';
import { createDeck, isCardPlayable } from './logic/gameLogic.ts';

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
  activeGame: ActiveGameState | null;
  availableRooms: GameRoom[];
  lastRewards: { gold: number, gems: number, bonus: number, chestAcquired: boolean, potWon?: number } | null;
  lobbyPlayers: LobbyPlayer[];
  leaderboardPlayers: LobbyPlayer[];
  socialFeed: SocialMessage[];
  isGuest: boolean;
  lobbySubscription: any;
  roomSubscription: any;
  
  initialize: () => Promise<void>;
  validateDB: () => Promise<{ configured: boolean, roomsReadable: boolean, socialReadable: boolean }>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  enterAsGuest: (name: string) => void;
  signOut: () => Promise<void>;
  syncProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  fetchLobbyPlayers: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchSocialMessages: () => Promise<void>;
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
  playCard: (cards: Card[], chosenColor?: CardColor) => Promise<void>;
  drawCard: (playerId: string, count: number) => Promise<void>;
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
  addSocialMessage: (text: string) => Promise<void>;
  updateQuests: (event: { type: 'PLAY_CARD' | 'WIN_MATCH' | 'ARENA_PLAY', color?: string, arena?: number }) => void;
  claimQuest: (questId: string) => void;
  claimPassReward: (tierIndex: number, isPremium: boolean) => void;
  leaveRoom: () => Promise<void>;
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
  activeGame: null,
  availableRooms: [],
  lastRewards: null,
  lobbyPlayers: [],
  leaderboardPlayers: [],
  isGuest: false,
  socialFeed: [],
  lobbySubscription: null as any,
  roomSubscription: null as any,

  initialize: async () => {
    if (!supabase) { set({ session: null, profile: null, isGuest: true }); return; }
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        set({ session, isGuest: false });
        if (!get().profile) await get().fetchProfile(session.user.id);
        setTimeout(() => {
          if (!get().profile) {
            const fallback: UserProfile = {
              name: 'Desafiante',
              gold: INITIAL_GOLD,
              gems: INITIAL_GEMS,
              xp: 0,
              level: 1,
              trophies: 0,
              currentArena: 0,
              collection: [],
              activeDeck: ALL_CARDS.slice(0, 8).map(c => c.id),
              inventory: [],
              chestSlots: [null, null, null, null],
              claimedRewards: [],
              isFirstTime: true,
              quests: DEFAULT_QUESTS,
              passXP: 0,
              hasPremiumPass: false,
              claimedPassFree: [],
              claimedPassPremium: []
            };
            set({ profile: fallback, currentArenaIndex: 0 });
          }
        }, 2500);
      } else if (!get().isGuest) {
        set({ session: null, profile: null });
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ session, isGuest: false });
      // Race condition: if fetchProfile takes too long, we proceed anyway
      // The profile might load later or the fallback will trigger
      const fetchPromise = get().fetchProfile(session.user.id);
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 4000));
      await Promise.race([fetchPromise, timeoutPromise]);
      
      setTimeout(() => {
        if (!get().profile) {
          const fallback: UserProfile = {
            name: 'Desafiante',
            gold: INITIAL_GOLD,
            gems: INITIAL_GEMS,
            xp: 0,
            level: 1,
            trophies: 0,
            currentArena: 0,
            collection: [],
            activeDeck: ALL_CARDS.slice(0, 8).map(c => c.id),
            inventory: [],
            chestSlots: [null, null, null, null],
            claimedRewards: [],
            isFirstTime: true,
            quests: DEFAULT_QUESTS,
            passXP: 0,
            hasPremiumPass: false,
            claimedPassFree: [],
            claimedPassPremium: []
          };
          set({ profile: fallback, currentArenaIndex: 0 });
        }
      }, 2500);
    }
  },

  validateDB: async () => {
    if (!supabase) return { configured: false, roomsReadable: false, socialReadable: false };
    try {
      const roomsRes = await supabase.from('rooms').select('id').limit(1);
      const socialRes = await supabase.from('social_messages').select('id').limit(1);
      return { configured: true, roomsReadable: !roomsRes.error, socialReadable: !socialRes.error };
    } catch {
      return { configured: true, roomsReadable: false, socialReadable: false };
    }
  },

  fetchProfile: async (userId: string) => {
    if (!supabase) {
      const fallback: UserProfile = {
        name: 'Desafiante',
        gold: INITIAL_GOLD,
        gems: INITIAL_GEMS,
        xp: 0,
        level: 1,
        trophies: 0,
        currentArena: 0,
        collection: [],
        activeDeck: ALL_CARDS.slice(0, 8).map(c => c.id),
        inventory: [],
        chestSlots: [null, null, null, null],
        claimedRewards: [],
        isFirstTime: true,
        quests: DEFAULT_QUESTS,
        passXP: 0,
        hasPremiumPass: false,
        claimedPassFree: [],
        claimedPassPremium: []
      };
      set({ profile: fallback, isGuest: true, currentArenaIndex: 0 });
      return;
    }
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
    } catch (e: any) { 
      const fallback: UserProfile = {
        name: 'Desafiante',
        gold: INITIAL_GOLD,
        gems: INITIAL_GEMS,
        xp: 0,
        level: 1,
        trophies: 0,
        currentArena: 0,
        collection: [],
        activeDeck: ALL_CARDS.slice(0, 8).map(c => c.id),
        inventory: [],
        chestSlots: [null, null, null, null],
        claimedRewards: [],
        isFirstTime: true,
        quests: DEFAULT_QUESTS,
        passXP: 0,
        hasPremiumPass: false,
        claimedPassFree: [],
        claimedPassPremium: []
      };
      set({ profile: fallback, isGuest: true, currentArenaIndex: 0 });
    }
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
    
    let hasChanges = false;
    const newQuests = profile.quests.map(q => {
      if (q.isClaimed) return q;
      let newCurrent = q.current;
      
      const desc = q.description.toLowerCase();
      if (event.type === 'PLAY_CARD' && event.color && desc.includes(event.color.toLowerCase())) {
         newCurrent = Math.min(q.target, q.current + 1);
      }
      if (event.type === 'WIN_MATCH' && desc.includes('vença')) {
         newCurrent = Math.min(q.target, q.current + 1);
      }
      if (event.type === 'ARENA_PLAY' && event.arena !== undefined && desc.includes(`arena ${event.arena}`)) {
         newCurrent = Math.min(q.target, q.current + 1);
      }
      
      if (newCurrent !== q.current) {
        hasChanges = true;
        return { ...q, current: newCurrent };
      }
      return q;
    });
    
    if (hasChanges) {
      set({ profile: { ...profile, quests: newQuests, passXP: profile.passXP + 10 } });
      
      // Auto-claim logic
      newQuests.forEach(q => {
        if (q.current >= q.target && !q.isClaimed) {
          get().claimQuest(q.id);
        }
      });
    }
  },

  claimQuest: (questId) => {
    const { profile } = get();
    if (!profile) return;
    const quest = profile.quests.find(q => q.id === questId);
    if (!quest || quest.current < quest.target || quest.isClaimed) return;

    if (quest.rewardType === 'OURO') get().addRewards(quest.rewardValue as number, 0);
    if (quest.rewardType === 'GEMAS') get().addRewards(0, quest.rewardValue as number);
    if (quest.rewardType === 'BAU') get().addChest(quest.rewardValue as any);

    const newQuests = profile.quests.map(q => q.id === questId ? { ...q, isClaimed: true } : q);
    set({ profile: { ...get().profile!, quests: newQuests } });
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
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  signUp: async (email, password, name) => {
    if (!supabase) throw new Error('Supabase não configurado');
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
  signOut: async () => { if (!supabase) { set({ session: null, profile: null }); return; } await supabase.auth.signOut(); set({ session: null, profile: null }); },
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
  fetchRooms: async () => {
    const { profile } = get();
    if (!supabase) {
      const sample: GameRoom[] = [
        { id: 'local-1', creatorId: 'bot-1', creatorName: 'Rei Goblin', maxPlayers: 2, currentPlayers: 1, betAmount: 10, timePerTurn: 10, status: 'Aguardando', arenaName: 'Campo de Treino' },
        { id: 'local-2', creatorId: 'bot-2', creatorName: 'Esqueleto Gigante', maxPlayers: 3, currentPlayers: 2, betAmount: 50, timePerTurn: 10, status: 'Aguardando', arenaName: 'Fosso de Ossos' },
        { id: 'local-3', creatorId: 'bot-3', creatorName: 'Mestre Supremo', maxPlayers: 4, currentPlayers: 3, betAmount: 100, timePerTurn: 20, status: 'Aguardando', arenaName: 'Arena Lendária' }
      ];
      set({ availableRooms: sample });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const mapped: GameRoom[] = (data || []).map((r: any) => ({
        id: r.id,
        creatorId: r.creator_id ?? r.creatorId ?? '',
        creatorName: r.creator_name ?? r.creatorName ?? 'Desafiante',
        maxPlayers: r.max_players ?? r.maxPlayers ?? 2,
        currentPlayers: r.current_players ?? r.currentPlayers ?? 1,
        betAmount: r.bet_amount ?? r.betAmount ?? 10,
        timePerTurn: r.time_per_turn ?? r.timePerTurn ?? 10,
        status: r.status ?? 'Aguardando',
        arenaName: r.arena_name ?? r.arenaName ?? 'Arena Royale'
      }));
      set({ availableRooms: mapped });
    } catch (e) { console.error(e); }
  },
  fetchLeaderboard: async () => {},
  fetchLobbyPlayers: async () => {},
  fetchSocialMessages: async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('social_messages')
        .select('*')
        .order('timestamp', { ascending: true })
        .limit(50);
      if (error) throw error;
      if (data) set({ socialFeed: data });
    } catch (e) { console.error(e); }
  },
  createRoom: async (config: Partial<GameRoom>) => {
    const { session, profile, isGuest } = get();
    // Fallback ID for guest/offline
    const roomId = `room-${Date.now()}`;
    
    const base: GameRoom = {
      id: roomId,
      creatorId: session?.user?.id || 'guest',
      creatorName: profile?.name || 'Convidado',
      maxPlayers: config.maxPlayers ?? 2,
      currentPlayers: 1,
      betAmount: config.betAmount ?? 10,
      timePerTurn: config.timePerTurn ?? 10,
      status: 'Aguardando',
      arenaName: config.arenaName ?? 'Arena Royale'
    };

    if (profile && profile.gems >= base.betAmount) {
      get().syncProfile({ gems: Math.max(0, profile.gems - base.betAmount) });
    }

    set({ activeRoom: base });
    set({ gameStatus: GameStatus.ROOM_WAITING });

    if (!isGuest && supabase && session) {
      try {
        // 1. Insert Room
        const { error: roomError } = await supabase.from('rooms').insert({
          id: base.id,
          creator_id: session.user.id,
          creator_name: base.creatorName,
          max_players: base.maxPlayers,
          current_players: 1,
          bet_amount: base.betAmount,
          time_per_turn: base.timePerTurn,
          status: base.status,
          arena_name: base.arenaName
        });
        if (roomError) throw roomError;

        // 2. Insert Player
        await supabase.from('room_players').insert({
          room_id: base.id,
          user_id: session.user.id,
          player_name: base.creatorName,
          avatar: '👑',
          is_ready: true
        });

        // 3. Subscribe
        get().subscribeToActiveRoom(base.id);
        
      } catch (e) { 
        console.error("Erro ao criar sala:", e);
        // Fallback to local if DB fails
      }
    }
  },
  
  updateRoom: (config: Partial<GameRoom>) => {
    const current = get().activeRoom;
    if (!current) return;
    const updated: GameRoom = { ...current, ...config };
    set({ activeRoom: updated });
    const { isGuest } = get();
    if (supabase && !isGuest) {
      supabase.from('rooms').update({
        bet_amount: updated.betAmount,
        max_players: updated.maxPlayers,
        time_per_turn: updated.timePerTurn,
        arena_name: updated.arenaName
      }).eq('id', updated.id);
    }
  },

  joinRoom: async (room: GameRoom) => {
    const { session, profile, isGuest } = get();
    if (!profile || profile.gems < room.betAmount) return;
    
    get().syncProfile({ gems: Math.max(0, profile.gems - room.betAmount) });
    
    const updated = { ...room, currentPlayers: Math.min(room.maxPlayers, (room.currentPlayers ?? 1) + 1) };
    set({ activeRoom: updated, gameStatus: GameStatus.ROOM_WAITING });
    
    if (!isGuest && supabase && session) {
      try {
        // 1. Join Table
        const { error } = await supabase.from('room_players').insert({
          room_id: room.id,
          user_id: session.user.id,
          player_name: profile.name,
          avatar: '⚔️',
          is_ready: true
        });
        
        if (error) {
           // If already joined, just subscribe
           console.warn("Player already in room or error:", error);
        }

        // 2. Update Count
        await supabase.rpc('increment_room_players', { room_id: room.id });
        
        // 3. Subscribe
        get().subscribeToActiveRoom(room.id);
      } catch (e) { console.error(e); }
    }
  },
  startGame: async () => {
    const { activeRoom, session } = get();
    if (!activeRoom) return;

    // Fallback for guest/offline
    if (!supabase || !session) {
       set({ gameStatus: GameStatus.BATTLE });
       return;
    }
    
    // Only creator starts
    if (activeRoom.creatorId !== session.user.id) return;

    try {
        // 1. Get players
        const { data: players } = await supabase
            .from('room_players')
            .select('*')
            .eq('room_id', activeRoom.id);
            
        if (!players) return;

        // 2. Setup Game
        const deck = createDeck();
        const hands: Record<string, any[]> = {};
        
        // Fill with bots if needed
        const realPlayers = players.map(p => ({
            id: p.user_id,
            name: p.player_name,
            avatar: p.avatar,
            cardCount: 0,
            isBot: false
        }));

        const botCount = (activeRoom.maxPlayers || 2) - realPlayers.length;
        const gamePlayers = [...realPlayers];

        for(let i=0; i<botCount; i++) {
           gamePlayers.push({
             id: `bot-${Date.now()}-${i}`,
             name: `Bot ${i+1}`,
             avatar: '🤖',
             cardCount: 0,
             isBot: true
           });
        }

        // Deal 7 cards to each
        gamePlayers.forEach(p => {
            hands[p.id] = deck.splice(0, 7);
            p.cardCount = 7;
        });

        const initialTopCard = deck.shift();
        
        const gameState: ActiveGameState = {
            deckCount: deck.length, 
            remainingDeck: deck,
            discardPile: [initialTopCard!],
            players: gamePlayers,
            hands: hands, 
            turnIndex: 0,
            direction: 1,
            currentColor: initialTopCard?.color !== 'Especial' ? initialTopCard?.color! : 'Vermelho',
            lastUpdate: Date.now(),
            status: 'Em Jogo'
        };

        // 3. Update DB
        await supabase.from('rooms').update({
            status: 'Em Jogo',
            game_state: gameState
        }).eq('id', activeRoom.id);
        
        // Subscription handles the rest
    } catch (e) {
        console.error("Error starting game", e);
    }
  },
  playCard: async (cards: Card[], chosenColor?: CardColor, asPlayerId?: string) => {
    const { activeGame, activeRoom, session } = get();
    if (!activeGame || !activeRoom || !session || !supabase) return;
    
    const newGame = JSON.parse(JSON.stringify(activeGame)) as ActiveGameState;
    // Allow playing as another ID if it's a bot and I'm the creator
    const playerId = asPlayerId || session.user.id;
    const playerIndex = newGame.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1 || playerIndex !== newGame.turnIndex) return;

    // 1. Remove from hand
    newGame.hands[playerId] = newGame.hands[playerId].filter(c => !cards.some(played => played.instanceId === c.instanceId));
    newGame.players[playerIndex].cardCount = newGame.hands[playerId].length;

    // 2. Add to discard
    newGame.discardPile = [...newGame.discardPile, ...cards];
    
    // 3. Apply Effects
    const lastCard = cards[cards.length - 1];
    newGame.currentColor = lastCard.color === 'Especial' ? (chosenColor || 'Vermelho') : lastCard.color;
    
    let skip = 1;
    if (lastCard.type === CardType.SKIP) skip = 2;
    if (lastCard.type === CardType.REVERSE) newGame.direction *= -1;
    
    const nextIdx = (newGame.turnIndex + (1 * newGame.direction) + newGame.players.length) % newGame.players.length;
    const nextPlayerId = newGame.players[nextIdx].id;

    if (lastCard.type === CardType.DRAW2) {
       let drawn: Card[] = [];
       for(let i=0; i<2; i++) {
           if (newGame.remainingDeck.length === 0) {
               if (newGame.discardPile.length > 1) {
                   const top = newGame.discardPile.pop();
                   const rest = newGame.discardPile;
                   newGame.discardPile = [top!];
                   newGame.remainingDeck = rest.sort(() => Math.random() - 0.5);
               } else break;
           }
           const card = newGame.remainingDeck.pop();
           if (card) drawn.push(card);
       }
       if (!newGame.hands[nextPlayerId]) newGame.hands[nextPlayerId] = [];
       newGame.hands[nextPlayerId].push(...drawn);
       newGame.players[nextIdx].cardCount = newGame.hands[nextPlayerId].length;
       skip = 2; 
    }
    
    if (lastCard.type === CardType.DRAW4) {
       let drawn: Card[] = [];
       for(let i=0; i<4; i++) {
           if (newGame.remainingDeck.length === 0) {
               if (newGame.discardPile.length > 1) {
                   const top = newGame.discardPile.pop();
                   const rest = newGame.discardPile;
                   newGame.discardPile = [top!];
                   newGame.remainingDeck = rest.sort(() => Math.random() - 0.5);
               } else break;
           }
           const card = newGame.remainingDeck.pop();
           if (card) drawn.push(card);
       }
       if (!newGame.hands[nextPlayerId]) newGame.hands[nextPlayerId] = [];
       newGame.hands[nextPlayerId].push(...drawn);
       newGame.players[nextIdx].cardCount = newGame.hands[nextPlayerId].length;
       skip = 2;
    }

    // 4. Check Win
    if (newGame.hands[playerId].length === 0) {
        newGame.status = 'Finalizado';
        newGame.winnerId = playerId;
        await supabase.from('rooms').update({ status: 'Finalizado', game_state: newGame }).eq('id', activeRoom.id);
        get().setGameStatus(GameStatus.VICTORY);
        return;
    }

    // 5. Next Turn
    newGame.turnIndex = (newGame.turnIndex + (skip * newGame.direction) + newGame.players.length) % newGame.players.length;
    newGame.lastUpdate = Date.now();

    set({ activeGame: newGame }); // Optimistic update
    await supabase.from('rooms').update({ game_state: newGame }).eq('id', activeRoom.id);
  },

  drawCard: async (playerId: string, count: number) => {
      const { activeGame, activeRoom, session } = get();
      if (!activeGame || !activeRoom || !session || !supabase) return;
      
      const newGame = JSON.parse(JSON.stringify(activeGame)) as ActiveGameState;
      const playerIndex = newGame.players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) return;

      let drawn: Card[] = [];
      for(let i=0; i<count; i++) {
         if (newGame.remainingDeck.length === 0) {
             if (newGame.discardPile.length > 1) {
                 const top = newGame.discardPile.pop();
                 const rest = newGame.discardPile;
                 newGame.discardPile = [top!];
                 newGame.remainingDeck = rest.sort(() => Math.random() - 0.5);
             } else break;
         }
         const card = newGame.remainingDeck.pop();
         if (card) drawn.push(card);
      }

      if (!newGame.hands[playerId]) newGame.hands[playerId] = [];
      newGame.hands[playerId].push(...drawn);
      newGame.players[playerIndex].cardCount = newGame.hands[playerId].length;
      
      newGame.lastUpdate = Date.now();
      set({ activeGame: newGame }); // Optimistic update
      await supabase.from('rooms').update({ game_state: newGame }).eq('id', activeRoom.id);
  },
  startChallenge: () => {},
  toggleDeckCard: (id) => {
    const p = get().profile; if (!p) return;
    const newDeck = p.activeDeck.includes(id) ? p.activeDeck.filter(x => x !== id) : [...p.activeDeck, id].slice(0, 8);
    get().syncProfile({ activeDeck: newDeck });
  },
  upgradeCard: () => {},
  buyShopItem: () => {},
  quitGame: async () => {
    const { activeRoom } = get();
    if (activeRoom) {
       await get().leaveRoom();
    } else {
       set({ gameStatus: GameStatus.MENU });
    }
  },
  leaveRoom: async () => {
    const { activeRoom, session, isGuest } = get();
    if (!activeRoom) {
        set({ gameStatus: GameStatus.LOBBY });
        return;
    }

    if (!isGuest && session && supabase) {
        try {
            await supabase.from('room_players').delete().eq('room_id', activeRoom.id).eq('user_id', session.user.id);
            await supabase.rpc('decrement_room_players', { room_id: activeRoom.id });
        } catch (e) { console.error(e); }
    }
    
    get().unsubscribeFromActiveRoom();
    set({ activeRoom: null, activeGame: null, gameStatus: GameStatus.LOBBY });
  },
  completeOnboarding: () => get().syncProfile({ isFirstTime: false }),
  startArenaBattle: (idx) => { set({ currentArenaIndex: idx, gameStatus: GameStatus.LOADING }); setTimeout(() => set({ gameStatus: GameStatus.BATTLE }), 1500); },
  startBossBattle: (idx, rid, isB) => { set({ currentArenaIndex: idx, activeBossRewardId: rid, isBossBattle: isB, gameStatus: GameStatus.LOADING }); setTimeout(() => set({ gameStatus: GameStatus.BATTLE }), 1500); },
  advanceArena: () => { const p = get().profile; if (p) get().syncProfile({ currentArena: p.currentArena + 1 }); },
  claimTrophyReward: (rid) => { const p = get().profile; if (p) get().syncProfile({ claimedRewards: [...p.claimedRewards, rid] }); },
  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),

  subscribeToLobby: () => {
    if (!supabase) return;
    const sub = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload: any) => {
        get().fetchRooms();
      })
      .subscribe();
    set({ lobbySubscription: sub });
  },

  unsubscribeFromLobby: () => {
    const { lobbySubscription } = get();
    if (lobbySubscription) supabase.removeChannel(lobbySubscription);
    set({ lobbySubscription: null });
  },

  subscribeToActiveRoom: (roomId) => {
    if (!supabase) return;
    const sub = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload: any) => {
        if (payload.new) {
           const r = payload.new;
           // Map DB columns to frontend types
           const mapped: GameRoom = {
             id: r.id,
             creatorId: r.creator_id,
             creatorName: r.creator_name,
             maxPlayers: r.max_players,
             currentPlayers: r.current_players,
             betAmount: r.bet_amount,
             timePerTurn: r.time_per_turn,
             status: r.status,
             arenaName: r.arena_name
           };
           set({ activeRoom: mapped });
           
           if (r.game_state) {
              set({ activeGame: r.game_state as ActiveGameState });
           }

           if (mapped.status === 'Em Jogo') {
               set({ gameStatus: GameStatus.BATTLE });
           } else if (mapped.status === 'Finalizado') {
               const winnerId = r.game_state?.winnerId;
               const myId = get().session?.user?.id;
               // Avoid resetting if already showing result
               if (get().gameStatus !== GameStatus.VICTORY && get().gameStatus !== GameStatus.DEFEAT) {
                   if (winnerId === myId) {
                       set({ gameStatus: GameStatus.VICTORY });
                       get().updateTrophies(30);
                   } else {
                       set({ gameStatus: GameStatus.DEFEAT });
                       get().updateTrophies(-15);
                   }
               }
           }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => {
        // Fetch players if needed, or just update count
      })
      .subscribe();
    set({ roomSubscription: sub });
  },

  unsubscribeFromActiveRoom: () => {
    const { roomSubscription } = get();
    if (roomSubscription) supabase.removeChannel(roomSubscription);
    set({ roomSubscription: null });
  },

  addSocialMessage: async (text: string) => {
    const { profile, session, isGuest } = get();
    if (!profile) return;
    
    const newMessage: SocialMessage = {
      id: `msg-${Date.now()}`,
      user: profile.name,
      avatar: '👑',
      text,
      timestamp: Date.now()
    };

    set({ socialFeed: [...get().socialFeed, newMessage] });

    if (!isGuest && session) {
      try {
        await supabase.from('social_messages').insert({
          id: newMessage.id,
          user: newMessage.user,
          avatar: newMessage.avatar,
          text: newMessage.text,
          timestamp: newMessage.timestamp,
          user_id: session.user.id
        });
      } catch (e) { console.error(e); }
    }
  }
})); 
