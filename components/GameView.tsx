
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store';
import { Player, Card, CardColor, CardType, GameStatus } from '../types';
import { createDeck, isCardPlayable, getBotMove, getRandomColor, isExactMatch, isValidCombo } from '../logic/gameLogic';
import ClashCard from './ClashCard';
import { ARENAS, COLORS } from '../constants';

const DEFAULT_TURN_TIME = 10;

const EMOTES = [
  { id: 'laugh', icon: '😂' },
  { id: 'cry', icon: '😭' },
  { id: 'angry', icon: '😡' },
  { id: 'thumbs', icon: '👍' }
];

const GameView: React.FC = () => {
  const { currentArenaIndex, setGameStatus, updateTrophies, setLastRewards, profile } = useGameStore();
  const arena = ARENAS[currentArenaIndex];
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [direction, setDirection] = useState(1); 
  const [currentColor, setCurrentColor] = useState<CardColor>('Red');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(`Arena ${currentArenaIndex + 1}: Começou!`);
  
  const [selectedCardsIds, setSelectedCardsIds] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [activeEmote, setActiveEmote] = useState<{playerId: string, icon: string} | null>(null);
  const [pendingCards, setPendingCards] = useState<Card[] | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const [timeLeft, setTimeLeft] = useState(DEFAULT_TURN_TIME);
  const [unoDeclared, setUnoDeclared] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fullDeck = createDeck(profile.activeDeck);
    const botCount = arena.bots;
    const initialPlayers: Player[] = [{ id: 'player', name: 'Você', isBot: false, cards: [], avatar: '👑' }];
    for (let i = 0; i < botCount; i++) {
      initialPlayers.push({ id: `bot-${i}`, name: `Bot ${i + 1}`, isBot: true, cards: [], avatar: '🤖' });
    }
    const dealtPlayers = initialPlayers.map(p => ({ ...p, cards: fullDeck.splice(0, 7) }));
    const firstCard = fullDeck.pop()!;
    setDeck(fullDeck);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color === 'Wild' ? getRandomColor() : firstCard.color);
    setPlayers(dealtPlayers);
  }, [arena.bots, profile.activeDeck]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const showEmote = (playerId: string, icon: string) => {
    setActiveEmote({ playerId, icon });
    setTimeout(() => setActiveEmote(null), 2500);
  };

  const nextTurn = useCallback((skipCount = 1) => {
    setPlayers(currentPlayers => {
      if (currentPlayers.length === 0) return currentPlayers;
      setTurn(prev => (prev + (skipCount * direction) + currentPlayers.length) % currentPlayers.length);
      return currentPlayers;
    });
    setSelectedCardsIds([]);
    setUnoDeclared(false);
  }, [direction]);

  const drawCard = useCallback((playerIndex: number, count = 1) => {
    let cardsToDraw: Card[] = [];
    
    setDeck(prevDeck => {
      const newDeck = [...prevDeck];
      cardsToDraw = newDeck.splice(0, count);
      if (newDeck.length === 0) {
        const reshuffled = createDeck(profile.activeDeck);
        const needed = count - cardsToDraw.length;
        cardsToDraw = [...cardsToDraw, ...reshuffled.splice(0, needed)];
        return reshuffled;
      }
      return newDeck;
    });

    setPlayers(prevPlayers => {
      if (!prevPlayers[playerIndex]) return prevPlayers;
      return prevPlayers.map((p, idx) => {
        if (idx === playerIndex) {
          return { ...p, cards: [...p.cards, ...cardsToDraw] };
        }
        return p;
      });
    });
    
    return cardsToDraw;
  }, [profile.activeDeck]);

  const handleTimeOut = useCallback(() => {
    if (isProcessing) return;
    setTurn(currentTurn => {
      if (currentTurn === 0) {
        setMessage("TEMPO ESGOTADO!");
        drawCard(0, 1);
        nextTurn();
      } else {
        drawCard(currentTurn, 1);
        nextTurn();
      }
      return currentTurn;
    });
  }, [isProcessing, drawCard, nextTurn]);

  useEffect(() => {
    if (isProcessing || players.length === 0 || showColorPicker) return;
    const isRapidArena = currentArenaIndex === 9;
    setTimeLeft(isRapidArena ? 5 : DEFAULT_TURN_TIME);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 3) triggerShake(); 
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [turn, isProcessing, currentArenaIndex, players.length, handleTimeOut, showColorPicker]);

  const toggleSelectCard = (card: Card) => {
    if (players.length === 0 || isProcessing || showColorPicker) return;
    
    setSelectedCardsIds(prev => {
      if (prev.includes(card.instanceId)) return prev.filter(id => id !== card.instanceId);
      
      const playerHand = players[0]?.cards || [];
      const currentSelected = prev.map(id => playerHand.find(c => c.instanceId === id)!).filter(Boolean);
      
      if (currentSelected.length > 0) {
        const first = currentSelected[0];
        if (first.type === CardType.NUMBER) {
          if (card.type !== CardType.NUMBER || card.value !== first.value) return prev;
        } else {
          if (card.type !== first.type) return prev;
        }
      }
      return [...prev, card.instanceId];
    });
  };

  const executePlay = useCallback((playerIndex: number, cards: Card[], chosenColor?: CardColor) => {
    setIsProcessing(true);
    
    setPlayers(prevPlayers => {
      if (!prevPlayers[playerIndex]) return prevPlayers;
      
      const lastCard = cards[cards.length - 1];
      
      // Feedback visual de impacto
      if (lastCard.rarity === 'Lendária' || lastCard.type === CardType.DRAW4) {
        triggerShake();
      }

      const updatedPlayers = prevPlayers.map((p, idx) => {
        if (idx === playerIndex) {
          const newHand = p.cards.filter(c => !cards.some(played => played.instanceId === c.instanceId));
          
          // MECÂNICA DE PENALIDADE UNO
          if (playerIndex === 0 && newHand.length === 1 && !unoDeclared) {
             setMessage("PENALIDADE: NÃO FALOU UNO!");
             setTimeout(() => drawCard(0, 2), 400);
          }

          return { ...p, cards: newHand };
        }
        return p;
      });

      let skip = 1;
      let colorToSet: CardColor = lastCard.color === 'Wild' ? (chosenColor || getRandomColor()) : lastCard.color;

      setDiscardPile(prev => [...prev, ...cards]);

      setTurn(currentTurn => {
        let nextT = currentTurn;
        if (currentTurn !== playerIndex) {
          setMessage(`${updatedPlayers[playerIndex].name} REAGIU!`);
          nextT = playerIndex;
        }

        if (lastCard.type === CardType.SKIP) skip = 2;
        else if (lastCard.type === CardType.REVERSE) setDirection(prev => prev * -1);
        else if (lastCard.type === CardType.DRAW2) {
          const victimIndex = (playerIndex + (1 * direction) + updatedPlayers.length) % updatedPlayers.length;
          setTimeout(() => drawCard(victimIndex, 2), 500);
          skip = 2;
        } else if (lastCard.type === CardType.DRAW4) {
          const victimIndex = (playerIndex + (1 * direction) + updatedPlayers.length) % updatedPlayers.length;
          setTimeout(() => drawCard(victimIndex, 4), 500);
          skip = 2;
          colorToSet = chosenColor || getRandomColor();
        }

        setCurrentColor(colorToSet);

        if (updatedPlayers[playerIndex].cards.length === 0) {
          const goldBase = arena.bots * 100;
          const levelBonus = Math.floor(goldBase * (profile.level - 1) * 0.1);
          const gems = arena.bots * 10;
          setLastRewards({ gold: goldBase, gems, bonus: levelBonus });
          setGameStatus(playerIndex === 0 ? GameStatus.VICTORY : GameStatus.DEFEAT);
          updateTrophies(playerIndex === 0 ? 30 : -15);
        } else {
          setTimeout(() => {
            setIsProcessing(false);
            nextTurn(skip);
          }, 800);
        }

        return nextT;
      });

      return updatedPlayers;
    });
  }, [arena.bots, setGameStatus, updateTrophies, setLastRewards, nextTurn, drawCard, direction, unoDeclared, profile.level]);

  const confirmPlay = () => {
    if (isProcessing || players.length === 0) return;
    const playerHand = players[0].cards;
    const selected = selectedCardsIds
      .map(id => playerHand.find(c => c.instanceId === id)!)
      .filter(Boolean);

    const topCard = discardPile[discardPile.length - 1];
    
    if (isValidCombo(selected, topCard, currentColor, turn === 0)) {
       const lastCard = selected[selected.length - 1];
       if (lastCard.color === 'Wild' || lastCard.type === CardType.DRAW4) {
          setPendingCards(selected);
          setShowColorPicker(true);
       } else {
          executePlay(0, selected);
       }
    }
  };

  const handleColorPick = (color: CardColor) => {
    if (pendingCards) {
      executePlay(0, pendingCards, color);
      setPendingCards(null);
      setShowColorPicker(false);
    }
  };

  const handleEmoteClick = (emote: typeof EMOTES[0]) => {
    showEmote('player', emote.icon);
    setShowEmotePicker(false);
  };

  useEffect(() => {
    if (players.length > 0 && players[turn]?.isBot && !isProcessing && !showColorPicker) {
      const bot = players[turn];
      const topCard = discardPile[discardPile.length - 1];
      const moves = getBotMove(bot.cards, topCard, currentColor);
      
      const thinkTime = 1200 + Math.random() * 1000;
      const timer = setTimeout(() => {
        if (moves.length > 0) {
          executePlay(turn, moves);
        } else {
          drawCard(turn, 1);
          nextTurn();
        }
      }, thinkTime);
      return () => clearTimeout(timer);
    }
  }, [turn, isProcessing, players, currentColor, discardPile, drawCard, executePlay, nextTurn, showColorPicker]);

  if (players.length === 0) return null;

  const topCard = discardPile[discardPile.length - 1];
  const playerHand = players[0]?.cards || [];
  const selectedCards = selectedCardsIds.map(id => playerHand.find(c => c.instanceId === id)!).filter(Boolean);
  const isPlayableCombo = isValidCombo(selectedCards, topCard, currentColor, turn === 0);

  return (
    <div className={`h-screen w-full ${arena.bgColor} relative flex flex-col items-center justify-between overflow-hidden transition-all duration-300 ${isShaking ? 'animate-shake' : ''}`}>
      
      <div className="w-full flex justify-center gap-6 pt-4 pb-2 z-10">
        {players.slice(1).map((bot, idx) => (
          <div key={bot.id} className="relative">
            <div className={`flex flex-col items-center transition-all duration-500 ${turn === idx + 1 ? 'scale-110 opacity-100' : 'opacity-40 grayscale'}`}>
              <div className={`w-12 h-12 rounded-full border-[3px] ${turn === idx + 1 ? 'border-yellow-400 bg-blue-700 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-white/30 bg-gray-800'} flex items-center justify-center text-2xl relative overflow-hidden`}>
                {bot.avatar}
                {turn === idx + 1 && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
              </div>
              <div className="text-white text-[9px] font-black clash-text mt-1 bg-black/60 px-2 rounded-full border border-white/10">{bot.cards.length}</div>
            </div>
            {activeEmote?.playerId === bot.id && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white rounded-xl p-1.5 text-xl emote-bubble animate-in zoom-in duration-300 z-50 shadow-xl">
                {activeEmote.icon}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative w-full gap-8">
         <div className="bg-black/70 px-8 py-2 rounded-full text-white font-black clash-text text-[10px] z-10 uppercase italic tracking-widest border border-white/20">
            {message}
         </div>

         <div className="flex items-center gap-16 relative">
            <div 
              onClick={() => !isProcessing && turn === 0 && !showColorPicker && drawCard(0, 1) && nextTurn()} 
              className={`cursor-pointer hover:scale-105 transition-all active:scale-95 group ${turn === 0 ? 'opacity-100' : 'opacity-50 grayscale'}`}
            >
               <ClashCard card={{} as any} hidden size="md" />
            </div>

            <div className="relative group">
              <ClashCard card={topCard} size="lg" />
              <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full text-[9px] text-white font-black border-2 border-white/20 uppercase italic tracking-[0.2em] whitespace-nowrap transition-colors duration-500 ${currentColor === 'Red' ? 'bg-red-600' : currentColor === 'Blue' ? 'bg-blue-600' : currentColor === 'Yellow' ? 'bg-yellow-500 text-black' : 'bg-green-600'}`}>
                {currentColor}
              </div>
            </div>
         </div>

         {showColorPicker && (
            <div className="absolute z-[200] flex flex-col items-center animate-in zoom-in duration-300">
               <div className="bg-black/80 p-5 rounded-[30px] border-2 border-white/20 flex flex-col items-center gap-4">
                  <span className="text-white font-black clash-text italic text-[10px] uppercase tracking-[0.3em] opacity-80">Mudar Cor</span>
                  <div className="flex gap-3">
                     {COLORS.map(color => (
                        <button
                           key={color}
                           onClick={() => handleColorPick(color)}
                           className={`w-14 h-14 rounded-2xl border-4 border-white/40 transition-all hover:scale-110 active:scale-90 flex items-center justify-center
                              ${color === 'Red' ? 'bg-[#eb2739]' : color === 'Blue' ? 'bg-[#3558a7]' : color === 'Yellow' ? 'bg-[#f7da21]' : 'bg-[#3aa948]'}
                           `}
                        >
                           <span className="text-white text-xl">👑</span>
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>

      <div className="absolute w-full px-6 pointer-events-none" style={{ bottom: '210px' }}>
         <div className="flex justify-between items-center w-full pointer-events-auto">
            <div className="relative">
              <button 
                onClick={() => setShowEmotePicker(!showEmotePicker)}
                className="w-14 h-14 bg-white/20 hover:bg-white/40 rounded-full border-2 border-white/30 flex items-center justify-center text-2xl transition-all active:scale-90"
              >
                💬
              </button>
              {showEmotePicker && (
                <div className="absolute bottom-16 left-0 bg-black/80 p-3 rounded-2xl border-2 border-white/20 flex flex-wrap w-36 gap-2 animate-in slide-in-from-bottom-5 z-[100]">
                  {EMOTES.map(emote => (
                    <button 
                      key={emote.id} 
                      onClick={() => handleEmoteClick(emote)}
                      className="w-12 h-12 bg-white/10 hover:bg-white/30 rounded-xl flex items-center justify-center text-2xl transition-transform active:scale-90"
                    >
                      {emote.icon}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {playerHand.length <= 2 && !showColorPicker && (
              <button 
                  onClick={() => setUnoDeclared(true)}
                  className={`w-18 h-18 rounded-full border-[5px] border-white flex items-center justify-center font-black clash-text italic text-xl transition-all ${unoDeclared ? 'bg-green-600 scale-90 opacity-60 grayscale' : 'bg-red-600 animate-bounce hover:scale-110 active:scale-90 shadow-[0_0_25px_rgba(235,39,57,0.5)]'}`}
              >
                  UNO!
              </button>
            )}
         </div>
      </div>

      <div className="w-full max-w-5xl z-20 relative">
        {selectedCardsIds.length > 0 && isPlayableCombo && !showColorPicker && (
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in duration-200">
            <button 
                onClick={confirmPlay}
                className="bg-yellow-500 hover:bg-yellow-400 px-12 py-3.5 rounded-2xl border-b-[6px] border-yellow-800 font-black clash-text italic text-2xl uppercase text-black active:translate-y-1 active:border-b-2 transition-all shadow-2xl"
            >
                JOGAR!
            </button>
          </div>
        )}

        <div className="flex justify-center -space-x-12 h-40 items-end pb-2">
          {playerHand.map((card, idx) => (
            <div key={card.instanceId} className="relative transition-all duration-300">
              <ClashCard 
                card={card} 
                size="md"
                selected={selectedCardsIds.includes(card.instanceId)}
                playable={isCardPlayable(card, topCard, currentColor) || isExactMatch(card, topCard, currentColor)}
                onClick={() => toggleSelectCard(card)}
              />
              {activeEmote?.playerId === 'player' && idx === Math.floor(playerHand.length / 2) && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white rounded-xl p-1.5 text-xl emote-bubble animate-in zoom-in duration-300 z-50 shadow-xl">
                  {activeEmote.icon}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between bg-[#1a2b45] rounded-t-[40px] px-8 py-4 border-t-4 border-blue-400">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-xl border-[3px] ${turn === 0 ? 'border-yellow-400 bg-blue-600 shadow-inner' : 'border-blue-500/40 bg-blue-900'} flex items-center justify-center text-3xl transition-all duration-500`}>
              👑
            </div>
            
            <div className="flex flex-col">
              <span className={`text-white font-black text-[9px] uppercase italic tracking-[0.15em] transition-all ${timeLeft < 4 ? 'text-red-500 animate-pulse' : 'opacity-60'}`}>
                {timeLeft < 4 ? 'TEMPO ACABANDO!' : 'Seu Turno'}
              </span>
              <div className="w-40 h-2 bg-black/60 rounded-full mt-1.5 overflow-hidden border border-white/10 p-[1px]">
                <div 
                    className={`h-full transition-all duration-1000 rounded-full ${timeLeft < 4 ? 'bg-red-500' : 'bg-blue-400'}`} 
                    style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
             <div className={`font-black clash-text text-xl italic uppercase tracking-tighter transition-colors ${turn === 0 ? 'text-yellow-400' : 'text-white/20'}`}>
                {turn === 0 ? 'SUA VEZ' : 'AGUARDE'}
             </div>
             <div className="text-blue-300 text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-1 bg-blue-950/40 px-3 py-0.5 rounded-full border border-blue-400/20 italic">
               {arena.name}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameView;
