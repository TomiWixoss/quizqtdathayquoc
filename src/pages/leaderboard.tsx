import { Page } from "zmp-ui";
import { Trophy, Crown, Medal, Swords, Gem } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserStore } from "@/stores/user-store";
import { getRankImage, getRankFromPoints } from "@/services/ai-quiz-service";
import type { UserStats } from "@/types/quiz";

type TabType = "conquest" | "score" | "gems";

function LeaderboardPage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>("conquest");
  const [leaders, setLeaders] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        let orderField = "totalScore";
        if (activeTab === "conquest") {
          orderField = "conquestStats.rankPoints";
        } else if (activeTab === "gems") {
          orderField = "gems";
        }

        const q = query(
          collection(db, "users"),
          orderBy(orderField, "desc"),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data() as UserStats);
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
      case "gems":
        return "from-[var(--duo-blue)] to-[var(--duo-green)]";
    }
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
          return leader.totalScore ?? 0;
        case "gems":
          return leader.gems ?? 0;
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
                {value}
              </span>
            </div>
          );
        case "score":
          return (
            <div className="flex items-center gap-1 text-[var(--duo-yellow)]">
              <Trophy className="w-5 h-5" />
              <span className="font-bold text-lg">{value}</span>
            </div>
          );
        case "gems":
          return (
            <div className="flex items-center gap-1 text-[var(--duo-blue)]">
              <img src="/AppAssets/BlueDiamond.png" alt="gem" className="w-5 h-5" />
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
        case "gems":
          return "Gems";
      }
    };

    return (
      <div
        key={leader.oderId}
        className={`card-3d p-3 ${
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

          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
            {leader.avatar ? (
              <img
                src={leader.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              leader.odername?.charAt(0).toUpperCase() || "?"
            )}
          </div>

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
                <img src="/AppAssets/Fire.png" alt="streak" className="w-4 h-4" />
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
      </div>
    );
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className={`pt-16 pb-4 px-4 bg-gradient-to-r ${getTabColor()}`}>
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Bảng xếp hạng</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 bg-[var(--card)] border-b border-[var(--border)]">
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
            onClick={() => setActiveTab("gems")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "gems"
                ? "bg-[var(--duo-blue)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Gem className="w-4 h-4" />
            Độ Giàu
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28">
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
