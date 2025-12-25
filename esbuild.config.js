const esbuild = require("esbuild");
const path = require("path");

async function build() {
  try {
    // Browser build (ESM)
    await esbuild.build({
      entryPoints: ["dist/index.js"],
      bundle: true,
      platform: "browser",
      target: ["es2020"],
      outfile: "dist/browser.js",
      sourcemap: true,
      minify: false,
      format: "esm",
    });
    console.log("✓ Browser ESM build complete");

    // Browser build (IIFE for script tags)
    await esbuild.build({
      entryPoints: ["dist/index.js"],
      bundle: true,
      platform: "browser",
      target: ["es2020"],
      outfile: "dist/browser.iife.js",
      sourcemap: true,
      minify: false,
      format: "iife",
      globalName: "J1L",
    });
    console.log("✓ Browser IIFE build complete");

    // Node.js build (ESM)
    await esbuild.build({
      entryPoints: ["dist/index.js"],
      bundle: true,
      platform: "node",
      target: "node18",
      outfile: "dist/node.js",
      sourcemap: true,
      minify: false,
      format: "esm",
      external: [],
    });
    console.log("✓ Node.js ESM build complete");

    // Node.js build (CommonJS)
    await esbuild.build({
      entryPoints: ["dist/index.js"],
      bundle: true,
      platform: "node",
      target: "node18",
      outfile: "dist/node.cjs",
      sourcemap: true,
      minify: false,
      format: "cjs",
      external: [],
    });
    console.log("✓ Node.js CommonJS build complete");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
