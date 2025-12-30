
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store.ts';
import { GameStatus } from '../types.ts';
import { sounds } from '../logic/soundManager.ts';

const LeaderboardView: React.FC = () => {
  const { setGameStatus, leaderboardPlayers, fetchLeaderboard, profile } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchLeaderboard();
      setIsLoading(false);
    };
    loadData();
  }, [fetchLeaderboard]);

  const handleBack = () => {
    sounds.playClick();
    setGameStatus(GameStatus.MENU);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const myRank = leaderboardPlayers.findIndex(p => p.name === profile?.name) + 1;

  return (
    <div className="h-screen w-full bg-[#0b1421] flex flex-col text-white animate-in slide-in-from-right duration-500 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 bg-gradient-to-b from-[#1a2b45] to-[#0b1421] border-b-4 border-black/60 shadow-2xl relative shrink-0 z-20">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform">🔙</button>
          <div className="text-center">
            <h2 className="text-2xl font-black clash-text italic uppercase tracking-tighter text-white leading-none drop-shadow-lg">CLASSIFICAÇÃO GLOBAL</h2>
            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest italic mt-1 block">HALL DA FAMA ROYAL</span>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Lista de Ranking */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative no-scrollbar pb-32">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-white rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Buscando Lendas...</span>
          </div>
        ) : (
          leaderboardPlayers.map((player, index) => {
            const rank = index + 1;
            const badge = getRankBadge(rank);
            const isMe = player.name === profile?.name;

            return (
              <div 
                key={player.id} 
                className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all shadow-lg ${
                  isMe ? 'bg-blue-600/30 border-blue-400' : 'bg-black/40 border-white/5'
                }`}
              >
                <div className="w-10 text-center flex flex-col items-center">
                  {badge ? (
                    <span className="text-2xl drop-shadow-md">{badge}</span>
                  ) : (
                    <span className="text-xs font-black text-white/30 italic">#{rank}</span>
                  )}
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl border-2 border-white/10 shrink-0 shadow-inner">
                  {player.avatar}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black clash-text italic uppercase leading-none ${isMe ? 'text-blue-200' : 'text-white'}`}>
                      {player.name}
                    </span>
                    <span className="bg-black/40 px-1.5 py-0.5 rounded text-[8px] font-bold text-white/40 border border-white/5">
                      NV {player.level}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-2xl border border-white/5 shadow-inner">
                  <span className="text-xs font-black italic">{player.trophies}</span>
                  <span className="text-xs">🏆</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Barra do Jogador Local (Sticky no Rodapé) */}
      {profile && !isLoading && (
        <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-black to-[#0b1421] border-t-4 border-blue-600 z-50 animate-in slide-in-from-bottom duration-500">
           <div className="max-w-md mx-auto flex items-center gap-4 p-4 bg-blue-600 rounded-[30px] border-2 border-white/20 shadow-2xl">
              <div className="w-10 text-center">
                 <span className="text-sm font-black italic text-white">#{myRank > 0 ? myRank : '?'}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border-2 border-white/20 shadow-lg shrink-0">
                 👑
              </div>
              <div className="flex-1">
                 <span className="text-sm font-black clash-text italic uppercase text-white leading-none">VOCÊ ({profile.name})</span>
                 <div className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-1 italic">Arena {profile.currentArena + 1}</div>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 px-4 py-2 rounded-2xl border border-white/10 shadow-inner">
                 <span className="text-sm font-black italic text-white">{profile.trophies}</span>
                 <span className="text-sm">🏆</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardView;
