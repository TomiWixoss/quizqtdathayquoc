import { useLocation, useNavigate } from "zmp-ui";
import { Home, Trophy, Target, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConquestStore } from "@/stores/conquest-store";

const navItems = [
  { path: "/", icon: Home, label: "Trang chủ" },
  { path: "/leaderboard", icon: Trophy, label: "Xếp hạng" },
  { path: "/quests", icon: Target, label: "Nhiệm vụ" },
  { path: "/shop", icon: Gift, label: "Cửa hàng" },
  { path: "/settings", icon: User, label: "Tôi" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isActive: isConquestActive } = useConquestStore();

  // Hide on quiz, minigame pages, and during conquest quiz
  if (
    location.pathname === "/quiz" ||
    location.pathname === "/minigame" ||
    (location.pathname === "/conquest" && isConquestActive)
  )
    return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-[var(--card)] border-t-2 border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl",
                  isActive
                    ? "text-[var(--duo-green)]"
                    : "text-[var(--muted-foreground)]"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-xl",
                    isActive && "bg-[var(--duo-green)]/20"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
