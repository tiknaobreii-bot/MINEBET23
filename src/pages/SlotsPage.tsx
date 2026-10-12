import React, { useState } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Dices, Play, Sparkles, Info, Trophy } from 'lucide-react';

interface SlotsPageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

const SYMBOLS_INFO: Record<string, { icon: string; name: string; mult: string }> = {
  diamond: { icon: '💎', name: 'Diamante', mult: '50x' },
  sword: { icon: '🗡️', name: 'Espada Netherite', mult: '25x' },
  star: { icon: '🌟', name: 'Estrela do Nether', mult: '15x' },
  apple: { icon: '🍏', name: 'Maçã Dourada', mult: '8x' },
  gold: { icon: '🪙', name: 'Barra de Ouro', mult: '5x' },
  pickaxe: { icon: '⛏️', name: 'Picareta de Ferro', mult: '3x' },
};

export const SlotsPage: React.FC<SlotsPageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [reels, setReels] = useState<string[]>(['diamond', 'sword', 'star']);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    multiplier: number;
    win: boolean;
    payout: number;
  } | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpin = async () => {
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
      setSpinning(true);
      setLastResult(null);
      sounds.playChip();

      // Quick reel roll sound
      const rollTicks = setInterval(() => {
        sounds.playRouletteTick();
      }, 100);

      const res = await api.spinSlots(betAmount);

      setTimeout(() => {
        clearInterval(rollTicks);
        setSpinning(false);
        setReels(res.reels);
        setLastResult({
          multiplier: res.multiplier,
          win: res.win,
          payout: res.payout,
        });

        if (res.win) {
          if (res.multiplier >= 25) sounds.playJackpot();
          else sounds.playWin();
        }

        onBalanceUpdate(res.newBalance);
      }, 1800);

    } catch (err: any) {
      setSpinning(false);
      setError(err.message || 'Erro ao girar os slots.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      
      {/* Slot Machine Frame */}
      <div className="bg-gradient-to-b from-[#131924] via-[#0b0e14] to-[#070a0e] border-2 border-cyan-500/30 rounded-3xl p-6 lg:p-8 flex flex-col items-center justify-center min-h-[380px] relative shadow-2xl shadow-cyan-950/40">
        
        {/* Top Machine Marquee */}
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-display text-lg font-extrabold text-white tracking-wider uppercase">
              CASSINO SLOTS MINECRAFT
            </h3>
          </div>

          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tabela de Prêmios</span>
          </button>
        </div>

        {/* 3 Reels Display */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-lg my-3">
          {reels.map((symbolId, idx) => {
            const sym = SYMBOLS_INFO[symbolId] || SYMBOLS_INFO['diamond'];
            return (
              <div
                key={idx}
                className={`h-36 md:h-44 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner ${
                  spinning
                    ? 'border-cyan-500/50 animate-pulse'
                    : lastResult?.win
                    ? 'border-emerald-500 shadow-emerald-500/30 ring-2 ring-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className={`text-5xl md:text-6xl select-none transition-transform ${
                  spinning ? 'animate-bounce blur-[1px]' : 'scale-100'
                }`}>
                  {sym.icon}
                </div>
                <span className="font-display font-bold text-[11px] md:text-xs text-slate-300 uppercase tracking-wider mt-2">
                  {sym.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Result outcome notification */}
        {lastResult && !spinning && (
          <div className="mt-4 text-center animate-in zoom-in-95">
            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold ${
              lastResult.win
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-950/40'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700'
            }`}>
              {lastResult.win ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>JACKPOT! COMBINAÇÃO DE {lastResult.multiplier}X: +{lastResult.payout} DIAMANTES!</span>
                </>
              ) : (
                <span>Não foi dessa vez. Gire novamente!</span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Paytable Drawer / Modal view */}
      {showPaytable && (
        <div className="bg-[#101522] border border-cyan-500/30 rounded-2xl p-5 animate-in fade-in">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Tabela de Multiplicadores (3 Símbolos Iguais)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(SYMBOLS_INFO).map(([id, info]) => (
              <div key={id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                <span className="text-3xl block mb-1">{info.icon}</span>
                <span className="text-[11px] font-semibold text-slate-300 block truncate">{info.name}</span>
                <span className="text-xs font-bold text-cyan-400 font-mono mt-1 block">{info.mult}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium text-center">
          {error}
        </div>
      )}

      {/* Betting Controls */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Valor por Giro (Diamantes):
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={betAmount}
              disabled={spinning}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute right-3.5 top-3.5 text-base">💎</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-center w-full md:w-auto">
          {[5, 10, 50, 100].map((val) => (
            <button
              key={val}
              type="button"
              disabled={spinning}
              onClick={() => {
                setBetAmount((p) => p + val);
                sounds.playChip();
              }}
              className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white"
            >
              +{val}
            </button>
          ))}
          <button
            type="button"
            disabled={spinning}
            onClick={() => {
              if (player) setBetAmount(player.balance);
              sounds.playChip();
            }}
            className="px-2.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-400"
          >
            MAX
          </button>
        </div>

        <button
          type="button"
          disabled={spinning}
          onClick={handleSpin}
          className="w-full md:w-48 py-3.5 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-display font-extrabold text-base tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {spinning ? (
            <span>GIRANDO...</span>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>GIRAR SLOTS</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
