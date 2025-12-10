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
});
