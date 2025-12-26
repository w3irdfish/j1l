import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
  build: {
    lib: {
      entry: resolve(__dirname, "dist/index.js"),
      name: "J1L",
      formats: ["es", "cjs", "iife"],
      fileName: (format) => {
        if (format === "es") return "browser.js";
        if (format === "cjs") return "node.cjs";
        if (format === "iife") return "browser.iife.js";
      },
    },
    sourcemap: true,
    minify: true,
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        exports: "auto",
      },
    },
  },
});
