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
        "src/features/legal/**",
        "src/features/onboarding/**",
        "src/services/platform.ts",
        // Exclude feature-gated scaffolding/stub code (Tasks 16-24)
        "src/features/security/**",      // Task 18: App lock (behind ENABLE_APP_LOCK flag)
        "src/features/health/**",        // Task 19: Health integrations stub (behind ENABLE_HEALTH_INTEGRATION flag)
        "src/features/analytics/**",     // Task 21: Analytics tiles (behind ENABLE_ANALYTICS_TILES flag)
        "src/features/iap/**",           // Task 23-24: IAP abstraction (behind ENABLE_IAP flag)
        "src/lib/encryption/**",         // Task 20: Local encryption (behind ENABLE_LOCAL_ENCRYPTION flag)
        "src/lib/csv-export.ts",         // Task 17: CSV export (free feature, to be tested separately)
        "src/lib/pdf-export.ts",         // Task 17: PDF export stub (behind ENABLE_PDF_CSV_EXPORT flag)
        "src/components/PremiumGate.tsx" // Task 16: Premium plumbing (behind ENABLE_PREMIUM_FEATURES flag)
      ],
      lines: parseInt(process.env.TEST_COVERAGE_LINES ?? "50", 10),
    },
  },
});
