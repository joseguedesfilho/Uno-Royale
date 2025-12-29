
import React from 'react';
import { useGameStore } from './store';
import { GameStatus } from './types';
import MenuView from './components/MenuView';
import GameView from './components/GameView';
import ResultOverlay from './components/ResultOverlay';

const App: React.FC = () => {
  const { gameStatus } = useGameStore();

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none">
      {gameStatus === GameStatus.MENU && <MenuView />}
      {(gameStatus === GameStatus.BATTLE || gameStatus === GameStatus.VICTORY || gameStatus === GameStatus.DEFEAT) && (
        <>
          <GameView />
          <ResultOverlay />
        </>
      )}
      
      {/* Overlay de Carregamento Universal */}
      {gameStatus === GameStatus.LOADING && (
        <div className="h-full w-full bg-blue-950 flex flex-col items-center justify-center text-white">
           <div className="w-20 h-20 border-8 border-blue-400 border-t-white rounded-full animate-spin mb-6 shadow-2xl"></div>
           <div className="text-2xl font-black clash-text italic uppercase">PREPARANDO ARENA...</div>
        </div>
      )}
    </div>
  );
};

export default App;
