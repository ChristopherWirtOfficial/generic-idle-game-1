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
/**
 * Away time buys REROLLS, not a bigger hand.
 *
 * Banking used to add cards, and under the old draw that couldn't run away:
 * ~48% of cards were duplicates, so nine cards was really four or five distinct
 * lines. Sampling without replacement removed that accidental brake, and nine
 * distinct lines on an early run is the entire pool — a menu, not a draw. One
 * pick out of nine is also pure upside: nothing is given up, so there is no
 * decision in it.
 *
 * A reroll keeps the hand at BASE_DRAW and spends the same earned resource on a
 * question instead: this hand is in front of you and the next one is not, so is
 * it good enough? That is a real stake, it costs nothing to read, and it does
 * not get worse as the pool grows. Depth should buy better cards and more
 * PICKS — never more options to hold in your head.
 */
/** Pick thresholds rise with picks taken: threshold × (1 + a·P)^b. */
export const THRESH_A = 0.12;
export const THRESH_B = 2;
export const RARITY_LEVELS = [1, 2, 4] as const;
export const LEVEL_POTENCY = 1;
export const RARITY_WEIGHT = [0.7, 0.25, 0.05] as const;
export const EXOTIC_CHANCE = 0.06;
export const HOTSTART_BONUS = 5;

/** Renderer-only threshold: below this period a wheel draws as glow. Never in the economy. */
export const GLOW_PERIOD_S = 0.3;

/**
 * Pool weight units. All three sources are priced in the same currency so no
 * one stat can out-shout the others by accident of measurement:
 * - value: 20 per milestone crossed (milestone spans double, so this is log-scaled)
 * - cost: 20 per DOUBLING of hand-bought stake (was +1/unit — linear, which let
 *   cheap tiers bury everything else once cost levels made them cheaper still)
 * - speed: per second spent watching a wheel that hasn't graduated to glow, NOT
 *   per completion — completions scale as 1/period, which handed fast tiers a
 *   flood and starved 640s tiers to nothing.
 *
 * Value 20→40 and speed 0.25→0.75 alongside the shaping floor. A chained run is
 * seconds long, so cost (which fires on every doubling) drowned value (which
 * needs 25 hand-buys) and speed (which needs a clock) in the RAW signal — 90%
 * cost. Shaping alone left the floor doing all the work against that. These
 * make the raw signal less lopsided before it is shaped; the cap keeps a
 * runaway speed line from exceeding 2.2 even splits.
 */
export const VALUE_PER_MILESTONE = 40;
export const COST_PER_DOUBLING = 20;
export const SPEED_PER_SEC = 0.5;

/**
 * NEED: how much a LINE's earned weight is worth once you already hold levels
 * there. Two exponents, because the question has two halves and they want very
 * different strengths.
 *
 * NEED_TIER_P (gentle): a tier you are deep in leans the pool elsewhere. This
 * is the old per-tier damping, kept, because the cost loop really is positive
 * feedback — cheaper, so bought more, so more weight, so offered more.
 *
 * NEED_P (sharp): within a tier, a LINE you have poured levels into gets rare
 * while its neighbours do not. This is the graft, and it is the whole fix for
 * "I never get the tier-1 value card". Per-TIER damping alone had a perverse
 * consequence nobody intended: a veteran's ~200 tier-1 COST levels shrank
 * tier-1 VALUE by exactly as much, so the line you had starved was punished
 * for the line you had gorged. Three of the five explorations arrived at this
 * same line of code independently.
 *
 * Applied to the floor slice too, not just the earned weight — otherwise the
 * floor is a standing promise that never diminishes, which is a focus engine.
 */
export const NEED_TIER_P = 0.25;
export const NEED_P = 2;

/**
 * Signal → odds. The behavioural sources are right: a run that was all buying
 * really should lean cost. Raw PROPORTIONALITY was wrong. Cost weight is
 * 20·log2(stake) and lands in the hundreds; speed weight is 0.25/s and a
 * chained run is eight seconds long, so it lands at two. Fifty to one becomes
 * "cost, always" — measured at 86% of every card offered past the first hour,
 * with tier-1 value at 2%.
 *
 * So sample on w^POOL_ALPHA instead. The exponent preserves the ORDER of the
 * signal (more engagement is still more odds) and destroys the landslide:
 * fifty to one becomes six to one. It is the same knob a designer reaches for
 * when a leaderboard is technically correct and unreadable.
 */
export const POOL_ALPHA = 0.45;

/**
 * Then rails, both quoted in EVEN SPLITS — if the player knows n lines, an even
 * split is 1/n, and these are the multiples of it no line may pass. Quoting
 * them this way is what makes the shape scale-free: the pool looks the same at
 * three known lines and at twenty-one, and the histogram can draw one tick at
 * the even split with the whole band read off it.
 *
 * FLOOR: never below a quarter of an even split. Tier-1 value is one of the
 * largest income levers in the game and the pool had stopped offering it at
 * all — because in a chained run you cross no tier-1 milestone, and w^alpha of
 * zero is still zero. Only a floor answers a zero. It is not a menu: it buys a
 * line the right to turn up, and nothing else — everything above it is earned.
 *
 * CAP: never above 2.2 even splits, and the spill goes out FLAT rather than
 * proportionally, so it reaches the lines that earned nothing instead of
 * handing the landslide to the next cost line down. This is the rail the
 * histogram states loudest: capped bars sit exactly level with each other, so
 * you can see the run's loudest habit has stopped buying more of the draw.
 */
export const POOL_FLOOR = 0.25;
export const POOL_CAP = 2.2;

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
  { basePeriod: 2,   baseCost: 5,     costGrowth: 1.16 },
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
      { basePeriod: 2,  baseCost: 5,     costGrowth: 1.2 },
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
