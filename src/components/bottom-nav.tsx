import { useLocation, useNavigate } from "zmp-ui";
import { Home, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Trang chủ" },
  { path: "/leaderboard", icon: Trophy, label: "Xếp hạng" },
  { path: "/settings", icon: Settings, label: "Cài đặt" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on quiz page
  if (location.pathname === "/quiz") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="bg-[var(--card)] border-t-2 border-[var(--border)]">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all",
                  isActive
                    ? "text-[var(--duo-green)]"
                    : "text-[var(--muted-foreground)]"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isActive && "bg-[var(--duo-green)]/20"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
