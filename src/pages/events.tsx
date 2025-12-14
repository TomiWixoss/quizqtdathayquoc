import { Page } from "zmp-ui";
import { useNavigate } from "zmp-ui";
import {
  Calendar,
  Gift,
  ChevronRight,
  CalendarCheck,
  Trophy,
  Flame,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Phần thưởng theo cấp độ (để check)
const LEVEL_REWARDS = [5, 10, 15, 20, 25, 30, 40, 50];

// Định nghĩa các sự kiện
const EVENTS = [
  {
    id: "login-7days",
    title: "Đăng nhập 7 ngày",
    description: "Nhận thưởng mỗi ngày đăng nhập",
    icon: CalendarCheck,
    color: "var(--duo-green)",
    bgColor: "var(--duo-green)",
    route: "/event-login-7days",
    badge: "Hàng ngày",
  },
  {
    id: "level-rewards",
    title: "Thưởng cấp độ",
    description: "Nhận quà khi đạt cấp độ mới",
    icon: Trophy,
    color: "var(--duo-purple)",
    bgColor: "var(--duo-purple)",
    route: "/event-level-rewards",
    badge: "Vĩnh viễn",
  },
  {
    id: "tower",
    title: "Tháp Luyện Ngục",
    description: "Leo tháp, sai 1 câu là rơi xuống đáy!",
    icon: Flame,
    color: "#8B5CF6",
    bgColor: "#8B5CF6",
    route: "/event-tower",
    badge: "Thử thách",
  },
];

function EventsPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [rewardCounts, setRewardCounts] = useState<Record<string, number>>({});

  // Check số quà chưa nhận cho mỗi event
  useEffect(() => {
    const checkRewards = async () => {
      if (!user?.oderId) return;

      try {
        const userRef = doc(db, "users", user.oderId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const data = userSnap.data();
        const counts: Record<string, number> = {};

        // Check login 7 days
        const loginEvent = data.loginEvent || {
          claimedDays: [],
          lastClaimDate: "",
        };
        const today = new Date().toDateString();
        const canClaimLogin =
          loginEvent.lastClaimDate !== today &&
          loginEvent.claimedDays.length < 7;
        if (canClaimLogin) counts["login-7days"] = 1;

        // Check level rewards
        const claimedLevels = data.claimedLevelRewards || [];
        const userLevel = user.level || 1;
        const availableLevelRewards = LEVEL_REWARDS.filter(
          (level) => userLevel >= level && !claimedLevels.includes(level)
        ).length;
        if (availableLevelRewards > 0)
          counts["level-rewards"] = availableLevelRewards;

        setRewardCounts(counts);
      } catch (error) {
        console.error("Error checking rewards:", error);
      }
    };

    checkRewards();
  }, [user?.oderId, user?.level]);

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[var(--duo-orange)] to-[var(--duo-yellow)]">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Sự kiện</h1>
        </div>
        <p className="text-white/80 text-sm mt-1">Các sự kiện đặc biệt</p>
      </div>

      {/* Content */}
      <div className="px-4 pt-32 pb-28">
        {/* Events List */}
        <div className="space-y-3">
          {EVENTS.map((event) => {
            const Icon = event.icon;
            const rewardCount = rewardCounts[event.id] || 0;
            return (
              <button
                key={event.id}
                onClick={() => navigate(event.route)}
                className={`w-full card-3d p-4 flex items-center gap-4 ${
                  rewardCount > 0 ? "border-2 border-[var(--duo-green)]" : ""
                }`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
                  style={{ backgroundColor: `${event.bgColor}20` }}
                >
                  <Icon className="w-7 h-7" style={{ color: event.color }} />
                  {/* Badge số quà chưa nhận */}
                  {rewardCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--duo-red)] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {rewardCount}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-foreground whitespace-nowrap">
                      {event.title}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                      style={{ backgroundColor: event.color }}
                    >
                      {event.badge}
                    </span>
                    {/* Badge "Có quà" */}
                    {rewardCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--duo-green)] text-white whitespace-nowrap flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        Có quà!
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {event.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>
            );
          })}
        </div>

        {/* Coming Soon */}
        <div className="mt-6 p-4 rounded-2xl bg-[var(--secondary)] border-2 border-dashed border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-[var(--muted-foreground)]" />
            <div>
              <p className="font-semibold text-foreground">
                Sắp có thêm sự kiện!
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Hãy quay lại sau nhé
              </p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

export default EventsPage;
