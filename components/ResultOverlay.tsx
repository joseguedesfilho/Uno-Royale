
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { GameStatus } from '../types';

const ResultOverlay: React.FC = () => {
  const { 
    gameStatus, 
    setGameStatus, 
    lastRewards, 
    addRewards, 
    profile, 
    addChest, 
    isBossBattle, 
    activeBossRewardId,
    claimTrophyReward,
    updateTrophies,
    resetBattle,
    setLastRewards
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
      // Soma o prêmio base com o prêmio do pote da sala se houver
      const totalGems = (lastRewards.gems || 0) + (gameStatus === GameStatus.VICTORY ? (lastRewards.potWon || 0) : 0);
      addRewards(lastRewards.gold, totalGems, xpBase);
    }
    
    if (gameStatus === GameStatus.VICTORY && activeBossRewardId) {
      claimTrophyReward(activeBossRewardId);
    }

    setLastRewards(null);
    setGameStatus(GameStatus.MENU);
    resetBattle();
  };

  const isVictory = gameStatus === GameStatus.VICTORY;
  const cardClass = `w-full max-w-sm rounded-[60px] border-4 shadow-2xl p-12 flex flex-col items-center text-center relative overflow-hidden ${isVictory ? 'border-yellow-400 bg-gradient-to-b from-[#1a2b45] to-[#0b1421]' : 'border-red-600 bg-gradient-to-b from-[#2a1a1a] to-black'}`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
      <div className={cardClass}>
        <h1 className={`text-4xl font-black clash-text italic mb-10 tracking-tighter uppercase ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
          {isVictory ? 'VITÓRIA REAL!' : 'DERROTA'}
        </h1>

        <div className="w-full flex flex-col gap-6 mb-12">
          {isVictory ? (
            <div className="bg-black/50 rounded-[40px] p-8 border-2 border-white/5 flex flex-col items-center gap-6">
              <div className="flex justify-around w-full">
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">💰</span>
                  <span className="text-yellow-500 font-black text-2xl">+{lastRewards?.gold}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">💎</span>
                  <span className="text-emerald-400 font-black text-2xl">+{lastRewards?.gems}</span>
                </div>
              </div>

              {lastRewards?.potWon && lastRewards.potWon > 0 && (
                <div className="w-full bg-emerald-600/20 py-4 rounded-2xl border border-emerald-500/40">
                   <span className="text-[10px] font-black text-emerald-300 uppercase italic">POTE DA SALA VENCIDO:</span>
                   <div className="text-xl font-black text-emerald-400">+{lastRewards.potWon} 💎</div>
                </div>
              )}

              <div className="flex items-center gap-4 bg-blue-900/40 px-6 py-3 rounded-full">
                 <div className="text-3xl">📦</div>
                 <span className="text-white font-black text-[10px] uppercase italic tracking-widest">{chestStatus === 'FULL' ? 'BAÚ CHEIO!' : 'BAÚ RECEBIDO'}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 py-8 opacity-40 grayscale">
              <span className="text-9xl">🥀</span>
            </div>
          )}
        </div>

        <button 
          onClick={handleCollect}
          className={`w-full py-6 rounded-[35px] border-b-[10px] text-2xl font-black clash-text text-white uppercase italic tracking-wider active:translate-y-2 active:border-b-0 ${isVictory ? 'bg-emerald-500 border-emerald-900' : 'bg-blue-600 border-blue-950'}`}
        >
          {isVictory ? 'COLETAR TUDO' : 'VOLTAR'}
        </button>
      </div>
    </div>
  );
};

export default ResultOverlay;
