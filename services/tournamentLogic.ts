
import { Player, Match, MatchStatus, BracketType, PlayerStatus } from '../types';

/**
 * Implements Snake Draft distribution based on MMR
 */
export const distributeGroups = (players: Player[]): { distributedPlayers: Player[]; groupCount: number } => {
  const sortedPlayers = [...players].sort((a, b) => b.mmr - a.mmr);
  const count = sortedPlayers.length;

  let groupCount = 3;
  if (count >= 25) {
    groupCount = 5;
  } else if (count > 18) {
    groupCount = 4;
  }

  const playableCount = Math.floor(count / groupCount) * groupCount;
  const playerMap = new Map<string, Player>(players.map(p => [p.player_id, { ...p, grupo: null, status: 'standby' as PlayerStatus }]));
  const groupNames = ['A', 'B', 'C', 'D', 'E'].slice(0, groupCount);
  const snakeOrder: string[] = [];

  let forward = true;
  for (let i = 0; i < playableCount / groupCount; i++) {
    const row = [...groupNames];
    if (!forward) row.reverse();
    snakeOrder.push(...row);
    forward = !forward;
  }

  sortedPlayers.slice(0, playableCount).forEach((p, index) => {
    const target = playerMap.get(p.player_id);
    if (target) {
      target.grupo = snakeOrder[index];
      target.status = 'active';
    }
  });

  return { distributedPlayers: Array.from(playerMap.values()), groupCount };
};

export const generateGroupMatches = (players: Player[]): Match[] => {
  const matches: Match[] = [];
  const activePlayers = players.filter(p => p.status === 'active' && p.grupo);
  const groups = Array.from(new Set(activePlayers.map(p => p.grupo!)));

  groups.forEach(groupName => {
    const groupPlayers = activePlayers.filter(p => p.grupo === groupName);
    for (let i = 0; i < groupPlayers.length; i++) {
      for (let j = i + 1; j < groupPlayers.length; j++) {
        matches.push({
          match_id: `g_${groupName}_${i}_${j}_${Date.now()}`,
          type: 'group',
          group: groupName,
          player1_id: groupPlayers[i].player_id,
          player2_id: groupPlayers[j].player_id,
          score_player1: 0,
          score_player2: 0,
          winner_id: null,
          status: 'pending',
        });
      }
    }
  });

  return matches;
};

export const calculateStandings = (players: Player[], matches: Match[]): Player[] => {
  return players.map(player => {
    const playerMatches = matches.filter(m => 
      m.status === 'finished' && 
      (m.player1_id === player.player_id || m.player2_id === player.player_id)
    );
    
    let totalPoints = 0; // Pontos por rodada (mapas vencidos)
    let matchWins = 0;
    let matchLosses = 0;

    playerMatches.forEach(m => {
      if (m.player1_id === player.player_id) {
        totalPoints += m.score_player1;
        if (m.winner_id === player.player_id) matchWins++;
        else matchLosses++;
      } else {
        totalPoints += m.score_player2;
        if (m.winner_id === player.player_id) matchWins++;
        else matchLosses++;
      }
    });
    
    return {
      ...player,
      pontos: totalPoints,
      vitorias: matchWins,
      derrotas: matchLosses
    };
  });
};

/**
 * PROFESSIONAL DOUBLE ELIMINATION GENERATION
 */
export const generatePlayoffs = (players: Player[]): Match[] => {
  const groups = Array.from(new Set(players.filter(p => p.grupo).map(p => p.grupo!))).sort();
  const qualified: Player[] = [];
  
  groups.forEach(g => {
    const sorted = players.filter(p => p.grupo === g).sort((a, b) => 
      b.pontos - a.pontos || b.vitorias - a.vitorias || b.mmr - a.mmr
    );
    qualified.push(...sorted.slice(0, 2));
  });

  const ranked = [...qualified].sort((a, b) => 
    b.pontos - a.pontos || b.vitorias - a.vitorias || b.mmr - a.mmr
  );

  const matches: Match[] = [];
  const total = ranked.length;

  const createMatch = (id: string, bType: BracketType, phase: string, p1: string, p2: string): Match => ({
    match_id: id,
    type: 'playoff',
    bracket_type: bType,
    phase: phase,
    player1_id: p1,
    player2_id: p2,
    score_player1: 0,
    score_player2: 0,
    winner_id: null,
    status: 'pending',
  });

  if (total === 8) {
    matches.push(createMatch('u_qf_1', 'upper', 'Upper QF 1', ranked[0].player_id, ranked[7].player_id));
    matches.push(createMatch('u_qf_2', 'upper', 'Upper QF 2', ranked[3].player_id, ranked[4].player_id));
    matches.push(createMatch('u_qf_3', 'upper', 'Upper QF 3', ranked[1].player_id, ranked[6].player_id));
    matches.push(createMatch('u_qf_4', 'upper', 'Upper QF 4', ranked[2].player_id, ranked[5].player_id));

    matches.push(createMatch('u_sf_1', 'upper', 'Upper SF 1', 'TBD_u_qf_1_WIN', 'TBD_u_qf_2_WIN'));
    matches.push(createMatch('u_sf_2', 'upper', 'Upper SF 2', 'TBD_u_qf_3_WIN', 'TBD_u_qf_4_WIN'));
    matches.push(createMatch('u_final', 'upper', 'Upper Final', 'TBD_u_sf_1_WIN', 'TBD_u_sf_2_WIN'));

    matches.push(createMatch('l_r1_1', 'lower', 'Lower R1 1', 'TBD_u_qf_1_LOS', 'TBD_u_qf_2_LOS'));
    matches.push(createMatch('l_r1_2', 'lower', 'Lower R1 2', 'TBD_u_qf_3_LOS', 'TBD_u_qf_4_LOS'));
    matches.push(createMatch('l_r2_1', 'lower', 'Lower R2 1', 'TBD_l_r1_1_WIN', 'TBD_u_sf_2_LOS'));
    matches.push(createMatch('l_r2_2', 'lower', 'Lower R2 2', 'TBD_l_r1_2_WIN', 'TBD_u_sf_1_LOS'));
    matches.push(createMatch('l_sf', 'lower', 'Lower SF', 'TBD_l_r2_1_WIN', 'TBD_l_r2_2_WIN'));
    matches.push(createMatch('l_final', 'lower', 'Lower Final', 'TBD_l_sf_WIN', 'TBD_u_final_LOS'));
  } else if (total === 6) {
    matches.push(createMatch('u_qf_1', 'upper', 'Upper QF 1', ranked[2].player_id, ranked[5].player_id));
    matches.push(createMatch('u_qf_2', 'upper', 'Upper QF 2', ranked[3].player_id, ranked[4].player_id));
    matches.push(createMatch('u_sf_1', 'upper', 'Upper SF 1', ranked[0].player_id, 'TBD_u_qf_2_WIN'));
    matches.push(createMatch('u_sf_2', 'upper', 'Upper SF 2', ranked[1].player_id, 'TBD_u_qf_1_WIN'));
    matches.push(createMatch('u_final', 'upper', 'Upper Final', 'TBD_u_sf_1_WIN', 'TBD_u_sf_2_WIN'));

    matches.push(createMatch('l_r1', 'lower', 'Lower R1', 'TBD_u_qf_1_LOS', 'TBD_u_qf_2_LOS'));
    matches.push(createMatch('l_r2_1', 'lower', 'Lower R2 1', 'TBD_l_r1_WIN', 'TBD_u_sf_2_LOS'));
    matches.push(createMatch('l_r2_2', 'lower', 'Lower R2 2', 'TBD_u_sf_1_LOS', 'BYE')); 
    matches.push(createMatch('l_sf', 'lower', 'Lower SF', 'TBD_l_r2_1_WIN', 'TBD_l_r2_2_WIN'));
    matches.push(createMatch('l_final', 'lower', 'Lower Final', 'TBD_l_sf_WIN', 'TBD_u_final_LOS'));
  } else if (total === 10) {
    matches.push(createMatch('u_pre_1', 'upper', 'Prelim 1', ranked[6].player_id, ranked[9].player_id));
    matches.push(createMatch('u_pre_2', 'upper', 'Prelim 2', ranked[7].player_id, ranked[8].player_id));
    matches.push(createMatch('u_qf_1', 'upper', 'Upper QF 1', ranked[0].player_id, 'TBD_u_pre_1_WIN'));
    matches.push(createMatch('u_qf_2', 'upper', 'Upper QF 2', ranked[3].player_id, ranked[4].player_id));
    matches.push(createMatch('u_qf_3', 'upper', 'Upper QF 3', ranked[1].player_id, 'TBD_u_pre_2_WIN'));
    matches.push(createMatch('u_qf_4', 'upper', 'Upper QF 4', ranked[2].player_id, ranked[5].player_id));
    matches.push(createMatch('u_sf_1', 'upper', 'Upper SF 1', 'TBD_u_qf_1_WIN', 'TBD_u_qf_2_WIN'));
    matches.push(createMatch('u_sf_2', 'upper', 'Upper SF 2', 'TBD_u_qf_3_WIN', 'TBD_u_qf_4_WIN'));
    matches.push(createMatch('u_final', 'upper', 'Upper Final', 'TBD_u_sf_1_WIN', 'TBD_u_sf_2_WIN'));

    matches.push(createMatch('l_pre', 'lower', 'Lower Prelim', 'TBD_u_pre_1_LOS', 'TBD_u_pre_2_LOS'));
    matches.push(createMatch('l_r1_1', 'lower', 'Lower R1 1', 'TBD_u_qf_1_LOS', 'TBD_u_qf_2_LOS'));
    matches.push(createMatch('l_r1_2', 'lower', 'Lower R1 2', 'TBD_u_qf_3_LOS', 'TBD_u_qf_4_LOS'));
    matches.push(createMatch('l_r2_1', 'lower', 'Lower R2 1', 'TBD_l_r1_1_WIN', 'TBD_u_sf_2_LOS'));
    matches.push(createMatch('l_r2_2', 'lower', 'Lower R2 2', 'TBD_l_r1_2_WIN', 'TBD_u_sf_1_LOS'));
    matches.push(createMatch('l_sf', 'lower', 'Lower SF', 'TBD_l_r2_1_WIN', 'TBD_l_r2_2_WIN'));
    matches.push(createMatch('l_final', 'lower', 'Lower Final', 'TBD_l_sf_WIN', 'TBD_u_final_LOS'));
  }

  matches.push(createMatch('grand_final', 'grand_final', 'Grand Final', 'TBD_u_final_WIN', 'TBD_l_final_WIN'));

  return matches;
};
