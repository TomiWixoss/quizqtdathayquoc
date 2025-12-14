import { Page, useNavigate } from "zmp-ui";
import {
  Target,
  Flame,
  Zap,
  BookOpen,
  Trophy,
  CheckCircle,
  Calendar,
  CalendarDays,
  Star,
  ArrowLeft,
  Swords,
  Sparkles,
  Award,
  Building,
  User,
  Image,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState } from "react";
import confetti from "canvas-confetti";
import { RewardModal } from "@/components/ui/reward-modal";

interface Quest {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  type: "daily" | "weekly";
  requirement: number;
  reward: number;
  getValue: (user: any) => number;
}

const DAILY_QUESTS: Quest[] = [
  {
    id: "daily_xp_50",
    name: "Mục tiêu XP",
    description: "Kiếm 50 XP hôm nay",
    icon: Target,
    type: "daily",
    requirement: 50,
    reward: 30, // Tăng từ 10
    getValue: (user) => user?.dailyProgress ?? 0,
  },
  {
    id: "daily_correct_10",
    name: "Trả lời đúng",
    description: "Trả lời đúng 10 câu",
    icon: CheckCircle,
    type: "daily",
    requirement: 10,
    reward: 40, // Tăng từ 15
    getValue: (user) => user?.questProgress?.dailyCorrect ?? 0,
  },
  {
    id: "daily_quiz_3",
    name: "Hoàn thành quiz",
    description: "Hoàn thành 3 bài quiz",
    icon: BookOpen,
    type: "daily",
    requirement: 3,
    reward: 50, // Tăng từ 20
    getValue: (user) => user?.questProgress?.dailyQuizzes ?? 0,
  },
  {
    id: "daily_conquest_1",
    name: "Chinh chiến",
    description: "Hoàn thành 1 trận chinh chiến",
    icon: Swords,
    type: "daily",
    requirement: 1,
    reward: 60, // Tăng từ 25
    getValue: (user) => user?.questProgress?.dailyConquests ?? 0,
  },
  {
    id: "daily_gacha_1",
    name: "Quay gacha",
    description: "Quay gacha 1 lần",
    icon: Sparkles,
    type: "daily",
    requirement: 1,
    reward: 40, // Tăng từ 15
    getValue: (user) => user?.questProgress?.dailyGachaPulls ?? 0,
  },
  {
    id: "daily_tower_3",
    name: "Leo tháp",
    description: "Vượt qua 3 tầng tháp luyện ngục",
    icon: Building,
    type: "daily",
    requirement: 3,
    reward: 50, // Tăng từ 20
    getValue: (user) => user?.questProgress?.dailyTowerFloors ?? 0,
  },
  {
    id: "daily_avatar_1",
    name: "Đổi avatar",
    description: "Thay đổi avatar 1 lần",
    icon: User,
    type: "daily",
    requirement: 1,
    reward: 25, // Tăng từ 10
    getValue: (user) => user?.questProgress?.dailyAvatarChanged ?? 0,
  },
  {
    id: "daily_card_view_3",
    name: "Xem thẻ",
    description: "Xem chi tiết 3 thẻ bất kỳ",
    icon: Image,
    type: "daily",
    requirement: 3,
    reward: 25, // Tăng từ 10
    getValue: (user) => user?.questProgress?.dailyCardViewed ?? 0,
  },
];

const WEEKLY_QUESTS: Quest[] = [
  {
    id: "weekly_streak_7",
    name: "Streak tuần",
    description: "Duy trì streak 7 ngày",
    icon: Flame,
    type: "weekly",
    requirement: 7,
    reward: 150, // Tăng từ 50
    getValue: (user) => user?.streak ?? 0,
  },
  {
    id: "weekly_xp_500",
    name: "XP tuần",
    description: "Kiếm 500 XP trong tuần",
    icon: Zap,
    type: "weekly",
    requirement: 500,
    reward: 200, // Tăng từ 75
    getValue: (user) => user?.questProgress?.weeklyXP ?? 0,
  },
  {
    id: "weekly_perfect_3",
    name: "Hoàn hảo",
    description: "3 bài quiz 100% trong tuần",
    icon: Star,
    type: "weekly",
    requirement: 3,
    reward: 250, // Tăng từ 100
    getValue: (user) => user?.questProgress?.weeklyPerfect ?? 0,
  },
  {
    id: "weekly_conquest_5",
    name: "Chiến binh tuần",
    description: "Hoàn thành 5 trận chinh chiến",
    icon: Swords,
    type: "weekly",
    requirement: 5,
    reward: 200, // Tăng từ 80
    getValue: (user) => user?.questProgress?.weeklyConquests ?? 0,
  },
  {
    id: "weekly_conquest_wins_3",
    name: "Chuỗi chiến thắng",
    description: "Thắng 3 trận chinh chiến",
    icon: Award,
    type: "weekly",
    requirement: 3,
    reward: 300, // Tăng từ 120
    getValue: (user) => user?.questProgress?.weeklyConquestWins ?? 0,
  },
  {
    id: "weekly_gacha_10",
    name: "Nhà sưu tập",
    description: "Quay gacha 10 lần trong tuần",
    icon: Sparkles,
    type: "weekly",
    requirement: 10,
    reward: 250, // Tăng từ 100
    getValue: (user) => user?.questProgress?.weeklyGachaPulls ?? 0,
  },
  {
    id: "weekly_tower_20",
    name: "Chinh phục tháp",
    description: "Vượt qua 20 tầng tháp trong tuần",
    icon: Building,
    type: "weekly",
    requirement: 20,
    reward: 200, // Tăng từ 80
    getValue: (user) => user?.questProgress?.weeklyTowerFloors ?? 0,
  },
  {
    id: "weekly_card_view_15",
    name: "Khám phá thẻ",
    description: "Xem chi tiết 15 thẻ trong tuần",
    icon: Image,
    type: "weekly",
    requirement: 15,
    reward: 150, // Tăng từ 50
    getValue: (user) => user?.questProgress?.weeklyCardViewed ?? 0,
  },
];

function QuestsPage() {
  const navigate = useNavigate();
  const { user, addGems, claimDailyQuest, claimWeeklyQuest } = useUserStore();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<{
    quest: Quest;
    gems: number;
  } | null>(null);

  // Get claimed quests from Firebase user data
  const claimedQuests = [
    ...(user?.questProgress?.claimedDailyQuests || []),
    ...(user?.questProgress?.claimedWeeklyQuests || []),
  ];

  const canClaim = (quest: Quest) => {
    const value = quest.getValue(user);
    const completed = value >= quest.requirement;
    const claimed = claimedQuests.includes(quest.id);
    return completed && !claimed;
  };

  const getProgress = (quest: Quest) => {
    const value = quest.getValue(user);
    return Math.min((value / quest.requirement) * 100, 100);
  };

  const handleClaimReward = async (quest: Quest) => {
    await addGems(quest.reward);

    // Sync to Firebase
    if (quest.type === "daily") {
      await claimDailyQuest(quest.id);
    } else {
      await claimWeeklyQuest(quest.id);
    }

    setCurrentReward({ quest, gems: quest.reward });
    setShowRewardModal(true);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#58cc02", "#ffc800", "#1cb0f6"],
    });
  };

  const dailyClaimable = DAILY_QUESTS.filter((q) => canClaim(q)).length;
  const weeklyClaimable = WEEKLY_QUESTS.filter((q) => canClaim(q)).length;
  const totalClaimable = dailyClaimable + weeklyClaimable;
  const [claimingAll, setClaimingAll] = useState(false);

  // Nhận tất cả nhiệm vụ có thể nhận
  const handleClaimAll = async () => {
    if (claimingAll) return;

    const claimableDaily = DAILY_QUESTS.filter((q) => canClaim(q));
    const claimableWeekly = WEEKLY_QUESTS.filter((q) => canClaim(q));
    const allClaimable = [...claimableDaily, ...claimableWeekly];

    if (allClaimable.length === 0) return;

    setClaimingAll(true);

    try {
      // Tính tổng gems
      const totalGems = allClaimable.reduce((sum, q) => sum + q.reward, 0);

      // Claim từng quest
      for (const quest of claimableDaily) {
        await claimDailyQuest(quest.id);
      }
      for (const quest of claimableWeekly) {
        await claimWeeklyQuest(quest.id);
      }

      // Add tổng gems 1 lần
      await addGems(totalGems);

      // Show modal
      setCurrentReward({
        quest: { name: `${allClaimable.length} nhiệm vụ` } as Quest,
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
      console.error("Error claiming all quests:", error);
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
        title="Nhiệm vụ hoàn thành!"
        subtitle={currentReward?.quest.name}
        rewards={
          currentReward ? [{ type: "gems", amount: currentReward.gems }] : []
        }
        gradientFrom="var(--duo-green)"
        gradientTo="var(--duo-blue)"
      />

      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-12 pb-3 px-3 bg-gradient-to-r from-[var(--duo-green)] to-[var(--duo-blue)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/settings")}
            className="btn-back-3d w-9 h-9 flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-white shrink-0" />
              <h1 className="font-bold text-lg text-white truncate">
                Nhiệm vụ
              </h1>
            </div>
            <p className="text-white/80 text-xs truncate">
              Hoàn thành để nhận gems
            </p>
          </div>
          {totalClaimable > 0 && (
            <button
              onClick={handleClaimAll}
              disabled={claimingAll}
              className="btn-3d btn-3d-green px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1 shrink-0"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Nhận hết</span> (
              {totalClaimable})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-32 pb-28 space-y-5">
        {/* Daily Quests */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-[var(--duo-orange)]" />
            <h2 className="font-bold text-foreground">Nhiệm vụ ngày</h2>
            {dailyClaimable > 0 && (
              <span className="bg-[var(--duo-red)] text-white text-xs px-2 py-0.5 rounded-full">
                {dailyClaimable}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {DAILY_QUESTS.map((quest) => {
              const Icon = quest.icon;
              const progress = getProgress(quest);
              const value = quest.getValue(user);
              const completed = value >= quest.requirement;
              const claimed = claimedQuests.includes(quest.id);
              const canClaimReward = completed && !claimed;

              return (
                <div
                  key={quest.id}
                  className={`card-3d p-3 ${
                    canClaimReward ? "border-[var(--duo-green)] border-2" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        completed
                          ? "bg-[var(--duo-green)]/20"
                          : "bg-[var(--secondary)]"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          completed
                            ? "text-[var(--duo-green)]"
                            : "text-[var(--muted-foreground)]"
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-foreground">
                        {quest.name}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {quest.description}
                      </p>

                      {!completed && (
                        <div className="mt-1.5">
                          <div className="progress-duo h-1.5">
                            <div
                              className="progress-duo-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                            {value}/{quest.requirement}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[var(--duo-blue)]">
                        <img
                          src="/AppAssets/BlueDiamond.png"
                          alt="gem"
                          className="w-4 h-4"
                        />
                        <span className="font-bold text-sm">
                          {quest.reward}
                        </span>
                      </div>

                      {canClaimReward ? (
                        <button
                          onClick={() => handleClaimReward(quest)}
                          className="btn-3d btn-3d-green px-4 py-2 text-sm min-w-[56px]"
                        >
                          Nhận
                        </button>
                      ) : claimed ? (
                        <CheckCircle className="w-5 h-5 text-[var(--duo-green)]" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Quests */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-[var(--duo-purple)]" />
            <h2 className="font-bold text-foreground">Nhiệm vụ tuần</h2>
            {weeklyClaimable > 0 && (
              <span className="bg-[var(--duo-red)] text-white text-xs px-2 py-0.5 rounded-full">
                {weeklyClaimable}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {WEEKLY_QUESTS.map((quest) => {
              const Icon = quest.icon;
              const progress = getProgress(quest);
              const value = quest.getValue(user);
              const completed = value >= quest.requirement;
              const claimed = claimedQuests.includes(quest.id);
              const canClaimReward = completed && !claimed;

              return (
                <div
                  key={quest.id}
                  className={`card-3d p-3 ${
                    canClaimReward ? "border-[var(--duo-purple)] border-2" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        completed
                          ? "bg-[var(--duo-purple)]/20"
                          : "bg-[var(--secondary)]"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          completed
                            ? "text-[var(--duo-purple)]"
                            : "text-[var(--muted-foreground)]"
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-foreground">
                        {quest.name}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {quest.description}
                      </p>

                      {!completed && (
                        <div className="mt-1.5">
                          <div className="progress-duo h-1.5">
                            <div
                              className="progress-duo-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                            {value}/{quest.requirement}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[var(--duo-blue)]">
                        <img
                          src="/AppAssets/BlueDiamond.png"
                          alt="gem"
                          className="w-4 h-4"
                        />
                        <span className="font-bold text-sm">
                          {quest.reward}
                        </span>
                      </div>

                      {canClaimReward ? (
                        <button
                          onClick={() => handleClaimReward(quest)}
                          className="btn-3d btn-3d-purple px-4 py-2 text-sm min-w-[56px]"
                        >
                          Nhận
                        </button>
                      ) : claimed ? (
                        <CheckCircle className="w-5 h-5 text-[var(--duo-green)]" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Page>
  );
}

export default QuestsPage;
