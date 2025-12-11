import { Page, useNavigate } from "zmp-ui";
import { ArrowLeft, RotateCcw, Trophy, Gem, Bot, Pause } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { create2048Worker } from "@/lib/inline-workers";

type GameStatus = "playing" | "won" | "lost";
type Cell = {
  value: number;
  id: number;
  merged?: boolean;
  isNew?: boolean;
} | null;

const GRID_SIZE = 4;
const WIN_VALUE = 2048;

// AI cost settings
const AI_COST_PER_INTERVAL = 1; // Gem cost per interval
const AI_COST_INTERVAL = 5000; // Charge every 5 seconds

// Rewards based on max tile achieved
const REWARDS: Record<number, number> = {
  128: 5,
  256: 10,
  512: 25,
  1024: 50,
  2048: 100,
  4096: 200,
  8192: 500,
};

// Tile colors
const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: "#eee4da", text: "#776e65" },
  4: { bg: "#ede0c8", text: "#776e65" },
  8: { bg: "#f2b179", text: "#f9f6f2" },
  16: { bg: "#f59563", text: "#f9f6f2" },
  32: { bg: "#f67c5f", text: "#f9f6f2" },
  64: { bg: "#f65e3b", text: "#f9f6f2" },
  128: { bg: "#edcf72", text: "#f9f6f2" },
  256: { bg: "#edcc61", text: "#f9f6f2" },
  512: { bg: "#edc850", text: "#f9f6f2" },
  1024: { bg: "#edc53f", text: "#f9f6f2" },
  2048: { bg: "#edc22e", text: "#f9f6f2" },
  4096: { bg: "#3c3a32", text: "#f9f6f2" },
  8192: { bg: "#3c3a32", text: "#f9f6f2" },
};

let cellIdCounter = 0;

function Game2048Page() {
  const navigate = useNavigate();
  const { user, addGems, updateMinigameStats } = useUserStore();
  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [maxTile, setMaxTile] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [aiGemsSpent, setAiGemsSpent] = useState(0);
  const [aiUsedThisGame, setAiUsedThisGame] = useState(false); // Track if AI was ever used
  const workerRef = useRef<Worker | null>(null);
  const aiIntervalRef = useRef<number | null>(null);
  const aiCostIntervalRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function createEmptyGrid(): Cell[][] {
    return Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));
  }

  const addRandomTile = useCallback((currentGrid: Cell[][]): Cell[][] => {
    const emptyCells: { row: number; col: number }[] = [];
    currentGrid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell) emptyCells.push({ row: rowIndex, col: colIndex });
      });
    });

    if (emptyCells.length === 0) return currentGrid;

    const { row, col } =
      emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = currentGrid.map((r) => [...r]);
    newGrid[row][col] = {
      value: Math.random() < 0.9 ? 2 : 4,
      id: ++cellIdCounter,
      isNew: true,
    };
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameStatus("playing");
    setMaxTile(0);
    setRewardClaimed(false);
    setIsAIPlaying(false);
    setAiGemsSpent(0);
    setAiUsedThisGame(false);
    if (aiIntervalRef.current) {
      clearInterval(aiIntervalRef.current);
      aiIntervalRef.current = null;
    }
    if (aiCostIntervalRef.current) {
      clearInterval(aiCostIntervalRef.current);
      aiCostIntervalRef.current = null;
    }
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
    // Load best score from localStorage
    const saved = localStorage.getItem("2048-best-score");
    if (saved) setBestScore(parseInt(saved, 10));

    // Initialize AI worker - sử dụng inline worker để tránh CORS
    workerRef.current = create2048Worker();
    workerRef.current.onmessage = (e) => {
      const { move } = e.data;
      if (move !== -1 && move !== undefined) {
        handleMove(move);
      }
    };
    workerRef.current.onerror = (err) => {
      console.error("2048 AI Worker error:", err);
      setIsAIPlaying(false);
    };

    return () => {
      workerRef.current?.terminate();
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
      if (aiCostIntervalRef.current) clearInterval(aiCostIntervalRef.current);
    };
  }, []);

  const slide = (row: Cell[]): { newRow: Cell[]; scoreGain: number } => {
    let scoreGain = 0;
    // Filter out nulls
    let arr = row.filter((cell) => cell !== null) as NonNullable<Cell>[];

    // Merge
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i].value === arr[i + 1].value) {
        arr[i] = {
          value: arr[i].value * 2,
          id: ++cellIdCounter,
          merged: true,
        };
        scoreGain += arr[i].value;
        arr.splice(i + 1, 1);
      }
    }

    // Pad with nulls
    while (arr.length < GRID_SIZE) {
      arr.push(null as unknown as NonNullable<Cell>);
    }

    return { newRow: arr as Cell[], scoreGain };
  };

  const rotateGrid = (g: Cell[][], times: number): Cell[][] => {
    let result = g.map((row) => [...row]);
    for (let t = 0; t < times; t++) {
      const rotated: Cell[][] = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        rotated.push([]);
        for (let j = 0; j < GRID_SIZE; j++) {
          rotated[i][j] = result[GRID_SIZE - 1 - j][i];
        }
      }
      result = rotated;
    }
    return result;
  };

  const move = useCallback(
    (
      direction: number,
      currentGrid: Cell[][]
    ): { newGrid: Cell[][]; scoreGain: number; moved: boolean } => {
      // 0: up, 1: right, 2: down, 3: left
      let rotated = rotateGrid(currentGrid, direction);
      let totalScore = 0;
      let moved = false;

      const newRotated = rotated.map((row) => {
        const { newRow, scoreGain } = slide(row);
        totalScore += scoreGain;
        if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
        return newRow;
      });

      const newGrid = rotateGrid(newRotated, (4 - direction) % 4);
      return { newGrid, scoreGain: totalScore, moved };
    },
    []
  );

  const checkGameOver = useCallback((g: Cell[][]): boolean => {
    // Check for empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!g[i][j]) return false;
      }
    }
    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const val = g[i][j]?.value;
        if (i < GRID_SIZE - 1 && g[i + 1][j]?.value === val) return false;
        if (j < GRID_SIZE - 1 && g[i][j + 1]?.value === val) return false;
      }
    }
    return true;
  }, []);

  const getMaxTile = useCallback((g: Cell[][]): number => {
    let max = 0;
    g.forEach((row) => {
      row.forEach((cell) => {
        if (cell && cell.value > max) max = cell.value;
      });
    });
    return max;
  }, []);

  const handleMove = useCallback(
    (direction: number) => {
      if (gameStatus !== "playing") return;

      setGrid((currentGrid) => {
        // Clear animation flags
        const cleanGrid = currentGrid.map((row) =>
          row.map((cell) =>
            cell ? { ...cell, merged: false, isNew: false } : null
          )
        );

        const { newGrid, scoreGain, moved } = move(direction, cleanGrid);

        if (!moved) return currentGrid;

        const gridWithNew = addRandomTile(newGrid);
        const newMaxTile = getMaxTile(gridWithNew);

        setScore((prev) => {
          const newScore = prev + scoreGain;
          if (newScore > bestScore) {
            setBestScore(newScore);
            localStorage.setItem("2048-best-score", newScore.toString());
          }
          return newScore;
        });

        setMaxTile(newMaxTile);

        // Check win
        if (newMaxTile >= WIN_VALUE && !rewardClaimed) {
          setGameStatus("won");
          handleWin(newMaxTile);
        }

        // Check game over
        if (checkGameOver(gridWithNew)) {
          setGameStatus("lost");
          handleGameOver(newMaxTile);
        }

        return gridWithNew;
      });
    },
    [
      gameStatus,
      move,
      addRandomTile,
      getMaxTile,
      checkGameOver,
      bestScore,
      rewardClaimed,
    ]
  );

  const handleWin = async (tile: number) => {
    // No reward if AI was used
    if (aiUsedThisGame) {
      setRewardClaimed(true); // Mark as claimed to prevent future rewards
      await updateMinigameStats("game2048", true, 0, {
        maxTile: tile,
        aiUsed: true,
      });
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#888", "#aaa", "#ccc"], // Gray confetti for AI win
      });
      return;
    }

    const reward = REWARDS[tile] || 0;
    if (reward > 0) {
      await addGems(reward);
      setRewardClaimed(true);
    }
    await updateMinigameStats("game2048", true, reward, { maxTile: tile });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#edc22e", "#f2b179", "#f59563"],
    });
  };

  const handleGameOver = async (tile: number) => {
    // No reward if AI was used
    if (aiUsedThisGame) {
      setRewardClaimed(true);
      await updateMinigameStats("game2048", false, 0, {
        maxTile: tile,
        aiUsed: true,
      });
      return;
    }

    // Give partial reward based on max tile
    let reward = 0;
    for (const [tileVal, gems] of Object.entries(REWARDS)) {
      if (tile >= parseInt(tileVal) && !rewardClaimed) {
        reward = gems;
      }
    }
    if (reward > 0 && !rewardClaimed) {
      await addGems(reward);
      setRewardClaimed(true);
    }
    await updateMinigameStats("game2048", false, reward, { maxTile: tile });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAIPlaying) return;
      const keyMap: Record<string, number> = {
        ArrowUp: 0,
        ArrowRight: 1,
        ArrowDown: 2,
        ArrowLeft: 3,
      };
      if (keyMap[e.key] !== undefined) {
        e.preventDefault();
        handleMove(keyMap[e.key]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove, isAIPlaying]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAIPlaying) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isAIPlaying || !touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipe) {
        handleMove(deltaX > 0 ? 1 : 3);
      }
    } else {
      if (Math.abs(deltaY) > minSwipe) {
        handleMove(deltaY > 0 ? 2 : 0);
      }
    }
    touchStartRef.current = null;
  };

  // AI Auto-play with gem cost
  const stopAI = useCallback(() => {
    setIsAIPlaying(false);
    if (aiIntervalRef.current) {
      clearInterval(aiIntervalRef.current);
      aiIntervalRef.current = null;
    }
    if (aiCostIntervalRef.current) {
      clearInterval(aiCostIntervalRef.current);
      aiCostIntervalRef.current = null;
    }
  }, []);

  const toggleAI = () => {
    if (isAIPlaying) {
      stopAI();
    } else {
      // Check if user has enough gems
      if ((user?.gems ?? 0) < AI_COST_PER_INTERVAL) {
        alert("Không đủ gem để sử dụng AI!");
        return;
      }
      setIsAIPlaying(true);
      setAiUsedThisGame(true); // Mark AI as used - no rewards for this game
      runAI();
      startAICostTimer();
    }
  };

  const startAICostTimer = () => {
    if (aiCostIntervalRef.current) clearInterval(aiCostIntervalRef.current);
    aiCostIntervalRef.current = window.setInterval(async () => {
      if ((user?.gems ?? 0) >= AI_COST_PER_INTERVAL) {
        await addGems(-AI_COST_PER_INTERVAL);
        setAiGemsSpent((prev) => prev + AI_COST_PER_INTERVAL);
      } else {
        // Not enough gems, stop AI
        stopAI();
      }
    }, AI_COST_INTERVAL);
  };

  const runAI = () => {
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    aiIntervalRef.current = window.setInterval(() => {
      if (gameStatus !== "playing") {
        setIsAIPlaying(false);
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
        return;
      }
      // Convert grid to worker format
      const gridState = grid.map((row) =>
        row.map((cell) => (cell ? { value: cell.value } : null))
      );
      workerRef.current?.postMessage(gridState);
    }, 150);
  };

  useEffect(() => {
    if (isAIPlaying && gameStatus === "playing") {
      runAI();
    }
    // Stop AI when game ends
    if (gameStatus !== "playing" && isAIPlaying) {
      stopAI();
    }
  }, [isAIPlaying, grid, gameStatus, stopAI]);

  const continueAfterWin = () => {
    setGameStatus("playing");
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[#edc22e] to-[#f2b179]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shop")}
              className="btn-back-3d w-10 h-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="font-bold text-xl text-white">2048</h1>
              <p className="text-white/80 text-xs">Gộp số để đạt 2048!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
            <img
              src="/AppAssets/BlueDiamond.png"
              alt="gem"
              className="w-5 h-5"
            />
            <span className="font-bold text-white">{user?.gems ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex gap-3">
          <div className="bg-[var(--card)] rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">Điểm</p>
            <p className="text-xl font-bold text-foreground">{score}</p>
          </div>
          <div className="bg-[var(--card)] rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">Cao nhất</p>
            <p className="text-xl font-bold text-[var(--duo-yellow)]">
              {bestScore}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={toggleAI}
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isAIPlaying
                  ? "bg-[var(--duo-red)] text-white"
                  : "bg-[var(--card)] text-foreground"
              }`}
              title={`AI: ${AI_COST_PER_INTERVAL} gem/${
                AI_COST_INTERVAL / 1000
              }s`}
            >
              {isAIPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </button>
            {isAIPlaying && (
              <span className="absolute -top-1 -right-1 bg-[var(--duo-red)] text-white text-[10px] px-1 rounded-full">
                -{aiGemsSpent}💎
              </span>
            )}
          </div>
          <button
            onClick={initGame}
            className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Game Status Overlay */}
      {gameStatus !== "playing" && (
        <div
          className="mx-4 mb-4 p-4 rounded-2xl text-center"
          style={{
            background:
              gameStatus === "won" ? "var(--duo-green)" : "var(--duo-red)",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {gameStatus === "won" && <Trophy className="w-6 h-6 text-white" />}
            <span className="font-bold text-lg text-white">
              {gameStatus === "won" ? `Đạt ${maxTile}!` : "Game Over!"}
            </span>
          </div>
          {rewardClaimed && !aiUsedThisGame && (
            <div className="flex items-center justify-center gap-1 text-white/90 mb-2">
              <span>+{REWARDS[maxTile] || 0}</span>
              <Gem className="w-4 h-4" />
            </div>
          )}
          {aiUsedThisGame && (
            <div className="text-white/80 text-sm mb-2">
              🤖 Đã dùng AI - Không nhận thưởng
            </div>
          )}
          <div className="flex gap-2 justify-center">
            {gameStatus === "won" && (
              <button
                onClick={continueAfterWin}
                className="px-4 py-2 bg-white/20 rounded-xl text-white font-bold text-sm"
              >
                Tiếp tục
              </button>
            )}
            <button
              onClick={initGame}
              className="px-4 py-2 bg-white/20 rounded-xl text-white font-bold text-sm"
            >
              Chơi lại
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div
        className="px-4 flex justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="bg-[#bbada0] rounded-xl p-2 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: "min(90vw, 340px)",
            aspectRatio: "1",
          }}
        >
          {grid.flat().map((cell, index) => (
            <div
              key={index}
              className="rounded-lg flex items-center justify-center font-bold transition-all duration-100"
              style={{
                backgroundColor: cell
                  ? TILE_COLORS[cell.value]?.bg || "#3c3a32"
                  : "#cdc1b4",
                color: cell
                  ? TILE_COLORS[cell.value]?.text || "#f9f6f2"
                  : "transparent",
                fontSize:
                  cell && cell.value >= 1000
                    ? "1.2rem"
                    : cell && cell.value >= 100
                    ? "1.5rem"
                    : "1.8rem",
                transform: cell?.merged
                  ? "scale(1.1)"
                  : cell?.isNew
                  ? "scale(0.9)"
                  : "scale(1)",
              }}
            >
              {cell?.value || ""}
            </div>
          ))}
        </div>
      </div>

      {/* Controls hint */}
      <div className="px-4 py-4 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Vuốt hoặc dùng phím mũi tên để di chuyển
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          🤖 AI: {AI_COST_PER_INTERVAL} gem mỗi {AI_COST_INTERVAL / 1000} giây
        </p>
        {aiUsedThisGame && (
          <p className="text-xs text-[var(--duo-red)] mt-1 font-medium">
            ⚠️ Đã dùng AI - Ván này không nhận thưởng
          </p>
        )}
      </div>

      {/* Rewards info */}
      <div className="px-4 pb-6">
        <div className="card-3d p-4">
          <h3 className="font-bold text-foreground mb-2 text-sm">
            Phần thưởng
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(REWARDS).map(([tile, gems]) => (
              <div
                key={tile}
                className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  maxTile >= parseInt(tile)
                    ? "bg-[var(--duo-green)]/20 text-[var(--duo-green)]"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                }`}
              >
                {tile}: {gems}💎
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {user?.minigameStats?.game2048 && (
        <div className="px-4 pb-28">
          <div className="card-3d p-4">
            <h3 className="font-bold text-foreground mb-3">Thống kê của bạn</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-foreground">
                  {user.minigameStats.game2048.gamesPlayed}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Đã chơi
                </p>
              </div>
              <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-[var(--duo-yellow)]">
                  {user.minigameStats.game2048.bestTile}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Tile cao nhất
                </p>
              </div>
              <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-[var(--duo-blue)]">
                  {user.minigameStats.game2048.totalGemsEarned}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Gems
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export default Game2048Page;
