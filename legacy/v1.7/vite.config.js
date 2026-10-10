import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// dist/ holds only the React panel (popup + options page). The extension root
// (manifest.json, background.js, icons, _locales) is loaded from the repo root;
// tools/package.sh assembles the store archive.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
