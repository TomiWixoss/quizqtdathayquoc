import { Heart, Gem } from "lucide-react";
import { useUserStore } from "@/stores/user-store";

export function HeartsDisplay() {
  const { user, refillHearts, spendGems } = useUserStore();
  if (!user) return null;

  const handleRefill = async () => {
    if (user.hearts < user.maxHearts && user.gems >= 50) {
      const success = await spendGems(50);
      if (success) {
        await refillHearts();
      }
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(user.maxHearts)].map((_, i) => (
        <Heart
          key={i}
          className={`w-5 h-5 ${
            i < user.hearts
              ? "text-[var(--duo-red)] fill-[var(--duo-red)]"
              : "text-[var(--muted-foreground)]"
          }`}
        />
      ))}
      {user.hearts < user.maxHearts && (
        <button
          onClick={handleRefill}
          className="ml-2 flex items-center gap-1 text-xs bg-[var(--duo-blue)] text-white px-2 py-1 rounded-full"
        >
          <Gem className="w-3 h-3" />
          50
        </button>
      )}
    </div>
  );
}

export function GemsDisplay() {
  const { user } = useUserStore();
  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      <Gem className="w-5 h-5 text-[var(--duo-blue)]" />
      <span className="font-bold text-[var(--duo-blue)]">{user.gems}</span>
    </div>
  );
}

export function DailyGoalDisplay() {
  const { user } = useUserStore();
  if (!user) return null;

  const progress = Math.min((user.dailyProgress / user.dailyGoal) * 100, 100);
  const completed = user.dailyProgress >= user.dailyGoal;

  return (
    <div className="card-3d p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-foreground">Mục tiêu hôm nay</span>
        <span
          className={`font-bold ${
            completed
              ? "text-[var(--duo-green)]"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {user.dailyProgress}/{user.dailyGoal} XP
        </span>
      </div>
      <div className="progress-duo h-3">
        <div
          className="progress-duo-fill"
          style={{
            width: `${progress}%`,
            background: completed ? "var(--duo-yellow)" : undefined,
          }}
        />
      </div>
      {completed && (
        <p className="text-xs text-[var(--duo-green)] mt-2 text-center font-semibold">
          🎉 Hoàn thành mục tiêu!
        </p>
      )}
    </div>
  );
}
