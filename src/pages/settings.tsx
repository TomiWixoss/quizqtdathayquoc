import { Page, useNavigate } from "zmp-ui";
import {
  Sun,
  Moon,
  Info,
  Award,
  ChevronRight,
  BarChart3,
  Mail,
  Gift,
  Pencil,
  Target,
  Trash2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { useUserStore } from "@/stores/user-store";
import { ACHIEVEMENTS } from "@/types/quiz";
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import confetti from "canvas-confetti";
import { RewardModal } from "@/components/ui/reward-modal";

function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user, addGems, useRedeemCode, updateUsername } = useUserStore();
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [redeemReward, setRedeemReward] = useState(0);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [unreadMail, setUnreadMail] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [showCacheModal, setShowCacheModal] = useState(false);

  const claimedRewards = user?.claimedAchievementRewards ?? [];

  // Quest data for badge calculation
  const DAILY_QUESTS = [
    {
      id: "daily_xp_50",
      requirement: 50,
      getValue: (u: any) => u?.dailyProgress ?? 0,
    },
    {
      id: "daily_correct_10",
      requirement: 10,
      getValue: (u: any) => u?.questProgress?.dailyCorrect ?? 0,
    },
    {
      id: "daily_quiz_3",
      requirement: 3,
      getValue: (u: any) => u?.questProgress?.dailyQuizzes ?? 0,
    },
    {
      id: "daily_conquest_1",
      requirement: 1,
      getValue: (u: any) => u?.questProgress?.dailyConquests ?? 0,
    },
    {
      id: "daily_gacha_1",
      requirement: 1,
      getValue: (u: any) => u?.questProgress?.dailyGachaPulls ?? 0,
    },
  ];
  const WEEKLY_QUESTS = [
    {
      id: "weekly_streak_7",
      requirement: 7,
      getValue: (u: any) => u?.streak ?? 0,
    },
    {
      id: "weekly_xp_500",
      requirement: 500,
      getValue: (u: any) => u?.questProgress?.weeklyXP ?? 0,
    },
    {
      id: "weekly_perfect_3",
      requirement: 3,
      getValue: (u: any) => u?.questProgress?.weeklyPerfect ?? 0,
    },
    {
      id: "weekly_conquest_5",
      requirement: 5,
      getValue: (u: any) => u?.questProgress?.weeklyConquests ?? 0,
    },
    {
      id: "weekly_conquest_wins_3",
      requirement: 3,
      getValue: (u: any) => u?.questProgress?.weeklyConquestWins ?? 0,
    },
    {
      id: "weekly_gacha_10",
      requirement: 10,
      getValue: (u: any) => u?.questProgress?.weeklyGachaPulls ?? 0,
    },
  ];
  const claimedQuests = [
    ...(user?.questProgress?.claimedDailyQuests || []),
    ...(user?.questProgress?.claimedWeeklyQuests || []),
  ];
  const questClaimableCount = [...DAILY_QUESTS, ...WEEKLY_QUESTS].filter(
    (q) => q.getValue(user) >= q.requirement && !claimedQuests.includes(q.id)
  ).length;
  const questCompletedCount = [...DAILY_QUESTS, ...WEEKLY_QUESTS].filter(
    (q) => q.getValue(user) >= q.requirement
  ).length;
  const totalQuests = DAILY_QUESTS.length + WEEKLY_QUESTS.length;

  // Helper để kiểm tra điều kiện thành tựu
  const getCurrentValue = (type: string) => {
    if (!user) return 0;
    const gachaStats = user.gachaInventory?.gachaStats;
    const totalCards =
      (gachaStats?.totalURCards ?? 0) +
      (gachaStats?.totalSRCards ?? 0) +
      (gachaStats?.totalRCards ?? 0) +
      (gachaStats?.totalNCards ?? 0);

    switch (type) {
      case "streak":
        return user.streak;
      case "correct":
        return user.totalCorrect;
      case "perfect":
        return user.perfectLessons ?? 0;
      case "level":
        return user.level ?? 1;
      case "gems":
        return user.gems ?? 0;
      case "conquest":
        return user.conquestStats?.totalConquests ?? 0;
      case "conquest_wins":
        return user.conquestStats?.bestWinStreak ?? 0;
      case "rank_points":
        return user.conquestStats?.rankPoints ?? 0;
      // Gacha achievements
      case "gacha_pulls":
        return user.gachaInventory?.totalPulls ?? 0;
      case "gacha_ur":
        return gachaStats?.totalURCards ?? 0;
      case "gacha_sr":
        return gachaStats?.totalSRCards ?? 0;
      case "gacha_total_cards":
        return totalCards;
      case "gacha_collections":
        return gachaStats?.completedCollections ?? 0;
      default:
        return 0;
    }
  };

  const isEarned = (achievement: (typeof ACHIEVEMENTS)[0]) => {
    return getCurrentValue(achievement.type) >= achievement.requirement;
  };

  const earnedCount = ACHIEVEMENTS.filter((a) => isEarned(a)).length;
  const claimableCount = ACHIEVEMENTS.filter(
    (a) => isEarned(a) && !claimedRewards.includes(a.id)
  ).length;

  // Check unread mail count
  useEffect(() => {
    const checkMail = async () => {
      if (!user?.oderId) return;
      try {
        // Get claimed mails from Firebase user data
        const claimedMails = user.claimedMails || [];
        const mailRef = collection(db, "mails");
        const q = query(mailRef, where("active", "==", true));
        const snapshot = await getDocs(q);
        const unread = snapshot.docs.filter(
          (d) => !claimedMails.includes(d.id)
        ).length;
        setUnreadMail(unread);
      } catch (error) {
        console.error("Error checking mail:", error);
      }
    };
    checkMail();
  }, [user?.oderId, user?.claimedMails]);

  // Change name handler
  const handleChangeName = async () => {
    if (!newName.trim()) return;

    const success = await updateUsername(newName);
    if (success) {
      setNameStatus("success");
      setTimeout(() => {
        setShowNameModal(false);
        setNewName("");
        setNameStatus("idle");
      }, 1000);
    } else {
      setNameStatus("error");
    }
  };

  // Redeem code handler
  const handleRedeem = async () => {
    if (!redeemCode.trim() || !user) return;

    try {
      const codesRef = collection(db, "redeemCodes");
      const q = query(codesRef, where("code", "==", redeemCode.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setRedeemStatus("error");
        return;
      }

      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data();

      // Check if already used (from Firebase user data)
      const usedCodes = user.usedRedeemCodes || [];
      if (usedCodes.includes(codeDoc.id)) {
        setRedeemStatus("error");
        return;
      }

      // Check if code is still valid
      if (codeData.usageLimit && codeData.usedCount >= codeData.usageLimit) {
        setRedeemStatus("error");
        return;
      }

      // Add gems
      await addGems(codeData.reward);

      // Mark as used in Firebase
      await useRedeemCode(codeDoc.id);

      // Update usage count in Firebase
      await updateDoc(doc(db, "redeemCodes", codeDoc.id), {
        usedCount: (codeData.usedCount || 0) + 1,
      });

      // Show reward modal
      setRedeemReward(codeData.reward);
      setShowRedeemModal(false);
      setShowRewardModal(true);
      setRedeemCode("");
      setRedeemStatus("idle");

      // Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#58cc02", "#ffc800", "#1cb0f6", "#ce82ff"],
      });
    } catch (error) {
      console.error("Redeem error:", error);
      setRedeemStatus("error");
    }
  };

  return (
    <Page className="bg-background min-h-screen">
      {/* Reward Success Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title="Đổi mã thành công!"
        subtitle="Bạn đã nhận được phần thưởng"
        rewards={[{ type: "gems", amount: redeemReward }]}
        gradientFrom="var(--duo-purple)"
        gradientTo="var(--duo-blue)"
      />

      {/* Change Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-3xl p-6 max-w-sm w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--duo-blue)]/20 flex items-center justify-center">
              <Pencil className="w-8 h-8 text-[var(--duo-blue)]" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              Đổi tên hiển thị
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] text-center mb-4">
              Tên từ 2-20 ký tự
            </p>

            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNameStatus("idle");
              }}
              placeholder={user?.odername || "Nhập tên mới"}
              maxLength={20}
              className="w-full p-3 rounded-xl bg-[var(--secondary)] text-foreground text-center font-bold text-lg mb-3"
            />

            {nameStatus === "success" && (
              <p className="text-[var(--duo-green)] text-center text-sm mb-3">
                Đổi tên thành công!
              </p>
            )}

            {nameStatus === "error" && (
              <p className="text-[var(--duo-red)] text-center text-sm mb-3">
                Không thể đổi tên. Vui lòng thử lại.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setNewName("");
                  setNameStatus("idle");
                }}
                className="flex-1 py-3 rounded-xl bg-[var(--secondary)] text-foreground font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleChangeName}
                disabled={!newName.trim() || newName.trim().length < 2}
                className="flex-1 btn-3d btn-3d-blue py-3 disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Modal */}
      {showCacheModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-3xl p-6 max-w-sm w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--duo-red)]/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[var(--duo-red)]" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              Xóa cache?
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] text-center mb-4">
              Dữ liệu tạm sẽ bị xóa và trang sẽ được tải lại. Dữ liệu tài khoản
              vẫn được giữ nguyên.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCacheModal(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--secondary)] text-foreground font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = window.location.origin;
                }}
                className="flex-1 btn-3d btn-3d-red py-3"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Code Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-3xl p-6 max-w-sm w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--duo-purple)]/20 flex items-center justify-center">
              <Gift className="w-8 h-8 text-[var(--duo-purple)]" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              Nhập mã đổi thưởng
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] text-center mb-4">
              Nhập mã để nhận gems miễn phí
            </p>

            <input
              type="text"
              value={redeemCode}
              onChange={(e) => {
                setRedeemCode(e.target.value.toUpperCase());
                setRedeemStatus("idle");
              }}
              placeholder="VD: QTDA2024"
              className="w-full p-3 rounded-xl bg-[var(--secondary)] text-foreground text-center font-bold text-lg uppercase mb-3"
            />

            {redeemStatus === "error" && (
              <p className="text-[var(--duo-red)] text-center text-sm mb-3">
                Mã không hợp lệ hoặc đã sử dụng
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setRedeemCode("");
                  setRedeemStatus("idle");
                }}
                className="flex-1 py-3 rounded-xl bg-[var(--secondary)] text-foreground font-bold"
              >
                Đóng
              </button>
              <button
                onClick={handleRedeem}
                className="flex-1 btn-3d btn-3d-green py-3"
              >
                Đổi thưởng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-[var(--card)] border-b-2 border-[var(--border)]">
        <h1 className="font-bold text-xl text-foreground">Tôi</h1>
      </div>

      {/* Content */}
      <div className="px-4 pt-28 pb-32">
        {/* User Info */}
        {user && (
          <div className="card-3d p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar with frame */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                {/* Frame layer - lớn hơn avatar */}
                {user.equippedFrame && (
                  <img
                    src={user.equippedFrame}
                    alt="Frame"
                    className="absolute inset-0 w-20 h-20 object-contain z-10 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* Avatar - nhỏ hơn frame */}
                <div className="w-14 h-14 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                  {user.equippedAvatar || user.avatar ? (
                    <img
                      src={user.equippedAvatar || user.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    user.odername.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              {/* Badge */}
              {user.equippedBadge && (
                <div className="w-12 h-12 shrink-0">
                  <img
                    src={user.equippedBadge}
                    alt="Badge"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-foreground truncate">
                    {user.odername}
                  </h2>
                  <button
                    onClick={() => {
                      setNewName(user.odername);
                      setShowNameModal(true);
                    }}
                    className="p-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--duo-blue)]/20 transition-colors shrink-0"
                  >
                    <Pencil className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </button>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Level {user.level} • {user.exp} XP
                </p>
              </div>
            </div>
            {/* Customize Button */}
            <button
              onClick={() => navigate("/customize")}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)] text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Sparkles className="w-5 h-5" />
              <span>Đổi Avatar, Khung & Huy hiệu</span>
            </button>
          </div>
        )}

        {/* Menu List */}
        <div className="space-y-3">
          {/* Quests Link */}
          <button
            onClick={() => navigate("/quests")}
            className="card-3d w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-green)]/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-[var(--duo-green)]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Nhiệm vụ</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {questCompletedCount}/{totalQuests} hoàn thành
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {questClaimableCount > 0 && (
                <span className="bg-[var(--duo-red)] text-white text-xs px-2 py-0.5 rounded-full">
                  {questClaimableCount}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
          </button>

          {/* Stats Link */}
          <button
            onClick={() => navigate("/stats")}
            className="card-3d w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-blue)]/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[var(--duo-blue)]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Thống kê</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Phân tích chi tiết
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>

          {/* Achievements Link */}
          <button
            onClick={() => navigate("/achievements")}
            className="card-3d w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-yellow)]/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-[var(--duo-yellow)]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Thành tựu</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {earnedCount}/{ACHIEVEMENTS.length} đã đạt
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {claimableCount > 0 && (
                <span className="bg-[var(--duo-red)] text-white text-xs px-2 py-0.5 rounded-full">
                  {claimableCount}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
          </button>

          {/* Mailbox Link */}
          <button
            onClick={() => navigate("/mailbox")}
            className="card-3d w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-orange)]/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--duo-orange)]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Hòm thư</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Nhận quà từ hệ thống
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadMail > 0 && (
                <span className="bg-[var(--duo-red)] text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadMail}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
          </button>

          {/* Redeem Code */}
          <button
            onClick={() => setShowRedeemModal(true)}
            className="card-3d w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-purple)]/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-[var(--duo-purple)]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Mã đổi thưởng</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Nhập mã nhận gems
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>

          <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mt-4 mb-2">
            Cài đặt
          </h3>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="card-3d w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-yellow)]/20 flex items-center justify-center">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-[var(--duo-yellow)]" />
                ) : (
                  <Sun className="w-5 h-5 text-[var(--duo-yellow)]" />
                )}
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Chế độ tối</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {theme === "dark" ? "Đang bật" : "Đang tắt"}
                </p>
              </div>
            </div>
            <div
              className={`w-14 h-8 rounded-full p-1 ${
                theme === "dark"
                  ? "bg-[var(--duo-green)]"
                  : "bg-[var(--secondary)]"
              }`}
            >
              <div
                className="w-6 h-6 rounded-full bg-white shadow-md"
                style={{
                  transform:
                    theme === "dark" ? "translateX(24px)" : "translateX(0)",
                }}
              />
            </div>
          </button>

          {/* Clear Cache */}
          <button
            onClick={() => setShowCacheModal(true)}
            className="card-3d w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-red)]/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-[var(--duo-red)]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Xóa cache</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Xóa dữ liệu tạm & reload
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>

          {/* App Info */}
          <div className="card-3d p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--duo-blue)]/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-[var(--duo-blue)]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Quiz QTDA</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Phiên bản 1.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

export default SettingsPage;
