// Caro AI Worker V2 - Iterative Negamax with fixed depth
let GameBoard;
let fc = 0;
let Rows;
let Columns;
const WIN_DETECTED = false;
const LiveOne = 10;
const DeadOne = 1;
const LiveTwo = 100;
const DeadTwo = 10;
const LiveThree = 1000;
const DeadThree = 100;
const LiveFour = 10000;
const DeadFour = 1000;
const Five = 100000;

function eval_board(Board, pieceType, restrictions) {
  let score = 0;
  const min_r = restrictions[0];
  const min_c = restrictions[1];
  const max_r = restrictions[2];
  const max_c = restrictions[3];

  for (let row = min_r; row < max_r + 1; row++) {
    for (let column = min_c; column < max_c + 1; column++) {
      if (Board[row][column] == pieceType) {
        let block = 0;
        let piece = 1;
        if (column === 0 || Board[row][column - 1] !== 0) block++;
        for (
          column++;
          column < Columns && Board[row][column] === pieceType;
          column++
        )
          piece++;
        if (column === Columns || Board[row][column] !== 0) block++;
        score += evaluateblock(block, piece);
      }
    }
  }

  for (let column = min_c; column < max_c + 1; column++) {
    for (let row = min_r; row < max_r + 1; row++) {
      if (Board[row][column] == pieceType) {
        let block = 0;
        let piece = 1;
        if (row === 0 || Board[row - 1][column] !== 0) block++;
        for (row++; row < Rows && Board[row][column] === pieceType; row++)
          piece++;
        if (row === Rows || Board[row][column] !== 0) block++;
        score += evaluateblock(block, piece);
      }
    }
  }

  for (let n = min_r; n < max_c - min_c + max_r; n += 1) {
    let r = n;
    let c = min_c;
    while (r >= min_r && c <= max_c) {
      if (r <= max_r) {
        if (Board[r][c] === pieceType) {
          let block = 0;
          let piece = 1;
          if (c === 0 || r === Rows - 1 || Board[r + 1][c - 1] !== 0) block++;
          r--;
          c++;
          for (; r >= 0 && Board[r][c] === pieceType; r--) {
            piece++;
            c++;
          }
          if (r < 0 || c === Columns || Board[r][c] !== 0) block++;
          score += evaluateblock(block, piece);
        }
      }
      r -= 1;
      c += 1;
    }
  }

  for (let n = min_r - (max_c - min_c); n <= max_r; n++) {
    let r = n;
    let c = min_c;
    while (r <= max_r && c <= max_c) {
      if (r >= min_r && r <= max_r) {
        if (Board[r][c] === pieceType) {
          let block = 0;
          let piece = 1;
          if (c === 0 || r === 0 || Board[r - 1][c - 1] !== 0) block++;
          r++;
          c++;
          for (; r < Rows && Board[r][c] == pieceType; r++) {
            piece++;
            c++;
          }
          if (r === Rows || c === Columns || Board[r][c] !== 0) block++;
          score += evaluateblock(block, piece);
        }
      }
      r += 1;
      c += 1;
    }
  }
  return score;
}

function evaluateblock(blocks, pieces) {
  if (blocks === 0) {
    switch (pieces) {
      case 1:
        return LiveOne;
      case 2:
        return LiveTwo;
      case 3:
        return LiveThree;
      case 4:
        return LiveFour;
      default:
        return Five;
    }
  } else if (blocks === 1) {
    switch (pieces) {
      case 1:
        return DeadOne;
      case 2:
        return DeadTwo;
      case 3:
        return DeadThree;
      case 4:
        return DeadFour;
      default:
        return Five;
    }
  } else {
    return pieces >= 5 ? Five : 0;
  }
}

function check_directions(arr) {
  for (let i = 0; i < arr.length - 4; i++) {
    if (
      arr[i] !== 0 &&
      arr[i] === arr[i + 1] &&
      arr[i] === arr[i + 2] &&
      arr[i] === arr[i + 3] &&
      arr[i] === arr[i + 4]
    ) {
      return true;
    }
  }
}

function get_directions(Board, x, y) {
  const Directions = [[], [], [], []];
  for (let i = -4; i < 5; i++) {
    if (x + i >= 0 && x + i <= Rows - 1) {
      Directions[0].push(Board[x + i][y]);
      if (y + i >= 0 && y + i <= Columns - 1)
        Directions[2].push(Board[x + i][y + i]);
    }
    if (y + i >= 0 && y + i <= Columns - 1) {
      Directions[1].push(Board[x][y + i]);
      if (x - i >= 0 && x - i <= Rows - 1)
        Directions[3].push(Board[x - i][y + i]);
    }
  }
  return Directions;
}

function checkwin(Board, x, y) {
  const Directions = get_directions(Board, x, y);
  for (let i = 0; i < 4; i++) {
    if (check_directions(Directions[i])) return true;
  }
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
  if (min_r - 2 < 0) min_r = 2;
  if (min_c - 2 < 0) min_c = 2;
  if (max_r + 2 >= Rows) max_r = Rows - 3;
  if (max_c + 2 >= Columns) max_c = Columns - 3;
  return [min_r, min_c, max_r, max_c];
}

function Change_restrictions(restrictions, i, j) {
  let [min_r, min_c, max_r, max_c] = restrictions;
  if (i < min_r) min_r = i;
  else if (i > max_r) max_r = i;
  if (j < min_c) min_c = j;
  else if (j > max_c) max_c = j;
  if (min_r - 2 < 0) min_r = 2;
  if (min_c - 2 < 0) min_c = 2;
  if (max_r + 2 >= Rows) max_r = Rows - 3;
  if (max_c + 2 >= Columns) max_c = Columns - 3;
  return [min_r, min_c, max_r, max_c];
}

function compare(a, b) {
  return b.score - a.score;
}

function BoardGenerator(restrictions, Board, player) {
  const availSpots_score = [];
  const [min_r, min_c, max_r, max_c] = restrictions;
  for (let i = min_r - 2; i <= max_r + 2; i++) {
    for (let j = min_c - 2; j <= max_c + 2; j++) {
      if (Board[i][j] === 0 && !remoteCell(Board, i, j)) {
        const move = { i, j, score: evaluate_move(Board, i, j, player) };
        if (move.score === WIN_DETECTED) return [move];
        availSpots_score.push(move);
      }
    }
  }
  availSpots_score.sort(compare);
  return availSpots_score;
}

function evaluate_direction(direction_arr, player) {
  let score = 0;
  for (let i = 0; i + 4 < direction_arr.length; i++) {
    let you = 0,
      enemy = 0;
    for (let j = 0; j <= 4; j++) {
      if (direction_arr[i + j] === player) you++;
      else if (direction_arr[i + j] === -player) enemy++;
    }
    score += evalff(get_seq(you, enemy));
    if (score >= 800000) return WIN_DETECTED;
  }
  return score;
}

function evalff(seq) {
  switch (seq) {
    case 0:
      return 7;
    case 1:
      return 35;
    case 2:
      return 800;
    case 3:
      return 15000;
    case 4:
      return 800000;
    case -1:
      return 15;
    case -2:
      return 400;
    case -3:
      return 1800;
    case -4:
      return 100000;
    case 17:
      return 0;
  }
}

function get_seq(y, e) {
  if (y + e === 0) return 0;
  if (y !== 0 && e === 0) return y;
  if (y === 0 && e !== 0) return -e;
  if (y !== 0 && e !== 0) return 17;
}

function evaluate_move(Board, x, y, player) {
  let score = 0;
  const Directions = get_directions(Board, x, y);
  for (let i = 0; i < 4; i++) {
    const temp_score = evaluate_direction(Directions[i], player);
    if (temp_score === WIN_DETECTED) return WIN_DETECTED;
    score += temp_score;
  }
  return score;
}

function evaluate_state(Board, player, h, restrictions) {
  const black_score = eval_board(Board, -1, restrictions);
  const white_score = eval_board(Board, 1, restrictions);
  const score =
    player == -1 ? black_score - white_score : white_score - black_score;
  StateCache.set(h, score);
  StateCachePuts++;
  return score;
}

function random32() {
  const o = new Uint32Array(1);
  self.crypto.getRandomValues(o);
  return o[0];
}

function Table_init() {
  for (let i = 0; i < Rows; i++) {
    Table[i] = [];
    for (let j = 0; j < Columns; j++) {
      Table[i][j] = [random32(), random32()];
    }
  }
}

function hash(board) {
  let h = 0;
  for (let i = 0; i < Rows; i++) {
    for (let j = 0; j < Columns; j++) {
      const Board_value = board[i][j];
      if (Board_value !== 0) {
        const p = Board_value === -1 ? 0 : 1;
        h = h ^ Table[i][j][p];
      }
    }
  }
  return h;
}

function update_hash(h, player, row, col) {
  const p = player === -1 ? 0 : 1;
  return h ^ Table[row][col][p];
}

function negamax(
  newBoard,
  player,
  depth,
  a,
  b,
  h,
  restrictions,
  last_i,
  last_j
) {
  const alphaOrig = a;
  const CacheNode = Cache.get(h);
  if (CacheNode !== undefined && CacheNode.depth >= depth) {
    CacheHits++;
    const score = CacheNode.score;
    if (CacheNode.Flag === 0) {
      CacheCutoffs++;
      return score;
    }
    if (CacheNode.Flag === -1) a = Math.max(a, score);
    else if (CacheNode.Flag === 1) b = Math.min(b, score);
    if (a >= b) {
      CacheCutoffs++;
      return score;
    }
  }
  fc++;
  if (checkwin(newBoard, last_i, last_j))
    return -2000000 + (MaximumDepth - depth);
  if (depth === 0) {
    const StateCacheNode = StateCache.get(h);
    if (StateCacheNode !== undefined) {
      StateCacheHits++;
      return StateCacheNode;
    }
    return evaluate_state(newBoard, player, h, restrictions);
  }
  const availSpots = BoardGenerator(restrictions, newBoard, player);
  if (availSpots.length === 0) return 0;
  const bestMove = {};
  let bestvalue = -Infinity;
  for (let y = 0; y < availSpots.length; y++) {
    const i = availSpots[y].i,
      j = availSpots[y].j;
    const newHash = update_hash(h, player, i, j);
    newBoard[i][j] = player;
    const restrictions_temp = Change_restrictions(restrictions, i, j);
    const value = -negamax(
      newBoard,
      -player,
      depth - 1,
      -b,
      -a,
      newHash,
      restrictions_temp,
      i,
      j
    );
    newBoard[i][j] = 0;
    if (value > bestvalue) {
      bestvalue = value;
      if (depth == MaximumDepth) {
        bestMove.i = i;
        bestMove.j = j;
        bestMove.score = value;
      }
    }
    a = Math.max(a, value);
    if (a >= b) break;
  }
  CachePuts++;
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
    bestmove = negamax(
      Board,
      player,
      MaximumDepth,
      -Infinity,
      Infinity,
      hash(Board),
      Get_restrictions(Board),
      0,
      0
    );
    if (bestmove.score > 1999900) break;
  }
  return bestmove;
}

const Table = [];
const Cache = new Map();
const StateCache = new Map();
let MaximumDepth;
let CacheHits = 0,
  CacheCutoffs = 0,
  CachePuts = 0,
  StateCacheHits = 0,
  StateCachePuts = 0;

function search(player, depth) {
  const t0 = performance.now();
  const bestmove = iterative_negamax(player, GameBoard, depth);
  const t1 = performance.now();
  Cache.clear();
  StateCache.clear();
  return { bestmove, time: (t1 - t0) / 1000 };
}

onmessage = function (e) {
  const Board = e.data[0];
  const depth = e.data[2] || 6; // Default depth 6
  if (Board) {
    GameBoard = Board;
    Rows = GameBoard.length;
    Columns = GameBoard[0].length;
    let sum = 0;
    for (let x = 0; x < Rows; x++) {
      for (let y = 0; y < Columns; y++) {
        if (GameBoard[x][y] !== 0) sum++;
      }
    }
    if (sum === 0) {
      const center = Math.floor(Rows / 2);
      postMessage({ bestmove: { i: center, j: center, score: 0 }, time: 0 });
      return;
    }
    CacheHits = 0;
    CacheCutoffs = 0;
    CachePuts = 0;
    StateCachePuts = 0;
    StateCacheHits = 0;
    fc = 0;
    Table_init();
    postMessage(search(-1, depth));
  }
};
