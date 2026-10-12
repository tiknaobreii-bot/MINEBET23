import React, { useState, useEffect } from 'react';
import { X, Send, Gem, ArrowRight, CheckCircle2, AlertCircle, Loader2, History, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Player, Transfer } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: (newBalance: number) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('50');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transfersHistory, setTransfersHistory] = useState<Transfer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'transfer' | 'history'>('transfer');

  useEffect(() => {
    if (isOpen && player) {
      setStep('form');
      setError(null);
      loadTransfersHistory();
    }
  }, [isOpen, player]);

  const loadTransfersHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getMyTransfers();
      setTransfersHistory(res.transfers || []);
    } catch {
      // Ignore background error
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const currentBalance = player?.balance || 0;
  const numAmount = parseInt(amount, 10) || 0;
  const isValidAmount = numAmount > 0 && numAmount <= currentBalance;
  const remainingBalance = Math.max(0, currentBalance - numAmount);

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recipient.trim()) {
      setError('Informe o nick do jogador destinatário.');
      return;
    }
    if (player && recipient.trim().toLowerCase() === player.username.toLowerCase()) {
      setError('Você não pode transferir diamantes para si mesmo.');
      return;
    }
    if (!isValidAmount) {
      setError(`Quantidade inválida. Seu saldo disponível é de ${currentBalance} 💎.`);
      return;
    }

    sounds.playChip();
    setStep('confirm');
  };

  const handleExecuteTransfer = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.transferDiamonds(recipient.trim(), numAmount);
      sounds.playWin();
      onSuccess(res.newBalance);
      setStep('success');
      loadTransfersHistory();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar transferência.');
      sounds.playBust();
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const setAmountPercent = (pct: number) => {
    const val = Math.floor(currentBalance * pct);
    setAmount(val.toString());
    sounds.playChip();
  };

  const addAmountFixed = (val: number) => {
    const cur = parseInt(amount, 10) || 0;
    const next = Math.min(currentBalance, cur + val);
    setAmount(next.toString());
    sounds.playChip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#0c1017] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Minecraft Casino Theme */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0d1424] to-[#09101b] border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-inner shadow-cyan-500/20">
              <Send className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Transferir Diamantes
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">
                  INSTANTÂNEO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Envie diamantes para qualquer jogador do servidor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs: Transfer / History */}
        <div className="flex border-b border-slate-800 bg-[#090d14] px-6">
          <button
            onClick={() => setActiveSubTab('transfer')}
            className={`py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 mr-6 flex items-center gap-2 ${
              activeSubTab === 'transfer'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Enviar Diamantes
          </button>
          <button
            onClick={() => {
              setActiveSubTab('history');
              loadTransfersHistory();
            }}
            className={`py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'history'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Histórico ({transfersHistory.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {activeSubTab === 'transfer' ? (
            <>
              {/* Balance Bar */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block">Seu saldo disponível</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Gem className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                    <span className="font-display text-xl font-bold text-white tracking-wide font-mono">
                      {currentBalance.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-cyan-400 font-semibold uppercase">💎</span>
                  </div>
                </div>
                {step === 'form' && (
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Saldo restante</span>
                    <span className="text-sm font-mono font-bold text-slate-300">
                      {remainingBalance.toLocaleString('pt-BR')} 💎
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: FORM */}
              {step === 'form' && (
                <form onSubmit={handleProceedToConfirm} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Nick do Jogador (Destinatário):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="Ex: Steve, Alex_Gamer, etc."
                        required
                        className="w-full bg-[#111722] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Digite exatamente o nome de usuário do jogador cadastrado no MineBet.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Quantidade de Diamantes 💎:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={currentBalance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="w-full bg-[#111722] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-2.5 text-base text-white font-mono font-bold placeholder-slate-500 transition-all pr-12"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">
                        💎
                      </span>
                    </div>

                    {/* Quick helper buttons */}
                    <div className="grid grid-cols-6 gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => addAmountFixed(10)}
                        className="py-1 px-2 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => addAmountFixed(50)}
                        className="py-1 px-2 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => addAmountFixed(100)}
                        className="py-1 px-2 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        +100
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountPercent(0.25)}
                        className="py-1 px-2 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountPercent(0.5)}
                        className="py-1 px-2 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmountPercent(1)}
                        className="py-1 px-2 text-[11px] font-mono bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 rounded border border-cyan-500/30 font-bold transition-colors"
                      >
                        TUDO
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-start gap-2.5 text-xs text-cyan-300">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      A transferência é realizada <strong>instantaneamente</strong> e cai direto no saldo do outro jogador sem taxas.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!isValidAmount || !recipient.trim()}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: CONFIRMATION */}
              {step === 'confirm' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-2">
                    <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                      <Send className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">Confirmar Transferência</h3>
                    <p className="text-xs text-slate-300">
                      Você está prestes a transferir diamantes no servidor:
                    </p>

                    <div className="my-3 p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Destinatário:</span>
                        <span className="font-bold text-cyan-400">{recipient}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Quantidade:</span>
                        <span className="font-bold text-white">{numAmount.toLocaleString('pt-BR')} 💎</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-slate-800 pt-1">
                        <span className="text-slate-400">Novo Saldo:</span>
                        <span className="font-bold text-emerald-400">{remainingBalance.toLocaleString('pt-BR')} 💎</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-300/90">
                      ⚠️ Esta ação não pode ser desfeita. Verifique o nick com atenção!
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      disabled={loading}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteTransfer}
                      disabled={loading}
                      className="flex-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Transferindo...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar e Enviar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS */}
              {step === 'success' && (
                <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider">
                      Transferência Concluída!
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {numAmount.toLocaleString('pt-BR')} diamantes foram creditados com sucesso na conta de <strong className="text-cyan-400">{recipient}</strong>.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setRecipient('');
                        setAmount('50');
                        setStep('form');
                      }}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Nova Transferência
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* TAB 2: MY TRANSFERS HISTORY */
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs">Carregando histórico...</span>
                </div>
              ) : transfersHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-1">
                  <Send className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                  <p className="text-xs">Nenhuma transferência enviada ou recebida ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transfersHistory.map((tr) => {
                    const isOutgoing = tr.fromPlayerId === player?.id;
                    return (
                      <div
                        key={tr.id}
                        className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isOutgoing
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {isOutgoing ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-white font-mono">
                              {isOutgoing ? `Para: ${tr.toUsername}` : `De: ${tr.fromUsername}`}
                            </p>
                            <span className="text-[10px] text-slate-500">
                              {new Date(tr.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isOutgoing ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {isOutgoing ? '-' : '+'}{tr.amount.toLocaleString('pt-BR')} 💎
                          </span>
                          <span className="block text-[10px] text-slate-400 uppercase">
                            {isOutgoing ? 'Enviado' : 'Recebido'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
