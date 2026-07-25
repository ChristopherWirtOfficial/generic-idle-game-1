/**
 * @vitest-environment jsdom
 *
 * End-to-end through the real component tree: load a rich save, buy inline off
 * the rail, bloom a row, walk the tabs, run the full reset ceremony, and prove
 * what lands in storage. Ordered — each step builds on the last.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import App from "../App";

const store = new Map<string, string>();

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
      tableau: { 0: { value: 2, speed: 0, cost: 0 } }, hotstart: 0, flywheel: false,
      resets: 3, picks: 0, bestRun: 6e7, totalScore: 9e7, beaten: false,
      everBought: [30, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  pool: { 0: { value: 40, speed: 6, cost: 30 } },
  rerolls: 0,
  startedAt: Date.now() - 3600_000,
  lastSeen: Date.now() - 5_000,
  runStartedAt: Date.now() - 600_000,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const $ = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const $$ = (sel: string) => [...document.querySelectorAll(sel)] as HTMLElement[];
const byText = (sel: string, txt: string) => $$(sel).find((el) => el.textContent?.includes(txt));

let heads: HTMLElement[] = [];

beforeAll(async () => {
  store.set("gig1:save3", JSON.stringify(seed));
  (globalThis as Record<string, unknown>).storage = {
    async get(key: string) { const v = store.get(key); return v === undefined ? null : { key, value: v }; },
    async set(key: string, value: string) { store.set(key, value); return { key, value }; },
    async delete(key: string) { store.delete(key); return { key, deleted: true }; },
  };

  // Deterministic ceremony: the app draws with Math.random, and an unlucky
  // HOTSTART could otherwise pay out before the assertions run.
  let rngSeed = 7;
  Math.random = () => {
    rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
    return rngSeed / 0x7fffffff;
  };

  document.body.innerHTML = '<div id="root"></div>';
  createRoot($("#root")!).render(createElement(App));
  await sleep(500);
});

describe("the rail is the game", () => {
  it("renders the seeded chain and score", () => {
    expect($$(".row").length).toBeGreaterThanOrEqual(2);
    expect($(".scorenum")?.textContent).toBe("1.00M");
    expect(byText(".scoresub span", "run")).toBeDefined();
  });

  it("gives every row a dial with both arcs", () => {
    // cycle (rAF-owned) and milestone (moves only on hand-buys)
    expect($(".row .carc")).not.toBeNull();
    expect($(".row .marc")).not.toBeNull();
  });

  it("shows tableau levels on the collapsed row", () => {
    const strip = $(".row .levels");
    expect(strip).not.toBeNull();
    expect(strip!.querySelectorAll(".lv")).toHaveLength(3);
  });

  it("offers x1/x10/max/next milestone globally", () => {
    const segs = $$(".seg button").map((b) => b.textContent);
    expect(segs).toHaveLength(4);
    expect(segs).toContain("max");
    expect(segs).toContain("next milestone");
  });

  it("buys inline off the row, with no tab switch", async () => {
    const plate = $('[aria-label="buy 1 tier 1"]') as HTMLButtonElement | null;
    expect(plate).not.toBeNull();
    expect(plate!.disabled).toBe(false);
    expect(plate!.querySelector(".fill")).not.toBeNull();
    plate!.click();
    await sleep(250);
    expect($(".scorenum")?.textContent).not.toBe("1.00M");
  });
});

describe("the bloom", () => {
  it("opens with four priced quantities", async () => {
    heads = $$(".row .head");
    heads[heads.length - 1]!.click();
    await sleep(300);
    expect($(".row.open")).not.toBeNull();

    const qs = $$(".row.open .q");
    expect(qs).toHaveLength(4);
    expect(qs.every((q) => q.querySelector(".n") && q.querySelector(".amt"))).toBe(true);
    expect($(".row.open .q.mode")).not.toBeNull();

    // max must state its real count, including zero: a bare "max" on a button
    // that can buy nothing reads as affordable.
    const maxCell = qs.find((q) => q.querySelector(".lab")?.textContent === "max");
    expect(maxCell?.querySelector(".n")?.textContent).toMatch(/^\+\d/);
  });

  it("reveals hand-bought progress, chips and cycle time", () => {
    expect(byText(".row.open .ms", "by hand")?.textContent).toContain("31");
    expect($$(".row.open .chip")).toHaveLength(3);
    expect($(".row.open .cyc")?.textContent).toContain("s");
  });

  it("hides the resting level strip while open", () => {
    // Still in the DOM — CSS hides it, because the bloom's chips say the same
    // thing with multipliers and two readouts of one fact is a lie waiting.
    const strip = $(".row.open .levels");
    expect(strip).not.toBeNull();
    expect(getComputedStyle(strip!).display).toBe("none");
  });
});

describe("buy-to-milestone", () => {
  it("prices exactly the gap to the next milestone", async () => {
    byText(".seg button", "next milestone")!.click();
    await sleep(200);
    expect($('[aria-label="buy 44 tier 1"]')).not.toBeNull(); // 31 -> 75
  });

  it("collapses to the unlock on a tier holding nothing", () => {
    // You cannot aim at a hand-bought milestone on a tier you have not opened.
    const locked = $('[aria-label="buy 1 tier 2"]');
    expect(locked).not.toBeNull();
    expect(locked!.querySelector(".lab")?.textContent).toBe("unlock");
  });

  it("collapses the row again", async () => {
    byText(".seg button", "×1")!.click();
    await sleep(150);
    heads[heads.length - 1]!.click();
    await sleep(300);
    expect($(".row.open")).toBeNull();
  });
});

describe("reset tab is the strategy surface", () => {
  beforeAll(async () => {
    byText(".tabbar button", "RESET")!.click();
    await sleep(200);
  });

  it("highlights met thresholds and draws the pool histogram", () => {
    expect($$(".threshrow.met").length).toBeGreaterThanOrEqual(2);
    expect($$(".hrow").length).toBeGreaterThanOrEqual(3);
  });

  it("lays the histogram bars out rather than leaving them inline", () => {
    // The bar is a span in a non-flex parent: without display:block it renders
    // 0x0 and the entire strategy surface silently disappears.
    const hbar = $(".hrow .hbar")!;
    expect(getComputedStyle(hbar).display).toBe("block");
    expect(hbar.style.width).toMatch(/%/);
  });

  it("states the odds as odds, and they add up to a whole draw", () => {
    // The instrument never lies: these percentages ARE the roll. If they do not
    // sum to 100 the histogram is describing a distribution nobody samples.
    const shown = $$(".hrow .hpct").map((e) => Number(e.textContent!.replace("%", "")));
    expect(shown.length).toBe($$(".hrow").length);
    expect(shown.reduce((a, b) => a + b, 0)).toBeGreaterThan(97);
    expect(shown.reduce((a, b) => a + b, 0)).toBeLessThan(103);
    // Every line the player has opened is on the table, none at zero.
    expect(Math.min(...shown)).toBeGreaterThan(0);
  });

  it("shows the earned part of a bar sitting on the base slice", () => {
    expect($$(".hrow .hfloor").length).toBe($$(".hrow").length);
    expect($$(".hrow .hearned").length).toBe($$(".hrow").length);
    expect($(".hrow .htick")!.getAttribute("style")).toMatch(/left:/);
  });

  it("scales bars to the ceiling, so no bar ever overflows its track", () => {
    // Full width means "pinned at the cap", the same thing every time. Scaled
    // to the current leader instead, the axis would move under the player.
    const widths = $$(".hrow .hbar").map((e) => parseFloat((e as HTMLElement).style.width));
    expect(widths.every((w) => w >= 0 && w <= 100.001)).toBe(true);
    const ticks = $$(".hrow .htick").map((e) => (e as HTMLElement).style.left);
    expect(new Set(ticks).size).toBe(1); // one axis for every row
  });
});

describe("ceremony", () => {
  it("runs the full reveal and lands back zeroed", async () => {
    const resetSlab = byText(".slab", "RESET") as HTMLButtonElement;
    expect(resetSlab.disabled).toBe(false);
    expect(resetSlab.textContent).toContain("2 picks");
    resetSlab.click();
    await sleep(300);

    expect($(".veil")).not.toBeNull();
    expect(byText(".liq", "cashed out")).toBeDefined();

    const cards = $$(".playcard");
    expect(cards).toHaveLength(3);
    const statCards = cards.filter(
      (c) => !c.textContent?.includes("START") && !c.textContent?.includes("FLYWHEEL"),
    );
    expect(statCards.length).toBeGreaterThanOrEqual(2);
    statCards[0]!.click();
    statCards[1]!.click();
    await sleep(100);

    const keep = byText(".donebtn", "KEEP") as HTMLButtonElement;
    expect(keep.disabled).toBe(false);
    keep.click();
    await sleep(400);

    expect($(".veil")).toBeNull();
    // The run is zeroed, but tier 1 starts paying immediately, so pinning the
    // literal "run 0" just races the first payout. Assert the collapse instead:
    // it was 5e7 before the reset.
    const runText = byText(".scoresub span", "run")!.textContent!;
    const runValue = Number(runText.replace(/[^0-9.]/g, "")) || 0;
    expect(runValue).toBeLessThan(1e4);
  });
});

describe("more tab", () => {
  beforeAll(async () => {
    byText(".tabbar button", "MORE")!.click();
    await sleep(200);
  });

  it("counts the picks just taken", () => {
    expect(byText(".kv", "picks taken")?.textContent).toContain("2");
  });

  it("cheats levels in place without touching pick history", async () => {
    const plus = $('[aria-label="cheat 1 value +"]');
    expect(plus).not.toBeNull();
    // Relative, not absolute: what the tier sits at here depends on which cards
    // the seeded draw happened to offer, which is not what this test is about.
    const before = Number(plus!.parentElement!.querySelector(".cl")!.textContent);
    const picksBefore = byText(".kv", "picks taken")?.textContent;
    plus!.click();
    await sleep(50);
    const after = Number($('[aria-label="cheat 1 value +"]')!.parentElement!.querySelector(".cl")!.textContent);
    expect(after).toBe(before + 1);
    // The ladder must not move: cheat grants levels without pick history.
    expect(byText(".kv", "picks taken")?.textContent).toBe(picksBefore);
  });

  it("keeps scenario 2 locked", () => {
    expect(byText(".scenrow", "locked")).toBeDefined();
  });
});

describe("log tab", () => {
  beforeAll(async () => {
    byText(".tabbar button", "LOG")!.click();
    await sleep(200);
  });

  it("lists notes with only headlines showing", () => {
    expect($$(".logentry").length).toBeGreaterThanOrEqual(1);
    // One open at a time keeps it scannable rather than a wall of text.
    expect($$(".logentry.open")).toHaveLength(1);
    expect($(".logentry.open .logbodypad p")).not.toBeNull();
  });

  it("toggles an entry shut", async () => {
    $$(".logentry .loghead")[0]!.click();
    await sleep(250);
    expect($$(".logentry.open")).toHaveLength(0);
  });
});

describe("persistence", () => {
  it("writes a save when the tab hides, with phase held exactly", async () => {
    store.delete("gig1:save3");
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await sleep(300);

    const saved = store.get("gig1:save3");
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved!);
    // Warm means held, not spinning: tier 2 was seeded unowned at phase 0.25 and
    // must come out at exactly 0.25 — never advanced, never zeroed by the reset.
    expect(parsed.tiers[1].phase).toBe(0.25);
    expect(parsed.progress.s1.picks).toBe(2);
    expect(Object.keys(parsed.pool).length).toBeLessThanOrEqual(1);
  });
});
