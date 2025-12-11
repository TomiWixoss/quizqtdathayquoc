import { Page, useNavigate } from "zmp-ui";
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
  ArrowLeft,
  Swords,
  Shield,
  Gamepad2,
  Brain,
  Dices,
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
  Swords,
  Shield,
  Award,
  Gamepad2,
  Brain,
  Dices,
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
  correct_1000: 300,
  perfect_5: 30,
  perfect_20: 80,
  perfect_50: 200,
  level_5: 25,
  level_10: 50,
  level_20: 100,
  gems_100: 20,
  gems_500: 50,
  gems_1000: 100,
  conquest_first: 20,
  conquest_10: 50,
  conquest_50: 150,
  conquest_wins_5: 40,
  conquest_wins_10: 100,
  rank_100: 30,
  rank_500: 75,
  rank_1000: 150,
  rank_2000: 300,
  // Minigame achievements
  spin_10: 20,
  spin_50: 50,
  caro_wins_5: 25,
  caro_wins_20: 60,
  caro_wins_50: 150,
  memory_wins_5: 25,
  memory_wins_20: 60,
  memory_wins_50: 150,
};

function AchievementsPage() {
  const navigate = useNavigate();
  const { user, addGems, claimAchievementReward } = useUserStore();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<{
    achievement: Achievement;
    gems: number;
  } | null>(null);

  // Get claimed rewards from Firebase user data
  const claimedRewards = user?.claimedAchievementRewards || [];

  const getProgress = (achievement: Achievement) => {
    if (!user) return 0;
    const current = getCurrentValue(achievement);
    return Math.min((current / achievement.requirement) * 100, 100);
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
      case "conquest":
        return user.conquestStats?.totalConquests ?? 0;
      case "conquest_wins":
        return user.conquestStats?.bestWinStreak ?? 0;
      case "rank_points":
        return user.conquestStats?.rankPoints ?? 0;
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

    // Mark as claimed in Firebase
    await claimAchievementReward(achievement.id);

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
                <img src="/BlueDiamond.png" alt="gem" className="w-10 h-10" />
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
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate("/settings")}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
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
                {claimableCount}
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
