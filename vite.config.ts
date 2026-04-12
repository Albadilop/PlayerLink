import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true,
    // Misma origen que el front: evita CORS al llamar a /api/* en dev (localhost vs 127.0.0.1).
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "public",
  },
  resolve: {
    alias: {
      "@": "/src/front",
    },
  },
});
