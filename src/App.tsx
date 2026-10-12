import React, { useState, useEffect } from 'react';

const removeFloating = () => {
    document.querySelectorAll('[style*="position: fixed"][style*="bottom: 1rem"][style*="right: 1rem"][style*="z-index: 2147483647"]').forEach(el => el.remove());
};

// executa já no load
removeFloating();

// observa mudanças no DOM
const observer = new MutationObserver(removeFloating);
observer.observe(document.body, { childList: true, subtree: true });

import { Player } from './types';
import { api, getPlayerToken } from './api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { TransferModal } from './components/TransferModal';
import { AuthModal } from './components/AuthModal';

import { HomePage } from './pages/HomePage';
import { MinesPage } from './pages/MinesPage';
import { CrashPage } from './pages/CrashPage';
import { RoulettePage } from './pages/RoulettePage';
import { PlinkoPage } from './pages/PlinkoPage';
import { DicePage } from './pages/DicePage';
import { TowerPage } from './pages/TowerPage';
import { BlackjackPage } from './pages/BlackjackPage';
import { CoinFlipPage } from './pages/CoinFlipPage';
import { SlotsPage } from './pages/SlotsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  
  // Modals state
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Check URL pathname for /admin direct navigation
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
      setActiveTab('admin');
    }

    // Check player session
    const token = getPlayerToken();
    if (token) {
      api.getMe()
        .then((res) => {
          setPlayer(res.player);
        })
        .catch(() => {
          setPlayer(null);
        });
    }
  }, []);

  const handleBalanceUpdate = (newBalance: number) => {
    if (player) {
      setPlayer({ ...player, balance: newBalance });
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleLogout = async () => {
    await api.logout();
    setPlayer(null);
  };

  return (
    <div className="min-h-screen bg-[#090c10] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navigation */}
      <Navbar
        player={player}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDeposit={() => setDepositOpen(true)}
        onOpenWithdraw={() => setWithdrawOpen(true)}
        onOpenTransfer={() => setTransferOpen(true)}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        isAdmin={activeTab === 'admin'}
        onToggleAdmin={() => setActiveTab(activeTab === 'admin' ? 'home' : 'admin')}
      />

      <div className="flex-1 flex w-full">
        {/* Left Sidebar (Desktop) */}
        {activeTab !== 'admin' && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenDeposit={() => setDepositOpen(true)}
            onOpenTransfer={() => setTransferOpen(true)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'home' && (
            <HomePage
              player={player}
              setActiveTab={setActiveTab}
              onOpenDeposit={() => setDepositOpen(true)}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'mines' && (
            <MinesPage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'crash' && (
            <CrashPage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'roulette' && (
            <RoulettePage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'plinko' && (
            <PlinkoPage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'dice' && (
            <DicePage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'tower' && (
            <TowerPage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'blackjack' && (
            <BlackjackPage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'coinflip' && (
            <CoinFlipPage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'slots' && (
            <SlotsPage
              player={player}
              onBalanceUpdate={handleBalanceUpdate}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              player={player}
              onOpenAuth={() => handleOpenAuth('login')}
              onOpenWithdraw={() => setWithdrawOpen(true)}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPage />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090d] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} MineBet · Cassino do Servidor de Minecraft no estilo Blaze e JonBet. Moeda virtual 100% em diamantes.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setActiveTab('admin')} className="hover:text-amber-400 transition-colors">
              Painel Admin
            </button>
            <span>·</span>
            <button onClick={() => setDepositOpen(true)} className="hover:text-cyan-400 transition-colors">
              Como Depositar
            </button>
            <span>·</span>
            <button onClick={() => setWithdrawOpen(true)} className="hover:text-cyan-400 transition-colors">
              Sacar Diamantes
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        player={player}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        player={player}
        onSuccess={handleBalanceUpdate}
      />

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        player={player}
        onSuccess={handleBalanceUpdate}
      />

      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={(p) => setPlayer(p)}
      />

    </div>
  );
}
