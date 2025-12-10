import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";

import HomePage from "../pages/index";

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
          </AnimationRoutes>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};

export default Layout;
