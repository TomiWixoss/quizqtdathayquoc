// Caro AI Ultimate - Siêu phàm + Nhanh
// NegaScout + Killer Moves + History Heuristic + Aspiration Windows + Optimized Move Ordering
let GameBoard,
  Rows,
  Columns,
  fc = 0;
const WIN_DETECTED = false;

// Evaluation constants - tuned for aggressive play
const SCORES = {
  L1: 10,
  D1: 1,
  L2: 100,
  D2: 10,
  L3: 1000,
  D3: 100,
  L4: 10000,
  D4: 1000,
  FIVE: 100000,
};

// Killer moves for each depth (move ordering optimization)
const killerMoves = [];
// History heuristic table
const historyTable = [];

function initHistoryTable() {
  for (let i = 0; i < Rows; i++) {
    historyTable[i] = [];
    for (let j = 0; j < Columns; j++) historyTable[i][j] = 0;
  }
}

function eval_board(Board, pieceType, restrictions) {
  let score = 0;
  const [min_r, min_c, max_r, max_c] = restrictions;

  // Horizontal
  for (let row = min_r; row <= max_r; row++) {
    for (let col = min_c; col <= max_c; col++) {
      if (Board[row][col] === pieceType) {
        let block = 0,
          piece = 1;
        if (col === 0 || Board[row][col - 1] !== 0) block++;
        for (col++; col < Columns && Board[row][col] === pieceType; col++)
          piece++;
        if (col === Columns || Board[row][col] !== 0) block++;
        score += evaluateBlock(block, piece);
      }
    }
  }
  // Vertical
  for (let col = min_c; col <= max_c; col++) {
    for (let row = min_r; row <= max_r; row++) {
      if (Board[row][col] === pieceType) {
        let block = 0,
          piece = 1;
        if (row === 0 || Board[row - 1][col] !== 0) block++;
        for (row++; row < Rows && Board[row][col] === pieceType; row++) piece++;
        if (row === Rows || Board[row][col] !== 0) block++;
        score += evaluateBlock(block, piece);
      }
    }
  }
  // Diagonal \
  for (let n = min_r; n < max_c - min_c + max_r; n++) {
    let r = n,
      c = min_c;
    while (r >= min_r && c <= max_c) {
      if (r <= max_r && Board[r][c] === pieceType) {
        let block = 0,
          piece = 1;
        if (c === 0 || r === Rows - 1 || Board[r + 1][c - 1] !== 0) block++;
        r--;
        c++;
        for (; r >= 0 && c < Columns && Board[r][c] === pieceType; r--, c++)
          piece++;
        if (r < 0 || c === Columns || Board[r][c] !== 0) block++;
        score += evaluateBlock(block, piece);
      }
      r--;
      c++;
    }
  }
  // Diagonal /
  for (let n = min_r - (max_c - min_c); n <= max_r; n++) {
    let r = n,
      c = min_c;
    while (r <= max_r && c <= max_c) {
      if (r >= min_r && Board[r][c] === pieceType) {
        let block = 0,
          piece = 1;
        if (c === 0 || r === 0 || Board[r - 1][c - 1] !== 0) block++;
        r++;
        c++;
        for (; r < Rows && c < Columns && Board[r][c] === pieceType; r++, c++)
          piece++;
        if (r === Rows || c === Columns || Board[r][c] !== 0) block++;
        score += evaluateBlock(block, piece);
      }
      r++;
      c++;
    }
  }
  return score;
}

function evaluateBlock(blocks, pieces) {
  if (blocks === 0)
    return [0, SCORES.L1, SCORES.L2, SCORES.L3, SCORES.L4, SCORES.FIVE][
      Math.min(pieces, 5)
    ];
  if (blocks === 1)
    return [0, SCORES.D1, SCORES.D2, SCORES.D3, SCORES.D4, SCORES.FIVE][
      Math.min(pieces, 5)
    ];
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
      if (
        arr[i] !== 0 &&
        arr[i] === arr[i + 1] &&
        arr[i] === arr[i + 2] &&
        arr[i] === arr[i + 3] &&
        arr[i] === arr[i + 4]
      )
        return true;
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
  let min_r = Infinity,
    min_c = Infinity,
    max_r = -Infinity,
    max_c = -Infinity;
  for (let i = 0; i < Rows; i++) {
    for (let j = 0; j < Columns; j++) {
      if (Board[i][j] !== 0) {
        min_r = Math.min(min_r, i);
        min_c = Math.min(min_c, j);
        max_r = Math.max(max_r, i);
        max_c = Math.max(max_c, j);
      }
    }
  }
  return [
    Math.max(2, min_r),
    Math.max(2, min_c),
    Math.min(Rows - 3, max_r),
    Math.min(Columns - 3, max_c),
  ];
}

function updateRestrictions(restrictions, i, j) {
  let [min_r, min_c, max_r, max_c] = restrictions;
  min_r = Math.min(min_r, i);
  max_r = Math.max(max_r, i);
  min_c = Math.min(min_c, j);
  max_c = Math.max(max_c, j);
  return [
    Math.max(2, min_r),
    Math.max(2, min_c),
    Math.min(Rows - 3, max_r),
    Math.min(Columns - 3, max_c),
  ];
}

function evaluateDirection(arr, player) {
  let score = 0;
  for (let i = 0; i + 4 < arr.length; i++) {
    let you = 0,
      enemy = 0;
    for (let j = 0; j <= 4; j++) {
      if (arr[i + j] === player) you++;
      else if (arr[i + j] === -player) enemy++;
    }
    const seq =
      you + enemy === 0 ? 0 : you && !enemy ? you : !you && enemy ? -enemy : 17;
    const val =
      [7, 35, 800, 15000, 800000][Math.abs(seq)] ||
      (seq < 0 ? [0, 15, 400, 1800, 100000][-seq] : 0);
    score += val;
    if (score >= 800000) return WIN_DETECTED;
  }
  return score;
}

function evaluateMove(Board, x, y, player) {
  let score = 0;
  const dirs = getDirections(Board, x, y);
  for (const dir of dirs) {
    const temp = evaluateDirection(dir, player);
    if (temp === WIN_DETECTED) return WIN_DETECTED;
    score += temp;
  }
  return score;
}

// Generate moves with killer move ordering + history heuristic
function generateMoves(restrictions, Board, player, depth) {
  const moves = [];
  const [min_r, min_c, max_r, max_c] = restrictions;

  for (let i = min_r - 2; i <= max_r + 2; i++) {
    for (let j = min_c - 2; j <= max_c + 2; j++) {
      if (Board[i][j] === 0 && !isRemoteCell(Board, i, j)) {
        const baseScore = evaluateMove(Board, i, j, player);
        if (baseScore === WIN_DETECTED) return [{ i, j, score: Infinity }];
        // Add history heuristic bonus
        const historyBonus = historyTable[i] ? historyTable[i][j] || 0 : 0;
        moves.push({ i, j, score: baseScore + historyBonus * 10 });
      }
    }
  }

  // Sort by score descending
  moves.sort((a, b) => b.score - a.score);

  // Move killer moves to front if they exist
  if (killerMoves[depth]) {
    for (let k = killerMoves[depth].length - 1; k >= 0; k--) {
      const killer = killerMoves[depth][k];
      const idx = moves.findIndex((m) => m.i === killer.i && m.j === killer.j);
      if (idx > 0) {
        const [move] = moves.splice(idx, 1);
        moves.unshift(move);
      }
    }
  }

  // Limit moves for speed (top 15 most promising)
  return moves.slice(0, 15);
}

function evaluateState(Board, player, h, restrictions) {
  const black = eval_board(Board, -1, restrictions);
  const white = eval_board(Board, 1, restrictions);
  const score = player === -1 ? black - white : white - black;
  StateCache.set(h, score);
  return score;
}

// Zobrist hashing
const Table = [];
function initTable() {
  for (let i = 0; i < Rows; i++) {
    Table[i] = [];
    for (let j = 0; j < Columns; j++) {
      Table[i][j] = [
        crypto.getRandomValues(new Uint32Array(1))[0],
        crypto.getRandomValues(new Uint32Array(1))[0],
      ];
    }
  }
}

function hash(board) {
  let h = 0;
  for (let i = 0; i < Rows; i++) {
    for (let j = 0; j < Columns; j++) {
      if (board[i][j] !== 0) h ^= Table[i][j][board[i][j] === -1 ? 0 : 1];
    }
  }
  return h;
}

function updateHash(h, player, r, c) {
  return h ^ Table[r][c][player === -1 ? 0 : 1];
}

// Timeout check
let startTime, maxTime;
function timeout() {
  return Date.now() - startTime >= maxTime;
}

// NegaScout with all optimizations
function negascout(
  board,
  player,
  depth,
  alpha,
  beta,
  h,
  restrictions,
  lastI,
  lastJ
) {
  if (timeout()) return { timeout: true };

  // Transposition table lookup
  const cached = Cache.get(h);
  if (cached && cached.depth >= depth) {
    if (cached.flag === 0) return cached.score;
    if (cached.flag === -1) alpha = Math.max(alpha, cached.score);
    else if (cached.flag === 1) beta = Math.min(beta, cached.score);
    if (alpha >= beta) return cached.score;
  }

  fc++;

  // Terminal checks
  if (checkWin(board, lastI, lastJ)) return -2000000 + (MaxDepth - depth);
  if (depth === 0) {
    const sc = StateCache.get(h);
    return sc !== undefined
      ? sc
      : evaluateState(board, player, h, restrictions);
  }

  const moves = generateMoves(restrictions, board, player, depth);
  if (moves.length === 0) return 0;

  let b = beta,
    bestScore = -Infinity,
    bestMove = null;
  const alphaOrig = alpha;

  for (let idx = 0; idx < moves.length; idx++) {
    const { i, j } = moves[idx];
    const newHash = updateHash(h, player, i, j);
    board[i][j] = player;
    const newRestrictions = updateRestrictions(restrictions, i, j);

    let score = -negascout(
      board,
      -player,
      depth - 1,
      -b,
      -alpha,
      newHash,
      newRestrictions,
      i,
      j
    );
    if (score && score.timeout) {
      board[i][j] = 0;
      return { timeout: true };
    }

    // Re-search with full window if needed
    if (score > alpha && score < beta && idx > 0) {
      score = -negascout(
        board,
        -player,
        depth - 1,
        -beta,
        -score,
        newHash,
        newRestrictions,
        i,
        j
      );
      if (score && score.timeout) {
        board[i][j] = 0;
        return { timeout: true };
      }
    }

    board[i][j] = 0;

    if (score > bestScore) {
      bestScore = score;
      if (depth === MaxDepth) bestMove = { i, j, score };
    }

    if (score > alpha) {
      alpha = score;
      // Update history heuristic
      if (historyTable[i])
        historyTable[i][j] = (historyTable[i][j] || 0) + depth * depth;
    }

    if (alpha >= beta) {
      // Store killer move
      if (!killerMoves[depth]) killerMoves[depth] = [];
      if (!killerMoves[depth].find((k) => k.i === i && k.j === j)) {
        killerMoves[depth].unshift({ i, j });
        if (killerMoves[depth].length > 2) killerMoves[depth].pop();
      }
      break;
    }

    b = alpha + 1;
  }

  // Store in transposition table
  const flag = bestScore <= alphaOrig ? 1 : bestScore >= beta ? -1 : 0;
  Cache.set(h, { score: bestScore, depth, flag });

  return depth === MaxDepth ? bestMove : bestScore;
}

// Iterative deepening with aspiration windows
function iterativeDeepening(board, player) {
  let bestMove = null,
    guess = 0;

  for (let depth = 2; depth <= 20; depth += 2) {
    if (timeout()) break;

    MaxDepth = depth;

    // Aspiration window
    let alpha = guess - 50,
      beta = guess + 50;
    let result = negascout(
      board,
      player,
      depth,
      alpha,
      beta,
      hash(board),
      getRestrictions(board),
      0,
      0
    );

    if (result && result.timeout) break;

    // Re-search with full window if outside aspiration
    if (
      typeof result === "number" ||
      (result && (result.score <= alpha || result.score >= beta))
    ) {
      result = negascout(
        board,
        player,
        depth,
        -Infinity,
        Infinity,
        hash(board),
        getRestrictions(board),
        0,
        0
      );
      if (result && result.timeout) break;
    }

    if (result && result.i !== undefined) {
      bestMove = result;
      guess = result.score;
    }

    // Early exit if winning
    if (bestMove && bestMove.score > 1999000) break;
  }

  return bestMove;
}

const Cache = new Map();
const StateCache = new Map();
let MaxDepth;

onmessage = function (e) {
  const [board, , time] = e.data;
  maxTime = time || 3000;

  if (!board) return;

  GameBoard = board;
  Rows = board.length;
  Columns = board[0].length;

  // Check if board is empty
  let sum = 0;
  for (let i = 0; i < Rows; i++)
    for (let j = 0; j < Columns; j++) if (board[i][j] !== 0) sum++;
  if (sum === 0) {
    postMessage({
      bestmove: {
        i: Math.floor(Rows / 2),
        j: Math.floor(Columns / 2),
        score: 0,
      },
      time: 0,
    });
    return;
  }

  // Initialize
  fc = 0;
  Cache.clear();
  StateCache.clear();
  killerMoves.length = 0;
  initTable();
  initHistoryTable();
  startTime = Date.now();

  const t0 = performance.now();
  const bestmove = iterativeDeepening(GameBoard, -1);
  const t1 = performance.now();

  postMessage({ bestmove, time: (t1 - t0) / 1000, nodes: fc });
};
