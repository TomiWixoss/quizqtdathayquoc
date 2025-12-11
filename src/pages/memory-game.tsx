import { Page, useNavigate } from "zmp-ui";
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Gem,
  Clock,
  Star,
  Zap,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

type Difficulty = "easy" | "medium" | "hard";
type GameStatus = "menu" | "playing" | "won" | "lost";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = [
  "🎯",
  "🔥",
  "⚡",
  "💎",
  "🌟",
  "🎁",
  "🏆",
  "🎮",
  "📚",
  "🎨",
  "🚀",
  "💡",
];

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { pairs: number; time: number; reward: number; label: string; desc: string }
> = {
  easy: {
    pairs: 6,
    time: 60,
    reward: 10,
    label: "Dễ",
    desc: "6 cặp - 60 giây",
  },
  medium: {
    pairs: 8,
    time: 90,
    reward: 25,
    label: "Trung bình",
    desc: "8 cặp - 90 giây",
  },
  hard: {
    pairs: 12,
    time: 120,
    reward: 50,
    label: "Khó",
    desc: "12 cặp - 120 giây",
  },
};

function MemoryGamePage() {
  const navigate = useNavigate();
  const { user, addGems, updateMinigameStats } = useUserStore();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameStatus, setGameStatus] = useState<GameStatus>("menu");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];

  const initGame = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    const selectedEmojis = EMOJIS.slice(0, cfg.pairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];

    // Shuffle cards
    const shuffled = cardPairs
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeLeft(cfg.time);
    setGameStatus("playing");
    setDifficulty(diff);
  }, []);

  // Timer
  useEffect(() => {
    if (gameStatus !== "playing" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameStatus("lost");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, timeLeft]);

  // Check win condition
  useEffect(() => {
    if (gameStatus === "playing" && matchedPairs === config.pairs) {
      setGameStatus("won");
      handleWin();
    }
  }, [matchedPairs, config.pairs, gameStatus]);

  const handleWin = async () => {
    // Calculate bonus based on time left and moves
    const timeBonus = Math.floor(timeLeft / 10);
    const moveBonus = Math.max(0, config.pairs * 2 - moves);
    const totalReward = config.reward + timeBonus + moveBonus;

    await addGems(totalReward);
    await updateMinigameStats("memory", true, totalReward);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#58cc02", "#ffc800", "#1cb0f6", "#ce82ff"],
    });
  };

  const handleCardClick = (cardId: number) => {
    if (isProcessing || gameStatus !== "playing") return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedCards.length >= 2) return;

    // Flip card
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      setIsProcessing(true);

      const [first, second] = newFlipped;
      const firstCard = cards.find((c) => c.id === first);
      const secondCard = cards.find((c) => c.id === second);

      if (firstCard?.emoji === secondCard?.emoji) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, isMatched: true } : c
            )
          );
          setMatchedPairs((prev) => prev + 1);
          setFlippedCards([]);
          setIsProcessing(false);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setGameStatus("menu");
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
  };

  // Menu screen
  if (gameStatus === "menu") {
    return (
      <Page className="bg-background min-h-screen">
        <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-pink)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/shop")}
              className="btn-back-3d w-10 h-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="font-bold text-xl text-white">Trò chơi trí nhớ</h1>
              <p className="text-white/80 text-xs">
                Lật thẻ tìm cặp giống nhau
              </p>
            </div>
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

          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
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
                bg: "bg-[var(--duo-purple)]/10",
                border: "border-[var(--duo-purple)]/30",
                text: "text-[var(--duo-purple)]",
              },
            };
            const style = colors[diff];

            return (
              <button
                key={diff}
                onClick={() => initGame(diff)}
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
                  <img
                    src="/AppAssets/BlueDiamond.png"
                    alt="gem"
                    className="w-4 h-4"
                  />
                </div>
              </button>
            );
          })}

          {/* Stats */}
          {user?.minigameStats?.memory && (
            <div className="card-3d p-4">
              <h3 className="font-bold text-foreground mb-3">
                Thống kê của bạn
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-[var(--duo-green)]">
                    {user.minigameStats.memory.wins}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Thắng
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {user.minigameStats.memory.gamesPlayed}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Đã chơi
                  </p>
                </div>
                <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-[var(--duo-blue)]">
                    {user.minigameStats.memory.totalGemsEarned}
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

  // Game screen
  const gridCols = config.pairs <= 6 ? 3 : config.pairs <= 8 ? 4 : 4;

  return (
    <Page className="bg-background min-h-screen">
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-pink)]">
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
                Memory - {config.label}
              </h1>
              <p className="text-white/80 text-xs">
                Tìm {config.pairs} cặp thẻ
              </p>
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

      {/* Game info */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock
                className={`w-5 h-5 ${
                  timeLeft <= 10
                    ? "text-[var(--duo-red)]"
                    : "text-[var(--duo-blue)]"
                }`}
              />
              <span
                className={`font-bold ${
                  timeLeft <= 10 ? "text-[var(--duo-red)]" : "text-foreground"
                }`}
              >
                {timeLeft}s
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-5 h-5 text-[var(--duo-yellow)]" />
              <span className="font-bold text-foreground">{moves} lượt</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-[var(--duo-green)]" />
            <span className="font-bold text-[var(--duo-green)]">
              {matchedPairs}/{config.pairs}
            </span>
          </div>
        </div>
      </div>

      {/* Result overlay */}
      {(gameStatus === "won" || gameStatus === "lost") && (
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
              {gameStatus === "won" ? "Chiến thắng!" : "Hết giờ!"}
            </span>
          </div>
          {gameStatus === "won" && (
            <div className="flex items-center justify-center gap-1 text-white/90">
              <span>
                +
                {config.reward +
                  Math.floor(timeLeft / 10) +
                  Math.max(0, config.pairs * 2 - moves)}
              </span>
              <Gem className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      {/* Cards grid */}
      <div className="px-4 flex justify-center">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            maxWidth: "320px",
          }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={
                card.isFlipped || card.isMatched || gameStatus !== "playing"
              }
              className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all duration-300 transform
                ${
                  card.isFlipped || card.isMatched
                    ? "bg-[var(--duo-blue)] rotate-0"
                    : "bg-[var(--card)] border-2 border-[var(--border)] hover:border-[var(--duo-blue)]"
                }
                ${card.isMatched ? "opacity-50 scale-95" : ""}
              `}
              style={{ minHeight: "60px" }}
            >
              {card.isFlipped || card.isMatched ? card.emoji : "❓"}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-6">
        <button
          onClick={resetGame}
          className="btn-3d btn-3d-blue w-full py-3 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{gameStatus === "playing" ? "Chơi lại" : "Quay về"}</span>
        </button>
      </div>
    </Page>
  );
}

export default MemoryGamePage;
