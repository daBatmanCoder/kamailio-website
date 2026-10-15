import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  base: mode === "github-pages" ? "/kamailio-website/" : "/",
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 500,
      ignored: ["**/work/**", "**/public/documentation/**"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three";
          if (id.includes("/src/data/content.json")) return "archive";
          if (id.includes("/node_modules/")) return "vendor";
        },
      },
    },
  },
}));
