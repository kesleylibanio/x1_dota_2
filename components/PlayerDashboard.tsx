
import React, { useState } from 'react';
import { Player, AppState } from '../types';
import Standings from './Standings';
import Brackets from './Brackets';

interface PlayerDashboardProps {
  player?: Player;
  state: AppState;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ player, state }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'brackets'>('overview');

  if (!player) return <div className="p-12 text-center text-red-500 font-bold uppercase tracking-widest bg-red-900/10 border border-red-900 rounded">Erro: Dados do jogador não encontrados.</div>;

  // Corrigido: Incluir partidas de playoffs na jornada do jogador
  const allMatches = [...state.groupMatches, ...state.playoffMatches];
  const myMatches = allMatches.filter(m => m.player1_id === player.player_id || m.player2_id === player.player_id);
  
  // Corrigido: Calcular estatísticas dinamicamente para garantir que reflitam tanto grupos quanto playoffs
  const totalWins = myMatches.filter(m => m.status === 'finished' && m.winner_id === player.player_id).length;
  const totalLosses = myMatches.filter(m => m.status === 'finished' && m.winner_id !== null && m.winner_id !== player.player_id).length;

  const getOpponent = (m: any) => m.player1_id === player.player_id ? m.player2_id : m.player1_id;
  const getOpponentNick = (id: string) => state.players.find(p => p.player_id === id)?.nick || 'Desconhecido';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-red-950/40 to-black border border-red-900/30 p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <i className="fa-solid fa-shield-halved text-9xl"></i>
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
           <div className="w-24 h-24 bg-zinc-900 border-2 border-red-500 rounded-full flex items-center justify-center text-4xl shadow-2xl shadow-red-500/20">
             <i className="fa-solid fa-user-ninja text-gray-500"></i>
           </div>
           <div>
             <div className="flex items-center gap-3 mb-1">
               <h1 className="text-4xl font-black fiery-text uppercase">{player.nick}</h1>
               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${player.status === 'active' ? 'bg-green-600' : 'bg-zinc-700'}`}>
                 {player.status === 'active' ? 'Ativo' : 'Reserva'}
               </span>
             </div>
             <p className="text-gray-400 font-bold tracking-widest text-sm flex flex-wrap gap-4">
               <span>ID DOTA: {player.dota_id}</span>
               <span className="text-orange-500">MMR: {player.mmr}</span>
               <span className="text-red-400">MEDALHA: {player.medalha}</span>
               <span className="text-gray-500">INSCRITO EM: {player.registration_date}</span>
             </p>
           </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-zinc-900 border border-red-900/30 p-1.5 rounded-xl flex gap-2 w-full md:w-fit">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${activeTab === 'overview' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-zinc-800'}`}
        >
          Visão Geral
        </button>
        <button 
          onClick={() => setActiveTab('brackets')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${activeTab === 'brackets' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-zinc-800'}`}
        >
          Chaveamento
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-xl">
               <h3 className="text-lg font-bold mb-4 uppercase tracking-widest text-gray-400">Minha Jornada</h3>
               <div className="space-y-4">
                 {myMatches.length === 0 ? (
                   <p className="text-gray-600 italic">Nenhuma partida agendada ainda.</p>
                 ) : (
                   myMatches.map(m => (
                     <div key={m.match_id} className="p-4 bg-black/40 border-l-2 border-red-600 rounded">
                       <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-2">
                         <span>{m.type === 'group' ? `Grupo ${m.group}` : 'Playoffs'}</span>
                         <span className={m.status === 'finished' ? 'text-green-500' : 'text-orange-500'}>{m.status === 'finished' ? 'Finalizado' : 'Pendente'}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="font-bold">vs {getOpponentNick(getOpponent(m))}</span>
                         <div className="text-xl font-black">
                           {m.player1_id === player.player_id ? m.score_player1 : m.score_player2} - {m.player1_id === player.player_id ? m.score_player2 : m.score_player1}
                         </div>
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </div>

             <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-4 uppercase tracking-widest text-gray-400">Estatísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black p-4 rounded text-center">
                    <p className="text-3xl font-black text-green-500">{totalWins}</p>
                    <p className="text-[10px] font-bold text-gray-600 uppercase">Vitórias</p>
                  </div>
                  <div className="bg-black p-4 rounded text-center">
                    <p className="text-3xl font-black text-red-500">{totalLosses}</p>
                    <p className="text-[10px] font-bold text-gray-600 uppercase">Derrotas</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-2">
             <Standings players={state.players} />
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
           <Brackets matches={state.playoffMatches} players={state.players} />
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
