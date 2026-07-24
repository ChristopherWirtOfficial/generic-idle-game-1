import { execSync } from "node:child_process";
execSync("npx esbuild scripts/smoke.test.ts --bundle --outfile=.testtmp/smoke.mjs --format=esm --platform=node --log-level=error", { stdio: "inherit" });
execSync("node .testtmp/smoke.mjs", { stdio: "inherit" });
execSync("rm -rf .testtmp");
