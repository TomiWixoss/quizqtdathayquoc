import { Page } from "zmp-ui";
import {
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Home,
} from "lucide-react";
import { UserRank, getRankImage } from "@/services/ai-quiz-service";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { RewardModal, RewardItem } from "@/components/ui/reward-modal";
import { useUserStore } from "@/stores/user-store";

interface Props {
  result: {
    totalScore: number;
    correct: number;
    wrong: number;
    pointsGained: number;
  };
  rank: UserRank;
  onPlayAgain: () => void;
  onGoBack: () => void;
}

export function ConquestResult({ result, rank, onPlayAgain, onGoBack }: Props) {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardItems, setRewardItems] = useState<RewardItem[]>([]);
  const { addGems } = useUserStore();

  const accuracy =
    result.correct + result.wrong > 0
      ? Math.round((result.correct / (result.correct + result.wrong)) * 100)
      : 0;

  useEffect(() => {
    const giveRewards = async () => {
      // Tạo danh sách phần thưởng
      const rewards: RewardItem[] = [];

      // Thưởng cơ bản: 10 gems mỗi câu đúng
      const baseGems = result.correct * 10;
      let bonusAmount = 0;
      let bonusLabel = "";

      // Bonus theo accuracy
      if (accuracy >= 90 && result.correct >= 3) {
        bonusAmount = 50;
        bonusLabel = "Bonus chinh chiến!";
      } else if (accuracy >= 70 && result.correct >= 3) {
        bonusAmount = 30;
        bonusLabel = "Chiến đấu tốt!";
      }

      const totalGems = baseGems + bonusAmount;

      // Thực sự cộng gems vào tài khoản
      if (totalGems > 0) {
        await addGems(totalGems);
        rewards.push({
          type: "gems",
          amount: totalGems,
          label: bonusLabel || `${result.correct} câu đúng`,
        });
      }

      // XP earned
      const xpEarned = result.correct * 10;
      if (xpEarned > 0) {
        rewards.push({ type: "xp", amount: xpEarned });
      }

      // Hiện modal nếu có phần thưởng
      if (rewards.length > 0) {
        setRewardItems(rewards);
        setShowRewardModal(true);
      }

      if (accuracy >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#58cc02", "#89e219", "#ffc800", "#ce82ff"],
        });
      }
    };

    giveRewards();
  }, [accuracy, result.correct, addGems]);

  const isWin = result.pointsGained > 0;

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title={isWin ? "Chiến thắng!" : "Hoàn thành!"}
        subtitle={`${result.pointsGained >= 0 ? "+" : ""}${
          result.pointsGained
        } RP`}
        rewards={rewardItems}
        gradientFrom={isWin ? "var(--duo-purple)" : "var(--duo-blue)"}
        gradientTo={isWin ? "#ec4899" : "var(--duo-purple)"}
      />

      <div className="pt-16 px-4 pb-28">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Kết Quả Chinh Chiến
          </h1>
        </div>

        {/* Rank Card */}
        <div
          className="card-3d p-6 text-center mb-6"
          style={{
            background:
              "linear-gradient(135deg, var(--duo-purple) 0%, #ec4899 100%)",
            border: "none",
          }}
        >
          <img
            src={getRankImage(rank)}
            alt={rank.rankName}
            className="w-24 h-24 mx-auto mb-3 object-contain"
          />
          <h2 className="text-xl font-bold text-white mb-1">{rank.rankName}</h2>
          <p className="text-white/80 mb-3">{rank.points} Rank Points</p>

          <div
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${
              result.pointsGained >= 0
                ? "bg-[var(--duo-green)]"
                : "bg-[var(--duo-red)]"
            }`}
          >
            {result.pointsGained >= 0 ? (
              <TrendingUp className="w-4 h-4 text-white" />
            ) : (
              <TrendingDown className="w-4 h-4 text-white" />
            )}
            <span className="font-bold text-white">
              {result.pointsGained >= 0 ? "+" : ""}
              {result.pointsGained} RP
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-3d p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-[var(--duo-yellow)]" />
            <p className="text-2xl font-bold text-foreground">
              {result.totalScore}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Điểm</p>
          </div>

          <div className="card-3d p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-[var(--duo-blue)]" />
            <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">Chính xác</p>
          </div>

          <div className="card-3d p-4 text-center">
            <div className="flex justify-center gap-2 mb-2">
              <span className="text-[var(--duo-green)] font-bold text-lg">
                {result.correct}
              </span>
              <span className="text-[var(--muted-foreground)]">/</span>
              <span className="text-[var(--duo-red)] font-bold text-lg">
                {result.wrong}
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Đúng/Sai</p>
          </div>
        </div>

        {/* Accuracy bar */}
        <div className="card-3d p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--muted-foreground)]">Độ chính xác</span>
            <span className="font-bold text-foreground">{accuracy}%</span>
          </div>
          <div className="progress-duo">
            <div
              className="progress-duo-fill"
              style={{
                width: `${accuracy}%`,
                background:
                  accuracy >= 80
                    ? "var(--duo-green)"
                    : accuracy >= 60
                    ? "var(--duo-yellow)"
                    : accuracy >= 40
                    ? "var(--duo-orange)"
                    : "var(--duo-red)",
              }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="btn-3d btn-3d-purple w-full py-3.5 text-base flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Chơi Lại
          </button>

          <button
            onClick={onGoBack}
            className="card-3d w-full py-3.5 text-base font-bold text-foreground flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Về Trang Chủ
          </button>
        </div>
      </div>
    </Page>
  );
}
