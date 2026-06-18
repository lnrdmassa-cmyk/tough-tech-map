import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the built bundle works on any static host or subpath.
  base: "./",
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
  },
});
