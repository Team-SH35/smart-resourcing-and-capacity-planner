import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Fix for Windows + Docker: file change events aren't propagated without polling
  server: {
    watch: {
      usePolling: true,
    },
  },

  // Hardcode env variable fallbacks so they work inside Docker
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL ?? "http://localhost:4000"),
    "import.meta.env.VITE_AI_API_URL": JSON.stringify(process.env.VITE_AI_API_URL ?? "http://localhost:8000"),
  },

  // Vitest configuration
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/_test_/setup.ts",
  },
});