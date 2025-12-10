import { Page } from "zmp-ui";
import {
  Award,
  Lock,
  Target,
  Flame,
  Zap,
  Crown,
  BookOpen,
  Trophy,
  GraduationCap,
  Gem,
  Star,
  Sparkles,
  Medal,
  Coins,
  CheckCircle,
  Gift,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { ACHIEVEMENTS, Achievement } from "@/types/quiz";
import { useState } from "react";
import confetti from "canvas-confetti";

const ICON_MAP: Record<Achievement["icon"], React.ElementType> = {
  Target,
  Flame,
  Zap,
  Crown,
  BookOpen,
  Trophy,
  GraduationCap,
  Gem,
  Star,
  Sparkles,
  Medal,
  Coins,
};

// Reward gems for each achievement
const ACHIEVEMENT_REWARDS: Record<string, number> = {
  first_quiz: 10,
  streak_3: 15,
  streak_7: 30,
  streak_30: 100,
  correct_50: 25,
  correct_100: 50,
  correct_500: 150,
  perfect_5: 30,
  perfect_20: 80,
  level_5: 25,
  level_10: 50,
  gems_100: 20,
};

function AchievementsPage() {
  const { user, addGems } = useUserStore();
  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    const saved = localStorage.getItem("claimedAchievementRewards");
    return saved ? JSON.parse(saved) : [];
  });
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<{
    achievement: Achievement;
    gems: number;
  } | null>(null);

  const getProgress = (achievement: Achievement) => {
    if (!user) return 0;
    switch (achievement.type) {
      case "streak":
        return Math.min((user.streak / achievement.requirement) * 100, 100);
      case "correct":
        return Math.min(
          (user.totalCorrect / achievement.requirement) * 100,
          100
        );
      case "perfect":
        return Math.min(
          ((user.perfectLessons ?? 0) / achievement.requirement) * 100,
          100
        );
      case "level":
        return Math.min((user.level / achievement.requirement) * 100, 100);
      case "gems":
        return Math.min(
          ((user.gems ?? 0) / achievement.requirement) * 100,
          100
        );
      default:
        return 0;
    }
  };

  const getCurrentValue = (achievement: Achievement) => {
    if (!user) return 0;
    switch (achievement.type) {
      case "streak":
        return user.streak;
      case "correct":
        return user.totalCorrect;
      case "perfect":
        return user.perfectLessons ?? 0;
      case "level":
        return user.level ?? 1;
      case "gems":
        return user.gems ?? 0;
      default:
        return 0;
    }
  };

  const canClaim = (achievementId: string) => {
    const earned = (user?.achievements ?? []).includes(achievementId);
    const claimed = claimedRewards.includes(achievementId);
    return earned && !claimed;
  };

  const handleClaimReward = async (achievement: Achievement) => {
    const gems = ACHIEVEMENT_REWARDS[achievement.id] || 10;

    // Add gems
    await addGems(gems);

    // Mark as claimed
    const newClaimed = [...claimedRewards, achievement.id];
    setClaimedRewards(newClaimed);
    localStorage.setItem(
      "claimedAchievementRewards",
      JSON.stringify(newClaimed)
    );

    // Show reward modal
    setCurrentReward({ achievement, gems });
    setShowRewardModal(true);

    // Confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#58cc02", "#ffc800", "#1cb0f6", "#ce82ff"],
    });
  };

  const earnedCount = (user?.achievements ?? []).length;
  const claimableCount = ACHIEVEMENTS.filter((a) => canClaim(a.id)).length;

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Modal */}
      {showRewardModal && currentReward && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-3xl p-6 max-w-sm w-full text-center">
            {/* Gift animation */}
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--duo-yellow)] to-[var(--duo-orange)] flex items-center justify-center">
              <Gift className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-[var(--duo-yellow)] mb-2">
              Nhận quà thành công!
            </h2>

            <p className="text-[var(--muted-foreground)] mb-4">
              Thành tựu: {currentReward.achievement.name}
            </p>

            {/* Gems reward */}
            <div className="bg-[var(--secondary)] rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2">
                <Gem className="w-8 h-8 text-[var(--duo-blue)]" />
                <span className="text-3xl font-bold text-[var(--duo-blue)]">
                  +{currentReward.gems}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Gems
              </p>
            </div>

            <button
              onClick={() => setShowRewardModal(false)}
              className="btn-3d btn-3d-green w-full py-3"
            >
              Tuyệt vời!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-white" />
              <h1 className="font-bold text-xl text-white">Thành tựu</h1>
            </div>
            <p className="text-white/80 text-sm mt-1">
              Đã đạt {earnedCount}/{ACHIEVEMENTS.length} thành tựu
            </p>
          </div>
          {claimableCount > 0 && (
            <div className="bg-[var(--duo-red)] px-3 py-1.5 rounded-full">
              <span className="text-white text-sm font-bold">
                {claimableCount} quà chờ nhận
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28 space-y-3">
        {ACHIEVEMENTS.map((achievement) => {
          const earned = (user?.achievements ?? []).includes(achievement.id);
          const claimed = claimedRewards.includes(achievement.id);
          const canClaimReward = earned && !claimed;
          const progress = getProgress(achievement);
          const current = getCurrentValue(achievement);
          const Icon = ICON_MAP[achievement.icon];
          const rewardGems = ACHIEVEMENT_REWARDS[achievement.id] || 10;

          return (
            <div
              key={achievement.id}
              className={`card-3d p-4 ${
                canClaimReward
                  ? "border-[var(--duo-green)] border-2"
                  : earned
                  ? "border-[var(--duo-yellow)] border-2"
                  : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    earned
                      ? "bg-[var(--duo-yellow)]/20"
                      : "bg-[var(--secondary)]"
                  }`}
                >
                  {earned ? (
                    <Icon className="w-7 h-7 text-[var(--duo-yellow)]" />
                  ) : (
                    <Lock className="w-6 h-6 text-[var(--muted-foreground)]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3
                    className={`font-bold ${
                      earned ? "text-[var(--duo-yellow)]" : "text-foreground"
                    }`}
                  >
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">
                    {achievement.description}
                  </p>

                  {/* Reward info */}
                  <div className="flex items-center gap-1 text-xs">
                    <Gift className="w-3 h-3 text-[var(--duo-blue)]" />
                    <span className="text-[var(--duo-blue)] font-semibold">
                      {rewardGems} Gems
                    </span>
                  </div>

                  {/* Progress */}
                  {!earned && (
                    <div className="mt-2">
                      <div className="progress-duo h-2">
                        <div
                          className="progress-duo-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {current}/{achievement.requirement}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action */}
                {canClaimReward ? (
                  <button
                    onClick={() => handleClaimReward(achievement)}
                    className="btn-3d btn-3d-green px-3 py-2 text-xs"
                  >
                    Nhận quà
                  </button>
                ) : earned && claimed ? (
                  <CheckCircle className="w-6 h-6 text-[var(--duo-green)]" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}

export default AchievementsPage;
