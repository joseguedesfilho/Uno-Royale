
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { GameStatus } from '../types';
import { ARENAS } from '../constants';
import { SOUNDS, playSound } from '../logic/soundManager';

const MenuView: React.FC = () => {
  const { profile, setGameStatus, currentArenaIndex } = useGameStore();
  const [activeTab, setActiveTab] = useState('Batalha');
  const arena = ARENAS[currentArenaIndex];

  const tabs = [
    { name: 'Loja', icon: '🛒' },
    { name: 'Cartas', icon: '🃏' },
    { name: 'Batalha', icon: '⚔️' },
    { name: 'Social', icon: '🤝' },
    { name: 'Eventos', icon: '🏆' }
  ];

  const handleTabClick = (tabName: string) => {
    playSound(SOUNDS.CLICK);
    setActiveTab(tabName);
  };

  const handleBattleClick = () => {
    playSound(SOUNDS.CLICK);
    setGameStatus(GameStatus.BATTLE);
  };

  const getRankName = (trophies: number) => {
    if (trophies < 500) return 'Bronze';
    if (trophies < 1200) return 'Prata';
    if (trophies < 2000) return 'Ouro';
    if (trophies < 3000) return 'Platina';
    return 'Mestre';
  };

  return (
    <div className="h-screen w-full bg-[#1a2b45] flex flex-col text-white overflow-hidden">
      <div className="p-4 flex justify-between items-center bg-black/40 border-b border-white/10 z-10">
        <div className="flex items-center gap-4">
           <div className="relative">
             <div className="w-12 h-12 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center text-2xl font-black">
               {profile.level}
             </div>
             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full border border-black text-[10px] flex items-center justify-center font-bold text-black">
               {profile.xp}
             </div>
           </div>
           <div>
             <div className="font-black clash-text text-lg tracking-wide italic uppercase">{profile.name}</div>
             <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-xs">🏆</span>
                <span className="text-white/80 text-xs font-bold">{profile.trophies} Troféus</span>
             </div>
           </div>
        </div>

        <div className="flex gap-2">
           <div className="bg-black/60 rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
             <span className="text-yellow-500 font-bold text-sm">{profile.gold}</span>
             <span className="text-lg">💰</span>
           </div>
           <div className="bg-black/60 rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
             <span className="text-emerald-400 font-bold text-sm">{profile.gems}</span>
             <span className="text-lg">💎</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        {activeTab === 'Batalha' && (
          <div className="h-full flex flex-col items-center justify-center p-6 gap-8">
            <div className="w-full max-w-md bg-gradient-to-b from-blue-800 to-blue-950 rounded-3xl border-4 border-blue-400/30 overflow-hidden shadow-2xl">
              <div className="h-48 relative overflow-hidden">
                <img src={arena.banner} className="w-full h-full object-cover opacity-60" alt="Arena Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950 to-transparent"></div>
                <div className="absolute bottom-4 left-0 w-full text-center">
                  <div className="text-blue-300 text-xs font-black uppercase tracking-widest">Arena {currentArenaIndex + 1}</div>
                  <div className="text-white text-3xl font-black clash-text uppercase italic">{arena.name}</div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-4">
                 <div className="flex justify-between items-center text-sm font-bold bg-black/40 rounded-xl p-3">
                   <span className="uppercase opacity-70 tracking-tighter">Oponentes</span>
                   <span className="text-red-400 uppercase">{arena.bots} Bots</span>
                 </div>
                 <button 
                  onClick={handleBattleClick}
                  className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 py-4 rounded-2xl border-b-8 border-yellow-800 clash-button text-2xl font-black clash-text italic tracking-wider text-black flex flex-col items-center"
                 >
                   BATALHAR
                   <span className="text-[10px] -mt-1 opacity-80 uppercase font-black">Modo Arena PVE</span>
                 </button>
              </div>
            </div>

            <div className="w-full max-w-md bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-4 border-2 border-white/10 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="text-4xl">⚔️</div>
                 <div>
                   <div className="font-black text-sm uppercase italic">Modo Ranqueado</div>
                   <div className="text-indigo-300 text-xs font-bold">Liga {getRankName(profile.trophies)}</div>
                 </div>
               </div>
               <button className="bg-purple-600 px-6 py-2 rounded-xl border-b-4 border-purple-800 font-bold text-xs clash-button opacity-50 cursor-not-allowed uppercase">
                 BLOQUEADO
               </button>
            </div>
          </div>
        )}

        {activeTab !== 'Batalha' && (
           <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-black clash-text mb-2 uppercase">{activeTab} em breve</h2>
              <p className="text-white/50 text-sm">Esta seção está sendo preparada pelos Engenheiros Reais.</p>
           </div>
        )}
      </div>

      <div className="h-20 bg-[#0d1726] border-t-4 border-black/50 flex justify-around items-center px-2">
        {tabs.map(tab => (
          <button 
            key={tab.name}
            onClick={() => handleTabClick(tab.name)}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${activeTab === tab.name ? 'scale-110 -translate-y-2' : 'opacity-40 grayscale'}`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className={`text-[9px] font-black uppercase tracking-tight ${activeTab === tab.name ? 'text-yellow-400' : 'text-white'}`}>
              {tab.name}
            </span>
            {activeTab === tab.name && <div className="w-8 h-1 bg-yellow-400 rounded-full mt-1"></div>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuView;
