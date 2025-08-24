import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/test/stubs": path.resolve(__dirname, "src/test/stubs"),
      "recharts": path.resolve(__dirname, "src/test/stubs/recharts.ts"),
      "@capacitor/local-notifications": path.resolve(
        __dirname,
        "src/test/stubs/capacitor-local-notifications.ts"
      ),
      "@capacitor/preferences": path.resolve(
        __dirname,
        "src/test/stubs/capacitor-preferences.ts"
      ),
      "i18next": path.resolve(__dirname, "src/test/stubs/i18n.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    include: [
      "src/**/*.{smoke.test,test}.{ts,tsx}",
      "src/**/__tests__/**/*.{ts,tsx}"
    ],
    coverage: {
      enabled: true,
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "json-summary", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__tests__/**",
        "src/test/**",
        "**/*.d.ts",
        "**/index.{ts,tsx}",
        "src/**/lib/**",
        "src/**/data/**",
        "src/**/*.stories.{ts,tsx}",
        "src/features/**",
        "src/routes/**"
      ],
      lines: parseInt(process.env.TEST_COVERAGE_LINES ?? "70", 10),
    },
  },
});
