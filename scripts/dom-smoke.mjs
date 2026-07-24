// jsdom e2e for the flattened artifact: load a rich save, buy, tab-walk, full reset ceremony, persistence.
import { execSync } from "node:child_process";
import { JSDOM } from "jsdom";

execSync("npx esbuild dist-artifact/generic-idle-game-1.jsx --bundle --format=esm --platform=node --external:react --external:react/jsx-runtime --external:react-dom --loader:.jsx=jsx --outfile=.domtmp/app.mjs --log-level=error", { stdio: "inherit" });

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, { pretendToBeVisual: true, url: "https://localhost/" });
const { window } = dom;
for (const k of ["document", "HTMLElement", "SVGElement", "Node", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame", "CustomEvent"]) {
  globalThis[k] = window[k];
}
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.window = window;

const store = new Map();
const seed = {
  scenario: "s1",
  score: 1e6,
  runScore: 5e7,
  tiers: [
    { count: 40, bought: 30, phase: 0.5, cycles: 12 },
    { count: 0, bought: 0, phase: 0.25, cycles: 0 },
    ...Array.from({ length: 6 }, () => ({ count: 0, bought: 0, phase: 0, cycles: 0 })),
  ],
  progress: {
    s1: {
      tableau: { 0: { val: 2, spd: 0, cst: 0 } }, hotstart: 0, flywheel: false,
      resets: 3, picks: 0, bestRun: 6e7, totalScore: 9e7, beaten: false,
      everBought: [30, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  pool: { 0: { val: 40, spd: 6, cst: 30 } },
  bankedDraws: 0,
  startedAt: Date.now() - 3600_000,
  lastSeen: Date.now() - 5_000,
  runStartedAt: Date.now() - 600_000,
};
store.set("gig1:save3", JSON.stringify(seed));
globalThis.storage = window.storage = {
  async get(key) { const v = store.get(key); return v === undefined ? null : { key, value: v }; },
  async set(key, value) { store.set(key, value); return { key, value }; },
  async delete(key) { store.delete(key); return { key, deleted: true }; },
  async list() { return { keys: [...store.keys()] }; },
};

// Deterministic ceremony: the app draws with Math.random; seed it so the fan
// is stable run-to-run (flaky before: a HOTSTART pick could pay out pre-assert).
let rngSeed = 7;
Math.random = () => {
  rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
  return rngSeed / 0x7fffffff;
};

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../.domtmp/app.mjs");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (sel) => window.document.querySelector(sel);
const $$ = (sel) => [...window.document.querySelectorAll(sel)];
const byText = (sel, txt) => $$(sel).find((el) => el.textContent.includes(txt));
let failures = 0;
const check = (name, cond, extra = "") => {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name} ${extra}`); }
};

const root = createRoot($("#root"));
await (async () => { root.render(React.createElement(App)); })();
await sleep(500);

check("rail renders seeded nodes", $$(".node").length >= 2, `${$$(".node").length}`);
check("score shows the seed", $(".scorenum")?.textContent === "1.00M", $(".scorenum")?.textContent);
check("run subtotal visible", byText(".scoresub span", "run") !== undefined);

const boughtBefore = $(".kv b")?.textContent ?? "";
const buySlab = byText(".slab", "BUY");
check("buy slab present & enabled", buySlab !== undefined && !buySlab.disabled);
buySlab.click();
await sleep(250);
check("buy raises bought by hand", ($(".kv b")?.textContent ?? "") !== boughtBefore, $(".kv b")?.textContent);
check("buy spends score", $(".scorenum")?.textContent !== "1.00M", $(".scorenum")?.textContent);

byText(".tabbar button", "RESET").click();
await sleep(200);
check("reset tab: thresholds met highlight", $$(".threshrow.met").length >= 2, `${$$(".threshrow.met").length}`);
check("reset tab: histogram bars from pool", $$(".hrow").length >= 3, `${$$(".hrow").length}`);
const resetSlab = byText(".slab", "RESET");
check("reset slab enabled at 2 picks", resetSlab !== undefined && !resetSlab.disabled && resetSlab.textContent.includes("2 picks"), resetSlab?.textContent);

resetSlab.click();
await sleep(300);
check("ceremony veil appears", $(".veil") !== null);
check("cash-out shown", byText(".liq", "cashed out") !== undefined);
const cards = $$(".playcard");
check("three cards fanned", cards.length === 3, `${cards.length}`);
const statCards = cards.filter((c) => !c.textContent.includes("START") && !c.textContent.includes("FLYWHEEL"));
check("stat cards to pick", statCards.length >= 2, `${statCards.length}`);
statCards[0].click();
statCards[1].click();
await sleep(100);
const keep = byText(".donebtn", "KEEP");
check("KEEP arms after taking picks", keep !== undefined && !keep.disabled);
keep.click();
await sleep(400);
check("ceremony closes", $(".veil") === null);
check("run zeroed after reset", byText(".scoresub span", "run 0") !== undefined, byText(".scoresub span", "run")?.textContent);

byText(".tabbar button", "MORE").click();
await sleep(200);
check("more tab: picks counted", byText(".kv", "picks taken")?.textContent.includes("2"), byText(".kv", "picks taken")?.textContent);
const cheatPlus = document.querySelector('[aria-label="cheat 1 val +"]');
check("cheat panel renders", cheatPlus !== null);
cheatPlus.click();
await sleep(50);
check("cheat raises the level in place", document.querySelector('[aria-label="cheat 1 val +"]').parentElement.querySelector(".cl").textContent === "3");
check("more tab: scenario 2 locked", byText(".scenrow", "locked") !== undefined);

store.delete("gig1:save3");
window.document.dispatchEvent(new window.Event("visibilitychange"));
Object.defineProperty(window.document, "visibilityState", { value: "hidden", configurable: true });
window.document.dispatchEvent(new window.Event("visibilitychange"));
await sleep(300);
const saved = store.get("gig1:save3");
check("hidden tab persists a save", saved !== undefined);
if (saved) {
  const parsed = JSON.parse(saved);
  // Warm means held, not spinning: tier 2 is seeded unowned at phase 0.25 and
  // must come out at exactly 0.25 — never advanced, never zeroed by the reset.
  check("unowned wheel holds its phase exactly", parsed.tiers[1].phase === 0.25, `${parsed.tiers[1].phase}`);
  check("picks recorded in progress", parsed.progress.s1.picks === 2, `${parsed.progress.s1.picks}`);
  check("pool cleared by reset", Object.keys(parsed.pool).length <= 1, JSON.stringify(parsed.pool));
}

execSync("rm -rf .domtmp");
if (failures > 0) { console.error(`\n${failures} FAILURES`); process.exit(1); }
console.log("\ndom smoke: all green");
process.exit(0);
