
import React, { useState } from 'react';
import { Medal, Player } from '../types';
import { MEDALS } from '../constants';

interface RegistrationFormProps {
  onRegister: (data: { nick: string; dota_id: string; mmr: number; medalha: Medal }) => Promise<void>;
  existingPlayers: Player[];
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, existingPlayers }) => {
  const [formData, setFormData] = useState({
    nick: '',
    dota_id: '',
    mmr: '',
    medalha: 'Arauto' as Medal
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.nick.trim() || !formData.dota_id.trim() || !formData.mmr.trim()) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    const mmrValue = parseInt(formData.mmr);
    if (isNaN(mmrValue) || mmrValue < 0) {
      setError("MMR deve ser um número inteiro positivo.");
      return;
    }

    // Convert dota_id to string defensively as Google Sheets might return it as a number
    const idExists = existingPlayers.some(p => String(p.dota_id || '').trim() === formData.dota_id.trim());
    if (idExists) {
      setError("Já existe um jogador cadastrado com esse ID.");
      return;
    }

    setLoading(true);

    try {
      await onRegister({
        nick: formData.nick.trim(),
        dota_id: formData.dota_id.trim(),
        mmr: mmrValue,
        medalha: formData.medalha
      });
      
      setFormData({ nick: '', dota_id: '', mmr: '', medalha: 'Arauto' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl backdrop-blur-sm fiery-glow">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <i className="fa-solid fa-user-plus text-red-500"></i>
        Inscrição de Jogador
      </h2>

      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-xs font-bold animate-pulse">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/40 border border-green-500 text-green-200 px-4 py-3 rounded mb-4 text-xs font-bold">
          Jogador recrutado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nick no Dota</label>
          <input 
            type="text" 
            value={formData.nick}
            onChange={e => setFormData({...formData, nick: e.target.value})}
            disabled={loading}
            className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-500 transition outline-none disabled:opacity-50"
            placeholder="Ex: Arteezy"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ID do Dota (Único)</label>
          <input 
            type="text" 
            value={formData.dota_id}
            onChange={e => setFormData({...formData, dota_id: e.target.value})}
            disabled={loading}
            className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-500 transition outline-none disabled:opacity-50"
            placeholder="12345678"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">MMR (Inteiro)</label>
            <input 
              type="number" 
              value={formData.mmr}
              onChange={e => setFormData({...formData, mmr: e.target.value})}
              disabled={loading}
              className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-500 transition outline-none disabled:opacity-50"
              placeholder="3500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Medalha</label>
            <select 
              value={formData.medalha}
              onChange={e => setFormData({...formData, medalha: e.target.value as Medal})}
              disabled={loading}
              className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-500 transition outline-none disabled:opacity-50"
            >
              {MEDALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 py-3 rounded font-bold uppercase tracking-widest hover:brightness-125 transition-all shadow-lg shadow-red-900/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fa-solid fa-spinner animate-spin"></i> Recrutando...
            </span>
          ) : "Confirmar Recrutamento"}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;