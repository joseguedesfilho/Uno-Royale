
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { ALL_CARDS } from '../constants';
import { CardType, CardColor, CardDefinition, Rarity } from '../types';
import ClashCard from './ClashCard';

const CardCollection: React.FC = () => {
  const { profile, upgradeCard, toggleDeckCard } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<CardDefinition | null>(null);

  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case 'Comum': return 'text-blue-300';
      case 'Rara': return 'text-orange-400';
      case 'Épica': return 'text-purple-400';
      case 'Lendária': return 'text-cyan-400';
      default: return 'text-white';
    }
  };

  const getRarityBg = (rarity: Rarity) => {
    switch (rarity) {
      case 'Comum': return 'bg-blue-600/20 border-blue-400/30';
      case 'Rara': return 'bg-orange-600/20 border-orange-400/30';
      case 'Épica': return 'bg-purple-600/20 border-purple-400/30';
      case 'Lendária': return 'bg-cyan-600/20 border-cyan-400/30';
      default: return 'bg-gray-600/20 border-gray-400/30';
    }
  };

  const activeDeckCards = ALL_CARDS.filter(c => profile.activeDeck.includes(c.id));
  const otherCards = ALL_CARDS.filter(c => !profile.activeDeck.includes(c.id));

  const handleCardClick = (card: CardDefinition) => {
    setSelectedCard(card);
  };

  const handleUpgrade = (cardId: string) => {
    upgradeCard(cardId);
  };

  return (
    <div className="flex flex-col p-4 pb-24 gap-8 animate-in fade-in duration-500">
      
      {/* Deck de Batalha Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚔️</span>
          <h2 className="text-xl font-black clash-text italic uppercase">Deck de Batalha</h2>
          <span className="ml-auto bg-black/40 px-3 py-1 rounded-lg text-[10px] font-black border border-white/10 uppercase italic opacity-60">
            {profile.activeDeck.length} / 8
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-3 bg-black/30 p-4 rounded-[30px] border-2 border-white/5">
          {activeDeckCards.map(cardDef => {
            const instance = profile.collection.find(c => c.cardId === cardDef.id);
            return (
              <div key={cardDef.id} className="flex flex-col items-center gap-1">
                <div onClick={() => handleCardClick(cardDef)} className="relative group">
                   <ClashCard 
                    card={{...cardDef, instanceId: '', color: cardDef.baseColor}} 
                    size="sm" 
                   />
                   <div className="absolute -bottom-1 -right-1 bg-blue-600 border border-white rounded px-1 text-[8px] font-black italic">
                      Nível {instance?.level || 1}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Coleção Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🃏</span>
          <h2 className="text-xl font-black clash-text italic uppercase">Coleção</h2>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {otherCards.map(cardDef => {
             const instance = profile.collection.find(c => c.cardId === cardDef.id);
             return (
              <div key={cardDef.id} onClick={() => handleCardClick(cardDef)} className="flex flex-col items-center opacity-80 hover:opacity-100 transition-all">
                <div className="relative">
                   <ClashCard 
                    card={{...cardDef, instanceId: '', color: cardDef.baseColor}} 
                    size="sm" 
                   />
                   <div className="absolute -bottom-1 -right-1 bg-gray-800 border border-white/20 rounded px-1 text-[8px] font-black italic">
                      Nível {instance?.level || 1}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal de Detalhes da Carta */}
      {selectedCard && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className={`w-full max-w-sm rounded-[40px] border-4 p-8 flex flex-col items-center text-center ${getRarityBg(selectedCard.rarity)}`}>
              
              <div className="flex w-full justify-between items-start mb-6">
                <button onClick={() => setSelectedCard(null)} className="text-white/40 hover:text-white transition-colors">✕</button>
                <div className={`font-black clash-text italic uppercase text-xs ${getRarityColor(selectedCard.rarity)}`}>
                  {selectedCard.rarity}
                </div>
                <div className="w-6"></div>
              </div>

              <div className="mb-6 scale-150 py-4">
                <ClashCard card={{...selectedCard, instanceId: '', color: selectedCard.baseColor}} size="md" />
              </div>

              <h3 className="text-3xl font-black clash-text italic uppercase text-white mb-2 leading-tight">
                {selectedCard.label}
              </h3>
              
              <p className="text-white/60 text-[10px] font-black uppercase tracking-wider mb-8 max-w-[80%] italic">
                {selectedCard.description}
              </p>

              <div className="w-full flex flex-col gap-3">
                <button 
                  onClick={() => toggleDeckCard(selectedCard.id)}
                  className={`w-full py-4 rounded-2xl border-b-8 font-black clash-text italic text-xl uppercase transition-all active:translate-y-2 active:border-b-0
                    ${profile.activeDeck.includes(selectedCard.id) 
                      ? 'bg-red-500 border-red-800 text-white' 
                      : 'bg-blue-500 border-blue-800 text-white'}
                  `}
                >
                  {profile.activeDeck.includes(selectedCard.id) ? 'REMOVER DO DECK' : 'USAR NO DECK'}
                </button>

                <button 
                  onClick={() => handleUpgrade(selectedCard.id)}
                  disabled={profile.gold < (profile.collection.find(c => c.cardId === selectedCard.id)?.level || 1) * 500}
                  className="w-full py-4 rounded-2xl bg-emerald-500 border-b-8 border-emerald-800 text-white font-black clash-text italic text-xl uppercase transition-all active:translate-y-2 active:border-b-0 disabled:opacity-50 disabled:grayscale"
                >
                  MELHORAR: {(profile.collection.find(c => c.cardId === selectedCard.id)?.level || 1) * 500} 💰
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default CardCollection;
