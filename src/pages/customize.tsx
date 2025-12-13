import { Page } from "zmp-ui";
import { Sparkles, User, Frame, Check, ChevronLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/user-store";
import { getFullImage } from "@/services/gacha-service";

type TabType = "avatar" | "frame";

function CustomizePage() {
  const navigate = useNavigate();
  const { user, equipAvatar, equipFrame } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>("avatar");

  // Get owned avatars and frames from gacha rewards
  const ownedAvatars = useMemo(() => {
    if (!user?.gachaInventory?.rewards) return [];
    return user.gachaInventory.rewards.filter((r) => r.type === "avatar");
  }, [user?.gachaInventory?.rewards]);

  const ownedFrames = useMemo(() => {
    if (!user?.gachaInventory?.rewards) return [];
    return user.gachaInventory.rewards.filter((r) => r.type === "frame");
  }, [user?.gachaInventory?.rewards]);

  const handleEquipAvatar = async (avatarUrl: string | null) => {
    await equipAvatar(avatarUrl);
  };

  const handleEquipFrame = async (frameUrl: string | null) => {
    await equipFrame(frameUrl);
  };

  // Get display avatar (equipped or default Zalo avatar)
  const displayAvatar = user?.equippedAvatar || user?.avatar;
  const displayFrame = user?.equippedFrame;

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
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Frame layer - lớn hơn avatar */}
            {displayFrame && (
              <img
                src={getFullImage(displayFrame, 200)}
                alt="Frame"
                className="absolute inset-0 w-32 h-32 object-contain z-10 pointer-events-none"
                referrerPolicy="no-referrer"
              />
            )}
            {/* Avatar - nhỏ hơn frame */}
            <div className="w-20 h-20 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-2xl overflow-hidden border-4 border-[var(--border)]">
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
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "avatar"
                ? "bg-[var(--duo-purple)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <User className="w-5 h-5" />
            Avatar ({ownedAvatars.length})
          </button>
          <button
            onClick={() => setActiveTab("frame")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "frame"
                ? "bg-[var(--duo-blue)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Frame className="w-5 h-5" />
            Khung ({ownedFrames.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-28">
        {activeTab === "avatar" ? (
          <div className="space-y-3">
            {/* Default avatar option */}
            <button
              onClick={() => handleEquipAvatar(null)}
              className={`card-3d w-full p-3 flex items-center gap-3 ${
                !user?.equippedAvatar
                  ? "border-2 border-[var(--duo-green)]"
                  : ""
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white font-bold text-xl overflow-hidden">
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
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Avatar Zalo</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Mặc định
                </p>
              </div>
              {!user?.equippedAvatar && (
                <div className="w-8 h-8 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </button>

            {/* Owned avatars */}
            {ownedAvatars.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
                <p className="text-[var(--muted-foreground)]">
                  Chưa có avatar nào
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Hoàn thành bộ sưu tập gacha để nhận avatar
                </p>
              </div>
            ) : (
              ownedAvatars.map((avatar, index) => {
                const isEquipped = user?.equippedAvatar === avatar.image;
                return (
                  <button
                    key={index}
                    onClick={() => handleEquipAvatar(avatar.image)}
                    className={`card-3d w-full p-3 flex items-center gap-3 ${
                      isEquipped ? "border-2 border-[var(--duo-green)]" : ""
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-[var(--secondary)] overflow-hidden">
                      <img
                        src={getFullImage(avatar.image, 100)}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">
                        {avatar.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Từ gacha
                      </p>
                    </div>
                    {isEquipped && (
                      <div className="w-8 h-8 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* No frame option */}
            <button
              onClick={() => handleEquipFrame(null)}
              className={`card-3d w-full p-3 flex items-center gap-3 ${
                !user?.equippedFrame ? "border-2 border-[var(--duo-green)]" : ""
              }`}
            >
              <div className="w-14 h-14 rounded-xl bg-[var(--secondary)] flex items-center justify-center">
                <Frame className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Không có khung</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Mặc định
                </p>
              </div>
              {!user?.equippedFrame && (
                <div className="w-8 h-8 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </button>

            {/* Owned frames */}
            {ownedFrames.length === 0 ? (
              <div className="text-center py-8">
                <Frame className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
                <p className="text-[var(--muted-foreground)]">
                  Chưa có khung nào
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Hoàn thành bộ sưu tập gacha để nhận khung
                </p>
              </div>
            ) : (
              ownedFrames.map((frame, index) => {
                const isEquipped = user?.equippedFrame === frame.image;
                return (
                  <button
                    key={index}
                    onClick={() => handleEquipFrame(frame.image)}
                    className={`card-3d w-full p-3 flex items-center gap-3 ${
                      isEquipped ? "border-2 border-[var(--duo-green)]" : ""
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-[var(--secondary)] overflow-hidden">
                      <img
                        src={getFullImage(frame.image, 100)}
                        alt={frame.name}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">
                        {frame.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Từ gacha
                      </p>
                    </div>
                    {isEquipped && (
                      <div className="w-8 h-8 rounded-full bg-[var(--duo-green)] flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

export default CustomizePage;
