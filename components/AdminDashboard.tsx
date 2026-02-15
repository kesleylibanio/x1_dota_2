
import React, { useState } from 'react';
import { AppState, Match, MatchStatus, Medal } from '../types';
import RegistrationForm from './RegistrationForm';
import Standings from './Standings';
import Brackets from './Brackets';

interface AdminDashboardProps {
  state: AppState;
  onStart: () => void;
  onReset: () => void;
  onUpdateScore: (id: string, s1: number, s2: number, type: 'group' | 'playoff') => void;
  onInvalidate: (id: string, type: 'group' | 'playoff') => void;
  onDeletePlayer: (id: string) => void;
  onGeneratePlayoffs: () => void;
  onRegisterPlayer: (data: { nick: string; dota_id: string; mmr: number; medalha: Medal }) => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  state, onStart, onReset, onUpdateScore, onInvalidate, onDeletePlayer, onGeneratePlayoffs, onRegisterPlayer 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'players' | 'playoffs'>('overview');
  const [editingMatch, setEditingMatch] = useState<{id: string, s1: string, s2: string, type: 'group' | 'playoff'} | null>(null);

  const getPlayerNick = (id: string) => {
    if (id === 'BYE') return 'AVANÇA (BYE)';
    if (id.startsWith('TBD')) {
      const parts = id.split('_');
      const sourceMatchId = parts.slice(1, -1).join('_');
      const type = parts[parts.length - 1];
      const prefix = type === 'WIN' ? 'Vencedor' : 'Perdedor';
      return `${prefix} ${sourceMatchId}`;
    }
    return state.players.find(p => p.player_id === id)?.nick || 'Desconhecido';
  };

  const stats = {
    total: state.players.length,
    active: state.players.filter(p => p.status === 'active').length,
    standby: state.players.filter(p => p.status === 'standby').length,
    matches: state.groupMatches.length + state.playoffMatches.length,
    finished: [...state.groupMatches, ...state.playoffMatches].filter(m => m.status === 'finished').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Jogadores', val: stats.total, icon: 'fa-users' },
          { label: 'Competindo', val: stats.active, icon: 'fa-swords' },
          { label: 'Reservas', val: stats.standby, icon: 'fa-hourglass' },
          { label: 'Partidas Finalizadas', val: `${stats.finished}/${stats.matches}`, icon: 'fa-check-double' }
        ].map((s, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <i className={`fa-solid ${s.icon} text-red-500`}></i>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500">{s.label}</p>
                <p className="text-xl font-bold">{s.val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-red-900/30 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
           <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded text-sm font-bold transition ${activeTab === 'overview' ? 'bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded text-sm font-bold transition ${activeTab === 'matches' ? 'bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'}`}
          >
            Partidas
          </button>
          <button 
            onClick={() => setActiveTab('playoffs')}
            className={`px-4 py-2 rounded text-sm font-bold transition ${activeTab === 'playoffs' ? 'bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'}`}
          >
            Playoffs
          </button>
          <button 
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 rounded text-sm font-bold transition ${activeTab === 'players' ? 'bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'}`}
          >
            Jogadores
          </button>
        </div>

        <div className="flex gap-2">
          {!state.tournamentStarted ? (
            <button 
              onClick={onStart}
              disabled={state.players.length < 3}
              className="bg-green-600 px-6 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-green-500 transition disabled:opacity-50"
            >
              Iniciar Torneio
            </button>
          ) : (
             <button 
              onClick={onGeneratePlayoffs}
              className="bg-orange-600 px-6 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-orange-500 transition"
            >
              Gerar Playoffs
            </button>
          )}
          <button 
            onClick={onReset}
            className="bg-zinc-800 px-6 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-red-600 transition text-gray-300"
          >
            Resetar Tudo
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <RegistrationForm onRegister={onRegisterPlayer} existingPlayers={state.players} />
          </div>
          <div className="md:col-span-2">
             <Standings players={state.players} />
          </div>
        </div>
      )}

      {activeTab === 'players' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-gray-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4">Nick</th>
                <th className="p-4">ID do Dota</th>
                <th className="p-4">MMR</th>
                <th className="p-4">Grupo</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {state.players.map(p => (
                <tr key={p.player_id} className="hover:bg-zinc-800/30">
                  <td className="p-4 font-bold">{p.nick}</td>
                  <td className="p-4 text-gray-500">{p.dota_id}</td>
                  <td className="p-4 text-orange-500 font-mono">{p.mmr}</td>
                  <td className="p-4">{p.grupo || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                      p.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-gray-400'
                    }`}>
                      {p.status === 'active' ? 'Ativo' : 'Reserva'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => onDeletePlayer(p.player_id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'playoffs' && (
        <div className="space-y-6">
           <Brackets matches={state.playoffMatches} players={state.players} />
           <div className="space-y-4">
              <h3 className="text-xl font-bold border-l-4 border-orange-600 pl-3 uppercase">Lançar Placares Playoff (MD3)</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.playoffMatches.filter(m => !m.player1_id.startsWith('TBD') && !m.player2_id.startsWith('TBD') && m.player1_id !== 'BYE' && m.player2_id !== 'BYE').map(m => (
                  <MatchCard key={m.match_id} match={m} onEdit={() => setEditingMatch({ id: m.match_id, s1: '', s2: '', type: 'playoff' })} onInvalidate={() => onInvalidate(m.match_id, 'playoff')} getNick={getPlayerNick} />
                ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold border-l-4 border-red-600 pl-3">Batalhas de Grupo (MD3)</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.groupMatches.map(m => (
              <MatchCard key={m.match_id} match={m} onEdit={() => setEditingMatch({ id: m.match_id, s1: '', s2: '', type: 'group' })} onInvalidate={() => onInvalidate(m.match_id, 'group')} getNick={getPlayerNick} />
            ))}
          </div>
        </div>
      )}

      {editingMatch && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-zinc-900 border border-red-900/50 p-8 rounded-3xl w-full max-w-sm fiery-glow">
              <h4 className="text-xl font-black uppercase text-center mb-1 fiery-text">Confirmar Placar</h4>
              <p className="text-center text-[10px] text-gray-500 uppercase font-bold mb-6 tracking-widest">Melhor de 3 (MD3)</p>
              <div className="flex gap-4 items-center justify-center mb-8">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase truncate w-20">P1</p>
                  <input 
                    type="number" 
                    autoFocus
                    max="3"
                    min="0"
                    value={editingMatch.s1}
                    onChange={e => setEditingMatch({...editingMatch, s1: e.target.value})}
                    className="w-16 h-16 bg-black border border-zinc-700 rounded-xl text-center text-2xl font-black text-white outline-none focus:border-red-600"
                  />
                </div>
                <span className="text-gray-600 text-3xl font-black">-</span>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase truncate w-20">P2</p>
                  <input 
                    type="number" 
                    max="3"
                    min="0"
                    value={editingMatch.s2}
                    onChange={e => setEditingMatch({...editingMatch, s2: e.target.value})}
                    className="w-16 h-16 bg-black border border-zinc-700 rounded-xl text-center text-2xl font-black text-white outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    onUpdateScore(editingMatch.id, parseInt(editingMatch.s1) || 0, parseInt(editingMatch.s2) || 0, editingMatch.type);
                    setEditingMatch(null);
                  }}
                  className="flex-1 bg-red-600 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-red-900/20"
                >
                  Confirmar
                </button>
                <button 
                  onClick={() => setEditingMatch(null)}
                  className="flex-1 bg-zinc-800 py-4 rounded-xl font-bold uppercase tracking-widest text-xs text-gray-400"
                >
                  Sair
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Helper Subcomponent
const MatchCard = ({ match, onEdit, onInvalidate, getNick }: any) => (
  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg relative overflow-hidden group">
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2 items-center">
        <span className="text-[10px] bg-black px-2 py-0.5 rounded font-bold uppercase text-gray-400">
          {match.type === 'group' ? `Grupo ${match.group}` : match.phase}
        </span>
        <span className="text-[9px] font-black text-red-600 uppercase">MD3</span>
      </div>
      <span className={`text-[10px] font-bold uppercase ${match.status === 'finished' ? 'text-green-500' : 'text-orange-500'}`}>
        {match.status === 'finished' ? 'Finalizado' : 'Pendente'}
      </span>
    </div>
    
    <div className="flex items-center justify-between gap-4">
      <div className="text-center flex-1">
        <p className={`font-bold truncate text-sm ${match.winner_id === match.player1_id ? 'text-red-500' : ''}`}>{getNick(match.player1_id)}</p>
        <p className="text-2xl font-black mt-1">{match.score_player1}</p>
      </div>
      <div className="text-gray-600 font-bold">VS</div>
      <div className="text-center flex-1">
        <p className={`font-bold truncate text-sm ${match.winner_id === match.player2_id ? 'text-red-500' : ''}`}>{getNick(match.player2_id)}</p>
        <p className="text-2xl font-black mt-1">{match.score_player2}</p>
      </div>
    </div>

    <div className="mt-4 flex gap-2">
      <button 
        onClick={onEdit}
        className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded text-xs font-bold uppercase transition text-gray-200"
      >
        Lançar Placar
      </button>
      {match.status === 'finished' && (
        <button 
          onClick={onInvalidate}
          className="bg-red-900/30 hover:bg-red-900 text-red-500 hover:text-white px-3 rounded text-xs transition"
        >
          Anular
        </button>
      )}
    </div>
  </div>
);

export default AdminDashboard;