
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { GameStatus } from '../types';
import { ARENAS } from '../constants';

const ResultOverlay: React.FC = () => {
  const { 
    gameStatus, 
    setGameStatus, 
    lastRewards, 
    addRewards, 
    advanceArena, 
    setLastRewards, 
    profile, 
    addChest, 
    isBossBattle, 
    activeBossRewardId,
    claimTrophyReward,
    currentArenaIndex,
    isRanked,
    updateTrophies,
    resetBattle
  } = useGameStore();
  
  const [chestStatus, setChestStatus] = useState<'IDLE' | 'ACQUIRED' | 'FULL'>('IDLE');

  useEffect(() => {
    if (gameStatus === GameStatus.VICTORY) {
      const added = addChest('Prata'); 
      setChestStatus(added ? 'ACQUIRED' : 'FULL');
    }
  }, [gameStatus, addChest]);

  if (gameStatus !== GameStatus.VICTORY && gameStatus !== GameStatus.DEFEAT) return null;

  const handleCollect = () => {
    if (lastRewards) {
      const xpBase = isBossBattle ? 350 : (gameStatus === GameStatus.VICTORY ? 75 : 15);
      addRewards(lastRewards.gold, lastRewards.gems, xpBase);
    }
    
    if (gameStatus === GameStatus.VICTORY && activeBossRewardId) {
      claimTrophyReward(activeBossRewardId);
      if (!isBossBattle) {
        updateTrophies(50);
      }
    }

    if (gameStatus === GameStatus.VICTORY && !isRanked && !isBossBattle && !activeBossRewardId) {
       if (currentArenaIndex === profile.currentArena) {
          if (profile.currentArena < ARENAS.length - 1) {
            advanceArena();
          }
       }
    }
    
    setLastRewards(null);
    const wasFromTrophyRoad = !!activeBossRewardId;
    const wasFromArenaSelection = !isRanked && !isBossBattle && !activeBossRewardId;
    
    if (wasFromTrophyRoad) {
      setGameStatus(GameStatus.TROPHY_ROAD);
    } else if (wasFromArenaSelection) {
      setGameStatus(GameStatus.ARENA_SELECTION);
    } else {
      setGameStatus(GameStatus.MENU);
    }
    
    resetBattle();
  };

  const isVictory = gameStatus === GameStatus.VICTORY;
  const overlayClass = "fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-xl animate-in fade-in zoom-in duration-500";
  const cardClass = `w-full max-w-sm rounded-[60px] border-4 shadow-2xl p-12 flex flex-col items-center text-center relative overflow-hidden ${isVictory ? 'border-yellow-400 bg-gradient-to-b from-[#1a2b45] to-[#0b1421]' : 'border-red-600 bg-gradient-to-b from-[#2a1a1a] to-black'}`;

  return (
    <div className={overlayClass}>
      <div className={cardClass}>
        {isVictory && (
           <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none animate-pulse"></div>
        )}

        <h1 className={`text-5xl font-black clash-text italic mb-10 tracking-tighter uppercase drop-shadow-lg ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
          {isVictory ? (isBossBattle ? 'BOSS DERROTADO!' : 'VITÓRIA!') : 'DERROTA'}
        </h1>

        <div className="w-full flex flex-col gap-6 mb-12 relative z-10">
          {isVictory ? (
            <>
              <div className="bg-black/50 rounded-[40px] p-8 border-2 border-white/5 flex flex-col items-center gap-6 shadow-inner">
                <div className="flex justify-around w-full">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2">💰</span>
                    <span className="text-yellow-500 font-black text-3xl clash-text">+{lastRewards?.gold}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-2">💎</span>
                    <span className="text-emerald-400 font-black text-3xl clash-text">+{lastRewards?.gems}</span>
                  </div>
                </div>
                <div className="w-full h-[1px] bg-white/10"></div>
                <div className="flex items-center gap-4 bg-blue-900/40 px-6 py-3 rounded-full border border-blue-400/20">
                   <div className="text-4xl">📦</div>
                   <div className="flex flex-col text-left">
                      <span className="text-white font-black text-[10px] uppercase italic tracking-widest leading-none">BAÚ RECEBIDO</span>
                      <span className={`text-[8px] font-black uppercase mt-1 ${chestStatus === 'FULL' ? 'text-red-400' : 'text-blue-300 opacity-60'}`}>
                        {chestStatus === 'FULL' ? 'ESPAÇOS CHEIOS!' : 'VÁ PARA O MENU'}
                      </span>
                   </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <div className="text-yellow-400 font-black clash-text text-2xl italic tracking-tighter drop-shadow-md">
                   {isRanked ? '+30 🏆' : (isBossBattle ? '+100 🏆' : '+0 🏆')}
                 </div>
                 <div className="flex items-center gap-2 bg-emerald-600/20 px-4 py-1.5 rounded-full border border-emerald-500/30">
                    <span className="text-emerald-400 font-black italic text-xs uppercase tracking-tighter">+{isBossBattle ? 350 : 75} XP</span>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-8 py-8">
              <span className="text-9xl grayscale opacity-30 drop-shadow-2xl">🥀</span>
              <div className="flex flex-col gap-3">
                <p className="text-red-400 font-black clash-text italic uppercase text-2xl tracking-tighter">BATALHA PERDIDA</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-white/40 font-black uppercase text-[10px] tracking-widest italic">{isRanked ? '-15 🏆' : '-0 🏆'}</span>
                  <span className="text-emerald-500/60 font-black uppercase text-[10px] tracking-widest italic">+15 XP</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleCollect}
          className={`w-full py-7 rounded-[35px] border-b-[12px] shadow-2xl clash-button text-3xl font-black clash-text text-white uppercase italic tracking-wider transition-all active:translate-y-3 active:border-b-0
            ${isVictory ? 'bg-emerald-500 border-emerald-900' : 'bg-blue-600 border-blue-950'}
          `}
        >
          {isVictory ? 'CONTINUAR' : 'VOLTAR'}
        </button>
      </div>
    </div>
  );
};

export default ResultOverlay;
