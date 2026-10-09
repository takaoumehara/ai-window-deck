import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The deck layout math is shared with the extension (../src/lib/layout-model.js).
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@desktop": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    fs: { allow: [path.resolve(__dirname, "..")] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
