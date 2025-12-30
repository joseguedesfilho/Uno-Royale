
import React, { memo } from 'react';
import { Card, CardType, CardColor, Rarity } from '../types';

interface ClashCardProps {
  card: Card;
  onClick?: () => void;
  playable?: boolean;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
}

const ClashCard: React.FC<ClashCardProps> = memo(({ card, onClick, playable, selected, size = 'md', hidden }) => {
  const getRarityFrame = (rarity: Rarity) => {
    switch (rarity) {
      case 'Comum': return 'border-[#b8bfc6] bg-[#4a5a6a]';
      case 'Rara': return 'border-[#e8a33a] bg-[#7a4b19]';
      case 'Épica': return 'border-[#c658ed] bg-[#5c1c70]';
      case 'Lendária': return 'border-[#5ce8e8] bg-[#1c6270] shadow-[0_0_15px_rgba(92,232,232,0.4)]';
      default: return 'border-white bg-gray-800';
    }
  };

  const getBgColor = (color: CardColor) => {
    switch (color) {
      case 'Vermelho': return 'bg-gradient-to-b from-[#ff5f5f] to-[#990000]';
      case 'Azul': return 'bg-gradient-to-b from-[#5fafff] to-[#003780]';
      case 'Amarelo': return 'bg-gradient-to-b from-[#ffe05f] to-[#997a00]';
      case 'Verde': return 'bg-gradient-to-b from-[#5fff5f] to-[#006600]';
      case 'Especial': return 'bg-gradient-to-br from-purple-700 via-indigo-800 to-black';
      default: return 'bg-[#111111]';
    }
  };

  const getCardSymbol = (card: Card) => {
    if (!card || !card.type) return '';
    switch (card.type) {
      case CardType.SKIP: return '❄️';
      case CardType.REVERSE: return '🪵';
      case CardType.DRAW2: return '💀';
      case CardType.DRAW4: return '🧪';
      case CardType.WILD: return '🪞';
      case CardType.NUMBER: return card.value?.toString();
      default: return '';
    }
  };

  const getUnoReference = (card: Card) => {
    if (!card || !card.type) return '';
    switch (card.type) {
      case CardType.SKIP: return '🚫';
      case CardType.REVERSE: return '⇄';
      case CardType.DRAW2: return '+2';
      case CardType.DRAW4: return '+4';
      case CardType.WILD: return '🌈';
      default: return '';
    }
  };

  const dims = {
    sm: 'w-[70px] h-[105px] text-[10px]',
    md: 'w-[90px] h-[130px] text-sm',
    lg: 'w-[110px] h-[160px] sm:w-[130px] sm:h-[190px] text-base'
  }[size];

  if (hidden) {
    return (
      <div className={`${dims} bg-[#0d1726] rounded-2xl border-[4px] border-[#3558a7] flex items-center justify-center relative overflow-hidden shadow-2xl`}>
         <div className="w-[80%] h-[90%] flex flex-col items-center justify-center border-2 border-yellow-500 rounded-xl bg-blue-900/50">
            <span className="text-white font-black text-2xl italic tracking-tighter transform-gpu -rotate-90">UNO</span>
         </div>
      </div>
    );
  }

  if (!card || !card.id) return null;

  const symbol = getCardSymbol(card);
  const unoRef = getUnoReference(card);
  const rarityFrame = getRarityFrame(card.rarity);
  const bgColor = getBgColor(card.color);

  return (
    <div 
      onClick={onClick}
      className={`
        ${dims} 
        ${rarityFrame}
        rounded-2xl border-[3px]
        flex flex-col items-center justify-between cursor-pointer
        transition-all duration-300 transform-gpu active:scale-95
        relative overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.7)]
        ${selected ? 'ring-4 ring-yellow-400 -translate-y-4' : ''}
        ${playable && !selected ? 'brightness-110 saturate-150' : ''}
        ${!playable && !selected && !hidden ? 'grayscale brightness-50' : ''}
      `}
    >
      <div className={`absolute inset-[3px] rounded-xl ${bgColor} shadow-inner`}></div>
      
      <div className="absolute top-1.5 left-2 font-black text-white italic text-lg drop-shadow-lg z-20">
        {unoRef || symbol}
      </div>

      <div className="relative flex-1 w-full flex flex-col items-center justify-center z-10 px-2">
        <div className="w-[80%] aspect-square bg-white/5 rounded-full flex items-center justify-center border border-white/5 shadow-inner overflow-hidden">
           <span className={`font-black italic drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${size === 'lg' ? 'text-6xl' : size === 'md' ? 'text-4xl' : 'text-3xl'} text-white`}>
            {symbol}
          </span>
        </div>
      </div>

      <div className="absolute bottom-1.5 right-2 font-black text-white italic text-lg drop-shadow-lg z-20 rotate-180">
        {unoRef || symbol}
      </div>
    </div>
  );
});

export default ClashCard;
