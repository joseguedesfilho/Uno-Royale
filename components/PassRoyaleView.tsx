
import React from 'react';
import { useGameStore } from '../store.ts';

const PassRoyaleView = ({ onBack }: { onBack: () => void }) => {
  const { profile, claimPassReward } = useGameStore();

  if (!profile) return null;

  const tiers = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    requiredXP: (i + 1) * 100,
    freeLabel: i % 5 === 0 ? 'Baú de Prata' : '500 💰',
    premiumLabel: i % 10 === 0 ? 'Baú Lendário' : '50 💎'
  }));

  const currentLevel = Math.floor(profile.passXP / 100);

  return (
    <div className="h-full w-full bg-[#0b1421] flex flex-col text-white animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="px-6 py-6 bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] border-b-4 border-yellow-900 shadow-2xl relative shrink-0 z-20">
        <div className="flex items-center justify-between">
           <button onClick={onBack} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform text-white">🔙</button>
           <div className="text-center">
             <h2 className="text-3xl font-black clash-text italic uppercase tracking-tighter text-black leading-none drop-shadow-md">PASS ROYALE</h2>
             <span className="text-[10px] font-black text-black/60 uppercase tracking-widest italic mt-1 block">Temporada Real</span>
           </div>
           <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-xs font-black italic border border-white/10">NV {currentLevel}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 relative no-scrollbar pb-32">
         {tiers.map((tier, idx) => {
            const isUnlocked = currentLevel >= idx;
            const freeClaimed = profile.claimedPassFree.includes(idx);
            const premiumClaimed = profile.claimedPassPremium.includes(idx);

            return (
              <div key={idx} className="flex gap-4 items-center h-24">
                 {/* Recompensa Grátis */}
                 <div className={`flex-1 h-full rounded-2xl border-2 p-3 flex flex-col justify-between transition-all ${isUnlocked && !freeClaimed ? 'bg-blue-600/20 border-blue-400' : 'bg-black/40 border-white/5 opacity-40'}`}>
                    <span className="text-[7px] font-black uppercase text-blue-300/60 italic">Grátis</span>
                    <span className="text-[9px] font-black uppercase italic leading-tight">{tier.freeLabel}</span>
                    {isUnlocked && !freeClaimed && <button onClick={() => claimPassReward(idx, false)} className="w-full bg-blue-500 py-1 rounded-lg text-[8px] font-black uppercase active:scale-95">Pegar</button>}
                    {freeClaimed && <span className="text-[8px] font-black text-blue-400 uppercase text-center italic">Coletado ✓</span>}
                 </div>

                 {/* Indicador de Nível */}
                 <div className="w-12 h-12 rounded-full bg-black border-2 border-yellow-500 flex items-center justify-center shrink-0 z-10 shadow-xl">
                    <span className="text-xs font-black italic">{idx + 1}</span>
                 </div>

                 {/* Recompensa Premium */}
                 <div className={`flex-1 h-full rounded-2xl border-2 p-3 flex flex-col justify-between transition-all relative overflow-hidden ${isUnlocked && profile.hasPremiumPass && !premiumClaimed ? 'bg-yellow-600/20 border-yellow-400' : 'bg-black/40 border-white/5 opacity-40'}`}>
                    {!profile.hasPremiumPass && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[7px] font-black italic rotate-12">BLOQUEADO</div>}
                    <span className="text-[7px] font-black uppercase text-yellow-400/60 italic">Premium</span>
                    <span className="text-[9px] font-black uppercase italic leading-tight">{tier.premiumLabel}</span>
                    {isUnlocked && profile.hasPremiumPass && !premiumClaimed && <button onClick={() => claimPassReward(idx, true)} className="w-full bg-yellow-500 py-1 rounded-lg text-[8px] font-black uppercase active:scale-95 text-black">Pegar</button>}
                    {premiumClaimed && <span className="text-[8px] font-black text-yellow-400 uppercase text-center italic">Coletado ✓</span>}
                 </div>
              </div>
            );
         })}
      </div>

      {!profile.hasPremiumPass && (
        <div className="fixed bottom-24 w-full px-4 z-50">
           <button className="w-full bg-yellow-400 py-4 rounded-3xl border-b-6 border-yellow-700 font-black clash-text italic text-lg text-black uppercase active:translate-y-1 active:border-b-0 shadow-2xl">
              ATIVAR PASS PREMIUM 💎 500
           </button>
        </div>
      )}
    </div>
  );
};

export default PassRoyaleView;
