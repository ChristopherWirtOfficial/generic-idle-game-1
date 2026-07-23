// SSR smoke: render the flattened artifact exactly as the artifact host would mount it.
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import App from "../dist-artifact/generic-idle-game-1.bundled.mjs";
const html = renderToString(createElement(App));
if (!html.includes("Loading the number")) throw new Error("unexpected initial render");
console.log("ssr: renders, initial state =", html.replace(/<[^>]+>/g, " ").trim().slice(0, 60));
