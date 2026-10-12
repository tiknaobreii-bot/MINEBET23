import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Rocket, Sparkles, AlertTriangle, ArrowUpRight, Flame } from 'lucide-react';

interface CrashPageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

export const CrashPage: React.FC<CrashPageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashout, setAutoCashout] = useState<string>('2.00');
  
  // Game state: 'idle' | 'flying' | 'cashed_out' | 'crashed'
  const [gameState, setGameState] = useState<'idle' | 'flying' | 'cashed_out' | 'crashed'>('idle');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [crashPoint, setCrashPoint] = useState<number>(0);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  const [profitWon, setProfitWon] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<number[]>([1.45, 2.10, 1.15, 8.40, 1.95, 3.20, 1.05, 14.50, 2.80, 1.30]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleStartFlight = async () => {
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
      setGameState('flying');
      setCurrentMultiplier(1.00);
      setCashedOutAt(null);
      setProfitWon(0);
      sounds.playChip();

      const numAuto = parseFloat(autoCashout);
      const res = await api.startCrash(betAmount, isNaN(numAuto) ? undefined : numAuto);
      
      onBalanceUpdate(res.newBalance);
      setActiveRoundId(res.roundId);
      setCrashPoint(res.crashPoint);

      startTimeRef.current = performance.now();
      runFlightLoop(res.roundId, res.crashPoint, numAuto);
    } catch (err: any) {
      setGameState('idle');
      setError(err.message || 'Erro ao iniciar voo.');
    }
  };

  const runFlightLoop = (roundId: string, targetCrash: number, autoCash?: number) => {
    const loop = (timestamp: number) => {
      const elapsedSeconds = (timestamp - startTimeRef.current) / 1000;
      
      // Multiplier formula: smooth, slowed down exponential climb so players can react and cash out
      const mult = +(1.00 * Math.exp(0.065 * elapsedSeconds)).toFixed(2);

      // Check if auto cashout reached
      if (autoCash && !isNaN(autoCash) && mult >= autoCash && targetCrash >= autoCash) {
        handleCashoutManual(roundId, autoCash);
        return;
      }

      // Check if crashed
      if (mult >= targetCrash) {
        // Crashed!
        setCurrentMultiplier(targetCrash);
        setGameState('crashed');
        sounds.playCrashExplosion();
        setHistory((prev) => [targetCrash, ...prev.slice(0, 11)]);
        api.finishLostCrash(roundId).then((r) => onBalanceUpdate(r.newBalance));
        drawGraph(targetCrash, true);
        return;
      }

      setCurrentMultiplier(mult);
      drawGraph(mult, false);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const handleCashoutManual = async (roundId = activeRoundId, multToCash = currentMultiplier) => {
    if (!roundId || gameState !== 'flying') return;

    try {
      const res = await api.cashoutCrash(roundId, multToCash);
      if (res.success) {
        setGameState('cashed_out');
        setCashedOutAt(multToCash);
        setProfitWon(res.profit);
        sounds.playCashout();
        onBalanceUpdate(res.newBalance);
      } else {
        setGameState('crashed');
        sounds.playCrashExplosion();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Canvas drawing for glowing curve and Elytra rocket
  const drawGraph = (mult: number, isCrashed: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw subtle grid lines
    ctx.strokeStyle = '#1e293b22';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
    }
    for (let y = height - 60; y > 20; y -= 50) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Normalized progress based on multiplier
    const progress = Math.min(1, (mult - 1) / 8);
    const startX = 40;
    const startY = height - 40;
    const endX = startX + (width - 80) * Math.min(0.9, 0.2 + progress * 0.7);
    const endY = startY - (height - 80) * Math.min(0.85, progress);

    // Draw Area gradient under curve
    const gradient = ctx.createLinearGradient(0, endY, 0, startY);
    if (isCrashed) {
      gradient.addColorStop(0, 'rgba(244, 63, 94, 0.25)');
      gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    }

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + endX) / 2, startY, endX, endY);
    ctx.lineTo(endX, startY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Curve line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + endX) / 2, startY, endX, endY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = isCrashed ? '#f43f5e' : '#22d3ee';
    ctx.shadowColor = isCrashed ? '#f43f5e' : '#22d3ee';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Rocket / Elytra Head Point
    ctx.beginPath();
    ctx.arc(endX, endY, isCrashed ? 8 : 6, 0, Math.PI * 2);
    ctx.fillStyle = isCrashed ? '#ef4444' : '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isCrashed ? '#7f1d1d' : '#0891b2';
    ctx.stroke();
  };

  // Redraw idle canvas on mount or reset
  useEffect(() => {
    if (gameState === 'idle') {
      drawGraph(1.00, false);
    }
  }, [gameState]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      {/* Recent Crash Multipliers Bar */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
          Histórico Recente:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {history.map((m, idx) => {
            const isHigh = m >= 10;
            const isMedium = m >= 2;
            return (
              <span
                key={idx}
                className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg shrink-0 border ${
                  isHigh
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : isMedium
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {m.toFixed(2)}x
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Canvas Arena */}
      <div className="relative bg-[#090d14] border border-slate-800 rounded-3xl p-6 overflow-hidden shadow-2xl min-h-[360px] flex items-center justify-center">
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={320}
          className="w-full h-auto max-h-[320px] block"
        />

        {/* Center Live Multiplier Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {gameState === 'crashed' ? (
            <div className="text-center animate-in zoom-in-95">
              <span className="font-display text-5xl md:text-7xl font-extrabold text-rose-500 tracking-tight drop-shadow-[0_0_25px_rgba(244,63,94,0.7)]">
                {currentMultiplier.toFixed(2)}x
              </span>
              <span className="block text-sm md:text-base font-bold uppercase tracking-wider text-rose-400 mt-2 flex items-center justify-center gap-2">
                <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
                CRASHOU! APOSTA ENCERRADA
              </span>
            </div>
          ) : gameState === 'cashed_out' ? (
            <div className="text-center animate-in zoom-in-95">
              <span className="font-display text-5xl md:text-7xl font-extrabold text-emerald-400 tracking-tight drop-shadow-[0_0_25px_rgba(52,211,153,0.7)]">
                {cashedOutAt?.toFixed(2)}x
              </span>
              <span className="block text-sm md:text-base font-bold uppercase tracking-wider text-emerald-300 mt-2 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                LUCRO DE +{profitWon} DIAMANTES!
              </span>
            </div>
          ) : (
            <div className="text-center">
              <span className={`font-display text-5xl md:text-7xl font-extrabold tracking-tight transition-all ${
                gameState === 'flying'
                  ? 'text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.8)] scale-105'
                  : 'text-slate-400'
              }`}>
                {currentMultiplier.toFixed(2)}x
              </span>
              <span className="block text-xs uppercase tracking-widest text-slate-500 mt-1 font-semibold">
                {gameState === 'flying' ? 'FOGUETE EM ASCENSÃO...' : 'AGUARDANDO APOSTA'}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium text-center">
          {error}
        </div>
      )}

      {/* Crash Controls (Blaze style) */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        
        {/* Bet Amount */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Quantia da Aposta (Diamantes):
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={betAmount}
              disabled={gameState === 'flying'}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute right-3.5 top-3.5 text-base">💎</span>
          </div>
          
          <div className="flex gap-1.5 mt-2">
            {[5, 25, 50, 100].map((v) => (
              <button
                key={v}
                type="button"
                disabled={gameState === 'flying'}
                onClick={() => setBetAmount((p) => p + v)}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                +{v}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Cashout */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Auto-Encerrar em (Multiplicador):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="1.01"
              value={autoCashout}
              disabled={gameState === 'flying'}
              onChange={(e) => setAutoCashout(e.target.value)}
              placeholder="Ex: 2.00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute right-3.5 top-3.5 text-slate-500 font-bold text-sm">X</span>
          </div>

          <div className="flex gap-1.5 mt-2">
            {['1.50', '2.00', '3.00', '5.00'].map((m) => (
              <button
                key={m}
                type="button"
                disabled={gameState === 'flying'}
                onClick={() => setAutoCashout(m)}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                {m}x
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div>
          {gameState === 'flying' ? (
            <button
              type="button"
              onClick={() => handleCashoutManual()}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-display font-extrabold text-base tracking-wider uppercase rounded-xl shadow-xl shadow-emerald-950/60 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse"
            >
              <span>ENCERRAR APOSTA</span>
              <span className="text-xs font-sans font-bold text-slate-900">
                Sacar {Math.floor(betAmount * currentMultiplier)} 💎
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartFlight}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-display font-extrabold text-base tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5 fill-current" />
              <span>INICIAR VOO</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
