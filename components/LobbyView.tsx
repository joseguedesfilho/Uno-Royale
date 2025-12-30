
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store.ts';
import { GameStatus, GameRoom } from '../types.ts';
import { sounds } from '../logic/soundManager.ts';
import { GoogleGenAI, Type } from "@google/genai";

const LobbyView: React.FC = () => {
  const { 
    setGameStatus, 
    profile, 
    availableRooms, 
    fetchRooms,
    createRoom,
    joinRoom
  } = useGameStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBet, setSelectedBet] = useState(10);
  const [selectedPlayers, setSelectedPlayers] = useState(2);
  const [selectedTime, setSelectedTime] = useState(10);
  const [arenaName, setArenaName] = useState('Arena Royale');
  const [isGeneratingName, setIsGeneratingName] = useState(false);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

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

  const handleCreateRoom = () => {
    if (profile.gems < selectedBet) return;
    sounds.playClick();
    createRoom({
      betAmount: selectedBet,
      maxPlayers: selectedPlayers,
      timePerTurn: selectedTime,
      arenaName: arenaName
    });
  };

  return (
    <div className="h-screen w-full bg-[#0b1421] flex flex-col text-white animate-in fade-in duration-500 overflow-hidden">
      {/* Header Estilizado */}
      <div className="px-6 py-8 bg-gradient-to-b from-indigo-900 to-[#0b1421] border-b-4 border-black/60 shadow-2xl relative">
        <div className="flex items-center justify-between mb-2">
           <button onClick={handleBack} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform">🔙</button>
           <div className="text-center">
             <h2 className="text-2xl font-black clash-text italic uppercase tracking-tighter text-white leading-none drop-shadow-lg">SALÃO DE CONTRATOS</h2>
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic mt-1 block">ESCOLHA SUA MESA</span>
           </div>
           <div className="w-10"></div>
        </div>
      </div>

      {/* Lista de Mesas */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center mb-2 px-2">
           <span className="text-[9px] font-black text-white/30 uppercase italic tracking-widest">Mesas Disponíveis</span>
           <div className="flex items-center gap-3">
              <div className="bg-black/60 rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
                <span className="text-emerald-400 font-black text-xs">{profile.gems}</span>
                <span className="text-xs">💎</span>
              </div>
           </div>
        </div>

        {availableRooms.map((room) => (
          <div key={room.id} className="relative bg-black/40 rounded-[35px] border-2 border-white/5 p-6 flex flex-col gap-4 shadow-xl group hover:border-blue-500/50 transition-all">
             <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-lg font-black clash-text italic uppercase text-white tracking-tight">{room.arenaName}</h3>
                   <span className="text-[10px] font-bold text-blue-300/60 uppercase">Dono: {room.creatorName}</span>
                </div>
                <div className="bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 rounded-2xl flex items-center gap-2">
                   <span className="text-emerald-400 font-black text-sm">{room.betAmount}</span>
                   <span className="text-sm">💎</span>
                </div>
             </div>

             <div className="flex gap-4">
                <div className="flex-1 bg-black/40 rounded-2xl p-3 flex flex-col items-center">
                   <span className="text-[8px] font-black text-white/30 uppercase mb-1">JOGADORES</span>
                   <span className="text-xs font-black italic">{room.currentPlayers}/{room.maxPlayers}</span>
                </div>
                <div className="flex-1 bg-black/40 rounded-2xl p-3 flex flex-col items-center">
                   <span className="text-[8px] font-black text-white/30 uppercase mb-1">TEMPO</span>
                   <span className="text-xs font-black italic">{room.timePerTurn}s</span>
                </div>
                <div className="flex-1 bg-black/40 rounded-2xl p-3 flex flex-col items-center">
                   <span className="text-[8px] font-black text-white/30 uppercase mb-1">POTE</span>
                   <span className="text-xs font-black text-yellow-400 italic">{(room.betAmount * room.maxPlayers)} 💎</span>
                </div>
             </div>

             <button 
               onClick={() => joinRoom(room)}
               disabled={profile.gems < room.betAmount}
               className="w-full py-4 bg-blue-600 border-b-6 border-blue-900 rounded-2xl font-black clash-text italic text-sm uppercase active:translate-y-1 active:border-b-0 disabled:grayscale disabled:opacity-40"
             >
               ASSINAR CONTRATO
             </button>
          </div>
        ))}
      </div>

      {/* Botão de Criar no Rodapé */}
      <div className="p-6 bg-[#0b1421] border-t-4 border-black/80">
        <button 
          onClick={() => { sounds.playClick(); setShowCreateModal(true); generateArenaName(); }}
          className="w-full py-5 bg-yellow-500 border-b-8 border-yellow-800 rounded-3xl font-black clash-text italic text-xl uppercase text-black active:translate-y-2 active:border-b-0 shadow-2xl flex items-center justify-center gap-4"
        >
          <span>CRIAR NOVA MESA</span>
          <span className="text-2xl">📜</span>
        </button>
      </div>

      {/* Modal de Criação (Pergaminho de Contrato) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-[#f4e4bc] w-full max-w-sm rounded-[50px] border-8 border-[#8b4513] p-8 flex flex-col text-[#3d2b1f] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-6 text-2xl font-black">✕</button>
              
              <div className="text-center mb-6">
                 <h2 className="text-3xl font-black clash-text italic uppercase tracking-tighter border-b-2 border-[#8b4513]/20 pb-2">Novo Contrato</h2>
                 <p className="text-[10px] font-bold uppercase mt-2 tracking-widest opacity-60 italic">Termos de Batalha Real</p>
              </div>

              <div className="flex flex-col gap-6">
                 {/* Nome da Arena */}
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-2">Nome da Arena</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={arenaName} 
                        onChange={(e) => setArenaName(e.target.value)}
                        className="flex-1 bg-black/10 border-2 border-[#8b4513]/20 rounded-xl p-3 font-black italic text-sm outline-none" 
                      />
                      <button onClick={generateArenaName} disabled={isGeneratingName} className="bg-[#8b4513] text-white w-12 rounded-xl flex items-center justify-center">🔄</button>
                    </div>
                 </div>

                 {/* Seleção de Jogadores */}
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-2">Desafiantes</label>
                    <div className="flex gap-2">
                       {[2, 3, 4].map(n => (
                         <button 
                           key={n} 
                           onClick={() => setSelectedPlayers(n)}
                           className={`flex-1 py-3 rounded-xl border-2 font-black italic text-sm transition-all ${selectedPlayers === n ? 'bg-[#8b4513] text-white border-[#8b4513]' : 'border-[#8b4513]/20'}`}
                         >
                           {n} P
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Seleção de Tempo */}
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-2">Tempo por Turno</label>
                    <div className="flex gap-2">
                       {[5, 10, 20].map(s => (
                         <button 
                           key={s} 
                           onClick={() => setSelectedTime(s)}
                           className={`flex-1 py-3 rounded-xl border-2 font-black italic text-sm transition-all ${selectedTime === s ? 'bg-[#8b4513] text-white border-[#8b4513]' : 'border-[#8b4513]/20'}`}
                         >
                           {s}s
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Seleção de Aposta */}
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-2">Aposta de Gemas</label>
                    <div className="grid grid-cols-2 gap-2">
                       {[10, 50, 100, 500].map(gem => (
                         <button 
                           key={gem} 
                           onClick={() => setSelectedBet(gem)}
                           disabled={profile.gems < gem}
                           className={`py-3 rounded-xl border-2 font-black italic text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-20 ${selectedBet === gem ? 'bg-emerald-700 text-white border-emerald-900' : 'border-[#8b4513]/20'}`}
                         >
                           {gem} 💎
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="mt-10 flex flex-col items-center">
                 <div className="mb-4 text-center">
                    <span className="text-[9px] font-black uppercase opacity-60 italic">PRÊMIO TOTAL DO VENCEDOR:</span>
                    <div className="text-2xl font-black italic text-emerald-800">{(selectedBet * selectedPlayers)} 💎</div>
                 </div>
                 <button 
                    onClick={handleCreateRoom}
                    className="w-full py-5 bg-[#8b4513] rounded-2xl border-b-8 border-[#3d2b1f] font-black clash-text italic text-xl uppercase text-white active:translate-y-2 active:border-b-0 shadow-xl"
                 >
                    LACRAR CONTRATO
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LobbyView;
