import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point '@' to the main 'src' directory, which is one level up
      "@": path.resolve(__dirname, ".."),
    },
  },
  build: {
    // The output directory is relative to this config file's location
    outDir: '../../dist/client',
    sourcemap: false,
  },
});