
import React from 'react';
import { Match, Player } from '../types';

interface BracketsProps {
  matches: Match[];
  players: Player[];
}

const Brackets: React.FC<BracketsProps> = ({ matches, players }) => {
  if (matches.length === 0) return null;

  const getPlayerNick = (id: string, bracketType?: string) => {
    if (id === 'BYE') return 'AVANÇA (BYE)';
    if (id.startsWith('TBD')) {
        const parts = id.split('_');
        const sourceMatchId = parts.slice(1, -1).join('_');
        const type = parts[parts.length - 1];
        
        // Se a origem é da Upper Bracket (u_) e o tipo é LOS, ou se explicitamente solicitado via nomenclatura Lower
        // Caso específico solicitado pelo usuário: nomenclature da Lower deve refletir os perdedores da Upper
        let prefix = type === 'WIN' ? 'Vencedor' : 'Perdedor';
        
        // Ajuste fino solicitado: Garantir que na Lower Bracket a referência a jogos anteriores (especialmente se vierem da Upper) seja intuitiva
        if (bracketType === 'lower' && sourceMatchId.startsWith('u_') && type === 'LOS') {
            prefix = 'Perdedor';
        }

        return `${prefix} ${sourceMatchId}`;
    }
    return players.find(p => p.player_id === id)?.nick || 'Desconhecido';
  };

  const renderBracketSection = (title: string, bracketMatches: Match[]) => {
    if (bracketMatches.length === 0) return null;

    // Group by phase to create columns
    const phases = Array.from(new Set(bracketMatches.map(m => m.phase))).sort((a, b) => {
        const order = ['Prelim', 'QF', 'SF', 'R1', 'R2', 'Final', 'Grand Final'];
        const aIdx = order.findIndex(o => a!.includes(o));
        const bIdx = order.findIndex(o => b!.includes(o));
        return aIdx - bIdx;
    });

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-black fiery-text uppercase tracking-tighter border-b border-red-900/50 pb-2">{title}</h3>
        <div className="flex flex-nowrap overflow-x-auto gap-8 pb-4">
          {phases.map(phase => (
            <div key={phase} className="min-w-[240px] flex-shrink-0 space-y-4">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center mb-2">{phase}</div>
              <div className="flex flex-col justify-around h-full gap-4">
                {bracketMatches.filter(m => m.phase === phase).map(m => (
                  <div key={m.match_id} className={`bg-zinc-900/80 border ${m.status === 'finished' ? 'border-red-600' : 'border-zinc-800'} p-3 rounded-lg shadow-xl relative`}>
                    <div className="absolute top-0 right-0 p-1 opacity-20">
                        <i className="fa-solid fa-crosshairs text-[10px]"></i>
                    </div>
                    <div className="space-y-1">
                      <div className={`flex justify-between items-center p-1.5 rounded ${m.winner_id === m.player1_id && m.player1_id ? 'bg-red-600/20' : ''}`}>
                        <span className={`text-xs truncate font-bold w-40 ${m.winner_id === m.player1_id ? 'text-red-400' : 'text-gray-400'}`}>
                          {getPlayerNick(m.player1_id, m.bracket_type)}
                        </span>
                        <span className="font-black text-sm text-white">{m.score_player1}</span>
                      </div>
                      <div className={`flex justify-between items-center p-1.5 rounded ${m.winner_id === m.player2_id && m.player2_id ? 'bg-red-600/20' : ''}`}>
                        <span className={`text-xs truncate font-bold w-40 ${m.winner_id === m.player2_id ? 'text-red-400' : 'text-gray-400'}`}>
                          {getPlayerNick(m.player2_id, m.bracket_type)}
                        </span>
                        <span className="font-black text-sm text-white">{m.score_player2}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-[8px] text-zinc-600 font-bold uppercase">{m.match_id}</span>
                        <span className="text-[8px] text-red-500 font-bold uppercase">MD3</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-16 p-4 md:p-8 bg-black/40 rounded-3xl border border-red-900/20">
      {renderBracketSection('Upper Bracket', matches.filter(m => m.bracket_type === 'upper'))}
      {renderBracketSection('Lower Bracket', matches.filter(m => m.bracket_type === 'lower'))}
      {renderBracketSection('Finals Stage', matches.filter(m => ['final', 'grand_final'].includes(m.bracket_type!)))}
    </div>
  );
};

export default Brackets;
