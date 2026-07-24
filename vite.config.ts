import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base works for GitHub project Pages (`/repo/`) and for the nested
// per-PR previews (`/repo/pr-preview/pr-N/`) without hardcoding either path.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
  },
  server: {
    // ALWAYS this port. localStorage is scoped per origin *including the port*,
    // so a dev server that falls back to 5174 silently presents an empty save —
    // which is indistinguishable from having lost one. strictPort makes a busy
    // port an error you can see instead of a save you can't find.
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
});
