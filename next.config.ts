import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["lighthouse", "chrome-launcher"],
  outputFileTracingIncludes: {
    // Lighthouse читает localization JSON с файловой системы на runtime.
    // В standalone/trace эти JSON могут не попасть в итоговый /var/task.
    "/api/analyze": [
      "node_modules/lighthouse/shared/localization/locales/*.json",
    ],
  },
};

export default nextConfig;
