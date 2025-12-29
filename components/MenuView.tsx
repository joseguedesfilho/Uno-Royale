
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { GameStatus } from '../types';
import { ARENAS, ALL_CARDS } from '../constants';
import CardCollection from './CardCollection';

const MenuView: React.FC = () => {
  const { profile, setGameStatus, currentArenaIndex, buyCard } = useGameStore();
  const [activeTab, setActiveTab] = useState('Batalha');
  const arena = ARENAS[currentArenaIndex];

  const tabs = [
    { name: 'Loja', icon: '🛒' },
    { name: 'Cartas', icon: '🃏' },
    { name: 'Batalha', icon: '⚔️' },
    { name: 'Social', icon: '🤝' },
    { name: 'Eventos', icon: '🏆' }
  ];

  const handleBattleClick = () => {
    setGameStatus(GameStatus.LOADING);
    setTimeout(() => {
      setGameStatus(GameStatus.BATTLE);
    }, 1500);
  };

  const getRankName = (trophies: number) => {
    if (trophies < 500) return 'Bronze';
    if (trophies < 1200) return 'Prata';
    if (trophies < 2000) return 'Ouro';
    if (trophies < 3000) return 'Platina';
    return 'Mestre';
  };

  const xpProgress = (profile.xp % 1000) / 10;

  const shopItems = [
    { id: 'spell-log', cost: 2000, currency: 'gold' as const, label: 'O Tronco', qty: 1 },
    { id: 'spell-skarmy', cost: 100, currency: 'gems' as const, label: 'Exército', qty: 2 },
    { id: 'num-7', cost: 500, currency: 'gold' as const, label: 'Gigante', qty: 5 },
    { id: 'spell-mirror', cost: 500, currency: 'gems' as const, label: 'Espelho', qty: 1 }
  ];

  return (
    <div className="h-screen w-full bg-[#1a2b45] flex flex-col text-white overflow-hidden">
      
      {/* Header HUD */}
      <div className="px-4 py-3 flex justify-between items-center bg-black/90 border-b border-white/10 z-20">
        <div className="flex items-center gap-3">
           <div className="relative flex items-center">
             <div className="w-10 h-10 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center text-xl font-black italic z-10 shadow-lg">
               {profile.level}
             </div>
             <div className="w-24 h-5 bg-black/60 rounded-r-full -ml-2 pl-3 pr-2 flex items-center border border-white/10">
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden p-[1px]">
                   <div 
                    className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                    style={{ width: `${xpProgress}%` }}
                   ></div>
                </div>
             </div>
           </div>
           <div className="ml-1">
             <div className="font-black clash-text text-sm tracking-tight italic uppercase leading-none">{profile.name}</div>
             <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-400 text-[10px]">🏆</span>
                <span className="text-white/60 text-[8px] font-black uppercase italic tracking-tighter">{profile.trophies}</span>
             </div>
           </div>
        </div>

        <div className="flex gap-2">
           <div className="bg-black/60 rounded-full px-3 py-1 flex items-center gap-2 border border-white/20 shadow-inner">
             <span className="text-yellow-500 font-black text-xs">{profile.gold.toLocaleString()}</span>
             <span className="text-sm">💰</span>
           </div>
           <div className="bg-black/60 rounded-full px-3 py-1 flex items-center gap-2 border border-white/20 shadow-inner">
             <span className="text-emerald-400 font-black text-xs">{profile.gems.toLocaleString()}</span>
             <span className="text-sm">💎</span>
           </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto relative bg-[#0d1726]">
        {activeTab === 'Batalha' && (
          <div className="h-full flex flex-col items-center justify-center p-6 gap-6 animate-in fade-in duration-500">
            <div className="w-full max-w-sm bg-blue-900 rounded-[45px] border-4 border-blue-400/40 overflow-hidden relative group shadow-2xl">
              <div className="h-52 relative overflow-hidden">
                <img src={arena.banner} className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105" alt="Arena Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-0 w-full text-center">
                  <div className="text-blue-300 text-[9px] font-black uppercase tracking-[0.4em] mb-1 opacity-80">Arena {currentArenaIndex + 1}</div>
                  <div className="text-white text-4xl font-black clash-text uppercase italic tracking-tighter drop-shadow-lg">{arena.name}</div>
                </div>
              </div>
              
              <div className="p-6 bg-blue-950/50 flex flex-col gap-4">
                 <div className="flex justify-between items-center text-[10px] font-black bg-black/30 rounded-2xl px-4 py-3 border border-white/5 shadow-inner">
                   <span className="uppercase opacity-50 italic">Inimigos</span>
                   <span className="text-red-400 uppercase italic tracking-wider">{arena.bots} bots</span>
                 </div>
                 
                 <button 
                  onClick={handleBattleClick}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 py-5 rounded-[25px] border-b-[10px] border-yellow-800 clash-button text-3xl font-black clash-text italic tracking-wider text-black flex flex-col items-center transition-all relative overflow-hidden shadow-xl"
                 >
                   <span className="relative z-10">BATALHAR</span>
                   <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-white/20 skew-x-[-45deg] animate-[shimmer_3s_infinite]"></div>
                 </button>
              </div>
            </div>

            <div className="w-full max-w-sm bg-indigo-900/80 rounded-3xl p-4 border-2 border-white/10 flex items-center justify-between opacity-90 shadow-lg">
               <div className="flex items-center gap-4">
                 <div className="text-4xl">🏆</div>
                 <div>
                   <div className="font-black text-xs uppercase italic tracking-tight text-white/90">Liga {getRankName(profile.trophies)}</div>
                   <div className="text-indigo-300 text-[8px] font-black uppercase opacity-60 tracking-widest leading-none mt-1">Caminho de Troféus</div>
                 </div>
               </div>
               <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 text-[9px] font-black uppercase text-yellow-400 italic">
                 {profile.trophies}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Loja' && (
          <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-24">
            <h2 className="text-2xl font-black clash-text italic uppercase text-yellow-400 tracking-tighter">Ofertas Diárias</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {shopItems.map(item => {
                const cardDef = ALL_CARDS.find(c => c.id === item.id);
                return (
                  <div key={item.id} className="bg-blue-900/30 rounded-3xl p-4 border-2 border-white/5 flex flex-col items-center gap-3 text-center relative overflow-hidden group">
                    <div className="relative">
                      <div className={`w-16 h-20 rounded-xl flex items-center justify-center text-3xl border-2 border-white/20 shadow-lg transition-transform group-hover:scale-110 ${cardDef?.rarity === 'Lendária' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-800'}`}>
                        {cardDef?.label.charAt(0)}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded px-1.5 py-0.5 text-[10px] font-black border border-white italic">x{item.qty}</div>
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="font-black clash-text text-[10px] uppercase italic text-white/90">{item.label}</div>
                      <div className={`text-[8px] font-bold uppercase ${cardDef?.rarity === 'Lendária' ? 'text-cyan-400' : 'text-blue-300 opacity-60'}`}>{cardDef?.rarity}</div>
                    </div>

                    <button 
                      onClick={() => buyCard(item.id, item.cost, item.currency)}
                      disabled={profile[item.currency] < item.cost}
                      className={`w-full py-2 rounded-xl border-b-4 font-black clash-text text-[10px] italic transition-all active:translate-y-1 active:border-b-0
                        ${item.currency === 'gold' ? 'bg-yellow-500 border-yellow-800 text-black shadow-[0_3px_0_rgba(146,64,14,1)]' : 'bg-emerald-500 border-emerald-800 text-white shadow-[0_3px_0_rgba(6,78,59,1)]'}
                        disabled:opacity-40 disabled:grayscale
                      `}
                    >
                      {item.cost} {item.currency === 'gold' ? '💰' : '💎'}
                    </button>
                  </div>
                )
              })}
            </div>
            
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-[40px] p-8 border-4 border-purple-400/30 text-center relative overflow-hidden shadow-2xl group cursor-pointer active:scale-95 transition-transform">
               <div className="relative z-10">
                 <div className="text-5xl mb-4 drop-shadow-2xl group-hover:animate-bounce">💎</div>
                 <h3 className="text-3xl font-black clash-text italic uppercase mb-2 text-white">Pacote Real</h3>
                 <p className="text-[10px] opacity-60 uppercase font-black mb-6 tracking-widest italic text-purple-200">Garantia de 1 Lendária!</p>
                 <button className="bg-white text-blue-900 px-12 py-3.5 rounded-full font-black clash-text italic uppercase text-xs shadow-xl transition-all group-hover:px-14">R$ 19,90</button>
               </div>
               <div className="absolute top-0 left-0 w-full h-full bg-white/5 animate-pulse"></div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        )}

        {activeTab === 'Cartas' && <CardCollection />}

        {activeTab !== 'Batalha' && activeTab !== 'Cartas' && activeTab !== 'Loja' && (
           <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-300">
              <div className="text-8xl mb-6 opacity-80 grayscale">
                {tabs.find(t => t.name === activeTab)?.icon}
              </div>
              <h2 className="text-2xl font-black clash-text mb-3 uppercase italic text-yellow-400">Em Breve</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed max-w-xs italic">
                Aba bloqueada. Continue jogando para desbloquear novas funcionalidades!
              </p>
           </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="h-20 bg-[#0d1726] border-t-4 border-black/80 flex justify-around items-center px-2 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        {tabs.map(tab => (
          <button 
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 relative px-4 ${activeTab === tab.name ? 'scale-110 -translate-y-2' : 'opacity-30 grayscale'}`}
          >
            <div className={`text-2xl mb-1`}>{tab.icon}</div>
            <span className={`text-[7px] font-black uppercase tracking-widest ${activeTab === tab.name ? 'text-yellow-400' : 'text-white'}`}>
              {tab.name}
            </span>
            {activeTab === tab.name && (
              <div className="absolute -bottom-3 w-8 h-1 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          50% { left: 150%; }
          100% { left: 150%; }
        }
      `}</style>
    </div>
  );
};

export default MenuView;
