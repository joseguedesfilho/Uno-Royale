
import React from 'react';
import { Card, CardType, CardColor } from '../types';

interface ClashCardProps {
  card: Card;
  onClick?: () => void;
  playable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
}

const ClashCard: React.FC<ClashCardProps> = ({ card, onClick, playable, size = 'md', hidden }) => {
  const getBgColor = (color: CardColor) => {
    switch (color) {
      case 'Red': return 'bg-[#eb2739]'; // Vermelho UNO
      case 'Blue': return 'bg-[#3558a7]'; // Azul UNO
      case 'Yellow': return 'bg-[#f7da21]'; // Amarelo UNO
      case 'Green': return 'bg-[#3aa948]'; // Verde UNO
      default: return 'bg-[#111111]'; // Preto para Wild
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

  if (hidden) {
    return (
      <div className={`${dims} bg-black rounded-xl border-4 border-white flex items-center justify-center shadow-xl relative overflow-hidden`}>
         <div className="w-[85%] h-[85%] flex items-center justify-center border-[6px] border-[#eb2739] rounded-lg">
            <span className="text-white font-black text-2xl italic scale-y-150">UNO</span>
         </div>
      </div>
    );
  }

  const symbol = getCardSymbol(card);

  return (
    <div 
      onClick={playable ? onClick : undefined}
      className={`
        ${dims} 
        ${getBgColor(card.color)}
        rounded-xl border-[4px] border-white
        flex flex-col items-center justify-center shadow-2xl cursor-pointer
        transition-all transform hover:-translate-y-8 active:scale-95
        relative overflow-hidden
        ${playable ? 'ring-[6px] ring-yellow-400 z-10 scale-105' : ''}
      `}
    >
      {/* Elipse Branca Central - Característica do UNO */}
      <div className="absolute w-[130%] h-[75%] bg-white rounded-[100%] rotate-[-28deg] shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] flex items-center justify-center">
         <span className={`font-black italic ${size === 'lg' ? 'text-7xl' : size === 'md' ? 'text-5xl' : 'text-3xl'} ${getTextColor(card.color)} drop-shadow-md rotate-[28deg] scale-y-110 tracking-tighter`}>
            {symbol}
         </span>
      </div>

      {/* Símbolos dos Cantos */}
      <div className="absolute top-1 left-1.5 font-black text-white italic text-base drop-shadow-md">
        {symbol}
      </div>
      <div className="absolute bottom-1 right-1.5 font-black text-white italic text-base drop-shadow-md rotate-180">
        {symbol}
      </div>

      {/* Detalhe de Coringa (Quatro Cores) */}
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
