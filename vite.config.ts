import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // NOTE: the content script is intentionally NOT built here. MV3 injects
      // content scripts as classic scripts, so they cannot use the ES-module
      // `import`s that Rollup emits for shared chunks. It is built separately as
      // a self-contained IIFE via vite.content.config.ts. Background is fine as
      // an ES module because the manifest declares the worker `type: module`.
      input: {
        popup: resolve(currentDir, "popup.html"),
        options: resolve(currentDir, "options.html"),
        background: resolve(currentDir, "src/background.ts")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
