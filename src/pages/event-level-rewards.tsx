import { Page } from "zmp-ui";
import { useNavigate } from "zmp-ui";
import { ArrowLeft, Trophy, Gift, Check, Lock, Star } from "lucide-react";
import { useUserStore, getExpProgress } from "@/stores/user-store";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RewardModal } from "@/components/ui/reward-modal";
import confetti from "canvas-confetti";

// Phần thưởng theo cấp độ (tăng mạnh cho 233 gói gacha - mỗi gói 233 gems)
const LEVEL_REWARDS = [
  { level: 5, gems: 500, label: "Cấp 5" },
  { level: 10, gems: 1000, label: "Cấp 10", special: true },
  { level: 15, gems: 1200, label: "Cấp 15" },
  { level: 20, gems: 1500, label: "Cấp 20", special: true },
  { level: 25, gems: 1800, label: "Cấp 25" },
  { level: 30, gems: 2500, label: "Cấp 30", special: true },
  { level: 35, gems: 2000, label: "Cấp 35" },
  { level: 40, gems: 3000, label: "Cấp 40", special: true },
  { level: 45, gems: 2500, label: "Cấp 45" },
  { level: 50, gems: 5000, label: "Cấp 50", special: true, legendary: true },
  { level: 55, gems: 3000, label: "Cấp 55" },
  { level: 60, gems: 4000, label: "Cấp 60", special: true },
  { level: 65, gems: 3500, label: "Cấp 65" },
  { level: 70, gems: 5000, label: "Cấp 70", special: true },
  { level: 75, gems: 4500, label: "Cấp 75" },
  { level: 80, gems: 6000, label: "Cấp 80", special: true },
  { level: 85, gems: 5500, label: "Cấp 85" },
  { level: 90, gems: 8000, label: "Cấp 90", special: true },
  { level: 95, gems: 7000, label: "Cấp 95" },
  { level: 100, gems: 15000, label: "Cấp 100", special: true, legendary: true },
];

function EventLevelRewardsPage() {
  const navigate = useNavigate();
  const { user, addGems } = useUserStore();
  const [claimedLevels, setClaimedLevels] = useState<number[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState(0);

  // Load claimed levels
  useEffect(() => {
    const loadClaimedLevels = async () => {
      if (!user?.oderId) return;

      try {
        const userRef = doc(db, "users", user.oderId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setClaimedLevels(data.claimedLevelRewards || []);
        }
      } catch (error) {
        console.error("Error loading claimed levels:", error);
      }
    };

    loadClaimedLevels();
  }, [user?.oderId]);

  const getRewardStatus = (level: number) => {
    if (claimedLevels.includes(level)) return "claimed";
    if ((user?.level || 1) >= level) return "available";
    return "locked";
  };

  const handleClaim = async (level: number) => {
    if (!user?.oderId || claiming) return;
    if (getRewardStatus(level) !== "available") return;

    setClaiming(true);
    const reward = LEVEL_REWARDS.find((r) => r.level === level);
    if (!reward) return;

    try {
      const newClaimedLevels = [...claimedLevels, level];

      // Update Firebase
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, {
        claimedLevelRewards: newClaimedLevels,
      });

      // Add gems
      await addGems(reward.gems);

      setClaimedLevels(newClaimedLevels);
      setClaimedReward(reward.gems);
      setShowRewardModal(true);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#58cc02", "#ffc800", "#ce82ff"],
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
    } finally {
      setClaiming(false);
    }
  };

  const totalClaimed = claimedLevels.length;
  const totalAvailable = LEVEL_REWARDS.filter(
    (r) => (user?.level || 1) >= r.level && !claimedLevels.includes(r.level)
  ).length;

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title="Nhận thưởng thành công!"
        subtitle="Phần thưởng cấp độ"
        rewards={[{ type: "gems", amount: claimedReward }]}
        gradientFrom="var(--duo-purple)"
        gradientTo="var(--duo-pink)"
      />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-pink)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-white">Thưởng cấp độ</h1>
            <p className="text-white/80 text-sm">Nhận quà khi lên cấp!</p>
          </div>
          {totalAvailable > 0 && (
            <div className="bg-[var(--duo-red)] px-3 py-1.5 rounded-full">
              <span className="text-white text-sm font-bold">
                {totalAvailable}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-32 pb-28">
        {/* Current Level */}
        <div className="card-3d p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--duo-purple)] to-[var(--duo-pink)] flex items-center justify-center">
                <Star className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Cấp độ hiện tại
                </p>
                <p className="font-bold text-2xl text-foreground">
                  {user?.level || 1}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <img
                src="/AppAssets/BlueDiamond.png"
                alt="gem"
                className="w-5 h-5"
              />
              <span className="font-bold text-[var(--duo-blue)]">
                {user?.gems || 0}
              </span>
            </div>
          </div>

          {/* XP Progress */}
          {(() => {
            const expProgress = getExpProgress(user?.exp || 0);
            const progressPercent =
              (expProgress.current / expProgress.required) * 100;
            return (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--muted-foreground)]">EXP</span>
                  <span className="text-foreground font-medium">
                    {expProgress.current}/{expProgress.required}
                  </span>
                </div>
                <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-pink)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 p-3 rounded-xl bg-[var(--secondary)] text-center">
            <p className="text-2xl font-bold text-[var(--duo-green)]">
              {totalClaimed}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Đã nhận</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-[var(--secondary)] text-center">
            <p className="text-2xl font-bold text-[var(--duo-orange)]">
              {totalAvailable}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Có thể nhận
            </p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-[var(--secondary)] text-center">
            <p className="text-2xl font-bold text-[var(--muted-foreground)]">
              {LEVEL_REWARDS.length - totalClaimed - totalAvailable}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Chưa mở</p>
          </div>
        </div>

        {/* Rewards List */}
        <div className="space-y-3">
          {LEVEL_REWARDS.map((reward) => {
            const status = getRewardStatus(reward.level);
            const isSpecial = reward.special;
            const isLegendary = reward.legendary;

            return (
              <button
                key={reward.level}
                onClick={() => handleClaim(reward.level)}
                disabled={status !== "available" || claiming}
                className={`card-3d w-full p-4 flex items-center gap-4 ${
                  isLegendary
                    ? "border-2 border-[var(--duo-yellow)]"
                    : status === "available"
                    ? "border-2 border-[var(--duo-green)]"
                    : status === "claimed"
                    ? "border-2 border-[var(--duo-green)]"
                    : "opacity-60"
                }`}
              >
                {/* Level Badge */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isLegendary
                      ? "bg-gradient-to-br from-[var(--duo-yellow)] to-[var(--duo-orange)]"
                      : isSpecial
                      ? "bg-gradient-to-br from-[var(--duo-purple)] to-[var(--duo-pink)]"
                      : "bg-[var(--duo-blue)]/20"
                  }`}
                >
                  {isLegendary ? (
                    <Trophy className="w-7 h-7 text-white" />
                  ) : isSpecial ? (
                    <Gift className="w-6 h-6 text-white" />
                  ) : (
                    <span className="font-bold text-lg text-[var(--duo-blue)]">
                      {reward.level}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-bold ${
                        status === "claimed"
                          ? "text-[var(--muted-foreground)]"
                          : "text-foreground"
                      }`}
                    >
                      {reward.label}
                    </p>
                    {isLegendary && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--duo-yellow)] text-black font-bold">
                        LEGENDARY
                      </span>
                    )}
                    {isSpecial && !isLegendary && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--duo-purple)] text-white">
                        Đặc biệt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-bold text-lg ${
                        isLegendary
                          ? "text-[var(--duo-yellow)]"
                          : "text-[var(--duo-blue)]"
                      }`}
                    >
                      +{reward.gems}
                    </span>
                    <img
                      src="/AppAssets/BlueDiamond.png"
                      alt="gem"
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                {/* Status */}
                {status === "claimed" ? (
                  <div className="w-10 h-10 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : status === "available" ? (
                  <div className="btn-3d btn-3d-green px-4 py-2 text-sm">
                    Nhận
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--muted-foreground)]/30 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-4 card-3d p-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Hoàn thành quiz để nhận EXP và lên cấp. EXP cần tăng dần theo level!
          </p>
        </div>
      </div>
    </Page>
  );
}

export default EventLevelRewardsPage;
