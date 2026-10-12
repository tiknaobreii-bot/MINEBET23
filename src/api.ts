import { Player, Bet, BalanceLog, Withdrawal, Settings, AdminStats, Transfer, GameSettings } from './types';

const PLAYER_TOKEN_KEY = 'minebet_player_token';
const ADMIN_TOKEN_KEY = 'minebet_admin_token';

export function getPlayerToken(): string | null {
  return localStorage.getItem(PLAYER_TOKEN_KEY);
}

export function setPlayerToken(token: string | null) {
  if (token) localStorage.setItem(PLAYER_TOKEN_KEY, token);
  else localStorage.removeItem(PLAYER_TOKEN_KEY);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, isAdmin = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = isAdmin ? getAdminToken() : getPlayerToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente em alguns instantes.');
  }

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    throw new Error(data.error || `O servidor respondeu com erro (${res.status}).`);
  }

  return data as T;
}

// Player Auth
export const api = {
  // Auth
  async register(username: string, password: string): Promise<{ token: string; player: Player }> {
    const res = await request<{ token: string; player: Player }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setPlayerToken(res.token);
    return res;
  },

  async login(username: string, password: string): Promise<{ token: string; player: Player }> {
    const res = await request<{ token: string; player: Player }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setPlayerToken(res.token);
    return res;
  },

  async getMe(): Promise<{ player: Player }> {
    return request<{ player: Player }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setPlayerToken(null);
    }
  },

  // Wallet
  async getDepositInfo(): Promise<{ serverName: string; serverIp: string; bancaCoordinates: string; depositNotice: string }> {
    return request('/api/wallet/deposit-info');
  },

  async withdraw(amount: number): Promise<{ success: boolean; withdrawal: Withdrawal; newBalance: number; notice: string }> {
    return request('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async getPlayerWithdrawals(): Promise<{ withdrawals: Withdrawal[] }> {
    return request('/api/wallet/withdrawals');
  },

  async transferDiamonds(toUsername: string, amount: number): Promise<{
    success: boolean;
    transfer: Transfer;
    newBalance: number;
    message: string;
  }> {
    return request('/api/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify({ toUsername, amount }),
    });
  },

  async getMyTransfers(): Promise<{ transfers: Transfer[] }> {
    return request('/api/wallet/my-transfers');
  },

  // Games
  async rollRoulette(betType: 'red' | 'black' | 'white', amount: number): Promise<{
    rollNumber: number;
    rollColor: 'red' | 'black' | 'white';
    win: boolean;
    multiplier: number;
    payout: number;
    profit: number;
    newBalance: number;
    betRecord: Bet;
  }> {
    return request('/api/games/roulette/roll', {
      method: 'POST',
      body: JSON.stringify({ betType, amount }),
    });
  },

  async playCoinFlip(choice: 'gold' | 'diamond', amount: number): Promise<{
    outcome: 'gold' | 'diamond';
    win: boolean;
    multiplier: number;
    payout: number;
    profit: number;
    newBalance: number;
    betRecord: Bet;
  }> {
    return request('/api/games/coinflip/play', {
      method: 'POST',
      body: JSON.stringify({ choice, amount }),
    });
  },

  async spinSlots(amount: number): Promise<{
    reels: string[];
    multiplier: number;
    win: boolean;
    payout: number;
    profit: number;
    newBalance: number;
    betRecord: Bet;
  }> {
    return request('/api/games/slots/spin', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async startCrash(amount: number, autoCashout?: number): Promise<{
    roundId: string;
    amount: number;
    crashPoint: number;
    newBalance: number;
  }> {
    return request('/api/games/crash/start', {
      method: 'POST',
      body: JSON.stringify({ amount, autoCashout }),
    });
  },

  async cashoutCrash(roundId: string, multiplier: number): Promise<{
    success: boolean;
    multiplier: number;
    payout: number;
    profit: number;
    newBalance: number;
    betRecord?: Bet;
    crashed?: boolean;
    crashPoint?: number;
  }> {
    return request('/api/games/crash/cashout', {
      method: 'POST',
      body: JSON.stringify({ roundId, multiplier }),
    });
  },

  async finishLostCrash(roundId: string): Promise<{ success: boolean; newBalance: number }> {
    return request('/api/games/crash/finish-lost', {
      method: 'POST',
      body: JSON.stringify({ roundId }),
    });
  },

  // Mines API
  async startMines(amount: number, minesCount: number): Promise<{
    gameId: string;
    amount: number;
    minesCount: number;
    currentMultiplier: number;
    nextMultiplier: number;
    newBalance: number;
  }> {
    return request('/api/games/mines/start', {
      method: 'POST',
      body: JSON.stringify({ amount, minesCount }),
    });
  },

  async revealMinesTile(gameId: string, tileIndex: number): Promise<{
    hitMine: boolean;
    tileIndex: number;
    currentMultiplier?: number;
    nextMultiplier?: number;
    revealedCount?: number;
    cleared?: boolean;
    payout?: number;
    profit?: number;
    minePositions?: number[];
    newBalance: number;
  }> {
    return request('/api/games/mines/reveal', {
      method: 'POST',
      body: JSON.stringify({ gameId, tileIndex }),
    });
  },

  async cashoutMines(gameId: string): Promise<{
    success: boolean;
    multiplier: number;
    payout: number;
    profit: number;
    minePositions: number[];
    newBalance: number;
  }> {
    return request('/api/games/mines/cashout', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    });
  },

  // Plinko API
  async dropPlinko(amount: number, risk: 'low' | 'medium' | 'high' = 'medium', rows: 8 | 12 | 16 = 12): Promise<{
    path: number[];
    slotIndex: number;
    multiplier: number;
    payout: number;
    profit: number;
    win: boolean;
    newBalance: number;
    betRecord: Bet;
  }> {
    return request('/api/games/plinko/drop', {
      method: 'POST',
      body: JSON.stringify({ amount, risk, rows }),
    });
  },

  // Dice API
  async rollDice(amount: number, target: number, condition: 'over' | 'under'): Promise<{
    roll: number;
    target: number;
    condition: 'over' | 'under';
    multiplier: number;
    win: boolean;
    payout: number;
    profit: number;
    newBalance: number;
    betRecord: Bet;
  }> {
    return request('/api/games/dice/roll', {
      method: 'POST',
      body: JSON.stringify({ amount, target, condition }),
    });
  },

  // Tower API
  async startTower(amount: number): Promise<{
    gameId: string;
    amount: number;
    currentFloor: number;
    currentMultiplier: number;
    nextMultiplier: number;
    newBalance: number;
  }> {
    return request('/api/games/tower/start', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async stepTower(gameId: string, blockIndex: number): Promise<{
    hitTrap: boolean;
    trapPosition: number;
    floor: number;
    completed?: boolean;
    multiplier?: number;
    nextMultiplier?: number;
    payout?: number;
    profit?: number;
    newBalance: number;
  }> {
    return request('/api/games/tower/step', {
      method: 'POST',
      body: JSON.stringify({ gameId, blockIndex }),
    });
  },

  async cashoutTower(gameId: string): Promise<{
    success: boolean;
    multiplier: number;
    payout: number;
    profit: number;
    newBalance: number;
  }> {
    return request('/api/games/tower/cashout', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    });
  },

  // Blackjack API
  async dealBlackjack(amount: number): Promise<{
    gameId: string;
    playerHand: Array<{ suit: string; value: string; score: number }>;
    dealerHand: Array<{ suit: string; value: string; score: number }>;
    playerScore: number;
    dealerScore?: number;
    status: 'playing' | 'player_win' | 'dealer_win' | 'push' | 'player_blackjack';
    payout?: number;
    profit?: number;
    newBalance: number;
  }> {
    return request('/api/games/blackjack/deal', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async actionBlackjack(gameId: string, action: 'hit' | 'stand' | 'double'): Promise<{
    playerHand: Array<{ suit: string; value: string; score: number }>;
    dealerHand: Array<{ suit: string; value: string; score: number }>;
    playerScore: number;
    dealerScore: number;
    status: 'playing' | 'player_win' | 'dealer_win' | 'push';
    payout?: number;
    profit?: number;
    newBalance: number;
  }> {
    return request('/api/games/blackjack/action', {
      method: 'POST',
      body: JSON.stringify({ gameId, action }),
    });
  },

  // Casino Feed & History
  async getRecentActivity(): Promise<{ recentBets: Bet[] }> {
    return request('/api/games/recent-activity');
  },

  async getMyHistory(): Promise<{ bets: Bet[] }> {
    return request('/api/games/my-history');
  },

  // Admin APIs
  admin: {
    async login(username: string, password: string): Promise<{ token: string; admin: { id: string; username: string } }> {
      const res = await request<{ token: string; admin: { id: string; username: string } }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAdminToken(res.token);
      return res;
    },

    async getMe(): Promise<{ admin: { id: string; username: string } }> {
      return request('/api/admin/me', {}, true);
    },

    async logout(): Promise<void> {
      setAdminToken(null);
    },

    async getPlayers(search?: string): Promise<{ players: Player[] }> {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      return request(`/api/admin/players${query}`, {}, true);
    },

    async adjustPlayerBalance(playerId: string, amount: number, reason: string): Promise<{ success: boolean; player: Player; log: BalanceLog }> {
      return request(`/api/admin/players/${playerId}/balance`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      }, true);
    },

    async setPlayerWinRate(playerId: string, winRatePercent: number | null): Promise<{ success: boolean; player: Player }> {
      return request(`/api/admin/players/${playerId}/winrate`, {
        method: 'POST',
        body: JSON.stringify({ winRatePercent }),
      }, true);
    },

    async getWithdrawals(): Promise<{ pendingCount: number; withdrawals: Withdrawal[] }> {
      return request('/api/admin/withdrawals', {}, true);
    },

    async markWithdrawalPaid(id: string): Promise<{ success: boolean; withdrawal: Withdrawal }> {
      return request(`/api/admin/withdrawals/${id}/pay`, {
        method: 'POST',
      }, true);
    },

    async getBets(): Promise<{ bets: Bet[] }> {
      return request('/api/admin/bets', {}, true);
    },

    async getBalanceLogs(): Promise<{ balanceLogs: BalanceLog[] }> {
      return request('/api/admin/balance-logs', {}, true);
    },

    async getSettings(): Promise<{ settings: Settings }> {
      return request('/api/admin/settings', {}, true);
    },

    async updateSettings(settings: Partial<Settings>): Promise<{ success: boolean; settings: Settings }> {
      return request('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, true);
    },

    async getStats(): Promise<AdminStats> {
      return request('/api/admin/stats', {}, true);
    },

    async getTransfers(): Promise<{ transfers: Transfer[] }> {
      return request('/api/admin/transfers', {}, true);
    },

    async updateGameSettings(gameSettings: Partial<GameSettings>): Promise<{ success: boolean; gameSettings: GameSettings }> {
      return request('/api/admin/settings/games', {
        method: 'PUT',
        body: JSON.stringify({ gameSettings }),
      }, true);
    },
  },
};
