import type { AchievementDef, GeneratorDef, UpgradeDef } from "./types";

export const SAVE_KEY = "gig1:save";
export const SAVE_VERSION = 1;
export const COST_GROWTH = 1.15;
export const TICK_MS = 100;
export const SAVE_EVERY_MS = 20_000;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
export const OFFLINE_MIN_MS = 60_000;
export const PP_MULT_EACH = 0.1;
export const ACH_MULT_EACH = 0.05;
export const PP_BASE = 1_000_000;

export const GENERATORS: GeneratorDef[] = [
  { name: "Point Maker", blurb: "Makes points.", baseCost: 15, baseRate: 0.1 },
  { name: "Point Machine", blurb: "A machine that makes points.", baseCost: 100, baseRate: 1 },
  { name: "Point Factory", blurb: "Makes points in bulk.", baseCost: 1_100, baseRate: 8 },
  { name: "Point Plant", blurb: "Industrial points.", baseCost: 12_000, baseRate: 47 },
  { name: "Point Corporation", blurb: "Points, at scale.", baseCost: 130_000, baseRate: 260 },
  { name: "Point Conglomerate", blurb: "Owns several point companies.", baseCost: 1_400_000, baseRate: 1_400 },
  { name: "Point Planet", blurb: "A planet that is points.", baseCost: 20_000_000, baseRate: 7_800 },
  { name: "Point Singularity", blurb: "All points, eventually.", baseCost: 330_000_000, baseRate: 44_000 },
];

export const UPGRADES: UpgradeDef[] = [
  { id: "press1", name: "Firmer Pressing", blurb: "You press harder. Presses give twice the points.", cost: 100, effect: { kind: "press", mult: 2 } },
  { id: "glob1", name: "Point Doubler", blurb: "Doubles points made per second.", cost: 500, effect: { kind: "global", mult: 2 } },
  { id: "gen0a", name: "Faster Point Makers", blurb: "They make points faster.", cost: 1_000, effect: { kind: "gen", gen: 0, mult: 2 } },
  { id: "press2", name: "Even Firmer Pressing", blurb: "You press even harder.", cost: 5_000, effect: { kind: "press", mult: 2 } },
  { id: "gen1a", name: "Faster Point Machines", blurb: "The machines hurry.", cost: 20_000, effect: { kind: "gen", gen: 1, mult: 2 } },
  { id: "glob2", name: "Point Doubler 2", blurb: "Doubles points again.", cost: 50_000, effect: { kind: "global", mult: 2 } },
  { id: "pct1", name: "Percentage Pressing", blurb: "Presses also give 1% of your points per second.", cost: 100_000, effect: { kind: "pctPress" } },
  { id: "gen2a", name: "Faster Point Factories", blurb: "The factories hum.", cost: 500_000, effect: { kind: "gen", gen: 2, mult: 2 } },
  { id: "glob3", name: "Point Doubler 3", blurb: "Doubles points a third time.", cost: 5_000_000, effect: { kind: "global", mult: 2 } },
  { id: "auto1", name: "Automatic Pressing", blurb: "The button presses itself once per second. You are no longer needed.", cost: 10_000_000, effect: { kind: "autoPress" } },
  { id: "gen3a", name: "Faster Point Plants", blurb: "The plants churn.", cost: 50_000_000, effect: { kind: "gen", gen: 3, mult: 2 } },
  { id: "glob4", name: "Point Tripler", blurb: "Triples points. An escalation.", cost: 500_000_000, effect: { kind: "global", mult: 3 } },
  { id: "all1", name: "Faster Everything", blurb: "Everything, faster.", cost: 10_000_000_000, effect: { kind: "allGens", mult: 2 } },
  { id: "glob5", name: "Point Doubler 4", blurb: "Doubles points a fourth time.", cost: 1e12, effect: { kind: "global", mult: 2 } },
  { id: "glob6", name: "Final Doubler", blurb: "Doubles points. For now.", cost: 1e15, effect: { kind: "global", mult: 2 } },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "a-press1", name: "You pressed the button.", test: (s) => s.presses >= 1 },
  { id: "a-press100", name: "You kept pressing.", test: (s) => s.presses >= 100 },
  { id: "a-press1k", name: "The button is worn.", test: (s) => s.presses >= 1_000 },
  { id: "a-pts100", name: "The number went up.", test: (s) => s.everEarned >= 100 },
  { id: "a-pts1e4", name: "The number kept going up.", test: (s) => s.everEarned >= 10_000 },
  { id: "a-pts1e6", name: "A large number.", test: (s) => s.everEarned >= 1e6 },
  { id: "a-pts1e9", name: "A very large number.", test: (s) => s.everEarned >= 1e9 },
  { id: "a-pts1e12", name: "The number is beyond you.", test: (s) => s.everEarned >= 1e12 },
  { id: "a-gen1", name: "You bought a thing.", test: (s) => s.gens.some((n) => n > 0) },
  { id: "a-gen50", name: "You own many things.", test: (s) => totalGens(s) >= 50 },
  { id: "a-gen200", name: "You own most things.", test: (s) => totalGens(s) >= 200 },
  { id: "a-genall", name: "One of everything.", test: (s) => s.gens.length === GENERATORS.length && s.gens.every((n) => n > 0) },
  { id: "a-upg5", name: "Improved.", test: (s) => s.upgrades.length >= 5 },
  { id: "a-reset1", name: "You started over.", test: (s) => s.resets >= 1 },
  { id: "a-pp10", name: "You started over, efficiently.", test: (s) => s.pp >= 10 },
];

function totalGens(s: { gens: number[] }): number {
  return s.gens.reduce((a, b) => a + b, 0);
}

/** The signature line. Only ever describes the magnitude of the number. */
export const STATUS_LINES: [number, string][] = [
  [0, "The number is small."],
  [1e2, "The number grows."],
  [1e3, "The number is respectable."],
  [1e4, "The number continues."],
  [1e5, "The number is large."],
  [1e6, "The number is quite large."],
  [1e7, "The number is very large."],
  [1e8, "The number is difficult to picture."],
  [1e9, "The number exceeds most needs."],
  [1e12, "The number is abstract now."],
  [1e15, "The number has stopped meaning anything."],
  [1e18, "The number persists."],
];

export function statusLine(points: number): string {
  let line = STATUS_LINES[0]?.[1] ?? "";
  for (const [threshold, text] of STATUS_LINES) {
    if (points >= threshold) line = text;
  }
  return line;
}
