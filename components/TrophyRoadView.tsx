
import React from 'react';
import { useGameStore } from '../store';
import { GameStatus } from '../types';
import { TROPHY_ROAD_REWARDS, ARENAS } from '../constants';

const TrophyRoadView: React.FC = () => {
  const { profile, setGameStatus, claimTrophyReward, startBossBattle } = useGameStore();

  const handleBack = () => {
    setGameStatus(GameStatus.MENU);
  };

  const handleStartBattle = (arenaIdx: number, rewardId: string, isBoss: boolean) => {
    // 1. Inicia o estado de Loading na Store
    startBossBattle(arenaIdx, rewardId, isBoss);
    
    // 2. Transição para BATTLE após o tempo de animação de loading
    setTimeout(() => {
      setGameStatus(GameStatus.BATTLE);
    }, 1200);
  };

  // Encontra o ID do primeiro prêmio que ainda não foi resgatado
  const nextRewardIndex = TROPHY_ROAD_REWARDS.findIndex(r => !profile.claimedRewards.includes(r.id));
  const nextReward = nextRewardIndex !== -1 ? TROPHY_ROAD_REWARDS[nextRewardIndex] : null;

  return (
    <div className="h-screen w-full bg-[#0b1421] flex flex-col text-white">
      {/* Header Fixo */}
      <div className="px-6 py-4 flex items-center justify-between border-b-4 border-black/60 z-30 bg-[#121d2f] shadow-2xl">
        <button onClick={handleBack} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform">🔙</button>
        <div className="text-center">
          <h2 className="text-xl font-black clash-text italic uppercase tracking-tighter text-yellow-400 leading-none">Caminho de Troféus</h2>
          <div className="flex items-center justify-center gap-1 mt-1 bg-black/40 px-3 py-0.5 rounded-full border border-white/5">
            <span className="text-[10px] text-white font-black italic">{profile.trophies}</span>
            <span className="text-[10px]">🏆</span>
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center text-xs font-black italic bg-blue-600 rounded-lg border-2 border-white">
          {profile.level}
        </div>
      </div>

      {/* Caminho com Scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-10 flex flex-col-reverse gap-4 relative">
        {/* Linha Central Visual */}
        <div className="absolute left-1/2 top-0 bottom-0 w-6 bg-black/30 -translate-x-1/2 rounded-full border border-white/5 pointer-events-none"></div>

        {TROPHY_ROAD_REWARDS.map((reward, index) => {
          const isUnlocked = profile.trophies >= reward.trophiesRequired;
          const isClaimed = profile.claimedRewards.includes(reward.id);
          const isNextChallenge = nextReward?.id === reward.id;
          const isBoss = reward.type === 'BOSS';

          // Pode batalhar se for o próximo desafio OU se já estiver desbloqueado e não coletado
          const canInteract = isNextChallenge || (isUnlocked && !isClaimed);

          return (
            <div key={reward.id} className="relative w-full py-10 flex items-center justify-center">
              {/* Marcador de Troféus na Lateral */}
              <div className={`absolute left-0 bg-black/80 px-4 py-1.5 rounded-r-2xl border-y border-r border-white/10 text-[9px] font-black italic shadow-xl z-20 ${isUnlocked ? 'text-yellow-400' : 'text-white/30'}`}>
                {reward.trophiesRequired} 🏆
              </div>

              {/* Card da Recompensa */}
              <div className={`
                w-full max-w-[280px] p-6 rounded-[40px] border-4 flex flex-col items-center gap-4 transition-all z-10 relative
                ${isBoss ? 'bg-gradient-to-b from-red-900 to-black border-red-500 shadow-[0_20px_50px_rgba(239,68,68,0.4)]' : 'bg-blue-900/40 border-blue-400/40 shadow-xl'}
                ${!canInteract && !isClaimed ? 'grayscale opacity-40 scale-95' : 'hover:scale-105'}
                ${isClaimed ? 'opacity-60 bg-gray-900/40 border-gray-600' : ''}
                ${isNextChallenge ? 'ring-4 ring-yellow-400 ring-offset-4 ring-offset-[#0b1421] animate-pulse-slow' : ''}
              `}>
                
                {/* Ícone Gigante */}
                <div className={`text-6xl drop-shadow-2xl transition-transform ${canInteract && !isClaimed ? 'animate-bounce' : ''}`}>
                  {reward.type === 'GOLD' ? '💰' : reward.type === 'GEMS' ? '💎' : reward.type === 'CHEST' ? '📦' : reward.type === 'BOSS' ? '👹' : '🃏'}
                </div>

                <div className="text-center">
                  <div className="font-black text-sm uppercase italic tracking-tighter text-white drop-shadow-md">{reward.label}</div>
                  <div className={`text-[9px] font-black uppercase mt-1 tracking-widest ${isBoss ? 'text-red-400' : 'text-blue-300'}`}>
                    {isClaimed ? '✓ CONCLUÍDO' : (isNextChallenge ? (isBoss ? 'BATALHA DE CHEFE' : 'PRÓXIMO DESAFIO') : (isUnlocked ? 'DISPONÍVEL' : 'BLOQUEADO'))}
                  </div>
                </div>

                {!isClaimed && canInteract && (
                  <button 
                    onClick={() => {
                      const arenaIdx = isBoss ? (reward.value as number) : Math.min(profile.currentArena, 4);
                      handleStartBattle(arenaIdx, reward.id, isBoss);
                    }}
                    className={`w-full py-4 rounded-2xl border-b-[8px] font-black clash-text italic text-lg uppercase transition-all active:translate-y-2 active:border-b-0
                      ${isBoss || isNextChallenge ? 'bg-red-600 border-red-950 text-white' : 'bg-green-500 border-green-800 text-white'}
                    `}
                  >
                    {isBoss ? 'DESAFIAR' : 'BATALHAR'}
                  </button>
                )}

                {isClaimed && (
                  <div className="absolute inset-0 bg-black/20 rounded-[35px] flex items-center justify-center pointer-events-none">
                     <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1 text-[10px] font-black italic">CONCLUÍDO</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Base da Jornada */}
        <div className="w-full flex flex-col items-center py-10 gap-3 opacity-40">
           <div className="text-4xl">👑</div>
           <div className="bg-white/5 px-8 py-2 rounded-full font-black italic uppercase tracking-[0.3em] text-[8px] border border-white/5">Início da Realeza</div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TrophyRoadView;
