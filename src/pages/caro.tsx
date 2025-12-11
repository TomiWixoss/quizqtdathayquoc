import { Page, useNavigate } from "zmp-ui";
import { ArrowLeft, RotateCcw, Trophy, Gem } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState, useEffect, useRef, useCallback } from "react";

const BOARD_SIZE = 15;
const WIN_LENGTH = 5;

type CellValue = 0 | 1 | -1;
type GameStatus = "playing" | "won" | "lost" | "draw";
type Difficulty =
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "master"
  | "legend"
  | "ultimate";

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    depth: number;
    reward: number;
    label: string;
    worker: string;
    time?: number;
    desc: string;
  }
> = {
  easy: {
    depth: 4,
    reward: 5,
    label: "Dễ",
    worker: "/AI/caro-ai-worker-v2.js",
    desc: "AI suy nghĩ nông",
  },
  medium: {
    depth: 6,
    reward: 10,
    label: "Trung bình",
    worker: "/AI/caro-ai-worker-v2.js",
    desc: "AI cân bằng",
  },
  hard: {
    depth: 8,
    reward: 20,
    label: "Khó",
    worker: "/AI/caro-ai-worker.js",
    time: 3000,
    desc: "AI suy nghĩ sâu",
  },
  expert: {
    depth: 0,
    reward: 50,
    label: "Siêu khó",
    worker: "/AI/caro-ai-worker-v3.js",
    time: 5000,
    desc: "AI không giới hạn",
  },
  master: {
    depth: 6,
    reward: 100,
    label: "Bậc thầy",
    worker: "/AI/caro-ai-worker-v4.js",
    desc: "NegaScout - AI mạnh",
  },
  legend: {
    depth: 0,
    reward: 200,
    label: "Huyền thoại",
    worker: "/AI/caro-ai-worker-v5.js",
    time: 8000,
    desc: "NegaScout + Iterative",
  },
  ultimate: {
    depth: 0,
    reward: 500,
    label: "Tối thượng",
    worker: "/AI/caro-ai-ultimate.js",
    time: 3000,
    desc: "Siêu phàm - Killer Moves + History",
  },
};

function CaroPage() {
  const navigate = useNavigate();
  const { user, addGems, updateMinigameStats } = useUserStore();
  const [board, setBoard] = useState<CellValue[][]>(() => createEmptyBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameStarted, setGameStarted] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  function createEmptyBoard(): CellValue[][] {
    return Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(0));
  }

  const config = DIFFICULTY_CONFIG[difficulty];

  useEffect(() => {
    if (!gameStarted) return;
    workerRef.current?.terminate();
    workerRef.current = new Worker(config.worker);
    workerRef.current.onmessage = (e) => {
      const { bestmove } = e.data;
      if (bestmove && gameStatus === "playing") {
        makeMove(bestmove.i, bestmove.j, -1);
        setIsThinking(false);
        setIsPlayerTurn(true);
      }
    };
    return () => workerRef.current?.terminate();
  }, [gameStarted, difficulty]);

  const checkWin = useCallback(
    (
      b: CellValue[][],
      row: number,
      col: number,
      player: CellValue
    ): [number, number][] | null => {
      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ];
      for (const [dr, dc] of directions) {
        const cells: [number, number][] = [[row, col]];
        for (let i = 1; i < WIN_LENGTH; i++) {
          const r = row + dr * i,
            c = col + dc * i;
          if (
            r >= 0 &&
            r < BOARD_SIZE &&
            c >= 0 &&
            c < BOARD_SIZE &&
            b[r][c] === player
          ) {
            cells.push([r, c]);
          } else break;
        }
        for (let i = 1; i < WIN_LENGTH; i++) {
          const r = row - dr * i,
            c = col - dc * i;
          if (
            r >= 0 &&
            r < BOARD_SIZE &&
            c >= 0 &&
            c < BOARD_SIZE &&
            b[r][c] === player
          ) {
            cells.push([r, c]);
          } else break;
        }
        if (cells.length >= WIN_LENGTH) return cells;
      }
      return null;
    },
    []
  );

  const makeMove = useCallback(
    (row: number, col: number, player: CellValue) => {
      setBoard((prev) => {
        const newBoard = prev.map((r) => [...r]);
        newBoard[row][col] = player;
        const winning = checkWin(newBoard, row, col, player);
        if (winning) {
          setWinningCells(winning);
          const won = player === 1;
          setGameStatus(won ? "won" : "lost");
          if (won) {
            addGems(config.reward);
            updateMinigameStats("caro", true, config.reward, { difficulty });
          } else {
            updateMinigameStats("caro", false, 0, { difficulty });
          }
        }
        return newBoard;
      });
    },
    [checkWin, addGems, config.reward, updateMinigameStats, difficulty]
  );

  const handleCellClick = (row: number, col: number) => {
    if (
      !isPlayerTurn ||
      board[row][col] !== 0 ||
      gameStatus !== "playing" ||
      isThinking
    )
      return;
    makeMove(row, col, 1);
    setIsPlayerTurn(false);
    setTimeout(() => {
      setIsThinking(true);
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = 1;
      const param = config.time ?? config.depth;
      workerRef.current?.postMessage([newBoard, -1, param]);
    }, 100);
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setIsPlayerTurn(true);
    setGameStatus("playing");
    setWinningCells([]);
    setIsThinking(false);
    setGameStarted(false);
  };

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameStarted(true);
  };

  const isWinningCell = (row: number, col: number) =>
    winningCells.some(([r, c]) => r === row && c === col);

  if (!gameStarted) {
    return (
      <Page className="bg-background min-h-screen">
        <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shop")}
              className="btn-back-3d w-10 h-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="font-bold text-xl text-white">Caro vs AI</h1>
          </div>
        </div>
        <div className="p-4 pb-28 space-y-3">
          <div className="card-3d p-4 text-center">
            <h2 className="font-bold text-lg text-[var(--foreground)] mb-2">
              Chọn độ khó
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Độ khó cao hơn = phần thưởng nhiều hơn
            </p>
          </div>
          {(
            [
              "easy",
              "medium",
              "hard",
              "expert",
              "master",
              "legend",
              "ultimate",
            ] as Difficulty[]
          ).map((diff) => {
            const cfg = DIFFICULTY_CONFIG[diff];
            const colors: Record<
              Difficulty,
              { bg: string; border: string; text: string }
            > = {
              easy: {
                bg: "bg-[var(--duo-green)]/10",
                border: "border-[var(--duo-green)]/30",
                text: "text-[var(--duo-green)]",
              },
              medium: {
                bg: "bg-[var(--duo-blue)]/10",
                border: "border-[var(--duo-blue)]/30",
                text: "text-[var(--duo-blue)]",
              },
              hard: {
                bg: "bg-[var(--duo-orange)]/10",
                border: "border-[var(--duo-orange)]/30",
                text: "text-[var(--duo-orange)]",
              },
              expert: {
                bg: "bg-[var(--duo-red)]/10",
                border: "border-[var(--duo-red)]/30",
                text: "text-[var(--duo-red)]",
              },
              master: {
                bg: "bg-[var(--duo-purple)]/10",
                border: "border-[var(--duo-purple)]/30",
                text: "text-[var(--duo-purple)]",
              },
              legend: {
                bg: "bg-gradient-to-r from-[var(--duo-yellow)]/20 to-[var(--duo-orange)]/20",
                border: "border-[var(--duo-yellow)]/50",
                text: "text-[var(--duo-yellow)]",
              },
              ultimate: {
                bg: "bg-gradient-to-r from-[var(--duo-purple)]/20 via-[var(--duo-red)]/20 to-[var(--duo-orange)]/20",
                border: "border-[var(--duo-red)]/50",
                text: "text-[var(--duo-red)]",
              },
            };
            const style = colors[diff];
            return (
              <button
                key={diff}
                onClick={() => startGame(diff)}
                className={`card-3d p-4 w-full flex items-center justify-between border-l-4 ${style.border}`}
              >
                <div className="text-left">
                  <p className={`font-bold ${style.text}`}>{cfg.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {cfg.desc}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 ${style.bg} px-3 py-1.5 rounded-full`}
                >
                  <span className={`font-bold ${style.text}`}>
                    +{cfg.reward}
                  </span>
                  <img src="/AppAssets/BlueDiamond.png" alt="gem" className="w-4 h-4" />
                </div>
              </button>
            );
          })}
          {/* Caro Stats */}
          {user?.minigameStats?.caro && (
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3">
                Thống kê của bạn
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {user.minigameStats.caro.gamesPlayed}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Đã chơi
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-[var(--duo-green)]">
                    {user.minigameStats.caro.wins}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Thắng
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-[var(--duo-red)]">
                    {user.minigameStats.caro.losses}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Thua
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-[var(--duo-blue)]">
                    {user.minigameStats.caro.totalGemsEarned}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Gems
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Page>
    );
  }

  return (
    <Page className="bg-background min-h-screen">
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={resetGame}
              className="btn-back-3d w-10 h-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="font-bold text-xl text-white">
                Caro - {config.label}
              </h1>
              <p className="text-white/80 text-xs">
                Thắng để nhận {config.reward} gems
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
            <img src="/AppAssets/BlueDiamond.png" alt="gem" className="w-5 h-5" />
            <span className="font-bold text-white">{user?.gems ?? 0}</span>
          </div>
        </div>
      </div>

      {gameStatus !== "playing" && (
        <div
          className="mx-4 mt-4 p-4 rounded-2xl text-center"
          style={{
            background:
              gameStatus === "won"
                ? "var(--duo-green)"
                : gameStatus === "lost"
                ? "var(--duo-red)"
                : "var(--duo-yellow)",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {gameStatus === "won" && <Trophy className="w-6 h-6 text-white" />}
            <span className="font-bold text-lg text-white">
              {gameStatus === "won"
                ? "Chiến thắng!"
                : gameStatus === "lost"
                ? "Thua cuộc!"
                : "Hòa!"}
            </span>
          </div>
          {gameStatus === "won" && (
            <div className="flex items-center justify-center gap-1 text-white/90">
              <span>+{config.reward}</span>
              <Gem className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      {gameStatus === "playing" && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-[var(--card)] text-center">
          <span className="text-[var(--foreground)]">
            {isThinking
              ? "AI đang suy nghĩ..."
              : isPlayerTurn
              ? "Lượt của bạn (X)"
              : "Đợi AI..."}
          </span>
        </div>
      )}

      <div className="p-4 flex justify-center">
        <div className="inline-block bg-[var(--card)] p-2 rounded-xl shadow-lg overflow-auto max-w-full">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              width: `${BOARD_SIZE * 24}px`,
            }}
          >
            {board.map((row, i) =>
              row.map((cell, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => handleCellClick(i, j)}
                  disabled={
                    cell !== 0 ||
                    gameStatus !== "playing" ||
                    !isPlayerTurn ||
                    isThinking
                  }
                  className={`w-6 h-6 border border-[var(--border)] flex items-center justify-center text-sm font-bold transition-all
                    ${
                      cell === 0 && gameStatus === "playing" && isPlayerTurn
                        ? "hover:bg-[var(--duo-blue)]/20 cursor-pointer"
                        : ""
                    }
                    ${
                      isWinningCell(i, j)
                        ? "bg-[var(--duo-green)]/30 animate-pulse"
                        : ""
                    }
                  `}
                >
                  {cell === 1 && (
                    <span className="text-[var(--duo-blue)]">X</span>
                  )}
                  {cell === -1 && (
                    <span className="text-[var(--duo-red)]">O</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        <button
          onClick={resetGame}
          className="btn-3d btn-3d-blue w-full py-3 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Chơi lại</span>
        </button>
      </div>
    </Page>
  );
}

export default CaroPage;
