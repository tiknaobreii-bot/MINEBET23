import React, { useState } from 'react';
import { 
  Dices, 
  Rocket, 
  Coins, 
  CircleDot, 
  History, 
  Server, 
  Check, 
  Copy,
  Flame,
  Gem,
  Sparkles,
  Layers,
  Spade,
  Send
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenTransfer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDeposit,
  onOpenTransfer
}) => {
  const [copiedIp, setCopiedIp] = useState(false);
  const serverIp = 'jogar.minebet.com.br';

  const copyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopiedIp(true);
    sounds.playChip();
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const blazeOriginals = [
    { id: 'mines', label: 'Mines', icon: Gem, hot: true, tag: 'TOP 1' },
    { id: 'crash', label: 'Crash Foguete', icon: Rocket, hot: true, tag: 'Alto Risco' },
    { id: 'roulette', label: 'Roleta Double', icon: CircleDot, hot: true, tag: '14x' },
    { id: 'plinko', label: 'Plinko', icon: Layers, hot: false, tag: 'Pirâmide' },
    { id: 'dice', label: 'Dados (Dice)', icon: Dices, hot: false, tag: 'Slider' },
    { id: 'tower', label: 'Torre do Nether', icon: Flame, hot: false, tag: 'Subida' },
  ];

  const classicGames = [
    { id: 'blackjack', label: 'Blackjack 21', icon: Spade, hot: false, tag: 'Cartas' },
    { id: 'slots', label: 'Slots Minecraft', icon: Dices, hot: false, tag: '50x' },
    { id: 'coinflip', label: 'Coin Flip', icon: Coins, hot: false, tag: '2x' },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-5 p-4 bg-[#0c1017] border-r border-slate-800/80 min-h-[calc(100vh-65px)]">
      
      {/* ORIGINAIS BLAZE & JONBET */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 px-3 mb-1">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Originais MineBet
          </span>
        </div>

        {blazeOriginals.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                sounds.playChip();
              }}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{item.label}</span>
              </div>

              {item.tag && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  item.hot 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CLÁSSICOS CASSINO */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1">
          Cassino Clássico
        </span>

        {classicGames.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                sounds.playChip();
              }}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{item.label}</span>
              </div>

              {item.tag && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {item.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* HISTÓRICO & CARTEIRA */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => {
            setActiveTab('history');
            sounds.playChip();
          }}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <div className="p-1.5 rounded-lg bg-slate-900 text-slate-400">
            <History className="w-3.5 h-3.5" />
          </div>
          <span>Histórico de Apostas</span>
        </button>

        {onOpenTransfer && (
          <button
            onClick={() => {
              onOpenTransfer();
              sounds.playChip();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300 hover:text-white hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 group-hover:scale-110 transition-transform">
              <Send className="w-3.5 h-3.5" />
            </div>
            <span>PIX</span>
          </button>
        )}
      </div>

      {/* Deposit Promo Banner */}
      <div className="bg-gradient-to-br from-cyan-950/60 via-[#131b28] to-[#0e141f] border border-cyan-500/30 rounded-2xl p-3.5 flex flex-col gap-2.5 relative overflow-hidden shadow-lg shadow-cyan-950/30 mt-auto">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-300">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Banca no Servidor
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Entregue diamantes na banca do Spawn e jogue ao vivo!
        </p>

        <button
          onClick={onOpenDeposit}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
        >
          Como Depositar 💎
        </button>
      </div>

      {/* Server Connect */}
      <div className="bg-[#101520] border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold text-slate-200">Servidor Online</span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/50">
            1.20.x
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
          <code className="text-[11px] text-slate-300 font-mono truncate">{serverIp}</code>
          <button
            onClick={copyIp}
            title="Copiar IP do servidor"
            className="text-slate-400 hover:text-cyan-400 transition-colors ml-1.5"
          >
            {copiedIp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

    </aside>
  );
};
