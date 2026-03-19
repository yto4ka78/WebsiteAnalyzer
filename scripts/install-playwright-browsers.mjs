import { execSync } from "node:child_process";
import path from "node:path";

// We pin Playwright's download directory to a location under node_modules.
// That way Next.js `output: "standalone"` can include the browser executables
// in the deployed artifact (via `outputFileTracingIncludes`).
const browsersPath = path.join(
  process.cwd(),
  "node_modules",
  ".cache",
  "ms-playwright"
);

process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

// Install only what we need.
execSync("npx playwright install chromium", {
  stdio: "inherit",
  env: process.env,
});

