import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Play, Sparkles, ShieldCheck, Flame } from 'lucide-react';

interface PlinkoPageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

const MULTIPLIERS_MAP: Record<string, Record<string, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  12: {
    low: [8.9, 3, 1.4, 1.1, 1, 0.5, 0.5, 1, 1.1, 1.4, 3, 8.9],
    medium: [24, 8.1, 2, 1.5, 0.7, 0.4, 0.4, 0.7, 1.5, 2, 8.1, 24],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

interface Ball {
  id: string;
  x: number;
  y: number;
  row: number;
  targetCol: number;
  path: number[];
  color: string;
}

export const PlinkoPage: React.FC<PlinkoPageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [rows, setRows] = useState<8 | 12 | 16>(12);
  const [dropping, setDropping] = useState<boolean>(false);
  const [lastMultiplier, setLastMultiplier] = useState<number | null>(null);
  const [recentSlots, setRecentSlots] = useState<number[]>([2, 1.5, 0.7, 8.1, 0.4, 24]);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeBalls = useRef<Ball[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const multipliers = MULTIPLIERS_MAP[rows][risk];

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const startY = 40;
      const bottomY = height - 50;
      const rowHeight = (bottomY - startY) / rows;

      // Draw Pegs (Pins)
      for (let r = 0; r <= rows; r++) {
        const pinCount = r + 3;
        const spacing = (width * 0.85) / (rows + 3);
        const y = startY + r * rowHeight;
        const startX = (width - (pinCount - 1) * spacing) / 2;

        for (let i = 0; i < pinCount; i++) {
          const x = startX + i * spacing;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#64748b';
          ctx.fill();
        }
      }

      // Draw active dropping balls
      const survivingBalls: Ball[] = [];
      for (const ball of activeBalls.current) {
        ball.y += 2.8;

        // Determine current row
        const currentRow = Math.floor((ball.y - startY) / rowHeight);
        if (currentRow < rows) {
          const pinCount = currentRow + 3;
          const spacing = (width * 0.85) / (rows + 3);
          const startX = (width - (pinCount - 1) * spacing) / 2;
          
          let colIndex = 0;
          for (let p = 0; p <= currentRow && p < ball.path.length; p++) {
            colIndex += ball.path[p];
          }
          const targetX = startX + colIndex * spacing + spacing / 2;
          ball.x += (targetX - ball.x) * 0.15;
          survivingBalls.push(ball);

          // Ball draw
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.shadowColor = ball.color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      activeBalls.current = survivingBalls;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [rows, risk]);

  const handleDrop = async () => {
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
      setDropping(true);
      sounds.playChip();

      const res = await api.dropPlinko(betAmount, risk, rows);

      // Add ball into animated canvas
      const newBall: Ball = {
        id: Math.random().toString(),
        x: (canvasRef.current?.width || 500) / 2,
        y: 20,
        row: 0,
        targetCol: res.slotIndex,
        path: res.path,
        color: res.multiplier >= 10 ? '#38bdf8' : res.multiplier >= 2 ? '#34d399' : '#f59e0b',
      };
      activeBalls.current.push(newBall);

      // Sound ticks as it drops
      const dropTimer = setTimeout(() => {
        setDropping(false);
        setLastMultiplier(res.multiplier);
        setRecentSlots((prev) => [res.multiplier, ...prev.slice(0, 7)]);
        if (res.multiplier >= 10) sounds.playJackpot();
        else if (res.multiplier >= 1.5) sounds.playWin();
        onBalanceUpdate(res.newBalance);
      }, 2600);

    } catch (err: any) {
      setDropping(false);
      setError(err.message || 'Erro ao soltar bola no Plinko.');
    }
  };

  const getSlotColor = (m: number) => {
    if (m >= 100) return 'bg-rose-600 text-white shadow-rose-500/50';
    if (m >= 20) return 'bg-amber-600 text-white shadow-amber-500/40';
    if (m >= 4) return 'bg-yellow-500 text-slate-950 font-extrabold';
    if (m >= 1.5) return 'bg-emerald-600 text-white';
    if (m >= 1) return 'bg-slate-700 text-slate-200';
    return 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      {/* Plinko Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Controls */}
        <div className="lg:col-span-5 bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
              PLINKO DE DIAMANTES
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ORIGINAL BLAZE
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
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3.5 top-3 text-sm">💎</span>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setBetAmount((p) => Math.max(1, Math.floor(p / 2)))}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                ½
              </button>
              <button
                type="button"
                onClick={() => setBetAmount((p) => p * 2)}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                2X
              </button>
              <button
                type="button"
                onClick={() => { if (player) setBetAmount(player.balance); }}
                className="flex-1 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-400"
              >
                MÁX
              </button>
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nível de Risco:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRisk(r); sounds.playChip(); }}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                    risk === r
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {r === 'low' ? 'Baixo' : r === 'medium' ? 'Médio' : 'Alto'}
                </button>
              ))}
            </div>
          </div>

          {/* Rows Count */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Número de Linhas (Pinos):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([8, 12, 16] as const).map((rw) => (
                <button
                  key={rw}
                  type="button"
                  onClick={() => { setRows(rw); sounds.playChip(); }}
                  className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                    rows === rw
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {rw} Linhas
                </button>
              ))}
            </div>
          </div>

          {/* Drop Button */}
          <button
            type="button"
            onClick={handleDrop}
            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-base tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>SOLTAR DIAMANTE</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>Física e resultados processados no servidor</span>
          </div>
        </div>

        {/* Right Side: Plinko Canvas Arena */}
        <div className="lg:col-span-7 bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between min-h-[490px] shadow-2xl relative overflow-hidden">
          
          {/* Recent Multipliers Bar */}
          <div className="flex items-center gap-1.5 w-full justify-end mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Recentes:</span>
            {recentSlots.map((m, idx) => (
              <span
                key={idx}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${getSlotColor(m)}`}
              >
                {m}x
              </span>
            ))}
          </div>

          {/* Dynamic Canvas */}
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            className="w-full h-auto max-h-[360px] block"
          />

          {/* Multiplier Bins at Bottom */}
          <div className="flex items-center gap-1 w-full justify-center overflow-x-auto pt-2">
            {multipliers.map((m, idx) => (
              <div
                key={idx}
                className={`flex-1 min-w-[28px] max-w-[42px] py-1.5 rounded-lg text-center font-display font-bold text-[10px] sm:text-xs transition-transform ${getSlotColor(m)}`}
              >
                {m}x
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
