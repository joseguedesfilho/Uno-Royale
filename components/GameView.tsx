
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store.ts';
import { Player, Card, CardColor, CardType, GameStatus } from '../types.ts';
import { createDeck, isCardPlayable, getBotMove, getRandomColor, isValidCombo } from '../logic/gameLogic.ts';
import ClashCard from './ClashCard.tsx';
import { ARENAS, COLORS, ALL_CARDS } from '../constants.tsx';
import { sounds } from '../logic/soundManager.ts';

const DEFAULT_TURN_TIME = 10;

const GameView: React.FC = () => {
  const { 
    currentArenaIndex, 
    setGameStatus, 
    updateTrophies, 
    setLastRewards, 
    profile, 
    isBossBattle, 
    isRanked,
    quitGame 
  } = useGameStore();
  
  const arena = ARENAS[currentArenaIndex];
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [direction, setDirection] = useState(1); 
  const [currentColor, setCurrentColor] = useState<CardColor>('Red');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  
  const [selectedCardsIds, setSelectedCardsIds] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCards, setPendingCards] = useState<Card[] | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [freezeOverlay, setFreezeOverlay] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const [timeLeft, setTimeLeft] = useState(DEFAULT_TURN_TIME);
  const [unoDeclared, setUnoDeclared] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sounds.startBGM();
    const fullDeck = createDeck(profile.activeDeck);
    const botCount = isBossBattle ? 1 : arena.bots;
    const initialPlayers: Player[] = [{ id: 'player', name: 'Você', isBot: false, cards: [], avatar: '👑' }];
    
    for (let i = 0; i < botCount; i++) {
      initialPlayers.push({ 
        id: `bot-${i}`, 
        name: isBossBattle ? 'Mestre da Arena' : `Adversário ${i + 1}`, 
        isBot: true, 
        cards: [], 
        avatar: isBossBattle ? '👹' : '🤖',
        isBoss: isBossBattle
      });
    }

    const dealtPlayers = initialPlayers.map(p => {
      const initialHandSize = (p.isBoss && arena.bossPower?.includes('4 cartas')) ? 4 : 7;
      return { ...p, cards: fullDeck.splice(0, initialHandSize) };
    });

    const firstCard = fullDeck.pop()!;
    setDeck(fullDeck);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color === 'Wild' ? getRandomColor() : firstCard.color);
    setPlayers(dealtPlayers);

    return () => sounds.stopBGM();
  }, [arena.bots, profile.activeDeck, isBossBattle, arena.bossPower]);

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
    sounds.playCardPlay();
    
    setDeck(prevDeck => {
      const newDeck = [...prevDeck];
      cardsToDraw = newDeck.splice(0, count);
      if (newDeck.length === 0) return createDeck(profile.activeDeck);
      return newDeck;
    });

    setPlayers(prevPlayers => {
      if (!prevPlayers[playerIndex]) return prevPlayers;
      return prevPlayers.map((p, idx) => {
        if (idx === playerIndex) return { ...p, cards: [...p.cards, ...cardsToDraw] };
        return p;
      });
    });
    return cardsToDraw;
  }, [profile.activeDeck, players]);

  const handleTimeOut = useCallback(() => {
    if (isProcessing) return;
    drawCard(turn, 1);
    nextTurn();
  }, [isProcessing, drawCard, nextTurn, turn]);

  useEffect(() => {
    if (isProcessing || players.length === 0 || showColorPicker || showQuitConfirm) return;
    setTimeLeft(DEFAULT_TURN_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleTimeOut(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [turn, isProcessing, handleTimeOut, showColorPicker, players.length, showQuitConfirm]);

  const toggleSelectCard = (card: Card) => {
    if (players.length === 0 || isProcessing || showColorPicker || showQuitConfirm) return;
    sounds.playClick();
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
    sounds.playCardPlay();
    
    setPlayers(prevPlayers => {
      if (!prevPlayers[playerIndex]) return prevPlayers;
      const lastCard = cards[cards.length - 1];

      const updatedPlayers = prevPlayers.map((p, idx) => {
        if (idx === playerIndex) {
          const newHand = p.cards.filter(c => !cards.some(played => played.instanceId === c.instanceId));
          if (playerIndex === 0 && newHand.length === 1 && !unoDeclared) {
             setTimeout(() => drawCard(0, 2), 400);
          }
          return { ...p, cards: newHand };
        }
        return p;
      });

      let skip = 1;
      let colorToSet: CardColor = lastCard.color === 'Wild' ? (chosenColor || getRandomColor()) : lastCard.color;

      if (lastCard.type === CardType.SKIP) {
        sounds.playFreeze();
        setFreezeOverlay(true);
        setTimeout(() => setFreezeOverlay(false), 800);
        skip = 2;
      } else if (lastCard.type === CardType.REVERSE) {
        sounds.playReverse();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setDirection(prev => prev * -1);
      } else if (lastCard.type === CardType.DRAW2) {
        const victimIndex = (playerIndex + (1 * direction) + updatedPlayers.length) % updatedPlayers.length;
        setTimeout(() => drawCard(victimIndex, 2), 500);
        skip = 2;
      } else if (lastCard.type === CardType.DRAW4) {
        const victimIndex = (playerIndex + (1 * direction) + updatedPlayers.length) % updatedPlayers.length;
        setTimeout(() => drawCard(victimIndex, 4), 500);
        skip = 2;
        colorToSet = chosenColor || getRandomColor();
      }

      setDiscardPile(prev => [...prev, ...cards]);
      setCurrentColor(colorToSet);

      if (updatedPlayers[playerIndex].cards.length === 0) {
        const goldBase = isBossBattle ? 1000 : 200;
        const gems = isBossBattle ? 50 : 5;
        setLastRewards({ gold: goldBase, gems, bonus: 0, chestAcquired: true });
        if (playerIndex === 0) { sounds.playVictory(); setGameStatus(GameStatus.VICTORY); }
        else { sounds.playDefeat(); setGameStatus(GameStatus.DEFEAT); }
        updateTrophies(playerIndex === 0 ? (isBossBattle ? 100 : 30) : -15);
      } else {
        setTimeout(() => { setIsProcessing(false); nextTurn(skip); }, 800);
      }
      return updatedPlayers;
    });
  }, [setGameStatus, updateTrophies, setLastRewards, nextTurn, drawCard, direction, unoDeclared, isBossBattle]);

  const confirmPlay = () => {
    if (isProcessing || players.length === 0 || showQuitConfirm) return;
    const playerHand = players[0].cards;
    const selected = selectedCardsIds.map(id => playerHand.find(c => c.instanceId === id)!).filter(Boolean);
    const topCard = discardPile[discardPile.length - 1];
    if (isValidCombo(selected, topCard, currentColor, turn === 0)) {
       const lastCard = selected[selected.length - 1];
       if (lastCard.color === 'Wild' || lastCard.type === CardType.DRAW4) {
          setPendingCards(selected);
          setShowColorPicker(true);
       } else { executePlay(0, selected); }
    }
  };

  const handleColorPick = (color: CardColor) => {
    if (pendingCards) {
      executePlay(0, pendingCards, color);
      setPendingCards(null);
      setShowColorPicker(false);
    }
  };

  useEffect(() => {
    if (players.length > 0 && players[turn]?.isBot && !isProcessing && !showColorPicker && !showQuitConfirm) {
      const botHand = [...players[turn].cards];
      const moves = getBotMove(botHand, discardPile[discardPile.length - 1], currentColor, currentArenaIndex);
      const timer = setTimeout(() => {
        if (moves.length > 0) executePlay(turn, moves);
        else { drawCard(turn, 1); nextTurn(); }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, isProcessing, players, currentColor, discardPile, drawCard, executePlay, nextTurn, showColorPicker, showQuitConfirm, currentArenaIndex]);

  if (players.length === 0) return null;

  return (
    <div className={`h-screen w-full ${arena.bgColor} relative flex flex-col items-center justify-between overflow-hidden ${isShaking ? 'animate-shake' : ''}`}>
      {freezeOverlay && <div className="absolute inset-0 z-[150] bg-cyan-400/20 backdrop-blur-sm animate-pulse pointer-events-none"></div>}
      
      {/* HUD Superior: Oponentes */}
      <div className="w-full flex justify-between items-center px-6 pt-6 z-10">
        <button onClick={() => { sounds.playClick(); setShowQuitConfirm(true); }} className="w-12 h-12 bg-black/40 rounded-2xl border-2 border-white/10 flex items-center justify-center text-xl active:scale-90 transition-all">🚪</button>
        <div className="flex gap-6">
          {players.slice(1).map((bot, idx) => (
            <div key={bot.id} className={`flex flex-col items-center transition-all ${turn === idx + 1 ? 'scale-110' : 'opacity-40'}`}>
              <div className={`w-12 h-12 rounded-full border-[3px] ${turn === idx + 1 ? 'border-yellow-400 bg-blue-700' : 'border-white/30 bg-gray-800'} flex items-center justify-center text-2xl shadow-lg`}>{bot.avatar}</div>
              <div className="text-white text-[9px] font-black mt-1 bg-black/60 px-2 rounded-full">{bot.cards.length}</div>
            </div>
          ))}
        </div>
        <div className="w-12"></div>
      </div>

      {/* Área Central: Mesa */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full gap-12">
         <div className="flex items-center gap-16">
            <div onClick={() => !isProcessing && turn === 0 && !showColorPicker && drawCard(0, 1) && nextTurn()} className={`transition-all active:scale-95 ${turn === 0 ? 'opacity-100 cursor-pointer' : 'opacity-50 pointer-events-none'}`}>
               <ClashCard card={{} as any} hidden size="md" />
            </div>
            <div className="relative">
              <ClashCard card={discardPile[discardPile.length - 1]} size="lg" />
              <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full text-[9px] text-white font-black border-2 border-white/20 uppercase italic tracking-widest shadow-lg ${currentColor === 'Red' ? 'bg-red-600' : currentColor === 'Blue' ? 'bg-blue-600' : currentColor === 'Yellow' ? 'bg-yellow-500 text-black' : 'bg-green-600'}`}>
                {currentColor}
              </div>
            </div>
         </div>
      </div>

      {/* Color Picker Pop-over */}
      {showColorPicker && (
        <div className="absolute z-[200] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 p-6 rounded-[40px] border-2 border-white/20 flex flex-col items-center gap-5 animate-in zoom-in duration-300">
           <span className="text-white font-black text-[10px] uppercase italic tracking-widest">Escolha uma Cor</span>
           <div className="flex gap-4">
              {COLORS.map(color => (
                 <button key={color} onClick={() => handleColorPick(color)} className={`w-14 h-14 rounded-2xl border-4 border-white/40 active:scale-90 transition-all ${color === 'Red' ? 'bg-red-600' : color === 'Blue' ? 'bg-blue-600' : color === 'Yellow' ? 'bg-yellow-400' : 'bg-green-600'}`} />
              ))}
           </div>
        </div>
      )}

      {/* Confirmação de Saída */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-[#1a2b45] w-full max-w-sm rounded-[50px] border-4 border-blue-400 p-10 flex flex-col items-center text-center">
              <span className="text-7xl mb-6">⚠️</span>
              <h2 className="text-3xl font-black clash-text italic text-white uppercase mb-8">Sair da Partida?</h2>
              <div className="grid grid-cols-1 w-full gap-4">
                 <button onClick={() => quitGame()} className="w-full py-5 bg-red-600 border-b-8 border-red-900 rounded-2xl font-black clash-text italic text-xl uppercase active:translate-y-2 active:border-b-0">ABANDONAR</button>
                 <button onClick={() => setShowQuitConfirm(false)} className="w-full py-5 bg-blue-600 border-b-8 border-blue-900 rounded-2xl font-black clash-text italic text-xl uppercase active:translate-y-2 active:border-b-0">VOLTAR</button>
              </div>
           </div>
        </div>
      )}

      {/* HUD Inferior: Suas Cartas e Controles */}
      <div className="w-full max-w-5xl z-20 pb-4 px-2 relative">
        {selectedCardsIds.length > 0 && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50">
            <button onClick={confirmPlay} className="bg-yellow-500 px-12 py-3 rounded-2xl border-b-6 border-yellow-800 font-black clash-text italic text-xl uppercase text-black active:translate-y-1 active:border-b-2 shadow-2xl">JOGAR</button>
          </div>
        )}
        
        {/* Hand container ajustado: altura maior (h-56) e pt-14 para não cortar cartas selecionadas */}
        <div className="flex justify-center -space-x-12 h-56 items-end pb-4 overflow-x-auto no-scrollbar px-10 pt-14">
          {players[0]?.cards.map((card, idx) => (
            <div key={card.instanceId} className="animate-card-fly-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <ClashCard 
                card={card} 
                size="md" 
                selected={selectedCardsIds.includes(card.instanceId)} 
                playable={isCardPlayable(card, discardPile[discardPile.length - 1], currentColor)} 
                onClick={() => toggleSelectCard(card)} 
              />
            </div>
          ))}
        </div>

        <div className="bg-[#1a2b45] rounded-[30px] px-8 py-4 border-t-4 border-blue-400 flex justify-between items-center shadow-2xl mx-auto max-w-lg mt-2">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${turn === 0 ? 'bg-blue-600 border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-blue-900'}`}>👑</div>
            <div className="flex flex-col">
              <span className="text-white/40 text-[8px] font-black uppercase tracking-widest">{turn === 0 ? 'Sua Vez' : 'Aguarde...'}</span>
              <div className="w-32 h-1.5 bg-black/60 rounded-full mt-1 overflow-hidden p-[1px]">
                <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${(timeLeft/10)*100}%` }}></div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => { sounds.playClick(); if (players[0]?.cards.length <= 2) setUnoDeclared(true); }} 
            className={`px-6 py-2 rounded-full font-black clash-text italic transition-all ${unoDeclared ? 'bg-green-600 opacity-60' : 'bg-red-600 animate-pulse active:scale-90 border-b-4 border-red-900'}`}
          >
            UNO!
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameView;
