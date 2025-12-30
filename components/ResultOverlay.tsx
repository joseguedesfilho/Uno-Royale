
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { GameStatus } from '../types';

const ResultOverlay: React.FC = () => {
  const { 
    gameStatus, 
    setGameStatus, 
    lastRewards, 
    addRewards, 
    resetBattle,
    setLastRewards
  } = useGameStore();

  if (gameStatus !== GameStatus.VICTORY && gameStatus !== GameStatus.DEFEAT) return null;

  const handleCollect = () => {
    if (lastRewards) {
      const xpBase = gameStatus === GameStatus.VICTORY ? 150 : 25;
      const totalGold = lastRewards.gold + (lastRewards.bonus || 0);
      addRewards(totalGold, lastRewards.gems, xpBase);
    }
    setLastRewards(null);
    setGameStatus(GameStatus.MENU);
    resetBattle();
  };

  const isVictory = gameStatus === GameStatus.VICTORY;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
      <div className={`w-full max-w-md rounded-[60px] border-4 shadow-2xl p-10 flex flex-col items-center text-center relative overflow-hidden ${isVictory ? 'border-yellow-400 bg-gradient-to-b from-[#1a2b45] to-[#0b1421]' : 'border-red-600 bg-gradient-to-b from-[#2a1a1a] to-black'}`}>
        
        {isVictory && <div className="absolute top-0 inset-x-0 h-1 bg-yellow-400 animate-pulse"></div>}

        <h1 className={`text-5xl font-black clash-text italic mb-10 tracking-tighter uppercase ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
          {isVictory ? 'VITÓRIA REAL!' : 'DERROTA'}
        </h1>

        <div className="w-full flex flex-col gap-5 mb-10">
          {isVictory ? (
            <div className="bg-black/40 rounded-[40px] p-8 border-2 border-white/5 flex flex-col gap-6">
              <div className="flex justify-around items-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">💰</span>
                  <span className="text-yellow-500 font-black text-2xl">+{lastRewards?.gold}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">💎</span>
                  <span className="text-emerald-400 font-black text-2xl">+{lastRewards?.gems}</span>
                </div>
              </div>

              {lastRewards?.bonus && lastRewards.bonus > 0 && (
                <div className="flex justify-between items-center bg-blue-900/30 px-6 py-4 rounded-2xl border border-blue-400/20">
                   <div className="flex flex-col items-start">
                      <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">BÔNUS DE NÍVEL</span>
                      <span className="text-[8px] text-white/40 font-bold uppercase">Baseado no seu Deck</span>
                   </div>
                   <span className="text-yellow-400 font-black italic">+{lastRewards.bonus} 💰</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 bg-white/5 py-3 rounded-full">
                 <span className="text-2xl">📦</span>
                 <span className="text-[10px] font-black text-white/60 uppercase italic tracking-widest">BAÚ ADQUIRIDO!</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-6 opacity-30 grayscale scale-125">
              <span className="text-9xl">🥀</span>
            </div>
          )}
        </div>

        <button 
          onClick={handleCollect}
          className={`w-full py-6 rounded-[35px] border-b-[10px] text-2xl font-black clash-text text-white uppercase italic tracking-wider active:translate-y-2 active:border-b-0 ${isVictory ? 'bg-emerald-500 border-emerald-900 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-blue-600 border-blue-950'}`}
        >
          {isVictory ? 'COLETAR TUDO' : 'VOLTAR'}
        </button>
      </div>
    </div>
  );
};

export default ResultOverlay;
