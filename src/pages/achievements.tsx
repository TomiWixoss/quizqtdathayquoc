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
  Package,
  Image,
  Building,
  Brain,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useTowerStore } from "@/stores/tower-store";
import { ACHIEVEMENTS, Achievement } from "@/types/quiz";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { RewardModal } from "@/components/ui/reward-modal";

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
  Package,
  Image,
  Building,
  Brain,
};

// Reward gems for each achievement (tăng đáng kể cho 233 gói thẻ)
const ACHIEVEMENT_REWARDS: Record<string, number> = {
  first_quiz: 30,
  streak_3: 50,
  streak_7: 100,
  streak_30: 300,
  correct_50: 75,
  correct_100: 150,
  correct_500: 400,
  correct_1000: 800,
  perfect_5: 100,
  perfect_20: 250,
  perfect_50: 600,
  level_5: 75,
  level_10: 150,
  level_20: 300,
  gems_100: 50,
  gems_500: 150,
  gems_1000: 300,
  conquest_first: 60,
  conquest_10: 150,
  conquest_50: 400,
  conquest_wins_5: 120,
  conquest_wins_10: 300,
  rank_100: 100,
  rank_500: 200,
  rank_1000: 400,
  rank_2000: 800,
  // Gacha achievements
  gacha_first: 60,
  gacha_pulls_50: 150,
  gacha_pulls_100: 300,
  gacha_pulls_500: 800,
  gacha_ur_1: 100,
  gacha_ur_5: 250,
  gacha_ur_10: 450,
  gacha_ur_25: 1000,
  gacha_sr_10: 120,
  gacha_sr_50: 350,
  gacha_cards_25: 150,
  gacha_cards_100: 400,
  gacha_cards_250: 1000,
  gacha_collection_1: 300,
  gacha_collection_3: 700,
  gacha_collection_5: 1500,
  // Tower achievements
  tower_floor_10: 100,
  tower_floor_50: 300,
  tower_floor_100: 700,
  tower_floor_200: 1500,
  tower_complete: 3000,
  // Quiz/Practice achievements
  quizzes_10: 60,
  quizzes_50: 180,
  quizzes_100: 400,
  quizzes_500: 1000,
  // ========== THÀNH TỰU VÔ TẬN ==========
  correct_2000: 1500,
  correct_5000: 3000,
  correct_10000: 6000,
  streak_60: 600,
  streak_100: 1500,
  streak_365: 10000,
  level_30: 500,
  level_50: 1000,
  level_100: 3000,
  conquest_100: 800,
  conquest_500: 3000,
  rank_3000: 1200,
  rank_4000: 2000,
  rank_5000: 4000,
  gacha_pulls_1000: 2000,
  gacha_ur_50: 2000,
  gacha_ur_100: 5000,
  gacha_cards_500: 3000,
  quizzes_1000: 2000,
  quizzes_5000: 8000,
  perfect_100: 1500,
  perfect_500: 5000,
  gems_5000: 1000,
  gems_10000: 3000,
};

function AchievementsPage() {
  const navigate = useNavigate();
  const { user, addGems, claimAchievementReward } = useUserStore();
  const { highestFloor, totalFloors, initTower } = useTowerStore();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<{
    achievement: Achievement;
    gems: number;
  } | null>(null);

  // Initialize tower store to get highestFloor
  useEffect(() => {
    initTower();
  }, []);

  // Get claimed rewards from Firebase user data
  const claimedRewards = user?.claimedAchievementRewards || [];

  const getProgress = (achievement: Achievement) => {
    if (!user) return 0;
    const current = getCurrentValue(achievement);
    return Math.min((current / achievement.requirement) * 100, 100);
  };

  const getCurrentValue = (achievement: Achievement) => {
    if (!user) return 0;
    const gachaStats = user.gachaInventory?.gachaStats;
    const totalCards =
      (gachaStats?.totalURCards ?? 0) +
      (gachaStats?.totalSRCards ?? 0) +
      (gachaStats?.totalRCards ?? 0) +
      (gachaStats?.totalNCards ?? 0);

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
      // Gacha achievements
      case "gacha_pulls":
        return user.gachaInventory?.totalPulls ?? 0;
      case "gacha_ur":
        return gachaStats?.totalURCards ?? 0;
      case "gacha_sr":
        return gachaStats?.totalSRCards ?? 0;
      case "gacha_total_cards":
        return totalCards;
      case "gacha_collections":
        return gachaStats?.completedCollections ?? 0;
      // Tower achievements
      case "tower_floor":
        return highestFloor;
      case "tower_complete":
        return highestFloor >= totalFloors && totalFloors > 0 ? 1 : 0;
      // Quiz/Practice achievements
      case "quizzes":
        return user.totalQuizzes ?? 0;
      default:
        return 0;
    }
  };

  // Kiểm tra xem đã đạt điều kiện chưa (dựa trên requirement, không chỉ dựa vào achievements array)
  const isEarned = (achievement: Achievement) => {
    const current = getCurrentValue(achievement);
    return current >= achievement.requirement;
  };

  const canClaim = (achievementId: string) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return false;
    const earned = isEarned(achievement);
    const claimed = claimedRewards.includes(achievementId);
    return earned && !claimed;
  };

  const handleClaimReward = async (achievement: Achievement) => {
    const gems = ACHIEVEMENT_REWARDS[achievement.id] || 10;

    // Mark as claimed FIRST to prevent double claim
    await claimAchievementReward(achievement.id);

    // Then add gems
    await addGems(gems);

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

  const earnedCount = ACHIEVEMENTS.filter((a) => isEarned(a)).length;
  const claimableCount = ACHIEVEMENTS.filter((a) => canClaim(a.id)).length;
  const [claimingAll, setClaimingAll] = useState(false);

  // Nhận tất cả thành tựu có thể nhận
  const handleClaimAll = async () => {
    if (claimingAll) return;

    const claimableAchievements = ACHIEVEMENTS.filter((a) => canClaim(a.id));
    if (claimableAchievements.length === 0) return;

    setClaimingAll(true);

    try {
      // Tính tổng gems
      const totalGems = claimableAchievements.reduce(
        (sum, a) => sum + (ACHIEVEMENT_REWARDS[a.id] || 10),
        0
      );

      // Claim tất cả
      for (const achievement of claimableAchievements) {
        await claimAchievementReward(achievement.id);
      }

      // Add tổng gems 1 lần
      await addGems(totalGems);

      // Show modal
      setCurrentReward({
        achievement: {
          name: `${claimableAchievements.length} thành tựu`,
        } as Achievement,
        gems: totalGems,
      });
      setShowRewardModal(true);

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#58cc02", "#ffc800", "#1cb0f6", "#ce82ff"],
      });
    } catch (error) {
      console.error("Error claiming all achievements:", error);
    } finally {
      setClaimingAll(false);
    }
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal && !!currentReward}
        onClose={() => setShowRewardModal(false)}
        title="Nhận quà thành công!"
        subtitle={`Thành tựu: ${currentReward?.achievement.name}`}
        rewards={
          currentReward ? [{ type: "gems", amount: currentReward.gems }] : []
        }
        gradientFrom="var(--duo-yellow)"
        gradientTo="var(--duo-orange)"
      />

      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-12 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)]">
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
            <button
              onClick={handleClaimAll}
              disabled={claimingAll}
              className="btn-3d btn-3d-green px-3 py-1.5 rounded-xl text-sm font-bold text-white flex items-center gap-1.5"
            >
              <Gift className="w-4 h-4" />
              Nhận hết ({claimableCount})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-36 pb-28 space-y-3">
        {ACHIEVEMENTS.map((achievement) => {
          const earned = isEarned(achievement);
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
