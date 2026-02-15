
import React, { useState } from 'react';
import { UserRole, Player } from '../types';
import { ADMIN_PASSWORD } from '../constants';

interface LoginProps {
  onLogin: (role: UserRole, id?: string) => void;
  onGoToRegister: () => void;
  players: Player[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoToRegister, players }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [dotaId, setDotaId] = useState('');
  const [playerPassword, setPlayerPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLogin('admin');
    } else {
      setError('Credenciais do sistema inválidas.');
    }
  };

  const handlePlayerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Normalize both values to strings for comparison and check password
    const player = players.find(p => 
      String(p.dota_id || '') === String(dotaId || '') && 
      p.password === playerPassword
    );
    
    if (player) {
      onLogin('player', String(player.dota_id));
    } else {
      setError('ID de Jogador ou Senha incorretos.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-red-900/30 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
        
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-black border-2 border-red-600 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-red-600/30 overflow-hidden">
            <img src="https://i.ibb.co/hR5kdLZ9/7533b0b7-dfb0-4823-939b-1ea0209f05e5.png" alt="Corvus Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-3xl font-black fiery-text uppercase tracking-tighter">Área de Login</h2>
          <p className="text-gray-500 text-sm mt-2 font-bold uppercase tracking-widest">Escolha sua identidade</p>
        </div>

        <div className="flex gap-1 bg-black p-1 rounded-xl mb-6">
          <button 
            onClick={() => { setIsAdmin(false); setError(''); }}
            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition ${!isAdmin ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-zinc-800'}`}
          >
            Jogador
          </button>
          <button 
             onClick={() => { setIsAdmin(true); setError(''); }}
            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition ${isAdmin ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-zinc-800'}`}
          >
            Supervisor
          </button>
        </div>

        {error && <p className="text-red-500 text-center text-xs font-bold mb-4 animate-pulse">{error}</p>}

        {isAdmin ? (
          <form onSubmit={handleAdminLogin} className="space-y-4">
             <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chave do Sistema</label>
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none focus:border-red-600 transition text-white"
                  placeholder="Insira a senha..."
                />
             </div>
             <button className="w-full bg-red-600 py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 transition shadow-lg shadow-red-900/20">
               Autorizar Acesso
             </button>
          </form>
        ) : (
          <form onSubmit={handlePlayerLogin} className="space-y-4">
             <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ID do Dota Jogador</label>
                <input 
                  type="text"
                  value={dotaId}
                  onChange={e => setDotaId(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none focus:border-red-600 transition text-white"
                  placeholder="Seu ID do Dota..."
                />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Senha de Acesso</label>
                <input 
                  type="password"
                  value={playerPassword}
                  onChange={e => setPlayerPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none focus:border-red-600 transition text-white"
                  placeholder="••••••••"
                />
             </div>
             <button className="w-full bg-red-600 py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 transition shadow-lg shadow-red-900/20">
               Entrar na Arena
             </button>
             <div className="text-center mt-4">
               <button 
                 type="button"
                 onClick={onGoToRegister}
                 className="text-xs font-bold uppercase text-gray-500 hover:text-red-500 transition"
               >
                 Ainda não está recrutado? <span className="text-red-600">Cadastre-se aqui</span>
               </button>
             </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
