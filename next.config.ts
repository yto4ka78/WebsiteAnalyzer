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
    ],
  },
};

export default nextConfig;
