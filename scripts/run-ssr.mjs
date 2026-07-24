import { execSync } from "node:child_process";
execSync("npx esbuild dist-artifact/generic-idle-game-1.jsx --bundle --format=esm --platform=node --external:react --external:react/jsx-runtime --external:react-dom --loader:.jsx=jsx --outfile=dist-artifact/generic-idle-game-1.bundled.mjs --log-level=error", { stdio: "inherit" });
execSync("node scripts/ssr-smoke.mjs", { stdio: "inherit" });
execSync("rm -f dist-artifact/generic-idle-game-1.bundled.mjs");
