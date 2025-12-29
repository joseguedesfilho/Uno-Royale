
import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store';
import { Player, Card, CardColor, CardType, GameStatus } from '../types';
import { createDeck, isCardPlayable, getBotMove, getRandomColor } from '../logic/gameLogic';
import ClashCard from './ClashCard';
import { ARENAS } from '../constants';
import { SOUNDS, playSound } from '../logic/soundManager';

const GameView: React.FC = () => {
  const { currentArenaIndex, setGameStatus, addRewards, updateTrophies, setLastRewards } = useGameStore();
  const arena = ARENAS[currentArenaIndex];
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [direction, setDirection] = useState(1); 
  const [currentColor, setCurrentColor] = useState<CardColor>('Red');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(`Arena ${currentArenaIndex + 1}: Início da Partida!`);

  useEffect(() => {
    const fullDeck = createDeck();
    const botCount = arena.bots;
    const initialPlayers: Player[] = [
      { id: 'player', name: 'Você', isBot: false, cards: [], avatar: '👑' }
    ];
    for (let i = 0; i < botCount; i++) {
      initialPlayers.push({ id: `bot-${i}`, name: `Oponente ${i + 1}`, isBot: true, cards: [], avatar: '🤖' });
    }

    const dealtPlayers = initialPlayers.map(p => ({
      ...p,
      cards: fullDeck.splice(0, 7)
    }));

    const firstCard = fullDeck.pop()!;
    setDeck(fullDeck);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color === 'Wild' ? getRandomColor() : firstCard.color);
    setPlayers(dealtPlayers);
  }, []);

  const nextTurn = (skipCount = 1) => {
    setTurn(prev => (prev + (skipCount * direction) + players.length) % players.length);
  };

  const drawCard = (playerIndex: number, count = 1) => {
    playSound(SOUNDS.CARD_DRAW);
    const newDeck = [...deck];
    const cardsToDraw = newDeck.splice(0, count);
    
    if (newDeck.length === 0) {
      newDeck.push(...createDeck().splice(0, 20));
    }

    const newPlayers = [...players];
    newPlayers[playerIndex].cards.push(...cardsToDraw);
    
    setDeck(newDeck);
    setPlayers(newPlayers);
    return cardsToDraw;
  };

  const handlePlayCard = (playerIndex: number, card: Card) => {
    if (isProcessing) return;
    
    const topCard = discardPile[discardPile.length - 1];
    if (!isCardPlayable(card, topCard, currentColor)) return;

    setIsProcessing(true);
    const newPlayers = [...players];
    newPlayers[playerIndex].cards = newPlayers[playerIndex].cards.filter(c => c.id !== card.id);
    setPlayers(newPlayers);
    setDiscardPile(prev => [...prev, card]);

    // Tocar o som padrão para qualquer carta jogada
    playSound(SOUNDS.CARD_PLAY);

    let skip = 1;
    let colorToSet = card.color === 'Wild' ? (players[playerIndex].isBot ? getRandomColor() : 'Wild') : card.color;

    if (card.type === CardType.SKIP) {
      skip = 2;
      setMessage(`${newPlayers[playerIndex].name} usou Gelo!`);
    } else if (card.type === CardType.REVERSE) {
      setDirection(prev => prev * -1);
      setMessage(`${newPlayers[playerIndex].name} usou O Tronco!`);
    } else if (card.type === CardType.DRAW2) {
      const victimIndex = (playerIndex + direction + players.length) % players.length;
      drawCard(victimIndex, 2);
      skip = 2;
      setMessage(`${newPlayers[playerIndex].name} usou Fúria! +2`);
    } else if (card.type === CardType.DRAW4) {
      const victimIndex = (playerIndex + direction + players.length) % players.length;
      drawCard(victimIndex, 4);
      skip = 2;
      colorToSet = players[playerIndex].isBot ? getRandomColor() : 'Wild';
      setMessage(`${newPlayers[playerIndex].name} usou Exército de Esqueletos! +4`);
    }

    if (colorToSet === 'Wild') {
      const chosen = prompt("Escolha a cor: Red (Vermelho), Blue (Azul), Yellow (Amarelo), Green (Verde)") as CardColor || 'Red';
      setCurrentColor(chosen);
    } else {
      setCurrentColor(colorToSet);
    }

    if (newPlayers[playerIndex].cards.length === 0) {
      if (playerIndex === 0) handleVictory();
      else handleDefeat();
      return;
    }

    setTimeout(() => {
      setIsProcessing(false);
      nextTurn(skip);
    }, 1000);
  };

  const handleVictory = () => {
    const gold = arena.bots * 100;
    const gems = arena.bots * 10;
    setLastRewards({ gold, gems });
    setGameStatus(GameStatus.VICTORY);
    updateTrophies(30);
  };

  const handleDefeat = () => {
    setGameStatus(GameStatus.DEFEAT);
    updateTrophies(-15);
  };

  useEffect(() => {
    if (players.length > 0 && players[turn]?.isBot && !isProcessing) {
      const bot = players[turn];
      const move = getBotMove(bot.cards, discardPile[discardPile.length - 1], currentColor);
      
      const timer = setTimeout(() => {
        if (move) handlePlayCard(turn, move);
        else {
          drawCard(turn, 1);
          nextTurn();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, players, isProcessing]);

  if (players.length === 0) return <div className="h-screen bg-black flex items-center justify-center text-white font-black italic">CARREGANDO ARENA...</div>;

  const currentPlayer = players[0];
  const topCard = discardPile[discardPile.length - 1];

  return (
    <div className={`h-screen w-full ${arena.bgColor} relative flex flex-col items-center justify-between overflow-hidden p-4`}>
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      <div className="w-full flex justify-center gap-4 py-4 flex-wrap">
        {players.slice(1).map((bot, idx) => (
          <div key={bot.id} className={`flex flex-col items-center transition-all ${turn === idx + 1 ? 'scale-110' : 'opacity-70'}`}>
            <div className={`w-12 h-12 rounded-full border-4 ${turn === idx + 1 ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-white'} bg-gray-800 flex items-center justify-center text-2xl shadow-lg`}>
              {bot.avatar}
            </div>
            <div className="text-white text-[10px] font-bold clash-text mt-1 uppercase tracking-tighter">{bot.name}</div>
            <div className="text-yellow-400 text-xs font-black drop-shadow-sm">{bot.cards.length} Cartas</div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative w-full">
         <div className="absolute top-4 bg-black/70 px-8 py-2 rounded-full border border-white/20 text-white font-black clash-text z-10 text-sm italic tracking-wide uppercase">
            {message}
         </div>

         <div className="flex items-center gap-12">
            <div onClick={() => turn === 0 && !isProcessing && drawCard(0, 1) && nextTurn()} className="relative cursor-pointer group">
               <ClashCard card={{} as any} hidden size="md" />
               <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-black rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-xl group-hover:scale-110 transition-transform">
                 {deck.length}
               </div>
            </div>

            <div className="relative">
              <div className={`absolute -inset-8 rounded-full blur-2xl transition-all duration-500 ${
                currentColor === 'Red' ? 'bg-red-500/30' : 
                currentColor === 'Blue' ? 'bg-blue-500/30' : 
                currentColor === 'Green' ? 'bg-green-500/30' : 'bg-yellow-500/30'
              }`}></div>
              <ClashCard card={topCard} size="lg" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-5 py-1.5 rounded-full text-[11px] text-white font-black border border-white/20 whitespace-nowrap shadow-xl">
                COR ATUAL: <span className={
                  currentColor === 'Red' ? 'text-red-400' : 
                  currentColor === 'Blue' ? 'text-blue-400' : 
                  currentColor === 'Green' ? 'text-green-400' : 'text-yellow-400'
                }>{currentColor === 'Red' ? 'VERMELHO' : currentColor === 'Blue' ? 'AZUL' : currentColor === 'Green' ? 'VERDE' : 'AMARELO'}</span>
              </div>
            </div>
         </div>
      </div>

      <div className="w-full max-w-4xl pb-4">
        <div className="flex justify-center -space-x-8 hover:space-x-1 transition-all duration-300 px-8 h-48 items-end">
          {currentPlayer.cards.map((card) => (
            <ClashCard 
              key={card.id} 
              card={card} 
              size="md"
              playable={turn === 0 && isCardPlayable(card, topCard, currentColor)}
              onClick={() => handlePlayCard(0, card)}
            />
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between bg-black/80 rounded-2xl p-4 border-t-2 border-blue-400/50 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl border-4 ${turn === 0 ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'border-blue-500'} bg-blue-900 flex items-center justify-center text-3xl shadow-lg transition-all`}>
              👑
            </div>
            <div>
              <div className="text-white font-black clash-text text-xs uppercase opacity-70">NÍVEL {useGameStore.getState().profile.level}</div>
              <div className="w-40 h-3.5 bg-gray-800 rounded-full overflow-hidden border border-black/50 mt-1">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
             <div className={`font-black clash-text text-xl italic uppercase transition-colors ${turn === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {turn === 0 ? 'SUA VEZ' : 'AGUARDE'}
             </div>
             <div className="text-blue-300 text-[10px] font-black uppercase tracking-widest">{arena.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameView;
