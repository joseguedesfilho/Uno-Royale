
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store.ts';
import { GameStatus } from '../types.ts';
import { ARENAS } from '../constants.tsx';
import CardCollection from './CardCollection.tsx';
import { sounds } from '../logic/soundManager.ts';

const tabs = [
  { name: 'Loja', icon: '🛒' },
  { name: 'Cartas', icon: '🃏' },
  { name: 'Batalha', icon: '⚔️' },
  { name: 'Social', icon: '🤝' },
  { name: 'Eventos', icon: '🏆' }
];

const MenuView: React.FC = () => {
  const { 
    profile, 
    setGameStatus, 
    currentArenaIndex, 
    startOpeningChest, 
    collectChest, 
    buyCard, 
    buyGoldPack,
    completeOnboarding,
    startRankedLobby
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState('Batalha');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentArena = ARENAS[currentArenaIndex];

  const handleTabChange = (name: string) => {
    sounds.playClick();
    setActiveTab(name);
  };

  const handleStartRanked = () => {
    sounds.playClick();
    if (profile.isFirstTime) completeOnboarding();
    startRankedLobby();
  };

  const handleBuy = (item: any) => {
    if (item.id === 'gold-pack') {
      if (profile.gems >= item.cost) {
        sounds.playChestOpen();
        buyGoldPack();
      }
    } else {
      const currency = item.currency as 'gold' | 'gems';
      if (profile[currency] >= item.cost) {
        sounds.playClick();
        buyCard(item.id, item.cost, currency, item.qty);
      }
    }
  };

  const xpProgress = (profile.xp % 1000) / 10;

  const shopItems = [
    { id: 'num-0', label: 'E. de Gelo', cost: 250, currency: 'gold', icon: '❄️', qty: 5 },
    { id: 'spell-skarmy', label: 'Exército', cost: 1200, currency: 'gold', icon: '💀', qty: 3 },
    { id: 'gold-pack', label: '1000 Ouro', cost: 50, currency: 'gems', icon: '💰', qty: 1000 },
    { id: 'spell-mirror', label: 'Espelho', cost: 250, currency: 'gems', icon: '🪞', qty: 2 }
  ];

  const formatTime = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  const clans = [
    { name: 'Reis do Uno', members: '48/50', trophies: '45k', icon: '👑' },
    { name: 'Legião Real', members: '50/50', trophies: '52k', icon: '🛡️' },
    { name: 'Mestres das Cartas', members: '12/50', trophies: '15k', icon: '🃏' }
  ];

  return (
    <div className="h-screen w-full bg-[#1a2b45] flex flex-col text-white overflow-hidden relative">
      
      {profile.isFirstTime && activeTab === 'Batalha' && (
        <div className="absolute inset-0 z-[100] bg-black/70 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="mb-6 text-7xl animate-bounce">☝️</div>
          <h3 className="text-3xl font-black clash-text italic uppercase mb-2">Bem-vindo, Desafiante!</h3>
          <p className="text-blue-300 font-bold uppercase tracking-widest text-[10px] mb-12">Toque em Batalha para começar sua jornada.</p>
          <div className="w-1 h-20 bg-gradient-to-b from-blue-400 to-transparent animate-pulse"></div>
        </div>
      )}

      <div className="px-4 py-3 flex justify-between items-center bg-black/95 border-b-2 border-white/5 z-20">
        <div className="flex items-center gap-3">
           <div className="relative flex items-center">
             <div className="w-10 h-10 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center text-xl font-black italic z-10 shadow-lg">{profile.level}</div>
             <div className="w-24 h-5 bg-black/60 rounded-r-full -ml-2 pl-3 pr-2 flex items-center border border-white/10 shadow-inner">
                <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden p-[1px]">
                   <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }}></div>
                </div>
             </div>
           </div>
           <div className="ml-1">
             <div className="font-black clash-text text-sm tracking-tight italic uppercase leading-none text-white">{profile.name}</div>
             <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-400 text-[10px]">🏆</span>
                <span className="text-white/60 text-[8px] font-black uppercase italic tracking-tighter">{profile.trophies}</span>
             </div>
           </div>
        </div>
        <div className="flex gap-2">
           <div className="bg-black/80 rounded-full px-3 py-1 flex items-center gap-2 border border-white/20">
             <span className="text-yellow-500 font-black text-xs">{profile.gold.toLocaleString()}</span>
             <span className="text-sm">💰</span>
           </div>
           <div className="bg-black/80 rounded-full px-3 py-1 flex items-center gap-2 border border-white/20">
             <span className="text-emerald-400 font-black text-xs">{profile.gems.toLocaleString()}</span>
             <span className="text-sm">💎</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative bg-[#0b1421] pb-24">
        {activeTab === 'Batalha' && (
          <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-500 max-w-lg mx-auto">
            <div className="relative w-full rounded-[30px] overflow-hidden border-2 border-white/10 shadow-xl mb-2">
               <img src={currentArena.banner} className="w-full h-28 object-cover opacity-40" alt="Arena" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0b1421] to-transparent"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Status da Temporada</span>
                  <h2 className="text-2xl font-black clash-text italic uppercase tracking-tighter text-white drop-shadow-lg">{currentArena.name}</h2>
               </div>
            </div>
            <div className="flex flex-col gap-3 w-full">
               <button onClick={handleStartRanked} className="w-full py-6 bg-yellow-500 rounded-[25px] border-b-[8px] border-yellow-800 shadow-xl flex items-center px-8 gap-6 active:translate-y-1 active:border-b-[2px] transition-all group z-[110]">
                  <div className="text-4xl drop-shadow-lg group-active:scale-110 transition-transform shrink-0">⚔️</div>
                  <div className="flex flex-col items-start"><span className="text-xl text-black font-black clash-text italic uppercase tracking-tight leading-none">MODO RANQUEADO</span><span className="text-[9px] text-black/40 font-bold uppercase tracking-widest italic">Lobby Competitivo</span></div>
               </button>
               <button onClick={() => { sounds.playClick(); setGameStatus(GameStatus.ARENA_SELECTION); }} className="w-full py-6 bg-blue-600 rounded-[25px] border-b-[8px] border-blue-900 shadow-xl flex items-center px-8 gap-6 active:translate-y-1 active:border-b-[2px] transition-all group">
                  <div className="text-4xl drop-shadow-lg group-active:scale-110 transition-transform shrink-0">🏟️</div>
                  <div className="flex flex-col items-start text-white"><span className="text-xl font-black clash-text italic uppercase tracking-tight leading-none">TREINO EM ARENA</span><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest italic">Selecione seu Campo</span></div>
               </button>
               <button onClick={() => { sounds.playClick(); setGameStatus(GameStatus.TROPHY_ROAD); }} className="w-full py-6 bg-indigo-700 rounded-[25px] border-b-[8px] border-indigo-950 shadow-xl flex items-center px-8 gap-6 active:translate-y-1 active:border-b-[2px] transition-all group">
                  <div className="text-4xl drop-shadow-lg group-active:scale-110 transition-transform shrink-0">🗺️</div>
                  <div className="flex flex-col items-start text-white"><span className="text-xl font-black clash-text italic uppercase tracking-tight leading-none">CAMINHO DE TROFÉU</span><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest italic">Jornada da Realeza</span></div>
               </button>
            </div>
            <div className="bg-black/40 p-5 rounded-[35px] border border-white/5 shadow-inner mt-4">
               <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-[10px] font-black text-white/30 uppercase italic tracking-widest">Espaços de Baú</span>
                  <div className="flex gap-1 items-center"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div><span className="text-[8px] text-blue-400 font-bold uppercase">Timer Ativo</span></div>
               </div>
               <div className="grid grid-cols-4 gap-3">
                  {profile.chestSlots.map((chest, idx) => {
                    const timeLeft = chest?.startTime ? (chest.startTime + chest.unlockTime - currentTime) : 0;
                    const isReady = timeLeft <= 0 && chest?.isOpening;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => { 
                          if (!chest) return;
                          sounds.playClick();
                          if (isReady) collectChest(idx);
                          else if (!chest.isOpening) startOpeningChest(idx);
                        }} 
                        className={`aspect-square rounded-[22px] border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-90 shadow-xl relative overflow-hidden ${chest ? 'bg-gradient-to-b from-blue-700 to-blue-900 border-blue-400/50' : 'bg-black/60 border-white/5 opacity-40'}`}
                      >
                        {chest ? (
                          <>
                            <span className={`text-2xl drop-shadow-lg ${isReady ? 'animate-bounce' : ''}`}>📦</span>
                            {!chest.isOpening ? (
                              <span className="text-[6px] font-black text-white/60 uppercase">TOQUE PARA ABRIR</span>
                            ) : isReady ? (
                              <span className="text-[6px] font-black text-emerald-400 uppercase">ABRIR AGORA!</span>
                            ) : (
                              <span className="text-[6px] font-black text-yellow-400 uppercase">{formatTime(timeLeft)}</span>
                            )}
                          </>
                        ) : (
                          <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Loja' && (
          <div className="p-6 flex flex-col gap-8 pb-24 max-w-lg mx-auto animate-in slide-in-from-left duration-300">
             <h2 className="text-2xl font-black clash-text italic uppercase text-yellow-400 tracking-tighter border-b-2 border-yellow-400/20 pb-2">OFERTAS DA ARENA</h2>
             <div className="grid grid-cols-2 gap-4">
                {shopItems.map(item => (
                  <div key={item.id} className="bg-blue-950/40 rounded-3xl p-5 border border-white/10 flex flex-col items-center gap-3 relative group overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity"></div>
                    <div className="text-5xl drop-shadow-lg mb-2">{item.icon}</div>
                    <div className="text-center">
                       <div className="text-xs font-black clash-text italic uppercase leading-none">{item.label}</div>
                       <div className="text-[9px] text-blue-300 font-bold uppercase mt-1">x{item.qty} Unidades</div>
                    </div>
                    <button 
                      onClick={() => handleBuy(item)}
                      disabled={profile[item.currency as 'gold' | 'gems'] < item.cost}
                      className={`w-full py-2 rounded-xl border-b-4 font-black text-xs clash-text italic uppercase transition-all active:translate-y-1 active:border-b-0 disabled:grayscale disabled:opacity-50 ${item.currency === 'gold' ? 'bg-emerald-600 border-emerald-900' : 'bg-blue-600 border-blue-900'}`}
                    >
                      {item.cost} {item.currency === 'gold' ? '💰' : '💎'}
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'Social' && (
           <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
              <h2 className="text-2xl font-black clash-text italic uppercase text-blue-400 tracking-tighter">CLÃS EM DESTAQUE</h2>
              <div className="flex flex-col gap-3">
                 {clans.map(clan => (
                    <div key={clan.name} className="bg-black/40 p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-xl">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-2xl border-2 border-white/10 shadow-lg">{clan.icon}</div>
                          <div>
                             <div className="font-black text-sm italic uppercase tracking-tight">{clan.name}</div>
                             <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{clan.members} Membros</div>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-yellow-400 font-black italic">{clan.trophies} 🏆</span>
                          <button className="text-[8px] font-black uppercase tracking-widest bg-blue-600 px-3 py-1 rounded-full mt-1 border border-white/10">ENTRAR</button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'Eventos' && (
           <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-black clash-text italic uppercase text-red-500 tracking-tighter">EVENTOS GLOBAIS</h2>
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 p-6 rounded-[35px] border-b-8 border-yellow-950 flex flex-col items-center gap-4 text-center shadow-2xl animate-float">
                 <div className="text-6xl drop-shadow-xl">💰</div>
                 <div>
                    <h3 className="text-xl font-black clash-text italic uppercase tracking-tighter text-black">DOBRO DE OURO</h3>
                    <p className="text-black/60 text-[8px] font-bold uppercase tracking-widest mt-1">Todas as batalhas premiam 2x mais ouro!</p>
                 </div>
                 <div className="bg-black/20 px-4 py-1 rounded-full text-[10px] font-black italic">TERMINA EM: 14h 22m</div>
              </div>
           </div>
        )}

        {activeTab === 'Cartas' && <CardCollection />}
      </div>

      <nav className="fixed bottom-0 w-full h-20 bg-[#0b1421] border-t-4 border-black/80 flex justify-around items-center px-4 z-40 shadow-xl">
        {tabs.map(tab => (
          <button 
            key={tab.name} 
            onClick={() => handleTabChange(tab.name)} 
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4 ${activeTab === tab.name ? 'scale-115 -translate-y-3' : 'opacity-40 grayscale hover:opacity-60'}`}
          >
            <div className="text-2xl filter drop-shadow-md">{tab.icon}</div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === tab.name ? 'text-yellow-400' : 'text-white'}`}>{tab.name}</span>
            {activeTab === tab.name && <div className="absolute -bottom-4 w-10 h-1.5 bg-yellow-400 rounded-full shadow-lg"></div>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default MenuView;
