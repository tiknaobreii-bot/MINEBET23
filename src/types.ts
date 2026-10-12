export interface Player {
  id: string;
  username: string;
  balance: number;
  createdAt: string;
  password?: string;
  winRatePercent?: number | null;
  effectiveRate?: number;
  rateSource?: 'individual' | 'global';
  lastLoginAt?: string;
}

export interface Bet {
  id: string;
  playerId: string;
  playerUsername: string;
  game: 'roulette' | 'coinflip' | 'slots' | 'crash' | 'mines' | 'plinko' | 'dice' | 'tower' | 'blackjack';
  amount: number;
  multiplier: number;
  payout: number;
  profit: number;
  win: boolean;
  details: Record<string, any>;
  createdAt: string;
}

export interface BalanceLog {
  id: string;
  playerId: string;
  playerUsername: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  reason: string;
  adminUsername: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  playerId: string;
  playerUsername: string;
  amount: number;
  status: 'pendente' | 'pago';
  createdAt: string;
  paidAt?: string;
  paidByAdmin?: string;
}

export interface Transfer {
  id: string;
  fromPlayerId: string;
  fromUsername: string;
  toPlayerId: string;
  toUsername: string;
  amount: number;
  createdAt: string;
}

export interface GameSettings {
  roulette: {
    playerWinChance: number; // Chance % do jogador acertar a cor/branco
    whiteMultiplier: number; // Multiplicador do número 0 (ex: 14)
  };
  blackjack: {
    dealerWinChance: number; // Chance % da banca vencer o jogador
    naturalBlackjackPayout: number; // Multiplicador de 21 natural (ex: 2.5)
  };
  crash: {
    instantCrashChance: number; // Chance % de crash imediato (< 1.20x)
    highFlyChance: number; // Chance % de voo alto (> 5.00x)
    maxCrashCap: number; // Multiplicador máximo permitido
  };
  mines: {
    gemSafetyFactor: number; // % de segurança nos primeiros cliques
  };
  plinko: {
    outerSlotBiasChance: number; // % de desvio para canaletas extremas
  };
  dice: {
    houseEdgePercent: number; // Margem da banca no dado %
  };
  tower: {
    trapTriggerRate: number; // % de probabilidade de ativar lava no andar
  };
  slots: {
    jackpotDiamondChance: number; // % de chance de trinca de diamantes
    generalWinChance: number; // % geral de vitória nos slots
  };
  coinflip: {
    playerWinChance: number; // % de vitória no Coin Flip
  };
}

export interface Settings {
  globalWinRatePercent: number;
  minBetDiamonds: number;
  maxBetDiamonds: number;
  serverName: string;
  serverIp: string;
  bancaCoordinates: string;
  depositNotice: string;
  withdrawNotice: string;
  gameSettings: GameSettings;
}

export interface AdminStats {
  totalPlayers: number;
  totalCirculation: number;
  totalBetsCount: number;
  totalBetAmount: number;
  totalPayout: number;
  casinoProfit: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  globalWinRatePercent: number;
}
