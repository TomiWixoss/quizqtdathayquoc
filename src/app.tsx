import React from "react";
import { createRoot } from "react-dom/client";

// ZaUI stylesheet
import "zmp-ui/zaui.css";

// Global stylesheet (Tailwind v4 + custom styles)
import "./css/globals.css";

// Expose app configuration
import appConfig from "../app-config.json";
if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig;
}

// Mount the app
import Layout from "./components/layout";

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(Layout));
}
