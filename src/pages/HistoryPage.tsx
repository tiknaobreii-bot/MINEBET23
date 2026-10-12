import React, { useEffect, useState } from 'react';
import { Player, Bet } from '../types';
import { api } from '../api';
import { History, CircleDot, Rocket, Coins, Dices, Loader2, ArrowUpRight } from 'lucide-react';

interface HistoryPageProps {
  player: Player | null;
  onOpenAuth: () => void;
  onOpenWithdraw: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  player,
  onOpenAuth,
  onOpenWithdraw,
}) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGame, setFilterGame] = useState<string>('all');

  useEffect(() => {
    if (player) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [player]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getMyHistory();
      setBets(res.bets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBets = filterGame === 'all'
    ? bets
    : bets.filter((b) => b.game === filterGame);

  const getGameIcon = (game: Bet['game']) => {
    switch (game) {
      case 'mines': return <CircleDot className="w-3.5 h-3.5 text-cyan-400" />;
      case 'crash': return <Rocket className="w-3.5 h-3.5 text-amber-400" />;
      case 'roulette': return <CircleDot className="w-3.5 h-3.5 text-rose-400" />;
      case 'plinko': return <CircleDot className="w-3.5 h-3.5 text-sky-400" />;
      case 'dice': return <Dices className="w-3.5 h-3.5 text-indigo-400" />;
      case 'tower': return <Rocket className="w-3.5 h-3.5 text-orange-400" />;
      case 'blackjack': return <Coins className="w-3.5 h-3.5 text-purple-400" />;
      case 'coinflip': return <Coins className="w-3.5 h-3.5 text-yellow-400" />;
      case 'slots': return <Dices className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <CircleDot className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getGameName = (game: Bet['game']) => {
    switch (game) {
      case 'mines': return 'Mines';
      case 'crash': return 'Crash Foguete';
      case 'roulette': return 'Roleta Double';
      case 'plinko': return 'Plinko';
      case 'dice': return 'Dados (Dice)';
      case 'tower': return 'Torre do Nether';
      case 'blackjack': return 'Blackjack 21';
      case 'coinflip': return 'Coin Flip';
      case 'slots': return 'Slots Minecraft';
      default: return 'Jogo';
    }
  };

  if (!player) {
    return (
      <div className="bg-[#101522] border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <History className="w-6 h-6" />
        </div>
        <h3 className="font-display text-xl font-bold text-white">Histórico de Apostas</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Faça login na sua conta para acompanhar seu relatório de apostas, lucros e saques em diamantes.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/40"
        >
          Entrar na Conta
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      
      {/* Header and Filter */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Meu Histórico de Apostas
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de todas as suas rodadas e lucros gerados
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'mines', label: 'Mines' },
            { id: 'crash', label: 'Crash' },
            { id: 'roulette', label: 'Roleta' },
            { id: 'plinko', label: 'Plinko' },
            { id: 'dice', label: 'Dados' },
            { id: 'tower', label: 'Torre' },
            { id: 'blackjack', label: 'Blackjack' },
            { id: 'slots', label: 'Slots' },
            { id: 'coinflip', label: 'Coin Flip' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterGame(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filterGame === item.id
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bets Table */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            Carregando histórico...
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhuma aposta encontrada nesta categoria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Data/Hora</th>
                  <th className="py-3 px-3">Jogo</th>
                  <th className="py-3 px-3 text-right">Aposta</th>
                  <th className="py-3 px-3 text-right">Multiplicador</th>
                  <th className="py-3 px-3 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredBets.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {getGameIcon(b.game)}
                        <span className="font-semibold text-slate-200">{getGameName(b.game)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                      {b.amount} 💎
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                      <span className={b.win ? 'text-emerald-400' : 'text-slate-500'}>
                        {b.win ? `${b.multiplier}x` : '0.00x'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                      {b.win ? (
                        <span className="text-emerald-400">+{b.profit} 💎</span>
                      ) : (
                        <span className="text-rose-400">-{b.amount} 💎</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
