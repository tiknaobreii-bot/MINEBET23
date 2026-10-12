import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Gem, CircleDot, Play, AlertCircle, Sparkles } from 'lucide-react';

interface RoulettePageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

// 0 = White/Diamond, 1-7 = Red, 8-14 = Black
const ROULETTE_ORDER = [0, 11, 5, 10, 6, 9, 7, 8, 1, 14, 2, 13, 3, 12, 4];

function getNumberColor(num: number): 'white' | 'red' | 'black' {
  if (num === 0) return 'white';
  if (num >= 1 && num <= 7) return 'red';
  return 'black';
}

export const RoulettePage: React.FC<RoulettePageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [betType, setBetType] = useState<'red' | 'white' | 'black'>('red');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<{
    rollNumber: number;
    rollColor: 'red' | 'white' | 'black';
    win: boolean;
    payout: number;
  } | null>(null);
  const [recentRolls, setRecentRolls] = useState<Array<{ number: number; color: 'red' | 'white' | 'black' }>>([
    { number: 2, color: 'red' },
    { number: 11, color: 'black' },
    { number: 7, color: 'red' },
    { number: 0, color: 'white' },
    { number: 14, color: 'black' },
    { number: 5, color: 'red' },
    { number: 9, color: 'black' },
    { number: 1, color: 'red' },
    { number: 12, color: 'black' },
    { number: 3, color: 'red' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Generates repeated strip for seamless continuous scrolling across dozens of numbers
  const stripNumbers = Array.from({ length: 24 }, () => ROULETTE_ORDER).flat();

  const handleChip = (val: number) => {
    setBetAmount((prev) => Math.max(1, prev + val));
    sounds.playChip();
  };

  const handleDouble = () => {
    setBetAmount((prev) => Math.max(1, prev * 2));
    sounds.playChip();
  };

  const handleHalf = () => {
    setBetAmount((prev) => Math.max(1, Math.floor(prev / 2)));
    sounds.playChip();
  };

  const handleMax = () => {
    if (player) {
      setBetAmount(player.balance);
      sounds.playChip();
    }
  };

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
      setRolling(true);
      setLastResult(null);
      sounds.playChip();

      // Call server roll
      const res = await api.rollRoulette(betType, betAmount);

      // Perform spinning carousel animation: spins much more across the wheel!
      if (carouselRef.current) {
        const itemWidth = 72; // width in pixels
        const targetNumber = res.rollNumber;
        
        // Reset position seamlessly before starting a new spin to repetition 2
        const prevTargetLocalIndex = lastResult ? ROULETTE_ORDER.indexOf(lastResult.rollNumber) : 0;
        const resetIndex = (2 * ROULETTE_ORDER.length) + (prevTargetLocalIndex >= 0 ? prevTargetLocalIndex : 0);
        const resetPosition = (resetIndex * itemWidth) - (carouselRef.current.clientWidth / 2) + (itemWidth / 2);
        
        carouselRef.current.style.transition = 'none';
        carouselRef.current.style.transform = `translateX(-${resetPosition}px)`;
        // Force reflow
        void carouselRef.current.offsetHeight;

        // Target at repetition 16 (spins across 200+ numbers before stopping!)
        const repetitionIndex = 16;
        const targetLocalIndex = ROULETTE_ORDER.indexOf(targetNumber);
        const totalTargetIndex = (repetitionIndex * ROULETTE_ORDER.length) + targetLocalIndex;
        
        // Slight random offset inside the tile for organic feel
        const randomOffset = (Math.random() - 0.5) * 16;
        const scrollPosition = (totalTargetIndex * itemWidth) - (carouselRef.current.clientWidth / 2) + (itemWidth / 2) + randomOffset;

        // Long cinematic spin: 6.5s duration with smooth realistic deceleration
        carouselRef.current.style.transition = 'transform 6.5s cubic-bezier(0.1, 0.96, 0.15, 1)';
        carouselRef.current.style.transform = `translateX(-${scrollPosition}px)`;

        // Play ticking sounds that start fast and decelerate naturally
        let currentInterval = 70;
        let tickTimer: any = null;
        let active = true;
        const startTicking = () => {
          if (!active) return;
          sounds.playRouletteTick();
          currentInterval = Math.min(480, currentInterval + 10);
          tickTimer = setTimeout(startTicking, currentInterval);
        };
        tickTimer = setTimeout(startTicking, currentInterval);

        setTimeout(() => {
          active = false;
          if (tickTimer) clearTimeout(tickTimer);
          setRolling(false);
          setLastResult({
            rollNumber: res.rollNumber,
            rollColor: res.rollColor,
            win: res.win,
            payout: res.payout,
          });

          if (res.win) {
            if (res.rollColor === 'white') sounds.playJackpot();
            else sounds.playWin();
          }

          onBalanceUpdate(res.newBalance);
          setRecentRolls((prev) => [{ number: res.rollNumber, color: res.rollColor }, ...prev.slice(0, 14)]);
        }, 6600);
      }
    } catch (err: any) {
      setRolling(false);
      setError(err.message || 'Erro ao realizar aposta.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      {/* Top Recent Rolls Bar */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
          Últimas Rodadas:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {recentRolls.map((roll, idx) => (
            <div
              key={idx}
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-sm ${
                roll.color === 'white'
                  ? 'bg-gradient-to-br from-cyan-400 to-white text-slate-950 font-extrabold shadow-cyan-500/40'
                  : roll.color === 'red'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 border border-slate-700 text-slate-200'
              }`}
            >
              {roll.color === 'white' ? '💎' : roll.number}
            </div>
          ))}
        </div>
      </div>

      {/* Main Roulette Strip Carousel (Blaze Double style) */}
      <div className="relative bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 overflow-hidden shadow-2xl">
        {/* Center Target Indicator line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-cyan-400 z-20 shadow-[0_0_15px_rgba(6,182,212,0.9)] pointer-events-none">
          <div className="absolute top-2 -translate-x-1/2 left-1/2 w-3 h-3 bg-cyan-400 rotate-45" />
          <div className="absolute bottom-2 -translate-x-1/2 left-1/2 w-3 h-3 bg-cyan-400 rotate-45" />
        </div>

        {/* Carousel Window */}
        <div className="overflow-hidden w-full py-4 mask-radial">
          <div
            ref={carouselRef}
            className="flex items-center gap-2 will-change-transform"
            style={{ transform: 'translateX(0px)' }}
          >
            {stripNumbers.map((num, i) => {
              const color = getNumberColor(num);
              return (
                <div
                  key={i}
                  className={`w-16 h-18 shrink-0 rounded-xl flex flex-col items-center justify-center font-display font-bold transition-all shadow-md ${
                    color === 'white'
                      ? 'bg-gradient-to-br from-cyan-400 via-sky-200 to-white text-slate-950 shadow-cyan-400/50'
                      : color === 'red'
                      ? 'bg-gradient-to-b from-rose-600 to-rose-700 text-white border border-rose-500/40'
                      : 'bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200 border border-slate-800'
                  }`}
                >
                  {color === 'white' ? (
                    <Gem className="w-6 h-6 text-slate-950 animate-bounce" />
                  ) : (
                    <span className="text-xl">{num}</span>
                  )}
                  <span className="text-[10px] uppercase font-sans font-semibold opacity-75">
                    {color === 'white' ? '14x' : '2x'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outcome result splash */}
        {lastResult && (
          <div className="mt-3 text-center animate-in fade-in zoom-in-95">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${
              lastResult.win 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-950/40' 
                : 'bg-slate-800/80 text-slate-400 border border-slate-700'
            }`}>
              {lastResult.win ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>VOCÊ GANHOU +{lastResult.payout} DIAMANTES!</span>
                </>
              ) : (
                <span>O resultado foi {lastResult.rollColor === 'white' ? 'Diamante (0)' : lastResult.rollColor === 'red' ? `Vermelho (${lastResult.rollNumber})` : `Preto (${lastResult.rollNumber})`}. Tente novamente!</span>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium text-center">
          {error}
        </div>
      )}

      {/* Betting Zones: Red (2x), White (14x), Black (2x) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Red Box */}
        <button
          type="button"
          disabled={rolling}
          onClick={() => {
            setBetType('red');
            sounds.playChip();
          }}
          className={`p-5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
            betType === 'red'
              ? 'bg-rose-950/40 border-rose-500 shadow-xl shadow-rose-950/40 ring-2 ring-rose-500/50'
              : 'bg-[#101522] border-slate-800 hover:border-rose-500/40 hover:bg-rose-950/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-base font-bold text-white uppercase flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500" />
              Vermelho
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
              2x
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Números de 1 a 7</p>
        </button>

        {/* White / Diamond Box */}
        <button
          type="button"
          disabled={rolling}
          onClick={() => {
            setBetType('white');
            sounds.playChip();
          }}
          className={`p-5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
            betType === 'white'
              ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-400/50'
              : 'bg-[#101522] border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-950/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-base font-bold text-cyan-300 uppercase flex items-center gap-2">
              <Gem className="w-4 h-4 text-cyan-400" />
              Diamante
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono shadow-sm">
              10x
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Número 0 (Maior Prêmio!)</p>
        </button>

        {/* Black Box */}
        <button
          type="button"
          disabled={rolling}
          onClick={() => {
            setBetType('black');
            sounds.playChip();
          }}
          className={`p-5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
            betType === 'black'
              ? 'bg-slate-900 border-slate-600 shadow-xl shadow-slate-950/40 ring-2 ring-slate-500/50'
              : 'bg-[#101522] border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-base font-bold text-white uppercase flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-700 border border-slate-500" />
              Preto
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              2x
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Números de 8 a 14</p>
        </button>
      </div>

      {/* Betting Controls & Amount Selection */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Amount Input */}
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Valor da Aposta em Diamantes:
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={betAmount}
              disabled={rolling}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute right-3.5 top-3.5 text-base">💎</span>
          </div>
        </div>

        {/* Chips and Math Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center w-full md:w-auto">
          {[1, 5, 10, 50, 100].map((val) => (
            <button
              key={val}
              type="button"
              disabled={rolling}
              onClick={() => handleChip(val)}
              className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white transition-all active:scale-95"
            >
              +{val}
            </button>
          ))}
          <button
            type="button"
            disabled={rolling}
            onClick={handleHalf}
            className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
          >
            ½
          </button>
          <button
            type="button"
            disabled={rolling}
            onClick={handleDouble}
            className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
          >
            2X
          </button>
          <button
            type="button"
            disabled={rolling}
            onClick={handleMax}
            className="px-2.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-400"
          >
            MAX
          </button>
        </div>

        {/* Primary Play Button */}
        <button
          type="button"
          disabled={rolling}
          onClick={handleSpin}
          className="w-full md:w-48 py-3.5 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-display font-extrabold text-base tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {rolling ? (
            <span>GIRANDO...</span>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>GIRAR ROLETA</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
};
