import React, { useState } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Play, Sparkles, ShieldCheck, Flame, ArrowUp } from 'lucide-react';

interface TowerPageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

const TOWER_MULTIPLIERS = [1.30, 1.75, 2.35, 3.15, 4.25, 5.75, 7.80, 10.50];

export const TowerPage: React.FC<TowerPageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentFloor, setCurrentFloor] = useState<number>(0); // 0 to 7
  const [chosenHistory, setChosenHistory] = useState<Array<{ floor: number; picked: number; hitTrap: boolean }>>([]);
  const [lastWinProfit, setLastWinProfit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
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
      setLastWinProfit(null);
      setChosenHistory([]);
      sounds.playChip();

      const res = await api.startTower(betAmount);
      setActiveGameId(res.gameId);
      setIsPlaying(true);
      setCurrentFloor(0);
      onBalanceUpdate(res.newBalance);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar Torre.');
    }
  };

  const handleBlockPick = async (blockIndex: number) => {
    if (!isPlaying || !activeGameId) return;

    try {
      const res = await api.stepTower(activeGameId, blockIndex);

      if (res.hitTrap) {
        // Lava trap!
        sounds.playCrashExplosion();
        setChosenHistory((prev) => [...prev, { floor: res.floor, picked: blockIndex, hitTrap: true }]);
        setIsPlaying(false);
        setActiveGameId(null);
        onBalanceUpdate(res.newBalance);
      } else {
        // Safe step!
        sounds.playWin();
        setChosenHistory((prev) => [...prev, { floor: res.floor - 1, picked: blockIndex, hitTrap: false }]);
        setCurrentFloor(res.floor);

        if (res.completed) {
          sounds.playJackpot();
          setIsPlaying(false);
          setActiveGameId(null);
          setLastWinProfit(res.profit || 0);
          onBalanceUpdate(res.newBalance);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || !activeGameId || currentFloor === 0) return;

    try {
      const res = await api.cashoutTower(activeGameId);
      sounds.playCashout();
      setIsPlaying(false);
      setActiveGameId(null);
      setLastWinProfit(res.profit);
      onBalanceUpdate(res.newBalance);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const currentMult = currentFloor > 0 ? TOWER_MULTIPLIERS[currentFloor - 1] : 1.0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Controls */}
        <div className="lg:col-span-5 bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              TORRE DO NETHER
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ORIGINAL MINEBET
            </span>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

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
                disabled={isPlaying}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3.5 top-3 text-sm">💎</span>
            </div>

            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                disabled={isPlaying}
                onClick={() => setBetAmount((p) => Math.max(1, Math.floor(p / 2)))}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                ½
              </button>
              <button
                type="button"
                disabled={isPlaying}
                onClick={() => setBetAmount((p) => p * 2)}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                2X
              </button>
              <button
                type="button"
                disabled={isPlaying}
                onClick={() => { if (player) setBetAmount(player.balance); }}
                className="flex-1 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-400"
              >
                MÁX
              </button>
            </div>
          </div>

          {isPlaying && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Andar Atual:</span>
                <span className="font-mono font-bold text-white">{currentFloor} de 8</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Multiplicador Atual:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{currentMult.toFixed(2)}x</span>
              </div>
            </div>
          )}

          {isPlaying ? (
            <button
              type="button"
              disabled={currentFloor === 0}
              onClick={handleCashout}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 text-slate-950 font-display font-black text-base tracking-wider uppercase rounded-xl shadow-xl shadow-emerald-950/40 transition-all flex flex-col items-center justify-center animate-pulse"
            >
              <span>ENCERRAR APOSTA</span>
              <span className="text-xs font-sans font-bold text-slate-900">
                Sacar {Math.floor(betAmount * currentMult)} 💎
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-base tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>SUBIR NA TORRE</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>8 andares com 1 armadilha de lava em cada</span>
          </div>
        </div>

        {/* Right Side: Tower Floors */}
        <div className="lg:col-span-7 bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[460px] shadow-2xl relative">
          
          {lastWinProfit !== null && !isPlaying && (
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold animate-in zoom-in-95">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>VOCÊ GANHOU +{lastWinProfit} DIAMANTES NA TORRE!</span>
            </div>
          )}

          {/* 8 Floors Stacked from 7 down to 0 */}
          <div className="flex flex-col-reverse gap-2 w-full max-w-md">
            {TOWER_MULTIPLIERS.map((mult, floorIdx) => {
              const isCurrent = isPlaying && currentFloor === floorIdx;
              const isPassed = currentFloor > floorIdx;
              const stepInfo = chosenHistory.find((h) => h.floor === floorIdx);

              return (
                <div
                  key={floorIdx}
                  className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : isPassed
                      ? 'bg-slate-900/60 border-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <span className="w-14 text-right font-mono font-bold text-xs text-amber-400 shrink-0">
                    {mult.toFixed(2)}x
                  </span>

                  <div className="grid grid-cols-4 gap-1.5 flex-1">
                    {[0, 1, 2, 3].map((bIdx) => {
                      const isPickedHere = stepInfo?.picked === bIdx;
                      const hitLava = isPickedHere && stepInfo?.hitTrap;

                      return (
                        <button
                          key={bIdx}
                          type="button"
                          disabled={!isCurrent}
                          onClick={() => handleBlockPick(bIdx)}
                          className={`py-2 rounded-lg font-bold text-xs transition-all border ${
                            hitLava
                              ? 'bg-rose-600 text-white border-red-500'
                              : isPickedHere
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : isCurrent
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer active:scale-95'
                              : 'bg-slate-900/60 text-slate-500 border-slate-800 cursor-default'
                          }`}
                        >
                          {hitLava ? '🔥' : isPickedHere ? '💎' : '🧱'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
