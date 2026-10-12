import React, { useState } from 'react';
import { Player } from '../types';
import { api } from '../api';
import { sounds } from '../utils/audio';
import { Play, Sparkles, ShieldCheck, Plus, Hand, Copy } from 'lucide-react';

interface BlackjackPageProps {
  player: Player | null;
  onBalanceUpdate: (newBalance: number) => void;
  onOpenAuth: () => void;
}

interface Card {
  suit: string;
  value: string;
  score: number;
}

export const BlackjackPage: React.FC<BlackjackPageProps> = ({
  player,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [dealerScore, setDealerScore] = useState<number | null>(null);
  const [gameOutcome, setGameOutcome] = useState<string | null>(null);
  const [payoutWon, setPayoutWon] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleDeal = async () => {
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
      setGameOutcome(null);
      setPayoutWon(0);
      sounds.playChip();

      const res = await api.dealBlackjack(betAmount);
      setPlayerHand(res.playerHand);
      setDealerHand(res.dealerHand);
      setPlayerScore(res.playerScore);

      if (res.status === 'player_blackjack') {
        sounds.playJackpot();
        setIsPlaying(false);
        setActiveGameId(null);
        setDealerScore(res.dealerScore || 0);
        setGameOutcome('BLACKJACK! Pagamento de 2.5x!');
        setPayoutWon(res.payout || 0);
      } else if (res.status === 'push') {
        setIsPlaying(false);
        setActiveGameId(null);
        setDealerScore(res.dealerScore || 0);
        setGameOutcome('EMPATE! Aposta devolvida.');
      } else {
        setIsPlaying(true);
        setActiveGameId(res.gameId);
        setDealerScore(null);
      }

      onBalanceUpdate(res.newBalance);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar Blackjack.');
    }
  };

  const handleAction = async (action: 'hit' | 'stand' | 'double') => {
    if (!isPlaying || !activeGameId) return;

    try {
      sounds.playChip();
      const res = await api.actionBlackjack(activeGameId, action);

      setPlayerHand(res.playerHand);
      setDealerHand(res.dealerHand);
      setPlayerScore(res.playerScore);

      if (res.status !== 'playing') {
        setIsPlaying(false);
        setActiveGameId(null);
        setDealerScore(res.dealerScore);

        if (res.status === 'player_win') {
          sounds.playWin();
          setGameOutcome('VOCÊ VENCEU A BANCA!');
          setPayoutWon(res.payout || 0);
        } else if (res.status === 'push') {
          setGameOutcome('EMPATE! Aposta devolvida.');
        } else {
          sounds.playCrashExplosion();
          setGameOutcome('A BANCA VENCEU.');
        }

        onBalanceUpdate(res.newBalance);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderCard = (card: Card, index: number) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const isHidden = card.value === '?';

    return (
      <div
        key={index}
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 flex flex-col justify-between p-2 font-display font-bold text-sm sm:text-base select-none shadow-lg animate-in zoom-in-75 ${
          isHidden
            ? 'bg-gradient-to-br from-cyan-950 to-slate-900 border-cyan-500/50 text-cyan-400 items-center justify-center'
            : isRed
            ? 'bg-white border-slate-300 text-rose-600'
            : 'bg-white border-slate-300 text-slate-950'
        }`}
      >
        {isHidden ? (
          <span className="text-xl">⛏️</span>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span>{card.value}</span>
              <span className="text-xs">{card.suit}</span>
            </div>
            <div className="text-center text-xl sm:text-2xl">{card.suit}</div>
            <div className="flex items-center justify-between rotate-180">
              <span>{card.value}</span>
              <span className="text-xs">{card.suit}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Controls */}
        <div className="lg:col-span-5 bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
              BLACKJACK 21
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              JONBET STYLE
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

          {isPlaying ? (
            <div className="flex flex-col gap-2 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAction('hit')}
                  className="py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pedir Carta</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('stand')}
                  className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Hand className="w-4 h-4" />
                  <span>Parar (Stand)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAction('double')}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl border border-slate-700 transition-all"
              >
                Dobrar Aposta (Double Down)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDeal}
              className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-base tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-950/40 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>DISTRIBUIR CARTAS</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>Blackjack natural paga 3:2 (2.5x)</span>
          </div>
        </div>

        {/* Right Side: Blackjack Felt Table */}
        <div className="lg:col-span-7 bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-between min-h-[460px] shadow-2xl relative">
          
          {/* Dealer Hand Zone */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-2">
              <span>Banca do Cassino</span>
              {dealerScore !== null && (
                <span className="font-mono text-cyan-400 font-bold">({dealerScore})</span>
              )}
            </div>

            <div className="flex items-center gap-2 min-h-[110px]">
              {dealerHand.map((c, i) => renderCard(c, i))}
            </div>
          </div>

          {/* Outcome Result Message */}
          {gameOutcome && (
            <div className="text-center my-3 animate-in zoom-in-95">
              <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs ${
                payoutWon > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {payoutWon > 0 && <Sparkles className="w-4 h-4 text-emerald-400" />}
                <span>{gameOutcome} {payoutWon > 0 ? `(+${payoutWon} 💎)` : ''}</span>
              </span>
            </div>
          )}

          {/* Player Hand Zone */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-2">
              <span>Sua Mão (Steve)</span>
              {playerScore > 0 && (
                <span className={`font-mono font-bold ${playerScore > 21 ? 'text-rose-500' : 'text-emerald-400'}`}>
                  ({playerScore})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 min-h-[110px]">
              {playerHand.map((c, i) => renderCard(c, i))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
