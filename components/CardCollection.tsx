
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { ALL_CARDS } from '../constants';
import { CardDefinition, Rarity } from '../types';
import ClashCard from './ClashCard';

const CardCollection: React.FC = () => {
  const { profile, upgradeCard, toggleDeckCard } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<CardDefinition | null>(null);

  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case 'Comum': return 'text-blue-100';
      case 'Rara': return 'text-orange-300';
      case 'Épica': return 'text-purple-300';
      case 'Lendária': return 'text-cyan-200';
      default: return 'text-white';
    }
  };

  const getRarityBgModal = (rarity: Rarity) => {
    switch (rarity) {
      case 'Comum': return 'bg-gradient-to-b from-[#4a7eba] to-[#2c4a70] border-blue-300/50';
      case 'Rara': return 'bg-gradient-to-b from-[#d5843a] to-[#8a5b29] border-orange-300/50';
      case 'Épica': return 'bg-gradient-to-b from-[#a34cb4] to-[#6c2c80] border-purple-300/50';
      case 'Lendária': return 'bg-gradient-to-b from-[#5bc6e8] to-[#2c7280] border-cyan-200/50 shadow-[0_0_30px_rgba(255,255,255,0.3)]';
      default: return 'bg-gray-600 border-gray-400';
    }
  };

  const activeDeckIds = profile.activeDeck;
  const activeDeckCards = ALL_CARDS.filter(c => activeDeckIds.includes(c.id));
  const otherCards = ALL_CARDS.filter(c => !activeDeckIds.includes(c.id));

  const totalLevel = activeDeckCards.reduce((acc, card) => {
    const inst = profile.collection.find(c => c.cardId === card.id);
    return acc + (inst?.level || 1);
  }, 0);
  const avgLevel = (totalLevel / (activeDeckCards.length || 1)).toFixed(1);

  const getCardInstance = (id: string) => profile.collection.find(c => c.cardId === id);

  const renderCardItem = (cardDef: CardDefinition) => {
    const inst = getCardInstance(cardDef.id);
    const level = inst?.level || 1;
    const count = inst?.count || 0;
    const cardsNeeded = level * 10;
    const progress = Math.min(100, (count / cardsNeeded) * 100);
    const canUpgrade = count >= cardsNeeded && profile.gold >= level * 400;

    return (
      <div 
        key={cardDef.id} 
        onClick={() => setSelectedCard(cardDef)}
        className="relative flex flex-col items-center group cursor-pointer transition-transform active:scale-95"
      >
        <ClashCard 
          card={{...cardDef, instanceId: '', color: cardDef.baseColor}} 
          size="sm" 
        />
        <div className="absolute -bottom-2 w-[85%] bg-[#0d1726]/90 rounded-lg border border-white/10 flex flex-col items-center p-0.5 shadow-lg z-10">
          <div className="text-[7px] font-black text-white italic mb-0.5">NÍVEL {level}</div>
          <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden p-[1px] border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${canUpgrade ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        {canUpgrade && (
          <div className="absolute -top-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-bounce z-20">
            !
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white overflow-y-auto pb-32">
      <div className="bg-[#1a2b45] p-6 border-b-4 border-black/40 shadow-2xl rounded-b-[40px]">
        <div className="flex justify-between items-center mb-6 px-2">
          <div>
            <h2 className="text-2xl font-black clash-text italic uppercase text-white drop-shadow-lg tracking-tighter">Deck de Batalha</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="bg-blue-600 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border border-blue-400">Arena {profile.currentArena + 1}</span>
            </div>
          </div>
          <div className="bg-black/40 px-4 py-2 rounded-2xl border-2 border-white/10 flex flex-col items-center shadow-inner">
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest italic leading-none mb-1">Nível Médio</span>
            <span className="text-yellow-400 font-black text-lg italic clash-text leading-none">{avgLevel}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-x-2 gap-y-6 bg-black/30 p-4 rounded-[30px] border-2 border-white/5 shadow-inner">
          {activeDeckCards.map(card => renderCardItem(card))}
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#3558a7] rounded-xl flex items-center justify-center border-2 border-blue-400 shadow-lg">
              <span className="text-xl">🃏</span>
            </div>
            <h2 className="text-xl font-black clash-text italic uppercase text-white/90 tracking-tight">Coleção de Cartas</h2>
          </div>
          <div className="grid grid-cols-4 gap-x-2 gap-y-6 px-1">
            {otherCards.map(card => renderCardItem(card))}
          </div>
        </div>
      </div>

      {selectedCard && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className={`w-full max-w-sm rounded-[50px] border-4 p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden ${getRarityBgModal(selectedCard.rarity)}`}>
              <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none"></div>
              <div className="flex w-full justify-between items-start mb-6 relative z-10">
                <button 
                  onClick={() => setSelectedCard(null)} 
                  className="bg-black/30 hover:bg-black/50 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
                >✕</button>
                <div className={`font-black clash-text italic uppercase text-xs px-6 py-1.5 rounded-full bg-black/40 border border-white/10 ${getRarityColor(selectedCard.rarity)} shadow-lg`}>
                  {selectedCard.rarity}
                </div>
                <div className="w-10"></div>
              </div>
              <div className="mb-10 scale-[1.7] drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)] relative z-10">
                <ClashCard card={{...selectedCard, instanceId: '', color: selectedCard.baseColor}} size="md" />
              </div>
              <h3 className="text-4xl font-black clash-text italic uppercase text-white mb-2 leading-tight drop-shadow-lg relative z-10 tracking-tighter">{selectedCard.label}</h3>
              <p className="text-white/90 text-[12px] uppercase font-black mb-8 italic tracking-wide max-w-[85%] relative z-10 leading-snug">{selectedCard.description}</p>
              
              <div className="w-full bg-black/50 rounded-[30px] p-6 mb-8 border border-white/10 flex flex-col gap-4 text-left relative z-10 shadow-2xl">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Poder de Nível</span>
                    <span className="text-[12px] font-black text-yellow-400 italic">{selectedCard.levelEffect}</span>
                 </div>
                 <div className="h-[1px] bg-white/10 w-full"></div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Fragmentos</span>
                    <div className="flex items-center gap-3">
                       <div className="w-24 h-2.5 bg-gray-950 rounded-full overflow-hidden border border-white/10 shadow-inner">
                          <div 
                            className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                            style={{ 
                              width: `${Math.min(100, ((getCardInstance(selectedCard.id)?.count || 0) / ((getCardInstance(selectedCard.id)?.level || 1) * 10)) * 100)}%` 
                            }}
                          ></div>
                       </div>
                       <span className="text-[12px] font-black text-white italic">
                          {getCardInstance(selectedCard.id)?.count || 0}/{(getCardInstance(selectedCard.id)?.level || 1) * 10}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="w-full flex flex-col gap-4 relative z-10">
                <button 
                  onClick={() => {
                    toggleDeckCard(selectedCard.id);
                    setSelectedCard(null);
                  }}
                  className={`w-full py-5 rounded-3xl border-b-[10px] font-black clash-text italic text-2xl uppercase transition-all active:translate-y-2 active:border-b-0 shadow-2xl
                    ${profile.activeDeck.includes(selectedCard.id) ? 'bg-[#eb2739] border-[#a11a27]' : 'bg-[#3558a7] border-[#243c72]'}
                  `}
                >
                  {profile.activeDeck.includes(selectedCard.id) ? 'REMOVER' : 'USAR'}
                </button>
                <button 
                  onClick={() => {
                    upgradeCard(selectedCard.id);
                    setSelectedCard(null);
                  }}
                  disabled={
                    (getCardInstance(selectedCard.id)?.count || 0) < (getCardInstance(selectedCard.id)?.level || 1) * 10 ||
                    profile.gold < (getCardInstance(selectedCard.id)?.level || 1) * 400
                  }
                  className="w-full py-5 rounded-3xl bg-[#3aa948] border-b-[10px] border-[#287431] text-white font-black clash-text italic text-2xl uppercase transition-all active:translate-y-2 active:border-b-0 disabled:opacity-40 disabled:grayscale shadow-2xl flex items-center justify-center gap-4"
                >
                  <span>MELHORAR</span>
                  <div className="flex items-center gap-1.5 bg-black/30 px-4 py-1.5 rounded-2xl text-sm border border-white/10 shadow-inner">
                    {(getCardInstance(selectedCard.id)?.level || 1) * 400} 💰
                  </div>
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CardCollection;
