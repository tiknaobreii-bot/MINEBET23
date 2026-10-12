import React, { useState, useEffect } from 'react';
import { Player, Bet, BalanceLog, Withdrawal, Settings, AdminStats, Transfer, GameSettings } from '../types';
import { api, getAdminToken } from '../api';
import { sounds } from '../utils/audio';
import { 
  Shield, 
  Lock, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  History, 
  FileText, 
  LogOut, 
  AlertCircle, 
  Loader2, 
  Gem, 
  Users, 
  TrendingUp, 
  Settings as SettingsIcon,
  Percent,
  Check,
  Send,
  Spade,
  Flame,
  Rocket,
  CircleDot,
  Dices,
  Layers,
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  Coins
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('admin123');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tabs: 'players' | 'withdrawals' | 'game_settings' | 'transfers' | 'settings' | 'bets' | 'logs'
  const [activeTab, setActiveTab] = useState<'players' | 'withdrawals' | 'game_settings' | 'transfers' | 'settings' | 'bets' | 'logs'>('players');

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [balanceLogs, setBalanceLogs] = useState<BalanceLog[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Loading & search states
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [searchPlayer, setSearchPlayer] = useState<string>('');
  const [searchTransfer, setSearchTransfer] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals for player management
  const [selectedPlayerForBalance, setSelectedPlayerForBalance] = useState<Player | null>(null);
  const [balanceDelta, setBalanceDelta] = useState<string>('50');
  const [balanceAction, setBalanceAction] = useState<'add' | 'remove'>('add');
  const [balanceReason, setBalanceReason] = useState<string>('Depósito presencial na banca do servidor');

  const [selectedPlayerForWinRate, setSelectedPlayerForWinRate] = useState<Player | null>(null);
  const [customWinRateInput, setCustomWinRateInput] = useState<string>('');

  // Check auth on mount
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      api.admin.getMe()
        .then(() => {
          setIsAdminAuthenticated(true);
          loadAllData();
        })
        .catch(() => {
          setIsAdminAuthenticated(false);
        });
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      setAuthLoading(true);
      await api.admin.login(adminUsername, adminPassword);
      setIsAdminAuthenticated(true);
      sounds.playWin();
      loadAllData();
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao autenticar administrador.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await api.admin.logout();
    setIsAdminAuthenticated(false);
  };

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const [statsRes, playersRes, withRes, betsRes, logsRes, settRes, transRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getPlayers(searchPlayer),
        api.admin.getWithdrawals(),
        api.admin.getBets(),
        api.admin.getBalanceLogs(),
        api.admin.getSettings(),
        api.admin.getTransfers(),
      ]);

      setStats(statsRes);
      setPlayers(playersRes.players);
      setWithdrawals(withRes.withdrawals);
      setPendingCount(withRes.pendingCount);
      setBets(betsRes.bets);
      setBalanceLogs(logsRes.balanceLogs);
      setSettings(settRes.settings);
      setTransfers(transRes.transfers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // Trigger search on typing
  useEffect(() => {
    if (isAdminAuthenticated) {
      api.admin.getPlayers(searchPlayer).then((r) => setPlayers(r.players));
    }
  }, [searchPlayer, isAdminAuthenticated]);

  // Handle balance adjustment
  const handleSaveBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForBalance) return;

    const val = parseInt(balanceDelta, 10);
    if (isNaN(val) || val <= 0) return;

    const amount = balanceAction === 'add' ? val : -val;

    try {
      setLoadingData(true);
      const res = await api.admin.adjustPlayerBalance(selectedPlayerForBalance.id, amount, balanceReason);
      
      // Update local player
      setPlayers(players.map(p => p.id === res.player.id ? res.player : p));
      setSelectedPlayerForBalance(null);
      sounds.playWin();
      setSuccessMessage(`Saldo de ${res.player.username} atualizado para ${res.player.balance} 💎.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Erro ao ajustar saldo.');
    } finally {
      setLoadingData(false);
    }
  };

  // Handle individual win rate override
  const handleSavePlayerWinRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForWinRate) return;

    const rateVal = customWinRateInput.trim() === '' ? null : parseInt(customWinRateInput, 10);
    if (rateVal !== null && (isNaN(rateVal) || rateVal < 1 || rateVal > 99)) {
      alert('A porcentagem de vitória deve estar entre 1% e 99%.');
      return;
    }

    try {
      setLoadingData(true);
      const res = await api.admin.setPlayerWinRate(selectedPlayerForWinRate.id, rateVal);
      setPlayers(players.map(p => p.id === res.player.id ? res.player : p));
      setSelectedPlayerForWinRate(null);
      sounds.playWin();
      setSuccessMessage(`Taxa de vitória de ${res.player.username} definida para ${rateVal !== null ? `${rateVal}%` : 'Padrão Global'}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao definir taxa.');
    } finally {
      setLoadingData(false);
    }
  };

  // Handle Mark as Paid
  const handleMarkWithdrawalPaid = async (id: string) => {
    try {
      setLoadingData(true);
      await api.admin.markWithdrawalPaid(id);
      sounds.playWin();
      setSuccessMessage('Saque marcado como PAGO com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar saque.');
    } finally {
      setLoadingData(false);
    }
  };

  // Save General Settings
  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setLoadingData(true);
      await api.admin.updateSettings(settings);
      sounds.playWin();
      setSuccessMessage('Configurações gerais do servidor salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações.');
    } finally {
      setLoadingData(false);
    }
  };

  // Save Per-Game Custom Settings & Probabilities
  const handleSaveGameSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings?.gameSettings) return;

    try {
      setLoadingData(true);
      await api.admin.updateGameSettings(settings.gameSettings);
      sounds.playWin();
      setSuccessMessage('Configurações e características dos jogos atualizadas com sucesso no servidor!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar características dos jogos.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleResetGameSettings = () => {
    if (!settings) return;
    const defaultGames: GameSettings = {
      roulette: { playerWinChance: 48, whiteMultiplier: 14 },
      blackjack: { dealerWinChance: 52, naturalBlackjackPayout: 2.5 },
      crash: { instantCrashChance: 15, highFlyChance: 25, maxCrashCap: 100 },
      mines: { gemSafetyFactor: 60 },
      plinko: { outerSlotBiasChance: 12 },
      dice: { houseEdgePercent: 1.5 },
      tower: { trapTriggerRate: 25 },
      slots: { jackpotDiamondChance: 5, generalWinChance: 45 },
      coinflip: { playerWinChance: 49 },
    };
    setSettings({
      ...settings,
      gameSettings: defaultGames,
    });
    sounds.playChip();
  };

  // Update specific game setting
  const updateGameField = <G extends keyof GameSettings, K extends keyof GameSettings[G]>(
    game: G,
    key: K,
    val: GameSettings[G][K]
  ) => {
    if (!settings || !settings.gameSettings) return;
    setSettings({
      ...settings,
      gameSettings: {
        ...settings.gameSettings,
        [game]: {
          ...settings.gameSettings[game],
          [key]: val,
        },
      },
    });
  };

  // If not authenticated, render Login Form
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0d131f] border border-amber-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wider">
              Painel Administrativo
            </h1>
            <p className="text-xs text-slate-400">
              Acesso exclusivo para administradores e operadores do servidor de Minecraft.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Usuário de Admin:
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Senha de Admin:
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              Credenciais padrão configuradas: <code className="text-amber-400">admin</code> / <code className="text-amber-400">admin123</code>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Acessar Painel</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    );
  }

  const gs = settings?.gameSettings;
  const filteredTransfers = transfers.filter(t => 
    t.fromUsername.toLowerCase().includes(searchTransfer.toLowerCase()) ||
    t.toUsername.toLowerCase().includes(searchTransfer.toLowerCase())
  );
  const totalTransferredAmount = transfers.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
      
      {/* Top Admin Header */}
      <div className="bg-[#101622] border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              PAINEL DO ADMINISTRADOR
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                ROOT
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Controle de probabilidades por jogo, jogadores, saques, transferências e auditoria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-xl transition-colors"
          >
            Atualizar Dados
          </button>
          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Admin</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#101522] border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Total de Jogadores
            </span>
            <span className="font-display text-2xl font-bold text-white mt-1 block tabular-nums">
              {stats.totalPlayers}
            </span>
          </div>

          <div className="bg-[#101522] border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-cyan-400" />
              Diamantes em Circulação
            </span>
            <span className="font-display text-2xl font-bold text-cyan-400 mt-1 block tabular-nums">
              {stats.totalCirculation.toLocaleString('pt-BR')} 💎
            </span>
          </div>

          <div className="bg-[#101522] border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Saques Pendentes
            </span>
            <span className={`font-display text-2xl font-bold mt-1 block tabular-nums ${
              pendingCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'
            }`}>
              {pendingCount}
            </span>
          </div>

          <div className="bg-[#101522] border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Chance de Vitória Global
            </span>
            <span className="font-display text-2xl font-bold text-emerald-400 mt-1 block tabular-nums">
              {stats.globalWinRatePercent}%
            </span>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'players', label: 'Jogadores', icon: Users, badge: null },
          { id: 'withdrawals', label: 'Saques', icon: Clock, badge: pendingCount > 0 ? pendingCount : null },
          { id: 'game_settings', label: 'Config. Jogos & %', icon: Sliders, badge: 'PRO' },
          { id: 'transfers', label: 'Transferências', icon: Send, badge: transfers.length > 0 ? transfers.length : null },
          { id: 'settings', label: 'Geral & Servidor', icon: SettingsIcon, badge: null },
          { id: 'bets', label: 'Histórico de Apostas', icon: History, badge: null },
          { id: 'logs', label: 'Log de Ajustes de Saldo', icon: FileText, badge: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ml-1">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PLAYERS TABLE WITH PASSWORDS AND ADJUST BUTTONS */}
      {activeTab === 'players' && (
        <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white uppercase">
                Jogadores Cadastrados
              </h3>
              <p className="text-xs text-slate-400">
                Lista de jogadores, senhas em texto puro, saldos e controle de chance individual.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Jogador</th>
                  <th className="py-3 px-3">Senha (Texto)</th>
                  <th className="py-3 px-3 text-right">Saldo 💎</th>
                  <th className="py-3 px-3 text-center">% Valendo (Global / Individual)</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {players.map((p) => {
                  const isInd = p.winRatePercent !== null && p.winRatePercent !== undefined && !isNaN(Number(p.winRatePercent));
                  const effRate = isInd ? Number(p.winRatePercent) : (stats?.globalWinRatePercent ?? 50);
                  const cf = Math.round(Math.max(0, Math.min(50, 50 * (effRate / 50))));
                  const red = Math.round(Math.max(0, Math.min(47, 47 * (effRate / 50))));
                  const green = Math.round(Math.max(0, Math.min(5, 5 * (effRate / 50))));
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-500/30 flex items-center justify-center font-pixel text-cyan-300 text-xs">
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{p.username}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-300 font-bold bg-amber-500/5 px-2 rounded">
                        {p.password || '••••••'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400 text-sm">
                        {p.balance.toLocaleString('pt-BR')} 💎
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isInd ? (
                            <span className="font-mono text-emerald-300 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[11px] flex items-center gap-1.5 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Individual ({effRate}%)
                            </span>
                          ) : (
                            <span className="font-mono text-cyan-300 font-medium bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30 text-[11px] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              Global ({effRate}%)
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono tracking-tight" title={`Coin Flip: ${cf}%, Roleta vermelha: ${red}%, Verde: ${green}%`}>
                            CF: {cf}% • Roleta: {red}% • Verde: {green}%
                          </span>
                        </div>
                      </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPlayerForBalance(p);
                            setBalanceDelta('50');
                            setBalanceAction('add');
                          }}
                          className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Adicionar ou remover diamantes"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Saldo</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPlayerForWinRate(p);
                            setCustomWinRateInput(p.winRatePercent !== null && p.winRatePercent !== undefined ? p.winRatePercent.toString() : '');
                          }}
                          className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Alterar chance de vitória deste jogador"
                        >
                          <Percent className="w-3 h-3" />
                          <span>% Win</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WITHDRAWALS REQUESTS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-white uppercase">
                Pedidos de Saque
              </h3>
              <p className="text-xs text-slate-400">
                Entregue os diamantes para o jogador na banca do servidor e clique em "Marcar como Pago".
              </p>
            </div>
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl animate-pulse">
                {pendingCount} Saque(s) Aguardando
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Data e Hora</th>
                  <th className="py-3 px-3">Jogador</th>
                  <th className="py-3 px-3 text-right">Quantidade 💎</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      Nenhum pedido de saque registrado até o momento.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(w.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {w.playerUsername}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400 text-sm">
                        {w.amount.toLocaleString('pt-BR')} 💎
                      </td>
                      <td className="py-3 px-3 text-center">
                        {w.status === 'pendente' ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pendente
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Pago
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {w.status === 'pendente' ? (
                          <button
                            onClick={() => handleMarkWithdrawalPaid(w.id)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md active:scale-95"
                          >
                            Marcar como Pago
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Entregue por {w.paidByAdmin || 'admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM GAME PROBABILITIES & CHARACTERISTICS (NOVO RECURSO COMPLETO) */}
      {activeTab === 'game_settings' && gs && (
        <div className="bg-[#101522] border border-amber-500/30 rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white uppercase flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                Controle de Probabilidades Personalizadas por Jogo
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste os parâmetros individuais e características de cada jogo (ex: chance do dealer no blackjack, chance do jogador na roleta, multiplicador do branco, segurança no mines, etc.).
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleResetGameSettings}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white rounded-xl transition-colors flex items-center gap-1.5"
                title="Redefinir todas as probabilidades para os padrões da Blaze"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrões</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveGameSettings()}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Todos os Jogos</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Regra de Prevalência:</strong> Todas as apostas são resolvidas estritamente no servidor. Se um jogador tiver % individual definida na aba Jogadores, essa % terá prioridade máxima; caso contrário, as taxas específicas abaixo serão aplicadas!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* 1. ROLETA DOUBLE */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                    <CircleDot className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Roleta Double</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  2x / 14x
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">Chance do Jogador Ganhar:</label>
                  <span className="font-mono text-base font-bold text-cyan-400">{gs.roulette.playerWinChance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="99"
                  value={gs.roulette.playerWinChance}
                  onChange={(e) => updateGameField('roulette', 'playerWinChance', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Chance do sorteio premiar a cor ou branco apostado pelo jogador.
                </p>
              </div>

              <div className="mt-1">
                <label className="text-xs text-slate-300 font-semibold block mb-1">Multiplicador do Branco (0):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={gs.roulette.whiteMultiplier}
                    onChange={(e) => updateGameField('roulette', 'whiteMultiplier', parseInt(e.target.value) || 14)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400">x a aposta (padrão 14x)</span>
                </div>
              </div>
            </div>

            {/* 2. BLACKJACK 21 */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Spade className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Blackjack 21</span>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                  Dealer Mesa
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">Chance do Dealer Ganhar:</label>
                  <span className="font-mono text-base font-bold text-amber-400">{gs.blackjack.dealerWinChance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="99"
                  value={gs.blackjack.dealerWinChance}
                  onChange={(e) => updateGameField('blackjack', 'dealerWinChance', parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Vantagem da banca: chance do dealer comprar cartas suficientes para superar a mão do jogador.
                </p>
              </div>

              <div className="mt-1">
                <label className="text-xs text-slate-300 font-semibold block mb-1">Pagamento Blackjack Natural:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1.5"
                    max="10"
                    value={gs.blackjack.naturalBlackjackPayout}
                    onChange={(e) => updateGameField('blackjack', 'naturalBlackjackPayout', parseFloat(e.target.value) || 2.5)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400">x a aposta (padrão 2.5x)</span>
                </div>
              </div>
            </div>

            {/* 3. CRASH FOGUETE */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-rose-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Crash Foguete</span>
                </div>
                <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/30">
                  Multiplicador
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">% Crash Instantâneo (&lt;1.20x):</label>
                  <span className="font-mono text-sm font-bold text-rose-400">{gs.crash.instantCrashChance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={gs.crash.instantCrashChance}
                  onChange={(e) => updateGameField('crash', 'instantCrashChance', parseInt(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">% Voo Alto (&gt;5.00x):</label>
                  <span className="font-mono text-sm font-bold text-emerald-400">{gs.crash.highFlyChance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={gs.crash.highFlyChance}
                  onChange={(e) => updateGameField('crash', 'highFlyChance', parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Teto Máximo do Multiplicador:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={gs.crash.maxCrashCap}
                    onChange={(e) => updateGameField('crash', 'maxCrashCap', parseInt(e.target.value) || 100)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400">x cap máximo</span>
                </div>
              </div>
            </div>

            {/* 4. MINES CAMPO MINADO */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Gem className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Mines (Campo Minado)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  TNT vs Diamante
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">Segurança nos Primeiros Cliques:</label>
                  <span className="font-mono text-base font-bold text-emerald-400">{gs.mines.gemSafetyFactor}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="99"
                  value={gs.mines.gemSafetyFactor}
                  onChange={(e) => updateGameField('mines', 'gemSafetyFactor', parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Quanto maior, menor a chance de explodir TNT logo nos primeiros 2 blocos abertos.
                </p>
              </div>
            </div>

            {/* 5. SLOTS CAÇA-NÍQUEIS */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-purple-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Dices className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Slots Minecraft</span>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                  Carretéis
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">% Geral de Acerto em Linhas:</label>
                  <span className="font-mono text-sm font-bold text-purple-400">{gs.slots.generalWinChance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={gs.slots.generalWinChance}
                  onChange={(e) => updateGameField('slots', 'generalWinChance', parseInt(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">% Chance de JackPot (3x 💎):</label>
                  <span className="font-mono text-sm font-bold text-cyan-400">{gs.slots.jackpotDiamondChance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={gs.slots.jackpotDiamondChance}
                  onChange={(e) => updateGameField('slots', 'jackpotDiamondChance', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* 6. COIN FLIP */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-yellow-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Coin Flip (Cara ou Coroa)</span>
                </div>
                <span className="text-[10px] font-mono text-yellow-300 bg-yellow-950 px-2 py-0.5 rounded border border-yellow-500/30">
                  2.0x
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">Chance de Vitória do Jogador:</label>
                  <span className="font-mono text-base font-bold text-yellow-400">{gs.coinflip.playerWinChance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="99"
                  value={gs.coinflip.playerWinChance}
                  onChange={(e) => updateGameField('coinflip', 'playerWinChance', parseInt(e.target.value))}
                  className="w-full accent-yellow-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Probabilidade da moeda de Ouro/Diamante cair na escolha do jogador.
                </p>
              </div>
            </div>

            {/* 7. DADOS (DICE) */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Dices className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Dados (Dice Slider)</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                  Over/Under
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Margem da Banca (House Edge %):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={gs.dice.houseEdgePercent}
                    onChange={(e) => updateGameField('dice', 'houseEdgePercent', parseFloat(e.target.value) || 1.5)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-slate-400">% da banca no multiplicador</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Padrão 1.5% (RTP de 98.5% no dado estilo Blaze/JonBet).
                </p>
              </div>
            </div>

            {/* 8. PLINKO */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-blue-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Plinko Pirâmide</span>
                </div>
                <span className="text-[10px] font-mono text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30">
                  Pinball
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">Tendência para Canaletas Extremas:</label>
                  <span className="font-mono text-sm font-bold text-blue-400">{gs.plinko.outerSlotBiasChance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={gs.plinko.outerSlotBiasChance}
                  onChange={(e) => updateGameField('plinko', 'outerSlotBiasChance', parseInt(e.target.value))}
                  className="w-full accent-blue-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Chance da bolinha quicar para as bordas externas (onde ficam os maiores multiplicadores).
                </p>
              </div>
            </div>

            {/* 9. TORRE DO NETHER */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-orange-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Torre do Nether</span>
                </div>
                <span className="text-[10px] font-mono text-orange-300 bg-orange-950 px-2 py-0.5 rounded border border-orange-500/30">
                  Subida
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-300 font-semibold">Taxa de Armadilha de Lava:</label>
                  <span className="font-mono text-sm font-bold text-orange-400">{gs.tower.trapTriggerRate}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={gs.tower.trapTriggerRate}
                  onChange={(e) => updateGameField('tower', 'trapTriggerRate', parseInt(e.target.value))}
                  className="w-full accent-orange-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Probabilidade do bloco pisado conter lava ardente a cada andar subido.
                </p>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleSaveGameSettings()}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações das Probabilidades</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSFERS AUDIT (NOVO RECURSO DE TRANSFERÊNCIAS ENTRE JOGADORES) */}
      {activeTab === 'transfers' && (
        <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white uppercase flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                Histórico de Transferências entre Jogadores
              </h3>
              <p className="text-xs text-slate-400">
                Auditoria de todos os diamantes enviados diretamente de um jogador para outro.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por remetente ou destinatário..."
                  value={searchTransfer}
                  onChange={(e) => setSearchTransfer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Transfers Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block">Total de Diamantes Transferidos</span>
              <span className="font-display text-lg font-bold text-cyan-400 font-mono">
                {totalTransferredAmount.toLocaleString('pt-BR')} 💎
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Total de Transações</span>
              <span className="font-display text-lg font-bold text-white font-mono">
                {transfers.length} operações
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Data e Hora</th>
                  <th className="py-3 px-3">Remetente (De)</th>
                  <th className="py-3 px-3">Destinatário (Para)</th>
                  <th className="py-3 px-3 text-right">Quantidade 💎</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      Nenhuma transferência encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tr.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-300">
                        {tr.fromUsername}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-300">
                        {tr.toUsername}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400 text-sm">
                        {tr.amount.toLocaleString('pt-BR')} 💎
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Instantâneo
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GENERAL SERVER SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveGeneralSettings} className="bg-[#101522] border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
          <div>
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Configurações Gerais do Servidor
            </h3>
            <p className="text-xs text-slate-400">
              Ajuste as informações de conexão do Minecraft, aposta mínima e avisos ao jogador.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Global Win Rate Slider */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Ajuste Global (% de Vitória):
                  </label>
                  <span className="text-[10px] text-slate-500">
                    50% = chance normal do jogo. Menor que 50% = casa mais favorecida.
                  </span>
                </div>
                <span className="font-display text-2xl font-bold text-cyan-400 font-mono">
                  {settings.globalWinRatePercent}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="99"
                value={settings.globalWinRatePercent}
                onChange={(e) => setSettings({ ...settings, globalWinRatePercent: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              {/* Dica ao lado com as chances finais de cada jogo */}
              {(() => {
                const val = settings.globalWinRatePercent ?? 50;
                const factor = val / 50;
                const cf = Math.round(Math.max(0, Math.min(50, 50 * factor)));
                const red = Math.round(Math.max(0, Math.min(47, 47 * factor)));
                const green = Math.round(Math.max(0, Math.min(5, 5 * factor)));
                const slots = Math.round(Math.max(0, Math.min(15, 15 * factor)));
                return (
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-cyan-500/30 text-xs">
                    <span className="text-[11px] font-bold text-cyan-300 block mb-1">
                      💡 Dica de chance final para este valor ({val}%):
                    </span>
                    <p className="font-mono text-[11px] text-slate-200">
                      Coin Flip: <strong className="text-cyan-400">{cf}%</strong>, Roleta vermelha: <strong className="text-rose-400">{red}%</strong>, Verde: <strong className="text-emerald-400">{green}%</strong>, Slots: <strong className="text-amber-400">{slots}%</strong>
                    </p>
                  </div>
                );
              })()}

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Fórmula: <em>chance final = chance base × (% configurada ÷ 50)</em>. O ajuste preserva as proporções naturais de cada jogo.
              </p>
            </div>

            {/* Min Bet */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Aposta Mínima em Diamantes:
              </label>
              <input
                type="number"
                min="1"
                value={settings.minBetDiamonds}
                onChange={(e) => setSettings({ ...settings, minBetDiamonds: parseInt(e.target.value) || 1 })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Menor valor permitido para abrir uma aposta em qualquer jogo.
              </p>
            </div>

            {/* Server IP */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                IP do Servidor de Minecraft:
              </label>
              <input
                type="text"
                value={settings.serverIp}
                onChange={(e) => setSettings({ ...settings, serverIp: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono"
              />
            </div>

            {/* Banca Location */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Coordenadas da Banca no Spawn:
              </label>
              <input
                type="text"
                value={settings.bancaCoordinates}
                onChange={(e) => setSettings({ ...settings, bancaCoordinates: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono"
              />
            </div>

            {/* Deposit Notice Text */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Aviso de Depósito (Exibido aos Jogadores):
              </label>
              <input
                type="text"
                value={settings.depositNotice}
                onChange={(e) => setSettings({ ...settings, depositNotice: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono"
              />
            </div>

            {/* Withdraw Notice Text */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Aviso de Saque (Exibido aos Jogadores):
              </label>
              <input
                type="text"
                value={settings.withdrawNotice}
                onChange={(e) => setSettings({ ...settings, withdrawNotice: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono"
              />
            </div>

          </div>

          <button
            type="submit"
            className="w-full md:w-64 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
          >
            Salvar Configurações Gerais
          </button>
        </form>
      )}

      {/* TAB 6: ALL BETS HISTORY */}
      {activeTab === 'bets' && (
        <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Histórico Geral de Apostas
            </h3>
            <p className="text-xs text-slate-400">
              Todas as apostas computadas estritamente no servidor
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Data/Hora</th>
                  <th className="py-3 px-3">Jogador</th>
                  <th className="py-3 px-3">Jogo</th>
                  <th className="py-3 px-3 text-right">Aposta</th>
                  <th className="py-3 px-3 text-right">Mult.</th>
                  <th className="py-3 px-3 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {bets.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {b.playerUsername}
                    </td>
                    <td className="py-3 px-3 uppercase text-[11px] font-semibold text-slate-300">
                      {b.game}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      {b.amount} 💎
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-cyan-400">
                      {b.multiplier.toFixed(2)}x
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-bold ${
                      b.win ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {b.win ? `+${b.profit} 💎` : `-${b.amount} 💎`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: BALANCE ADJUSTMENT AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[#101522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Log de Ajustes de Saldo
            </h3>
            <p className="text-xs text-slate-400">
              Histórico com auditoria de créditos e débitos manuais efetuados por administradores.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Data/Hora</th>
                  <th className="py-3 px-3">Jogador</th>
                  <th className="py-3 px-3 text-right">Ajuste</th>
                  <th className="py-3 px-3 text-right">Novo Saldo</th>
                  <th className="py-3 px-3">Motivo</th>
                  <th className="py-3 px-3">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {balanceLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {l.playerUsername}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-bold ${
                      l.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {l.amount > 0 ? `+${l.amount}` : l.amount} 💎
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-cyan-400">
                      {l.newBalance} 💎
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {l.reason}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-300 text-[11px]">
                      {l.adminUsername}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADJUST BALANCE */}
      {selectedPlayerForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111723] border border-slate-700 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Ajustar Saldo: {selectedPlayerForBalance.username}
            </h3>
            <p className="text-xs text-slate-400">
              Saldo atual: <span className="text-cyan-400 font-mono font-bold">{selectedPlayerForBalance.balance} 💎</span>
            </p>

            <form onSubmit={handleSaveBalanceAdjustment} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceAction('add')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-xl border transition-all ${
                    balanceAction === 'add'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  + Adicionar Diamantes
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAction('remove')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-xl border transition-all ${
                    balanceAction === 'remove'
                      ? 'bg-rose-500 text-slate-950 border-rose-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  - Remover Diamantes
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Quantidade de Diamantes:
                </label>
                <input
                  type="number"
                  min="1"
                  value={balanceDelta}
                  onChange={(e) => setBalanceDelta(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Motivo do Ajuste (Registrado no Log):
                </label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  required
                  placeholder="Ex: Entregou 50 diamantes no baú do spawn"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlayerForBalance(null)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingData}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase rounded-xl shadow-md"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CUSTOM PLAYER WIN RATE */}
      {selectedPlayerForWinRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111723] border border-slate-700 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Chance de Vitória: {selectedPlayerForWinRate.username}
            </h3>
            <p className="text-xs text-slate-400">
              Taxa atual: {selectedPlayerForWinRate.winRatePercent !== null && selectedPlayerForWinRate.winRatePercent !== undefined ? `${selectedPlayerForWinRate.winRatePercent}%` : `Global (${stats?.globalWinRatePercent}%)`}
            </p>

            <form onSubmit={handleSavePlayerWinRate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Porcentagem de Vitória / Ajuste (1 a 99%):
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  placeholder={`Deixe em branco para usar o padrão global (${stats?.globalWinRatePercent ?? 50}%)`}
                  value={customWinRateInput}
                  onChange={(e) => setCustomWinRateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                />

                {/* Dica ao lado/abaixo com a chance final de cada jogo para aquele valor */}
                {(() => {
                  const isBlank = customWinRateInput.trim() === '';
                  const num = isBlank ? (stats?.globalWinRatePercent ?? 50) : parseInt(customWinRateInput, 10);
                  const safeVal = isNaN(num) ? 50 : Math.max(0, Math.min(100, num));
                  const factor = safeVal / 50;
                  const cf = Math.round(Math.max(0, Math.min(50, 50 * factor)));
                  const red = Math.round(Math.max(0, Math.min(47, 47 * factor)));
                  const green = Math.round(Math.max(0, Math.min(5, 5 * factor)));
                  const slots = Math.round(Math.max(0, Math.min(15, 15 * factor)));
                  return (
                    <div className="mt-2.5 p-3 bg-slate-950/80 rounded-xl border border-cyan-500/30 text-xs">
                      <span className="text-[11px] font-bold text-cyan-300 block mb-1">
                        💡 Dica de chance final ({isBlank ? `Padrão Global: ${safeVal}%` : `Individual: ${safeVal}%`}):
                      </span>
                      <p className="font-mono text-[11px] text-slate-200">
                        Coin Flip: <strong className="text-cyan-400">{cf}%</strong>, Roleta vermelha: <strong className="text-rose-400">{red}%</strong>, Verde: <strong className="text-emerald-400">{green}%</strong>, Slots: <strong className="text-amber-400">{slots}%</strong>
                      </p>
                    </div>
                  );
                })()}

                <p className="text-[11px] text-slate-400 mt-2">
                  Fórmula: <em>chance final = chance base × (% configurada ÷ 50)</em>. Deixe em branco para remover o ajuste individual e usar a taxa global do servidor.
                </p>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlayerForWinRate(null)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingData}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs uppercase rounded-xl shadow-md"
                >
                  Salvar Porcentagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
