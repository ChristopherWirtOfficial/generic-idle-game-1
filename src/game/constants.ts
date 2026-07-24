import type { ScenarioDef, TierDef } from "./types";

export const SAVE_KEY = "gig1:save3";
export const TICK_MS = 100;
export const SAVE_INTERVAL_MS = 20_000;
export const OFFLINE_MIN_MS = 60_000;
/** Every BANK_MS away banks one bonus draw option, up to BANK_CAP. */
export const BANK_MS = 20 * 60_000;
export const BANK_CAP = 6;
/** Offline trickle: this many seconds of tier-1 output, credited on return. */
export const TRICKLE_S = 60;

export const BASE_DRAW = 3;
/** Pick thresholds rise with picks taken: threshold × (1 + a·P)^b. */
export const THRESH_A = 0.12;
export const THRESH_B = 2;
export const RARITY_LEVELS = [1, 2, 4] as const;
export const LEVEL_POTENCY = 0.75;
export const RARITY_WEIGHT = [0.7, 0.25, 0.05] as const;
export const EXOTIC_CHANCE = 0.06;
export const HOTSTART_BONUS = 5;

/** Renderer-only threshold: below this period a wheel draws as glow. Never in the economy. */
export const GLOW_PERIOD_S = 0.3;

export const NUM_CLAMP = 1e300;

function chain(specs: Array<Partial<TierDef> & { basePeriod: number; baseCost: number; costGrowth: number }>): TierDef[] {
  return specs.map((s, i) => ({
    basePeriod: s.basePeriod,
    baseValue: s.baseValue ?? 1,
    baseCost: s.baseCost,
    costGrowth: s.costGrowth,
    target: s.target ?? i - 1,
    efficiency: s.efficiency ?? 1,
  }));
}

const BASELINE_TIERS = chain([
  { basePeriod: 5,   baseCost: 3,     costGrowth: 1.1 },
  { basePeriod: 10,  baseCost: 1e2,   costGrowth: 1.13 },
  { basePeriod: 20,  baseCost: 1.5e4, costGrowth: 1.16 },
  { basePeriod: 40,  baseCost: 1.2e6, costGrowth: 1.19 },
  { basePeriod: 80,  baseCost: 3e8,   costGrowth: 1.22 },
  { basePeriod: 160, baseCost: 2e11,  costGrowth: 1.26 },
  { basePeriod: 320, baseCost: 3e14,  costGrowth: 1.31 },
  { basePeriod: 640, baseCost: 1e18,  costGrowth: 1.37 },
]);

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "s1", name: "1", diff: "the constitution as written",
    tiers: BASELINE_TIERS,
    goal: 1e15,
    pickAt: [2e4, 2e7, 2e10],
    milestoneFirst: 25, milestoneMult: 2,
  },
  {
    id: "s2", name: "2", diff: "4 tiers · growth +0.05 each · spans start 50",
    tiers: chain([
      { basePeriod: 5,  baseCost: 3,     costGrowth: 1.15 },
      { basePeriod: 10, baseCost: 1e2,   costGrowth: 1.18 },
      { basePeriod: 20, baseCost: 1.5e4, costGrowth: 1.21 },
      { basePeriod: 40, baseCost: 1.2e6, costGrowth: 1.24 },
    ]),
    goal: 1e12,
    pickAt: [2e4, 2e7, 2e10],
    milestoneFirst: 50, milestoneMult: 2,
  },
  {
    id: "s3", name: "3", diff: "milestones ×3 · spans start 75 · costs ×10",
    tiers: BASELINE_TIERS.map((t) => ({ ...t, baseCost: t.baseCost * 10 })),
    goal: 1e15,
    pickAt: [2e5, 2e8, 2e11],
    milestoneFirst: 75, milestoneMult: 3,
  },
  {
    id: "s4", name: "4", diff: "tier 4 is dead · 5 pays 3 at half rate",
    tiers: BASELINE_TIERS.map((t, i) => {
      if (i === 3) return { ...t, baseValue: 0 };
      if (i === 4) return { ...t, target: 2, efficiency: 0.5 };
      return t;
    }),
    goal: 1e15,
    pickAt: [2e4, 2e7, 2e10],
    milestoneFirst: 25, milestoneMult: 2,
  },
  {
    id: "s5", name: "5", diff: "periods ÷4 · growth +0.06 each",
    tiers: BASELINE_TIERS.map((t) => ({ ...t, basePeriod: t.basePeriod / 4, costGrowth: t.costGrowth + 0.06 })),
    goal: 1e15,
    pickAt: [2e4, 2e7, 2e10],
    milestoneFirst: 25, milestoneMult: 2,
  },
];

export function scenarioById(id: string): ScenarioDef {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]!;
}

/** Tier hues: full spectral ramp, 1 = red end, 8 = violet end. */
export const TIER_HUES = [4, 32, 52, 110, 165, 205, 250, 285];
