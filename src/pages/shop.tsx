import { Page } from "zmp-ui";
import { Gift, Clock, Sparkles, Grid3X3, Brain, Grid2X2 } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useNavigate } from "zmp-ui";
import { useState, useEffect } from "react";

function ShopPage() {
  const navigate = useNavigate();
  const {
    user,
    spendGems,
    refillHearts,
    buyUnlimitedHearts,
    hasUnlimitedHearts,
    getUnlimitedHeartsTimeLeft,
  } = useUserStore();
  const [nextHeartTime, setNextHeartTime] = useState<string | null>(null);
  const [unlimitedTimeLeft, setUnlimitedTimeLeft] = useState<string | null>(
    null
  );
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Realtime timer for next heart and unlimited hearts
  useEffect(() => {
    const updateTimer = () => {
      // Update unlimited hearts timer
      const timeLeft = getUnlimitedHeartsTimeLeft();
      setUnlimitedTimeLeft(timeLeft);

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
  }, [
    user?.lastHeartRefill,
    user?.hearts,
    user?.maxHearts,
    getUnlimitedHeartsTimeLeft,
  ]);

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
              <img
                src="/AppAssets/BlueDiamond.png"
                alt="gem"
                className="w-4 h-4"
              />
              <span className="font-bold text-white">{user.gems ?? 0}</span>
            </div>
            {hasUnlimitedHearts() ? (
              <div className="flex items-center gap-1 bg-gradient-to-r from-[var(--duo-red)] to-[var(--duo-pink)] px-3 py-1.5 rounded-full">
                <img
                  src="/AppAssets/Heart.png"
                  alt="heart"
                  className="w-4 h-4"
                />
                <span className="font-bold text-white">∞</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
                <img
                  src="/AppAssets/Heart.png"
                  alt="heart"
                  className="w-4 h-4"
                />
                <span className="font-bold text-white">
                  {user.hearts ?? 5}/{user.maxHearts ?? 5}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28 space-y-4">
        {/* Hearts Section */}
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <img src="/AppAssets/Heart.png" alt="heart" className="w-4 h-4" />
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
                    <img
                      src="/AppAssets/Heart.png"
                      alt="heart"
                      className="w-8 h-8"
                    />
                  </div>
                  <p className="font-bold text-foreground mb-1">Hồi đầy tim</p>
                  <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
                    <img
                      src="/AppAssets/BlueDiamond.png"
                      alt="gem"
                      className="w-4 h-4"
                    />
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
                    <img
                      src="/AppAssets/Heart.png"
                      alt="heart"
                      className="w-8 h-8"
                    />
                  </div>
                  <p className="font-bold text-foreground mb-1">Hồi đầy tim</p>
                  <div className="flex items-center justify-center gap-1 text-[var(--duo-red)]">
                    <img
                      src="/AppAssets/BlueDiamond.png"
                      alt="gem"
                      className="w-4 h-4 grayscale"
                    />
                    <span className="font-bold">Thiếu gems</span>
                  </div>
                </div>
              )}

            {/* Show full hearts message */}
            {user && (user.hearts ?? 5) >= (user.maxHearts ?? 5) && (
              <div className="card-3d p-4 text-center opacity-50">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-green)]/20 flex items-center justify-center mb-2">
                  <img
                    src="/AppAssets/Heart.png"
                    alt="heart"
                    className="w-8 h-8"
                  />
                </div>
                <p className="font-bold text-foreground mb-1">Tim đã đầy</p>
                <p className="text-xs text-[var(--duo-green)]">5/5</p>
              </div>
            )}

            {/* Unlimited hearts (1 day) */}
            {hasUnlimitedHearts() ? (
              <div className="card-3d p-4 text-center border-2 border-[var(--duo-yellow)]">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-yellow)]/20 flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-[var(--duo-yellow)] animate-pulse" />
                </div>
                <p className="font-bold text-[var(--duo-yellow)] mb-1">
                  Tim vô hạn
                </p>
                <p className="text-xs text-[var(--duo-green)] font-bold">
                  Còn {unlimitedTimeLeft}
                </p>
              </div>
            ) : (
              <button
                onClick={async () => {
                  if ((user?.gems ?? 0) < 1000) {
                    alert("Không đủ gems! Cần 1000 gems.");
                    return;
                  }
                  setIsPurchasing(true);
                  const success = await buyUnlimitedHearts();
                  setIsPurchasing(false);
                  if (success) {
                    alert("Đã kích hoạt tim vô hạn trong 24 giờ!");
                  } else {
                    alert("Có lỗi xảy ra!");
                  }
                }}
                disabled={isPurchasing || (user?.gems ?? 0) < 1000}
                className={`card-3d p-4 text-center ${
                  (user?.gems ?? 0) < 1000 ? "opacity-50" : ""
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-yellow)]/20 flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-[var(--duo-yellow)]" />
                </div>
                <p className="font-bold text-foreground mb-1">Tim vô hạn 24h</p>
                <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
                  <img
                    src="/AppAssets/BlueDiamond.png"
                    alt="gem"
                    className="w-4 h-4"
                  />
                  <span className="font-bold">1000</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Mini Games Section */}
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <img src="/AppAssets/Lighting.png" alt="xp" className="w-4 h-4" />
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

            {/* Caro game */}
            <button
              onClick={() => navigate("/caro")}
              className="card-3d p-4 w-full flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--duo-purple)] to-[var(--duo-blue)] flex items-center justify-center">
                <Grid3X3 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-foreground">Caro vs AI</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Thắng AI để nhận gems
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--duo-blue)] text-white text-xs font-bold">
                Chơi
              </div>
            </button>

            {/* Memory game */}
            <button
              onClick={() => navigate("/memory-game")}
              className="card-3d p-4 w-full flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--duo-pink)] to-[var(--duo-purple)] flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-foreground">Trò chơi trí nhớ</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Lật thẻ tìm cặp - Nhận gems
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--duo-purple)] text-white text-xs font-bold">
                Chơi
              </div>
            </button>

            {/* 2048 game */}
            <button
              onClick={() => navigate("/game-2048")}
              className="card-3d p-4 w-full flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#edc22e] to-[#f2b179] flex items-center justify-center">
                <Grid2X2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-foreground">2048</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Gộp số để đạt 2048 - Nhận gems
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#edc22e] text-white text-xs font-bold">
                Mới
              </div>
            </button>
          </div>
        </div>

        {/* Gems Packages */}
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <img
              src="/AppAssets/BlueDiamond.png"
              alt="gem"
              className="w-4 h-4"
            />
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
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-8 h-8 mx-auto mb-1"
                />
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
