import { Page } from "zmp-ui";
import {
  Target,
  Flame,
  Zap,
  BookOpen,
  Trophy,
  Gift,
  CheckCircle,
  Calendar,
  CalendarDays,
  Star,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState } from "react";
import confetti from "canvas-confetti";

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
    reward: 10,
    getValue: (user) => user?.dailyProgress ?? 0,
  },
  {
    id: "daily_correct_10",
    name: "Trả lời đúng",
    description: "Trả lời đúng 10 câu",
    icon: CheckCircle,
    type: "daily",
    requirement: 10,
    reward: 15,
    getValue: (user) => user?.questProgress?.dailyCorrect ?? 0,
  },
  {
    id: "daily_quiz_3",
    name: "Hoàn thành quiz",
    description: "Hoàn thành 3 bài quiz",
    icon: BookOpen,
    type: "daily",
    requirement: 3,
    reward: 20,
    getValue: (user) => user?.questProgress?.dailyQuizzes ?? 0,
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
    reward: 50,
    getValue: (user) => user?.streak ?? 0,
  },
  {
    id: "weekly_xp_500",
    name: "XP tuần",
    description: "Kiếm 500 XP trong tuần",
    icon: Zap,
    type: "weekly",
    requirement: 500,
    reward: 75,
    getValue: (user) => user?.questProgress?.weeklyXP ?? 0,
  },
  {
    id: "weekly_perfect_3",
    name: "Hoàn hảo",
    description: "3 bài quiz 100% trong tuần",
    icon: Star,
    type: "weekly",
    requirement: 3,
    reward: 100,
    getValue: (user) => user?.questProgress?.weeklyPerfect ?? 0,
  },
];

function QuestsPage() {
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

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Modal */}
      {showRewardModal && currentReward && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-3xl p-6 max-w-sm w-full text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--duo-green)] to-[var(--duo-blue)] flex items-center justify-center">
              <Gift className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-xl font-bold text-[var(--duo-green)] mb-2">
              Nhiệm vụ hoàn thành!
            </h2>

            <p className="text-[var(--muted-foreground)] mb-4">
              {currentReward.quest.name}
            </p>

            <div className="bg-[var(--secondary)] rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-10 h-10"
                />
                <span className="text-3xl font-bold text-[var(--duo-blue)]">
                  +{currentReward.gems}
                </span>
              </div>
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
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-green)] to-[var(--duo-blue)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-white" />
              <h1 className="font-bold text-xl text-white">Nhiệm vụ</h1>
            </div>
            <p className="text-white/80 text-sm mt-1">
              Hoàn thành để nhận gems
            </p>
          </div>
          {totalClaimable > 0 && (
            <div className="bg-[var(--duo-red)] px-3 py-1.5 rounded-full">
              <span className="text-white text-sm font-bold">
                {totalClaimable} quà
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28 space-y-5">
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
                          className="btn-3d btn-3d-green px-2.5 py-1.5 text-xs"
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
                          className="btn-3d btn-3d-purple px-2.5 py-1.5 text-xs"
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
