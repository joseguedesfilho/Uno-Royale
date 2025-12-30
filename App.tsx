
import React, { useState, useEffect } from 'react';
import { useGameStore } from './store.ts';
import { GameStatus } from './types.ts';
import MenuView from './components/MenuView.tsx';
import GameView from './components/GameView.tsx';
import TrophyRoadView from './components/TrophyRoadView.tsx';
import ArenaSelectionView from './components/ArenaSelectionView.tsx';
import ResultOverlay from './components/ResultOverlay.tsx';
import LobbyView from './components/LobbyView.tsx';
import AuthView from './components/AuthView.tsx';
import RoomWaitingView from './components/RoomWaitingView.tsx';
import LeaderboardView from './components/LeaderboardView.tsx';

const App: React.FC = () => {
  const { gameStatus, profile, session, initialize, signOut } = useGameStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initialize();
      } catch (err) {
        console.error("Erro fatal durante a inicialização:", err);
      } finally {
        setTimeout(() => setIsInitializing(false), 800);
      }
    };
    
    initApp();
  }, [initialize]);

  if (isInitializing || (session && !profile)) {
    return (
      <div className="w-full h-screen bg-[#0b1421] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-12">
           <div className="w-20 h-20 border-8 border-blue-900 border-t-blue-400 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center text-2xl">👑</div>
        </div>
        <div className="text-white font-black clash-text italic uppercase tracking-tighter text-2xl mb-2 drop-shadow-lg">Uno Royale</div>
        <div className="text-blue-300 font-bold uppercase tracking-widest text-[10px] opacity-60 animate-pulse">Entrando na Arena...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none">
      {gameStatus === GameStatus.MENU && <MenuView />}
      {gameStatus === GameStatus.TROPHY_ROAD && <TrophyRoadView />}
      {gameStatus === GameStatus.ARENA_SELECTION && <ArenaSelectionView />}
      {gameStatus === GameStatus.LOBBY && <LobbyView />}
      {gameStatus === GameStatus.ROOM_WAITING && <RoomWaitingView />}
      {gameStatus === GameStatus.LEADERBOARD && <LeaderboardView />}
      {(gameStatus === GameStatus.BATTLE || gameStatus === GameStatus.VICTORY || gameStatus === GameStatus.DEFEAT) && (
        <>
          <GameView />
          <ResultOverlay />
        </>
      )}
      
      {gameStatus === GameStatus.LOADING && (
        <div className="h-full w-full bg-[#0a1422] flex flex-col items-center justify-center text-white p-6">
           <div className="w-16 h-16 border-4 border-blue-400 border-t-white rounded-full animate-spin mb-6"></div>
           <div className="text-xl font-black clash-text italic uppercase tracking-tighter opacity-80">Preparando Batalha...</div>
        </div>
      )}
    </div>
  );
};

export default App;
