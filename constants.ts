import { Medal } from './types';

export const MEDALS: Medal[] = [
  'Arauto', 'Guardião', 'Cruzado', 'Arconte', 
  'Lenda', 'Ancestral', 'Divino', 'Imortal'
];

/**
 * Senha do Supervisor obtida do ambiente. 
 * Em produção, process.env.ADMIN_PASSWORD deve estar configurada.
 */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'augustomeachou';

export const THEME = {
  primary: 'rgb(220, 38, 38)', // Vermelho-600
  secondary: 'rgb(249, 115, 22)', // Laranja-500
  background: '#050505',
  accentGray: 'rgb(31, 31, 31)', // Cinza escuro para substituir azulados
};

export const INITIAL_STORAGE_KEY = 'dota2_x1_tournament_v1';