// 2048 AI Worker using Alpha-Beta Search

const minSearchTime = 100; // ms

// Tile class
function Tile(position, value) {
  this.x = position.x;
  this.y = position.y;
  this.value = value || 2;
  this.previousPosition = null;
  this.mergedFrom = null;
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};

// Grid class
function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
  this.playerTurn = true;
}

Grid.prototype.empty = function () {
  var cells = [];
  for (var x = 0; x < this.size; x++) {
    var row = (cells[x] = []);
    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }
  return cells;
};

Grid.prototype.fromState = function (state) {
  var cells = [];
  for (var x = 0; x < this.size; x++) {
    var row = (cells[x] = []);
    for (var y = 0; y < this.size; y++) {
      var tile = state[x][y];
      row.push(tile ? new Tile({ x: x, y: y }, tile.value) : null);
    }
  }
  return cells;
};

Grid.prototype.availableCells = function () {
  var cells = [];
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (!this.cells[x][y]) {
        cells.push({ x: x, y: y });
      }
    }
  }
  return cells;
};

Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  }
  return null;
};

Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (cell) {
  this.cells[cell.x][cell.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return (
    position.x >= 0 &&
    position.x < this.size &&
    position.y >= 0 &&
    position.y < this.size
  );
};

Grid.prototype.clone = function () {
  var newGrid = new Grid(this.size);
  newGrid.playerTurn = this.playerTurn;
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y]) {
        newGrid.cells[x][y] = new Tile({ x: x, y: y }, this.cells[x][y].value);
      }
    }
  }
  return newGrid;
};

// Get vectors for movement
Grid.prototype.getVector = function (direction) {
  var map = {
    0: { x: 0, y: -1 }, // Up
    1: { x: 1, y: 0 }, // Right
    2: { x: 0, y: 1 }, // Down
    3: { x: -1, y: 0 }, // Left
  };
  return map[direction];
};

Grid.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };
  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();
  return traversals;
};

Grid.prototype.findFarthestPosition = function (cell, vector) {
  var previous;
  do {
    previous = cell;
    cell = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.withinBounds(cell) && this.cellAvailable(cell));
  return { farthest: previous, next: cell };
};

Grid.prototype.movesAvailable = function () {
  return this.availableCells().length > 0 || this.tileMatchesAvailable();
};

Grid.prototype.tileMatchesAvailable = function () {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      var tile = this.cells[x][y];
      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = this.getVector(direction);
          var cell = { x: x + vector.x, y: y + vector.y };
          var other = this.cellContent(cell);
          if (other && other.value === tile.value) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

Grid.prototype.move = function (direction) {
  var self = this;
  var vector = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved = false;
  var score = 0;
  var won = false;

  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      var cell = { x: x, y: y };
      var tile = self.cellContent(cell);
      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next = self.cellContent(positions.next);
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];
          self.insertTile(merged);
          self.removeTile(tile);
          tile.updatePosition(positions.next);
          score += merged.value;
          if (merged.value === 2048) won = true;
          moved = true;
        } else {
          if (
            cell.x !== positions.farthest.x ||
            cell.y !== positions.farthest.y
          ) {
            self.removeTile(cell);
            tile.updatePosition(positions.farthest);
            self.insertTile(tile);
            moved = true;
          }
        }
      }
    });
  });

  // Clear merged flags
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y]) {
        this.cells[x][y].mergedFrom = null;
      }
    }
  }

  return { moved: moved, score: score, won: won };
};

Grid.prototype.isWin = function () {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y] && this.cells[x][y].value >= 2048) {
        return true;
      }
    }
  }
  return false;
};

Grid.prototype.maxValue = function () {
  var max = 0;
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y]) {
        max = Math.max(max, this.cells[x][y].value);
      }
    }
  }
  return Math.log(max) / Math.log(2);
};

// Smoothness heuristic
Grid.prototype.smoothness = function () {
  var smoothness = 0;
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y]) {
        var value = Math.log(this.cells[x][y].value) / Math.log(2);
        for (var direction = 1; direction <= 2; direction++) {
          var vector = this.getVector(direction);
          var targetCell = this.findFarthestPosition(
            { x: x, y: y },
            vector
          ).next;
          if (this.cellContent(targetCell)) {
            var targetValue =
              Math.log(this.cellContent(targetCell).value) / Math.log(2);
            smoothness -= Math.abs(value - targetValue);
          }
        }
      }
    }
  }
  return smoothness;
};

// Monotonicity heuristic
Grid.prototype.monotonicity2 = function () {
  var totals = [0, 0, 0, 0];
  // up/down
  for (var x = 0; x < this.size; x++) {
    var current = 0;
    var next = current + 1;
    while (next < this.size) {
      while (next < this.size && !this.cells[x][next]) next++;
      if (next >= this.size) next--;
      var currentValue = this.cells[x][current]
        ? Math.log(this.cells[x][current].value) / Math.log(2)
        : 0;
      var nextValue = this.cells[x][next]
        ? Math.log(this.cells[x][next].value) / Math.log(2)
        : 0;
      if (currentValue > nextValue) {
        totals[0] += nextValue - currentValue;
      } else if (nextValue > currentValue) {
        totals[1] += currentValue - nextValue;
      }
      current = next;
      next++;
    }
  }
  // left/right
  for (var y = 0; y < this.size; y++) {
    var current = 0;
    var next = current + 1;
    while (next < this.size) {
      while (next < this.size && !this.cells[next][y]) next++;
      if (next >= this.size) next--;
      var currentValue = this.cells[current][y]
        ? Math.log(this.cells[current][y].value) / Math.log(2)
        : 0;
      var nextValue = this.cells[next][y]
        ? Math.log(this.cells[next][y].value) / Math.log(2)
        : 0;
      if (currentValue > nextValue) {
        totals[2] += nextValue - currentValue;
      } else if (nextValue > currentValue) {
        totals[3] += currentValue - nextValue;
      }
      current = next;
      next++;
    }
  }
  return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3]);
};

// Islands heuristic
Grid.prototype.islands = function () {
  var self = this;
  var mark = [];
  for (var x = 0; x < this.size; x++) {
    mark[x] = [];
    for (var y = 0; y < this.size; y++) {
      mark[x][y] = false;
    }
  }
  var islands = 0;

  function markIsland(x, y, value) {
    if (x < 0 || x >= self.size || y < 0 || y >= self.size) return;
    if (mark[x][y]) return;
    if (self.cells[x][y] && self.cells[x][y].value !== value) return;
    if (!self.cells[x][y]) return;
    mark[x][y] = true;
    markIsland(x - 1, y, value);
    markIsland(x + 1, y, value);
    markIsland(x, y - 1, value);
    markIsland(x, y + 1, value);
  }

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y] && !mark[x][y]) {
        islands++;
        markIsland(x, y, this.cells[x][y].value);
      }
    }
  }
  return islands;
};

// AI class
function AI(grid) {
  this.grid = grid;
}

AI.prototype.eval = function () {
  var emptyCells = this.grid.availableCells().length;
  var smoothWeight = 0.1;
  var mono2Weight = 1.0;
  var emptyWeight = 2.7;
  var maxWeight = 1.0;

  return (
    this.grid.smoothness() * smoothWeight +
    this.grid.monotonicity2() * mono2Weight +
    Math.log(emptyCells) * emptyWeight +
    this.grid.maxValue() * maxWeight
  );
};

AI.prototype.search = function (depth, alpha, beta, positions, cutoffs) {
  var bestScore;
  var bestMove = -1;
  var result;

  if (this.grid.playerTurn) {
    bestScore = alpha;
    for (var direction = 0; direction < 4; direction++) {
      var newGrid = this.grid.clone();
      if (newGrid.move(direction).moved) {
        positions++;
        if (newGrid.isWin()) {
          return {
            move: direction,
            score: 10000,
            positions: positions,
            cutoffs: cutoffs,
          };
        }
        var newAI = new AI(newGrid);
        if (depth === 0) {
          result = { move: direction, score: newAI.eval() };
        } else {
          result = newAI.search(depth - 1, bestScore, beta, positions, cutoffs);
          if (result.score > 9900) {
            result.score--;
          }
          positions = result.positions;
          cutoffs = result.cutoffs;
        }
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = direction;
        }
        if (bestScore > beta) {
          cutoffs++;
          return {
            move: bestMove,
            score: beta,
            positions: positions,
            cutoffs: cutoffs,
          };
        }
      }
    }
  } else {
    bestScore = beta;
    var candidates = [];
    var cells = this.grid.availableCells();
    var scores = { 2: [], 4: [] };

    for (var value in scores) {
      for (var i = 0; i < cells.length; i++) {
        scores[value].push(null);
        var cell = cells[i];
        var tile = new Tile(cell, parseInt(value, 10));
        this.grid.insertTile(tile);
        scores[value][i] = -this.grid.smoothness() + this.grid.islands();
        this.grid.removeTile(cell);
      }
    }

    var maxScore = Math.max(
      Math.max.apply(null, scores[2]),
      Math.max.apply(null, scores[4])
    );
    for (var value in scores) {
      for (var i = 0; i < scores[value].length; i++) {
        if (scores[value][i] === maxScore) {
          candidates.push({ position: cells[i], value: parseInt(value, 10) });
        }
      }
    }

    for (var i = 0; i < candidates.length; i++) {
      var position = candidates[i].position;
      var value = candidates[i].value;
      var newGrid = this.grid.clone();
      var tile = new Tile(position, value);
      newGrid.insertTile(tile);
      newGrid.playerTurn = true;
      positions++;
      var newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;
      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        cutoffs++;
        return {
          move: null,
          score: alpha,
          positions: positions,
          cutoffs: cutoffs,
        };
      }
    }
  }
  return {
    move: bestMove,
    score: bestScore,
    positions: positions,
    cutoffs: cutoffs,
  };
};

AI.prototype.getBest = function () {
  return this.iterativeDeep();
};

AI.prototype.iterativeDeep = function () {
  var start = Date.now();
  var depth = 0;
  var best;
  do {
    var newBest = this.search(depth, -10000, 10000, 0, 0);
    if (newBest.move === -1) {
      break;
    } else {
      best = newBest;
    }
    depth++;
  } while (Date.now() - start < minSearchTime);
  return best;
};

// Worker message handler
self.onmessage = function (e) {
  var gridState = e.data;
  var grid = new Grid(4, gridState);
  grid.playerTurn = true;
  var ai = new AI(grid);
  var result = ai.getBest();
  self.postMessage({ move: result.move, score: result.score });
};
