
import React from 'react';
import { useGameStore } from '../store.ts';
import { GameStatus } from '../types.ts';
import { ARENAS } from '../constants.tsx';
import { sounds } from '../logic/soundManager.ts';

const ArenaSelectionView: React.FC = () => {
  const { profile, setGameStatus, startArenaBattle } = useGameStore();

  const handleBack = () => {
    sounds.playClick();
    setGameStatus(GameStatus.MENU);
  };

  const handleStartArena = (arenaIdx: number) => {
    sounds.playClick();
    // Inicia a batalha diretamente (passando pelo loading)
    startArenaBattle(arenaIdx);
    
    // Transição imediata para a partida após o tempo de loading
    setTimeout(() => {
      setGameStatus(GameStatus.BATTLE);
    }, 1200);
  };

  const reversedArenas = [...ARENAS].map((a, i) => ({ ...a, originalIndex: i })).reverse();

  return (
    <div className="h-screen w-full bg-[#0b1421] flex flex-col text-white overflow-hidden font-sans">
      <div className="px-6 py-4 flex items-center justify-between border-b-4 border-black/80 z-50 bg-[#121d2f] shadow-2xl shrink-0">
        <button onClick={handleBack} className="w-12 h-12 bg-black/60 rounded-2xl flex items-center justify-center border-2 border-white/10 active:scale-90 transition-all shadow-lg">
          <span className="text-xl">🔙</span>
        </button>
        <div className="text-center flex-1">
          <h2 className="text-2xl font-black clash-text italic uppercase tracking-tighter text-blue-400 leading-none drop-shadow-md">TORRE DE ARENAS</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
             <div className="h-2 w-32 bg-black/60 rounded-full overflow-hidden border border-white/10 p-[1px]">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000" style={{ width: `${((profile.currentArena + 1) / 9) * 100}%` }}></div>
             </div>
             <span className="text-[10px] font-black text-blue-300 italic tracking-widest">{(profile.currentArena + 1)}/9</span>
          </div>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-10 flex flex-col gap-10 bg-[#0b1421]">
        <div className="w-full flex flex-col items-center shrink-0 mb-4">
           <div className="text-5xl animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">🏆</div>
           <span className="text-[10px] font-black uppercase tracking-[0.5em] italic text-yellow-500 mt-4 bg-yellow-500/10 px-4 py-1 rounded-full border border-yellow-500/20">PANTEÃO LENDÁRIO</span>
        </div>

        {reversedArenas.map((arena) => {
          const index = arena.originalIndex;
          const isUnlocked = index <= profile.currentArena;
          const isGoal = index === profile.currentArena;
          const isCompleted = index < profile.currentArena;

          return (
            <div key={arena.name} onClick={() => isUnlocked && handleStartArena(index)} className={`relative w-full max-w-sm mx-auto rounded-[40px] border-4 transition-all duration-300 flex-shrink-0 min-h-[190px] shadow-2xl ${isGoal ? 'border-yellow-400 scale-[1.05] z-10 ring-4 ring-yellow-400/20' : 'border-black/50'} ${isCompleted ? 'border-blue-500/30 grayscale-[0.3]' : ''} ${!isUnlocked ? 'opacity-50 grayscale brightness-[0.3] border-white/5' : 'cursor-pointer active:scale-95'}`}>
              <div className="absolute inset-0 rounded-[36px] overflow-hidden">
                <img src={arena.banner} className="w-full h-full object-cover" alt={arena.name} loading="lazy" />
                <div className={`absolute inset-0 ${isUnlocked ? 'bg-gradient-to-t from-black via-black/30 to-transparent' : 'bg-black/80'}`}></div>
              </div>
              <div className="relative p-7 h-full flex flex-col justify-between min-h-[186px]">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-white bg-blue-600 px-3 py-1 rounded-xl border border-white/20 uppercase italic tracking-tighter">Arena {index + 1}</span>
                      {isGoal && <span className="text-[10px] font-black bg-yellow-400 text-black px-3 py-1 rounded-xl animate-pulse italic">SEU DESAFIO</span>}
                    </div>
                    <h3 className="text-3xl font-black clash-text italic uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight leading-tight">{arena.name}</h3>
                  </div>
                  {!isUnlocked ? (
                    <div className="w-14 h-14 bg-black/80 rounded-2xl flex items-center justify-center text-3xl border border-white/10 shadow-inner">🔒</div>
                  ) : isCompleted ? (
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl border border-emerald-500/40 text-emerald-400 shadow-lg">✔️</div>
                  ) : (
                    <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-3xl border border-yellow-500/40 text-yellow-400 animate-pulse">⚔️</div>
                  )}
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest italic">Poder da Arena</span>
                    <span className="text-[11px] font-black text-blue-300 italic bg-black/60 px-4 py-1.5 rounded-2xl border border-blue-400/20 shadow-lg">{isUnlocked ? arena.bossPower : '?????'}</span>
                  </div>
                  {isUnlocked && (
                    <div className={`px-8 py-3 rounded-2xl border-b-[6px] font-black clash-text italic text-lg uppercase shadow-2xl transition-all ${isCompleted ? 'bg-blue-600 border-blue-900 text-white' : 'bg-yellow-500 border-yellow-800 text-black'}`}>
                      BATALHAR
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArenaSelectionView;
