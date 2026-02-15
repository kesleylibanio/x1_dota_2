
export type Medal = 
  | 'Arauto' | 'Guardião' | 'Cruzado' | 'Arconte' 
  | 'Lenda' | 'Ancestral' | 'Divino' | 'Imortal';

export type PlayerStatus = 'active' | 'standby' | 'eliminated';

export interface Player {
  player_id: string;
  nick: string;
  dota_id: string;
  password?: string;
  mmr: number;
  medalha: Medal;
  registration_date: string;
  grupo: string | null;
  status: PlayerStatus;
  pontos: number;
  vitorias: number;
  derrotas: number;
}

export type MatchStatus = 'pending' | 'finished' | 'invalidated';
export type BracketType = 'upper' | 'lower' | 'final' | 'grand_final';

export interface Match {
  match_id: string;
  type: 'group' | 'playoff';
  group?: string;
  bracket_type?: BracketType;
  phase?: string;
  player1_id: string;
  player2_id: string;
  score_player1: number;
  score_player2: number;
  winner_id: string | null;
  status: MatchStatus;
}

export type UserRole = 'admin' | 'player' | null;

export interface AppState {
  players: Player[];
  groupMatches: Match[];
  playoffMatches: Match[];
  currentUser: {
    role: UserRole;
    id?: string;
  };
  tournamentStarted: boolean;
}
