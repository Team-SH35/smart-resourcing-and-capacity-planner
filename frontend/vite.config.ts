import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Vitest configuration
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/_test_/setup.ts",
  },
});