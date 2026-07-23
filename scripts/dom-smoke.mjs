// End-to-end jsdom smoke of the flattened artifact: press sky, buy a Mote, verify save.
import { JSDOM } from "jsdom";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

execSync("npx esbuild dist-artifact/generic-idle-game-1.jsx --bundle --external:react --external:react/jsx-runtime --external:react-dom/client --format=esm --platform=node --jsx=automatic --outfile=.domtmp/app.mjs", { stdio: "inherit" });

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "https://example.test/",
  pretendToBeVisual: true,
});
const { window } = dom;

// Node 22: navigator is a getter-only global; must defineProperty.
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.window = window;
globalThis.document = window.document;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.matchMedia = globalThis.matchMedia;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.ResizeObserver = globalThis.ResizeObserver;
window.HTMLCanvasElement.prototype.getContext = () => null; // Sky degrades gracefully without 2d ctx

const stored = new Map();
const storage = {
  async get(k) { return stored.has(k) ? { key: k, value: stored.get(k) } : null; },
  async set(k, v) { stored.set(k, v); return { key: k, value: v }; },
  async delete(k) { stored.delete(k); return { key: k, deleted: true }; },
};
window.storage = storage;
globalThis.storage = storage;

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../.domtmp/app.mjs");

const { act } = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const root = createRoot(window.document.getElementById("root"));
await act(async () => { root.render(React.createElement(App)); });
await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

const $ = (sel) => window.document.querySelector(sel);
const $$ = (sel) => [...window.document.querySelectorAll(sel)];
const text = () => window.document.body.textContent ?? "";

// 1. Shell renders: sky press target + tabs.
const sky = $('[aria-label="Condense stardust"]');
if (!sky) throw new Error("sky press surface missing");
for (const label of ["Build", "Improve", "Crunch", "More"]) {
  if (!$$("nav.tabbar button").some((b) => b.textContent.includes(label))) throw new Error(`tab ${label} missing`);
}
if (!$(".dustnum")) throw new Error("dust readout missing");

// 2. Tap the sky 20 times -> ~20 dust, floaty appears, First Light achievement.
for (let i = 0; i < 20; i++) {
  await act(async () => {
    sky.dispatchEvent(new window.PointerEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10 }));
  });
}
await act(async () => { await new Promise((r) => setTimeout(r, 250)); });
const dustNow = Number($(".dustnum").textContent.replace(/,/g, ""));
if (!(dustNow >= 20)) throw new Error(`expected >=20 dust, saw ${$(".dustnum").textContent}`);
if (!text().includes("First Light")) throw new Error("First Light toast/achievement missing");

// 3. Buy slab enabled at 20 dust (Mote costs 15) -> buy -> held 1, dust drops.
const slab = $(".buyslab");
if (!slab) throw new Error("buy slab missing");
if (slab.disabled) throw new Error("buy slab should be affordable at 20 dust");
await act(async () => { slab.click(); });
if (!text().includes("1 held")) throw new Error("owned count did not update after buy");
const dustAfter = Number($(".dustnum").textContent.replace(/,/g, ""));
if (!(dustAfter < dustNow)) throw new Error("dust did not decrease after purchase");

// 4. Tick advances dust passively (0.6/s from one Mote).
await act(async () => { await new Promise((r) => setTimeout(r, 2600)); });
const dustLater = Number($(".dustnum").textContent.replace(/,/g, ""));
if (!(dustLater > dustAfter)) throw new Error("passive production not ticking");

// 5. Tabs switch panels.
const improveBtn = $$("nav.tabbar button").find((b) => b.textContent.includes("Improve"));
await act(async () => { improveBtn.click(); });
if (!text().includes("Firmer Press")) throw new Error("Improve panel content missing");
const crunchBtn = $$("nav.tabbar button").find((b) => b.textContent.includes("Crunch"));
await act(async () => { crunchBtn.click(); });
if (!text().includes("Big Crunch")) throw new Error("Crunch panel missing");
const moreBtn = $$("nav.tabbar button").find((b) => b.textContent.includes("More"));
await act(async () => { moreBtn.click(); });
if (!text().includes("Sky taps")) throw new Error("More panel missing");

// 6. visibilitychange hidden -> save lands in window.storage under gig1:save2.
Object.defineProperty(window.document, "visibilityState", { value: "hidden", configurable: true });
await act(async () => { window.document.dispatchEvent(new window.Event("visibilitychange")); });
await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
if (!stored.has("gig1:save2")) throw new Error("save not persisted on hide");
const save = JSON.parse(stored.get("gig1:save2"));
if (!(save.presses >= 20 && save.tiers[0].bought === 1)) throw new Error("save contents wrong");

await act(async () => { root.unmount(); });
console.log("dom-smoke: sky press, purchase, ticking, tabs, persistence — all pass");
