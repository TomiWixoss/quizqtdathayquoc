import { defineConfig } from "vite";
import path from "path";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "./src",
  base: "",
  plugins: [tailwindcss(), zaloMiniApp(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
  server: {
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; worker-src 'self' blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.cloudfunctions.net https://workers.vrp.moe https://api.cerebras.ai/v1; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline';",
    },
  },
});
