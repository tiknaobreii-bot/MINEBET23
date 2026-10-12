import React, { useEffect, useState } from 'react';
import { Bet } from '../types';
import { api } from '../api';
import { Gem, CircleDot, Rocket, Coins, Dices, Layers, Flame, Spade, Trophy, Sparkles } from 'lucide-react';

export const LiveBetsFeed: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [feedFilter, setFeedFilter] = useState<'all' | 'high_rollers' | 'lucky'>('all');

  const fetchRecent = async () => {
    try {
      const res = await api.getRecentActivity();
      if (res.recentBets) {
        setBets(res.recentBets);
      }
    } catch (e) {
      // Ignore polling errors
    }
  };

  useEffect(() => {
    fetchRecent();
    const interval = setInterval(fetchRecent, 4000);
    return () => clearInterval(interval);
  }, []);

  const getGameIcon = (game: Bet['game']) => {
    switch (game) {
      case 'mines': return <Gem className="w-3.5 h-3.5 text-cyan-400" />;
      case 'crash': return <Rocket className="w-3.5 h-3.5 text-amber-400" />;
      case 'roulette': return <CircleDot className="w-3.5 h-3.5 text-rose-400" />;
      case 'plinko': return <Layers className="w-3.5 h-3.5 text-sky-400" />;
      case 'dice': return <Dices className="w-3.5 h-3.5 text-indigo-400" />;
      case 'tower': return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case 'blackjack': return <Spade className="w-3.5 h-3.5 text-purple-400" />;
      case 'coinflip': return <Coins className="w-3.5 h-3.5 text-yellow-400" />;
      case 'slots': return <Dices className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <Gem className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getGameName = (game: Bet['game']) => {
    switch (game) {
      case 'mines': return 'Mines';
      case 'crash': return 'Crash';
      case 'roulette': return 'Roleta';
      case 'plinko': return 'Plinko';
      case 'dice': return 'Dados';
      case 'tower': return 'Torre';
      case 'blackjack': return 'Blackjack';
      case 'coinflip': return 'Coin Flip';
      case 'slots': return 'Slots';
      default: return 'Jogo';
    }
  };

  const filteredBets = bets.filter((b) => {
    if (feedFilter === 'high_rollers') return b.amount >= 50;
    if (feedFilter === 'lucky') return b.win && b.multiplier >= 2;
    return true;
  });

  return (
    <div className="bg-[#0f141e] border border-slate-800 rounded-2xl p-4 lg:p-6 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="font-display text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
            Apostas ao Vivo no Servidor
          </h3>
        </div>

        {/* Blaze style feed tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => setFeedFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              feedFilter === 'all' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas as Apostas
          </button>
          <button
            onClick={() => setFeedFilter('high_rollers')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              feedFilter === 'high_rollers' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Altas Apostas
          </button>
          <button
            onClick={() => setFeedFilter('lucky')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              feedFilter === 'lucky' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Maiores Ganhos
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Jogo</th>
              <th className="py-2.5 px-3">Jogador</th>
              <th className="py-2.5 px-3 text-right">Aposta</th>
              <th className="py-2.5 px-3 text-right">Mult.</th>
              <th className="py-2.5 px-3 text-right">Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredBets.slice(0, 10).map((b) => (
              <tr key={b.id} className="hover:bg-slate-900/60 transition-colors animate-in fade-in">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    {getGameIcon(b.game)}
                    <span className="font-semibold text-slate-300">{getGameName(b.game)}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">{b.playerUsername}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                  {b.amount} 💎
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                  <span className={b.win ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {b.win ? `${b.multiplier}x` : '0.00x'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                  {b.win ? (
                    <span className="text-emerald-400">+{b.payout} 💎</span>
                  ) : (
                    <span className="text-slate-500">-{b.amount} 💎</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
