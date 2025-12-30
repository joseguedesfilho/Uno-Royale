
import React from 'react';
import { useGameStore } from '../store.ts';
import { SHOP_ITEMS } from '../constants.tsx';

const ShopView: React.FC = () => {
  const { profile, buyShopItem } = useGameStore();

  return (
    <div className="flex flex-col h-full bg-[#1a2b45] text-white overflow-y-auto pb-32 no-scrollbar animate-in slide-in-from-left duration-300">
      <div className="p-6 bg-gradient-to-b from-blue-500 to-blue-800 border-b-4 border-black/40 rounded-b-[40px] shadow-2xl mb-6">
        <h2 className="text-3xl font-black clash-text italic uppercase text-white tracking-tighter text-center">LOJA REAL</h2>
        <div className="flex justify-center gap-4 mt-4">
           <div className="bg-black/60 rounded-full px-4 py-1 border border-white/20 flex items-center gap-2">
              <span className="text-yellow-400 font-black">{profile?.gold.toLocaleString()}</span>
              <span>💰</span>
           </div>
           <div className="bg-black/60 rounded-full px-4 py-1 border border-white/20 flex items-center gap-2">
              <span className="text-emerald-400 font-black">{profile?.gems.toLocaleString()}</span>
              <span>💎</span>
           </div>
        </div>
      </div>

      <div className="px-4 space-y-8">
        <div>
           <span className="text-[10px] font-black uppercase text-yellow-400 tracking-[0.3em] ml-2 italic">Ofertas do Dia</span>
           <div className="grid grid-cols-2 gap-4 mt-2">
              {SHOP_ITEMS.slice(0, 4).map(item => (
                <div key={item.id} className="bg-white/5 border-2 border-white/10 rounded-[30px] p-4 flex flex-col items-center gap-2 shadow-lg hover:border-yellow-400 transition-colors">
                   <span className="text-4xl animate-float">{item.icon}</span>
                   <span className="text-[10px] font-black uppercase italic text-center leading-tight">{item.label}</span>
                   <button className="w-full mt-2 py-2 bg-yellow-500 rounded-xl border-b-4 border-yellow-800 text-black font-black text-xs uppercase btn-3d">
                      {item.cost} {item.currency === 'gold' ? '💰' : '💎'}
                   </button>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-[35px] p-6 border-4 border-white/20 shadow-2xl">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black clash-text italic uppercase">Baú Lendário</h3>
              <span className="text-xs bg-black/40 px-2 py-1 rounded-full text-cyan-400 font-black">UNICA</span>
           </div>
           <p className="text-[10px] font-black uppercase italic text-white/60 mb-6">Contém uma carta lendária garantida para seu deck!</p>
           <button className="w-full py-4 bg-cyan-400 rounded-2xl border-b-6 border-cyan-800 text-black font-black text-lg uppercase btn-3d">
              500 💎
           </button>
        </div>
      </div>
    </div>
  );
};

export default ShopView;
