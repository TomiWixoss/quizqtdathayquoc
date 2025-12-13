import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import HomePage from "../pages/index";
import QuizPage from "../pages/quiz";
import LeaderboardPage from "../pages/leaderboard";
import AchievementsPage from "../pages/achievements";
import QuestsPage from "../pages/quests";
import SettingsPage from "../pages/settings";
import StatsPage from "../pages/stats";
import MailboxPage from "../pages/mailbox";
import ShopPage from "../pages/shop";
import EventsPage from "../pages/events";
import GachaPage from "../pages/gacha";
import GachaDetailPage from "../pages/gacha-detail";
import CustomizePage from "../pages/customize";
import CardInventoryPage from "../pages/card-inventory";
import ProfilePage from "../pages/profile";

import BattlePage from "../pages/battle";
import ConquestPage from "../pages/conquest";
import TestFirebasePage from "../pages/test-firebase";
import { BottomNav } from "./bottom-nav";
import { useThemeStore } from "@/stores/theme-store";
import { useUserStore } from "@/stores/user-store";

const Layout = () => {
  const systemInfo = getSystemInfo();
  const zaloTheme = systemInfo.zaloTheme as "dark" | "light" | undefined;
  const { theme, setTheme } = useThemeStore();
  const { user, updateUsername } = useUserStore();
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  // Sync with Zalo theme on first load if not set
  useEffect(() => {
    if (zaloTheme && !localStorage.getItem("quiz-theme")) {
      setTheme(zaloTheme);
    }
  }, [zaloTheme]);

  // Check if user has default name and show modal
  useEffect(() => {
    if (user?.odername === "Người chơi") {
      // Small delay to ensure app is fully loaded
      const timer = setTimeout(() => {
        setShowNameModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.odername]);

  const handleChangeName = async () => {
    if (!newName.trim() || newName.trim().length < 2) return;

    const success = await updateUsername(newName.trim());
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

  return (
    <App theme={theme}>
      {/* Welcome Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-3xl p-6 max-w-sm w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--duo-green)]/20 flex items-center justify-center">
              <Pencil className="w-8 h-8 text-[var(--duo-green)]" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              Chào mừng bạn! 👋
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] text-center mb-4">
              Hãy đặt tên cho mình để bắt đầu nhé!
            </p>

            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNameStatus("idle");
              }}
              placeholder="Nhập tên của bạn"
              maxLength={20}
              autoFocus
              className="w-full p-3 rounded-xl bg-[var(--secondary)] text-foreground text-center font-bold text-lg mb-3"
            />

            {nameStatus === "success" && (
              <p className="text-[var(--duo-green)] text-center text-sm mb-3">
                Đặt tên thành công!
              </p>
            )}

            {nameStatus === "error" && (
              <p className="text-[var(--duo-red)] text-center text-sm mb-3">
                Không thể đặt tên. Vui lòng thử lại.
              </p>
            )}

            <button
              onClick={handleChangeName}
              disabled={!newName.trim() || newName.trim().length < 2}
              className="w-full btn-3d btn-3d-green py-3 disabled:opacity-50"
            >
              Bắt đầu chơi!
            </button>

            <p className="text-xs text-[var(--muted-foreground)] text-center mt-3">
              Tên từ 2-20 ký tự
            </p>
          </div>
        </div>
      )}
      {/* @ts-expect-error zmp-ui types issue */}
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/mailbox" element={<MailboxPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/gacha" element={<GachaPage />} />
            <Route path="/gacha/:id" element={<GachaDetailPage />} />
            <Route path="/customize" element={<CustomizePage />} />
            <Route path="/card-inventory" element={<CardInventoryPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />

            <Route path="/battle" element={<BattlePage />} />
            <Route path="/conquest" element={<ConquestPage />} />
            <Route path="/test-firebase" element={<TestFirebasePage />} />
          </AnimationRoutes>
          <BottomNav />
        </ZMPRouter>
      </SnackbarProvider>
      <Toaster position="top-center" richColors />
    </App>
  );
};

export default Layout;
