import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

// Builds the content script as a single self-contained IIFE so MV3 can inject
// it as a classic script (no top-level `import`s). Runs after the main build
// with `emptyOutDir: false` so it appends `assets/content.js` to dist/.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: resolve(currentDir, "src/content.ts")
      },
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "assets/[name].js"
      }
    }
  }
});
