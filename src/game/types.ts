import type { Decimal } from "./num";

/** A tier's constitution within a scenario. Raw content: tiers are numbers. */
export interface TierDef {
  /** Base seconds per cycle before speed multipliers. */
  basePeriod: number;
  /** Units of the target tier paid per unit held, per cycle completion. */
  baseValue: number;
  baseCost: number;
  costGrowth: number;
  /** Index this tier pays into; -1 pays score. Usually i-1; scenarios may bridge. */
  target: number;
  /** Payout efficiency into target (1 normally; bridges may discount). */
  efficiency: number;
}

export interface ScenarioDef {
  id: string;
  name: string;
  /** One-line diff description shown raw in the picker. */
  diff: string;
  tiers: TierDef[];
  /** Reach goal: score in a single run. */
  goal: number;
  /** Reset thresholds: run score needed for 1, 2, 3 picks. */
  pickAt: [number, number, number];
  /** First milestone span (doubling spans after). */
  milestoneFirst: number;
  milestoneMult: number;
}

export type Stat = "value" | "speed" | "cost";

/** Purchase quantities. "milestone" buys exactly up to the next hand-bought milestone. */
export type BuyAmount = 1 | 10 | "max" | "milestone";

export interface Card {
  kind: "stat" | "hotstart" | "flywheel";
  tier: number; // -1 for exotics
  stat: Stat | null;
  levels: number; // levels granted (stat cards), or bonus start count (hotstart)
  rarity: 0 | 1 | 2;
}

export interface TierState {
  /** Held units. Decimal: produced by the chain, so it has no ceiling. */
  count: Decimal;
  /** Hand-bought. Native: bounded by what a player can actually buy. */
  bought: number;
  /** Cycle phase in [0,1). Persists through reset. */
  phase: number;
  /** Completions witnessed this run. */
  cycles: number;
}

/** Per-scenario persistent progress. */
export interface ScenarioProgress {
  /** tableau[tier][stat] = accumulated levels (additive; mult = 1 + 0.5 × levels). */
  tableau: Record<number, Record<Stat, number>>;
  hotstart: number;
  flywheel: boolean;
  resets: number;
  picks: number;
  bestRun: Decimal;
  totalScore: Decimal;
  beaten: boolean;
  everBought: number[]; // per-tier max bought ever (drives visibility)
}

export interface GameState {
  scenario: string;
  score: Decimal;
  runScore: Decimal;
  tiers: TierState[];
  progress: Record<string, ScenarioProgress>;
  /** Pool weights accrued this run: pool[tier][stat]. */
  pool: Record<number, Record<Stat, number>>;
  /** Rerolls held, earned by time away. Spent one per reroll. */
  rerolls: number;
  startedAt: number;
  lastSeen: number;
  runStartedAt: number;
}

export interface DrawOffer {
  cards: Card[];
  picks: number;
  liquidated: Decimal;
}

export interface OfflineReport {
  awayMs: number;
  bankedGained: number;
  trickle: Decimal;
}
