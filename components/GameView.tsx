
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGameStore } from '../store.ts';
import { Player, Card, CardColor, CardType, GameStatus } from '../types.ts';
import { createDeck, isCardPlayable, getBotMove, getRandomColor, isValidCombo } from '../logic/gameLogic.ts';
import ClashCard from './ClashCard.tsx';
import { ARENAS, COLORS, ALL_CARDS } from '../constants.tsx';
import { sounds } from '../logic/soundManager.ts';

// Timer component separate to prevent parent re-renders
const TurnTimer = memo(({ timeLeft, totalTime }: { timeLeft: number, totalTime: number }) => {
  const percentage = (timeLeft / totalTime) * 100;
  return (
    <div className="w-32 h-1.5 bg-black/60 rounded-full mt-1 overflow-hidden p-[1px] border border-white/5">
      <div 
        className="h-full bg-blue-400 rounded-full transition-all duration-300" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
});

const GameView: React.FC = () => {
  const { 
    currentArenaIndex, 
    setGameStatus, 
    updateTrophies, 
    setLastRewards, 
    profile, 
    isBossBattle, 
    isRanked,
    activeRoom,
    selectedOpponent,
    quitGame 
  } = useGameStore();
  
  const arena = ARENAS[currentArenaIndex];
  const turnTimeLimit = activeRoom?.timePerTurn || 10;
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [direction, setDirection] = useState(1); 
  const [currentColor, setCurrentColor] = useState<CardColor>('Vermelho');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedCardsIds, setSelectedCardsIds] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCards, setPendingCards] = useState<Card[] | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [freezeOverlay, setFreezeOverlay] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const [timeLeft, setTimeLeft] = useState(turnTimeLimit);
  const [unoDeclared, setUnoDeclared] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sounds.startBGM();
    const fullDeck = createDeck(profile.activeDeck);
    const botCount = activeRoom ? (activeRoom.maxPlayers - 1) : (isBossBattle ? 1 : arena.bots);
    
    const initialPlayers: Player[] = [{ id: 'player', name: 'Você', isBot: false, cards: [], avatar: '👑' }];
    
    if (isRanked && selectedOpponent) {
      initialPlayers.push({ id: selectedOpponent.id, name: selectedOpponent.name, isBot: true, cards: [], avatar: selectedOpponent.avatar });
      for (let i = 1; i < botCount; i++) {
        initialPlayers.push({ id: `bot-${i}`, name: `Desafiante ${i+1}`, isBot: true, cards: [], avatar: '🤖' });
      }
    } else if (activeRoom) {
      for (let i = 0; i < botCount; i++) {
        initialPlayers.push({ id: `opponent-${i}`, name: `Rival ${i + 1}`, isBot: true, cards: [], avatar: '🧛‍♂️' });
      }
    } else {
      for (let i = 0; i < botCount; i++) {
        initialPlayers.push({ id: `bot-${i}`, name: isBossBattle ? 'Mestre da Arena' : `Adversário ${i + 1}`, isBot: true, cards: [], avatar: isBossBattle ? '👹' : '🤖', isBoss: isBossBattle });
      }
    }

    const dealtPlayers = initialPlayers.map(p => {
      const initialHandSize = (p.isBoss && arena.bossPower?.includes('4 cartas')) ? 4 : 7;
      return { ...p, cards: fullDeck.splice(0, initialHandSize) };
    });

    const firstCard = fullDeck.pop()!;
    setDeck(fullDeck);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color === 'Especial' ? getRandomColor() : firstCard.color);
    setPlayers(dealtPlayers);

    return () => sounds.stopBGM();
  }, [arena.bots, profile.activeDeck, isBossBattle, arena.bossPower, isRanked, selectedOpponent, activeRoom]);

  const nextTurn = useCallback((skipCount = 1) => {
    setPlayers(currentPlayers => {
      if (currentPlayers.length === 0) return currentPlayers;
      setTurn(prev => (prev + (skipCount * direction) + currentPlayers.length) % currentPlayers.length);
      return currentPlayers;
    });
    setSelectedCardsIds([]);
    setUnoDeclared(false);
    setTimeLeft(turnTimeLimit);
  }, [direction, turnTimeLimit]);

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
  }, [profile.activeDeck]);

  const handleTimeOut = useCallback(() => {
    if (isProcessing) return;
    drawCard(turn, 1);
    nextTurn();
  }, [isProcessing, drawCard, nextTurn, turn]);

  useEffect(() => {
    if (isProcessing || players.length === 0 || showColorPicker || showQuitConfirm) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { 
          setTimeout(handleTimeOut, 0);
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [turn, isProcessing, handleTimeOut, showColorPicker, players.length, showQuitConfirm]);

  const executePlay = useCallback((playerIndex: number, cards: Card[], chosenColor?: CardColor) => {
    setIsProcessing(true);
    sounds.playCardPlay();
    
    setPlayers(prevPlayers => {
      if (!prevPlayers[playerIndex]) return prevPlayers;
      const lastCard = cards[cards.length - 1];

      const updatedPlayers = prevPlayers.map((p, idx) => {
        if (idx === playerIndex) {
          const newHand = p.cards.filter(c => !cards.some(played => played.instanceId === c.instanceId));
          if (playerIndex === 0 && newHand.length === 1 && !unoDeclared) setTimeout(() => drawCard(0, 2), 400);
          return { ...p, cards: newHand };
        }
        return p;
      });

      let skip = 1;
      let colorToSet: CardColor = lastCard.color === 'Especial' ? (chosenColor || getRandomColor()) : lastCard.color;

      if (lastCard.type === CardType.SKIP) { sounds.playFreeze(); setFreezeOverlay(true); setTimeout(() => setFreezeOverlay(false), 800); skip = 2; }
      else if (lastCard.type === CardType.REVERSE) { sounds.playReverse(); setIsShaking(true); setTimeout(() => setIsShaking(false), 500); setDirection(prev => prev * -1); }
      else if (lastCard.type === CardType.DRAW2) { const vIdx = (playerIndex + (1 * direction) + updatedPlayers.length) % updatedPlayers.length; setTimeout(() => drawCard(vIdx, 2), 500); skip = 2; }
      else if (lastCard.type === CardType.DRAW4) { const vIdx = (playerIndex + (1 * direction) + updatedPlayers.length) % updatedPlayers.length; setTimeout(() => drawCard(vIdx, 4), 500); skip = 2; colorToSet = chosenColor || getRandomColor(); }

      setDiscardPile(prev => [...prev, ...cards]);
      setCurrentColor(colorToSet);

      if (updatedPlayers[playerIndex].cards.length === 0) {
        const goldBase = isBossBattle ? 1000 : 200;
        const gems = isBossBattle ? 50 : 5;
        const potWon = activeRoom ? (activeRoom.betAmount * activeRoom.maxPlayers) : 0;
        
        setLastRewards({ gold: goldBase, gems, bonus: 0, chestAcquired: true, potWon });
        if (playerIndex === 0) { sounds.playVictory(); setGameStatus(GameStatus.VICTORY); }
        else { sounds.playDefeat(); setGameStatus(GameStatus.DEFEAT); }
        updateTrophies(playerIndex === 0 ? (isBossBattle ? 100 : 30) : -15);
      } else {
        setTimeout(() => { setIsProcessing(false); nextTurn(skip); }, 600);
      }
      return updatedPlayers;
    });
  }, [setGameStatus, updateTrophies, setLastRewards, nextTurn, drawCard, direction, unoDeclared, isBossBattle, activeRoom]);

  const confirmPlay = () => {
    if (isProcessing || players.length === 0) return;
    const playerHand = players[0].cards;
    const selected = selectedCardsIds.map(id => playerHand.find(c => c.instanceId === id)!).filter(Boolean);
    const topCard = discardPile[discardPile.length - 1];
    if (isValidCombo(selected, topCard, currentColor, turn === 0)) {
       const lastCard = selected[selected.length - 1];
       if (lastCard.color === 'Especial' || lastCard.type === CardType.DRAW4) { setPendingCards(selected); setShowColorPicker(true); } 
       else { executePlay(0, selected); }
    }
  };

  const handleColorPick = (color: CardColor) => {
    sounds.playClick();
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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turn, isProcessing, players, currentColor, discardPile, drawCard, executePlay, nextTurn, showColorPicker, showQuitConfirm, currentArenaIndex]);

  if (players.length === 0) return null;

  const hand = players[0]?.cards || [];
  const dynamicSpacing = hand.length > 6 ? Math.max(-78, -48 - (hand.length - 6) * 2.5) : -48;

  const handleConfirmQuit = () => {
    sounds.playClick();
    quitGame();
  };

  return (
    <div className={`h-screen w-full ${activeRoom ? 'bg-[#0b1421]' : arena.bgColor} relative flex flex-col items-center justify-between overflow-hidden ${isShaking ? 'animate-shake' : ''} will-change-contents`}>
      {freezeOverlay && <div className="absolute inset-0 z-[150] bg-cyan-400/10 pointer-events-none"></div>}
      
      {/* HUD Superior */}
      <div className="w-full flex justify-between items-center px-6 pt-6 z-10">
        <button onClick={() => { sounds.playClick(); setShowQuitConfirm(true); }} className="w-12 h-12 bg-black/40 rounded-2xl border-2 border-white/10 flex items-center justify-center text-xl active:scale-90 transition-transform">🚪</button>
        <div className="flex gap-6">
          {players.slice(1).map((bot, idx) => (
            <div key={bot.id} className={`flex flex-col items-center transition-all ${turn === idx + 1 ? 'scale-110' : 'opacity-40'}`}>
              <div className={`w-12 h-12 rounded-full border-[3px] ${turn === idx + 1 ? 'border-yellow-400 bg-blue-700' : 'border-white/30 bg-gray-800'} flex items-center justify-center text-2xl shadow-lg`}>{bot.avatar}</div>
              <div className="text-white text-[9px] font-black mt-1 bg-black/60 px-2 rounded-full">{bot.cards.length}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-end">
           {activeRoom && (
             <div className="bg-emerald-600/20 border border-emerald-500/40 px-3 py-1 rounded-xl flex items-center gap-2">
                <span className="text-[10px] font-black text-emerald-400">{activeRoom.betAmount * activeRoom.maxPlayers}</span>
                <span className="text-xs">💎</span>
             </div>
           )}
        </div>
      </div>

      {/* Área Central */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full gap-12">
         {activeRoom && <div className="absolute top-10 text-[10px] font-black uppercase tracking-[0.5em] opacity-30 italic">{activeRoom.arenaName}</div>}
         <div className="flex items-center gap-16">
            <div onClick={() => !isProcessing && turn === 0 && !showColorPicker && drawCard(0, 1) && nextTurn()} className={`transition-all active:scale-95 ${turn === 0 ? 'opacity-100 cursor-pointer' : 'opacity-50 pointer-events-none'}`}>
               <ClashCard card={{} as any} hidden size="md" />
            </div>
            <div className="relative">
              <ClashCard card={discardPile[discardPile.length - 1]} size="lg" />
              <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full text-[9px] text-white font-black border-2 border-white/20 uppercase shadow-lg ${currentColor === 'Vermelho' ? 'bg-red-600' : currentColor === 'Azul' ? 'bg-blue-600' : currentColor === 'Amarelo' ? 'bg-yellow-500 text-black' : 'bg-green-600'}`}>{currentColor}</div>
            </div>
         </div>
      </div>

      {/* Modal de Cor */}
      {showColorPicker && (
        <div className="absolute inset-0 z-[500] bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-black/90 p-8 rounded-[40px] border-2 border-white/20 flex flex-col items-center gap-6 shadow-2xl">
             <span className="text-white font-black text-xs uppercase italic tracking-widest opacity-60">Escolha uma Cor</span>
             <div className="flex gap-4">
                {COLORS.map(color => (
                   <button key={color} onClick={() => handleColorPick(color)} className={`w-16 h-16 rounded-2xl border-4 border-white/40 active:scale-90 transition-all ${color === 'Vermelho' ? 'bg-red-600' : color === 'Azul' ? 'bg-blue-600' : color === 'Amarelo' ? 'bg-yellow-400' : 'bg-green-600'}`} />
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Modal de Sair */}
      {showQuitConfirm && (
        <div className="absolute inset-0 z-[600] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-[#1a2b45] w-full max-w-sm rounded-[40px] border-4 border-red-500 p-8 flex flex-col items-center text-center shadow-2xl">
              <div className="text-5xl mb-4">🚪</div>
              <h3 className="text-2xl font-black clash-text italic uppercase text-white mb-2">Abandonar Partida?</h3>
              <p className="text-white/60 text-xs font-bold uppercase mb-8 leading-relaxed">
                {isRanked && !activeRoom ? 'Se você sair agora, perderá 15 troféus como penalidade real.' : 'Tem certeza que deseja encerrar o contrato atual?'}
              </p>
              <div className="w-full flex flex-col gap-3">
                 <button onClick={handleConfirmQuit} className="w-full py-4 bg-red-600 border-b-6 border-red-900 rounded-2xl font-black clash-text italic text-lg uppercase text-white active:translate-y-1 active:border-b-0">SAIR AGORA</button>
                 <button onClick={() => { sounds.playClick(); setShowQuitConfirm(false); }} className="w-full py-3 text-white/40 font-black italic text-[10px] uppercase tracking-widest">CONTINUAR LUTANDO</button>
              </div>
           </div>
        </div>
      )}

      {/* HUD Inferior */}
      <div className="w-full max-w-full z-20 pb-4 px-2 relative">
        {selectedCardsIds.length > 0 && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50">
            <button onClick={confirmPlay} className="bg-yellow-500 px-12 py-3 rounded-2xl border-b-6 border-yellow-800 font-black clash-text italic text-xl uppercase text-black active:translate-y-1 active:border-b-0">JOGAR</button>
          </div>
        )}
        
        <div className="flex justify-center items-end h-64 overflow-x-auto no-scrollbar px-10 pt-16 relative">
          <div className="inline-flex items-end min-w-max">
            {hand.map((card, idx) => (
              <div key={card.instanceId} className="animate-card-fly-in" style={{ animationDelay: `${idx * 30}ms`, marginLeft: idx === 0 ? 0 : `${dynamicSpacing}px`, zIndex: selectedCardsIds.includes(card.instanceId) ? 100 : idx }}>
                <ClashCard card={card} size="md" selected={selectedCardsIds.includes(card.instanceId)} playable={isCardPlayable(card, discardPile[discardPile.length - 1], currentColor)} onClick={() => {
                  sounds.playClick();
                  setSelectedCardsIds(prev => prev.includes(card.instanceId) ? prev.filter(id => id !== card.instanceId) : [...prev, card.instanceId]);
                }} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a2b45] rounded-[30px] px-8 py-4 border-t-4 border-blue-400 flex justify-between items-center shadow-2xl mx-auto max-w-lg mt-2">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${turn === 0 ? 'bg-blue-600 border-2 border-yellow-400' : 'bg-blue-900'}`}>👑</div>
            <div className="flex flex-col">
              <span className="text-white/40 text-[8px] font-black uppercase tracking-widest">{turn === 0 ? 'Sua Vez' : 'Aguarde...'}</span>
              <TurnTimer timeLeft={timeLeft} totalTime={turnTimeLimit} />
            </div>
          </div>
          <button onClick={() => { sounds.playClick(); if (players[0]?.cards.length <= 2) setUnoDeclared(true); }} className={`px-6 py-2 rounded-full font-black clash-text italic transition-all ${unoDeclared ? 'bg-green-600 opacity-60' : 'bg-red-600 border-b-4 border-red-900 active:translate-y-1 active:border-b-0'}`}>UNO!</button>
        </div>
      </div>
    </div>
  );
};

export default GameView;
