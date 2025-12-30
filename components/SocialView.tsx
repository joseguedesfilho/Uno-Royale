
import React, { useState } from 'react';
import { useGameStore } from '../store.ts';

const SocialView: React.FC = () => {
  const { profile } = useGameStore();
  const [activeSubTab, setActiveSubTab] = useState('Chat');

  const messages = [
    { user: 'Rei Arthur', text: 'Alguém para trocar O Tronco?', time: '12:45', avatar: '🤴' },
    { user: 'Bárbaro', text: 'Boa jogada na última arena!', time: '12:50', avatar: '🪓' },
    { user: 'Arqueira', text: 'O deck de azuis está muito forte.', time: '13:02', avatar: '🏹' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1a2b45] text-white animate-in slide-in-from-right duration-300">
      <div className="p-6 bg-gradient-to-b from-blue-600 to-blue-900 border-b-4 border-black/40 rounded-b-[40px] shadow-2xl shrink-0">
        <h2 className="text-3xl font-black clash-text italic uppercase text-white tracking-tighter text-center">SOCIAL</h2>
        <div className="flex bg-black/40 p-1 rounded-2xl mt-4 border border-white/10">
           {['Chat', 'Clã', 'Amigos'].map(t => (
             <button key={t} onClick={() => setActiveSubTab(t)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === t ? 'bg-blue-500 text-white shadow-lg' : 'text-white/40'}`}>
                {t}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
        {activeSubTab === 'Chat' && messages.map((m, i) => (
          <div key={i} className="flex gap-3 items-end">
             <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-xl border border-white/10 shrink-0">{m.avatar}</div>
             <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none p-3 max-w-[80%]">
                <div className="flex justify-between gap-4 mb-1">
                   <span className="text-[9px] font-black text-blue-400 uppercase italic">{m.user}</span>
                   <span className="text-[7px] text-white/30">{m.time}</span>
                </div>
                <p className="text-xs font-medium leading-tight">{m.text}</p>
             </div>
          </div>
        ))}

        {activeSubTab === 'Clã' && (
           <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-4">
              <span className="text-6xl">🛡️</span>
              <span className="text-[10px] font-black uppercase tracking-widest italic">Você não está em um Clã</span>
              <button className="mt-2 bg-yellow-500 px-8 py-3 rounded-2xl border-b-4 border-yellow-800 text-black font-black uppercase text-xs btn-3d">BUSCAR CLÃ</button>
           </div>
        )}
      </div>

      <div className="p-4 bg-black/40 border-t border-white/10 shrink-0 mb-20">
         <div className="flex gap-2">
            <input type="text" placeholder="Escreva para o Clã..." className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-blue-400" />
            <button className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center text-lg active:scale-90 transition-transform">➤</button>
         </div>
      </div>
    </div>
  );
};

export default SocialView;
