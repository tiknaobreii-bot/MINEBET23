import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Interface definitions
export interface Player {
  id: string;
  username: string;
  password: string; // Plaintext as explicitly required for server admin display
  balance: number; // Integer diamonds
  winRatePercent: number | null; // null = use global, or 1-100
  createdAt: string;
  lastLoginAt: string;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  createdAt: string;
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
  amount: number; // Positive = credit, negative = debit
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
    playerWinChance: number;
    whiteMultiplier: number;
  };
  blackjack: {
    dealerWinChance: number;
    naturalBlackjackPayout: number;
  };
  crash: {
    instantCrashChance: number;
    highFlyChance: number;
    maxCrashCap: number;
  };
  mines: {
    gemSafetyFactor: number;
  };
  plinko: {
    outerSlotBiasChance: number;
  };
  dice: {
    houseEdgePercent: number;
  };
  tower: {
    trapTriggerRate: number;
  };
  slots: {
    jackpotDiamondChance: number;
    generalWinChance: number;
  };
  coinflip: {
    playerWinChance: number;
  };
}

export interface Settings {
  globalWinRatePercent: number; // Default 48%
  minBetDiamonds: number;
  maxBetDiamonds: number;
  serverName: string;
  serverIp: string;
  bancaCoordinates: string;
  depositNotice: string;
  withdrawNotice: string;
  gameSettings: GameSettings;
}

export interface Database {
  players: Player[];
  admins: Admin[];
  bets: Bet[];
  balance_logs: BalanceLog[];
  withdrawals: Withdrawal[];
  transfers: Transfer[];
  settings: Settings;
}

// In-memory active crash rounds
const activeCrashRounds: Map<string, {
  roundId: string;
  playerId: string;
  playerUsername: string;
  amount: number;
  crashPoint: number;
  startTime: number;
  cashedOut: boolean;
}> = new Map();

// In-memory active Mines games
const activeMinesGames: Map<string, {
  gameId: string;
  playerId: string;
  playerUsername: string;
  amount: number;
  minesCount: number;
  minePositions: number[];
  revealedTiles: number[];
  currentMultiplier: number;
  active: boolean;
}> = new Map();

// In-memory active Tower games
const activeTowerGames: Map<string, {
  gameId: string;
  playerId: string;
  playerUsername: string;
  amount: number;
  currentFloor: number; // 0 to 7
  trapPositions: number[]; // 1 trap per floor (0..3)
  active: boolean;
}> = new Map();

// In-memory active Blackjack games
interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  score: number;
}
const activeBlackjackGames: Map<string, {
  gameId: string;
  playerId: string;
  playerUsername: string;
  amount: number;
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  doubled: boolean;
  status: 'playing' | 'player_win' | 'dealer_win' | 'push' | 'player_blackjack';
}> = new Map();

// Helper to initialize or load DB
function initDatabase(): Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaultDb: Database = {
    players: [
      {
        id: 'p-steve',
        username: 'Steve',
        password: 'steve123',
        balance: 250,
        winRatePercent: null,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastLoginAt: new Date().toISOString()
      },
      {
        id: 'p-alex',
        username: 'Alex_Gamer',
        password: 'alex2026',
        balance: 620,
        winRatePercent: 60,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        lastLoginAt: new Date().toISOString()
      },
      {
        id: 'p-diamondking',
        username: 'DiamondKing',
        password: 'kingminer',
        balance: 1450,
        winRatePercent: null,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        lastLoginAt: new Date().toISOString()
      }
    ],
    admins: [
      {
        id: 'admin-1',
        username: 'admin',
        password: 'admin123',
        createdAt: new Date().toISOString()
      }
    ],
    bets: [
      {
        id: 'bet-101',
        playerId: 'p-diamondking',
        playerUsername: 'DiamondKing',
        game: 'roulette',
        amount: 50,
        multiplier: 2,
        payout: 100,
        profit: 50,
        win: true,
        details: { colorBet: 'red', rollNumber: 3, rollColor: 'red' },
        createdAt: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: 'bet-102',
        playerId: 'p-alex',
        playerUsername: 'Alex_Gamer',
        game: 'crash',
        amount: 25,
        multiplier: 3.42,
        payout: 85,
        profit: 60,
        win: true,
        details: { crashPoint: 4.10, cashoutAt: 3.42 },
        createdAt: new Date(Date.now() - 360000).toISOString()
      },
      {
        id: 'bet-103',
        playerId: 'p-steve',
        playerUsername: 'Steve',
        game: 'coinflip',
        amount: 20,
        multiplier: 0,
        payout: 0,
        profit: -20,
        win: false,
        details: { choice: 'diamond', outcome: 'gold' },
        createdAt: new Date(Date.now() - 600000).toISOString()
      }
    ],
    balance_logs: [
      {
        id: 'log-1',
        playerId: 'p-diamondking',
        playerUsername: 'DiamondKing',
        amount: 500,
        previousBalance: 950,
        newBalance: 1450,
        reason: 'Depósito entregue na banca do servidor (Spawn)',
        adminUsername: 'admin',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    withdrawals: [
      {
        id: 'wd-1',
        playerId: 'p-steve',
        playerUsername: 'Steve',
        amount: 50,
        status: 'pendente',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ],
    transfers: [
      {
        id: 'tr-1',
        fromPlayerId: 'p-diamondking',
        fromUsername: 'DiamondKing',
        toPlayerId: 'p-steve',
        toUsername: 'Steve',
        amount: 30,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    settings: {
      globalWinRatePercent: 48,
      minBetDiamonds: 1,
      maxBetDiamonds: 10000,
      serverName: 'Rede Craft Brasil',
      serverIp: 'jogar.minebet.com.br',
      bancaCoordinates: 'X: 120, Y: 64, Z: -350 (NPC Banca do Cassino no Spawn)',
      depositNotice: 'Entregue os diamantes na banca no servidor e aguarde o admin creditar.',
      withdrawNotice: 'Vá até a banca no servidor para receber seus diamantes.',
      gameSettings: {
        roulette: { playerWinChance: 48, whiteMultiplier: 14 },
        blackjack: { dealerWinChance: 52, naturalBlackjackPayout: 2.5 },
        crash: { instantCrashChance: 15, highFlyChance: 25, maxCrashCap: 100 },
        mines: { gemSafetyFactor: 60 },
        plinko: { outerSlotBiasChance: 12 },
        dice: { houseEdgePercent: 1.5 },
        tower: { trapTriggerRate: 25 },
        slots: { jackpotDiamondChance: 5, generalWinChance: 45 },
        coinflip: { playerWinChance: 49 },
      }
    }
  };

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      const merged: Database = {
        ...defaultDb,
        ...parsed,
        transfers: parsed.transfers || defaultDb.transfers,
        settings: {
          ...defaultDb.settings,
          ...parsed.settings,
          gameSettings: {
            ...defaultDb.settings.gameSettings,
            ...(parsed.settings?.gameSettings || {})
          }
        }
      };
      return merged;
    } catch (e) {
      console.error('Error reading db.json, using defaults', e);
      return defaultDb;
    }
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }
}

let db = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

// In-memory token maps for simple and reliable session management
const playerTokens = new Map<string, string>(); // token -> playerId
const adminTokens = new Map<string, string>();  // token -> adminId

// Middleware for Player Auth
function authenticatePlayer(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || (req.headers['x-player-token'] as string);

  if (!token || !playerTokens.has(token)) {
    return res.status(401).json({ error: 'Sessão expirada ou não autenticado.' });
  }

  const playerId = playerTokens.get(token)!;
  const player = db.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(401).json({ error: 'Jogador não encontrado.' });
  }

  (req as any).player = player;
  (req as any).token = token;
  next();
}

// Middleware for Admin Auth
function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || (req.headers['x-admin-token'] as string);

  if (!token || !adminTokens.has(token)) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores autorizados.' });
  }

  const adminId = adminTokens.get(token)!;
  const admin = db.admins.find(a => a.id === adminId);
  if (!admin) {
    return res.status(403).json({ error: 'Administrador não encontrado.' });
  }

  (req as any).admin = admin;
  next();
}

// Helper: Determine effective configured win percentage (0 to 100) and priority source
// Prioridade: se o jogador tem % individual preenchida, usa a dele; se estiver vazia, usa a global.
function getPlayerConfiguredRate(player: Player): { percent: number; isIndividual: boolean } {
  if (player.winRatePercent !== null && player.winRatePercent !== undefined && !isNaN(Number(player.winRatePercent))) {
    return {
      percent: Math.max(0, Math.min(100, Number(player.winRatePercent))),
      isIndividual: true
    };
  }
  const global = db.settings.globalWinRatePercent ?? 50;
  return {
    percent: Math.max(0, Math.min(100, Number(global))),
    isIndividual: false
  };
}

// CORREÇÃO:
// Fórmula: chance final = chance base do jogo × (% configurada ÷ 50), limitada entre 0% e a chance base.
// Assim, 50% = chance normal, valores menores deixam a casa mais favorecida e cada jogo mantém sua proporção.
function getGameFinalChance(baseChancePercent: number, configuredPercent: number): number {
  const adjusted = baseChancePercent * (configuredPercent / 50);
  return Math.max(0, Math.min(baseChancePercent, adjusted));
}

// Helper: Calculate effective win chance with per-game customization or baseline adjustment
function getEffectiveWinRate(player: Player, gameKey?: keyof GameSettings): number {
  const { percent } = getPlayerConfiguredRate(player);
  if (gameKey === 'coinflip') return getGameFinalChance(50.0, percent);
  if (gameKey === 'roulette') return getGameFinalChance(47.0, percent);
  if (gameKey === 'slots') return getGameFinalChance(15.0, percent);
  if (gameKey === 'blackjack') return getGameFinalChance(42.0, percent);
  return getGameFinalChance(50.0, percent);
}


// ==========================================
// AUTH & PLAYER ROUTES
// ==========================================

// Player Registration
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'O nome de usuário deve ter no mínimo 3 caracteres.' });
  }
  if (!password || typeof password !== 'string' || password.length < 3) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 3 caracteres.' });
  }

  const cleanUser = username.trim();
  const existing = db.players.find(p => p.username.toLowerCase() === cleanUser.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Nome de usuário já cadastrado.' });
  }

  const newPlayer: Player = {
    id: 'p-' + crypto.randomUUID().slice(0, 8),
    username: cleanUser,
    password: password,
    balance: 50, // Welcome bonus of 50 diamonds for initial server engagement
    winRatePercent: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  db.players.push(newPlayer);
  saveDatabase();

  const token = crypto.randomUUID();
  playerTokens.set(token, newPlayer.id);

  return res.json({
    token,
    player: {
      id: newPlayer.id,
      username: newPlayer.username,
      balance: newPlayer.balance,
      createdAt: newPlayer.createdAt
    }
  });
});

// Player Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const player = db.players.find(p => p.username.toLowerCase() === cleanUser && p.password === password);
  if (!player) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  player.lastLoginAt = new Date().toISOString();
  saveDatabase();

  const token = crypto.randomUUID();
  playerTokens.set(token, player.id);

  return res.json({
    token,
    player: {
      id: player.id,
      username: player.username,
      balance: player.balance,
      createdAt: player.createdAt
    }
  });
});

// Player Profile / Current Session
app.get('/api/auth/me', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  return res.json({
    player: {
      id: player.id,
      username: player.username,
      balance: player.balance,
      createdAt: player.createdAt
    }
  });
});

// Player Logout
app.post('/api/auth/logout', authenticatePlayer, (req, res) => {
  const token = (req as any).token as string;
  playerTokens.delete(token);
  return res.json({ success: true });
});

// ==========================================
// ADMIN AUTH ROUTES
// ==========================================

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha de administrador.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const admin = db.admins.find(a => a.username.toLowerCase() === cleanUser && a.password === password);
  if (!admin) {
    return res.status(401).json({ error: 'Credenciais de administrador incorretas.' });
  }

  const token = crypto.randomUUID();
  adminTokens.set(token, admin.id);

  return res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username
    }
  });
});

app.get('/api/admin/me', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  return res.json({ admin: { id: admin.id, username: admin.username } });
});

// ==========================================
// WALLET: DEPOSIT & WITHDRAW
// ==========================================

// Get Deposit Info
app.get('/api/wallet/deposit-info', (req, res) => {
  return res.json({
    serverName: db.settings.serverName,
    serverIp: db.settings.serverIp,
    bancaCoordinates: db.settings.bancaCoordinates,
    depositNotice: db.settings.depositNotice
  });
});

// Request Withdrawal
app.post('/api/wallet/withdraw', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  let { amount } = req.body;
  amount = parseInt(amount, 10);

  if (isNaN(amount) || amount < 1) {
    return res.status(400).json({ error: 'A quantidade de diamantes deve ser no mínimo 1.' });
  }

  if (amount > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você possui ${player.balance} diamantes.` });
  }

  // Deduct from balance
  player.balance -= amount;

  const withdrawal: Withdrawal = {
    id: 'wd-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    amount,
    status: 'pendente',
    createdAt: new Date().toISOString()
  };

  db.withdrawals.unshift(withdrawal);
  saveDatabase();

  return res.json({
    success: true,
    withdrawal,
    newBalance: player.balance,
    notice: db.settings.withdrawNotice
  });
});

// Player's withdrawal history
app.get('/api/wallet/withdrawals', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const playerWithdrawals = db.withdrawals.filter(w => w.playerId === player.id);
  return res.json({ withdrawals: playerWithdrawals });
});

// Transfer diamonds between players
app.post('/api/wallet/transfer', authenticatePlayer, (req, res) => {
  const sender = (req as any).player as Player;
  const { toUsername, amount } = req.body;
  const transferAmount = parseInt(amount, 10);

  if (!toUsername || typeof toUsername !== 'string' || !toUsername.trim()) {
    return res.status(400).json({ error: 'Informe o nick do jogador destinatário.' });
  }

  if (isNaN(transferAmount) || transferAmount < 1) {
    return res.status(400).json({ error: 'A quantidade de diamantes a transferir deve ser no mínimo 1.' });
  }

  if (transferAmount > sender.balance) {
    return res.status(400).json({ error: `Saldo insuficiente para transferência. Seu saldo é de ${sender.balance} 💎.` });
  }

  const cleanRecipient = toUsername.trim().toLowerCase();
  if (cleanRecipient === sender.username.toLowerCase()) {
    return res.status(400).json({ error: 'Você não pode transferir diamantes para si mesmo.' });
  }

  const recipient = db.players.find(p => p.username.toLowerCase() === cleanRecipient);
  if (!recipient) {
    return res.status(404).json({ error: `Jogador "${toUsername}" não foi encontrado no servidor.` });
  }

  // Execute transfer
  sender.balance -= transferAmount;
  recipient.balance += transferAmount;

  const transferRecord: Transfer = {
    id: 'tr-' + crypto.randomUUID().slice(0, 8),
    fromPlayerId: sender.id,
    fromUsername: sender.username,
    toPlayerId: recipient.id,
    toUsername: recipient.username,
    amount: transferAmount,
    createdAt: new Date().toISOString()
  };

  if (!db.transfers) db.transfers = [];
  db.transfers.unshift(transferRecord);
  saveDatabase();

  return res.json({
    success: true,
    transfer: transferRecord,
    newBalance: sender.balance,
    message: `Transferência de ${transferAmount} 💎 para ${recipient.username} realizada com sucesso!`
  });
});

// Player's transfer history
app.get('/api/wallet/my-transfers', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const list = (db.transfers || []).filter(t => t.fromPlayerId === player.id || t.toPlayerId === player.id);
  return res.json({ transfers: list });
});

// ==========================================
// GAME ENGINE (ALL LOGIC RUNS STRICTLY SERVER-SIDE)
// ==========================================

// 1. ROLETA (BLAZE / JONBET STYLE DOUBLE)
// Numbers: 0 = Diamond/White (custom multiplier), 1..7 = Red (2x), 8..14 = Black (2x)
app.post('/api/games/roulette/roll', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { betType, amount } = req.body;
  const betVal = parseInt(amount, 10);

  if (!['red', 'black', 'white'].includes(betType)) {
    return res.status(400).json({ error: 'Tipo de aposta inválido. Escolha Vermelho, Preto ou Branco.' });
  }
  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  const { percent: configuredRate } = getPlayerConfiguredRate(player);
  const whiteMultiplier = db.settings.gameSettings?.roulette?.whiteMultiplier || 10;

  let rollNumber: number;
  let rollColor: 'red' | 'black' | 'white';
  let isWin = false;

  if (betType === 'white') {
    // Verde/Branco base ~5%, paga 10x
    const finalChance = getGameFinalChance(5.0, configuredRate);
    isWin = (Math.random() * 100) < finalChance;

    if (isWin) {
      rollNumber = 0;
      rollColor = 'white';
    } else {
      // Defeat: pick red or black (never white)
      const pickRed = Math.random() < 0.5;
      rollNumber = pickRed ? Math.floor(Math.random() * 7) + 1 : Math.floor(Math.random() * 7) + 8;
      rollColor = pickRed ? 'red' : 'black';
    }
  } else if (betType === 'red') {
    // Vermelho base ~47%, paga 2x
    const finalChance = getGameFinalChance(47.0, configuredRate);
    isWin = (Math.random() * 100) < finalChance;

    if (isWin) {
      rollNumber = Math.floor(Math.random() * 7) + 1; // 1 to 7
      rollColor = 'red';
    } else {
      // Defeat: must NOT be red. Verde base ~5%, preto the remainder.
      const greenChance = getGameFinalChance(5.0, configuredRate);
      const pickWhite = (Math.random() * 100) < greenChance;
      if (pickWhite) {
        rollNumber = 0;
        rollColor = 'white';
      } else {
        rollNumber = Math.floor(Math.random() * 7) + 8; // 8 to 14
        rollColor = 'black';
      }
    }
  } else {
    // Preto base ~47%, paga 2x
    const finalChance = getGameFinalChance(47.0, configuredRate);
    isWin = (Math.random() * 100) < finalChance;

    if (isWin) {
      rollNumber = Math.floor(Math.random() * 7) + 8; // 8 to 14
      rollColor = 'black';
    } else {
      // Defeat: must NOT be black. Verde base ~5%, vermelho the remainder.
      const greenChance = getGameFinalChance(5.0, configuredRate);
      const pickWhite = (Math.random() * 100) < greenChance;
      if (pickWhite) {
        rollNumber = 0;
        rollColor = 'white';
      } else {
        rollNumber = Math.floor(Math.random() * 7) + 1; // 1 to 7
        rollColor = 'red';
      }
    }
  }

  const multiplier = isWin ? (betType === 'white' ? whiteMultiplier : 2) : 0;
  const payout = isWin ? betVal * multiplier : 0;
  const profit = payout - betVal;

  if (isWin) {
    player.balance += payout;
  }

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'roulette',
    amount: betVal,
    multiplier,
    payout,
    profit,
    win: isWin,
    details: { betType, rollNumber, rollColor },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  if (db.bets.length > 500) db.bets.pop();
  saveDatabase();

  return res.json({
    rollNumber,
    rollColor,
    win: isWin,
    multiplier,
    payout,
    profit,
    newBalance: player.balance,
    betRecord
  });
});

// 2. COIN FLIP (OURO VS DIAMANTE)
app.post('/api/games/coinflip/play', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { choice, amount } = req.body; // 'gold' | 'diamond'
  const betVal = parseInt(amount, 10);

  if (!['gold', 'diamond'].includes(choice)) {
    return res.status(400).json({ error: 'Escolha Ouro ou Diamante.' });
  }
  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  const { percent: configuredRate } = getPlayerConfiguredRate(player);
  // Base 50%, paga 2x
  const finalChance = getGameFinalChance(50.0, configuredRate);
  const isWin = (Math.random() * 100) < finalChance;

  const outcome: 'gold' | 'diamond' = isWin ? choice : (choice === 'gold' ? 'diamond' : 'gold');
  const multiplier = isWin ? 2 : 0;
  const payout = isWin ? betVal * 2 : 0;
  const profit = payout - betVal;

  if (isWin) {
    player.balance += payout;
  }

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'coinflip',
    amount: betVal,
    multiplier,
    payout,
    profit,
    win: isWin,
    details: { choice, outcome },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  if (db.bets.length > 500) db.bets.pop();
  saveDatabase();

  return res.json({
    outcome,
    win: isWin,
    multiplier,
    payout,
    profit,
    newBalance: player.balance,
    betRecord
  });
});

// 3. SLOTS (MINECRAFT SLOTS)
const SLOT_SYMBOLS = [
  { id: 'diamond', name: 'Diamante', icon: '💎', mult3: 50, weight: 5 },
  { id: 'sword', name: 'Espada Netherite', icon: '🗡️', mult3: 25, weight: 10 },
  { id: 'star', name: 'Estrela do Nether', icon: '🌟', mult3: 15, weight: 15 },
  { id: 'apple', name: 'Maçã Dourada', icon: '🍏', mult3: 8, weight: 20 },
  { id: 'gold', name: 'Barra de Ouro', icon: '🪙', mult3: 5, weight: 25 },
  { id: 'pickaxe', name: 'Picareta de Ferro', icon: '⛏️', mult3: 3, weight: 35 }
];

app.post('/api/games/slots/spin', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { amount } = req.body;
  const betVal = parseInt(amount, 10);

  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  const { percent: configuredRate } = getPlayerConfiguredRate(player);
  // Base 15% (3 iguais é raro, paga 3x; chance muito menor que a de Coin Flip)
  const finalChance = getGameFinalChance(15.0, configuredRate);
  const isWin = (Math.random() * 100) < finalChance;

  let reels: string[] = [];
  let multiplier = 0;

  if (isWin) {
    // Determine which winning combo
    const rand = Math.random() * 100;
    const jackpotChance = db.settings.gameSettings?.slots?.jackpotDiamondChance ?? 5;
    let chosenSymbol = SLOT_SYMBOLS[5]; // pickaxe default (3x)
    if (rand < jackpotChance) chosenSymbol = SLOT_SYMBOLS[0]; // 50x diamond jackpot
    else if (rand < 15) chosenSymbol = SLOT_SYMBOLS[1]; // 25x sword
    else if (rand < 30) chosenSymbol = SLOT_SYMBOLS[2]; // 15x star
    else if (rand < 50) chosenSymbol = SLOT_SYMBOLS[3]; // 8x apple
    else if (rand < 75) chosenSymbol = SLOT_SYMBOLS[4]; // 5x gold
    else chosenSymbol = SLOT_SYMBOLS[5]; // 3x pickaxe

    reels = [chosenSymbol.id, chosenSymbol.id, chosenSymbol.id];
    multiplier = chosenSymbol.mult3;
  } else {
    // Generate losing mix where not all 3 match
    const s1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].id;
    const s2 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].id;
    let s3 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].id;
    if (s1 === s2 && s2 === s3) {
      // Avoid accidental win
      s3 = s1 === 'pickaxe' ? 'gold' : 'pickaxe';
    }
    reels = [s1, s2, s3];
    multiplier = 0;
  }

  const payout = multiplier > 0 ? Math.floor(betVal * multiplier) : 0;
  const profit = payout - betVal;

  if (multiplier > 0) {
    player.balance += payout;
  }

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'slots',
    amount: betVal,
    multiplier,
    payout,
    profit,
    win: multiplier > 0,
    details: { reels },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  if (db.bets.length > 500) db.bets.pop();
  saveDatabase();

  return res.json({
    reels,
    multiplier,
    win: multiplier > 0,
    payout,
    profit,
    newBalance: player.balance,
    betRecord
  });
});

// 4. CRASH (ELYTRA / FOGUETE CRASH ESTILO BLAZE)
app.post('/api/games/crash/start', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { amount, autoCashout } = req.body;
  const betVal = parseInt(amount, 10);

  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  const { percent: configuredRate } = getPlayerConfiguredRate(player);
  // Fator de ajuste: 50% = chance normal (1.0). Valores menores deixam a casa mais favorecida
  const factor = Math.max(0.01, Math.min(1.0, configuredRate / 50));
  const maxCap = db.settings.gameSettings?.crash?.maxCrashCap ?? 100;

  let crashPoint: number;
  const u = Math.random();

  // Se o sorteio cair fora da fração viável (probabilidade aumenta quanto menor for o factor), explode cedo
  if (u >= 0.96 * factor) {
    crashPoint = +(1.00 + Math.random() * 0.18).toFixed(2); // 1.00x a 1.18x
  } else {
    // Distribuição contínua: P(crashPoint >= M) = (0.96 * factor) / M
    // Apostas com multiplicador alto têm chance bem menor que multiplicadores baixos
    const val = (0.96 * factor) / Math.max(0.0001, u);
    crashPoint = +(Math.max(1.01, Math.min(maxCap, val))).toFixed(2);
  }

  const roundId = 'cr-' + crypto.randomUUID().slice(0, 10);
  activeCrashRounds.set(roundId, {
    roundId,
    playerId: player.id,
    playerUsername: player.username,
    amount: betVal,
    crashPoint,
    startTime: Date.now(),
    cashedOut: false
  });

  saveDatabase();

  return res.json({
    roundId,
    amount: betVal,
    crashPoint, // Sent for synced rendering, but cashout validation strictly verified server-side
    newBalance: player.balance
  });
});

app.post('/api/games/crash/cashout', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { roundId, multiplier } = req.body;
  const claimedMult = parseFloat(multiplier);

  const round = activeCrashRounds.get(roundId);
  if (!round) {
    return res.status(400).json({ error: 'Partida não encontrada ou já expirada.' });
  }
  if (round.playerId !== player.id) {
    return res.status(403).json({ error: 'Esta partida não pertence a você.' });
  }
  if (round.cashedOut) {
    return res.status(400).json({ error: 'Você já realizou o saque desta rodada.' });
  }

  // Validate that multiplier did not exceed actual server crash point
  if (claimedMult > round.crashPoint) {
    round.cashedOut = true;
    // Lost
    const betRecord: Bet = {
      id: 'bet-' + crypto.randomUUID().slice(0, 8),
      playerId: player.id,
      playerUsername: player.username,
      game: 'crash',
      amount: round.amount,
      multiplier: 0,
      payout: 0,
      profit: -round.amount,
      win: false,
      details: { crashPoint: round.crashPoint, cashoutAttempt: claimedMult },
      createdAt: new Date().toISOString()
    };
    db.bets.unshift(betRecord);
    saveDatabase();
    activeCrashRounds.delete(roundId);

    return res.json({
      success: false,
      crashed: true,
      crashPoint: round.crashPoint,
      profit: -round.amount,
      newBalance: player.balance
    });
  }

  // Cashout success!
  round.cashedOut = true;
  const payout = Math.floor(round.amount * claimedMult);
  const profit = payout - round.amount;
  player.balance += payout;

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'crash',
    amount: round.amount,
    multiplier: claimedMult,
    payout,
    profit,
    win: true,
    details: { crashPoint: round.crashPoint, cashoutAt: claimedMult },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  saveDatabase();
  activeCrashRounds.delete(roundId);

  return res.json({
    success: true,
    multiplier: claimedMult,
    payout,
    profit,
    newBalance: player.balance,
    betRecord
  });
});

// Finish lost crash round (cleanup when player doesn't cash out in time)
app.post('/api/games/crash/finish-lost', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { roundId } = req.body;

  const round = activeCrashRounds.get(roundId);
  if (!round) {
    return res.json({ success: true, newBalance: player.balance });
  }
  if (round.playerId !== player.id) {
    return res.status(403).json({ error: 'Esta partida não pertence a você.' });
  }
  if (round.cashedOut) {
    return res.json({ success: true, newBalance: player.balance });
  }

  round.cashedOut = true;
  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'crash',
    amount: round.amount,
    multiplier: 0,
    payout: 0,
    profit: -round.amount,
    win: false,
    details: { crashPoint: round.crashPoint, cashoutAt: null },
    createdAt: new Date().toISOString()
  };
  db.bets.unshift(betRecord);
  if (db.bets.length > 500) db.bets.pop();
  saveDatabase();
  activeCrashRounds.delete(roundId);

  return res.json({ success: true, newBalance: player.balance });
});

// ==========================================
// 5. MINES (CAMPO MINADO DE DIAMANTES - ESTILO BLAZE)
// ==========================================

function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = (c * (n - (k - i))) / i;
  }
  return c;
}

function calculateMinesMultiplier(minesCount: number, diamondsRevealed: number): number {
  if (diamondsRevealed <= 0) return 1.0;
  const totalTiles = 25;
  const safeTiles = totalTiles - minesCount;
  if (diamondsRevealed > safeTiles) return 1.0;
  const mult = 0.97 * (combinations(totalTiles, diamondsRevealed) / combinations(safeTiles, diamondsRevealed));
  return Math.max(1.05, +mult.toFixed(2));
}

app.post('/api/games/mines/start', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { amount, minesCount } = req.body;
  const betVal = parseInt(amount, 10);
  const mines = Math.max(1, Math.min(24, parseInt(minesCount, 10) || 3));

  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  // Place mines across 25 tiles
  const allPositions = Array.from({ length: 25 }, (_, i) => i);
  // Shuffle positions
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }
  const minePositions = allPositions.slice(0, mines);

  const gameId = 'mn-' + crypto.randomUUID().slice(0, 8);
  activeMinesGames.set(gameId, {
    gameId,
    playerId: player.id,
    playerUsername: player.username,
    amount: betVal,
    minesCount: mines,
    minePositions,
    revealedTiles: [],
    currentMultiplier: 1.0,
    active: true
  });

  saveDatabase();

  const nextMult = calculateMinesMultiplier(mines, 1);
  return res.json({
    gameId,
    amount: betVal,
    minesCount: mines,
    currentMultiplier: 1.0,
    nextMultiplier: nextMult,
    newBalance: player.balance
  });
});

app.post('/api/games/mines/reveal', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { gameId, tileIndex } = req.body;
  const index = parseInt(tileIndex, 10);

  const game = activeMinesGames.get(gameId);
  if (!game || !game.active || game.playerId !== player.id) {
    return res.status(400).json({ error: 'Partida de Mines inválida ou já finalizada.' });
  }
  if (index < 0 || index > 24) {
    return res.status(400).json({ error: 'Posição do bloco inválida.' });
  }
  if (game.revealedTiles.includes(index)) {
    return res.status(400).json({ error: 'Este bloco já foi aberto.' });
  }

  // Effective win rate logic check
  const { percent: configuredRate } = getPlayerConfiguredRate(player);
  let isMine = game.minePositions.includes(index);

  // Chance natural de segurança no bloco atual
  const remainingTiles = 25 - game.revealedTiles.length;
  const remainingSafe = Math.max(0, remainingTiles - game.minesCount);
  const baseSafeChance = (remainingSafe / remainingTiles) * 100;
  const finalSafeChance = getGameFinalChance(baseSafeChance, configuredRate);

  // Se a casa estiver mais favorecida que a chance final segura
  if (!isMine && (Math.random() * 100) > finalSafeChance && game.revealedTiles.length >= 1) {
    const unrevealedMine = game.minePositions.find(p => !game.revealedTiles.includes(p));
    if (unrevealedMine !== undefined) {
      const mineIdx = game.minePositions.indexOf(unrevealedMine);
      game.minePositions[mineIdx] = index;
      isMine = true;
    }
  }

  if (isMine) {
    // Player hit a mine! Lost
    game.active = false;
    const betRecord: Bet = {
      id: 'bet-' + crypto.randomUUID().slice(0, 8),
      playerId: player.id,
      playerUsername: player.username,
      game: 'mines',
      amount: game.amount,
      multiplier: 0,
      payout: 0,
      profit: -game.amount,
      win: false,
      details: { minesCount: game.minesCount, hitTile: index, minePositions: game.minePositions },
      createdAt: new Date().toISOString()
    };
    db.bets.unshift(betRecord);
    saveDatabase();
    activeMinesGames.delete(gameId);

    return res.json({
      hitMine: true,
      tileIndex: index,
      minePositions: game.minePositions,
      profit: -game.amount,
      newBalance: player.balance
    });
  }

  // Safe diamond tile!
  game.revealedTiles.push(index);
  const currentMult = calculateMinesMultiplier(game.minesCount, game.revealedTiles.length);
  game.currentMultiplier = currentMult;

  const nextMult = calculateMinesMultiplier(game.minesCount, game.revealedTiles.length + 1);

  // Check if all safe diamonds found! (Max win)
  if (game.revealedTiles.length === 25 - game.minesCount) {
    game.active = false;
    const payout = Math.floor(game.amount * currentMult);
    const profit = payout - game.amount;
    player.balance += payout;

    const betRecord: Bet = {
      id: 'bet-' + crypto.randomUUID().slice(0, 8),
      playerId: player.id,
      playerUsername: player.username,
      game: 'mines',
      amount: game.amount,
      multiplier: currentMult,
      payout,
      profit,
      win: true,
      details: { minesCount: game.minesCount, clearedGrid: true },
      createdAt: new Date().toISOString()
    };
    db.bets.unshift(betRecord);
    saveDatabase();
    activeMinesGames.delete(gameId);

    return res.json({
      hitMine: false,
      tileIndex: index,
      cleared: true,
      currentMultiplier: currentMult,
      payout,
      profit,
      minePositions: game.minePositions,
      newBalance: player.balance
    });
  }

  return res.json({
    hitMine: false,
    tileIndex: index,
    currentMultiplier: currentMult,
    nextMultiplier: nextMult,
    revealedCount: game.revealedTiles.length,
    newBalance: player.balance
  });
});

app.post('/api/games/mines/cashout', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { gameId } = req.body;

  const game = activeMinesGames.get(gameId);
  if (!game || !game.active || game.playerId !== player.id) {
    return res.status(400).json({ error: 'Partida de Mines inválida ou já finalizada.' });
  }

  if (game.revealedTiles.length === 0) {
    return res.status(400).json({ error: 'Você precisa abrir pelo menos 1 diamante para encerrar.' });
  }

  game.active = false;
  const payout = Math.floor(game.amount * game.currentMultiplier);
  const profit = payout - game.amount;
  player.balance += payout;

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'mines',
    amount: game.amount,
    multiplier: game.currentMultiplier,
    payout,
    profit,
    win: true,
    details: { minesCount: game.minesCount, diamondsFound: game.revealedTiles.length },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  saveDatabase();
  activeMinesGames.delete(gameId);

  return res.json({
    success: true,
    multiplier: game.currentMultiplier,
    payout,
    profit,
    minePositions: game.minePositions,
    newBalance: player.balance,
    betRecord
  });
});

// ==========================================
// 6. PLINKO (PLINKO PIRÂMIDE ESTILO BLAZE)
// ==========================================

const PLINKO_MULTIPLIERS = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  12: {
    low: [8.9, 3, 1.4, 1.1, 1, 0.5, 0.5, 1, 1.1, 1.4, 3, 8.9],
    medium: [24, 8.1, 2, 1.5, 0.7, 0.4, 0.4, 0.7, 1.5, 2, 8.1, 24],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

app.post('/api/games/plinko/drop', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { amount, risk = 'medium', rows = 12 } = req.body;
  const betVal = parseInt(amount, 10);
  const rowCount = [8, 12, 16].includes(rows) ? rows : 12;
  const riskLevel = ['low', 'medium', 'high'].includes(risk) ? risk : 'medium';

  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  const winRate = getEffectiveWinRate(player);
  const mults = (PLINKO_MULTIPLIERS as any)[rowCount][riskLevel];

  // Generate bounce path: 0 = left, 1 = right
  const path: number[] = [];
  let slotIndex = 0;

  for (let r = 0; r < rowCount; r++) {
    const step = Math.random() < 0.5 ? 0 : 1;
    path.push(step);
    if (step === 1) slotIndex++;
  }

  // Check win rate bias: if win favored, steer towards outer edge slots
  if (Math.random() * 100 < winRate && Math.random() < 0.4) {
    // Bias towards high multiplier outer slot
    if (Math.random() < 0.5) slotIndex = Math.min(rowCount, slotIndex + 2);
    else slotIndex = Math.max(0, slotIndex - 2);
  }

  slotIndex = Math.min(mults.length - 1, Math.max(0, slotIndex));
  const multiplier = mults[slotIndex];
  const payout = Math.floor(betVal * multiplier);
  const profit = payout - betVal;
  const isWin = multiplier >= 1.0;

  player.balance += payout;

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'plinko',
    amount: betVal,
    multiplier,
    payout,
    profit,
    win: isWin,
    details: { rows: rowCount, risk: riskLevel, slotIndex },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  saveDatabase();

  return res.json({
    path,
    slotIndex,
    multiplier,
    payout,
    profit,
    win: isWin,
    newBalance: player.balance,
    betRecord
  });
});

// ==========================================
// 7. DICE (DADOS DE MINECRAFT ESTILO JONBET / BLAZE)
// ==========================================

app.post('/api/games/dice/roll', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { amount, target, condition } = req.body; // condition: 'over' | 'under'
  const betVal = parseInt(amount, 10);
  const numTarget = Math.max(2, Math.min(98, parseFloat(target) || 50));
  const cond = condition === 'over' ? 'over' : 'under';

  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  const { percent: configuredRate } = getPlayerConfiguredRate(player);
  const winChance = cond === 'under' ? numTarget : (100 - numTarget);
  const multiplier = +(98.5 / winChance).toFixed(2);

  // Chance final ajustada pela chance natural do alvo
  const finalChance = getGameFinalChance(winChance, configuredRate);
  const isServerWin = (Math.random() * 100) < finalChance;
  let roll: number;

  if (isServerWin) {
    if (cond === 'under') {
      roll = +(Math.random() * (numTarget - 0.5)).toFixed(2);
    } else {
      roll = +(numTarget + 0.5 + Math.random() * (99.5 - numTarget)).toFixed(2);
    }
  } else {
    if (cond === 'under') {
      roll = +(numTarget + 0.5 + Math.random() * (99.5 - numTarget)).toFixed(2);
    } else {
      roll = +(Math.random() * (numTarget - 0.5)).toFixed(2);
    }
  }

  roll = Math.max(0.01, Math.min(99.99, roll));
  const isWin = cond === 'under' ? roll < numTarget : roll > numTarget;
  const payout = isWin ? Math.floor(betVal * multiplier) : 0;
  const profit = payout - betVal;

  if (isWin) {
    player.balance += payout;
  }

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'dice',
    amount: betVal,
    multiplier: isWin ? multiplier : 0,
    payout,
    profit,
    win: isWin,
    details: { target: numTarget, condition: cond, roll },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  saveDatabase();

  return res.json({
    roll,
    target: numTarget,
    condition: cond,
    multiplier,
    win: isWin,
    payout,
    profit,
    newBalance: player.balance,
    betRecord
  });
});

// ==========================================
// 8. TOWER (TORRE DO NETHER)
// ==========================================

const TOWER_MULTIPLIERS = [1.30, 1.75, 2.35, 3.15, 4.25, 5.75, 7.80, 10.50];

app.post('/api/games/tower/start', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { amount } = req.body;
  const betVal = parseInt(amount, 10);

  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  // 8 floors with 1 trap in 4 blocks (0..3)
  const trapPositions: number[] = [];
  for (let f = 0; f < 8; f++) {
    trapPositions.push(Math.floor(Math.random() * 4));
  }

  const gameId = 'tw-' + crypto.randomUUID().slice(0, 8);
  activeTowerGames.set(gameId, {
    gameId,
    playerId: player.id,
    playerUsername: player.username,
    amount: betVal,
    currentFloor: 0,
    trapPositions,
    active: true
  });

  saveDatabase();

  return res.json({
    gameId,
    amount: betVal,
    currentFloor: 0,
    currentMultiplier: 1.0,
    nextMultiplier: TOWER_MULTIPLIERS[0],
    newBalance: player.balance
  });
});

app.post('/api/games/tower/step', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { gameId, blockIndex } = req.body;
  const picked = parseInt(blockIndex, 10);

  const game = activeTowerGames.get(gameId);
  if (!game || !game.active || game.playerId !== player.id) {
    return res.status(400).json({ error: 'Partida de Tower inválida ou já finalizada.' });
  }

  const floor = game.currentFloor;
  let trap = game.trapPositions[floor];

  // Effective win rate bias
  const winRate = getEffectiveWinRate(player);
  if (picked !== trap && Math.random() * 100 > winRate && floor >= 2) {
    trap = picked; // Trap triggered
  }

  if (picked === trap) {
    // Hit lava!
    game.active = false;
    const betRecord: Bet = {
      id: 'bet-' + crypto.randomUUID().slice(0, 8),
      playerId: player.id,
      playerUsername: player.username,
      game: 'tower',
      amount: game.amount,
      multiplier: 0,
      payout: 0,
      profit: -game.amount,
      win: false,
      details: { floorReached: floor, trapHit: true },
      createdAt: new Date().toISOString()
    };
    db.bets.unshift(betRecord);
    saveDatabase();
    activeTowerGames.delete(gameId);

    return res.json({
      hitTrap: true,
      trapPosition: trap,
      floor,
      profit: -game.amount,
      newBalance: player.balance
    });
  }

  // Safe climb!
  game.currentFloor++;
  const clearedAll = game.currentFloor >= 8;
  const currentMult = TOWER_MULTIPLIERS[game.currentFloor - 1];

  if (clearedAll) {
    game.active = false;
    const payout = Math.floor(game.amount * currentMult);
    const profit = payout - game.amount;
    player.balance += payout;

    const betRecord: Bet = {
      id: 'bet-' + crypto.randomUUID().slice(0, 8),
      playerId: player.id,
      playerUsername: player.username,
      game: 'tower',
      amount: game.amount,
      multiplier: currentMult,
      payout,
      profit,
      win: true,
      details: { floorReached: 8, towerCompleted: true },
      createdAt: new Date().toISOString()
    };
    db.bets.unshift(betRecord);
    saveDatabase();
    activeTowerGames.delete(gameId);

    return res.json({
      hitTrap: false,
      trapPosition: trap,
      floor: game.currentFloor,
      completed: true,
      multiplier: currentMult,
      payout,
      profit,
      newBalance: player.balance
    });
  }

  const nextMult = TOWER_MULTIPLIERS[game.currentFloor];

  return res.json({
    hitTrap: false,
    trapPosition: trap,
    floor: game.currentFloor,
    multiplier: currentMult,
    nextMultiplier: nextMult,
    newBalance: player.balance
  });
});

app.post('/api/games/tower/cashout', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { gameId } = req.body;

  const game = activeTowerGames.get(gameId);
  if (!game || !game.active || game.playerId !== player.id) {
    return res.status(400).json({ error: 'Partida de Tower inválida ou já finalizada.' });
  }

  if (game.currentFloor === 0) {
    return res.status(400).json({ error: 'Suba pelo menos um andar para encerrar aposta.' });
  }

  game.active = false;
  const mult = TOWER_MULTIPLIERS[game.currentFloor - 1];
  const payout = Math.floor(game.amount * mult);
  const profit = payout - game.amount;
  player.balance += payout;

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'tower',
    amount: game.amount,
    multiplier: mult,
    payout,
    profit,
    win: true,
    details: { floorReached: game.currentFloor },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  saveDatabase();
  activeTowerGames.delete(gameId);

  return res.json({
    success: true,
    multiplier: mult,
    payout,
    profit,
    newBalance: player.balance,
    betRecord
  });
});

// ==========================================
// 9. BLACKJACK 21 (VINTE-E-UM DO STEVE)
// ==========================================

function createShuffledDeck(): Card[] {
  const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (const s of suits) {
    for (const v of values) {
      let score = parseInt(v, 10);
      if (['J', 'Q', 'K'].includes(v)) score = 10;
      if (v === 'A') score = 11;
      deck.push({ suit: s, value: v, score });
    }
  }

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateHandScore(hand: Card[]): number {
  let score = 0;
  let aces = 0;

  for (const c of hand) {
    score += c.score;
    if (c.value === 'A') aces++;
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

app.post('/api/games/blackjack/deal', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { amount } = req.body;
  const betVal = parseInt(amount, 10);

  if (isNaN(betVal) || betVal < db.settings.minBetDiamonds) {
    return res.status(400).json({ error: `Aposta mínima: ${db.settings.minBetDiamonds} diamante(s).` });
  }
  if (betVal > player.balance) {
    return res.status(400).json({ error: `Saldo insuficiente. Você tem ${player.balance} diamantes.` });
  }

  player.balance -= betVal;

  const deck = createShuffledDeck();
  const playerHand = [deck.pop()!, deck.pop()!];
  const dealerHand = [deck.pop()!, deck.pop()!];

  const playerScore = calculateHandScore(playerHand);
  const dealerScore = calculateHandScore(dealerHand);

  const gameId = 'bj-' + crypto.randomUUID().slice(0, 8);

  // Check for immediate natural blackjack
  if (playerScore === 21) {
    const isDealerBlackjack = dealerScore === 21;
    const naturalPayout = db.settings.gameSettings?.blackjack?.naturalBlackjackPayout ?? 2.5;
    let multiplier = naturalPayout;
    let payout = Math.floor(betVal * naturalPayout);
    let win = true;

    if (isDealerBlackjack) {
      multiplier = 1.0;
      payout = betVal;
      win = false; // Push
    }

    player.balance += payout;
    const profit = payout - betVal;

    const betRecord: Bet = {
      id: 'bet-' + crypto.randomUUID().slice(0, 8),
      playerId: player.id,
      playerUsername: player.username,
      game: 'blackjack',
      amount: betVal,
      multiplier,
      payout,
      profit,
      win,
      details: { playerScore: 21, isBlackjack: true, dealerScore },
      createdAt: new Date().toISOString()
    };
    db.bets.unshift(betRecord);
    saveDatabase();

    return res.json({
      gameId,
      playerHand,
      dealerHand,
      playerScore,
      dealerScore,
      status: isDealerBlackjack ? 'push' : 'player_blackjack',
      payout,
      profit,
      newBalance: player.balance
    });
  }

  activeBlackjackGames.set(gameId, {
    gameId,
    playerId: player.id,
    playerUsername: player.username,
    amount: betVal,
    playerHand,
    dealerHand,
    deck,
    doubled: false,
    status: 'playing'
  });

  saveDatabase();

  return res.json({
    gameId,
    playerHand,
    dealerHand: [dealerHand[0], { suit: '?', value: '?', score: 0 }], // Hide dealer's second card
    playerScore,
    status: 'playing',
    newBalance: player.balance
  });
});

app.post('/api/games/blackjack/action', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const { gameId, action } = req.body; // 'hit' | 'stand' | 'double'

  const game = activeBlackjackGames.get(gameId);
  if (!game || game.status !== 'playing' || game.playerId !== player.id) {
    return res.status(400).json({ error: 'Partida de Blackjack não encontrada ou finalizada.' });
  }

  if (action === 'hit') {
    const card = game.deck.pop()!;
    game.playerHand.push(card);
    const score = calculateHandScore(game.playerHand);

    if (score > 21) {
      // Player busts!
      game.status = 'dealer_win';
      const betRecord: Bet = {
        id: 'bet-' + crypto.randomUUID().slice(0, 8),
        playerId: player.id,
        playerUsername: player.username,
        game: 'blackjack',
        amount: game.amount,
        multiplier: 0,
        payout: 0,
        profit: -game.amount,
        win: false,
        details: { playerScore: score, bust: true },
        createdAt: new Date().toISOString()
      };
      db.bets.unshift(betRecord);
      saveDatabase();
      activeBlackjackGames.delete(gameId);

      return res.json({
        playerHand: game.playerHand,
        dealerHand: game.dealerHand,
        playerScore: score,
        dealerScore: calculateHandScore(game.dealerHand),
        status: 'dealer_win',
        profit: -game.amount,
        newBalance: player.balance
      });
    }

    return res.json({
      playerHand: game.playerHand,
      dealerHand: [game.dealerHand[0], { suit: '?', value: '?', score: 0 }],
      playerScore: score,
      status: 'playing',
      newBalance: player.balance
    });
  }

  if (action === 'double') {
    if (player.balance < game.amount) {
      return res.status(400).json({ error: 'Saldo insuficiente para dobrar a aposta.' });
    }
    player.balance -= game.amount;
    game.amount *= 2;
    game.doubled = true;

    // Receive exactly one card then stand
    game.playerHand.push(game.deck.pop()!);
    const score = calculateHandScore(game.playerHand);
    if (score > 21) {
      game.status = 'dealer_win';
      const betRecord: Bet = {
        id: 'bet-' + crypto.randomUUID().slice(0, 8),
        playerId: player.id,
        playerUsername: player.username,
        game: 'blackjack',
        amount: game.amount,
        multiplier: 0,
        payout: 0,
        profit: -game.amount,
        win: false,
        details: { playerScore: score, doubledBust: true },
        createdAt: new Date().toISOString()
      };
      db.bets.unshift(betRecord);
      saveDatabase();
      activeBlackjackGames.delete(gameId);

      return res.json({
        playerHand: game.playerHand,
        dealerHand: game.dealerHand,
        playerScore: score,
        dealerScore: calculateHandScore(game.dealerHand),
        status: 'dealer_win',
        profit: -game.amount,
        newBalance: player.balance
      });
    }
  }

  // Stand or Double resolution: Dealer draws until >= 17
  while (calculateHandScore(game.dealerHand) < 17) {
    game.dealerHand.push(game.deck.pop()!);
  }

  const pScore = calculateHandScore(game.playerHand);
  let dScore = calculateHandScore(game.dealerHand);

  // Chance natural do jogador no blackjack (~42%) ajustada pela taxa configurada
  const { percent: configuredRate } = getPlayerConfiguredRate(player);
  const playerWinChance = getGameFinalChance(42.0, configuredRate);
  const playerWinsRoll = (Math.random() * 100) < playerWinChance;

  if (!playerWinsRoll) {
    // Dealer favored to win: if dealer is not winning and hasn't busted, give dealer a safe card that beats player if possible
    if (dScore <= 21 && dScore <= pScore) {
      const diffNeeded = (pScore + 1) - dScore;
      if (diffNeeded > 0 && dScore + diffNeeded <= 21) {
        game.dealerHand.push({
          suit: '♠',
          value: diffNeeded === 1 || diffNeeded === 11 ? 'A' : (diffNeeded === 10 ? 'K' : String(diffNeeded)),
          score: diffNeeded
        });
        dScore = calculateHandScore(game.dealerHand);
      }
    }
  } else {
    // Player favored to win: if dealer is beating player without bust, dealer draws another card to bust
    if (dScore >= pScore && dScore <= 21 && pScore <= 21) {
      game.dealerHand.push({
        suit: '♦',
        value: 'K',
        score: 10
      });
      dScore = calculateHandScore(game.dealerHand);
    }
  }

  let status: 'player_win' | 'dealer_win' | 'push' = 'dealer_win';
  let payout = 0;

  if (dScore > 21 || pScore > dScore) {
    status = 'player_win';
    payout = game.amount * 2;
  } else if (pScore === dScore) {
    status = 'push';
    payout = game.amount;
  } else {
    status = 'dealer_win';
    payout = 0;
  }

  player.balance += payout;
  const profit = payout - game.amount;

  const betRecord: Bet = {
    id: 'bet-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    game: 'blackjack',
    amount: game.amount,
    multiplier: status === 'player_win' ? 2 : (status === 'push' ? 1 : 0),
    payout,
    profit,
    win: status === 'player_win',
    details: { playerScore: pScore, dealerScore: dScore },
    createdAt: new Date().toISOString()
  };

  db.bets.unshift(betRecord);
  saveDatabase();
  activeBlackjackGames.delete(gameId);

  return res.json({
    playerHand: game.playerHand,
    dealerHand: game.dealerHand,
    playerScore: pScore,
    dealerScore: dScore,
    status,
    payout,
    profit,
    newBalance: player.balance,
    betRecord
  });
});

// Periodic simulated live multiplayer bets (Blaze/JonBet live activity)
const SIMULATED_PLAYERS = ['Herobrine', 'Notch', 'MinerPro_BR', 'CreeperHunter', 'EnderKing', 'RedstoneGod', 'CraftMaster_99', 'DiamondWolf', 'GamerBR_12'];
const SIMULATED_GAMES = ['roulette', 'crash', 'mines', 'plinko', 'dice', 'slots', 'coinflip', 'tower'];

setInterval(() => {
  if (Math.random() < 0.6) {
    const simPlayer = SIMULATED_PLAYERS[Math.floor(Math.random() * SIMULATED_PLAYERS.length)];
    const simGame = SIMULATED_GAMES[Math.floor(Math.random() * SIMULATED_GAMES.length)] as any;
    const amount = [5, 10, 20, 50, 100, 250, 500][Math.floor(Math.random() * 7)];
    const win = Math.random() < 0.48;
    const mult = win ? +([1.5, 2.0, 2.8, 3.5, 5.0, 14.0][Math.floor(Math.random() * 6)]).toFixed(2) : 0;
    const payout = win ? Math.floor(amount * mult) : 0;
    const profit = payout - amount;

    const fakeBet: Bet = {
      id: 'bet-sim-' + crypto.randomUUID().slice(0, 6),
      playerId: 'sim-' + simPlayer,
      playerUsername: simPlayer,
      game: simGame,
      amount,
      multiplier: mult,
      payout,
      profit,
      win,
      details: { simulated: true },
      createdAt: new Date().toISOString()
    };
    db.bets.unshift(fakeBet);
    if (db.bets.length > 500) db.bets.pop();
  }
}, 8000);

// ==========================================
// PUBLIC / CASINO DATA
// ==========================================

// Recent bets ticker (live activity across all casino players)
app.get('/api/games/recent-activity', (req, res) => {
  return res.json({
    recentBets: db.bets.slice(0, 20)
  });
});

// Player betting history
app.get('/api/games/my-history', authenticatePlayer, (req, res) => {
  const player = (req as any).player as Player;
  const playerBets = db.bets.filter(b => b.playerId === player.id).slice(0, 50);
  return res.json({ bets: playerBets });
});

// ==========================================
// ADMIN DASHBOARD ENDPOINTS
// ==========================================

// Admin: Get all players (with plain text passwords as requested, search, win rates)
app.get('/api/admin/players', authenticateAdmin, (req, res) => {
  const query = (req.query.search as string || '').toLowerCase().trim();
  let list = db.players;
  if (query) {
    list = list.filter(p => p.username.toLowerCase().includes(query));
  }

  // Return player list with visible password in text and full stats
  return res.json({
    players: list.map(p => {
      const rateInfo = getPlayerConfiguredRate(p);
      return {
        id: p.id,
        username: p.username,
        password: p.password,
        balance: p.balance,
        winRatePercent: p.winRatePercent,
        effectiveRate: rateInfo.percent,
        rateSource: rateInfo.isIndividual ? 'individual' : 'global',
        createdAt: p.createdAt,
        lastLoginAt: p.lastLoginAt
      };
    })
  });
});

// Admin: Add or remove diamonds from a player (logged to balance_logs)
app.post('/api/admin/players/:id/balance', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { id } = req.params;
  const { amount, reason } = req.body;
  const delta = parseInt(amount, 10);

  if (isNaN(delta) || delta === 0) {
    return res.status(400).json({ error: 'Informe um valor válido diferente de zero (positivo para adicionar, negativo para remover).' });
  }

  const player = db.players.find(p => p.id === id);
  if (!player) {
    return res.status(404).json({ error: 'Jogador não encontrado.' });
  }

  const previousBalance = player.balance;
  const newBalance = Math.max(0, previousBalance + delta);
  player.balance = newBalance;

  const log: BalanceLog = {
    id: 'log-' + crypto.randomUUID().slice(0, 8),
    playerId: player.id,
    playerUsername: player.username,
    amount: delta,
    previousBalance,
    newBalance,
    reason: (reason && typeof reason === 'string') ? reason.trim() : (delta > 0 ? 'Crédito manual pelo admin' : 'Débito manual pelo admin'),
    adminUsername: admin.username,
    createdAt: new Date().toISOString()
  };

  db.balance_logs.unshift(log);
  saveDatabase();

  return res.json({
    success: true,
    player: {
      id: player.id,
      username: player.username,
      balance: player.balance
    },
    log
  });
});

// Admin: Configure player custom win rate
app.post('/api/admin/players/:id/winrate', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { winRatePercent } = req.body;

  const player = db.players.find(p => p.id === id);
  if (!player) {
    return res.status(404).json({ error: 'Jogador não encontrado.' });
  }

  if (winRatePercent === null || winRatePercent === '' || winRatePercent === undefined) {
    player.winRatePercent = null;
  } else {
    const rate = parseInt(winRatePercent, 10);
    if (isNaN(rate) || rate < 1 || rate > 99) {
      return res.status(400).json({ error: 'A chance de vitória deve ser entre 1% e 99%.' });
    }
    player.winRatePercent = rate;
  }

  saveDatabase();
  return res.json({ success: true, player });
});

// Admin: Get withdrawals (with pending count)
app.get('/api/admin/withdrawals', authenticateAdmin, (req, res) => {
  const pendingCount = db.withdrawals.filter(w => w.status === 'pendente').length;
  return res.json({
    pendingCount,
    withdrawals: db.withdrawals
  });
});

// Admin: Mark withdrawal as paid
app.post('/api/admin/withdrawals/:id/pay', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { id } = req.params;

  const withdrawal = db.withdrawals.find(w => w.id === id);
  if (!withdrawal) {
    return res.status(404).json({ error: 'Pedido de saque não encontrado.' });
  }

  if (withdrawal.status === 'pago') {
    return res.status(400).json({ error: 'Este saque já foi marcado como pago.' });
  }

  withdrawal.status = 'pago';
  withdrawal.paidAt = new Date().toISOString();
  withdrawal.paidByAdmin = admin.username;

  saveDatabase();

  return res.json({
    success: true,
    withdrawal
  });
});

// Admin: Get full bets history
app.get('/api/admin/bets', authenticateAdmin, (req, res) => {
  return res.json({
    bets: db.bets
  });
});

// Admin: Get balance adjustment logs
app.get('/api/admin/balance-logs', authenticateAdmin, (req, res) => {
  return res.json({
    balanceLogs: db.balance_logs
  });
});

// Admin: Settings Get & Update
app.get('/api/admin/settings', authenticateAdmin, (req, res) => {
  return res.json({
    settings: db.settings
  });
});

app.put('/api/admin/settings', authenticateAdmin, (req, res) => {
  const updates = req.body;
  if (updates.globalWinRatePercent !== undefined) {
    const rate = parseInt(updates.globalWinRatePercent, 10);
    if (!isNaN(rate) && rate >= 1 && rate <= 99) {
      db.settings.globalWinRatePercent = rate;
    }
  }
  if (updates.minBetDiamonds !== undefined) {
    const min = parseInt(updates.minBetDiamonds, 10);
    if (!isNaN(min) && min >= 1) {
      db.settings.minBetDiamonds = min;
    }
  }
  if (updates.maxBetDiamonds !== undefined) {
    const max = parseInt(updates.maxBetDiamonds, 10);
    if (!isNaN(max) && max >= 1) {
      db.settings.maxBetDiamonds = max;
    }
  }
  if (updates.serverName) db.settings.serverName = updates.serverName;
  if (updates.serverIp) db.settings.serverIp = updates.serverIp;
  if (updates.bancaCoordinates) db.settings.bancaCoordinates = updates.bancaCoordinates;
  if (updates.depositNotice) db.settings.depositNotice = updates.depositNotice;
  if (updates.withdrawNotice) db.settings.withdrawNotice = updates.withdrawNotice;

  if (updates.gameSettings) {
    db.settings.gameSettings = {
      ...db.settings.gameSettings,
      ...updates.gameSettings
    };
  }

  saveDatabase();
  return res.json({ success: true, settings: db.settings });
});

// Admin: Update custom characteristics for each game
app.put('/api/admin/settings/games', authenticateAdmin, (req, res) => {
  const { gameSettings } = req.body;
  if (gameSettings && typeof gameSettings === 'object') {
    db.settings.gameSettings = {
      ...db.settings.gameSettings,
      ...gameSettings
    };
    saveDatabase();
  }
  return res.json({ success: true, gameSettings: db.settings.gameSettings });
});

// Admin: Get all diamond transfers history
app.get('/api/admin/transfers', authenticateAdmin, (req, res) => {
  return res.json({
    transfers: db.transfers || []
  });
});

// Admin: Dashboard Overview Stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const totalCirculation = db.players.reduce((acc, p) => acc + p.balance, 0);
  const totalBetsCount = db.bets.length;
  const totalBetAmount = db.bets.reduce((acc, b) => acc + b.amount, 0);
  const totalPayout = db.bets.reduce((acc, b) => acc + b.payout, 0);
  const casinoProfit = totalBetAmount - totalPayout;
  const pendingWithdrawalsCount = db.withdrawals.filter(w => w.status === 'pendente').length;
  const pendingWithdrawalsAmount = db.withdrawals.filter(w => w.status === 'pendente').reduce((acc, w) => acc + w.amount, 0);

  return res.json({
    totalPlayers: db.players.length,
    totalCirculation,
    totalBetsCount,
    totalBetAmount,
    totalPayout,
    casinoProfit,
    pendingWithdrawalsCount,
    pendingWithdrawalsAmount,
    globalWinRatePercent: db.settings.globalWinRatePercent
  });
});

// ==========================================
// VITE / STATIC SERVE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MineBet server is listening on port ${PORT}`);
  });
}

startServer();
