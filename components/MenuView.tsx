
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store.ts';
import { GameStatus, Chest } from '../types.ts';
import { ARENAS } from '../constants.tsx';
import CardCollection from './CardCollection.tsx';
import { sounds } from '../logic/soundManager.ts';
import PassRoyaleView from './PassRoyaleView.tsx';
import QuestView from './QuestView.tsx';
import ShopView from './ShopView.tsx';
import SocialView from './SocialView.tsx';

const tabs = [
  { name: 'Loja', icon: '🛒' },
  { name: 'Cartas', icon: '🃏' },
  { name: 'Batalha', icon: '⚔️' },
  { name: 'Social', icon: '🤝' },
  { name: 'Eventos', icon: '🏆' }
];

interface ChestSlotProps {
  chest: Chest | null;
  index: number;
  onStart: (i: number) => void;
  onCollect: (i: number) => void;
}

const ChestSlot: React.FC<ChestSlotProps> = ({ chest, index, onStart, onCollect }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (chest?.isOpening && chest.startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - chest.startTime!;
        const remaining = Math.max(0, chest.unlockTime - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [chest]);

  if (!chest) {
    return (
      <div className="flex-1 aspect-[4/5] bg-black/40 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center">
        <span className="text-[6px] font-black text-white/10 uppercase tracking-widest">Vazio</span>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  };

  const isReady = chest.isOpening && timeLeft === 0;

  return (
    <div 
      onClick={() => isReady ? onCollect(index) : (!chest.isOpening && onStart(index))}
      className={`flex-1 aspect-[4/5] rounded-xl border-2 p-1 flex flex-col items-center justify-between transition-all relative overflow-hidden cursor-pointer shadow-lg
        ${chest.type === 'Prata' ? 'bg-gradient-to-b from-gray-400 to-gray-600 border-gray-300' : 
          chest.type === 'Ouro' ? 'bg-gradient-to-b from-yellow-500 to-yellow-700 border-yellow-400 shadow-yellow-500/20' : 
          'bg-gradient-to-b from-cyan-400 to-cyan-700 border-cyan-300 shadow-cyan-500/20 animate-pulse'}
        ${isReady ? 'scale-105 ring-2 ring-green-400' : ''}
      `}
    >
      <span className="text-[6px] font-black uppercase text-white/80 tracking-tighter leading-none">{chest.type}</span>
      <div className="text-lg my-0.5">📦</div>
      
      {isReady ? (
        <div className="bg-green-500 text-white font-black text-[5px] px-1.5 py-0.5 rounded-full uppercase italic animate-bounce">ABRIR</div>
      ) : chest.isOpening ? (
        <span className="text-[6px] font-black text-white uppercase italic">{formatTime(timeLeft)}</span>
      ) : (
        <span className="text-[6px] font-black text-white/60 uppercase italic">Iniciar</span>
      )}
    </div>
  );
};

const MenuView: React.FC = () => {
  const { profile, setGameStatus, currentArenaIndex, startRankedLobby, startOpeningChest, collectChest } = useGameStore();
  const [activeTab, setActiveTab] = useState('Batalha');
  const [showQuests, setShowQuests] = useState(false);

  const currentArena = ARENAS[currentArenaIndex];

  const handleTabChange = (name: string) => {
    sounds.playClick();
    setActiveTab(name);
  };

  if (!profile) return null;

  const xpProgress = (profile.xp % 1000) / 10;

  return (
    <div className="h-screen w-full bg-[#1a2b45] flex flex-col text-white overflow-hidden relative">
      {/* HEADER */}
      <div className="px-4 py-3 flex justify-between items-center bg-black/95 border-b-4 border-black/60 z-20 shrink-0">
        <div className="flex items-center gap-2">
           <div className="relative flex items-center">
             <div className="w-9 h-9 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center text-sm font-black italic z-10">{profile.level}</div>
             <div className="w-24 h-5 bg-black/60 rounded-r-full -ml-2 pl-4 pr-2 flex items-center border border-white/10 shadow-inner">
                <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden p-[0.5px]">
                   <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }}></div>
                </div>
             </div>
           </div>
           <div className="ml-1">
             <div className="font-black clash-text text-[11px] tracking-tight italic uppercase leading-none text-white">{profile.name}</div>
             <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-400 text-[9px]">🏆</span>
                <span className="text-white/60 text-[8px] font-black uppercase italic tracking-tighter">{profile.trophies}</span>
             </div>
           </div>
        </div>
        <div className="flex gap-2">
           <div className="bg-black/80 rounded-full px-3 py-1 flex items-center gap-1 border border-white/20">
             <span className="text-yellow-500 font-black text-xs">{profile.gold.toLocaleString()}</span>
             <span className="text-sm">💰</span>
           </div>
           <div className="bg-black/80 rounded-full px-3 py-1 flex items-center gap-1 border border-white/20">
             <span className="text-emerald-400 font-black text-xs">{profile.gems.toLocaleString()}</span>
             <span className="text-sm">💎</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative bg-[#1a2b45] pb-24 no-scrollbar">
        {activeTab === 'Batalha' && (
          <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-500 max-w-lg mx-auto h-full justify-start">
            
            {/* PASS ROYALE COMPACTO */}
            <button 
              onClick={() => setActiveTab('Eventos')} 
              className="w-full h-10 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-2xl border-b-4 border-amber-800 flex items-center justify-between px-6 active:scale-95 transition-all shrink-0"
            >
                <div className="flex items-center gap-3">
                   <span className="text-xl">🎟️</span>
                   <span className="text-[10px] font-black clash-text italic uppercase text-black">PASS ROYALE</span>
                </div>
                <div className="bg-black/20 px-3 py-1 rounded-full text-[9px] font-black text-black">NV {Math.floor(profile.passXP/100)}</div>
            </button>

            {/* BOTÃO ARENA (BANNER) - MAIS BAIXO E DESTACADO */}
            <button 
              onClick={() => setGameStatus(GameStatus.ARENA_SELECTION)}
              className="relative w-full h-20 rounded-[30px] overflow-hidden border-4 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] shrink-0 active:scale-95 transition-all"
            >
               <img src={currentArena.banner} className="w-full h-full object-cover" alt="Arena" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <h2 className="text-xl font-black clash-text italic uppercase tracking-tighter text-white">{currentArena.name}</h2>
                  <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest bg-black/40 px-3 py-0.5 rounded-full mt-1 border border-white/10">MODO ARENA</span>
               </div>
            </button>
            
            {/* BOTÃO MODO RANQUEADO - ALTURA REDUZIDA (py-4) E SEM SOMBRA NAS LETRAS */}
            <button 
              onClick={startRankedLobby} 
              className="w-full py-4 bg-royale-gold rounded-[30px] border-b-[8px] border-amber-900 shadow-xl flex items-center px-10 gap-8 active:translate-y-2 active:border-b-0 transition-all transform shrink-0 btn-3d"
            >
                <div className="text-4xl">⚔️</div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-2xl text-black font-black clash-text italic uppercase tracking-tighter leading-none">MODO RANQUEADO</span>
                  <span className="text-[9px] text-black/50 font-bold uppercase tracking-widest italic mt-0.5">BATALHAR</span>
                </div>
            </button>

            {/* BOTÃO CAMINHO REAL - ALTURA REDUZIDA (py-4) E SEM SOMBRA NAS LETRAS */}
            <button 
              onClick={() => setGameStatus(GameStatus.TROPHY_ROAD)} 
              className="w-full py-4 bg-[#3aa948] rounded-[30px] border-b-[8px] border-[#22632b] shadow-xl flex items-center px-10 gap-8 active:translate-y-2 active:border-b-0 transition-all transform shrink-0 btn-3d"
            >
                <div className="text-4xl">🗺️</div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-2xl text-white font-black clash-text italic uppercase tracking-tighter leading-none">CAMINHO REAL</span>
                  <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest italic mt-0.5">RECOMPENSAS</span>
                </div>
            </button>

            {/* GRADE DE 2 BOTÕES (MISSÕES E RANKING) */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
                <button 
                  onClick={() => setShowQuests(true)} 
                  className="py-3 bg-[#3558a7] rounded-[22px] border-b-6 border-[#1a2b45] shadow-lg flex items-center justify-center gap-3 active:translate-y-1 active:border-b-0 btn-3d"
                >
                   <span className="text-xl">📜</span>
                   <span className="text-[10px] font-black uppercase italic">MISSÕES</span>
                </button>
                <button 
                  onClick={() => setGameStatus(GameStatus.LEADERBOARD)} 
                  className="py-3 bg-[#a34cb4] rounded-[22px] border-b-6 border-[#5c1c70] shadow-lg flex items-center justify-center gap-3 active:translate-y-1 active:border-b-0 btn-3d"
                >
                   <span className="text-xl">🏆</span>
                   <span className="text-[10px] font-black uppercase italic">RANKING</span>
                </button>
            </div>

            {/* ESPAÇOS DE BAÚS - AGORA ENQUADRADOS */}
            <div className="mt-auto flex flex-col gap-2 shrink-0 pb-6">
               <div className="flex justify-between items-center px-4">
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] italic">Baús em Espera</span>
               </div>
               <div className="flex gap-3">
                 {profile.chestSlots.map((chest, i) => (
                   <ChestSlot key={i} index={i} chest={chest} onStart={startOpeningChest} onCollect={collectChest} />
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Cartas' && <CardCollection />}
        {activeTab === 'Loja' && <ShopView />}
        {activeTab === 'Social' && <SocialView />}
        {activeTab === 'Eventos' && <PassRoyaleView onBack={() => setActiveTab('Batalha')} />}
      </div>

      {/* NAV BAR ESTILO ROYALE */}
      <nav className="fixed bottom-0 w-full h-20 bg-[#0b1421] border-t-8 border-black/80 flex justify-around items-end px-4 z-40 pb-2">
        {tabs.map(tab => (
          <button 
            key={tab.name} 
            onClick={() => handleTabChange(tab.name)} 
            className={`flex flex-col items-center gap-1.5 transition-all relative ${activeTab === tab.name ? 'scale-110 -translate-y-4' : 'opacity-40 grayscale'}`}
          >
            {activeTab === tab.name && <div className="absolute -top-4 w-12 h-1 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(234,179,8,1)]"></div>}
            <div className={`text-2xl ${activeTab === tab.name ? 'animate-bounce' : ''}`}>{tab.icon}</div>
            <span className={`text-[9px] font-black uppercase tracking-tighter ${activeTab === tab.name ? 'text-yellow-400' : 'text-white'}`}>{tab.name}</span>
          </button>
        ))}
      </nav>

      {showQuests && <QuestView onClose={() => setShowQuests(false)} />}
    </div>
  );
};

export default MenuView;
