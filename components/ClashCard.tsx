
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
      case 'Comum': return 'border-[#b8bfc6] bg-[#5c6e80]';
      case 'Rara': return 'border-[#e8a33a] bg-[#8a5b29]';
      case 'Épica': return 'border-[#c658ed] bg-[#6c2c80]';
      case 'Lendária': return 'border-[#5ce8e8] bg-[#2c7280]';
      default: return 'border-white bg-gray-800';
    }
  };

  const getBgColor = (color: CardColor) => {
    switch (color) {
      case 'Vermelho': return 'bg-gradient-to-b from-[#ff4d4d] to-[#b30000]';
      case 'Azul': return 'bg-gradient-to-b from-[#4d94ff] to-[#0047b3]';
      case 'Amarelo': return 'bg-gradient-to-b from-[#ffd633] to-[#cc9900]';
      case 'Verde': return 'bg-gradient-to-b from-[#47d147] to-[#1f7a1f]';
      case 'Especial': return 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800';
      default: return 'bg-[#111111]';
    }
  };

  const getCardSymbol = (card: Card) => {
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
    sm: 'w-[75px] h-[100px] text-xs',
    md: 'w-24 h-36 text-sm',
    lg: 'w-32 h-48 text-base'
  }[size];

  if (hidden) {
    return (
      <div className={`${dims} bg-[#0d1726] rounded-xl border-4 border-[#3558a7] flex items-center justify-center relative overflow-hidden shadow-xl will-change-transform`}>
         <div className="w-[85%] h-[85%] flex flex-col items-center justify-center border-4 border-yellow-500 rounded-lg bg-blue-900/50">
            <span className="text-white font-black text-xl italic tracking-tighter">UNO</span>
            <span className="text-yellow-400 font-black text-[8px] uppercase">Royale</span>
         </div>
      </div>
    );
  }

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
        rounded-xl border-[3px]
        flex flex-col items-center justify-between cursor-pointer
        transition-all transform active:scale-95
        relative overflow-hidden shadow-2xl will-change-transform
        ${selected ? 'ring-4 ring-yellow-400 -translate-y-12 z-20' : 'hover:-translate-y-2'}
        ${playable && !selected ? 'ring-2 ring-white/50' : ''}
      `}
    >
      <div className={`absolute inset-[3px] rounded-lg ${bgColor} shadow-inner`}></div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 skew-y-[-10deg] -translate-y-2"></div>

      <div className="relative flex-1 w-full flex flex-col items-center justify-center z-10">
        <div className="w-14 h-14 bg-white/10 rounded-full flex flex-col items-center justify-center backdrop-blur-none border border-white/10 shadow-lg">
          <span className={`font-black italic drop-shadow-lg ${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-3xl' : 'text-2xl'} text-white`}>
            {symbol}
          </span>
          {unoRef && (
            <span className="text-[10px] font-black text-white/90 -mt-1 drop-shadow-md">
              {unoRef}
            </span>
          )}
        </div>
      </div>

      <div className="absolute top-1 left-1.5 font-black text-white italic text-sm drop-shadow-md z-10 flex flex-col items-start leading-none">
        <span>{unoRef || symbol}</span>
      </div>

      <div className="absolute bottom-1 right-1.5 font-black text-white italic text-sm drop-shadow-md z-10 flex flex-col items-end leading-none rotate-180">
        <span>{unoRef || symbol}</span>
      </div>

      {card.rarity === 'Lendária' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/10 to-transparent animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
});

export default ClashCard;
