import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs-extra";

function copyExtensionAssets() {
  return {
    name: "copy-extension-assets",
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      const filesToCopy = ["manifest.json", "background.js", "strings.js", "keys.js"];
      filesToCopy.forEach((file) => {
        const src = path.resolve(__dirname, file);
        if (fs.existsSync(src)) {
          fs.copySync(src, path.resolve(distDir, file));
        }
      });

      const dirsToCopy = ["icons", "_locales"];
      dirsToCopy.forEach((dir) => {
        const src = path.resolve(__dirname, dir);
        if (fs.existsSync(src)) {
          fs.copySync(src, path.resolve(distDir, dir));
        }
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), copyExtensionAssets()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
