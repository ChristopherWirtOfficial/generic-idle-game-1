import {
  ACHIEVEMENTS,
  ACH_MULT_EACH,
  COST_GROWTH,
  GENERATORS,
  PP_BASE,
  PP_MULT_EACH,
  UPGRADES,
} from "./constants";
import type { BuyAmount, GameState, UpgradeDef } from "./types";

export function hasUpgrade(s: GameState, id: string): boolean {
  return s.upgrades.includes(id);
}

function ownedUpgrades(s: GameState): UpgradeDef[] {
  return UPGRADES.filter((u) => s.upgrades.includes(u.id));
}

/** Multiplier from prestige points + achievements. Applies to everything. */
export function metaMult(s: GameState): number {
  return (1 + s.pp * PP_MULT_EACH) * (1 + s.achievements.length * ACH_MULT_EACH);
}

/** Points per second from all generators, fully multiplied. */
export function pointsPerSecond(s: GameState): number {
  let globalMult = 1;
  let allGensMult = 1;
  const genMult: number[] = GENERATORS.map(() => 1);
  for (const u of ownedUpgrades(s)) {
    const e = u.effect;
    if (e.kind === "global") globalMult *= e.mult;
    else if (e.kind === "allGens") allGensMult *= e.mult;
    else if (e.kind === "gen") genMult[e.gen] = (genMult[e.gen] ?? 1) * e.mult;
  }
  let base = 0;
  for (let i = 0; i < GENERATORS.length; i++) {
    const def = GENERATORS[i];
    if (!def) continue;
    base += (s.gens[i] ?? 0) * def.baseRate * (genMult[i] ?? 1);
  }
  return base * globalMult * allGensMult * metaMult(s);
}

/** Points per press. */
export function pressValue(s: GameState): number {
  let mult = 1;
  for (const u of ownedUpgrades(s)) {
    if (u.effect.kind === "press") mult *= u.effect.mult;
  }
  const pct = hasUpgrade(s, "pct1") ? pointsPerSecond(s) * 0.01 : 0;
  return 1 * mult * metaMult(s) + pct;
}

export function press(s: GameState): GameState {
  const gain = pressValue(s);
  return earn({ ...s, presses: s.presses + 1 }, gain);
}

function earn(s: GameState, amount: number): GameState {
  return {
    ...s,
    points: s.points + amount,
    runEarned: s.runEarned + amount,
    everEarned: s.everEarned + amount,
  };
}

/** Cost of the next single unit of generator i. */
export function genCost(s: GameState, i: number): number {
  const def = GENERATORS[i];
  if (!def) return Infinity;
  return def.baseCost * Math.pow(COST_GROWTH, s.gens[i] ?? 0);
}

/** Cost of the next n units (geometric series). */
export function genBulkCost(s: GameState, i: number, n: number): number {
  const first = genCost(s, i);
  const r = COST_GROWTH;
  return (first * (Math.pow(r, n) - 1)) / (r - 1);
}

/** Largest n affordable with current points. */
export function genMaxAffordable(s: GameState, i: number): number {
  const first = genCost(s, i);
  const r = COST_GROWTH;
  if (s.points < first) return 0;
  const n = Math.floor(Math.log((s.points * (r - 1)) / first + 1) / Math.log(r));
  return Math.max(0, n);
}

export function resolveBuyCount(s: GameState, i: number, amount: BuyAmount): number {
  if (amount === "max") return Math.max(1, genMaxAffordable(s, i));
  return amount;
}

export function buyGen(s: GameState, i: number, amount: BuyAmount): GameState {
  const n = resolveBuyCount(s, i, amount);
  const cost = genBulkCost(s, i, n);
  if (s.points < cost || n < 1) return s;
  const gens = s.gens.slice();
  gens[i] = (gens[i] ?? 0) + n;
  return { ...s, points: s.points - cost, gens };
}

export function buyUpgrade(s: GameState, id: string): GameState {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def || hasUpgrade(s, id) || s.points < def.cost) return s;
  return { ...s, points: s.points - def.cost, upgrades: [...s.upgrades, id] };
}

/** Prestige points pending for this run. */
export function pendingPP(s: GameState): number {
  return Math.floor(Math.sqrt(s.runEarned / PP_BASE));
}

export function doPrestige(s: GameState): GameState {
  const gained = pendingPP(s);
  if (gained < 1) return s;
  return {
    ...s,
    points: 0,
    runEarned: 0,
    gens: GENERATORS.map(() => 0),
    upgrades: [],
    pp: s.pp + gained,
    resets: s.resets + 1,
  };
}

/** Achievement check: returns the same array reference when nothing changed. */
export function checkAchievements(s: GameState): string[] {
  let next: string[] | null = null;
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.test(s)) {
      next = next ?? s.achievements.slice();
      next.push(a.id);
    }
  }
  return next ?? s.achievements;
}

/** One tick. Applies production, auto-press, achievements, and clock fields. */
export function step(s: GameState, dtMs: number, now: number): GameState {
  const dt = dtMs / 1000;
  let next = earn(s, pointsPerSecond(s) * dt);
  if (hasUpgrade(next, "auto1")) {
    next = earn(next, pressValue(next) * dt);
  }
  next = { ...next, playedMs: s.playedMs + dtMs, lastSeen: now };
  const ach = checkAchievements(next);
  if (ach !== next.achievements) next = { ...next, achievements: ach };
  return next;
}
