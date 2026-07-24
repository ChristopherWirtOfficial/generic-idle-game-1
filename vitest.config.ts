import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Per-file environment via the `@vitest-environment` docblock: the economy
    // tests are pure and run in node; the app test needs jsdom.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
