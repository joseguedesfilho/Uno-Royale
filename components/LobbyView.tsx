
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store.ts';
import { GameStatus, LobbyPlayer } from '../types.ts';
import { ALL_CARDS } from '../constants.tsx';
import { sounds } from '../logic/soundManager.ts';
import { GoogleGenAI } from "@google/genai";
import ClashCard from './ClashCard.tsx';

const LobbyView: React.FC = () => {
  const { 
    setGameStatus, 
    profile, 
    lobbyPlayers, 
    setLobbyPlayers 
  } = useGameStore();

  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [invitingPlayerId, setInvitingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    // Simular entrada de jogadores globais para o modo ranqueado
    const mockPlayers: LobbyPlayer[] = [
      { id: 'lp-1', name: 'ReiDoUno77', level: 12, trophies: 2450, avatar: '🧙‍♂️', status: 'Disponível' },
      { id: 'lp-2', name: 'MestreDasCartas', level: 9, trophies: 1820, avatar: '🧝‍♀️', status: 'Disponível' },
      { id: 'lp-3', name: 'LendárioBR', level: 15, trophies: 3100, avatar: '🧛‍♂️', status: 'Em Partida' },
      { id: 'lp-4', name: 'SombraReal', level: 10, trophies: 2100, avatar: '👤', status: 'Disponível' },
    ];
    setLobbyPlayers(mockPlayers);
    fetchQuotes(mockPlayers);
  }, []);

  const fetchQuotes = async (players: LobbyPlayer[]) => {
    setIsLoadingQuotes(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Gere 4 frases curtas e engraçadas de provocação (estilo Clash Royale) para os seguintes jogadores em um lobby global de cartas: ${players.map(p => p.name).join(', ')}. Responda APENAS um array JSON de strings.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const text = response.text || "[]";
      const quotes = JSON.parse(text.replace(/```json|```/g, ''));
      setLobbyPlayers(players.map((p, i) => ({ ...p, quote: quotes[i] || 'Te vejo na arena!' })));
    } catch (e) {
      console.error("Erro ao carregar frases da IA", e);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleBack = () => {
    sounds.playClick();
    setGameStatus(GameStatus.MENU);
  };

  const handleChallenge = (player: LobbyPlayer) => {
    if (player.status !== 'Disponível') return;
    sounds.playClick();
    setInvitingPlayerId(player.id);
    
    setTimeout(() => {
      setGameStatus(GameStatus.LOADING);
      setTimeout(() => {
        setGameStatus(GameStatus.BATTLE);
      }, 1200);
    }, 1500);
  };

  const activeDeckCards = ALL_CARDS.filter(c => profile.activeDeck.includes(c.id));

  return (
    <div className="h-screen w-full bg-[#0b1421] flex flex-col text-white animate-in fade-in duration-500">
      <div className="px-6 py-8 flex flex-col relative overflow-hidden shrink-0 border-b-4 border-black/60 shadow-2xl bg-gradient-to-b from-indigo-900 to-[#0b1421]">
         <div className="relative z-10 flex items-center justify-between mb-6">
           <button onClick={handleBack} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform">🔙</button>
           <div className="text-center">
             <h2 className="text-2xl font-black clash-text italic uppercase tracking-tighter text-white leading-none drop-shadow-lg">LOBBY GLOBAL</h2>
             <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest italic">MODO RANQUEADO ONLINE</span>
             </div>
           </div>
           <div className="w-10"></div>
         </div>

         <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-[30px] p-4 border border-white/5 shadow-inner">
            <div className="flex justify-between items-center mb-3 px-2">
               <span className="text-[9px] font-black text-blue-300 uppercase italic tracking-widest">SEU DECK ATIVO</span>
               <span className="text-yellow-400 font-black italic text-xs">{profile.trophies} 🏆</span>
            </div>
            <div className="flex justify-center -space-x-4">
               {activeDeckCards.map((card) => (
                 <div key={card.id} className="scale-50 -mx-6">
                    <ClashCard card={{...card, instanceId: '', color: card.baseColor}} size="sm" />
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#0b1421]">
        <h3 className="text-[11px] font-black text-white/30 uppercase italic tracking-[0.3em] mb-2">Desafiantes do Ranking</h3>
        
        {lobbyPlayers.map((lp) => (
          <div key={lp.id} className={`relative bg-black/40 rounded-[35px] border-2 p-5 flex items-center justify-between transition-all shadow-xl ${invitingPlayerId === lp.id ? 'border-yellow-400 scale-105 animate-pulse' : 'border-white/5'} ${lp.status === 'Em Partida' ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-900 rounded-2xl flex items-center justify-center text-3xl border-2 border-white/10 shadow-lg">{lp.avatar}</div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <span className="font-black clash-text italic uppercase text-sm tracking-tight">{lp.name}</span>
                   <span className="text-yellow-400 text-xs font-black italic">{lp.trophies} 🏆</span>
                </div>
                {lp.quote && <span className="text-[10px] text-blue-300 font-bold italic opacity-80 mt-1">"{lp.quote}"</span>}
              </div>
            </div>
            <button onClick={() => handleChallenge(lp)} disabled={lp.status !== 'Disponível' || !!invitingPlayerId} className={`px-6 py-3 rounded-2xl border-b-4 font-black clash-text italic text-xs uppercase transition-all active:translate-y-1 active:border-b-0 ${invitingPlayerId === lp.id ? 'bg-yellow-400 border-yellow-700 text-black' : 'bg-blue-600 border-blue-950 text-white'} disabled:grayscale disabled:opacity-40`}>
              {invitingPlayerId === lp.id ? 'CONVIDANDO...' : 'DESAFIAR'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LobbyView;
