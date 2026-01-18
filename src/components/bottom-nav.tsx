import { useLocation, useNavigate } from "react-router-dom";
import { Home, Trophy, Sparkles, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConquestStore } from "@/stores/conquest-store";
import { useTowerStore } from "@/stores/tower-store";

const navItems = [
  { path: "/", icon: Home, label: "Trang chủ" },
  { path: "/leaderboard", icon: Trophy, label: "Xếp hạng" },
  { path: "/gacha", icon: Sparkles, label: "Gacha" },
  { path: "/events", icon: Calendar, label: "Sự kiện" },
  { path: "/settings", icon: User, label: "Tôi" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isActive: isConquestActive } = useConquestStore();
  const { activeFloor } = useTowerStore();

  // Hide on quiz pages, during conquest quiz, gacha detail pages, and tower quiz
  if (
    location.pathname === "/quiz" ||
    (location.pathname === "/conquest" && isConquestActive) ||
    location.pathname.startsWith("/gacha/") ||
    (location.pathname === "/event-tower" && activeFloor)
  )
    return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-[var(--card)] border-t-2 border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-1 px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl min-w-0",
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
                <span className="text-[10px] font-semibold whitespace-nowrap truncate max-w-full px-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
