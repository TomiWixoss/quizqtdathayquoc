import { Page } from "@/components/ui/page";
import { useNavigate } from "react-router-dom";
import { Gift, Clock, Sparkles, Zap, Snowflake, ArrowLeft } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState, useEffect } from "react";
import { RewardModal } from "@/components/ui/reward-modal";
import confetti from "canvas-confetti";
import { formatNumber } from "@/lib/utils";

function ShopPage() {
  const navigate = useNavigate();
  const {
    user,
    spendGems,
    refillHearts,
    buyUnlimitedHearts,
    hasUnlimitedHearts,
    getUnlimitedHeartsTimeLeft,
    buyXPBoost,
    hasXPBoost,
    getXPBoostTimeLeft,
    buyStreakFreeze,
    getStreakFreezeCount,
  } = useUserStore();
  const [nextHeartTime, setNextHeartTime] = useState<string | null>(null);
  const [unlimitedTimeLeft, setUnlimitedTimeLeft] = useState<string | null>(
    null
  );
  const [xpBoostTimeLeft, setXpBoostTimeLeft] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showUnlimitedModal, setShowUnlimitedModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showXPBoostModal, setShowXPBoostModal] = useState(false);
  const [showStreakFreezeModal, setShowStreakFreezeModal] = useState(false);
  const [purchasedXPHours, setPurchasedXPHours] = useState(0);

  // Realtime timer for next heart, unlimited hearts, and XP boost
  useEffect(() => {
    const updateTimer = () => {
      // Update unlimited hearts timer
      const timeLeft = getUnlimitedHeartsTimeLeft();
      setUnlimitedTimeLeft(timeLeft);

      // Update XP boost timer
      const xpTimeLeft = getXPBoostTimeLeft();
      setXpBoostTimeLeft(xpTimeLeft);

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
    getXPBoostTimeLeft,
  ]);

  const handleBuyFullHearts = async () => {
    if (!user) return;
    if (user.gems < 500) {
      alert("Không đủ gems!");
      return;
    }
    const success = await spendGems(500);
    if (success) {
      await refillHearts();
      setShowRefillModal(true);
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#ff4b4b", "#ff6b6b", "#ffc800"],
      });
    }
  };

  const handleBuyUnlimitedHearts = async () => {
    if ((user?.gems ?? 0) < 3000) {
      alert("Không đủ gems! Cần 3000 gems.");
      return;
    }
    setIsPurchasing(true);
    const success = await buyUnlimitedHearts();
    setIsPurchasing(false);
    if (success) {
      setShowUnlimitedModal(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ffc800", "#ff9600", "#ce82ff"],
      });
    } else {
      alert("Có lỗi xảy ra!");
    }
  };

  const handleBuyXPBoost = async (hours: number) => {
    const prices: Record<number, number> = { 1: 500, 3: 1200, 8: 2500 };
    const cost = prices[hours];
    if ((user?.gems ?? 0) < cost) {
      alert(`Không đủ gems! Cần ${cost} gems.`);
      return;
    }
    setIsPurchasing(true);
    const success = await buyXPBoost(hours);
    setIsPurchasing(false);
    if (success) {
      setPurchasedXPHours(hours);
      setShowXPBoostModal(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#58cc02", "#89e219", "#ffc800"],
      });
    } else {
      alert("Có lỗi xảy ra!");
    }
  };

  const handleBuyStreakFreeze = async () => {
    if ((user?.gems ?? 0) < 1000) {
      alert("Không đủ gems! Cần 1000 gems.");
      return;
    }
    if (getStreakFreezeCount() >= 5) {
      alert("Bạn đã có tối đa 5 Streak Freeze!");
      return;
    }
    setIsPurchasing(true);
    const success = await buyStreakFreeze();
    setIsPurchasing(false);
    if (success) {
      setShowStreakFreezeModal(true);
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#1cb0f6", "#84d8ff", "#ffffff"],
      });
    } else {
      alert("Có lỗi xảy ra!");
    }
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-4 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/settings")}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-white" />
              <h1 className="font-bold text-xl text-white">Cửa hàng</h1>
            </div>
            <p className="text-white/80 text-sm mt-1">
              Mua vật phẩm hỗ trợ học tập
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-32 pb-28 space-y-4">
        {/* Currency Display */}
        {user && (
          <div className="card-3d p-4">
            <div className="flex items-center justify-around">
              <div className="flex items-center gap-2">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-6 h-6"
                />
                <div>
                  <p className="font-bold text-lg text-[var(--duo-blue)]">
                    {formatNumber(user.gems ?? 0)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">Gems</p>
                </div>
              </div>
              <div className="w-px h-10 bg-[var(--border)]" />
              {hasUnlimitedHearts() ? (
                <div className="flex items-center gap-2">
                  <img
                    src="/AppAssets/Heart.png"
                    alt="heart"
                    className="w-6 h-6"
                  />
                  <div>
                    <p className="font-bold text-lg text-[var(--duo-red)]">∞</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Tim vô hạn
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <img
                    src="/AppAssets/Heart.png"
                    alt="heart"
                    className="w-6 h-6"
                  />
                  <div>
                    <p className="font-bold text-lg text-[var(--duo-red)]">
                      {user.hearts ?? 5}/{user.maxHearts ?? 5}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Tim
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
              (user.gems ?? 0) >= 500 && (
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
                    <span className="font-bold">500</span>
                  </div>
                </button>
              )}

            {/* Show disabled state when not enough gems */}
            {user &&
              (user.hearts ?? 5) < (user.maxHearts ?? 5) &&
              (user.gems ?? 0) < 500 && (
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
                onClick={handleBuyUnlimitedHearts}
                disabled={isPurchasing || (user?.gems ?? 0) < 3000}
                className={`card-3d p-4 text-center ${
                  (user?.gems ?? 0) < 3000 ? "opacity-50" : ""
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
                  <span className="font-bold">3000</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* XP Boost Section */}
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--duo-green)]" />
            XP Boost (x2)
          </h2>

          {/* Active XP Boost indicator */}
          {hasXPBoost() && (
            <div className="card-3d p-3 mb-3 flex items-center justify-between border-2 border-[var(--duo-green)]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--duo-green)] animate-pulse" />
                <span className="text-sm font-bold text-[var(--duo-green)]">
                  XP x2 đang hoạt động!
                </span>
              </div>
              <span className="font-bold text-[var(--duo-green)]">
                {xpBoostTimeLeft}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {/* 1 hour XP Boost */}
            <button
              onClick={() => handleBuyXPBoost(1)}
              disabled={isPurchasing || (user?.gems ?? 0) < 500}
              className={`card-3d p-3 text-center ${
                (user?.gems ?? 0) < 500 ? "opacity-50" : ""
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--duo-green)]/20 flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-[var(--duo-green)]" />
              </div>
              <p className="font-bold text-foreground text-sm mb-1">1 giờ</p>
              <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-3 h-3"
                />
                <span className="font-bold text-xs">500</span>
              </div>
            </button>

            {/* 3 hours XP Boost */}
            <button
              onClick={() => handleBuyXPBoost(3)}
              disabled={isPurchasing || (user?.gems ?? 0) < 1200}
              className={`card-3d p-3 text-center ${
                (user?.gems ?? 0) < 1200 ? "opacity-50" : ""
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--duo-green)]/20 flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-[var(--duo-green)]" />
              </div>
              <p className="font-bold text-foreground text-sm mb-1">3 giờ</p>
              <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-3 h-3"
                />
                <span className="font-bold text-xs">1200</span>
              </div>
            </button>

            {/* 8 hours XP Boost */}
            <button
              onClick={() => handleBuyXPBoost(8)}
              disabled={isPurchasing || (user?.gems ?? 0) < 2500}
              className={`card-3d p-3 text-center ${
                (user?.gems ?? 0) < 2500 ? "opacity-50" : ""
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--duo-green)]/20 flex items-center justify-center mb-2 relative">
                <Zap className="w-5 h-5 text-[var(--duo-green)]" />
                <span className="absolute -top-1 -right-1 bg-[var(--duo-orange)] text-white text-[8px] px-1 rounded-full font-bold">
                  HOT
                </span>
              </div>
              <p className="font-bold text-foreground text-sm mb-1">8 giờ</p>
              <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-3 h-3"
                />
                <span className="font-bold text-xs">2500</span>
              </div>
            </button>
          </div>
        </div>

        {/* Streak Freeze Section */}
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-[var(--duo-blue)]" />
            Streak Freeze
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Current Streak Freeze count */}
            <div className="card-3d p-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-blue)]/20 flex items-center justify-center mb-2">
                <Snowflake className="w-6 h-6 text-[var(--duo-blue)]" />
              </div>
              <p className="font-bold text-foreground mb-1">Đang có</p>
              <p className="text-lg font-bold text-[var(--duo-blue)]">
                {getStreakFreezeCount()}/5
              </p>
            </div>

            {/* Buy Streak Freeze */}
            <button
              onClick={handleBuyStreakFreeze}
              disabled={
                isPurchasing ||
                (user?.gems ?? 0) < 1000 ||
                getStreakFreezeCount() >= 5
              }
              className={`card-3d p-4 text-center ${
                (user?.gems ?? 0) < 1000 || getStreakFreezeCount() >= 5
                  ? "opacity-50"
                  : ""
              }`}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--duo-blue)]/20 flex items-center justify-center mb-2">
                <Snowflake className="w-6 h-6 text-[var(--duo-blue)]" />
              </div>
              <p className="font-bold text-foreground mb-1">Mua thêm</p>
              <div className="flex items-center justify-center gap-1 text-[var(--duo-blue)]">
                <img
                  src="/AppAssets/BlueDiamond.png"
                  alt="gem"
                  className="w-4 h-4"
                />
                <span className="font-bold">1000</span>
              </div>
            </button>
          </div>

          <p className="text-xs text-[var(--muted-foreground)] mt-2 text-center">
            Streak Freeze tự động bảo vệ streak khi bạn quên học 1 ngày
          </p>
        </div>
      </div>

      {/* Reward Modal for Unlimited Hearts */}
      <RewardModal
        isOpen={showUnlimitedModal}
        onClose={() => setShowUnlimitedModal(false)}
        title="Tim vô hạn đã kích hoạt!"
        subtitle="Bạn có thể học không giới hạn trong 24 giờ"
        rewards={[
          {
            type: "custom",
            amount: 24,
            icon: "/AppAssets/Heart.png",
            label: "giờ tim vô hạn ∞",
          },
        ]}
        buttonText="Tuyệt vời!"
        gradientFrom="var(--duo-yellow)"
        gradientTo="var(--duo-orange)"
      />

      {/* Reward Modal for Heart Refill */}
      <RewardModal
        isOpen={showRefillModal}
        onClose={() => setShowRefillModal(false)}
        title="Hồi tim thành công!"
        subtitle="Tim của bạn đã được hồi đầy"
        rewards={[
          {
            type: "hearts",
            amount: 5,
            label: "Tim",
          },
        ]}
        buttonText="Tiếp tục học!"
        gradientFrom="var(--duo-red)"
        gradientTo="var(--duo-pink)"
      />

      {/* Reward Modal for XP Boost */}
      <RewardModal
        isOpen={showXPBoostModal}
        onClose={() => setShowXPBoostModal(false)}
        title="XP Boost đã kích hoạt!"
        subtitle={`Nhận x2 XP trong ${purchasedXPHours} giờ tới`}
        rewards={[
          {
            type: "custom",
            amount: 2,
            icon: "/AppAssets/Lighting.png",
            label: `x XP trong ${purchasedXPHours}h`,
          },
        ]}
        buttonText="Học ngay!"
        gradientFrom="var(--duo-green)"
        gradientTo="#89e219"
      />

      {/* Reward Modal for Streak Freeze */}
      <RewardModal
        isOpen={showStreakFreezeModal}
        onClose={() => setShowStreakFreezeModal(false)}
        title="Mua Streak Freeze thành công!"
        subtitle="Streak của bạn sẽ được bảo vệ khi quên học"
        rewards={[
          {
            type: "custom",
            amount: getStreakFreezeCount(),
            icon: "/AppAssets/Fire.png",
            label: "Streak Freeze",
          },
        ]}
        buttonText="Tuyệt vời!"
        gradientFrom="var(--duo-blue)"
        gradientTo="#84d8ff"
      />
    </Page>
  );
}

export default ShopPage;
