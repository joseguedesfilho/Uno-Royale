
import React, { useState } from 'react';
import { useGameStore } from './store';
import { GameStatus } from './types';
import MenuView from './components/MenuView';
import GameView from './components/GameView';
import ResultOverlay from './components/ResultOverlay';

const App: React.FC = () => {
  const { gameStatus } = useGameStore();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    setHasStarted(true);
  };

  if (!hasStarted) {
    return (
      <div 
        className="w-full h-screen bg-[#1a2b45] flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-full max-w-sm flex flex-col items-center gap-10">
          <div className="text-9xl animate-bounce">👑</div>
          <h1 className="text-5xl font-black text-white italic clash-text uppercase tracking-tighter">UNO ROYALE</h1>
          <p className="text-blue-300 font-bold uppercase tracking-widest text-[10px] opacity-70">Toque no botão abaixo para entrar</p>
          
          <button 
            onClick={handleStart}
            className="bg-yellow-500 hover:bg-yellow-400 px-16 py-6 rounded-2xl border-b-8 border-yellow-800 text-black font-black text-2xl italic clash-text uppercase tracking-wider transition-all active:translate-y-2 active:border-b-0"
          >
            INICIAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none">
      {gameStatus === GameStatus.MENU && <MenuView />}
      {(gameStatus === GameStatus.BATTLE || gameStatus === GameStatus.VICTORY || gameStatus === GameStatus.DEFEAT) && (
        <>
          <GameView />
          <ResultOverlay />
        </>
      )}
      
      {/* Overlay de Carregamento */}
      {gameStatus === GameStatus.LOADING && (
        <div className="h-full w-full bg-[#0a1422] flex flex-col items-center justify-center text-white">
           <div className="w-16 h-16 border-4 border-blue-400 border-t-white rounded-full animate-spin mb-6"></div>
           <div className="text-xl font-black clash-text italic uppercase opacity-80">CARREGANDO ARENA...</div>
        </div>
      )}
    </div>
  );
};

export default App;
