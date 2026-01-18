import { useState, useEffect } from "react";
import { X, Gift, Check, Lock, Trophy } from "lucide-react";
import {
  RANK_LEVELS,
  getRankFromPoints,
  getRankImage,
} from "@/services/ai-quiz-service";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserStore } from "@/stores/user-store";
import { RewardModal } from "@/components/ui/reward-modal";
import confetti from "canvas-confetti";

// Tạo danh sách tất cả các mốc rank rewards
// Mỗi rank có 7 tier (7 = thấp nhất, 1 = cao nhất)
// Master thưởng mỗi 100 điểm từ 4000 trở đi

interface RankRewardItem {
  id: string;
  rankId: string;
  rankName: string;
  tier: number; // 7-1 cho rank thường, 0 cho master milestones
  minPoints: number;
  gems: number;
  label: string;
  isMaster?: boolean;
  masterMilestone?: number; // 4100, 4200, 4300...
  rankFolder?: string; // Folder chứa ảnh rank
}

// Lấy ảnh rank cho từng tier
function getRankTierImage(rankId: string, tier: number): string {
  const rankInfo = RANK_LEVELS.find((r) => r.id === rankId);
  if (!rankInfo) return "/Rank/Wood/rank-wood-1_NoOL_large.png";

  if (rankId === "master") {
    return "/Rank/master.png";
  }

  // tier 7 -> ảnh 1, tier 1 -> ảnh 7
  const imageNumber = 8 - tier;
  return `/Rank/${rankInfo.folder}/rank-${rankId}-${imageNumber}_NoOL_large.png`;
}

// Tính điểm cần cho mỗi tier trong rank
function getTierMinPoints(rankId: string, tier: number): number {
  const rankIndex = RANK_LEVELS.findIndex((r) => r.id === rankId);
  if (rankIndex === -1) return 0;

  const rank = RANK_LEVELS[rankIndex];
  const nextRank = RANK_LEVELS[rankIndex + 1];

  if (!nextRank || rank.id === "master") return rank.minScore;

  const pointsPerTier = (nextRank.minScore - rank.minScore) / rank.tiers;
  // tier 7 = minScore, tier 1 = gần nextRank
  const tierFromBottom = rank.tiers - tier;
  return Math.floor(rank.minScore + tierFromBottom * pointsPerTier);
}

// Tạo danh sách rewards
// Cân bằng với hệ thống quà app:
// - Login 7 ngày: 50-500 gems
// - Level rewards: 150-2500 gems
// - Daily quests: 25-60 gems
// - Weekly quests: 150-300 gems
// - Gacha: 150 gems/lần
// Rank rewards nên có giá trị tương xứng với effort leo rank
function generateRankRewards(): RankRewardItem[] {
  const rewards: RankRewardItem[] = [];

  // Rewards cho các rank thường (wood -> onyx)
  const normalRanks = RANK_LEVELS.filter((r) => r.id !== "master");

  // Base gems cho mỗi rank - TĂNG MẠNH vì rank rất khó leo
  // Wood: 100, Stone: 150, Bronze: 250, Silver: 400, Gold: 600, Platinum: 900, Amethyst: 1300, Onyx: 2000
  const rankBaseGems: Record<string, number> = {
    wood: 100,
    stone: 150,
    bronze: 250,
    silver: 400,
    gold: 600,
    platinum: 900,
    amethyst: 1300,
    onyx: 2000,
  };

  normalRanks.forEach((rank) => {
    const baseGems = rankBaseGems[rank.id] || 100;

    for (let tier = 7; tier >= 1; tier--) {
      const minPoints = getTierMinPoints(rank.id, tier);
      // Gems tăng theo tier (tier 7 = base, tier 1 = base x2)
      // tier 7: x1.0, tier 6: x1.15, tier 5: x1.3, tier 4: x1.45, tier 3: x1.6, tier 2: x1.75, tier 1: x2.0
      const tierMultiplier = 1 + (8 - tier) * 0.15;
      const gems = Math.round(baseGems * tierMultiplier);

      rewards.push({
        id: `${rank.id}_${tier}`,
        rankId: rank.id,
        rankName: rank.name,
        tier,
        minPoints,
        gems,
        label: `${rank.name} ${tier}`,
        rankFolder: rank.folder,
      });
    }
  });

  // Rewards cho Master - mỗi 100 điểm từ 4000
  // Master rewards phải CAO HƠN Onyx tier 1 (4100 gems)
  const masterRank = RANK_LEVELS.find((r) => r.id === "master");
  if (masterRank) {
    // Tạo milestones từ 4000 đến 10000 (mỗi 100 điểm)
    for (let points = 4000; points <= 10000; points += 100) {
      const milestone = points;
      // Master: 5000 gems base, +100 gems mỗi 100 điểm
      // 4000: 5000, 4100: 5100, 4200: 5200... 10000: 11000
      const gemsBase = 5000 + Math.floor((points - 4000) / 100) * 100;

      rewards.push({
        id: `master_${milestone}`,
        rankId: "master",
        rankName: "Huyền Thoại",
        tier: 0,
        minPoints: milestone,
        gems: gemsBase,
        label: `Huyền Thoại ${milestone} RP`,
        isMaster: true,
        masterMilestone: milestone,
      });
    }
  }

  return rewards;
}

const ALL_RANK_REWARDS = generateRankRewards();

interface RankRewardsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userRankPoints: number;
}

export function RankRewardsSheet({
  isOpen,
  onClose,
  userRankPoints,
}: RankRewardsSheetProps) {
  const { user, addGems } = useUserStore();
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState<{
    gems: number;
    label: string;
  } | null>(null);

  // Sync claimedRewards từ user store (đã load sẵn)
  useEffect(() => {
    if (user?.claimedRankRewards) {
      setClaimedRewards(user.claimedRankRewards);
    }
  }, [user?.claimedRankRewards]);

  if (!isOpen) return null;

  const getRewardStatus = (reward: RankRewardItem) => {
    if (claimedRewards.includes(reward.id)) return "claimed";
    if (userRankPoints >= reward.minPoints) return "available";
    return "locked";
  };

  const handleClaim = async (reward: RankRewardItem) => {
    if (!user?.oderId || claiming) return;
    if (getRewardStatus(reward) !== "available") return;

    setClaiming(true);

    try {
      const newClaimedRewards = [...claimedRewards, reward.id];

      // Update Firebase
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, {
        claimedRankRewards: newClaimedRewards,
      });

      // Add gems
      await addGems(reward.gems);

      setClaimedRewards(newClaimedRewards);
      setClaimedReward({ gems: reward.gems, label: reward.label });
      setShowRewardModal(true);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#58cc02", "#ffc800", "#ce82ff"],
      });
    } catch (error) {
      console.error("Error claiming rank reward:", error);
    } finally {
      setClaiming(false);
    }
  };

  // Nhận tất cả quà có thể nhận
  const handleClaimAll = async () => {
    if (!user?.oderId || claiming) return;

    const availableRewards = ALL_RANK_REWARDS.filter(
      (r) => getRewardStatus(r) === "available"
    );

    if (availableRewards.length === 0) return;

    setClaiming(true);

    try {
      const newClaimedIds = availableRewards.map((r) => r.id);
      const totalGems = availableRewards.reduce((sum, r) => sum + r.gems, 0);
      const newClaimedRewards = [...claimedRewards, ...newClaimedIds];

      // Update Firebase
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, {
        claimedRankRewards: newClaimedRewards,
      });

      // Add gems
      await addGems(totalGems);

      setClaimedRewards(newClaimedRewards);
      setClaimedReward({
        gems: totalGems,
        label: `${availableRewards.length} phần thưởng`,
      });
      setShowRewardModal(true);

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#58cc02", "#ffc800", "#ce82ff", "#1cb0f6"],
      });
    } catch (error) {
      console.error("Error claiming all rank rewards:", error);
    } finally {
      setClaiming(false);
    }
  };

  // Đếm số quà có thể nhận
  const availableCount = ALL_RANK_REWARDS.filter(
    (r) => getRewardStatus(r) === "available"
  ).length;

  const claimedCount = claimedRewards.length;

  // Hiển thị TẤT CẢ rewards
  const currentRank = getRankFromPoints(userRankPoints);

  return (
    <>
      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal && !!claimedReward}
        onClose={() => setShowRewardModal(false)}
        title="Nhận quà thành công!"
        subtitle={claimedReward?.label || ""}
        rewards={
          claimedReward ? [{ type: "gems", amount: claimedReward.gems }] : []
        }
        gradientFrom="var(--duo-purple)"
        gradientTo="var(--duo-blue)"
      />

      {/* Bottom Sheet */}
      <div
        className="fixed inset-0 z-[100] bg-black/80 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-gradient-to-b from-[var(--card)] to-[var(--background)] w-full max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl rounded-t-[2rem] md:rounded-2xl md:max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--secondary)] border-2 border-[var(--border)] active:scale-95 transition-transform shrink-0"
              >
                <X className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
              <div className="flex-1 min-w-0 text-center">
                <h2 className="font-bold text-base flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[var(--duo-yellow)] shrink-0" />
                  <span className="truncate">Quà Rank</span>
                </h2>
                <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                  Nhận quà khi đạt mốc
                </p>
              </div>
              {availableCount > 0 ? (
                <button
                  onClick={handleClaimAll}
                  disabled={claiming}
                  className="btn-3d btn-3d-green px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1 shrink-0"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Nhận ({availableCount})
                </button>
              ) : (
                <div className="w-9" />
              )}
            </div>
          </div>

          {/* Current Rank Info */}
          <div className="px-5 pb-4">
            <div className="bg-[var(--secondary)]/50 rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <img
                  src={getRankImage(currentRank)}
                  alt={currentRank.rankName}
                  className="w-12 h-12 object-contain"
                />
                <div className="flex-1">
                  <p className="font-bold text-foreground">
                    {currentRank.rankName}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {userRankPoints} Rank Points
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Đã nhận
                  </p>
                  <p className="font-bold text-[var(--duo-green)]">
                    {claimedCount}
                  </p>
                </div>
                {availableCount > 0 && (
                  <div className="bg-[var(--duo-red)] px-2 py-1 rounded-full">
                    <span className="text-white text-xs font-bold">
                      {availableCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rewards List - Hiển thị TẤT CẢ với icon rank */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <div className="space-y-2">
              {ALL_RANK_REWARDS.map((reward) => {
                const status = getRewardStatus(reward);
                const isMaster = reward.isMaster;
                const rankImage = getRankTierImage(reward.rankId, reward.tier);

                return (
                  <div
                    key={reward.id}
                    className={`card-3d p-3 flex items-center gap-3 ${
                      status === "available"
                        ? "border-[var(--duo-green)] border-2"
                        : status === "claimed"
                        ? "opacity-70"
                        : "opacity-50"
                    }`}
                  >
                    {/* Rank Icon - Hiển thị ảnh rank thực tế */}
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={rankImage}
                        alt={reward.label}
                        className={`w-10 h-10 object-contain ${
                          status === "locked" ? "grayscale" : ""
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-bold text-sm truncate ${
                          status === "claimed"
                            ? "text-[var(--muted-foreground)]"
                            : "text-foreground"
                        }`}
                      >
                        {reward.label}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {reward.minPoints} RP
                      </p>
                    </div>

                    {/* Gems */}
                    <div className="flex items-center gap-1">
                      <span
                        className={`font-bold ${
                          isMaster
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

                    {/* Action */}
                    {status === "claimed" ? (
                      <div className="w-8 h-8 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : status === "available" ? (
                      <button
                        onClick={() => handleClaim(reward)}
                        disabled={claiming}
                        className="btn-3d btn-3d-green px-3 py-1.5 text-xs"
                      >
                        Nhận
                      </button>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--muted-foreground)]/30 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-[var(--muted-foreground)]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
