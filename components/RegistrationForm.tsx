
import React, { useState } from 'react';
import { Medal, Player } from '../types';
import { MEDALS } from '../constants';

interface RegistrationFormProps {
  onRegister: (data: { nick: string; dota_id: string; mmr: number; medalha: Medal; password?: string }) => Promise<void>;
  existingPlayers: Player[];
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, existingPlayers }) => {
  const [formData, setFormData] = useState({
    nick: '',
    dota_id: '',
    password: '',
    mmr: '',
    medalha: 'Arauto' as Medal
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Lógica para calcular a medalha baseada no MMR
  const calculateMedal = (mmrValue: number): Medal => {
    if (mmrValue > 5740) return 'Imortal';
    if (mmrValue >= 5001) return 'Divino';
    if (mmrValue >= 3901) return 'Ancestral';
    if (mmrValue >= 3301) return 'Lenda';
    if (mmrValue >= 2441) return 'Arconte';
    if (mmrValue >= 1601) return 'Cruzado';
    if (mmrValue >= 771) return 'Guardião';
    return 'Arauto';
  };

  const handleMMRChange = (val: string) => {
    // Remove letras e limita a 5 dígitos
    let cleanVal = val.replace(/\D/g, '').slice(0, 5);
    let mmrNum = parseInt(cleanVal) || 0;
    
    // Limite estrito de 12.000 MMR
    if (mmrNum > 12000) {
      mmrNum = 12000;
      cleanVal = "12000";
    }

    const autoMedal = calculateMedal(mmrNum);
    
    setFormData({
      ...formData,
      mmr: cleanVal,
      medalha: autoMedal
    });
  };

  const handleDotaIdChange = (val: string) => {
    // Remove letras e limita a 20 caracteres
    const cleanVal = val.replace(/\D/g, '').slice(0, 20);
    setFormData({ ...formData, dota_id: cleanVal });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.nick.trim() || !formData.dota_id.trim() || !formData.mmr.trim() || !formData.password.trim()) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    // Validação de força da senha
    const password = formData.password;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setError("A senha deve ter no mínimo: 1 letra maiúscula, 1 minúscula, 1 número e 1 ícone/símbolo.");
      return;
    }

    const mmrValue = parseInt(formData.mmr);
    if (isNaN(mmrValue) || mmrValue < 0 || mmrValue > 12000) {
      setError("MMR deve ser um número válido entre 0 e 12000.");
      return;
    }

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
        password: formData.password.trim(),
        mmr: mmrValue,
        medalha: formData.medalha
      });
      
      setFormData({ nick: '', dota_id: '', password: '', mmr: '', medalha: 'Arauto' });
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
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nick no Dota (Máx 30)</label>
          <input 
            type="text" 
            value={formData.nick}
            maxLength={30}
            onChange={e => setFormData({...formData, nick: e.target.value})}
            disabled={loading}
            className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-500 transition outline-none disabled:opacity-50"
            placeholder="Ex: Arteezy"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ID do Dota (Máx 20)</label>
            <input 
              type="text" 
              value={formData.dota_id}
              onChange={e => handleDotaIdChange(e.target.value)}
              disabled={loading}
              className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-500 transition outline-none disabled:opacity-50"
              placeholder="Apenas números"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha de Acesso</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              disabled={loading}
              className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-500 transition outline-none disabled:opacity-50"
              placeholder="Ex: P@ssw0rd1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">MMR (Máx 12.000)</label>
            <input 
              type="text" 
              value={formData.mmr}
              onChange={e => handleMMRChange(e.target.value)}
              disabled={loading}
              className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-500 transition outline-none disabled:opacity-50"
              placeholder="Máx: 12000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Medalha (Automática)</label>
            <select 
              value={formData.medalha}
              disabled={true}
              className="w-full bg-black border border-zinc-800 p-3 rounded text-gray-400 cursor-not-allowed outline-none appearance-none"
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
