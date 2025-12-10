import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { Toaster } from "sonner";

import HomePage from "../pages/index";
import QuizPage from "../pages/quiz";
import LeaderboardPage from "../pages/leaderboard";
import TestFirebasePage from "../pages/test-firebase";

const Layout = () => {
  const systemInfo = getSystemInfo();
  const theme = systemInfo.zaloTheme as "dark" | "light" | undefined;

  return (
    <App theme={theme}>
      {/* @ts-expect-error zmp-ui types issue */}
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/test-firebase" element={<TestFirebasePage />} />
          </AnimationRoutes>
        </ZMPRouter>
      </SnackbarProvider>
      <Toaster position="top-center" richColors />
    </App>
  );
};

export default Layout;
