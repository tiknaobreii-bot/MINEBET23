import React from 'react';
import { Player } from '../types';
import { LiveBetsFeed } from '../components/LiveBetsFeed';
import { sounds } from '../utils/audio';
import { 
  CircleDot, 
  Rocket, 
  Coins, 
  Dices, 
  ShieldCheck, 
  Sparkles, 
  Gem, 
  ArrowRight,
  Flame,
  Users,
  Layers,
  Spade
} from 'lucide-react';

interface HomePageProps {
  player: Player | null;
  setActiveTab: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenAuth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  player,
  setActiveTab,
  onOpenDeposit,
  onOpenAuth,
}) => {
  const originals = [
    {
      id: 'mines',
      title: 'Mines',
      desc: 'Abra diamantes em uma grade 5x5 evitando as TNTs. Escolha de 1 a 24 minas e encerre quando quiser!',
      tag: 'MAIS JOGADO',
      icon: Gem,
      color: 'from-cyan-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-cyan-500/50',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      bannerImg: '/src/assets/images/blaze_mines_diamonds_1791840017858.jpg',
    },
    {
      id: 'crash',
      title: 'Crash Elytra',
      desc: 'O multiplicador sobe em tempo real. Saque antes que o foguete exploda!',
      tag: 'ALTO GANHO',
      icon: Rocket,
      color: 'from-rose-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-rose-500/50',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'roulette',
      title: 'Roleta Double',
      desc: 'Vermelho (2x), Preto (2x) ou Diamante Branco (14x) no carrossel clássico da Blaze.',
      tag: '14X DIAMANTE',
      icon: CircleDot,
      color: 'from-red-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-red-500/50',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    {
      id: 'plinko',
      title: 'Plinko Pirâmide',
      desc: 'Solte diamantes pela pirâmide de pinos até atingir multiplicadores extremos de até 1000x!',
      tag: 'PIRÂMIDE',
      icon: Layers,
      color: 'from-sky-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-sky-500/50',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      bannerImg: '/src/assets/images/blaze_plinko_pyramid_1791840026909.jpg',
    },
    {
      id: 'dice',
      title: 'Dados (Dice)',
      desc: 'Defina seu alvo no slider e escolha rolar acima ou abaixo com chances ajustáveis.',
      tag: 'SLIDER 98X',
      icon: Dices,
      color: 'from-indigo-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-indigo-500/50',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'tower',
      title: 'Torre do Nether',
      desc: 'Suba andar por andar evitando as armadilhas de lava. Cada piso aumenta seu prêmio!',
      tag: 'SUBIDA',
      icon: Flame,
      color: 'from-amber-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-amber-500/50',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'blackjack',
      title: 'Blackjack 21',
      desc: 'Desafie a banca em uma mesa de 21. Peça cartas, dobre a aposta ou vença com 21 natural!',
      tag: 'ESTRATÉGIA',
      icon: Spade,
      color: 'from-purple-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-purple-500/50',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'coinflip',
      title: 'Coin Flip 3D',
      desc: 'Bloco de Ouro contra Bloco de Diamante. Dobre seus diamantes instantaneamente.',
      tag: '2X DOBRO',
      icon: Coins,
      color: 'from-yellow-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-yellow-500/50',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    },
    {
      id: 'slots',
      title: 'Slots Minecraft',
      desc: 'Role 3 itens épicos. Acerte a trinca de diamantes para o jackpot supremo de 50x!',
      tag: 'JACKPOT 50X',
      icon: Dices,
      color: 'from-emerald-500/20 via-slate-900 to-[#101522]',
      border: 'hover:border-emerald-500/50',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      
      {/* Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0d121c] shadow-2xl">
        <div className="relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden">
          <img
            src="/src/assets/images/minebet_hero_diamonds_1791839124367.jpg"
            alt="MineBet Cassino de Minecraft"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d121c] via-[#0d121c]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d121c]/90 via-transparent to-transparent" />
          
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold w-fit mb-3 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>ESTILO BLAZE & JONBET · 9 JOGOS DISPONÍVEIS</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none drop-shadow-md">
              O CASSINO DE <span className="text-cyan-400">MINECRAFT</span> MAIS COMPLETO
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed max-w-xl">
              Mines, Crash, Roleta, Plinko, Dados, Torre, Blackjack e Slots. Entregue seus diamantes na banca no Spawn e multiplique seu saldo!
            </p>

            <div className="flex items-center gap-3 mt-6">
              {player ? (
                <button
                  onClick={() => {
                    setActiveTab('mines');
                    sounds.playChip();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2"
                >
                  <span>Jogar Mines Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2"
                >
                  <span>Criar Conta e Jogar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onOpenDeposit}
                className="px-5 py-3 bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                Como Depositar Diamantes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Big Highlights (Mines & Plinko featured cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mines Highlight Card */}
        <div 
          onClick={() => { setActiveTab('mines'); sounds.playChip(); }}
          className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 cursor-pointer group hover:border-cyan-400 transition-all shadow-xl h-48 sm:h-56 flex flex-col justify-end p-5"
        >
          <img
            src="/src/assets/images/blaze_mines_diamonds_1791840017858.jpg"
            alt="Mines Blaze"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090c10] via-[#090c10]/70 to-transparent" />
          
          <div className="relative z-10">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-400 text-slate-950 uppercase">
              DESTAQUE Nº1
            </span>
            <h3 className="font-display text-2xl font-black text-white uppercase mt-1 group-hover:text-cyan-400 transition-colors">
              Mines do Craft
            </h3>
            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
              Grade 5x5 com diamantes e TNTs. Encerre sua aposta a qualquer momento!
            </p>
          </div>
        </div>

        {/* Plinko Highlight Card */}
        <div 
          onClick={() => { setActiveTab('plinko'); sounds.playChip(); }}
          className="relative rounded-2xl overflow-hidden border border-sky-500/40 bg-slate-950 cursor-pointer group hover:border-sky-400 transition-all shadow-xl h-48 sm:h-56 flex flex-col justify-end p-5"
        >
          <img
            src="/src/assets/images/blaze_plinko_pyramid_1791840026909.jpg"
            alt="Plinko JonBet"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090c10] via-[#090c10]/70 to-transparent" />
          
          <div className="relative z-10">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-400 text-slate-950 uppercase">
              MULTIPLICADOR ATÉ 1000X
            </span>
            <h3 className="font-display text-2xl font-black text-white uppercase mt-1 group-hover:text-sky-400 transition-colors">
              Plinko Pirâmide
            </h3>
            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
              Física realista de pinos e bolinhas com multiplicadores insanos!
            </p>
          </div>
        </div>
      </div>

      {/* All 9 Games Grid (Blaze / JonBet Layout) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h2 className="font-display text-xl font-extrabold text-white uppercase tracking-wide">
              Originais & Cassino (9 Jogos)
            </h2>
          </div>
          <span className="text-xs text-slate-400">100% Diamantes do Servidor</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {originals.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.id}
                onClick={() => {
                  setActiveTab(g.id);
                  sounds.playChip();
                }}
                className={`group cursor-pointer rounded-2xl p-5 border border-slate-800 bg-gradient-to-b ${g.color} ${g.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 group-hover:border-slate-700 flex items-center justify-center text-white transition-transform group-hover:scale-110">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${g.badgeColor}`}>
                      {g.tag}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide group-hover:text-cyan-400 transition-colors">
                    {g.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {g.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  <span>Jogar Agora</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Bets Feed Section with Tabs */}
      <LiveBetsFeed />

      {/* Trust & Server Fair Play Info */}
      <div className="bg-[#101522] border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <Gem className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Sem Dinheiro Real</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              O MineBet opera exclusivamente com Diamantes do jogo de Minecraft. Saldo 100% virtual e recreativo.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Saque Seguro no Servidor</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Solicite o saque no site e receba seus diamantes diretamente com a banca/admin no spawn do servidor.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Servidor Sempre Ativo</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Conecte-se com <code className="text-cyan-400 font-mono">jogar.minebet.com.br</code> e divirta-se com a comunidade.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
