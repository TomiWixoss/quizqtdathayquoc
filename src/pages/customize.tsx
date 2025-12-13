import { Page } from "zmp-ui";
import { Sparkles, User, Frame, Check, ChevronLeft, Award } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/user-store";
import { getFullImage } from "@/services/gacha-service";

type TabType = "avatar" | "frame" | "badge";

function CustomizePage() {
  const navigate = useNavigate();
  const { user, equipAvatar, equipFrame, equipBadge } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>("avatar");

  // Get owned items from gacha rewards
  const ownedAvatars = useMemo(() => {
    if (!user?.gachaInventory?.rewards) return [];
    return user.gachaInventory.rewards.filter((r) => r.type === "avatar");
  }, [user?.gachaInventory?.rewards]);

  const ownedFrames = useMemo(() => {
    if (!user?.gachaInventory?.rewards) return [];
    return user.gachaInventory.rewards.filter((r) => r.type === "frame");
  }, [user?.gachaInventory?.rewards]);

  const ownedBadges = useMemo(() => {
    if (!user?.gachaInventory?.rewards) return [];
    return user.gachaInventory.rewards.filter((r) => r.type === "badge");
  }, [user?.gachaInventory?.rewards]);

  // Get display values
  const displayAvatar = user?.equippedAvatar || user?.avatar;
  const displayFrame = user?.equippedFrame;
  const displayBadge = user?.equippedBadge;

  return (
    <Page className="bg-background min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 bg-gradient-to-r from-[var(--duo-purple)] to-[var(--duo-blue)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/20 text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-white" />
            <h1 className="font-bold text-xl text-white">Trang bị</h1>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="px-4 pt-28 pb-4">
        <div className="card-3d p-6 flex flex-col items-center">
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Xem trước
          </p>
          <div className="flex items-center gap-4">
            {/* Avatar + Frame */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {displayFrame && (
                <img
                  src={getFullImage(displayFrame, 200)}
                  alt="Frame"
                  className="absolute inset-0 w-28 h-28 object-contain z-10 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="w-14 h-14 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-xl overflow-hidden border-2 border-[var(--border)]">
                {displayAvatar ? (
                  <img
                    src={
                      user?.equippedAvatar
                        ? getFullImage(displayAvatar, 200)
                        : displayAvatar
                    }
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  user?.odername?.charAt(0).toUpperCase() || "?"
                )}
              </div>
            </div>
            {/* Badge */}
            {displayBadge && (
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <img
                  src={getFullImage(displayBadge, 100)}
                  alt="Badge"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
          <p className="font-bold text-foreground mt-3">{user?.odername}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Level {user?.level || 1}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("avatar")}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "avatar"
                ? "bg-[var(--duo-purple)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <User className="w-4 h-4" />
            Avatar
          </button>
          <button
            onClick={() => setActiveTab("frame")}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "frame"
                ? "bg-[var(--duo-blue)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Frame className="w-4 h-4" />
            Khung
          </button>
          <button
            onClick={() => setActiveTab("badge")}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "badge"
                ? "bg-[var(--duo-yellow)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Award className="w-4 h-4" />
            Huy hiệu
          </button>
        </div>
      </div>

      {/* Content - Grid Layout */}
      <div className="px-4 pb-28">
        {activeTab === "avatar" && (
          <div className="grid grid-cols-4 gap-3">
            {/* Default avatar option */}
            <button
              onClick={() => equipAvatar(null)}
              className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all ${
                !user?.equippedAvatar
                  ? "border-[var(--duo-green)] ring-2 ring-[var(--duo-green)]/30"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="w-full h-full bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-xl">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.odername?.charAt(0).toUpperCase() || "?"
                )}
              </div>
              {!user?.equippedAvatar && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            {ownedAvatars.map((avatar, index) => {
              const isEquipped = user?.equippedAvatar === avatar.image;
              return (
                <button
                  key={index}
                  onClick={() => equipAvatar(avatar.image)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all ${
                    isEquipped
                      ? "border-[var(--duo-green)] ring-2 ring-[var(--duo-green)]/30"
                      : "border-[var(--border)]"
                  }`}
                >
                  <img
                    src={getFullImage(avatar.image, 150)}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isEquipped && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}

            {ownedAvatars.length === 0 && (
              <div className="col-span-3 text-center py-6">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Hoàn thành gacha để nhận thêm
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "frame" && (
          <div className="grid grid-cols-4 gap-3">
            {/* No frame option */}
            <button
              onClick={() => equipFrame(null)}
              className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all bg-[var(--secondary)] flex items-center justify-center ${
                !user?.equippedFrame
                  ? "border-[var(--duo-green)] ring-2 ring-[var(--duo-green)]/30"
                  : "border-[var(--border)]"
              }`}
            >
              <Frame className="w-8 h-8 text-[var(--muted-foreground)]" />
              {!user?.equippedFrame && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            {ownedFrames.map((frame, index) => {
              const isEquipped = user?.equippedFrame === frame.image;
              return (
                <button
                  key={index}
                  onClick={() => equipFrame(frame.image)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all bg-[var(--secondary)] ${
                    isEquipped
                      ? "border-[var(--duo-green)] ring-2 ring-[var(--duo-green)]/30"
                      : "border-[var(--border)]"
                  }`}
                >
                  <img
                    src={getFullImage(frame.image, 150)}
                    alt=""
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {isEquipped && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}

            {ownedFrames.length === 0 && (
              <div className="col-span-3 text-center py-6">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Hoàn thành gacha để nhận thêm
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "badge" && (
          <div className="grid grid-cols-4 gap-3">
            {/* No badge option */}
            <button
              onClick={() => equipBadge(null)}
              className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all bg-[var(--secondary)] flex items-center justify-center ${
                !user?.equippedBadge
                  ? "border-[var(--duo-green)] ring-2 ring-[var(--duo-green)]/30"
                  : "border-[var(--border)]"
              }`}
            >
              <Award className="w-8 h-8 text-[var(--muted-foreground)]" />
              {!user?.equippedBadge && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            {ownedBadges.map((badge, index) => {
              const isEquipped = user?.equippedBadge === badge.image;
              return (
                <button
                  key={index}
                  onClick={() => equipBadge(badge.image)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all bg-[var(--secondary)] ${
                    isEquipped
                      ? "border-[var(--duo-green)] ring-2 ring-[var(--duo-green)]/30"
                      : "border-[var(--border)]"
                  }`}
                >
                  <img
                    src={getFullImage(badge.image, 150)}
                    alt=""
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {isEquipped && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}

            {ownedBadges.length === 0 && (
              <div className="col-span-3 text-center py-6">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Hoàn thành gacha để nhận thêm
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

export default CustomizePage;
