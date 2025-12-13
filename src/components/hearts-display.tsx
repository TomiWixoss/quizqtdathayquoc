import { useUserStore } from "@/stores/user-store";
import { Infinity } from "lucide-react";
import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/utils";

export function HeartsDisplay() {
  const {
    user,
    refillHearts,
    spendGems,
    hasUnlimitedHearts,
    getUnlimitedHeartsTimeLeft,
  } = useUserStore();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const isUnlimited = hasUnlimitedHearts();

  // Update timer every second
  useEffect(() => {
    if (!isUnlimited) {
      setTimeLeft(null);
      return;
    }
    const updateTimer = () => {
      setTimeLeft(getUnlimitedHeartsTimeLeft());
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isUnlimited, getUnlimitedHeartsTimeLeft]);

  if (!user) return null;

  const handleRefill = async () => {
    if (user.hearts < user.maxHearts && user.gems >= 500) {
      const success = await spendGems(500);
      if (success) {
        await refillHearts();
      }
    }
  };

  // Hiển thị tim vô hạn
  if (isUnlimited) {
    return (
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-[var(--duo-red)] to-[var(--duo-pink)] px-2.5 py-1 rounded-full">
        <img src="/AppAssets/Heart.png" alt="heart" className="w-5 h-5" />
        <Infinity className="w-4 h-4 text-white" />
        {timeLeft && (
          <span className="text-xs text-white font-bold ml-1">{timeLeft}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[...Array(user.maxHearts)].map((_, i) => (
        <img
          key={i}
          src="/AppAssets/Heart.png"
          alt="heart"
          className={`w-5 h-5 ${
            i >= user.hearts ? "opacity-30 grayscale" : ""
          }`}
        />
      ))}
      {user.hearts < user.maxHearts && (
        <button
          onClick={handleRefill}
          className="ml-2 flex items-center gap-1 text-xs bg-[var(--duo-blue)] text-white px-2 py-1 rounded-full"
        >
          <img src="/AppAssets/BlueDiamond.png" alt="gem" className="w-3 h-3" />
          500
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
      <img src="/AppAssets/BlueDiamond.png" alt="gem" className="w-5 h-5" />
      <span className="font-bold text-[var(--duo-blue)]">
        {formatNumber(user.gems)}
      </span>
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
