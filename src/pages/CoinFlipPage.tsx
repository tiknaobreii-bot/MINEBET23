import React, { useState } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Gem, Coins, Play, Sparkles } from 'lucide-react';

interface CoinFlipPageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

export const CoinFlipPage: React.FC<CoinFlipPageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [choice, setChoice] = useState<'gold' | 'diamond'>('diamond');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [flipping, setFlipping] = useState(false);
  const [currentFace, setCurrentFace] = useState<'gold' | 'diamond'>('diamond');
  const [flipAnimation, setFlipAnimation] = useState<string>('');
  const [lastResult, setLastResult] = useState<{
    outcome: 'gold' | 'diamond';
    win: boolean;
    payout: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFlip = async () => {
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
      setFlipping(true);
      setLastResult(null);
      sounds.playChip();

      // Trigger 3D flip animation
      setFlipAnimation(choice === 'gold' ? 'animate-coin-gold' : 'animate-coin-diamond');
      
      const flipTicks = setInterval(() => {
        sounds.playCoinTick();
      }, 180);

      // Call server roll
      const res = await api.playCoinFlip(choice, betAmount);

      setTimeout(() => {
        clearInterval(flipTicks);
        setFlipping(false);
        setFlipAnimation('');
        setCurrentFace(res.outcome);
        setLastResult({
          outcome: res.outcome,
          win: res.win,
          payout: res.payout,
        });

        if (res.win) {
          sounds.playWin();
        }

        onBalanceUpdate(res.newBalance);
      }, 2200);

    } catch (err: any) {
      setFlipping(false);
      setFlipAnimation('');
      setError(err.message || 'Erro ao apostar no Coin Flip.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      
      {/* 3D Coin Flip Arena */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-radial from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

        {/* The 3D Coin Object */}
        <div className="perspective-1000 my-6">
          <div
            className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 relative ${flipAnimation} ${
              currentFace === 'diamond'
                ? 'bg-gradient-to-tr from-cyan-600 via-sky-400 to-cyan-200 border-4 border-cyan-300 shadow-cyan-500/40 glow-diamond'
                : 'bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-yellow-200 shadow-amber-500/40'
            }`}
          >
            {/* Center Icon */}
            {currentFace === 'diamond' ? (
              <div className="flex flex-col items-center justify-center">
                <Gem className="w-16 h-16 text-slate-950 drop-shadow-md" />
                <span className="font-display font-extrabold text-xs text-slate-950 uppercase tracking-wider mt-1">
                  DIAMANTE
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Coins className="w-16 h-16 text-slate-950 drop-shadow-md" />
                <span className="font-display font-extrabold text-xs text-slate-950 uppercase tracking-wider mt-1">
                  OURO
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Result message */}
        {lastResult && !flipping && (
          <div className="text-center animate-in zoom-in-95">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${
              lastResult.win
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-950/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {lastResult.win ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>DEU {lastResult.outcome === 'diamond' ? 'DIAMANTE' : 'OURO'}! VOCÊ GANHOU +{lastResult.payout} 💎</span>
                </>
              ) : (
                <span>DEU {lastResult.outcome === 'diamond' ? 'DIAMANTE' : 'OURO'}. Tente novamente!</span>
              )}
            </div>
          </div>
        )}

        {flipping && (
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 animate-pulse mt-2">
            A moeda está girando no ar...
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium text-center">
          {error}
        </div>
      )}

      {/* Choice Selector: Ouro (2x) vs Diamante (2x) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Diamond Choice */}
        <button
          type="button"
          disabled={flipping}
          onClick={() => {
            setChoice('diamond');
            sounds.playChip();
          }}
          className={`p-6 rounded-2xl border transition-all text-left relative group ${
            choice === 'diamond'
              ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-400/50'
              : 'bg-[#101522] border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-950/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold text-cyan-300 uppercase flex items-center gap-2.5">
              <Gem className="w-5 h-5 text-cyan-400" />
              Bloco de Diamante
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono">
              2x
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Dobra sua aposta se der Diamante</p>
        </button>

        {/* Gold Choice */}
        <button
          type="button"
          disabled={flipping}
          onClick={() => {
            setChoice('gold');
            sounds.playChip();
          }}
          className={`p-6 rounded-2xl border transition-all text-left relative group ${
            choice === 'gold'
              ? 'bg-amber-950/40 border-amber-400 shadow-xl shadow-amber-950/50 ring-2 ring-amber-400/50'
              : 'bg-[#101522] border-slate-800 hover:border-amber-500/40 hover:bg-amber-950/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold text-amber-300 uppercase flex items-center gap-2.5">
              <Coins className="w-5 h-5 text-amber-400" />
              Bloco de Ouro
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
              2x
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Dobra sua aposta se der Ouro</p>
        </button>
      </div>

      {/* Betting Amount Controls */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Valor da Aposta (Diamantes):
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={betAmount}
              disabled={flipping}
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
              disabled={flipping}
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
            disabled={flipping}
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
          disabled={flipping}
          onClick={handleFlip}
          className="w-full md:w-48 py-3.5 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-display font-extrabold text-base tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {flipping ? (
            <span>GIRANDO...</span>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>JOGAR MOEDA</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
