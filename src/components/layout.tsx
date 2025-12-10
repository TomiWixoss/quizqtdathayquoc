import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { Toaster } from "sonner";
import { useEffect } from "react";

import HomePage from "../pages/index";
import QuizPage from "../pages/quiz";
import LeaderboardPage from "../pages/leaderboard";
import AchievementsPage from "../pages/achievements";
import QuestsPage from "../pages/quests";
import SettingsPage from "../pages/settings";
import StatsPage from "../pages/stats";
import MailboxPage from "../pages/mailbox";
import ShopPage from "../pages/shop";
import MinigamePage from "../pages/minigame";
import TestFirebasePage from "../pages/test-firebase";
import { BottomNav } from "./bottom-nav";
import { useThemeStore } from "@/stores/theme-store";

const Layout = () => {
  const systemInfo = getSystemInfo();
  const zaloTheme = systemInfo.zaloTheme as "dark" | "light" | undefined;
  const { theme, setTheme } = useThemeStore();

  // Sync with Zalo theme on first load if not set
  useEffect(() => {
    if (zaloTheme && !localStorage.getItem("quiz-theme")) {
      setTheme(zaloTheme);
    }
  }, [zaloTheme]);

  return (
    <App theme={theme}>
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
            <Route path="/minigame" element={<MinigamePage />} />
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
