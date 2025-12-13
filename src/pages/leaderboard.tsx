import { Page } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Crown,
  Medal,
  Swords,
  Sparkles,
  Info,
  Gift,
} from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserStore } from "@/stores/user-store";
import { getRankImage, getRankFromPoints } from "@/services/ai-quiz-service";
import { getFullImage } from "@/services/gacha-service";
import {
  LEADERBOARD_REWARDS,
  checkAndSendLeaderboardRewards,
} from "@/services/leaderboard-reward-service";
import { calculateScoreCategories, formatNumber } from "@/lib/utils";
import type { UserStats } from "@/types/quiz";

type TabType = "conquest" | "score" | "urCards";

function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>("conquest");
  const [leaders, setLeaders] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRewardInfo, setShowRewardInfo] = useState(false);

  // Kiểm tra và gửi thưởng BXH khi vào trang
  useEffect(() => {
    if (user?.oderId) {
      checkAndSendLeaderboardRewards(user.oderId).catch(console.error);
    }
  }, [user?.oderId]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        let orderField = "exp"; // Default sort by exp for score tab
        if (activeTab === "conquest") {
          orderField = "conquestStats.rankPoints";
        } else if (activeTab === "urCards") {
          orderField = "gachaInventory.gachaStats.totalURCards";
        }

        const q = query(
          collection(db, "users"),
          orderBy(orderField, "desc"),
          limit(100) // Fetch more to sort properly
        );
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map((doc) => doc.data() as UserStats);

        // Sort by calculated total score for "score" tab
        if (activeTab === "score") {
          data = data
            .map((user) => ({
              ...user,
              _calculatedScore: calculateScoreCategories(user, 0).totalScore,
            }))
            .sort(
              (a, b) =>
                (b as any)._calculatedScore - (a as any)._calculatedScore
            )
            .slice(0, 50);
        } else {
          data = data.slice(0, 50);
        }

        setLeaders(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: "bg-[var(--duo-yellow)]", icon: Crown };
    if (rank === 2) return { bg: "bg-gray-400", icon: Medal };
    if (rank === 3) return { bg: "bg-amber-600", icon: Medal };
    return { bg: "bg-[var(--secondary)]", icon: null };
  };

  const getTabColor = () => {
    switch (activeTab) {
      case "conquest":
        return "from-[var(--duo-purple)] to-[var(--duo-blue)]";
      case "score":
        return "from-[var(--duo-yellow)] to-[var(--duo-orange)]";
      case "urCards":
        return "from-[var(--duo-orange)] to-[var(--duo-yellow)]";
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const renderLeaderItem = (leader: UserStats, index: number) => {
    const rank = index + 1;
    const isCurrentUser = user?.oderId === leader.oderId;
    const rankStyle = getRankStyle(rank);
    const RankIcon = rankStyle.icon;

    // Get value based on tab
    const getValue = () => {
      switch (activeTab) {
        case "conquest":
          return leader.conquestStats?.rankPoints ?? 0;
        case "score":
          // Tính điểm tổng hợp từ các lĩnh vực
          const scores = calculateScoreCategories(leader, 0);
          return scores.totalScore;
        case "urCards":
          return leader.gachaInventory?.gachaStats?.totalURCards ?? 0;
      }
    };

    const getValueDisplay = () => {
      const value = getValue();
      switch (activeTab) {
        case "conquest":
          const userRank = getRankFromPoints(value);
          return (
            <div className="flex items-center gap-1.5">
              <img
                src={getRankImage(userRank)}
                alt={userRank.rankName}
                className="w-6 h-6 object-contain"
              />
              <span className="font-bold text-[var(--duo-purple)]">
                {formatNumber(value)}
              </span>
            </div>
          );
        case "score":
          return (
            <div className="flex items-center gap-1 text-[var(--duo-yellow)]">
              <Trophy className="w-5 h-5" />
              <span className="font-bold text-lg">{formatNumber(value)}</span>
            </div>
          );
        case "urCards":
          return (
            <div className="flex items-center gap-1 text-[var(--duo-orange)]">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-lg">{value}</span>
            </div>
          );
      }
    };

    const getSubLabel = () => {
      switch (activeTab) {
        case "conquest":
          const userRank = getRankFromPoints(
            leader.conquestStats?.rankPoints ?? 0
          );
          return userRank.rankName;
        case "score":
          return "Điểm";
        case "urCards":
          return "Thẻ UR";
      }
    };

    return (
      <button
        key={leader.oderId}
        onClick={() => handleViewProfile(leader.oderId)}
        className={`card-3d p-3 w-full text-left ${
          isCurrentUser ? "border-[var(--duo-green)] border-2" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Rank */}
          <div
            className={`w-10 h-10 rounded-xl ${rankStyle.bg} flex items-center justify-center`}
          >
            {RankIcon ? (
              <RankIcon className="w-5 h-5 text-white" />
            ) : (
              <span className="font-bold text-[var(--muted-foreground)]">
                {rank}
              </span>
            )}
          </div>

          {/* Avatar with frame */}
          <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
            {/* Frame layer - lớn hơn avatar */}
            {leader.equippedFrame && (
              <img
                src={getFullImage(leader.equippedFrame, 80)}
                alt="Frame"
                className="absolute inset-0 w-[60px] h-[60px] object-contain z-10 pointer-events-none"
                referrerPolicy="no-referrer"
              />
            )}
            {/* Avatar - nhỏ hơn frame */}
            <div className="w-8 h-8 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-xs overflow-hidden">
              {leader.equippedAvatar || leader.avatar ? (
                <img
                  src={
                    leader.equippedAvatar
                      ? getFullImage(leader.equippedAvatar, 80)
                      : leader.avatar
                  }
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                leader.odername?.charAt(0).toUpperCase() || "?"
              )}
            </div>
          </div>

          {/* Badge */}
          {leader.equippedBadge && (
            <div className="w-8 h-8 shrink-0">
              <img
                src={getFullImage(leader.equippedBadge, 60)}
                alt="Badge"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">
              {leader.odername || "Người chơi"}
              {isCurrentUser && (
                <span className="text-[var(--duo-green)] ml-1">(Bạn)</span>
              )}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[var(--duo-orange)]">
                <img
                  src="/AppAssets/Fire.png"
                  alt="streak"
                  className="w-4 h-4"
                />
                {leader.streak ?? 0}
              </span>
              <span className="text-[var(--muted-foreground)]">
                Lv.{leader.level ?? 1}
              </span>
            </div>
          </div>

          {/* Value */}
          <div className="text-right">
            {getValueDisplay()}
            <p className="text-xs text-[var(--muted-foreground)]">
              {getSubLabel()}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Info Bottom Sheet */}
      {showRewardInfo && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          onClick={() => setShowRewardInfo(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-[var(--card)] to-[var(--background)] rounded-t-[2rem] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--duo-yellow)] to-[var(--duo-orange)] flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[var(--duo-orange)]">
                    Phần thưởng BXH
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Nhận thưởng mỗi ngày theo thứ hạng
                  </p>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="px-5 pb-4">
              <div className="bg-[var(--secondary)]/50 rounded-2xl p-3">
                <p className="text-sm text-[var(--muted-foreground)] text-center">
                  Phần thưởng được gửi vào{" "}
                  <span className="text-[var(--duo-orange)] font-bold">
                    Hòm thư
                  </span>{" "}
                  mỗi ngày dựa trên thứ hạng của bạn.
                </p>
              </div>
            </div>

            {/* Rewards list */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              <div className="space-y-4">
                {Object.entries(LEADERBOARD_REWARDS).map(([key, category]) => (
                  <div key={key} className="space-y-2">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                      {key === "conquest" && (
                        <Swords className="w-4 h-4 text-[var(--duo-purple)]" />
                      )}
                      {key === "score" && (
                        <Trophy className="w-4 h-4 text-[var(--duo-yellow)]" />
                      )}
                      {key === "urCards" && (
                        <Sparkles className="w-4 h-4 text-[var(--duo-orange)]" />
                      )}
                      {category.name}
                    </h3>
                    <div className="space-y-1.5">
                      {category.rewards.map((reward, idx) => {
                        const getRankIcon = () => {
                          if (reward.icon === "crown")
                            return (
                              <Crown className="w-4 h-4 text-[var(--duo-yellow)]" />
                            );
                          if (reward.icon === "medal")
                            return <Medal className="w-4 h-4 text-gray-400" />;
                          if (reward.icon === "trophy")
                            return (
                              <Trophy className="w-4 h-4 text-amber-600" />
                            );
                          return (
                            <Sparkles className="w-4 h-4 text-[var(--duo-blue)]" />
                          );
                        };
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-[var(--secondary)] rounded-xl px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2">
                              {getRankIcon()}
                              <span className="text-sm text-foreground font-medium">
                                {typeof reward.rank === "number"
                                  ? `Top ${reward.rank}`
                                  : `Top ${reward.rank[0]}-${reward.rank[1]}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <img
                                src="/AppAssets/BlueDiamond.png"
                                alt="gem"
                                className="w-5 h-5"
                              />
                              <span className="font-bold text-[var(--duo-blue)]">
                                +{reward.gems}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Button */}
            <div className="px-5 pb-6">
              <button
                onClick={() => setShowRewardInfo(false)}
                className="btn-3d btn-3d-orange w-full py-3"
              >
                Đã hiểu!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Fixed */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r ${getTabColor()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-white" />
            <h1 className="font-bold text-xl text-white">Bảng xếp hạng</h1>
          </div>
          <button
            onClick={() => setShowRewardInfo(true)}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
          Top người chơi • Nhấn <Info className="w-3 h-3 inline" /> xem phần
          thưởng
        </p>
      </div>

      {/* Tabs - Fixed below header */}
      <div className="fixed top-[124px] left-0 right-0 z-40 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("conquest")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "conquest"
                ? "bg-[var(--duo-purple)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Swords className="w-4 h-4" />
            Chinh Chiến
          </button>
          <button
            onClick={() => setActiveTab("score")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "score"
                ? "bg-[var(--duo-yellow)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Điểm Tổng
          </button>
          <button
            onClick={() => setActiveTab("urCards")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "urCards"
                ? "bg-[var(--duo-orange)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Thẻ UR
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-[188px] pb-28">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[var(--duo-green)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">Đang tải...</p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
            <p className="text-[var(--muted-foreground)]">Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((leader, index) => renderLeaderItem(leader, index))}
          </div>
        )}
      </div>
    </Page>
  );
}

export default LeaderboardPage;
