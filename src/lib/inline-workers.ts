// Inline Workers - Tránh CORS khi deploy lên Zalo Mini App
// Sử dụng Blob URL thay vì load file external

export type CaroWorkerType = "v1" | "v2" | "v3" | "v4" | "v5" | "ultimate";

// Helper tạo worker từ code string
function createWorkerFromCode(code: string): Worker {
  const blob = new Blob([code], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  // Clean up blob URL khi worker terminate
  const originalTerminate = worker.terminate.bind(worker);
  worker.terminate = () => {
    URL.revokeObjectURL(url);
    originalTerminate();
  };
  return worker;
}

// ============= CARO AI WORKERS =============

const CARO_COMMON_CODE = `
let GameBoard, fc = 0, Rows, Columns;
const WIN_DETECTED = false;
const LiveOne = 10, DeadOne = 1, LiveTwo = 100, DeadTwo = 10;
const LiveThree = 1000, DeadThree = 100, LiveFour = 10000, DeadFour = 1000, Five = 100000;

function eval_board(Board, pieceType, restrictions) {
  let score = 0;
  const [min_r, min_c, max_r, max_c] = restrictions;
  for (let row = min_r; row <= max_r; row++) {
    for (let column = min_c; column <= max_c; column++) {
      if (Board[row][column] == pieceType) {
        let block = 0, piece = 1;
        if (column === 0 || Board[row][column - 1] !== 0) block++;
        for (column++; column < Columns && Board[row][column] === pieceType; column++) piece++;
        if (column === Columns || Board[row][column] !== 0) block++;
        score += evaluateblock(block, piece);
      }
    }
  }
  for (let column = min_c; column <= max_c; column++) {
    for (let row = min_r; row <= max_r; row++) {
      if (Board[row][column] == pieceType) {
        let block = 0, piece = 1;
        if (row === 0 || Board[row - 1][column] !== 0) block++;
        for (row++; row < Rows && Board[row][column] === pieceType; row++) piece++;
        if (row === Rows || Board[row][column] !== 0) block++;
        score += evaluateblock(block, piece);
      }
    }
  }
  for (let n = min_r; n < max_c - min_c + max_r; n++) {
    let r = n, c = min_c;
    while (r >= min_r && c <= max_c) {
      if (r <= max_r && Board[r][c] === pieceType) {
        let block = 0, piece = 1;
        if (c === 0 || r === Rows - 1 || Board[r + 1][c - 1] !== 0) block++;
        r--; c++;
        for (; r >= 0 && Board[r][c] === pieceType; r--) { piece++; c++; }
        if (r < 0 || c === Columns || Board[r][c] !== 0) block++;
        score += evaluateblock(block, piece);
      }
      r--; c++;
    }
  }
  for (let n = min_r - (max_c - min_c); n <= max_r; n++) {
    let r = n, c = min_c;
    while (r <= max_r && c <= max_c) {
      if (r >= min_r && r <= max_r && Board[r][c] === pieceType) {
        let block = 0, piece = 1;
        if (c === 0 || r === 0 || Board[r - 1][c - 1] !== 0) block++;
        r++; c++;
        for (; r < Rows && Board[r][c] == pieceType; r++) { piece++; c++; }
        if (r === Rows || c === Columns || Board[r][c] !== 0) block++;
        score += evaluateblock(block, piece);
      }
      r++; c++;
    }
  }
  return score;
}

function evaluateblock(blocks, pieces) {
  if (blocks === 0) return [0, LiveOne, LiveTwo, LiveThree, LiveFour, Five][Math.min(pieces, 5)];
  if (blocks === 1) return [0, DeadOne, DeadTwo, DeadThree, DeadFour, Five][Math.min(pieces, 5)];
  return pieces >= 5 ? Five : 0;
}

function check_directions(arr) {
  for (let i = 0; i < arr.length - 4; i++) {
    if (arr[i] !== 0 && arr[i] === arr[i+1] && arr[i] === arr[i+2] && arr[i] === arr[i+3] && arr[i] === arr[i+4]) return true;
  }
}

function get_directions(Board, x, y) {
  const Directions = [[], [], [], []];
  for (let i = -4; i < 5; i++) {
    if (x + i >= 0 && x + i < Rows) {
      Directions[0].push(Board[x + i][y]);
      if (y + i >= 0 && y + i < Columns) Directions[2].push(Board[x + i][y + i]);
    }
    if (y + i >= 0 && y + i < Columns) {
      Directions[1].push(Board[x][y + i]);
      if (x - i >= 0 && x - i < Rows) Directions[3].push(Board[x - i][y + i]);
    }
  }
  return Directions;
}

function checkwin(Board, x, y) {
  const Directions = get_directions(Board, x, y);
  for (let i = 0; i < 4; i++) if (check_directions(Directions[i])) return true;
}

function remoteCell(Board, r, c) {
  for (let i = r - 2; i <= r + 2; i++) {
    if (i < 0 || i >= Rows) continue;
    for (let j = c - 2; j <= c + 2; j++) {
      if (j < 0 || j >= Columns) continue;
      if (Board[i][j] !== 0) return false;
    }
  }
  return true;
}

function Get_restrictions(Board) {
  let min_r = Infinity, min_c = Infinity, max_r = -Infinity, max_c = -Infinity;
  for (let i = 0; i < Rows; i++) {
    for (let j = 0; j < Columns; j++) {
      if (Board[i][j] !== 0) {
        min_r = Math.min(min_r, i); min_c = Math.min(min_c, j);
        max_r = Math.max(max_r, i); max_c = Math.max(max_c, j);
      }
    }
  }
  return [Math.max(2, min_r), Math.max(2, min_c), Math.min(Rows - 3, max_r), Math.min(Columns - 3, max_c)];
}

function Change_restrictions(restrictions, i, j) {
  let [min_r, min_c, max_r, max_c] = restrictions;
  min_r = Math.min(min_r, i); max_r = Math.max(max_r, i);
  min_c = Math.min(min_c, j); max_c = Math.max(max_c, j);
  return [Math.max(2, min_r), Math.max(2, min_c), Math.min(Rows - 3, max_r), Math.min(Columns - 3, max_c)];
}

function BoardGenerator(restrictions, Board, player) {
  const availSpots = [];
  const [min_r, min_c, max_r, max_c] = restrictions;
  for (let i = min_r - 2; i <= max_r + 2; i++) {
    for (let j = min_c - 2; j <= max_c + 2; j++) {
      if (Board[i][j] === 0 && !remoteCell(Board, i, j)) {
        const move = { i, j, score: evaluate_move(Board, i, j, player) };
        if (move.score === WIN_DETECTED) return [move];
        availSpots.push(move);
      }
    }
  }
  availSpots.sort((a, b) => b.score - a.score);
  return availSpots;
}

function evaluate_direction(arr, player) {
  let score = 0;
  for (let i = 0; i + 4 < arr.length; i++) {
    let you = 0, enemy = 0;
    for (let j = 0; j <= 4; j++) {
      if (arr[i + j] === player) you++;
      else if (arr[i + j] === -player) enemy++;
    }
    score += evalff(get_seq(you, enemy));
    if (score >= 800000) return WIN_DETECTED;
  }
  return score;
}

function evalff(seq) {
  const map = { 0: 7, 1: 35, 2: 800, 3: 15000, 4: 800000, '-1': 15, '-2': 400, '-3': 1800, '-4': 100000, 17: 0 };
  return map[seq] || 0;
}

function get_seq(y, e) {
  if (y + e === 0) return 0;
  if (y !== 0 && e === 0) return y;
  if (y === 0 && e !== 0) return -e;
  return 17;
}

function evaluate_move(Board, x, y, player) {
  let score = 0;
  const Directions = get_directions(Board, x, y);
  for (let i = 0; i < 4; i++) {
    const temp = evaluate_direction(Directions[i], player);
    if (temp === WIN_DETECTED) return WIN_DETECTED;
    score += temp;
  }
  return score;
}

function evaluate_state(Board, player, h, restrictions) {
  const black = eval_board(Board, -1, restrictions);
  const white = eval_board(Board, 1, restrictions);
  const score = player == -1 ? black - white : white - black;
  StateCache.set(h, score);
  return score;
}

function random32() {
  const o = new Uint32Array(1);
  self.crypto.getRandomValues(o);
  return o[0];
}

const Table = [];
function Table_init() {
  for (let i = 0; i < Rows; i++) {
    Table[i] = [];
    for (let j = 0; j < Columns; j++) Table[i][j] = [random32(), random32()];
  }
}

function hash(board) {
  let h = 0;
  for (let i = 0; i < Rows; i++) {
    for (let j = 0; j < Columns; j++) {
      const v = board[i][j];
      if (v !== 0) h ^= Table[i][j][v === -1 ? 0 : 1];
    }
  }
  return h;
}

function update_hash(h, player, row, col) {
  return h ^ Table[row][col][player === -1 ? 0 : 1];
}

const Cache = new Map();
const StateCache = new Map();
let MaximumDepth, CacheHits = 0, CacheCutoffs = 0, CachePuts = 0, StateCacheHits = 0, StateCachePuts = 0;

function initBoard(Board) {
  GameBoard = Board;
  Rows = Board.length;
  Columns = Board[0].length;
  let sum = 0;
  for (let x = 0; x < Rows; x++) for (let y = 0; y < Columns; y++) if (Board[x][y] !== 0) sum++;
  if (sum === 0) {
    postMessage({ bestmove: { i: Math.floor(Rows / 2), j: Math.floor(Columns / 2), score: 0 }, time: 0 });
    return false;
  }
  CacheHits = CacheCutoffs = CachePuts = StateCachePuts = StateCacheHits = fc = 0;
  Table_init();
  return true;
}
`;

// V2 - Fixed depth negamax
const CARO_V2_CODE =
  CARO_COMMON_CODE +
  `
function negamax(newBoard, player, depth, a, b, h, restrictions, last_i, last_j) {
  const alphaOrig = a;
  const CacheNode = Cache.get(h);
  if (CacheNode && CacheNode.depth >= depth) {
    CacheHits++;
    if (CacheNode.Flag === 0) { CacheCutoffs++; return CacheNode.score; }
    if (CacheNode.Flag === -1) a = Math.max(a, CacheNode.score);
    else if (CacheNode.Flag === 1) b = Math.min(b, CacheNode.score);
    if (a >= b) { CacheCutoffs++; return CacheNode.score; }
  }
  fc++;
  if (checkwin(newBoard, last_i, last_j)) return -2000000 + (MaximumDepth - depth);
  if (depth === 0) {
    const sc = StateCache.get(h);
    return sc !== undefined ? sc : evaluate_state(newBoard, player, h, restrictions);
  }
  const availSpots = BoardGenerator(restrictions, newBoard, player);
  if (availSpots.length === 0) return 0;
  const bestMove = {};
  let bestvalue = -Infinity;
  for (let y = 0; y < availSpots.length; y++) {
    const i = availSpots[y].i, j = availSpots[y].j;
    const newHash = update_hash(h, player, i, j);
    newBoard[i][j] = player;
    const value = -negamax(newBoard, -player, depth - 1, -b, -a, newHash, Change_restrictions(restrictions, i, j), i, j);
    newBoard[i][j] = 0;
    if (value > bestvalue) {
      bestvalue = value;
      if (depth == MaximumDepth) { bestMove.i = i; bestMove.j = j; bestMove.score = value; }
    }
    a = Math.max(a, value);
    if (a >= b) break;
  }
  const obj = { score: bestvalue, depth };
  if (bestvalue <= alphaOrig) obj.Flag = 1;
  else if (bestvalue >= b) obj.Flag = -1;
  else obj.Flag = 0;
  Cache.set(h, obj);
  return depth == MaximumDepth ? bestMove : bestvalue;
}

function iterative_negamax(player, Board, maxDepth) {
  let bestmove;
  for (let i = 2; i <= maxDepth; i += 2) {
    MaximumDepth = i;
    bestmove = negamax(Board, player, MaximumDepth, -Infinity, Infinity, hash(Board), Get_restrictions(Board), 0, 0);
    if (bestmove.score > 1999900) break;
  }
  return bestmove;
}

onmessage = function(e) {
  const Board = e.data[0], depth = e.data[2] || 6;
  if (!Board || !initBoard(Board)) return;
  const t0 = performance.now();
  const bestmove = iterative_negamax(-1, GameBoard, depth);
  Cache.clear(); StateCache.clear();
  postMessage({ bestmove, time: (performance.now() - t0) / 1000 });
};
`;

// V3 - Timeout-based negamax
const CARO_V3_CODE =
  CARO_COMMON_CODE +
  `
let MaximumTimeForMove, startTime;
function TIMEOUT() { return Date.now() - startTime >= MaximumTimeForMove; }

function negamax(newBoard, player, depth, a, b, h, restrictions, last_i, last_j) {
  if (TIMEOUT()) return 1;
  const alphaOrig = a;
  const CacheNode = Cache.get(h);
  if (CacheNode && CacheNode.depth >= depth) {
    CacheHits++;
    if (CacheNode.Flag === 0) { CacheCutoffs++; return CacheNode.score; }
    if (CacheNode.Flag === -1) a = Math.max(a, CacheNode.score);
    else if (CacheNode.Flag === 1) b = Math.min(b, CacheNode.score);
    if (a >= b) { CacheCutoffs++; return CacheNode.score; }
  }
  fc++;
  if (checkwin(newBoard, last_i, last_j)) return -2000000 + (MaximumDepth - depth);
  if (depth === 0) {
    const sc = StateCache.get(h);
    return sc !== undefined ? sc : evaluate_state(newBoard, player, h, restrictions);
  }
  const availSpots = BoardGenerator(restrictions, newBoard, player);
  if (availSpots.length === 0) return 0;
  const bestMove = {};
  let bestvalue = -Infinity;
  for (let y = 0; y < availSpots.length; y++) {
    const i = availSpots[y].i, j = availSpots[y].j;
    const newHash = update_hash(h, player, i, j);
    newBoard[i][j] = player;
    const value = -negamax(newBoard, -player, depth - 1, -b, -a, newHash, Change_restrictions(restrictions, i, j), i, j);
    newBoard[i][j] = 0;
    if (value > bestvalue) {
      bestvalue = value;
      if (depth == MaximumDepth) { bestMove.i = i; bestMove.j = j; bestMove.score = value; }
    }
    a = Math.max(a, value);
    if (a >= b) break;
  }
  const obj = { score: bestvalue, depth };
  if (bestvalue <= alphaOrig) obj.Flag = 1;
  else if (bestvalue >= b) obj.Flag = -1;
  else obj.Flag = 0;
  Cache.set(h, obj);
  return depth == MaximumDepth ? bestMove : bestvalue;
}

function iterative_negamax(player, Board) {
  let bestmove, depth = 2;
  while (!TIMEOUT()) {
    MaximumDepth = depth;
    const temp = negamax(Board, player, MaximumDepth, -Infinity, Infinity, hash(Board), Get_restrictions(Board), 0, 0);
    if (TIMEOUT()) return bestmove;
    bestmove = temp;
    if (bestmove.score > 1999900) break;
    depth += 2;
  }
  return bestmove;
}

onmessage = function(e) {
  const Board = e.data[0], time = e.data[2] || 3000;
  if (!Board || !initBoard(Board)) return;
  startTime = Date.now();
  MaximumTimeForMove = time;
  const t0 = performance.now();
  const bestmove = iterative_negamax(-1, GameBoard);
  Cache.clear(); StateCache.clear();
  postMessage({ bestmove, time: (performance.now() - t0) / 1000 });
};
`;

// V4 - NegaScout fixed depth
const CARO_V4_CODE =
  CARO_COMMON_CODE +
  `
function negascout(newBoard, player, depth, alpha, beta, h, restrictions, last_i, last_j) {
  const alphaOrig = alpha;
  const CacheNode = Cache.get(h);
  if (CacheNode && CacheNode.depth >= depth) {
    CacheHits++;
    if (CacheNode.Flag === 0) { CacheCutoffs++; return CacheNode.score; }
    if (CacheNode.Flag === -1) alpha = Math.max(alpha, CacheNode.score);
    else if (CacheNode.Flag === 1) beta = Math.min(beta, CacheNode.score);
    if (alpha >= beta) { CacheCutoffs++; return CacheNode.score; }
  }
  fc++;
  if (checkwin(newBoard, last_i, last_j)) return -2000000 + (MaximumDepth - depth);
  if (depth === 0) {
    const sc = StateCache.get(h);
    return sc !== undefined ? sc : evaluate_state(newBoard, player, h, restrictions);
  }
  const availSpots = BoardGenerator(restrictions, newBoard, player);
  if (availSpots.length === 0) return 0;
  let b = beta, bestscore = -Infinity;
  const bestMove = {};
  for (let y = 0; y < availSpots.length; y++) {
    const i = availSpots[y].i, j = availSpots[y].j;
    const newHash = update_hash(h, player, i, j);
    newBoard[i][j] = player;
    const newRestrictions = Change_restrictions(restrictions, i, j);
    let score = -negascout(newBoard, -player, depth - 1, -b, -alpha, newHash, newRestrictions, i, j);
    if (score > alpha && score < beta && y > 0) {
      score = -negascout(newBoard, -player, depth - 1, -beta, -score, newHash, newRestrictions, i, j);
    }
    newBoard[i][j] = 0;
    if (score > bestscore) {
      bestscore = score;
      if (depth === MaximumDepth) { bestMove.i = i; bestMove.j = j; bestMove.score = score; }
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
    b = alpha + 1;
  }
  const obj = { score: bestscore, depth };
  if (bestscore <= alphaOrig) obj.Flag = 1;
  else if (bestscore >= b) obj.Flag = -1;
  else obj.Flag = 0;
  Cache.set(h, obj);
  return depth == MaximumDepth ? bestMove : bestscore;
}

function iterative_negascout(player, Board, maxDepth) {
  let bestmove;
  for (let i = 2; i <= maxDepth; i += 2) {
    MaximumDepth = i;
    bestmove = negascout(Board, player, MaximumDepth, -Infinity, Infinity, hash(Board), Get_restrictions(Board), 0, 0);
    if (bestmove.score > 1999900) break;
  }
  return bestmove;
}

onmessage = function(e) {
  const Board = e.data[0], depth = e.data[2] || 8;
  if (!Board || !initBoard(Board)) return;
  const t0 = performance.now();
  const bestmove = iterative_negascout(-1, GameBoard, depth);
  Cache.clear(); StateCache.clear();
  postMessage({ bestmove, time: (performance.now() - t0) / 1000 });
};
`;

// V5 - NegaScout + Timeout
const CARO_V5_CODE =
  CARO_COMMON_CODE +
  `
let MaximumTimeForMove, startTime;
function TIMEOUT() { return Date.now() - startTime >= MaximumTimeForMove; }

function negascout(newBoard, player, depth, alpha, beta, h, restrictions, last_i, last_j) {
  if (TIMEOUT()) return 1;
  const alphaOrig = alpha;
  const CacheNode = Cache.get(h);
  if (CacheNode && CacheNode.depth >= depth) {
    CacheHits++;
    if (CacheNode.Flag === 0) { CacheCutoffs++; return CacheNode.score; }
    if (CacheNode.Flag === -1) alpha = Math.max(alpha, CacheNode.score);
    else if (CacheNode.Flag === 1) beta = Math.min(beta, CacheNode.score);
    if (alpha >= beta) { CacheCutoffs++; return CacheNode.score; }
  }
  fc++;
  if (checkwin(newBoard, last_i, last_j)) return -2000000 + (MaximumDepth - depth);
  if (depth === 0) {
    const sc = StateCache.get(h);
    return sc !== undefined ? sc : evaluate_state(newBoard, player, h, restrictions);
  }
  const availSpots = BoardGenerator(restrictions, newBoard, player);
  if (availSpots.length === 0) return 0;
  let b = beta, bestscore = -Infinity;
  const bestMove = {};
  for (let y = 0; y < availSpots.length; y++) {
    const i = availSpots[y].i, j = availSpots[y].j;
    const newHash = update_hash(h, player, i, j);
    newBoard[i][j] = player;
    const newRestrictions = Change_restrictions(restrictions, i, j);
    let score = -negascout(newBoard, -player, depth - 1, -b, -alpha, newHash, newRestrictions, i, j);
    if (score > alpha && score < beta && y > 0) {
      score = -negascout(newBoard, -player, depth - 1, -beta, -score, newHash, newRestrictions, i, j);
    }
    newBoard[i][j] = 0;
    if (score > bestscore) {
      bestscore = score;
      if (depth === MaximumDepth) { bestMove.i = i; bestMove.j = j; bestMove.score = score; }
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
    b = alpha + 1;
  }
  const obj = { score: bestscore, depth };
  if (bestscore <= alphaOrig) obj.Flag = 1;
  else if (bestscore >= b) obj.Flag = -1;
  else obj.Flag = 0;
  Cache.set(h, obj);
  return depth == MaximumDepth ? bestMove : bestscore;
}

function iterative_negascout(player, Board) {
  let bestmove, depth = 2;
  while (!TIMEOUT()) {
    MaximumDepth = depth;
    const temp = negascout(Board, player, MaximumDepth, -Infinity, Infinity, hash(Board), Get_restrictions(Board), 0, 0);
    if (TIMEOUT()) return bestmove;
    bestmove = temp;
    if (bestmove.score > 1999900) break;
    depth += 2;
  }
  return bestmove;
}

onmessage = function(e) {
  const Board = e.data[0], time = e.data[2] || 5000;
  if (!Board || !initBoard(Board)) return;
  startTime = Date.now();
  MaximumTimeForMove = time;
  const t0 = performance.now();
  const bestmove = iterative_negascout(-1, GameBoard);
  Cache.clear(); StateCache.clear();
  postMessage({ bestmove, time: (performance.now() - t0) / 1000 });
};
`;

// V1 - MTDF (original)
const CARO_V1_CODE =
  CARO_COMMON_CODE +
  `
let MaximumTimeForMove, startTime, bestmoves = [];
function TIMEOUT() { return Date.now() - startTime >= MaximumTimeForMove; }

function Set_last_best(bestmove) {
  for (let i = 0; i < bestmoves.length; i++) {
    if (bestmoves[i].i === bestmove.i && bestmoves[i].j === bestmove.j) bestmoves.splice(i, 1);
  }
  bestmoves.unshift(bestmove);
}
function Get_last_best() { return bestmoves; }

function negamax(newBoard, player, depth, a, b, h, restrictions, last_i, last_j) {
  if (TIMEOUT()) return 1;
  const alphaOrig = a;
  const CacheNode = Cache.get(h);
  if (CacheNode && CacheNode.depth >= depth) {
    CacheHits++;
    if (CacheNode.Flag === 0) { CacheCutoffs++; return CacheNode.score; }
    if (CacheNode.Flag === -1) a = Math.max(a, CacheNode.score);
    else if (CacheNode.Flag === 1) b = Math.min(b, CacheNode.score);
    if (a >= b) { CacheCutoffs++; return CacheNode.score; }
  }
  fc++;
  if (checkwin(newBoard, last_i, last_j)) return -2000000 + (MaximumDepth - depth);
  if (depth === 0) {
    const sc = StateCache.get(h);
    return sc !== undefined ? sc : evaluate_state(newBoard, player, h, restrictions);
  }
  let availSpots = depth === MaximumDepth ? Get_last_best() : BoardGenerator(restrictions, newBoard, player);
  if (availSpots.length === 0) return 0;
  const bestMove = {};
  let bestvalue = -Infinity;
  for (let y = 0; y < availSpots.length; y++) {
    const i = availSpots[y].i, j = availSpots[y].j;
    const newHash = update_hash(h, player, i, j);
    newBoard[i][j] = player;
    const value = -negamax(newBoard, -player, depth - 1, -b, -a, newHash, Change_restrictions(restrictions, i, j), i, j);
    newBoard[i][j] = 0;
    if (value > bestvalue) {
      bestvalue = value;
      if (depth == MaximumDepth) { bestMove.i = i; bestMove.j = j; bestMove.score = value; }
    }
    a = Math.max(a, value);
    if (a >= b) break;
  }
  const obj = { score: bestvalue, depth };
  if (bestvalue <= alphaOrig) obj.Flag = 1;
  else if (bestvalue >= b) obj.Flag = -1;
  else obj.Flag = 0;
  Cache.set(h, obj);
  return depth == MaximumDepth ? bestMove : bestvalue;
}

function mtdf(Board, f, d, restrictions) {
  let g = f, upperbound = Infinity, lowerbound = -Infinity, b, last_succesful;
  do {
    b = g === lowerbound ? g + 1 : g;
    if (TIMEOUT()) return 'stop';
    const result = negamax(Board, 1, d, b - 1, b, hash(Board), restrictions, 0, 0);
    if (TIMEOUT()) return 'stop';
    if (result !== undefined) { g = result.score; last_succesful = result; }
    if (g < b) upperbound = g; else lowerbound = g;
  } while (lowerbound < upperbound);
  return last_succesful;
}

function iterative_mtdf(Board) {
  const restrictions = Get_restrictions(Board);
  let guess = evaluate_state(Board, 1, hash(GameBoard), [0, 0, Rows - 1, Columns - 1]);
  bestmoves = BoardGenerator(restrictions, Board, 1);
  let move, depth = 2;
  while (!TIMEOUT()) {
    MaximumDepth = depth;
    const temp = mtdf(Board, guess, depth, restrictions);
    if (temp === 'stop') break;
    move = temp;
    Set_last_best(move);
    if (Math.abs(move.score) > 1999900) return move;
    guess = move.score;
    depth += 2;
  }
  return move;
}

onmessage = function(e) {
  const Board = e.data[0], time = e.data[2] || 2000;
  if (!Board || !initBoard(Board)) return;
  startTime = Date.now();
  MaximumTimeForMove = time;
  const t0 = performance.now();
  const bestmove = iterative_mtdf(GameBoard);
  Cache.clear(); StateCache.clear();
  postMessage({ bestmove, time: (performance.now() - t0) / 1000 });
};
`;

// Ultimate - NegaScout + Killer Moves + History Heuristic
const CARO_ULTIMATE_CODE = `
let GameBoard, Rows, Columns, fc = 0;
const WIN_DETECTED = false;
const SCORES = { L1: 10, D1: 1, L2: 100, D2: 10, L3: 1000, D3: 100, L4: 10000, D4: 1000, FIVE: 100000 };
const killerMoves = [], historyTable = [];

function initHistoryTable() {
  for (let i = 0; i < Rows; i++) { historyTable[i] = []; for (let j = 0; j < Columns; j++) historyTable[i][j] = 0; }
}

function eval_board(Board, pieceType, restrictions) {
  let score = 0;
  const [min_r, min_c, max_r, max_c] = restrictions;
  for (let row = min_r; row <= max_r; row++) {
    for (let col = min_c; col <= max_c; col++) {
      if (Board[row][col] === pieceType) {
        let block = 0, piece = 1;
        if (col === 0 || Board[row][col - 1] !== 0) block++;
        for (col++; col < Columns && Board[row][col] === pieceType; col++) piece++;
        if (col === Columns || Board[row][col] !== 0) block++;
        score += evaluateBlock(block, piece);
      }
    }
  }
  for (let col = min_c; col <= max_c; col++) {
    for (let row = min_r; row <= max_r; row++) {
      if (Board[row][col] === pieceType) {
        let block = 0, piece = 1;
        if (row === 0 || Board[row - 1][col] !== 0) block++;
        for (row++; row < Rows && Board[row][col] === pieceType; row++) piece++;
        if (row === Rows || Board[row][col] !== 0) block++;
        score += evaluateBlock(block, piece);
      }
    }
  }
  for (let n = min_r; n < max_c - min_c + max_r; n++) {
    let r = n, c = min_c;
    while (r >= min_r && c <= max_c) {
      if (r <= max_r && Board[r][c] === pieceType) {
        let block = 0, piece = 1;
        if (c === 0 || r === Rows - 1 || Board[r + 1][c - 1] !== 0) block++;
        r--; c++;
        for (; r >= 0 && c < Columns && Board[r][c] === pieceType; r--, c++) piece++;
        if (r < 0 || c === Columns || Board[r][c] !== 0) block++;
        score += evaluateBlock(block, piece);
      }
      r--; c++;
    }
  }
  for (let n = min_r - (max_c - min_c); n <= max_r; n++) {
    let r = n, c = min_c;
    while (r <= max_r && c <= max_c) {
      if (r >= min_r && Board[r][c] === pieceType) {
        let block = 0, piece = 1;
        if (c === 0 || r === 0 || Board[r - 1][c - 1] !== 0) block++;
        r++; c++;
        for (; r < Rows && c < Columns && Board[r][c] === pieceType; r++, c++) piece++;
        if (r === Rows || c === Columns || Board[r][c] !== 0) block++;
        score += evaluateBlock(block, piece);
      }
      r++; c++;
    }
  }
  return score;
}

function evaluateBlock(blocks, pieces) {
  if (blocks === 0) return [0, SCORES.L1, SCORES.L2, SCORES.L3, SCORES.L4, SCORES.FIVE][Math.min(pieces, 5)];
  if (blocks === 1) return [0, SCORES.D1, SCORES.D2, SCORES.D3, SCORES.D4, SCORES.FIVE][Math.min(pieces, 5)];
  return pieces >= 5 ? SCORES.FIVE : 0;
}

function getDirections(Board, x, y) {
  const dirs = [[], [], [], []];
  for (let i = -4; i < 5; i++) {
    if (x + i >= 0 && x + i < Rows) {
      dirs[0].push(Board[x + i][y]);
      if (y + i >= 0 && y + i < Columns) dirs[2].push(Board[x + i][y + i]);
    }
    if (y + i >= 0 && y + i < Columns) {
      dirs[1].push(Board[x][y + i]);
      if (x - i >= 0 && x - i < Rows) dirs[3].push(Board[x - i][y + i]);
    }
  }
  return dirs;
}

function checkWin(Board, x, y) {
  const dirs = getDirections(Board, x, y);
  for (const arr of dirs) {
    for (let i = 0; i < arr.length - 4; i++) {
      if (arr[i] !== 0 && arr[i] === arr[i+1] && arr[i] === arr[i+2] && arr[i] === arr[i+3] && arr[i] === arr[i+4]) return true;
    }
  }
  return false;
}

function isRemoteCell(Board, r, c) {
  for (let i = Math.max(0, r - 2); i <= Math.min(Rows - 1, r + 2); i++) {
    for (let j = Math.max(0, c - 2); j <= Math.min(Columns - 1, c + 2); j++) {
      if (Board[i][j] !== 0) return false;
    }
  }
  return true;
}

function getRestrictions(Board) {
  let min_r = Infinity, min_c = Infinity, max_r = -Infinity, max_c = -Infinity;
  for (let i = 0; i < Rows; i++) {
    for (let j = 0; j < Columns; j++) {
      if (Board[i][j] !== 0) { min_r = Math.min(min_r, i); min_c = Math.min(min_c, j); max_r = Math.max(max_r, i); max_c = Math.max(max_c, j); }
    }
  }
  return [Math.max(2, min_r), Math.max(2, min_c), Math.min(Rows - 3, max_r), Math.min(Columns - 3, max_c)];
}

function updateRestrictions(restrictions, i, j) {
  let [min_r, min_c, max_r, max_c] = restrictions;
  min_r = Math.min(min_r, i); max_r = Math.max(max_r, i);
  min_c = Math.min(min_c, j); max_c = Math.max(max_c, j);
  return [Math.max(2, min_r), Math.max(2, min_c), Math.min(Rows - 3, max_r), Math.min(Columns - 3, max_c)];
}

function evaluateDirection(arr, player) {
  let score = 0;
  for (let i = 0; i + 4 < arr.length; i++) {
    let you = 0, enemy = 0;
    for (let j = 0; j <= 4; j++) { if (arr[i + j] === player) you++; else if (arr[i + j] === -player) enemy++; }
    const seq = you + enemy === 0 ? 0 : you && !enemy ? you : !you && enemy ? -enemy : 17;
    const val = [7, 35, 800, 15000, 800000][Math.abs(seq)] || (seq < 0 ? [0, 15, 400, 1800, 100000][-seq] : 0);
    score += val;
    if (score >= 800000) return WIN_DETECTED;
  }
  return score;
}

function evaluateMove(Board, x, y, player) {
  let score = 0;
  const dirs = getDirections(Board, x, y);
  for (const dir of dirs) { const temp = evaluateDirection(dir, player); if (temp === WIN_DETECTED) return WIN_DETECTED; score += temp; }
  return score;
}

function generateMoves(restrictions, Board, player, depth) {
  const moves = [];
  const [min_r, min_c, max_r, max_c] = restrictions;
  for (let i = min_r - 2; i <= max_r + 2; i++) {
    for (let j = min_c - 2; j <= max_c + 2; j++) {
      if (Board[i][j] === 0 && !isRemoteCell(Board, i, j)) {
        const baseScore = evaluateMove(Board, i, j, player);
        if (baseScore === WIN_DETECTED) return [{ i, j, score: Infinity }];
        const historyBonus = historyTable[i] ? historyTable[i][j] || 0 : 0;
        moves.push({ i, j, score: baseScore + historyBonus * 10 });
      }
    }
  }
  moves.sort((a, b) => b.score - a.score);
  if (killerMoves[depth]) {
    for (let k = killerMoves[depth].length - 1; k >= 0; k--) {
      const killer = killerMoves[depth][k];
      const idx = moves.findIndex(m => m.i === killer.i && m.j === killer.j);
      if (idx > 0) { const [move] = moves.splice(idx, 1); moves.unshift(move); }
    }
  }
  return moves.slice(0, 15);
}

function evaluateState(Board, player, h, restrictions) {
  const black = eval_board(Board, -1, restrictions);
  const white = eval_board(Board, 1, restrictions);
  const score = player === -1 ? black - white : white - black;
  StateCache.set(h, score);
  return score;
}

const Table = [];
function initTable() {
  for (let i = 0; i < Rows; i++) { Table[i] = []; for (let j = 0; j < Columns; j++) Table[i][j] = [crypto.getRandomValues(new Uint32Array(1))[0], crypto.getRandomValues(new Uint32Array(1))[0]]; }
}

function hash(board) {
  let h = 0;
  for (let i = 0; i < Rows; i++) for (let j = 0; j < Columns; j++) if (board[i][j] !== 0) h ^= Table[i][j][board[i][j] === -1 ? 0 : 1];
  return h;
}

function updateHash(h, player, r, c) { return h ^ Table[r][c][player === -1 ? 0 : 1]; }

let startTime, maxTime;
function timeout() { return Date.now() - startTime >= maxTime; }

const Cache = new Map(), StateCache = new Map();
let MaxDepth;

function negascout(board, player, depth, alpha, beta, h, restrictions, lastI, lastJ) {
  if (timeout()) return { timeout: true };
  const cached = Cache.get(h);
  if (cached && cached.depth >= depth) {
    if (cached.flag === 0) return cached.score;
    if (cached.flag === -1) alpha = Math.max(alpha, cached.score);
    else if (cached.flag === 1) beta = Math.min(beta, cached.score);
    if (alpha >= beta) return cached.score;
  }
  fc++;
  if (checkWin(board, lastI, lastJ)) return -2000000 + (MaxDepth - depth);
  if (depth === 0) { const sc = StateCache.get(h); return sc !== undefined ? sc : evaluateState(board, player, h, restrictions); }
  const moves = generateMoves(restrictions, board, player, depth);
  if (moves.length === 0) return 0;
  let b = beta, bestScore = -Infinity, bestMove = null;
  const alphaOrig = alpha;
  for (let idx = 0; idx < moves.length; idx++) {
    const { i, j } = moves[idx];
    const newHash = updateHash(h, player, i, j);
    board[i][j] = player;
    const newRestrictions = updateRestrictions(restrictions, i, j);
    let score = -negascout(board, -player, depth - 1, -b, -alpha, newHash, newRestrictions, i, j);
    if (score && score.timeout) { board[i][j] = 0; return { timeout: true }; }
    if (score > alpha && score < beta && idx > 0) {
      score = -negascout(board, -player, depth - 1, -beta, -score, newHash, newRestrictions, i, j);
      if (score && score.timeout) { board[i][j] = 0; return { timeout: true }; }
    }
    board[i][j] = 0;
    if (score > bestScore) { bestScore = score; if (depth === MaxDepth) bestMove = { i, j, score }; }
    if (score > alpha) { alpha = score; if (historyTable[i]) historyTable[i][j] = (historyTable[i][j] || 0) + depth * depth; }
    if (alpha >= beta) {
      if (!killerMoves[depth]) killerMoves[depth] = [];
      if (!killerMoves[depth].find(k => k.i === i && k.j === j)) { killerMoves[depth].unshift({ i, j }); if (killerMoves[depth].length > 2) killerMoves[depth].pop(); }
      break;
    }
    b = alpha + 1;
  }
  const flag = bestScore <= alphaOrig ? 1 : bestScore >= beta ? -1 : 0;
  Cache.set(h, { score: bestScore, depth, flag });
  return depth === MaxDepth ? bestMove : bestScore;
}

function iterativeDeepening(board, player) {
  let bestMove = null, guess = 0;
  for (let depth = 2; depth <= 20; depth += 2) {
    if (timeout()) break;
    MaxDepth = depth;
    let alpha = guess - 50, beta = guess + 50;
    let result = negascout(board, player, depth, alpha, beta, hash(board), getRestrictions(board), 0, 0);
    if (result && result.timeout) break;
    if (typeof result === 'number' || (result && (result.score <= alpha || result.score >= beta))) {
      result = negascout(board, player, depth, -Infinity, Infinity, hash(board), getRestrictions(board), 0, 0);
      if (result && result.timeout) break;
    }
    if (result && result.i !== undefined) { bestMove = result; guess = result.score; }
    if (bestMove && bestMove.score > 1999000) break;
  }
  return bestMove;
}

onmessage = function(e) {
  const [board, , time] = e.data;
  maxTime = time || 3000;
  if (!board) return;
  GameBoard = board;
  Rows = board.length;
  Columns = board[0].length;
  let sum = 0;
  for (let i = 0; i < Rows; i++) for (let j = 0; j < Columns; j++) if (board[i][j] !== 0) sum++;
  if (sum === 0) { postMessage({ bestmove: { i: Math.floor(Rows / 2), j: Math.floor(Columns / 2), score: 0 }, time: 0 }); return; }
  fc = 0;
  Cache.clear();
  StateCache.clear();
  killerMoves.length = 0;
  initTable();
  initHistoryTable();
  startTime = Date.now();
  const t0 = performance.now();
  const bestmove = iterativeDeepening(GameBoard, -1);
  postMessage({ bestmove, time: (performance.now() - t0) / 1000, nodes: fc });
};
`;

// ============= 2048 AI WORKER =============
const AI_2048_CODE = `
const minSearchTime = 100;

function Tile(position, value) {
  this.x = position.x; this.y = position.y; this.value = value || 2;
  this.previousPosition = null; this.mergedFrom = null;
}
Tile.prototype.updatePosition = function(position) { this.x = position.x; this.y = position.y; };

function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
  this.playerTurn = true;
}

Grid.prototype.empty = function() {
  var cells = [];
  for (var x = 0; x < this.size; x++) { var row = cells[x] = []; for (var y = 0; y < this.size; y++) row.push(null); }
  return cells;
};

Grid.prototype.fromState = function(state) {
  var cells = [];
  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];
    for (var y = 0; y < this.size; y++) { var tile = state[x][y]; row.push(tile ? new Tile({ x: x, y: y }, tile.value) : null); }
  }
  return cells;
};

Grid.prototype.availableCells = function() {
  var cells = [];
  for (var x = 0; x < this.size; x++) for (var y = 0; y < this.size; y++) if (!this.cells[x][y]) cells.push({ x: x, y: y });
  return cells;
};

Grid.prototype.cellAvailable = function(cell) { return !this.cellOccupied(cell); };
Grid.prototype.cellOccupied = function(cell) { return !!this.cellContent(cell); };
Grid.prototype.cellContent = function(cell) { return this.withinBounds(cell) ? this.cells[cell.x][cell.y] : null; };
Grid.prototype.insertTile = function(tile) { this.cells[tile.x][tile.y] = tile; };
Grid.prototype.removeTile = function(cell) { this.cells[cell.x][cell.y] = null; };
Grid.prototype.withinBounds = function(position) { return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size; };

Grid.prototype.clone = function() {
  var newGrid = new Grid(this.size);
  newGrid.playerTurn = this.playerTurn;
  for (var x = 0; x < this.size; x++) for (var y = 0; y < this.size; y++) if (this.cells[x][y]) newGrid.cells[x][y] = new Tile({ x: x, y: y }, this.cells[x][y].value);
  return newGrid;
};

Grid.prototype.getVector = function(direction) { return [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }][direction]; };

Grid.prototype.buildTraversals = function(vector) {
  var traversals = { x: [], y: [] };
  for (var pos = 0; pos < this.size; pos++) { traversals.x.push(pos); traversals.y.push(pos); }
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();
  return traversals;
};

Grid.prototype.findFarthestPosition = function(cell, vector) {
  var previous;
  do { previous = cell; cell = { x: previous.x + vector.x, y: previous.y + vector.y }; } while (this.withinBounds(cell) && this.cellAvailable(cell));
  return { farthest: previous, next: cell };
};

Grid.prototype.movesAvailable = function() { return this.availableCells().length > 0 || this.tileMatchesAvailable(); };

Grid.prototype.tileMatchesAvailable = function() {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      var tile = this.cells[x][y];
      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = this.getVector(direction);
          var other = this.cellContent({ x: x + vector.x, y: y + vector.y });
          if (other && other.value === tile.value) return true;
        }
      }
    }
  }
  return false;
};

Grid.prototype.move = function(direction) {
  var self = this, vector = this.getVector(direction), traversals = this.buildTraversals(vector);
  var moved = false, score = 0, won = false;
  traversals.x.forEach(function(x) {
    traversals.y.forEach(function(y) {
      var cell = { x: x, y: y }, tile = self.cellContent(cell);
      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next = self.cellContent(positions.next);
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];
          self.insertTile(merged); self.removeTile(tile);
          tile.updatePosition(positions.next);
          score += merged.value;
          if (merged.value === 2048) won = true;
          moved = true;
        } else {
          if (cell.x !== positions.farthest.x || cell.y !== positions.farthest.y) {
            self.removeTile(cell);
            tile.updatePosition(positions.farthest);
            self.insertTile(tile);
            moved = true;
          }
        }
      }
    });
  });
  for (var x = 0; x < this.size; x++) for (var y = 0; y < this.size; y++) if (this.cells[x][y]) this.cells[x][y].mergedFrom = null;
  return { moved: moved, score: score, won: won };
};

Grid.prototype.isWin = function() {
  for (var x = 0; x < this.size; x++) for (var y = 0; y < this.size; y++) if (this.cells[x][y] && this.cells[x][y].value >= 2048) return true;
  return false;
};

Grid.prototype.maxValue = function() {
  var max = 0;
  for (var x = 0; x < this.size; x++) for (var y = 0; y < this.size; y++) if (this.cells[x][y]) max = Math.max(max, this.cells[x][y].value);
  return Math.log(max) / Math.log(2);
};

Grid.prototype.smoothness = function() {
  var smoothness = 0;
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y]) {
        var value = Math.log(this.cells[x][y].value) / Math.log(2);
        for (var direction = 1; direction <= 2; direction++) {
          var targetCell = this.findFarthestPosition({ x: x, y: y }, this.getVector(direction)).next;
          if (this.cellContent(targetCell)) {
            var targetValue = Math.log(this.cellContent(targetCell).value) / Math.log(2);
            smoothness -= Math.abs(value - targetValue);
          }
        }
      }
    }
  }
  return smoothness;
};

Grid.prototype.monotonicity2 = function() {
  var totals = [0, 0, 0, 0];
  for (var x = 0; x < this.size; x++) {
    var current = 0, next = 1;
    while (next < this.size) {
      while (next < this.size && !this.cells[x][next]) next++;
      if (next >= this.size) next--;
      var currentValue = this.cells[x][current] ? Math.log(this.cells[x][current].value) / Math.log(2) : 0;
      var nextValue = this.cells[x][next] ? Math.log(this.cells[x][next].value) / Math.log(2) : 0;
      if (currentValue > nextValue) totals[0] += nextValue - currentValue;
      else if (nextValue > currentValue) totals[1] += currentValue - nextValue;
      current = next; next++;
    }
  }
  for (var y = 0; y < this.size; y++) {
    var current = 0, next = 1;
    while (next < this.size) {
      while (next < this.size && !this.cells[next][y]) next++;
      if (next >= this.size) next--;
      var currentValue = this.cells[current][y] ? Math.log(this.cells[current][y].value) / Math.log(2) : 0;
      var nextValue = this.cells[next][y] ? Math.log(this.cells[next][y].value) / Math.log(2) : 0;
      if (currentValue > nextValue) totals[2] += nextValue - currentValue;
      else if (nextValue > currentValue) totals[3] += currentValue - nextValue;
      current = next; next++;
    }
  }
  return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3]);
};

Grid.prototype.islands = function() {
  var self = this, mark = [];
  for (var x = 0; x < this.size; x++) { mark[x] = []; for (var y = 0; y < this.size; y++) mark[x][y] = false; }
  var islands = 0;
  function markIsland(x, y, value) {
    if (x < 0 || x >= self.size || y < 0 || y >= self.size) return;
    if (mark[x][y] || !self.cells[x][y] || self.cells[x][y].value !== value) return;
    mark[x][y] = true;
    markIsland(x - 1, y, value); markIsland(x + 1, y, value); markIsland(x, y - 1, value); markIsland(x, y + 1, value);
  }
  for (var x = 0; x < this.size; x++) for (var y = 0; y < this.size; y++) if (this.cells[x][y] && !mark[x][y]) { islands++; markIsland(x, y, this.cells[x][y].value); }
  return islands;
};

function AI(grid) { this.grid = grid; }

AI.prototype.eval = function() {
  var emptyCells = this.grid.availableCells().length;
  return this.grid.smoothness() * 0.1 + this.grid.monotonicity2() * 1.0 + Math.log(emptyCells) * 2.7 + this.grid.maxValue() * 1.0;
};

AI.prototype.search = function(depth, alpha, beta, positions, cutoffs) {
  var bestScore, bestMove = -1, result;
  if (this.grid.playerTurn) {
    bestScore = alpha;
    for (var direction = 0; direction < 4; direction++) {
      var newGrid = this.grid.clone();
      if (newGrid.move(direction).moved) {
        positions++;
        if (newGrid.isWin()) return { move: direction, score: 10000, positions: positions, cutoffs: cutoffs };
        var newAI = new AI(newGrid);
        if (depth === 0) result = { move: direction, score: newAI.eval() };
        else { result = newAI.search(depth - 1, bestScore, beta, positions, cutoffs); if (result.score > 9900) result.score--; positions = result.positions; cutoffs = result.cutoffs; }
        if (result.score > bestScore) { bestScore = result.score; bestMove = direction; }
        if (bestScore > beta) { cutoffs++; return { move: bestMove, score: beta, positions: positions, cutoffs: cutoffs }; }
      }
    }
  } else {
    bestScore = beta;
    var cells = this.grid.availableCells(), scores = { 2: [], 4: [] };
    for (var value in scores) {
      for (var i = 0; i < cells.length; i++) {
        scores[value].push(null);
        var tile = new Tile(cells[i], parseInt(value, 10));
        this.grid.insertTile(tile);
        scores[value][i] = -this.grid.smoothness() + this.grid.islands();
        this.grid.removeTile(cells[i]);
      }
    }
    var maxScore = Math.max(Math.max.apply(null, scores[2]), Math.max.apply(null, scores[4]));
    var candidates = [];
    for (var value in scores) for (var i = 0; i < scores[value].length; i++) if (scores[value][i] === maxScore) candidates.push({ position: cells[i], value: parseInt(value, 10) });
    for (var i = 0; i < candidates.length; i++) {
      var newGrid = this.grid.clone();
      newGrid.insertTile(new Tile(candidates[i].position, candidates[i].value));
      newGrid.playerTurn = true;
      positions++;
      result = new AI(newGrid).search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions; cutoffs = result.cutoffs;
      if (result.score < bestScore) bestScore = result.score;
      if (bestScore < alpha) { cutoffs++; return { move: null, score: alpha, positions: positions, cutoffs: cutoffs }; }
    }
  }
  return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
};

AI.prototype.iterativeDeep = function() {
  var start = Date.now(), depth = 0, best;
  do {
    var newBest = this.search(depth, -10000, 10000, 0, 0);
    if (newBest.move === -1) break;
    best = newBest;
    depth++;
  } while (Date.now() - start < minSearchTime);
  return best;
};

self.onmessage = function(e) {
  var grid = new Grid(4, e.data);
  grid.playerTurn = true;
  var result = new AI(grid).iterativeDeep();
  self.postMessage({ move: result.move, score: result.score });
};
`;

// ============= FACTORY FUNCTIONS =============

export function createCaroWorker(type: CaroWorkerType): Worker {
  const codeMap: Record<CaroWorkerType, string> = {
    v1: CARO_V1_CODE,
    v2: CARO_V2_CODE,
    v3: CARO_V3_CODE,
    v4: CARO_V4_CODE,
    v5: CARO_V5_CODE,
    ultimate: CARO_ULTIMATE_CODE,
  };
  return createWorkerFromCode(codeMap[type]);
}

export function create2048Worker(): Worker {
  return createWorkerFromCode(AI_2048_CODE);
}

// Map từ worker path cũ sang type mới
export function getCaroWorkerType(workerPath: string): CaroWorkerType {
  if (workerPath.includes("ultimate")) return "ultimate";
  if (workerPath.includes("v5")) return "v5";
  if (workerPath.includes("v4")) return "v4";
  if (workerPath.includes("v3")) return "v3";
  if (workerPath.includes("v2")) return "v2";
  return "v1";
}
