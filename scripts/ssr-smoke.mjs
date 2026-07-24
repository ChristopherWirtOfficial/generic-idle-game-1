// SSR smoke: render the flattened artifact exactly as the artifact host would mount it.
import { execSync } from "node:child_process";
execSync(
  "npx esbuild dist-artifact/generic-idle-game-1.jsx --bundle --format=esm " +
  "--external:react --external:react/jsx-runtime --loader:.jsx=jsx --jsx=automatic " +
  "--outfile=dist-artifact/generic-idle-game-1.bundled.mjs --log-level=error",
);
const { renderToString } = await import("react-dom/server");
const { createElement } = await import("react");
const { default: App } = await import("../dist-artifact/generic-idle-game-1.bundled.mjs");
const html = renderToString(createElement(App));
if (!html.includes("warming the wheels…")) throw new Error("unexpected initial render");
console.log("ssr: renders, initial state =", html.replace(/<[^>]+>/g, " ").trim().slice(0, 60));
