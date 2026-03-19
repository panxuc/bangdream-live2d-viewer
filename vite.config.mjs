import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [nitro(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("/pixi.js/") ||
            id.includes("/pixi-spine/") ||
            id.includes("/pixi-live2d-display-advanced/") ||
            id.includes("/@pixi/") ||
            id.includes("/@pixi-spine/")
          ) {
            return "pixi-runtime";
          }

          if (id.includes("/jszip/")) {
            return "archive-runtime";
          }

          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/") || id.includes("/swr/")) {
            return "react-runtime";
          }

          if (
            id.includes("/@radix-ui/") ||
            id.includes("/lucide-react/") ||
            id.includes("/class-variance-authority/") ||
            id.includes("/clsx/") ||
            id.includes("/tailwind-merge/")
          ) {
            return "ui-runtime";
          }
        },
      },
    },
  },
});
