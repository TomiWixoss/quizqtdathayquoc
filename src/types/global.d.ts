interface AppConfig {
  app: {
    title: string;
    textColor: {
      light: string;
      dark: string;
    };
    statusBar: string;
    actionBarHidden: boolean;
    hideIOSSafeAreaBottom: boolean;
    hideAndroidBottomNavigationBar: boolean;
  };
  listCSS: string[];
  listSyncJS: string[];
  listAsyncJS: string[];
}

declare global {
  interface Window {
    APP_CONFIG: AppConfig;
  }
}

export {};
