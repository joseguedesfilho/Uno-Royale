
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { GameStatus } from '../types';
import { SOUNDS, playSound } from '../logic/soundManager';

const ResultOverlay: React.FC = () => {
  const { gameStatus, setGameStatus, lastRewards, addRewards, advanceArena, setLastRewards } = useGameStore();
  const [isCollected, setIsCollected] = useState(false);

  useEffect(() => {
    if (gameStatus === GameStatus.VICTORY) {
      playSound(SOUNDS.WIN);
    } else if (gameStatus === GameStatus.DEFEAT) {
      playSound(SOUNDS.LOSE);
    }
  }, [gameStatus]);

  if (gameStatus !== GameStatus.VICTORY && gameStatus !== GameStatus.DEFEAT) return null;

  const handleCollect = () => {
    playSound(SOUNDS.CLICK);
    if (lastRewards) {
      addRewards(lastRewards.gold, lastRewards.gems);
    }
    setIsCollected(true);
  };

  const handleNext = () => {
    playSound(SOUNDS.CLICK);
    if (gameStatus === GameStatus.VICTORY) {
      advanceArena();
    }
    setLastRewards(null);
    setGameStatus(GameStatus.MENU);
  };

  const isVictory = gameStatus === GameStatus.VICTORY;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-3xl border-4 ${isVictory ? 'border-yellow-400 bg-blue-900' : 'border-red-600 bg-gray-900'} p-8 flex flex-col items-center text-center shadow-2xl`}>
        
        <div className={`text-6xl mb-4 animate-bounce`}>
          {isVictory ? '👑' : '🥀'}
        </div>
        
        <h1 className={`text-5xl font-black clash-text italic mb-6 tracking-wider uppercase ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
          {isVictory ? 'VITÓRIA!' : 'DERROTA'}
        </h1>

        {isVictory && lastRewards && (
          <div className="w-full bg-black/40 rounded-2xl p-6 mb-8 flex flex-col gap-4">
             <div className="flex justify-between items-center text-2xl font-black">
                <span className="text-yellow-500 flex items-center gap-2">{lastRewards.gold} 💰</span>
                <span className="text-emerald-400 flex items-center gap-2">{lastRewards.gems} 💎</span>
             </div>
             <p className="text-blue-300 text-xs font-bold uppercase">+50 Pontos de XP Ganhos</p>
          </div>
        )}

        <div className="flex flex-col gap-4 w-full">
           {isVictory && !isCollected ? (
             <button 
               onClick={handleCollect}
               className="w-full bg-emerald-500 hover:bg-emerald-400 py-4 rounded-xl border-b-8 border-emerald-800 clash-button text-xl font-black clash-text text-white uppercase"
             >
               COLETAR PRÊMIOS
             </button>
           ) : (
             <button 
               onClick={handleNext}
               className="w-full bg-blue-500 hover:bg-blue-400 py-4 rounded-xl border-b-8 border-blue-800 clash-button text-xl font-black clash-text text-white uppercase italic"
             >
               {isVictory ? 'INICIAR PRÓXIMA ARENA' : 'VOLTAR AO MENU'}
             </button>
           )}
        </div>

      </div>
    </div>
  );
};

export default ResultOverlay;
