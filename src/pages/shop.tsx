import { Page } from "zmp-ui";
import { Heart, Gem, Zap, Gift, Clock, Sparkles } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useNavigate } from "zmp-ui";
import { useState, useEffect } from "react";

function ShopPage() {
  const navigate = useNavigate();
  const { user, spendGems, refillHearts } = useUserStore();
  const [nextHeartTime, setNextHeartTime] = useState<string | null>(null);

  // Realtime timer for next heart
  useEffect(() => {
    const updateTimer = () => {
      if (!user?.lastHeartRefill) {
        setNextHeartTime(null);
        return;
      }
      if ((user.hearts ?? 5) >= (user.maxHearts ?? 5)) {
        setNextHeartTime(null);
        return;
      }

      const lastRefill = new Date(user.lastHeartRefill).getTime();
      const now = Date.now();
      const nextRefill = lastRefill + 30 * 60 * 1000;
      const remaining = Math.max(0, nextRefill - now);

      if (remaining <= 0) {
        setNextHeartTime("Sắp có!");
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setNextHeartTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user?.lastHeartRefill, user?.hearts, user?.maxHearts]);

  const handleBuyFullHearts = async () => {
    if (!user) return;
    if (user.gems < 50) {
      alert("Không đủ gems!");
      return;
    }
    const success = await spendGems(50);
    if (success) {
      await refillHearts();
      alert("Đã hồi đầy tim!");
    }
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)]">
        <div className="flex items-center gap-2">
          <Gift className="w-6 h-6 text-white" />
          <h1 className="font-bold text-xl text-white">Cửa hàng</h1>
        </div>
        {user && (
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
              <Gem className="w-4 h-4 text-white" />
              <span className="font-bold text-white">{user.gems ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
              <Heart className="w-4 h-4 text-white fill-white" />
              <span className="font-bold text-white">
                {user.hearts ?? 5}/{user.maxHearts ?? 5}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28 space-y-4">
        {/* Hearts Section */}
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[var(--duo-red)]" />
            Tim
          </h2>

          {/* Next heart timer */}
          {user && (user.hearts ?? 5) < (user.maxHearts ?? 5) && (
            <div className="card-3d p-3 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--duo-blue)]" />
                <span className="text-sm text-foreground">Tim tiếp theo</span>
              </div>
              <span className="font-bold text-[var(--duo-blue)]">
                {nextHeartTime}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Refill all hearts - hide if full hearts or not enough gems */}
            {user &&
              (user.hearts ?? 5) < (user.maxHearts ?? 5) &&
              (user.gems ?? 0) >= 50 && (
                <button
                  onClick={handleBuyFullHearts}
                  className="card-3d p-4 text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-red)]/20 flex items-center justify-center mb-2">
                    <Heart className="w-6 h-6 text-[var(--duo-red)] fill-[var(--duo-red)]" />
                  </div>
                  <p className="font-bold text-foreground mb-1">Hồi đầy tim</p>
                  <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
                    <Gem className="w-4 h-4" />
                    <span className="font-bold">50</span>
                  </div>
                </button>
              )}

            {/* Show disabled state when not enough gems */}
            {user &&
              (user.hearts ?? 5) < (user.maxHearts ?? 5) &&
              (user.gems ?? 0) < 50 && (
                <div className="card-3d p-4 text-center opacity-50">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-red)]/20 flex items-center justify-center mb-2">
                    <Heart className="w-6 h-6 text-[var(--duo-red)] fill-[var(--duo-red)]" />
                  </div>
                  <p className="font-bold text-foreground mb-1">Hồi đầy tim</p>
                  <div className="flex items-center justify-center gap-1 text-[var(--duo-red)]">
                    <Gem className="w-4 h-4" />
                    <span className="font-bold">Thiếu gems</span>
                  </div>
                </div>
              )}

            {/* Show full hearts message */}
            {user && (user.hearts ?? 5) >= (user.maxHearts ?? 5) && (
              <div className="card-3d p-4 text-center opacity-50">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-green)]/20 flex items-center justify-center mb-2">
                  <Heart className="w-6 h-6 text-[var(--duo-green)] fill-[var(--duo-green)]" />
                </div>
                <p className="font-bold text-foreground mb-1">Tim đã đầy</p>
                <p className="text-xs text-[var(--duo-green)]">5/5</p>
              </div>
            )}

            {/* Unlimited hearts (1 hour) */}
            <button
              onClick={() => alert("Tính năng sắp ra mắt!")}
              className="card-3d p-4 text-center opacity-60"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-yellow)]/20 flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6 text-[var(--duo-yellow)]" />
              </div>
              <p className="font-bold text-foreground mb-1">Tim vô hạn 1h</p>
              <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
                <Gem className="w-4 h-4" />
                <span className="font-bold">100</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mini Games Section */}
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--duo-yellow)]" />
            Mini Game - Nhận tim miễn phí
          </h2>

          <div className="space-y-3">
            {/* Spin wheel */}
            <button
              onClick={() => navigate("/minigame")}
              className="card-3d p-4 w-full flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--duo-orange)] to-[var(--duo-red)] flex items-center justify-center">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-foreground">Vòng quay may mắn</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Quay mỗi 4 giờ - Nhận tim, gems, XP
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--duo-green)] text-white text-xs font-bold">
                Chơi
              </div>
            </button>
          </div>
        </div>

        {/* Gems Packages */}
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <Gem className="w-4 h-4 text-[var(--duo-blue)]" />
            Gói Gems (Sắp ra mắt)
          </h2>

          <div className="grid grid-cols-3 gap-2">
            {[
              { gems: 100, price: "10K" },
              { gems: 500, price: "45K" },
              { gems: 1000, price: "80K" },
            ].map((pkg) => (
              <button
                key={pkg.gems}
                className="card-3d p-3 text-center opacity-50"
                disabled
              >
                <Gem className="w-8 h-8 text-[var(--duo-blue)] mx-auto mb-1" />
                <p className="font-bold text-foreground">{pkg.gems}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {pkg.price}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}

export default ShopPage;
