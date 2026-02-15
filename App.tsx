
import React, { useState, useEffect } from 'react';
import { Player, Match, AppState, UserRole, MatchStatus, Medal, PlayerStatus } from './types';
import { loadFromSheets, saveToSheets } from './services/storageService';
import { distributeGroups, generateGroupMatches, calculateStandings, generatePlayoffs } from './services/tournamentLogic';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import PlayerDashboard from './components/PlayerDashboard';
import Login from './components/Login';
import RegistrationForm from './components/RegistrationForm';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    players: [],
    groupMatches: [],
    playoffMatches: [],
    currentUser: { role: null },
    tournamentStarted: false
  });
  const [view, setView] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(true);

  // Carregamento inicial assíncrono do Google Sheets
  useEffect(() => {
    const init = async () => {
      const data = await loadFromSheets();
      setState(data);
      setIsLoading(false);
    };
    init();
  }, []);

  // Sincronização com o Sheets em mudanças críticas
  const syncState = (newState: AppState) => {
    setState(newState);
    saveToSheets(newState);
  };

  const handleLogin = (role: UserRole, id?: string) => {
    setState(prev => ({ ...prev, currentUser: { role, id } }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: { role: null } }));
    setView('login');
  };

  const registerPlayer = async (newPlayer: { nick: string; dota_id: string; mmr: number; medalha: Medal; password?: string }): Promise<void> => {
    const exists = state.players.some(p => String(p.dota_id || '') === String(newPlayer.dota_id || ''));
    if (exists) {
      throw new Error("Já existe um jogador cadastrado com esse ID.");
    }

    try {
      const player: Player = {
        ...newPlayer,
        player_id: `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        registration_date: new Date().toLocaleString('pt-BR'),
        grupo: null,
        status: 'active',
        pontos: 0,
        vitorias: 0,
        derrotas: 0,
      };

      const updatedPlayers = [...state.players, player];
      const { distributedPlayers } = distributeGroups(updatedPlayers);
      
      const newState = {
        ...state,
        players: distributedPlayers
      };

      syncState(newState);

      await new Promise(resolve => setTimeout(resolve, 500));
      if (!state.currentUser.role) setView('login');
    } catch (err) {
      console.error("Erro ao salvar jogador:", err);
      throw new Error("Falha na conexão com o banco. Tente novamente.");
    }
  };

  const startTournament = () => {
    const { distributedPlayers } = distributeGroups(state.players);
    const matches = generateGroupMatches(distributedPlayers);
    const newState = {
      ...state,
      players: distributedPlayers,
      groupMatches: matches,
      tournamentStarted: true,
    };
    syncState(newState);
  };

  /**
   * PLAYOFF PROGRESSION LOGIC
   */
  const handlePlayoffProgression = (playoffMatches: Match[], matchId: string, winnerId: string | null, loserId: string | null) => {
    if (!winnerId) return playoffMatches;

    return playoffMatches.map(m => {
      let updated = { ...m };
      
      // Update next match if this winner or loser is expected
      const winnerPlaceholder = `TBD_${matchId}_WIN`;
      const loserPlaceholder = `TBD_${matchId}_LOS`;

      if (m.player1_id === winnerPlaceholder) updated.player1_id = winnerId;
      if (m.player2_id === winnerPlaceholder) updated.player2_id = winnerId;
      if (m.player1_id === loserPlaceholder && loserId) updated.player1_id = loserId;
      if (m.player2_id === loserPlaceholder && loserId) updated.player2_id = loserId;

      return updated;
    });
  };

  const updateMatchScore = (matchId: string, score1: number, score2: number, type: 'group' | 'playoff') => {
    const currentMatches = type === 'group' ? state.groupMatches : state.playoffMatches;
    const match = currentMatches.find(m => m.match_id === matchId);
    if (!match) return;

    const winnerId = score1 > score2 ? match.player1_id : (score2 > score1 ? match.player2_id : null);
    const loserId = score1 > score2 ? match.player2_id : (score2 > score1 ? match.player1_id : null);

    const updateMatches = (matches: Match[]) => 
      matches.map(m => m.match_id === matchId ? { 
        ...m, 
        score_player1: score1, 
        score_player2: score2, 
        winner_id: winnerId, 
        status: 'finished' as MatchStatus 
      } : m);

    let newState = { ...state };
    if (type === 'group') {
      const newMatches = updateMatches(state.groupMatches);
      // Recalcular standings considerando todas as partidas para atualizar pontos e estatísticas globais
      const newPlayers = calculateStandings(state.players, [...newMatches, ...state.playoffMatches]);
      newState = { ...state, groupMatches: newMatches, players: newPlayers };
    } else {
      let newPlayoffMatches = updateMatches(state.playoffMatches);
      // Propagate winner/loser
      newPlayoffMatches = handlePlayoffProgression(newPlayoffMatches, matchId, winnerId, loserId);
      // Recalcular standings também após playoffs para atualizar o objeto de jogador (vitórias/derrotas globais)
      const newPlayers = calculateStandings(state.players, [...state.groupMatches, ...newPlayoffMatches]);
      newState = { ...state, playoffMatches: newPlayoffMatches, players: newPlayers };
    }
    syncState(newState);
  };

  const invalidateMatch = (matchId: string, type: 'group' | 'playoff') => {
    const updateMatches = (matches: Match[]) => 
      matches.map(m => m.match_id === matchId ? { 
        ...m, 
        score_player1: 0, 
        score_player2: 0, 
        winner_id: null, 
        status: 'invalidated' as MatchStatus 
      } : m);

    let newState = { ...state };
    if (type === 'group') {
      const newMatches = updateMatches(state.groupMatches);
      const newPlayers = calculateStandings(state.players, [...newMatches, ...state.playoffMatches]);
      newState = { ...state, groupMatches: newMatches, players: newPlayers };
    } else {
      const newPlayoffMatches = updateMatches(state.playoffMatches);
      const newPlayers = calculateStandings(state.players, [...state.groupMatches, ...newPlayoffMatches]);
      newState = { ...state, playoffMatches: newPlayoffMatches, players: newPlayers };
    }
    syncState(newState);
  };

  const deletePlayer = (playerId: string) => {
    const filteredPlayers = state.players.filter(p => p.player_id !== playerId);
    const { distributedPlayers } = distributeGroups(filteredPlayers);
    const newState = {
      ...state,
      players: distributedPlayers,
      groupMatches: state.groupMatches.filter(m => m.player1_id !== playerId && m.player2_id !== playerId),
      playoffMatches: state.playoffMatches.filter(m => m.player1_id !== playerId && m.player2_id !== playerId),
    };
    syncState(newState);
  };

  const resetTournament = () => {
    const newState: AppState = {
      ...state,
      groupMatches: [],
      playoffMatches: [],
      tournamentStarted: false,
      players: state.players.map(p => ({
        ...p,
        grupo: null,
        status: 'active' as PlayerStatus,
        pontos: 0,
        vitorias: 0,
        derrotas: 0
      }))
    };
    syncState(newState);
  };

  const generatePlayoffBracket = () => {
    // Check if group stage is done
    const pendingGroupMatches = state.groupMatches.filter(m => m.status === 'pending');
    if (pendingGroupMatches.length > 0) {
      alert("Existem partidas de grupo pendentes. Finalize-as antes de gerar os playoffs.");
      return;
    }

    if (state.playoffMatches.length > 0 && !confirm("Os playoffs já foram gerados. Deseja gerar novamente? Isso limpará os dados dos playoffs atuais.")) {
      return;
    }

    const matches = generatePlayoffs(state.players);
    const newState = { ...state, playoffMatches: matches };
    syncState(newState);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Conectando ao Arena Service...</p>
      </div>
    );
  }

  const renderView = () => {
    if (!state.currentUser.role) {
      if (view === 'register') {
        return (
          <div className="max-w-md mx-auto py-10">
            <RegistrationForm onRegister={registerPlayer} existingPlayers={state.players} />
            <button 
              onClick={() => setView('login')}
              className="w-full mt-4 text-gray-500 hover:text-white text-sm font-bold uppercase transition"
            >
              Já possui conta? Voltar ao Login
            </button>
          </div>
        );
      }
      return <Login onLogin={handleLogin} onGoToRegister={() => setView('register')} players={state.players} />;
    }
    
    if (state.currentUser.role === 'admin') {
      return (
        <AdminDashboard 
          state={state}
          onStart={startTournament}
          onReset={resetTournament}
          onUpdateScore={updateMatchScore}
          onInvalidate={invalidateMatch}
          onDeletePlayer={deletePlayer}
          onGeneratePlayoffs={generatePlayoffBracket}
          onRegisterPlayer={registerPlayer}
        />
      );
    }

    const currentPlayer = state.players.find(p => String(p.dota_id || '') === String(state.currentUser.id || ''));
    return <PlayerDashboard player={currentPlayer} state={state} />;
  };

  return (
    <Layout currentUser={state.currentUser} onLogout={handleLogout}>
      {renderView()}
    </Layout>
  );
};

export default App;
