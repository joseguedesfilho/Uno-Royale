
import React from 'react';
import { useGameStore } from '../store.ts';

const QuestView = ({ onClose }: { onClose: () => void }) => {
  const { profile, claimQuest } = useGameStore();

  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#1a2b45] to-[#0b1421] rounded-[50px] border-4 border-yellow-400 p-8 flex flex-col shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-8 text-2xl font-black opacity-40 hover:opacity-100">✕</button>
        
        <div className="text-center mb-8">
           <h2 className="text-3xl font-black clash-text italic uppercase tracking-tighter text-white leading-none">Missões Reais</h2>
           <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest italic mt-2 block">Cumpra e Ganhe</span>
        </div>

        <div className="flex flex-col gap-4">
           {profile.quests.map(quest => {
             const progress = (quest.current / quest.target) * 100;
             const isReady = quest.current >= quest.target && !quest.isClaimed;

             return (
               <div key={quest.id} className={`p-4 rounded-3xl border-2 flex flex-col gap-3 transition-all ${quest.isClaimed ? 'opacity-40 grayscale bg-black/40 border-white/5' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-start">
                     <p className="text-xs font-black uppercase italic text-white/80 leading-tight flex-1">{quest.description}</p>
                     <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-xl">
                        <span className="text-[10px] font-black text-yellow-400 italic">
                          {quest.rewardValue} {quest.rewardType === 'OURO' ? '💰' : quest.rewardType === 'GEMAS' ? '💎' : '📦'}
                        </span>
                     </div>
                  </div>

                  <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-white/5 p-[1px]">
                     <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{quest.current} / {quest.target}</span>
                     {isReady && (
                        <button onClick={() => claimQuest(quest.id)} className="bg-green-500 px-4 py-1.5 rounded-xl border-b-4 border-green-800 font-black text-[9px] uppercase italic active:translate-y-1 active:border-b-0 animate-bounce">Coletar</button>
                     )}
                     {quest.isClaimed && <span className="text-[9px] font-black text-green-400 uppercase italic">Coletado ✓</span>}
                  </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default QuestView;
