import React, { useState } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Play, Sparkles, ShieldCheck, Dices, ArrowLeftRight } from 'lucide-react';

interface DicePageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

export const DicePage: React.FC<DicePageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [target, setTarget] = useState<number>(50.0);
  const [condition, setCondition] = useState<'under' | 'over'>('under');
  const [rolling, setRolling] = useState<boolean>(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [lastPayout, setLastPayout] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const winChance = condition === 'under' ? target : +(100 - target).toFixed(2);
  const multiplier = +(98.5 / winChance).toFixed(2);

  const handleRoll = async () => {
    if (!player) {
      onOpenAuth();
      return;
    }
    if (betAmount <= 0) {
      setError('Aposta mínima é de 1 diamante.');
      return;
    }
    if (betAmount > player.balance) {
      setError(`Saldo insuficiente. Você tem ${player.balance} diamantes.`);
      return;
    }

    try {
      setError(null);
      setRolling(true);
      sounds.playChip();

      const res = await api.rollDice(betAmount, target, condition);

      setTimeout(() => {
        setRolling(false);
        setLastRoll(res.roll);
        setLastWin(res.win);
        setLastPayout(res.payout);

        if (res.win) {
          sounds.playWin();
        } else {
          sounds.playCrashExplosion();
        }

        onBalanceUpdate(res.newBalance);
      }, 500);

    } catch (err: any) {
      setRolling(false);
      setError(err.message || 'Erro ao rolar dados.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      {/* Blaze Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Bet & Multiplier controls */}
        <div className="lg:col-span-5 bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Dices className="w-5 h-5 text-cyan-400" />
              DADOS DO BLAZE
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ORIGINAL JONBET
            </span>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Quantia da Aposta:
              </label>
              <span className="text-[11px] text-slate-500">Saldo: {player?.balance || 0} 💎</span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                value={betAmount}
                disabled={rolling}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3.5 top-3 text-sm">💎</span>
            </div>

            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                disabled={rolling}
                onClick={() => setBetAmount((p) => Math.max(1, Math.floor(p / 2)))}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                ½
              </button>
              <button
                type="button"
                disabled={rolling}
                onClick={() => setBetAmount((p) => p * 2)}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                2X
              </button>
              <button
                type="button"
                disabled={rolling}
                onClick={() => { if (player) setBetAmount(player.balance); }}
                className="flex-1 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-400"
              >
                MÁX
              </button>
            </div>
          </div>

          {/* Multiplier & Win Chance displays */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block">Multiplicador:</span>
              <span className="font-mono text-lg font-bold text-cyan-400">{multiplier}x</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Chance de Vitória:</span>
              <span className="font-mono text-lg font-bold text-emerald-400">{winChance.toFixed(2)}%</span>
            </div>
          </div>

          {/* Roll Button */}
          <button
            type="button"
            disabled={rolling}
            onClick={handleRoll}
            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-base tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{rolling ? 'ROLANDO DADO...' : 'ROLAR DADO'}</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>Resultado 100% comprovado no servidor</span>
          </div>
        </div>

        {/* Right Side: Interactive Slider Arena */}
        <div className="lg:col-span-7 bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col items-center justify-center min-h-[420px] shadow-2xl relative overflow-hidden">
          
          {/* Roll outcome number badge */}
          {lastRoll !== null && (
            <div className="mb-8 text-center animate-in zoom-in-95">
              <span className={`font-display text-6xl md:text-7xl font-black font-mono tracking-tight drop-shadow-md ${
                lastWin ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]' : 'text-rose-500'
              }`}>
                {lastRoll.toFixed(2)}
              </span>
              <span className="block text-xs font-bold uppercase tracking-wider mt-2">
                {lastWin ? (
                  <span className="text-emerald-300 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    VOCÊ GANHOU +{lastPayout} DIAMANTES!
                  </span>
                ) : (
                  <span className="text-rose-400">
                    O dado caiu fora da margem. Tente novamente!
                  </span>
                )}
              </span>
            </div>
          )}

          {lastRoll === null && (
            <div className="mb-8 text-center">
              <span className="font-display text-6xl font-black text-slate-400 font-mono">
                {target.toFixed(2)}
              </span>
              <span className="block text-xs text-slate-500 uppercase tracking-widest mt-1">
                Alvo Selecionado
              </span>
            </div>
          )}

          {/* Interactive Range Slider Track */}
          <div className="w-full max-w-lg flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>0.00</span>
              <span>25.00</span>
              <span>50.00</span>
              <span>75.00</span>
              <span>100.00</span>
            </div>

            {/* Visual dual color bar */}
            <div className="relative h-4 rounded-full overflow-hidden bg-slate-900 border border-slate-800">
              <div
                className={`absolute top-0 bottom-0 left-0 transition-all ${
                  condition === 'under' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]' : 'bg-rose-600'
                }`}
                style={{ width: `${target}%` }}
              />
              <div
                className={`absolute top-0 bottom-0 right-0 transition-all ${
                  condition === 'over' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]' : 'bg-rose-600'
                }`}
                style={{ width: `${100 - target}%` }}
              />
            </div>

            <input
              type="range"
              min="2"
              max="98"
              step="0.5"
              value={target}
              disabled={rolling}
              onChange={(e) => setTarget(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg mt-1"
            />

            {/* Condition toggle button */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setCondition(condition === 'under' ? 'over' : 'under')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all flex items-center gap-2"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modo: {condition === 'under' ? 'Rolar Abaixo' : 'Rolar Acima'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
