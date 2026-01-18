import { useLocation, useNavigate } from "react-router-dom";
import { Home, Trophy, Sparkles, Calendar, User, BookOpen } from "lucide-react";
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

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isActive: isConquestActive } = useConquestStore();
  const { activeFloor } = useTowerStore();

  // Hide logic similar to bottom nav, or maybe we keep sidebar always visible on PC? 
  // For now, let's keep it consistent: hide in specific "immersive" modes
  if (
    location.pathname === "/quiz" ||
    (location.pathname === "/conquest" && isConquestActive) ||
    // location.pathname.startsWith("/gacha/") || // Maybe keep sidebar on gacha detail on PC?
    (location.pathname === "/event-tower" && activeFloor)
  )
    return null;

  return (
    <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[var(--card)] border-r-2 border-[var(--border)] z-50 p-4">
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-[var(--duo-green)] flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-bold text-xl text-[var(--duo-green)] tracking-tight">
            Quiz QTDA
        </h1>
      </div>

      {/* Nav Items */}
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-[var(--duo-green)]/10 text-[var(--duo-green)] border-2 border-[var(--duo-green)]/20"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-foreground border-2 border-transparent"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
              <span className="font-bold text-sm uppercase tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Footer / Version info could go here */}
      <div className="mt-auto px-4 py-2">
         <p className="text-xs text-[var(--muted-foreground)] text-center">
            v1.0.0
         </p>
      </div>
    </div>
  );
}
