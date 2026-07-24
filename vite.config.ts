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
});
