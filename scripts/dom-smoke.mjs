import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { pretendToBeVisual: true, url: "https://localhost/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

const { createRoot } = await import("react-dom/client");
const { createElement } = await import("react");
const { default: App } = await import("../dist-artifact/generic-idle-game-1.bundled.mjs");

const root = createRoot(document.getElementById("root"));
root.render(createElement(App));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(400); // past load + a few ticks

const text = () => document.body.textContent ?? "";
if (!text().includes("The Button")) throw new Error("app did not mount: " + text().slice(0, 120));
if (!text().includes("The number is small.")) throw new Error("status line missing");

// Press the button five times.
const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("The Button"));
for (let i = 0; i < 5; i++) {
  btn.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
}
await sleep(300);
const counter = document.querySelector(".counter .big").textContent;
if (Number(counter) < 5) throw new Error("presses did not register, counter=" + counter);

// Buy a Point Maker (15 points): press until affordable, then click first cost button.
for (let i = 0; i < 12; i++) btn.dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
await sleep(200);
const cost = document.querySelector(".costbtn");
cost.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
await sleep(200);
if (!document.querySelector(".row .count")) throw new Error("generator purchase did not register");

// Achievement toast should have queued at some point; check achievements list state via Numbers tab.
const tabs = [...document.querySelectorAll(".tabbar button")];
tabs.find((t) => t.textContent === "Numbers").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
await sleep(150);
if (!text().includes("Games named this")) throw new Error("Numbers tab did not render");
if (!text().includes("You pressed the button.")) throw new Error("achievement not unlocked/listed");

console.log("dom: mount, tick, press, buy, tabs, achievements — all good. Counter:", document.querySelector(".counter .big")?.textContent ?? "(on numbers tab)");
root.unmount();
process.exit(0);
