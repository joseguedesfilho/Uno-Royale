
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGameStore } from '../store.ts';
import { Player, Card, CardColor, CardType, GameStatus } from '../types.ts';
import { createDeck, isCardPlayable, getBotMove, getRandomColor, isValidCombo } from '../logic/gameLogic.ts';
import ClashCard from './ClashCard.tsx';
import { ARENAS, COLORS } from '../constants.tsx';
import { sounds } from '../logic/soundManager.ts';
import { GoogleGenAI } from "@google/genai";

const TurnTimer = memo(({ timeLeft, totalTime, isUrgent }: { timeLeft: number, totalTime: number, isUrgent?: boolean }) => {
  const percentage = (timeLeft / totalTime) * 100;
  const urgent = isUrgent || timeLeft <= 3;
  return (
    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
      <div 
        className={`h-full rounded-full transition-all duration-300 ${urgent ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
});

const GameView: React.FC = () => {
  const { 
    gameStatus,
    currentArenaIndex, 
    setGameStatus, 
    updateTrophies, 
    setLastRewards, 
    profile, 
    isBossBattle, 
    isRanked,
    activeRoom,
    selectedOpponent
  } = useGameStore();
  
  const arena = ARENAS[currentArenaIndex];
  const turnTimeLimit = activeRoom?.timePerTurn || 10;
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<(Player & { emote?: string, emoteTime?: number })[]>([]);
  const [turn, setTurn] = useState(0);
  const [direction, setDirection] = useState(1); 
  const [currentColor, setCurrentColor] = useState<CardColor>('Vermelho');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  
  const [selectedCardsIds, setSelectedCardsIds] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [pendingCards, setPendingCards] = useState<Card[] | null>(null);
  const [freezeOverlay, setFreezeOverlay] = useState(false);
  const [rageEffect, setRageEffect] = useState(false);
  const [kingCommentary, setKingCommentary] = useState<{id: number, text: string} | null>(null);
  const [timeLeft, setTimeLeft] = useState(turnTimeLimit);
  const [unoDeclared, setUnoDeclared] = useState(false);

  const commentaryTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerKingCommentary = async (eventContext: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Você é o Rei Narrador de uma arena real. Comente brevemente: "${eventContext}". Use 2 ou 3 palavras épicas e medievais. Sem aspas.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const text = response.text?.trim().toUpperCase() || "PODER REAL!";
      setKingCommentary({ id: Date.now(), text });
      if (commentaryTimeoutRef.current) clearTimeout(commentaryTimeoutRef.current);
      commentaryTimeoutRef.current = setTimeout(() => setKingCommentary(null), 3500);
    } catch (e) { }
  };

  useEffect(() => {
    sounds.startBGM();
    if (!profile) return;
    const fullDeck = createDeck(profile.activeDeck);
    const botCount = activeRoom ? (activeRoom.maxPlayers - 1) : (isBossBattle ? 1 : arena.bots);
    const initialPlayers: any[] = [{ id: 'player', name: 'Você', isBot: false, cards: [], avatar: '👑' }];
    
    const initialBotHandSize = currentArenaIndex === 0 ? 4 : 7;

    if (isRanked && selectedOpponent) {
      initialPlayers.push({ id: selectedOpponent.id, name: selectedOpponent.name, isBot: true, cards: [], avatar: selectedOpponent.avatar });
    } else {
      for (let i = 0; i < botCount; i++) {
        initialPlayers.push({ id: `bot-${i}`, name: isBossBattle ? 'Mestre' : `Rival ${i + 1}`, isBot: true, cards: [], avatar: isBossBattle ? '👹' : '🤖' });
      }
    }

    const dealtPlayers = initialPlayers.map((p, idx) => ({ 
      ...p, 
      cards: fullDeck.splice(0, idx === 0 ? 7 : initialBotHandSize) 
    }));
    
    const firstCard = fullDeck.pop()!;
    setDeck(fullDeck);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color === 'Especial' ? getRandomColor() : firstCard.color);
    setPlayers(dealtPlayers);

    return () => {
      sounds.stopBGM();
      if (commentaryTimeoutRef.current) clearTimeout(commentaryTimeoutRef.current);
    };
  }, []);

  const sendEmote = (emote: string, playerIdx: number) => {
    setPlayers(prev => prev.map((p, i) => i === playerIdx ? { ...p, emote, emoteTime: Date.now() } : p));
    setTimeout(() => {
      setPlayers(prev => prev.map((p, i) => i === playerIdx && p.emote === emote ? { ...p, emote: undefined } : p));
    }, 3000);
  };

  const nextTurn = useCallback((skipCount = 1) => {
    setPlayers(currentPlayers => {
      if (currentPlayers.length === 0) return currentPlayers;
      
      let finalDirection = direction;
      if (currentArenaIndex === 6 && Math.random() < 0.15) {
        finalDirection *= -1;
        setDirection(finalDirection);
        triggerKingCommentary("Destino Trocado!");
      }

      setTurn(prev => (prev + (skipCount * finalDirection) + currentPlayers.length) % currentPlayers.length);
      return currentPlayers;
    });
    setSelectedCardsIds([]);
    setUnoDeclared(false);
    
    if (rageEffect) {
       setTimeLeft(3); 
       setRageEffect(false);
    } else {
       setTimeLeft(turnTimeLimit);
    }
  }, [direction, turnTimeLimit, currentArenaIndex, rageEffect]);

  const drawCard = useCallback((playerIndex: number, count = 1) => {
    let cardsToDraw: Card[] = [];
    sounds.playCardPlay();
    if (playerIndex === 0) triggerKingCommentary("Reforço Real!");
    
    setDeck(prevDeck => {
      const newDeck = [...prevDeck];
      cardsToDraw = newDeck.splice(0, count);
      return newDeck.length === 0 && profile ? createDeck(profile.activeDeck) : newDeck;
    });
    setPlayers(prevPlayers => prevPlayers.map((p, idx) => idx === playerIndex ? { ...p, cards: [...p.cards, ...cardsToDraw] } : p));
  }, [profile]);

  const executePlay = useCallback((playerIndex: number, cards: Card[], chosenColor?: CardColor) => {
    setIsProcessing(true);
    sounds.playCardPlay();
    
    const topCardBefore = discardPile[discardPile.length - 1];
    let cardsToExecute = [...cards];

    // HABILIDADE ESPELHO: Se for a carta Mirror, ela copia a anterior
    if (cardsToExecute.length === 1 && cardsToExecute[0].id === 'spell-mirror') {
       const mirror = { ...cardsToExecute[0] };
       mirror.type = topCardBefore.type;
       mirror.value = topCardBefore.value;
       mirror.label = `Espelho de ${topCardBefore.label}`;
       cardsToExecute = [mirror];
       triggerKingCommentary("Espelho Real!");
    }

    // A ÚLTIMA CARTA jogada vira a nova referência da mesa
    const lastCard = cardsToExecute[cardsToExecute.length - 1];

    setPlayers(prevPlayers => {
      const updatedPlayers = prevPlayers.map((p, idx) => {
        if (idx === playerIndex) {
          const newHand = p.cards.filter(c => !cards.some(played => played.instanceId === c.instanceId));
          if (playerIndex === 0 && newHand.length === 1 && !unoDeclared) {
             setTimeout(() => { drawCard(0, 2); triggerKingCommentary("Esqueceu o Grito!"); }, 400);
          }
          return { ...p, cards: newHand };
        }
        return p;
      });

      let skip = 1;
      let colorToSet: CardColor = lastCard.color === 'Especial' ? (chosenColor || getRandomColor()) : lastCard.color;

      // Efeitos baseados na ÚLTIMA CARTA do combo
      if (lastCard.type === CardType.SKIP) { 
        sounds.playFreeze(); 
        setFreezeOverlay(true); 
        setTimeout(() => setFreezeOverlay(false), 800); 
        skip = 2; 
      }
      else if (lastCard.type === CardType.REVERSE) { 
        setDirection(prev => prev * -1); 
      }
      else if (lastCard.type === CardType.DRAW4) { 
        const vIdx = (playerIndex + (1 * direction) + updatedPlayers.length) % updatedPlayers.length; 
        setTimeout(() => drawCard(vIdx, 4), 500); 
        setRageEffect(true); 
        skip = 2; 
        triggerKingCommentary("Pânico Total!");
      }
      else if (lastCard.type === CardType.DRAW2) {
        const vIdx = (playerIndex + (1 * direction) + updatedPlayers.length) % updatedPlayers.length; 
        setTimeout(() => drawCard(vIdx, 2), 500); 
      }

      setDiscardPile(prev => [...prev, ...cardsToExecute]);
      setCurrentColor(colorToSet);

      if (updatedPlayers[playerIndex].cards.length === 0) {
        setTimeout(() => {
           if (profile) setLastRewards({ gold: isBossBattle ? 1000 : 200, gems: isBossBattle ? 50 : 5, bonus: 0, chestAcquired: true });
           setGameStatus(playerIndex === 0 ? GameStatus.VICTORY : GameStatus.DEFEAT);
           updateTrophies(playerIndex === 0 ? 30 : -15);
        }, 500);
      } else {
        setTimeout(() => { setIsProcessing(false); nextTurn(skip); }, 600);
      }
      return updatedPlayers;
    });
  }, [profile, isBossBattle, direction, unoDeclared, drawCard, nextTurn, setGameStatus, updateTrophies, currentArenaIndex, discardPile]);

  useEffect(() => {
    if (players[turn]?.isBot && !isProcessing && !showColorPicker && discardPile.length > 0) {
      const moves = getBotMove(players[turn].cards, discardPile[discardPile.length - 1], currentColor);
      
      if (Math.random() < 0.1) {
        const botEmotes = ['😂', '😠', '👍', '😭'];
        sendEmote(botEmotes[Math.floor(Math.random()*4)], turn);
      }

      setTimeout(() => {
        if (moves.length > 0) executePlay(turn, moves);
        else { drawCard(turn, 1); nextTurn(); }
      }, 1200);
    }
  }, [turn, isProcessing, currentColor, discardPile, players, showColorPicker, executePlay, drawCard, nextTurn]);

  useEffect(() => {
    if (timeLeft > 0 && !isProcessing && gameStatus === GameStatus.BATTLE) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && turn === 0) {
      drawCard(0, 1);
      nextTurn();
    }
  }, [timeLeft, turn, isProcessing, gameStatus, drawCard, nextTurn]);

  const getCardPosition = (index: number, total: number, isSelected: boolean) => {
    const mid = (total - 1) / 2;
    const diff = index - mid;
    if (isSelected) return { transform: 'translateY(-180px) scale(1.15) rotate(0deg)', zIndex: 1000 };
    const baseSpread = isLandscape ? 45 : 35;
    const squeezingFactor = total > 7 ? (8 / total) : 1;
    const dynamicSpread = baseSpread * squeezingFactor;
    const rotation = diff * (isLandscape ? 22 : 15) / (mid || 1);
    const translateY = Math.pow(Math.abs(diff), 2) * (isLandscape ? 2.0 : 1.6);
    const translateX = diff * dynamicSpread;
    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
      zIndex: 100 + index
    };
  };

  const topDiscardCard = discardPile[discardPile.length - 1];

  return (
    <div className={`h-screen w-full ${arena.bgColor} relative flex flex-col items-center justify-between overflow-hidden select-none`}>
      {freezeOverlay && <div className="absolute inset-0 z-[200] bg-cyan-400/10 backdrop-blur-[2px] pointer-events-none transition-all duration-700"></div>}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
        {kingCommentary && (
          <div key={kingCommentary.id} className="animate-king-whisper text-center px-4">
             <span className="text-5xl sm:text-7xl font-black clash-text italic uppercase text-white drop-shadow-[0_0_20px_rgba(0,0,0,1)] tracking-tighter">
                {kingCommentary.text}
             </span>
          </div>
        )}
      </div>

      <div className="w-full flex justify-between items-start px-6 pt-8 z-[300] shrink-0 landscape:pt-4">
        <button onClick={() => setGameStatus(GameStatus.MENU)} className="w-12 h-12 bg-black/70 rounded-2xl border-2 border-white/10 flex items-center justify-center text-xl shadow-2xl active:scale-90 transition-transform">🚪</button>
        <div className="flex gap-6 sm:gap-12">
          {players.slice(1).map((bot, idx) => (
            <div key={bot.id} className={`flex flex-col items-center transition-all relative ${turn === idx + 1 ? 'scale-110' : 'opacity-40 grayscale'}`}>
              {bot.emote && (
                <div className="absolute -top-12 bg-white rounded-2xl px-3 py-1 text-2xl shadow-xl animate-bounce z-50">
                  {bot.emote}
                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
                </div>
              )}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white/20 bg-gray-900 flex items-center justify-center text-2xl shadow-xl relative">
                {bot.avatar}
                {turn === idx + 1 && <div className="absolute -inset-1 rounded-full border-2 border-yellow-400 animate-ping"></div>}
              </div>
              <div className="mt-1 bg-black/80 px-2 py-0.5 rounded-full border border-white/10"><span className="text-white text-[10px] font-black">{bot.cards.length}</span></div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => setShowEmotePicker(!showEmotePicker)} 
          className="w-12 h-12 bg-blue-600/80 rounded-2xl border-2 border-white/10 flex items-center justify-center text-xl shadow-2xl active:scale-90 transition-transform"
        >
          💬
        </button>
      </div>

      {showEmotePicker && (
         <div className="absolute top-24 right-6 grid grid-cols-2 gap-2 bg-black/80 p-3 rounded-3xl border border-white/10 z-[600] animate-in zoom-in duration-200">
            {['😂', '😠', '👍', '😭'].map(e => (
               <button key={e} onClick={() => { sendEmote(e, 0); setShowEmotePicker(false); }} className="w-12 h-12 flex items-center justify-center text-2xl hover:scale-125 transition-transform">{e}</button>
            ))}
         </div>
      )}

      <div className="flex-1 w-full flex items-center justify-center relative z-10 scale-90 sm:scale-100 landscape:scale-75">
         <div className="flex items-center gap-12 sm:gap-24">
            <div onClick={() => turn === 0 && !isProcessing && drawCard(0, 1) && nextTurn()} className={`relative group ${turn === 0 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-40 pointer-events-none'} transition-all`}>
               <ClashCard card={{} as any} hidden size="md" />
               {turn === 0 && <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black animate-bounce text-white shadow-lg">COMPRAR</div>}
            </div>
            
            <div className={`relative ${currentColor === 'Vermelho' ? 'glow-red' : currentColor === 'Azul' ? 'glow-blue' : currentColor === 'Amarelo' ? 'glow-yellow' : 'glow-green'} rounded-[40px] p-2 transition-all duration-700`}>
              {topDiscardCard && <div className="drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"><ClashCard card={topDiscardCard} size="lg" /></div>}
              <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-8 py-1.5 rounded-full border-2 border-white/30 shadow-2xl z-20 transition-colors duration-500 ${currentColor === 'Vermelho' ? 'bg-red-600' : currentColor === 'Azul' ? 'bg-blue-600' : currentColor === 'Amarelo' ? 'bg-yellow-500' : 'bg-green-600'}`}>
                <span className="text-[10px] font-black italic uppercase text-white tracking-widest">{currentColor}</span>
              </div>
            </div>
         </div>
      </div>

      <div className="w-full h-[35vh] sm:h-[40vh] relative flex flex-col items-center justify-end overflow-visible z-[400] pb-6">
        {players[0]?.emote && (
          <div className="absolute top-[-40px] bg-white rounded-2xl px-6 py-2 text-3xl shadow-2xl animate-bounce z-[700]">
             {players[0].emote}
             <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
          </div>
        )}

        {selectedCardsIds.length > 0 && turn === 0 && (
          <div className="absolute top-0 flex justify-center w-full z-[1200] px-6 pointer-events-none">
            <button 
              onClick={() => {
                const playerHand = players[0].cards;
                const selected = selectedCardsIds.map(id => playerHand.find(c => c.instanceId === id)!).filter(Boolean);
                if (selected.length > 0 && isValidCombo(selected, topDiscardCard, currentColor, turn === 0)) {
                  const lastInCombo = selected[selected.length - 1];
                  if (lastInCombo.color === 'Especial' && lastInCombo.type === CardType.DRAW4) { setPendingCards(selected); setShowColorPicker(true); }
                  else if (lastInCombo.color === 'Especial' && lastInCombo.type === CardType.WILD) { setPendingCards(selected); setShowColorPicker(true); }
                  else executePlay(0, selected);
                }
              }} 
              className="pointer-events-auto bg-yellow-400 px-20 py-4 rounded-[50px] border-b-[6px] border-yellow-800 font-black clash-text italic text-2xl uppercase text-black active:translate-y-1 active:border-b-0 shadow-2xl animate-in zoom-in duration-300 w-full max-w-sm"
            >
              JOGAR!
            </button>
          </div>
        )}

        <div className="relative w-full h-[180px] flex items-center justify-center overflow-visible mb-16">
           {players[0]?.cards.map((card, i) => {
              const isSelected = selectedCardsIds.includes(card.instanceId);
              const isPlayable = isCardPlayable(card, topDiscardCard, currentColor);
              const total = players[0].cards.length;
              const pos = getCardPosition(i, total, isSelected);
              return (
                <div key={card.instanceId} className="absolute bottom-0 transition-all duration-300 transform-gpu cursor-pointer" style={{ ...pos }} onClick={() => { sounds.playClick(); setSelectedCardsIds(prev => prev.includes(card.instanceId) ? prev.filter(id => id !== card.instanceId) : [...prev, card.instanceId]); }}>
                  <ClashCard card={card} size={isLandscape ? "md" : "sm"} selected={isSelected} playable={isPlayable} />
                </div>
              );
           })}
        </div>

        <div className="w-full max-w-4xl px-4 flex justify-between items-center z-[1100] landscape:px-12">
           <div className="flex items-center gap-4 bg-black/90 backdrop-blur-2xl rounded-[40px] p-4 border border-white/10 shadow-2xl flex-1 max-w-[360px]">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl border-2 border-white/10 shadow-lg">👑</div>
              <div className="flex flex-col flex-1 overflow-hidden">
                 <span className={`text-[10px] font-black uppercase tracking-widest truncate ${turn === 0 ? 'text-yellow-400' : 'text-white/30'}`}>
                   {turn === 0 ? 'SUA VEZ!' : 'RIVAL JOGANDO...'}
                 </span>
                 <TurnTimer timeLeft={timeLeft} totalTime={turnTimeLimit} isUrgent={timeLeft <= 3} />
              </div>
           </div>

           <button 
             onClick={() => { 
                sounds.playClick(); 
                if(players[0]?.cards.length <= 2) {
                  setUnoDeclared(true);
                  triggerKingCommentary("Grito de Guerra!");
                }
             }} 
             className={`ml-4 px-12 py-5 rounded-[35px] font-black clash-text italic text-xl transition-all shadow-2xl transform active:scale-95 ${unoDeclared ? 'bg-green-500 border-b-[8px] border-green-900 scale-105' : 'bg-red-600 border-b-[8px] border-red-900'}`}
           >
             UNO!
           </button>
        </div>
      </div>

      {showColorPicker && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-gradient-to-b from-[#1a2b45] to-[#0b1421] w-full max-w-sm p-12 rounded-[70px] border-4 border-yellow-400 flex flex-col items-center gap-10 shadow-[0_0_150px_rgba(0,0,0,1)]">
             <span className="text-white font-black text-2xl uppercase italic tracking-widest text-center">DOMÍNIO REAL</span>
             <div className="grid grid-cols-2 gap-8 w-full">
                {COLORS.map(c => (
                   <button key={c} onClick={() => { if(pendingCards) executePlay(0, pendingCards, c); setShowColorPicker(false); triggerKingCommentary(`Reino ${c}!`); }} className={`h-24 rounded-[40px] border-4 border-white/10 active:scale-90 transition-all shadow-xl ${c === 'Vermelho' ? 'bg-red-600' : c === 'Azul' ? 'bg-blue-600' : c === 'Amarelo' ? 'bg-yellow-400' : 'bg-green-600'}`} />
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
