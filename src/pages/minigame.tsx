import { Page, useNavigate } from "zmp-ui";
import { ArrowLeft, Heart, Gem, Zap, Gift, Star } from "lucide-react";
// Keep Lucide icons for PRIZES array
import { useUserStore } from "@/stores/user-store";
import { useState, useRef } from "react";
import { RewardModal, RewardItem } from "@/components/ui/reward-modal";
import confetti from "canvas-confetti";

const PRIZES = [
  {
    id: 1,
    type: "heart",
    amount: 1,
    label: "1 Tim",
    color: "#ff4b4b",
    icon: Heart,
  },
  {
    id: 2,
    type: "gems",
    amount: 5,
    label: "5 Gems",
    color: "#1cb0f6",
    icon: Gem,
  },
  {
    id: 3,
    type: "xp",
    amount: 20,
    label: "20 XP",
    color: "#ffc800",
    icon: Zap,
  },
  {
    id: 4,
    type: "heart",
    amount: 2,
    label: "2 Tim",
    color: "#ff4b4b",
    icon: Heart,
  },
  {
    id: 5,
    type: "gems",
    amount: 10,
    label: "10 Gems",
    color: "#1cb0f6",
    icon: Gem,
  },
  {
    id: 6,
    type: "xp",
    amount: 50,
    label: "50 XP",
    color: "#ffc800",
    icon: Zap,
  },
  {
    id: 7,
    type: "gems",
    amount: 20,
    label: "20 Gems",
    color: "#ce82ff",
    icon: Star,
  },
  {
    id: 8,
    type: "heart",
    amount: 3,
    label: "3 Tim",
    color: "#58cc02",
    icon: Gift,
  },
];

function MinigamePage() {
  const navigate = useNavigate();
  const {
    user,
    addGems,
    refillHearts,
    spendGems,
    updateMinigameStats,
    hasUnlimitedHearts,
  } = useUserStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<(typeof PRIZES)[0] | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardItems, setRewardItems] = useState<RewardItem[]>([]);

  const SPIN_COST = 5; // 5 gems per spin
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (isSpinning) return;

    // Check if user has enough gems
    if ((user?.gems ?? 0) < SPIN_COST) {
      alert(`Không đủ gems! Cần ${SPIN_COST} gems để quay.`);
      return;
    }

    // Spend gems first
    const success = await spendGems(SPIN_COST);
    if (!success) {
      alert("Có lỗi xảy ra!");
      return;
    }

    setIsSpinning(true);
    setPrize(null);

    // Random prize (weighted)
    const weights = [20, 20, 15, 15, 12, 10, 5, 3]; // Lower = rarer
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let prizeIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        prizeIndex = i;
        break;
      }
    }

    const selectedPrize = PRIZES[prizeIndex];
    const segmentAngle = 360 / PRIZES.length;
    const targetAngle = 360 - prizeIndex * segmentAngle - segmentAngle / 2;
    const spins = 5; // Number of full rotations
    const finalRotation = rotation + spins * 360 + targetAngle;

    setRotation(finalRotation);

    // Wait for animation
    setTimeout(async () => {
      setPrize(selectedPrize);
      setIsSpinning(false);

      // Award prize
      let gemsEarned = 0;
      if (selectedPrize.type === "heart") {
        // Add hearts
        const currentHearts = user?.hearts ?? 5;
        const maxHearts = user?.maxHearts ?? 5;
        if (currentHearts < maxHearts) {
          await refillHearts(); // For simplicity, refill all
        }
        setRewardItems([{ type: "hearts", amount: selectedPrize.amount }]);
      } else if (selectedPrize.type === "gems") {
        await addGems(selectedPrize.amount);
        gemsEarned = selectedPrize.amount;
        setRewardItems([{ type: "gems", amount: selectedPrize.amount }]);
      } else if (selectedPrize.type === "xp") {
        setRewardItems([{ type: "xp", amount: selectedPrize.amount }]);
      }

      // Show reward modal
      setShowRewardModal(true);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#58cc02", "#ffc800", "#1cb0f6"],
      });

      // Update minigame stats
      await updateMinigameStats("spin", true, gemsEarned);
    }, 4000);
  };

  const canSpinNow = (user?.gems ?? 0) >= SPIN_COST;

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="pt-16 pb-4 px-4 bg-gradient-to-r from-[var(--duo-orange)] to-[var(--duo-red)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/shop")}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-bold text-xl text-white">Vòng quay may mắn</h1>
            <p className="text-white/80 text-xs">
              Mỗi lần quay tốn {SPIN_COST} gems
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 flex flex-col items-center">
        {/* Wheel */}
        <div className="relative w-72 h-72 mb-6">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-[var(--duo-yellow)]" />
          </div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full border-4 border-[var(--duo-yellow)] overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                : "none",
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {PRIZES.map((p, i) => {
                const angle = (360 / PRIZES.length) * i;
                const startAngle = (angle - 90) * (Math.PI / 180);
                const endAngle =
                  (angle + 360 / PRIZES.length - 90) * (Math.PI / 180);
                const x1 = 50 + 50 * Math.cos(startAngle);
                const y1 = 50 + 50 * Math.sin(startAngle);
                const x2 = 50 + 50 * Math.cos(endAngle);
                const y2 = 50 + 50 * Math.sin(endAngle);
                const largeArc = 360 / PRIZES.length > 180 ? 1 : 0;

                // Text position
                const midAngle =
                  (angle + 360 / PRIZES.length / 2 - 90) * (Math.PI / 180);
                const textX = 50 + 32 * Math.cos(midAngle);
                const textY = 50 + 32 * Math.sin(midAngle);
                const textRotation = angle + 360 / PRIZES.length / 2;

                return (
                  <g key={p.id}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={p.color}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Reward Modal */}
        <RewardModal
          isOpen={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          title="Chúc mừng!"
          subtitle={prize ? `Bạn nhận được ${prize.label}` : undefined}
          rewards={rewardItems}
          gradientFrom="var(--duo-orange)"
          gradientTo="var(--duo-red)"
        />

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || !canSpinNow}
          className={`btn-3d w-full max-w-xs py-4 text-lg flex items-center justify-center gap-2 ${
            isSpinning || !canSpinNow
              ? "bg-[var(--secondary)] text-[var(--muted-foreground)] shadow-[0_5px_0_var(--border)]"
              : "btn-3d-green"
          }`}
        >
          {isSpinning ? (
            "Đang quay..."
          ) : (
            <>
              <img
                src="/AppAssets/BlueDiamond.png"
                alt="gem"
                className="w-5 h-5"
              />
              Quay ({SPIN_COST} gems)
            </>
          )}
        </button>
        {!canSpinNow && !isSpinning && (
          <p className="text-sm text-[var(--duo-red)] mt-2">
            Không đủ gems để quay
          </p>
        )}

        {/* Stats */}
        {user && (
          <div className="flex items-center gap-4 mt-6">
            {hasUnlimitedHearts() ? (
              <div className="flex items-center gap-1 bg-gradient-to-r from-[var(--duo-red)] to-[var(--duo-pink)] px-2.5 py-1 rounded-full">
                <img
                  src="/AppAssets/Heart.png"
                  alt="heart"
                  className="w-5 h-5"
                />
                <span className="font-bold text-white">∞</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <img
                  src="/AppAssets/Heart.png"
                  alt="heart"
                  className="w-5 h-5"
                />
                <span className="font-bold">{user.hearts ?? 5}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <img
                src="/AppAssets/BlueDiamond.png"
                alt="gem"
                className="w-5 h-5"
              />
              <span className="font-bold">{user.gems ?? 0}</span>
            </div>
          </div>
        )}

        {/* Spin Stats */}
        {user?.minigameStats?.spin && (
          <div className="card-3d p-4 mt-4 w-full max-w-xs">
            <h3 className="font-bold text-foreground mb-3 text-center">
              Thống kê quay
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-[var(--duo-orange)]">
                  {user.minigameStats.spin.totalSpins}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Lần quay
                </p>
              </div>
              <div className="bg-[var(--secondary)] rounded-xl p-2 text-center">
                <p className="text-lg font-bold text-[var(--duo-blue)]">
                  {user.minigameStats.spin.totalGemsEarned}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Gems nhận
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

export default MinigamePage;
