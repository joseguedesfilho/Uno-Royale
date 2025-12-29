
import React from 'react';
import { Card, CardType, CardColor } from '../types';

interface ClashCardProps {
  card: Card;
  onClick?: () => void;
  playable?: boolean;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
}

const ClashCard: React.FC<ClashCardProps> = ({ card, onClick, playable, selected, size = 'md', hidden }) => {
  const getBgColor = (color: CardColor) => {
    switch (color) {
      case 'Red': return 'bg-[#eb2739]';
      case 'Blue': return 'bg-[#3558a7]';
      case 'Yellow': return 'bg-[#f7da21]';
      case 'Green': return 'bg-[#3aa948]';
      default: return 'bg-[#111111]';
    }
  };

  const getTextColor = (color: CardColor) => {
    if (color === 'Wild') return 'text-white';
    switch (color) {
      case 'Red': return 'text-[#eb2739]';
      case 'Blue': return 'text-[#3558a7]';
      case 'Yellow': return 'text-[#f7da21]';
      case 'Green': return 'text-[#3aa948]';
      default: return 'text-black';
    }
  };

  const getCardSymbol = (card: Card) => {
    switch (card.type) {
      case CardType.SKIP: return '∅';
      case CardType.REVERSE: return '⇄';
      case CardType.DRAW2: return '+2';
      case CardType.DRAW4: return '+4';
      case CardType.WILD: return 'W';
      case CardType.NUMBER: return card.value?.toString();
      default: return '';
    }
  };

  const dims = {
    sm: 'w-12 h-18 text-xs',
    md: 'w-20 h-32 text-sm',
    lg: 'w-28 h-44 text-base'
  }[size];

  const isLegendary = card.rarity === 'Lendária';

  if (hidden) {
    return (
      <div className={`${dims} bg-black rounded-xl border-4 border-white flex items-center justify-center relative overflow-hidden`}>
         <div className="w-[85%] h-[85%] flex items-center justify-center border-[6px] border-[#eb2739] rounded-lg">
            <span className="text-white font-black text-2xl italic scale-y-150">UNO</span>
         </div>
      </div>
    );
  }

  const symbol = getCardSymbol(card);

  return (
    <div 
      onClick={onClick}
      className={`
        ${dims} 
        ${getBgColor(card.color)}
        rounded-xl border-[4px] border-white
        flex flex-col items-center justify-center cursor-pointer
        transition-all transform active:scale-95
        relative overflow-hidden
        ${selected ? 'border-blue-400 -translate-y-12 z-20 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'hover:-translate-y-4'}
        ${playable && !selected ? 'border-yellow-400' : ''}
        ${isLegendary ? 'animate-pulse ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''}
      `}
    >
      <div className="absolute w-[130%] h-[75%] bg-white rounded-[100%] rotate-[-28deg] flex items-center justify-center">
         <span className={`font-black italic ${size === 'lg' ? 'text-7xl' : size === 'md' ? 'text-5xl' : 'text-3xl'} ${getTextColor(card.color)} rotate-[28deg] scale-y-110 tracking-tighter`}>
            {symbol}
         </span>
      </div>

      <div className="absolute top-1 left-1.5 font-black text-white italic text-base">
        {symbol}
      </div>
      <div className="absolute bottom-1 right-1.5 font-black text-white italic text-base rotate-180">
        {symbol}
      </div>

      {isLegendary && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none"></div>
      )}

      {card.color === 'Wild' && (
        <div className="absolute inset-0 flex flex-wrap opacity-40 pointer-events-none">
           <div className="w-1/2 h-1/2 bg-[#eb2739]"></div>
           <div className="w-1/2 h-1/2 bg-[#3558a7]"></div>
           <div className="w-1/2 h-1/2 bg-[#f7da21]"></div>
           <div className="w-1/2 h-1/2 bg-[#3aa948]"></div>
        </div>
      )}
    </div>
  );
};

export default ClashCard;
