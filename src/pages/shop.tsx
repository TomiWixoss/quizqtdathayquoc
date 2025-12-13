import { Page } from "zmp-ui";
import { Gift, Clock, Sparkles } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useNavigate } from "zmp-ui";
import { useState, useEffect } from "react";
import { RewardModal } from "@/components/ui/reward-modal";
import confetti from "canvas-confetti";

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
  const [showUnlimitedModal, setShowUnlimitedModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);

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
    if ((user?.gems ?? 0) < 1000) {
      alert("Không đủ gems! Cần 1000 gems.");
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
                onClick={handleBuyUnlimitedHearts}
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
    </Page>
  );
}

export default ShopPage;
