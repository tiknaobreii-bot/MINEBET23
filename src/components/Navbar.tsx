import React, { useState } from 'react';
import { Player } from '../types';
import { sounds } from '../utils/audio';
import { 
  Gem, 
  Volume2, 
  VolumeX, 
  Plus, 
  ArrowUpRight, 
  Send,
  Shield, 
  User, 
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  player: Player | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  player,
  activeTab,
  setActiveTab,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenAuth,
  onLogout,
  isAdmin,
  onToggleAdmin,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const navLinks = [
    { id: 'home', label: 'Início' },
    { id: 'mines', label: 'Mines' },
    { id: 'crash', label: 'Crash' },
    { id: 'roulette', label: 'Roleta' },
    { id: 'plinko', label: 'Plinko' },
    { id: 'dice', label: 'Dados' },
    { id: 'tower', label: 'Torre' },
    { id: 'blackjack', label: 'Blackjack' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d1118]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('home')} 
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/30 transition-all">
              <div className="w-full h-full bg-[#090c10] rounded-[10px] flex items-center justify-center">
                <Gem className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="font-display text-xl font-extrabold tracking-wider text-white uppercase flex items-center gap-1.5">
                MINE<span className="text-cyan-400">BET</span>
              </span>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 block -mt-1">
                MINECRAFT CASINO
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Concise Nav Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-300">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  sounds.playChip();
                }}
                className={`transition-colors whitespace-nowrap shrink-0 relative py-1 ${
                  isActive 
                    ? 'text-cyan-400 font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Ativar sons' : 'Silenciar'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Admin Switch Quick Link */}
          <button
            onClick={onToggleAdmin}
            title="Portal de Administração"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isAdmin || activeTab === 'admin'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {player ? (
            <div className="flex items-center gap-2">
              {/* Balance Box */}
              <div className="flex items-center bg-[#131924] border border-cyan-500/30 rounded-lg pl-3 pr-1.5 py-1 shadow-inner shadow-cyan-950/40">
                <div className="flex items-center gap-1.5 mr-2">
                  <Gem className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  <span className="font-display text-base font-bold text-white tracking-wide tabular-nums">
                    {player.balance.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[11px] text-cyan-400 font-semibold uppercase">💎</span>
                </div>

                {/* Quick Deposit Button */}
                <button
                  onClick={() => {
                    onOpenDeposit();
                    sounds.playChip();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-md transition-all active:scale-95 shadow-sm shadow-emerald-900/50"
                  title="Depositar Diamantes"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Withdraw Button */}
              <button
                onClick={() => {
                  onOpenWithdraw();
                  sounds.playChip();
                }}
                className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sacar</span>
              </button>

              {/* Transfer Button */}
              <button
                onClick={() => {
                  onOpenTransfer();
                  sounds.playChip();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 rounded-lg border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-sm shadow-cyan-950/40"
                title="Abrir PIX"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>PIX</span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-500/30 flex items-center justify-center font-pixel text-cyan-300 text-sm">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline font-medium max-w-[100px] truncate">{player.username}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#111722] border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Jogador Conectado</p>
                      <p className="text-sm font-semibold text-white truncate">{player.username}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        onOpenWithdraw();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                      Sacar Diamantes
                    </button>

                    <button
                      onClick={() => {
                        onOpenTransfer();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-cyan-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-400" />
                      PIX
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Minhas Apostas
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        onLogout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Desconectar
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-lg shadow-sm shadow-cyan-500/30 transition-all font-sans"
              >
                Cadastrar
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 mt-3 pt-3 pb-2 flex flex-col gap-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === link.id ? 'bg-cyan-500/10 text-cyan-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              onToggleAdmin();
              setMobileMenuOpen(false);
            }}
            className="text-left px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Portal de Administração
          </button>
        </div>
      )}
    </header>
  );
};
