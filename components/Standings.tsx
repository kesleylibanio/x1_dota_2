
import React from 'react';
import { Player } from '../types';

interface StandingsProps {
  players: Player[];
}

const Standings: React.FC<StandingsProps> = ({ players }) => {
  const groups = Array.from(new Set(players.filter(p => p.grupo).map(p => p.grupo!))).sort();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <i className="fa-solid fa-ranking-star text-orange-500"></i>
        Classificação do Torneio
      </h2>

      {groups.length === 0 ? (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 p-12 text-center rounded-xl">
          <i className="fa-solid fa-chess-board text-4xl text-zinc-700 mb-4"></i>
          <p className="text-gray-500">O torneio ainda não começou. Aguardando distribuição dos grupos.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {groups.map(g => {
            const groupPlayers = players.filter(p => p.grupo === g).sort((a, b) => b.pontos - a.pontos || b.mmr - a.mmr);
            return (
              <div key={g} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg shadow-black">
                <div className="bg-red-900/20 px-4 py-2 border-b border-red-900/30 flex justify-between items-center">
                  <h3 className="font-black tracking-tighter text-red-400 uppercase">GRUPO {g}</h3>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">{groupPlayers.length} Competidores</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-500 uppercase font-bold border-b border-zinc-800">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Jogador</th>
                      <th className="p-3">V-D</th>
                      <th className="p-3 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {groupPlayers.map((p, i) => (
                      <tr key={p.player_id} className={`hover:bg-red-500/5 transition ${i < 2 ? 'bg-red-900/5' : ''}`}>
                        <td className="p-3">
                          {i === 0 ? <i className="fa-solid fa-crown text-yellow-500"></i> : i + 1}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-gray-200">{p.nick}</p>
                          <p className="text-[10px] text-gray-500">ID: {p.dota_id}</p>
                        </td>
                        <td className="p-3 font-mono text-gray-400">{p.vitorias}-{p.derrotas}</td>
                        <td className="p-3 text-right font-black text-red-500">{p.pontos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Standings;