
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store.ts';
import { GameStatus, GameRoom } from '../types.ts';
import { sounds } from '../logic/soundManager.ts';
import { GoogleGenAI, Type } from "@google/genai";

const LobbyView: React.FC = () => {
  const { 
    gameStatus,
    setGameStatus, 
    profile, 
    activeRoom,
    availableRooms, 
    fetchRooms,
    createRoom,
    updateRoom,
    joinRoom
  } = useGameStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBet, setSelectedBet] = useState(10);
  const [selectedPlayers, setSelectedPlayers] = useState(2);
  const [selectedTime, setSelectedTime] = useState(10);
  const [arenaName, setArenaName] = useState('Arena Royale');
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  useEffect(() => {
     if (activeRoom && gameStatus === GameStatus.LOBBY) {
        setArenaName(activeRoom.arenaName);
        setSelectedBet(activeRoom.betAmount);
        setSelectedPlayers(activeRoom.maxPlayers);
        setSelectedTime(activeRoom.timePerTurn);
        setIsEditing(true);
        setShowCreateModal(true);
     }
  }, [activeRoom, gameStatus]);

  const generateArenaName = async () => {
    setIsGeneratingName(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = "Gere 3 nomes épicos de arenas para um jogo de cartas Royale. Retorne apenas os nomes em um array JSON: ['nome1', 'nome2', 'nome3'].";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { names: { type: Type.ARRAY, items: { type: Type.STRING } } },
            required: ["names"]
          }
        }
      });
      const names = JSON.parse(response.text).names;
      setArenaName(names[Math.floor(Math.random() * names.length)]);
    } catch (e) {
      setArenaName('Arena do Desafio');
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleBack = () => {
    sounds.playClick();
    setGameStatus(GameStatus.MENU);
  };

  const handleAction = () => {
    sounds.playClick();
    if (isEditing) {
       updateRoom({
         betAmount: selectedBet,
         maxPlayers: selectedPlayers,
         timePerTurn: selectedTime,
         arenaName: arenaName
       });
       setGameStatus(GameStatus.ROOM_WAITING);
    } else {
       if (profile.gems < selectedBet) return;
       createRoom({
         betAmount: selectedBet,
         maxPlayers: selectedPlayers,
         timePerTurn: selectedTime,
         arenaName: arenaName
       });
    }
    setShowCreateModal(false);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    if (isEditing) setGameStatus(GameStatus.ROOM_WAITING);
    setIsEditing(false);
  };

  return (
    <div className="h-screen w-full bg-[#0b1421] flex flex-col text-white animate-in fade-in duration-500 overflow-hidden">
      <div className="px-6 py-6 bg-gradient-to-b from-[#1a2b45] to-[#0b1421] border-b-4 border-black/60 shadow-2xl relative shrink-0">
        <div className="flex items-center justify-between mb-1">
           <button onClick={handleBack} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform">🔙</button>
           <div className="text-center">
             <h2 className="text-2xl font-black clash-text italic uppercase tracking-tighter text-white leading-none drop-shadow-lg">SALÃO DE CONTRATOS</h2>
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic mt-1 block">ESCOLHA SUA MESA</span>
           </div>
           <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
           <span className="text-[9px] font-black text-white/30 uppercase italic tracking-widest">Mesas Disponíveis</span>
           <div className="bg-black/60 rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
              <span className="text-emerald-400 font-black text-xs">{profile.gems}</span>
              <span className="text-xs">💎</span>
           </div>
        </div>

        {availableRooms.length > 0 ? availableRooms.map((room) => (
          <div key={room.id} className="relative bg-black/40 rounded-[35px] border-2 border-white/5 p-5 flex flex-col gap-3 shadow-xl transition-all">
             <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-lg font-black clash-text italic uppercase text-white tracking-tight leading-tight">{room.arenaName}</h3>
                   <span className="text-[10px] font-bold text-blue-300/60 uppercase">Dono: {room.creatorName}</span>
                </div>
                <div className="bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-2 shrink-0">
                   <span className="text-emerald-400 font-black text-xs">{room.betAmount}</span>
                   <span className="text-xs">💎</span>
                </div>
             </div>

             <div className="flex gap-2">
                <div className="flex-1 bg-black/40 rounded-xl p-2 flex flex-col items-center">
                   <span className="text-[7px] font-black text-white/30 uppercase mb-0.5">JOGS</span>
                   <span className="text-xs font-black italic">{room.currentPlayers}/{room.maxPlayers}</span>
                </div>
                <div className="flex-1 bg-black/40 rounded-xl p-2 flex flex-col items-center">
                   <span className="text-[7px] font-black text-white/30 uppercase mb-0.5">TEMPO</span>
                   <span className="text-xs font-black italic">{room.timePerTurn}s</span>
                </div>
                <div className="flex-1 bg-black/40 rounded-xl p-2 flex flex-col items-center">
                   <span className="text-[7px] font-black text-white/30 uppercase mb-0.5">POTE</span>
                   <span className="text-xs font-black text-yellow-400 italic">{(room.betAmount * room.maxPlayers)} 💎</span>
                </div>
             </div>

             <button 
               onClick={() => joinRoom(room)}
               disabled={profile.gems < room.betAmount}
               className="w-full py-3 bg-blue-600 border-b-4 border-blue-900 rounded-xl font-black clash-text italic text-xs uppercase active:translate-y-1 active:border-b-0 disabled:grayscale disabled:opacity-40"
             >
               ASSINAR CONTRATO
             </button>
          </div>
        )) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-4 min-h-[200px]">
             <div className="text-6xl">🌫️</div>
             <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma mesa aberta</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-[#0b1421] border-t-4 border-black/80 shrink-0">
        <button 
          onClick={() => { sounds.playClick(); setShowCreateModal(true); setIsEditing(false); generateArenaName(); }}
          className="w-full py-4 bg-yellow-500 border-b-6 border-yellow-800 rounded-2xl font-black clash-text italic text-lg uppercase text-black active:translate-y-1 active:border-b-0 shadow-2xl flex items-center justify-center gap-3"
        >
          <span>CRIAR NOVA MESA</span>
          <span className="text-xl">📜</span>
        </button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           <div className="bg-gradient-to-b from-[#1a2b45] to-[#0b1421] w-full max-w-sm max-h-[90vh] rounded-[40px] sm:rounded-[50px] border-4 border-yellow-400 p-6 sm:p-8 flex flex-col text-white shadow-2xl relative overflow-hidden">
              <button onClick={closeModal} className="absolute top-4 right-6 text-2xl font-black opacity-40 hover:opacity-100 transition-opacity z-20">✕</button>
              
              <div className="text-center mb-4 shrink-0">
                 <h2 className="text-2xl sm:text-3xl font-black clash-text italic uppercase tracking-tighter text-white drop-shadow-lg border-b-2 border-white/5 pb-2">
                   {isEditing ? 'Ajustar Contrato' : 'Novo Contrato'}
                 </h2>
                 <p className="text-[9px] font-bold uppercase mt-2 tracking-widest text-blue-400 italic">Termos de Batalha Real</p>
              </div>

              <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-1 pr-2 no-scrollbar py-2">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-white/40">Nome da Arena</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={arenaName} 
                        onChange={(e) => setArenaName(e.target.value)}
                        className="flex-1 bg-black/40 border-2 border-white/10 rounded-xl p-3 font-black italic text-xs outline-none focus:border-blue-400 transition-all text-white" 
                      />
                      <button onClick={generateArenaName} disabled={isGeneratingName} className="bg-blue-600 border-b-4 border-blue-900 text-white px-3 rounded-xl flex items-center justify-center active:translate-y-1 active:border-b-0">
                        {isGeneratingName ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '🔄'}
                      </button>
                    </div>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-white/40">Desafiantes (Máx: 4)</label>
                    <div className="flex gap-2">
                       {[2, 3, 4].map(n => (
                         <button 
                           key={n} 
                           onClick={() => setSelectedPlayers(n)}
                           className={`flex-1 py-3 rounded-xl border-2 font-black italic text-[10px] transition-all ${selectedPlayers === n ? 'bg-blue-600 border-yellow-400 text-white' : 'bg-black/40 border-white/10 text-white/40'}`}
                         >
                           {n} JOGS
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-white/40">Tempo por Turno</label>
                    <div className="flex gap-2">
                       {[5, 10, 20].map(s => (
                         <button 
                           key={s} 
                           onClick={() => setSelectedTime(s)}
                           className={`flex-1 py-3 rounded-xl border-2 font-black italic text-[10px] transition-all ${selectedTime === s ? 'bg-blue-600 border-yellow-400 text-white' : 'bg-black/40 border-white/10 text-white/40'}`}
                         >
                           {s}s
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1 text-white/40">Aposta de Gemas</label>
                    <div className="grid grid-cols-2 gap-2">
                       {[10, 50, 100, 500].map(gem => (
                         <button 
                           key={gem} 
                           onClick={() => setSelectedBet(gem)}
                           disabled={profile.gems < gem && !isEditing}
                           className={`py-3 rounded-xl border-2 font-black italic text-[10px] transition-all flex items-center justify-center gap-1 disabled:opacity-20 ${selectedBet === gem ? 'bg-emerald-600 border-yellow-400 text-white' : 'bg-black/40 border-white/10 text-white/40'}`}
                         >
                           {gem} 💎
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
                 <div className="mb-4 text-center bg-black/40 px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                    <span className="text-[8px] font-black uppercase text-white/40 italic tracking-widest leading-none">POTE ESTIMADO:</span>
                    <div className="text-xl font-black italic text-yellow-400">{(selectedBet * selectedPlayers)} 💎</div>
                 </div>
                 <button 
                    onClick={handleAction}
                    className="w-full py-4 bg-yellow-500 rounded-2xl border-b-6 border-yellow-800 font-black clash-text italic text-lg uppercase text-black active:translate-y-1 active:border-b-0 shadow-lg"
                 >
                    {isEditing ? 'ATUALIZAR' : 'LACRAR CONTRATO'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LobbyView;
