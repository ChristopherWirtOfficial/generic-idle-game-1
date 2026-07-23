import {
  ACHIEVEMENTS, ACH_MULT_EACH, CRUNCH_LOG_START, CRUNCH_LOG_RATE, MILESTONE_FIRST,
  MILESTONE_MULT, DUST_CLAMP, SINGULARITY_MULT_EACH, TIERS, UPGRADES,
} from "./constants";
import type { GameState } from "./types";

const upgradeById = new Map(UPGRADES.map((u) => [u.id, u]));

export function achMult(s: GameState): number {
  return 1 + s.achievements.length * ACH_MULT_EACH;
}

export function singularityMult(s: GameState): number {
  return 1 + s.singularities * SINGULARITY_MULT_EACH;
}

/** Level L is reached at MILESTONE_FIRST * (2^L - 1) bought: 25, 75, 175, 375... */
export function milestoneLevel(s: GameState, i: number): number {
  const bought = s.tiers[i]?.bought ?? 0;
  return Math.max(0, Math.floor(Math.log2(bought / MILESTONE_FIRST + 1)));
}

/** Bought count needed for the next milestone level. */
export function nextMilestoneAt(s: GameState, i: number): number {
  return MILESTONE_FIRST * (Math.pow(2, milestoneLevel(s, i) + 1) - 1);
}

/** Multiplier applied to tier i's output (before dust-only bonuses). */
export function tierMult(s: GameState, i: number): number {
  let m = Math.pow(MILESTONE_MULT, milestoneLevel(s, i));
  for (const id of s.upgrades) {
    const u = upgradeById.get(id);
    if (!u || u.kind) continue;
    if (u.target === i || u.target === "global") m *= u.mult;
  }
  return m;
}

/** Rate at which tier i emits its product (units/sec), all bonuses included. */
export function tierOutput(s: GameState, i: number): number {
  const def = TIERS[i];
  const st = s.tiers[i];
  if (!def || !st) return 0;
  let out = st.count * def.baseRate * tierMult(s, i);
  if (i === 0) out *= achMult(s) * singularityMult(s);
  return out;
}

export function dustPerSecond(s: GameState): number {
  return tierOutput(s, 0);
}

export function pressValue(s: GameState): number {
  let v = 1;
  let pct = 0;
  for (const id of s.upgrades) {
    const u = upgradeById.get(id);
    if (!u || u.target !== "press") continue;
    if (u.kind === "pressPercent") pct += 0.02;
    else if (!u.kind) v *= u.mult;
  }
  v *= achMult(s) * singularityMult(s);
  return v + pct * dustPerSecond(s);
}

export function hasAutoPress(s: GameState): boolean {
  return s.upgrades.includes("u-autopress");
}

export function press(s: GameState): number {
  const v = pressValue(s);
  s.dust += v; s.lifetimeDust += v; s.runDust += v;
  s.presses += 1;
  return v;
}

export function tierCost(s: GameState, i: number, n = 1): number {
  const def = TIERS[i];
  const st = s.tiers[i];
  if (!def || !st || n <= 0) return Infinity;
  const g = def.costGrowth;
  const first = def.baseCost * Math.pow(g, st.bought);
  return first * (Math.pow(g, n) - 1) / (g - 1);
}

export function maxAffordable(s: GameState, i: number): number {
  const def = TIERS[i];
  const st = s.tiers[i];
  if (!def || !st) return 0;
  const g = def.costGrowth;
  const first = def.baseCost * Math.pow(g, st.bought);
  if (s.dust < first) return 0;
  return Math.floor(Math.log(s.dust * (g - 1) / first + 1) / Math.log(g));
}

export function buyTier(s: GameState, i: number, n: number): boolean {
  const st = s.tiers[i];
  if (!st) return false;
  const cost = tierCost(s, i, n);
  if (n <= 0 || !Number.isFinite(cost) || s.dust < cost) return false;
  s.dust -= cost;
  st.count += n;
  st.bought += n;
  return true;
}

export function buyUpgrade(s: GameState, id: string): boolean {
  const u = upgradeById.get(id);
  if (!u || s.upgrades.includes(id) || s.dust < u.cost) return false;
  s.dust -= u.cost;
  s.upgrades.push(id);
  return true;
}

/** Highest tier index the player has ever been able to see (owned, or next after highest owned). */
export function visibleTiers(s: GameState): number {
  let highest = -1;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const st = s.tiers[i];
    if (st && (st.count > 0 || st.bought > 0)) { highest = i; break; }
  }
  return Math.min(TIERS.length, highest + 2);
}

export function pendingSingularities(s: GameState): number {
  const lg = s.lifetimeDust > 0 ? Math.log10(s.lifetimeDust) : 0;
  const total = Math.max(0, Math.floor((lg - CRUNCH_LOG_START) * CRUNCH_LOG_RATE));
  return Math.max(0, total - s.singularities);
}

export function doCrunch(s: GameState): number {
  const gain = pendingSingularities(s);
  if (gain <= 0) return 0;
  s.singularities += gain;
  s.crunches += 1;
  s.dust = 0;
  s.runDust = 0;
  s.tiers = TIERS.map(() => ({ count: 0, bought: 0 }));
  s.upgrades = [];
  return gain;
}

export function checkAchievements(s: GameState): string[] {
  const fresh: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.check(s)) {
      s.achievements.push(a.id);
      fresh.push(a.id);
    }
  }
  return fresh;
}

/** Advance the simulation. Cascades top-down so feeders use pre-tick counts. */
export function step(s: GameState, dtSec: number): void {
  if (dtSec <= 0) return;
  for (let i = TIERS.length - 1; i >= 1; i--) {
    const below = s.tiers[i - 1];
    if (!below) continue;
    below.count += tierOutput(s, i) * dtSec;
  }
  const gained = dustPerSecond(s) * dtSec;
  s.dust += gained; s.lifetimeDust += gained; s.runDust += gained;
  if (!Number.isFinite(s.dust) || s.dust > DUST_CLAMP) s.dust = DUST_CLAMP;
  if (!Number.isFinite(s.lifetimeDust) || s.lifetimeDust > DUST_CLAMP) s.lifetimeDust = DUST_CLAMP;
  if (!Number.isFinite(s.runDust) || s.runDust > DUST_CLAMP) s.runDust = DUST_CLAMP;
  for (const st of s.tiers) if (!Number.isFinite(st.count) || st.count > DUST_CLAMP) st.count = DUST_CLAMP;
}
