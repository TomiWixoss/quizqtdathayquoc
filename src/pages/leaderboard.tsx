import { Page } from "zmp-ui";
import { Trophy, Crown, Medal, Flame, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserStore } from "@/stores/user-store";
import type { UserStats } from "@/types/quiz";

function LeaderboardPage() {
  const { user } = useUserStore();
  const [leaders, setLeaders] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, "users"),
          orderBy("totalScore", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data() as UserStats);
        setLeaders(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: "bg-[var(--duo-yellow)]", icon: Crown };
    if (rank === 2) return { bg: "bg-gray-400", icon: Medal };
    if (rank === 3) return { bg: "bg-amber-600", icon: Medal };
    return { bg: "bg-[var(--secondary)]", icon: null };
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-14 pb-4 px-4 bg-gradient-to-r from-[var(--duo-yellow)] to-[var(--duo-orange)]">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Bảng xếp hạng</h1>
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
            {leaders.map((leader, index) => {
              const rank = index + 1;
              const isCurrentUser = user?.oderId === leader.oderId;
              const rankStyle = getRankStyle(rank);
              const RankIcon = rankStyle.icon;

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
                        leader.odername.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {leader.odername}
                        {isCurrentUser && (
                          <span className="text-[var(--duo-green)] ml-1">
                            (Bạn)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-[var(--duo-orange)]">
                          <Flame className="w-3 h-3" />
                          {leader.streak}
                        </span>
                        <span className="text-[var(--muted-foreground)]">
                          Lv.{leader.level}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[var(--duo-yellow)]">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold text-lg">
                          {leader.totalScore}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        XP
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}

export default LeaderboardPage;
