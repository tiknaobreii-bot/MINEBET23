import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, Gem, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Player, Withdrawal } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: (newBalance: number) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      setError(null);
      setSuccessNotice(null);
      setAmount('');
      fetchWithdrawals();
    }
  }, [isOpen, player]);

  const fetchWithdrawals = async () => {
    try {
      setLoadingList(true);
      const res = await api.getPlayerWithdrawals();
      setWithdrawals(res.withdrawals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  if (!isOpen) return null;

  const currentBalance = player?.balance || 0;
  const numAmount = parseInt(amount, 10) || 0;

  const handleSetPercent = (pct: number) => {
    if (currentBalance <= 0) return;
    const val = Math.max(1, Math.floor(currentBalance * pct));
    setAmount(String(val));
    sounds.playChip();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    if (numAmount <= 0) {
      setError('Informe uma quantidade válida de diamantes para saque.');
      return;
    }
    if (numAmount > currentBalance) {
      setError(`Você não pode sacar mais do que seu saldo (${currentBalance} 💎).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.withdraw(numAmount);
      sounds.playWin();
      setSuccessNotice(res.notice || 'Vá até a banca no servidor para receber seus diamantes.');
      setAmount('');
      onSuccess(res.newBalance);
      fetchWithdrawals();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar saque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#101622] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-cyan-950/50">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white tracking-wide">
                SACAR DIAMANTES
              </h3>
              <p className="text-xs text-slate-400">Resgate seus diamantes ganhos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-5">
          
          {/* Main Server Notice Banner as instructed */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/90 leading-relaxed font-medium">
              "Vá até a banca no servidor para receber seus diamantes."
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Pedido de saque registrado com sucesso!</p>
                <p className="mt-0.5">{successNotice}</p>
              </div>
            </div>
          )}

          {/* Current Balance Indicator */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Saldo Disponível:</span>
            <div className="flex items-center gap-1.5 font-display text-base font-bold text-cyan-400 tabular-nums">
              <Gem className="w-4 h-4" />
              <span>{currentBalance.toLocaleString('pt-BR')} 💎</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Quantidade de Diamantes a Sacar:
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={currentBalance}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 50"
                  disabled={loading || currentBalance <= 0}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-sm">💎</span>
              </div>

              {/* Quick Percent Buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => handleSetPercent(0.25)}
                  disabled={currentBalance <= 0}
                  className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPercent(0.5)}
                  disabled={currentBalance <= 0}
                  className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPercent(0.75)}
                  disabled={currentBalance <= 0}
                  className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPercent(1)}
                  disabled={currentBalance <= 0}
                  className="flex-1 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg text-[11px] font-bold text-cyan-400"
                >
                  MAX
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || currentBalance <= 0 || numAmount <= 0 || numAmount > currentBalance}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Pedido...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Confirmar Pedido de Saque</span>
                </>
              )}
            </button>
          </form>

          {/* Pending and Recent Withdrawals List */}
          <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Seus Pedidos de Saque</span>
              <span className="text-[11px] font-normal text-slate-400">Total: {withdrawals.length}</span>
            </h4>

            {loadingList ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Carregando...
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/40">
                Nenhum saque solicitado ainda.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${
                        w.status === 'pendente' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {w.status === 'pendente' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="font-bold text-white tabular-nums">{w.amount} 💎</span>
                        <span className="block text-[10px] text-slate-400">
                          {new Date(w.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      w.status === 'pendente'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {w.status === 'pendente' ? 'Pendente' : 'Pago'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
