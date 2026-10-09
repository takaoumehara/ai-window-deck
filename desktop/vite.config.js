import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The shell UI shares the extension's UI primitives and layout math from ../src.
// dedupe makes those shared files resolve React and friends from this package.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
      "@desktop": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "clsx", "tailwind-merge", "class-variance-authority", "lucide-react"],
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
