
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { GameStatus } from '../types';

const ResultOverlay: React.FC = () => {
  const { gameStatus, setGameStatus, lastRewards, addRewards, advanceArena, setLastRewards, profile } = useGameStore();
  const [step, setStep] = useState<'IDLE' | 'OPENING' | 'REVEALED'>('IDLE');
  const [chestShake, setChestShake] = useState(false);

  useEffect(() => {
    if (gameStatus === GameStatus.VICTORY) {
      setStep('IDLE');
    } else if (gameStatus === GameStatus.DEFEAT) {
      setStep('REVEALED');
    }
  }, [gameStatus]);

  if (gameStatus !== GameStatus.VICTORY && gameStatus !== GameStatus.DEFEAT) return null;

  const handleChestClick = () => {
    if (step === 'IDLE') {
      setChestShake(true);
      setTimeout(() => {
        setChestShake(false);
        setStep('OPENING');
        setTimeout(() => setStep('REVEALED'), 1000);
      }, 500);
    }
  };

  const handleCollect = () => {
    if (lastRewards) {
      addRewards(lastRewards.gold, lastRewards.gems);
    }
    if (gameStatus === GameStatus.VICTORY) {
      advanceArena();
    }
    setLastRewards(null);
    setGameStatus(GameStatus.MENU);
  };

  const isVictory = gameStatus === GameStatus.VICTORY;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className={`w-full max-w-sm rounded-[40px] border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] ${isVictory ? 'border-yellow-400 bg-gradient-to-b from-blue-800 to-blue-950' : 'border-red-600 bg-gradient-to-b from-gray-800 to-gray-950'} p-8 flex flex-col items-center text-center`}>
        
        <h1 className={`text-5xl font-black clash-text italic mb-8 tracking-tighter uppercase ${isVictory ? 'text-yellow-400 drop-shadow-lg' : 'text-red-500'}`}>
          {isVictory ? 'VITÓRIA!' : 'DERROTA'}
        </h1>

        {isVictory && step !== 'REVEALED' ? (
          <div className="flex flex-col items-center gap-6 my-4">
            <div 
              onClick={handleChestClick}
              className={`text-9xl cursor-pointer transition-all duration-300 transform 
                ${chestShake ? 'animate-shake' : 'hover:scale-110 active:scale-95'}
                ${step === 'OPENING' ? 'scale-150 opacity-0' : 'opacity-100'}
              `}
            >
              📦
            </div>
            <p className="text-blue-300 font-black clash-text italic uppercase text-xs animate-pulse">
              Toque para abrir o Baú!
            </p>
          </div>
        ) : (
          <div className="w-full animate-in zoom-in duration-500">
            {isVictory ? (
              <div className="bg-black/40 rounded-3xl p-6 mb-8 border border-white/10 flex flex-col gap-4">
                <div className="flex justify-around items-center">
                   <div className="flex flex-col items-center">
                      <span className="text-3xl mb-1">💰</span>
                      <div className="flex flex-col">
                        <span className="text-yellow-500 font-black text-2xl clash-text">{lastRewards?.gold}</span>
                        {lastRewards?.bonus && lastRewards.bonus > 0 && (
                          <span className="text-yellow-200 text-[8px] font-black uppercase italic">+{lastRewards.bonus} NÍVEL {profile.level}</span>
                        )}
                      </div>
                   </div>
                   <div className="flex flex-col items-center">
                      <span className="text-3xl mb-1">💎</span>
                      <span className="text-emerald-400 font-black text-2xl clash-text">{lastRewards?.gems}</span>
                   </div>
                </div>
                <div className="h-[2px] bg-white/10 w-full"></div>
                <div className="flex justify-between items-center px-2">
                  <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest italic">XP DE COROA</p>
                  <span className="text-blue-400 font-black italic">+150</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 mb-8">
                <span className="text-7xl">🥀</span>
                <p className="text-red-400 font-black clash-text italic uppercase text-sm">Mais sorte na próxima vez!</p>
              </div>
            )}

            <button 
              onClick={handleCollect}
              className={`w-full py-5 rounded-2xl border-b-[8px] clash-button text-2xl font-black clash-text text-white uppercase italic transition-all active:translate-y-2 active:border-b-0
                ${isVictory ? 'bg-emerald-500 border-emerald-800 shadow-[0_4px_0_rgba(6,78,59,1)]' : 'bg-blue-500 border-blue-800 shadow-[0_4px_0_rgba(30,58,138,1)]'}
              `}
            >
              {isVictory ? 'COLETAR E AVANÇAR' : 'VOLTAR AO MENU'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ResultOverlay;
