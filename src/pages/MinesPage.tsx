import React, { useState } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Gem, Flame, ShieldCheck, Sparkles, Play, ArrowUpRight, RotateCcw } from 'lucide-react';

interface MinesPageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

export const MinesPage: React.FC<MinesPageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [minesCount, setMinesCount] = useState<number>(3);
  
  // Game state
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [nextMultiplier, setNextMultiplier] = useState<number>(1.09);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [allMinePositions, setAllMinePositions] = useState<number[]>([]);
  const [hitMineIndex, setHitMineIndex] = useState<number | null>(null);
  const [lastWinProfit, setLastWinProfit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = async () => {
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
      setRevealedTiles([]);
      setAllMinePositions([]);
      setHitMineIndex(null);
      sounds.playChip();

      const res = await api.startMines(betAmount, minesCount);
      setActiveGameId(res.gameId);
      setIsPlaying(true);
      setCurrentMultiplier(res.currentMultiplier);
      setNextMultiplier(res.nextMultiplier);
      onBalanceUpdate(res.newBalance);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar Mines.');
    }
  };

  const handleTileClick = async (index: number) => {
    if (!isPlaying || !activeGameId || revealedTiles.includes(index)) return;

    try {
      const res = await api.revealMinesTile(activeGameId, index);

      if (res.hitMine) {
        // Boom!
        sounds.playCrashExplosion();
        setIsPlaying(false);
        setActiveGameId(null);
        setHitMineIndex(index);
        setAllMinePositions(res.minePositions || []);
        onBalanceUpdate(res.newBalance);
      } else {
        // Safe diamond!
        sounds.playWin();
        setRevealedTiles((prev) => [...prev, index]);
        if (res.currentMultiplier) setCurrentMultiplier(res.currentMultiplier);
        if (res.nextMultiplier) setNextMultiplier(res.nextMultiplier);

        if (res.cleared) {
          // Cleared entire board
          sounds.playJackpot();
          setIsPlaying(false);
          setActiveGameId(null);
          setLastWinProfit(res.profit || 0);
          setAllMinePositions(res.minePositions || []);
          onBalanceUpdate(res.newBalance);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || !activeGameId) return;

    try {
      const res = await api.cashoutMines(activeGameId);
      sounds.playCashout();
      setIsPlaying(false);
      setActiveGameId(null);
      setLastWinProfit(res.profit);
      setAllMinePositions(res.minePositions);
      onBalanceUpdate(res.newBalance);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      {/* Blaze split layout: Controls on Left, 5x5 Grid on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Betting & Game Controls */}
        <div className="lg:col-span-5 bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Gem className="w-4 h-4" />
              </div>
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
                MINES DO CRAFT
              </h3>
            </div>
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
                disabled={isPlaying}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-60"
              />
              <span className="absolute right-3.5 top-3 text-sm">💎</span>
            </div>

            {/* Quick buttons */}
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
                onClick={() => setBetAmount(1)}
                className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
              >
                MÍN
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

          {/* Mines Count Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Número de TNTs no Campo:
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 3, 5, 10, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => { setMinesCount(m); sounds.playChip(); }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    minesCount === m
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {m} 💣
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Game Info Strip when playing */}
          {isPlaying && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Multiplicador Atual:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{currentMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Próximo Multiplicador:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{nextMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Resgate Atual:</span>
                <span className="font-mono font-bold text-white text-sm">{Math.floor(betAmount * currentMultiplier)} 💎</span>
              </div>
            </div>
          )}

          {/* Main Action Button */}
          {isPlaying ? (
            <button
              type="button"
              onClick={handleCashout}
              disabled={revealedTiles.length === 0}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 text-slate-950 font-display font-black text-base tracking-wider uppercase rounded-xl shadow-xl shadow-emerald-950/40 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse"
            >
              <span>ENCERRAR APOSTA</span>
              <span className="text-xs font-sans font-bold text-slate-900">
                Sacar {Math.floor(betAmount * currentMultiplier)} 💎 (+{(Math.floor(betAmount * currentMultiplier) - betAmount)} 💎)
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-base tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>COMEÇAR JOGO</span>
            </button>
          )}

          {/* Provably fair badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>Resultado 100% comprovado no servidor</span>
          </div>
        </div>

        {/* Right Column: 5x5 Tiles Grid */}
        <div className="lg:col-span-7 bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col items-center justify-center min-h-[460px] shadow-2xl relative overflow-hidden">
          
          {/* Win outcome banner */}
          {lastWinProfit !== null && !isPlaying && (
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold animate-in zoom-in-95">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>VOCÊ GANHOU +{lastWinProfit} DIAMANTES ({currentMultiplier.toFixed(2)}X)!</span>
            </div>
          )}

          {/* 5x5 Grid */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 w-full max-w-[400px] aspect-square">
            {Array.from({ length: 25 }, (_, i) => {
              const isRevealedDiamond = revealedTiles.includes(i);
              const isHitMine = hitMineIndex === i;
              const isUnrevealedMine = allMinePositions.includes(i) && !isPlaying;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={!isPlaying || isRevealedDiamond}
                  onClick={() => handleTileClick(i)}
                  className={`w-full h-full rounded-2xl flex items-center justify-center font-display font-extrabold text-2xl transition-all duration-300 select-none relative ${
                    isRevealedDiamond
                      ? 'bg-gradient-to-tr from-cyan-600 via-sky-400 to-cyan-200 border-2 border-cyan-300 shadow-lg shadow-cyan-500/40 animate-in zoom-in-75'
                      : isHitMine
                      ? 'bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 border-2 border-red-400 shadow-lg shadow-red-500/50 animate-bounce'
                      : isUnrevealedMine
                      ? 'bg-slate-900/60 border border-rose-500/30 opacity-40'
                      : isPlaying
                      ? 'bg-[#151c28] hover:bg-[#1a2333] border border-slate-700/80 hover:border-cyan-500/60 shadow-md active:scale-95 cursor-pointer'
                      : 'bg-[#111722] border border-slate-800/80 cursor-default opacity-85'
                  }`}
                >
                  {isRevealedDiamond && (
                    <Gem className="w-8 h-8 text-slate-950 drop-shadow-md animate-in zoom-in-50" />
                  )}
                  {isHitMine && (
                    <span className="text-2xl drop-shadow-md">💣</span>
                  )}
                  {isUnrevealedMine && !isHitMine && (
                    <span className="text-lg opacity-60">💣</span>
                  )}
                </button>
              );
            })}
          </div>

          {!isPlaying && revealedTiles.length === 0 && lastWinProfit === null && hitMineIndex === null && (
            <p className="text-xs text-slate-500 mt-4">
              Escolha sua aposta e clique em "Começar Jogo" para caçar diamantes.
            </p>
          )}
        </div>

      </div>

    </div>
  );
};
