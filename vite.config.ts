import { defineConfig } from "vite";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "bridge/index": resolve(__dirname, "src/bridge/index.ts"),
        "hooks/index": resolve(__dirname, "src/hooks/index.ts"),
        "utils/index": resolve(__dirname, "src/utils/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].mjs",
      },
    },
    outDir: "dist",
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    dts({
      outDir: "dist",
      include: ["src/**/*.ts"],
    }),
  ],
});
