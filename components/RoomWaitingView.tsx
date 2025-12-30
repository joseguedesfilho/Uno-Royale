
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store.ts';
import { GameStatus } from '../types.ts';
import { sounds } from '../logic/soundManager.ts';

const RoomWaitingView: React.FC = () => {
  const { activeRoom, profile, startGame, quitGame, session } = useGameStore();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!activeRoom) return null;

  const isCreator = activeRoom.creatorId === session?.user?.id;
  const readyToStart = activeRoom.currentPlayers >= 2;

  const handleLeave = () => {
    sounds.playClick();
    quitGame();
  };

  const handleStart = () => {
    sounds.playClick();
    startGame();
  };

  return (
    <div className="h-screen w-full bg-[#0b1421] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1a2b45] to-[#0b1421] rounded-[50px] border-4 border-blue-400 p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="text-6xl mb-6 animate-float">📜</div>
        <h2 className="text-3xl font-black clash-text italic uppercase tracking-tighter text-white mb-2 leading-none drop-shadow-lg">{activeRoom.arenaName}</h2>
        <p className="text-blue-300 font-bold uppercase tracking-widest text-[10px] mb-8 italic">Contrato de Batalha de {activeRoom.creatorName}</p>

        <div className="w-full flex flex-col gap-4 mb-10">
           <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Desafiantes na Arena</span>
              <div className="flex gap-4">
                 {Array.from({ length: activeRoom.maxPlayers }).map((_, i) => (
                   <div key={i} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl transition-all ${i < activeRoom.currentPlayers ? 'bg-blue-600 border-yellow-400 shadow-lg' : 'bg-black/60 border-white/5 opacity-30'}`}>
                      {i < activeRoom.currentPlayers ? (i === 0 ? '👑' : '🧛‍♂️') : '👤'}
                   </div>
                 ))}
              </div>
              <div className="mt-6 flex items-center gap-2">
                 <span className="text-xs font-black italic text-blue-400">{activeRoom.currentPlayers} / {activeRoom.maxPlayers}</span>
                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Aguardando rivais{dots}</span>
              </div>
           </div>

           <div className="flex gap-4">
              <div className="flex-1 bg-emerald-600/10 rounded-2xl p-4 border border-emerald-500/20 flex flex-col items-center">
                 <span className="text-[8px] font-black text-emerald-300/60 uppercase mb-1">APOSTA</span>
                 <span className="text-sm font-black italic text-emerald-400">{activeRoom.betAmount} 💎</span>
              </div>
              <div className="flex-1 bg-yellow-600/10 rounded-2xl p-4 border border-yellow-500/20 flex flex-col items-center">
                 <span className="text-[8px] font-black text-yellow-300/60 uppercase mb-1">POTE TOTAL</span>
                 <span className="text-sm font-black italic text-yellow-400">{activeRoom.betAmount * activeRoom.maxPlayers} 💎</span>
              </div>
           </div>
        </div>

        <div className="w-full flex flex-col gap-4">
           {isCreator ? (
             <button 
               onClick={handleStart}
               disabled={!readyToStart}
               className="w-full py-5 bg-yellow-500 rounded-2xl border-b-8 border-yellow-800 font-black clash-text italic text-xl uppercase text-black active:translate-y-2 active:border-b-0 shadow-xl disabled:grayscale disabled:opacity-50"
             >
               INICIAR BATALHA
             </button>
           ) : (
             <div className="w-full py-5 bg-blue-900/40 rounded-2xl border border-white/10 font-black clash-text italic text-sm uppercase text-white/60 animate-pulse">
                AGUARDANDO O REI...
             </div>
           )}
           
           <button 
             onClick={handleLeave}
             className="w-full py-3 text-red-400 font-black italic text-[10px] uppercase tracking-widest hover:text-red-300 transition-colors"
           >
             CANCELAR CONTRATO
           </button>
        </div>
      </div>
      
      {!readyToStart && (
        <p className="mt-8 text-[9px] text-white/30 font-bold uppercase tracking-widest text-center max-w-xs leading-relaxed italic">
          Convide outros reis para sua mesa ou aguarde até que o panteão esteja completo.
        </p>
      )}
    </div>
  );
};

export default RoomWaitingView;
