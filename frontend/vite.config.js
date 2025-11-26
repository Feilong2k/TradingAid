import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  },
  // Fix for client-side routing in production
  base: './',
  // Ensure public files are copied to dist
  publicDir: 'public'
});