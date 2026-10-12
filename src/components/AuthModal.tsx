import React, { useState } from 'react';
import { X, User, Lock, ArrowRight, Loader2, Gem, Sparkles } from 'lucide-react';
import { api } from '../api';
import { Player } from '../types';
import { sounds } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (player: Player) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode if initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Por favor preencha nome de usuário e senha.');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (mode === 'login') {
        res = await api.login(username.trim(), password);
      } else {
        res = await api.register(username.trim(), password);
      }
      sounds.playWin();
      onSuccess(res.player);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setMode('login');
    setError(null);
    sounds.playChip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#101622] border border-cyan-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-cyan-950/60">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0c1017]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              mode === 'login'
                ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              mode === 'register'
                ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Cadastrar
          </button>

          <button
            onClick={onClose}
            className="px-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-5">
          <div>
            <h3 className="font-display text-xl font-bold text-white tracking-wide">
              {mode === 'login' ? 'BEM-VINDO DE VOLTA!' : 'CRIE SUA CONTA MINEBET'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Insira seus dados para acessar sua carteira de diamantes.'
                : 'Use o mesmo Nick que você usa no servidor de Minecraft.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nick no Servidor (Usuário):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: Steve ou SeuNick"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Senha de Acesso:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            {mode === 'register' && (
              <div className="flex items-center gap-2 p-2.5 bg-cyan-950/40 rounded-xl border border-cyan-500/20 text-[11px] text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Bônus de boas-vindas: 50 diamantes para começar a jogar!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Entrar na Conta' : 'Criar Conta Grátis'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Logins */}
          <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
              Acesso Rápido para Testes:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('Steve', 'steve123')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Steve</span>
                  <Gem className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="text-[10px] text-slate-400">250 Diamantes</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('Alex_Gamer', 'alex2026')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Alex_Gamer</span>
                  <Gem className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="text-[10px] text-slate-400">620 Diamantes</div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
