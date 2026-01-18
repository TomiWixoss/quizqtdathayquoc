import { Page } from "@/components/ui/page";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarCheck, Gift, Check, Lock } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RewardModal } from "@/components/ui/reward-modal";
import confetti from "canvas-confetti";

// Phần thưởng cho 7 ngày đăng nhập (tăng đáng kể cho 233 gói thẻ)
const LOGIN_REWARDS = [
  { day: 1, gems: 50, label: "Ngày 1" },
  { day: 2, gems: 75, label: "Ngày 2" },
  { day: 3, gems: 100, label: "Ngày 3" },
  { day: 4, gems: 125, label: "Ngày 4" },
  { day: 5, gems: 150, label: "Ngày 5" },
  { day: 6, gems: 200, label: "Ngày 6" },
  { day: 7, gems: 500, label: "Ngày 7", special: true },
];

function EventLogin7DaysPage() {
  const navigate = useNavigate();
  const { user, addGems } = useUserStore();
  const [loginData, setLoginData] = useState<{
    currentDay: number;
    claimedDays: number[];
    lastClaimDate: string;
  }>({
    currentDay: 1,
    claimedDays: [],
    lastClaimDate: "",
  });
  const [claiming, setClaiming] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState(0);

  // Load login event data
  useEffect(() => {
    const loadLoginData = async () => {
      if (!user?.oderId) return;

      try {
        const userRef = doc(db, "users", user.oderId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const eventData = data.loginEvent || {
            currentDay: 1,
            claimedDays: [],
            lastClaimDate: "",
          };

          // Check if need to reset (new week or first time)
          const today = new Date().toDateString();
          const lastClaim = eventData.lastClaimDate;

          if (lastClaim) {
            const lastDate = new Date(lastClaim);
            const todayDate = new Date(today);
            const diffDays = Math.floor(
              (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Nếu bỏ lỡ hơn 1 ngày hoặc đã hoàn thành 7 ngày, reset
            if (diffDays > 1 || eventData.claimedDays.length >= 7) {
              setLoginData({
                currentDay: 1,
                claimedDays: [],
                lastClaimDate: "",
              });
              return;
            }

            // Nếu đã claim hôm nay
            if (lastDate.toDateString() === today) {
              setLoginData(eventData);
              return;
            }

            // Ngày mới, tăng currentDay
            setLoginData({
              ...eventData,
              currentDay: eventData.claimedDays.length + 1,
            });
          } else {
            setLoginData(eventData);
          }
        }
      } catch (error) {
        console.error("Error loading login data:", error);
      }
    };

    loadLoginData();
  }, [user?.oderId]);

  const canClaimToday = () => {
    const today = new Date().toDateString();
    return loginData.lastClaimDate !== today && loginData.currentDay <= 7;
  };

  const handleClaim = async (day: number) => {
    if (!user?.oderId || claiming) return;
    if (day !== loginData.currentDay) return;
    if (!canClaimToday()) return;

    setClaiming(true);
    const reward = LOGIN_REWARDS.find((r) => r.day === day);
    if (!reward) return;

    try {
      const today = new Date().toDateString();
      const newClaimedDays = [...loginData.claimedDays, day];
      const newLoginData = {
        currentDay: day + 1,
        claimedDays: newClaimedDays,
        lastClaimDate: today,
      };

      // Update Firebase
      const userRef = doc(db, "users", user.oderId);
      await updateDoc(userRef, {
        loginEvent: newLoginData,
      });

      // Add gems
      await addGems(reward.gems);

      setLoginData(newLoginData);
      setClaimedReward(reward.gems);
      setShowRewardModal(true);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#58cc02", "#ffc800", "#1cb0f6"],
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
    } finally {
      setClaiming(false);
    }
  };

  const getRewardStatus = (day: number) => {
    if (loginData.claimedDays.includes(day)) return "claimed";
    if (day === loginData.currentDay && canClaimToday()) return "available";
    if (day < loginData.currentDay) return "missed";
    return "locked";
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title="Điểm danh thành công!"
        subtitle="Phần thưởng đăng nhập hàng ngày"
        rewards={[{ type: "gems", amount: claimedReward }]}
        gradientFrom="var(--duo-green)"
        gradientTo="var(--duo-teal)"
      />

      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-4 pb-4 px-4 bg-gradient-to-r from-[var(--duo-green)] to-[var(--duo-teal)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-back-3d w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-bold text-xl text-white">Đăng nhập 7 ngày</h1>
            <p className="text-white/80 text-sm">Nhận thưởng mỗi ngày!</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-32 pb-28">
        {/* Progress */}
        <div className="card-3d p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[var(--duo-green)]" />
              <span className="font-semibold text-foreground">Tiến độ</span>
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">
              {loginData.claimedDays.length}/7 ngày
            </span>
          </div>
          <div className="h-3 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--duo-green)] to-[var(--duo-teal)] transition-all duration-500"
              style={{ width: `${(loginData.claimedDays.length / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {LOGIN_REWARDS.map((reward) => {
            const status = getRewardStatus(reward.day);
            const isSpecial = reward.special;

            return (
              <button
                key={reward.day}
                onClick={() => handleClaim(reward.day)}
                disabled={status !== "available" || claiming}
                className={`card-3d relative p-4 ${
                  isSpecial ? "col-span-2" : ""
                } ${
                  status === "available"
                    ? "border-2 border-[var(--duo-green)]"
                    : status === "claimed"
                    ? "border-2 border-[var(--duo-green)]"
                    : ""
                }`}
              >
                {/* Status Icon */}
                {status === "claimed" && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                {status === "locked" && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--muted-foreground)]/30 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-[var(--muted-foreground)]" />
                  </div>
                )}

                <div
                  className={`flex ${
                    isSpecial ? "items-center gap-4" : "flex-col items-center"
                  }`}
                >
                  <div
                    className={`${
                      isSpecial ? "w-16 h-16 flex-shrink-0" : "w-12 h-12 mb-2"
                    } rounded-xl flex items-center justify-center ${
                      isSpecial
                        ? "bg-gradient-to-br from-[var(--duo-yellow)] to-[var(--duo-orange)]"
                        : "bg-[var(--duo-blue)]/20"
                    }`}
                  >
                    {isSpecial ? (
                      <Gift className="w-8 h-8 text-white" />
                    ) : (
                      <img
                        src="/AppAssets/BlueDiamond.png"
                        alt="gem"
                        className="w-6 h-6"
                      />
                    )}
                  </div>
                  <div
                    className={isSpecial ? "flex-1 text-left" : "text-center"}
                  >
                    <p
                      className={`font-bold ${
                        isSpecial ? "text-lg" : "text-sm"
                      } ${
                        status === "claimed"
                          ? "text-[var(--muted-foreground)]"
                          : "text-foreground"
                      }`}
                    >
                      {reward.label}
                    </p>
                    <div
                      className={`flex items-center gap-1 ${
                        isSpecial ? "" : "justify-center"
                      }`}
                    >
                      <span
                        className={`font-bold ${
                          isSpecial ? "text-2xl" : "text-lg"
                        } ${
                          isSpecial
                            ? "text-[var(--duo-orange)]"
                            : "text-[var(--duo-blue)]"
                        }`}
                      >
                        +{reward.gems}
                      </span>
                      <img
                        src="/AppAssets/BlueDiamond.png"
                        alt="gem"
                        className={isSpecial ? "w-6 h-6" : "w-4 h-4"}
                      />
                    </div>
                    {isSpecial && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Phần thưởng đặc biệt!
                      </p>
                    )}
                  </div>
                </div>

                {status === "available" && (
                  <div
                    className={`btn-3d btn-3d-green py-2 text-sm ${
                      isSpecial ? "mt-3" : "mt-2"
                    }`}
                  >
                    Nhận ngay!
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-4 card-3d p-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Đăng nhập mỗi ngày để nhận thưởng. Nếu bỏ lỡ 1 ngày, tiến độ sẽ bị
            reset!
          </p>
        </div>
      </div>
    </Page>
  );
}

export default EventLogin7DaysPage;
