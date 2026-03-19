import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["lighthouse", "chrome-launcher"],
  outputFileTracingIncludes: {
    // Lighthouse читает localization JSON с файловой системы на runtime.
    // В standalone/trace эти JSON могут не попасть в итоговый /var/task.
    "/api/analyze": [
      "node_modules/lighthouse/shared/localization/locales/*.json",
      // Lighthouse flow-report templates/assets are loaded from the filesystem.
      "node_modules/lighthouse/flow-report/assets/*",
      "node_modules/lighthouse/flow-report/assets/**/*",
      "node_modules/lighthouse/report/**",
      // Generator expects dist/report/flow.js via ../../dist/report/flow.js
      "node_modules/lighthouse/dist/report/**",
      // Playwright browser executables (downloaded by `npx playwright install chromium`)
      // are used from PLAYWRIGHT_BROWSERS_PATH at runtime.
      "node_modules/.cache/ms-playwright/**",
    ],
  },
};

export default nextConfig;
