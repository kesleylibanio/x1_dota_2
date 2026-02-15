
import { INITIAL_STORAGE_KEY } from '../constants';
import { AppState } from '../types';

/**
 * URL de implantação do Google Apps Script obtida de variáveis de ambiente.
 */
const API_URL = process.env.SHEETS_API_URL || '';

const initialState: AppState = {
  players: [],
  groupMatches: [],
  playoffMatches: [],
  currentUser: { role: null },
  tournamentStarted: false
};

const isUrlConfigured = () => API_URL && API_URL.trim() !== '';

export const saveToSheets = async (state: AppState) => {
  // Persistência local imediata
  localStorage.setItem(INITIAL_STORAGE_KEY, JSON.stringify(state));

  if (!isUrlConfigured()) return;

  try {
    // Envia os dados divididos para as 3 abas
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'syncAll',
        payload: {
          players: state.players,
          groupMatches: state.groupMatches,
          playoffMatches: state.playoffMatches
        }
      })
    });
  } catch (e) {
    console.error("Erro ao sincronizar com Google Sheets:", e);
  }
};

export const loadFromSheets = async (): Promise<AppState> => {
  const localData = localStorage.getItem(INITIAL_STORAGE_KEY);
  let state = localData ? JSON.parse(localData) : initialState;

  if (!isUrlConfigured()) return state;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_URL}?action=getState`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        ...state,
        players: data.players || [],
        groupMatches: data.groupMatches || [],
        playoffMatches: data.playoffMatches || [],
      };
    }
  } catch (e) {
    console.warn("Usando dados locais.");
  }
  
  return state;
};

export const clearAllData = async () => {
  localStorage.removeItem(INITIAL_STORAGE_KEY);
  if (isUrlConfigured()) {
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'reset' })
      });
    } catch (e) {
      console.error("Erro ao resetar Google Sheets:", e);
    }
  }
  window.location.reload();
};
