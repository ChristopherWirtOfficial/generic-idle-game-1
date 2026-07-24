import {
  BASE_DRAW, COST_PER_DOUBLING, EXOTIC_CHANCE, GLOW_PERIOD_S, THRESH_A, THRESH_B, HOTSTART_BONUS, LEVEL_POTENCY,
  NUM_CLAMP, POOL_ALPHA, POOL_CAP, POOL_DAMP, POOL_FLOOR, RARITY_LEVELS, RARITY_WEIGHT, SPEED_PER_SEC,
  VALUE_PER_MILESTONE, scenarioById,
} from "./constants";
import { D, Decimal, ZERO, isFiniteD } from "./num";
import type { BuyAmount, Card, DrawOffer, GameState, ScenarioDef, ScenarioProgress, Stat, TierState } from "./types";

export function scen(s: GameState): ScenarioDef {
  return scenarioById(s.scenario);
}

export function prog(s: GameState): ScenarioProgress {
  let p = s.progress[s.scenario];
  if (!p) {
    p = {
      tableau: {}, hotstart: 0, flywheel: false,
      resets: 0, picks: 0, bestRun: ZERO, totalScore: ZERO, beaten: false,
      everBought: scen(s).tiers.map(() => 0),
    };
    s.progress[s.scenario] = p;
  }
  return p;
}

export function tableauLevels(s: GameState, tier: number, stat: Stat): number {
  return prog(s).tableau[tier]?.[stat] ?? 0;
}

/** Additive levels: each level adds the same absolute chunk, forever. */
export function tableauMult(s: GameState, tier: number, stat: Stat): number {
  return 1 + LEVEL_POTENCY * tableauLevels(s, tier, stat);
}

/** Milestone level with doubling spans: level L at first*(2^L - 1) bought. */
export function milestoneLevel(s: GameState, i: number): number {
  const first = scen(s).milestoneFirst;
  const bought = s.tiers[i]?.bought ?? 0;
  return Math.max(0, Math.floor(Math.log2(bought / first + 1)));
}

export function nextMilestoneAt(s: GameState, i: number): number {
  return scen(s).milestoneFirst * (Math.pow(2, milestoneLevel(s, i) + 1) - 1);
}

/** Hand-bought count at the milestone already crossed (0 before the first). */
export function prevMilestoneAt(s: GameState, i: number): number {
  return scen(s).milestoneFirst * (Math.pow(2, milestoneLevel(s, i)) - 1);
}

/**
 * How far this tier has travelled along its current milestone span, in [0,1].
 * Drives the outer arc: milestone progress is a position you can see, not a
 * fraction you have to parse.
 */
export function milestoneProgress(s: GameState, i: number): number {
  const st = s.tiers[i];
  if (!st) return 0;
  const prev = prevMilestoneAt(s, i);
  const next = nextMilestoneAt(s, i);
  const span = next - prev;
  if (!(span > 0)) return 0;
  return Math.max(0, Math.min(1, (st.bought - prev) / span));
}

/**
 * True when this tier holds nothing, so the next threshold that means anything
 * is the first unit. You cannot aim at a hand-bought milestone on a tier you
 * have not opened yet.
 */
export function needsUnlock(s: GameState, i: number): boolean {
  const st = s.tiers[i];
  return !st || st.count.floor().lt(1);
}

/** Units still needed to cross the next threshold (never less than 1). */
export function toMilestone(s: GameState, i: number): number {
  const st = s.tiers[i];
  if (!st) return 1;
  if (needsUnlock(s, i)) return 1;
  return Math.max(1, nextMilestoneAt(s, i) - st.bought);
}

/**
 * Resolve a purchase quantity to a unit count. Never returns 0: an unaffordable
 * quantity still has to price itself, because seeing the price while broke is
 * how you form the goal.
 */
export function amountCount(s: GameState, i: number, a: BuyAmount): number {
  if (a === "max") return Math.max(1, maxAffordable(s, i));
  if (a === "milestone") return toMilestone(s, i);
  return a;
}

/**
 * What this quantity would ACTUALLY buy right now, for display. Differs from
 * amountCount only for max, which is honestly 0 when you can afford none —
 * amountCount clamps to 1 so the plate can still price the thing you want.
 */
export function amountShown(s: GameState, i: number, a: BuyAmount): number {
  if (a === "max") return maxAffordable(s, i);
  return amountCount(s, i, a);
}

/** Value paid per unit per cycle, all multipliers in. */
export function unitValue(s: GameState, i: number): number {
  const def = scen(s).tiers[i];
  if (!def) return 0;
  return def.baseValue
    * def.efficiency
    * Math.pow(scen(s).milestoneMult, milestoneLevel(s, i))
    * tableauMult(s, i, "value");
}

/** Effective seconds per cycle. Speed divides the period — no floor, ever. */
export function period(s: GameState, i: number): number {
  const def = scen(s).tiers[i];
  if (!def) return Infinity;
  return def.basePeriod / tableauMult(s, i, "speed");
}

/** Average output per second (used for display and the offline trickle). */
export function throughput(s: GameState, i: number): Decimal {
  const st = s.tiers[i];
  if (!st || st.count.lt(1)) return ZERO;
  return st.count.floor().times(unitValue(s, i)).div(period(s, i));
}

/** Score per second from tier 0, averaged over its cycle. */
export function scoreRate(s: GameState): Decimal {
  const def = scen(s).tiers[0];
  return def && def.target === -1 ? throughput(s, 0) : ZERO;
}

/**
 * Price of the next n units. Geometric series, in Decimal because g^bought
 * outruns float64 at a few thousand hand-buys on the deep tiers.
 * Prices are integers: what the plate shows is exactly what it charges.
 */
export function tierCost(s: GameState, i: number, n = 1): Decimal {
  const def = scen(s).tiers[i];
  const st = s.tiers[i];
  if (!def || !st || n <= 0) return D(Infinity);
  const g = def.costGrowth;
  const first = D(def.baseCost).div(tableauMult(s, i, "cost")).times(Decimal.pow(g, st.bought));
  const total = first.times(Decimal.pow(g, n).minus(1)).div(g - 1);
  return total.ceil();
}

export function maxAffordable(s: GameState, i: number): number {
  const def = scen(s).tiers[i];
  const st = s.tiers[i];
  if (!def || !st) return 0;
  const g = def.costGrowth;
  const first = D(def.baseCost).div(tableauMult(s, i, "cost")).times(Decimal.pow(g, st.bought));
  if (s.score.lt(first.ceil())) return 0;
  // n = log_g(score·(g−1)/first + 1), then walked to exactness because the
  // per-unit ceil means the closed form can be off by one either way.
  // affordGeometricSeries is purpose-built for exactly this; we still walk it
  // because tierCost ceils the total, which the closed form does not.
  let n = Math.max(1, Math.floor(Decimal.affordGeometricSeries(s.score, first, g, 0).toNumber()));
  while (n > 0 && tierCost(s, i, n).gt(s.score)) n--;
  while (tierCost(s, i, n + 1).lte(s.score)) n++;
  return n;
}

export function buyTier(s: GameState, i: number, n: number): boolean {
  const st = s.tiers[i];
  if (!st) return false;
  const cost = tierCost(s, i, n);
  if (n <= 0 || !isFiniteD(cost) || s.score.lt(cost)) return false;
  const lvlBefore = milestoneLevel(s, i);
  const boughtBefore = st.bought;
  s.score = s.score.minus(cost);
  st.count = st.count.plus(n);
  st.bought += n;
  noteMilestones(s, i, lvlBefore);
  const p = prog(s);
  const ever = p.everBought[i] ?? 0;
  if (st.bought > ever) p.everBought[i] = st.bought;
  // Sculpting: engaging the price curve writes cost-card weight — per DOUBLING
  // of the stake, not per unit. Per-unit was linear, so a tier you had made
  // cheap got bought more, which made it cheaper, which buried every other
  // card in the pool. Doubling matches how milestones already scale.
  addPool(s, i, "cost", COST_PER_DOUBLING * Math.log2((st.bought + 1) / (boughtBefore + 1)));
  return true;
}

export function addPool(s: GameState, tier: number, stat: Stat, w: number): void {
  const row = (s.pool[tier] ??= { value: 0, speed: 0, cost: 0 });
  row[stat] += w;
}

/**
 * Advance all wheels. One formula for both regimes: progress accrues as dt/period;
 * whole completions pay out count × unitValue into the target; the fraction stays
 * as phase. Payout uses the count held at completion.
 */
export function step(s: GameState, dtSec: number): void {
  if (dtSec <= 0) return;
  const defs = scen(s).tiers;
  for (let i = defs.length - 1; i >= 0; i--) {
    const st = s.tiers[i];
    const def = defs[i];
    if (!st || !def) continue;
    const held = st.count.floor();
    // A wheel with nothing on it does not turn. Its phase is heat it keeps:
    // frozen through resets and idle stretches, resumed the moment you own one.
    if (held.lt(1)) continue;
    const T = period(s, i);
    // Sculpting: watching a wheel turn writes speed weight — but only while it
    // is still a wheel. Once it graduates to glow, the spigot closes itself.
    // Per SECOND WATCHED, not per completion: completions scale as 1/period, so
    // the old rule flooded 2s tiers and starved 640s tiers to nothing, leaving
    // speed unofferable on exactly the tiers that most needed it.
    if (T >= GLOW_PERIOD_S) addPool(s, i, "speed", dtSec * SPEED_PER_SEC);
    const adv = dtSec / T;
    const total = st.phase + adv;
    const completions = Math.floor(total);
    st.phase = total - completions;
    if (completions <= 0) continue;
    st.cycles += completions;
    const pay = held.times(unitValue(s, i)).times(completions);
    deposit(s, def.target, pay);
  }
  clampState(s);
}

function deposit(s: GameState, target: number, amount: Decimal): void {
  if (amount.lte(0)) return;
  if (target < 0) {
    s.score = s.score.plus(amount);
    s.runScore = s.runScore.plus(amount);
    const p = prog(s);
    p.totalScore = p.totalScore.plus(amount);
    if (s.runScore.gt(p.bestRun)) p.bestRun = s.runScore;
    if (s.runScore.gte(scen(s).goal)) p.beaten = true;
  } else {
    const st = s.tiers[target];
    if (st) st.count = st.count.plus(amount);
  }
}

/**
 * A last-resort guard against a non-finite value poisoning the save, NOT a
 * ceiling on play. Decimal reaches 1e(9e15), so NUM_CLAMP now sits far beyond
 * anything the chain produces — the old 1e300 pinned the score silently, which
 * meant the instrument stopped telling the truth exactly when the numbers got
 * interesting.
 */
export function clampState(s: GameState): void {
  if (!isFiniteD(s.score) || s.score.gt(NUM_CLAMP)) s.score = D(NUM_CLAMP);
  if (!isFiniteD(s.runScore) || s.runScore.gt(NUM_CLAMP)) s.runScore = D(NUM_CLAMP);
  for (const st of s.tiers) {
    if (!isFiniteD(st.count) || st.count.gt(NUM_CLAMP)) st.count = D(NUM_CLAMP);
  }
}

/** Milestone crossings write value-card weight. */
function noteMilestones(s: GameState, i: number, before: number): void {
  const after = milestoneLevel(s, i);
  if (after > before) addPool(s, i, "value", (after - before) * VALUE_PER_MILESTONE);
}

/** The ladder rises as the tableau grows, so run length stays a live choice. */
export function threshScale(s: GameState): number {
  return Math.pow(1 + THRESH_A * prog(s).picks, THRESH_B);
}

export function pickThresholds(s: GameState): [number, number, number] {
  const f = threshScale(s);
  const [a, b, c] = scen(s).pickAt;
  return [a * f, b * f, c * f];
}

export function picksFor(s: GameState, runScore: Decimal | number): number {
  const r = D(runScore);
  const [a, b, c] = pickThresholds(s);
  if (r.gte(c)) return 3;
  if (r.gte(b)) return 2;
  if (r.gte(a)) return 1;
  return 0;
}

/** One-shot: every held unit fires once, cascading top-down into the score. */
export function liquidationValue(s: GameState): Decimal {
  const defs = scen(s).tiers;
  const virtual = s.tiers.map((t) => t.count.floor());
  let gained = ZERO;
  for (let i = defs.length - 1; i >= 0; i--) {
    const def = defs[i];
    const held = virtual[i] ?? ZERO;
    if (!def || held.lt(1)) continue;
    const pay = held.times(unitValue(s, i));
    if (def.target < 0) gained = gained.plus(pay);
    else virtual[def.target] = (virtual[def.target] ?? ZERO).plus(pay);
  }
  return gained;
}

/** A tier you have ever bought (this scenario) or currently hold. */
export function tierKnown(s: GameState, i: number): boolean {
  const st = s.tiers[i];
  return (prog(s).everBought[i] ?? 0) > 0 || (st !== undefined && (st.bought > 0 || st.count.gte(1)));
}

/** Visible tiers: one past the deepest ever bought in this scenario. */
export function visibleTiers(s: GameState): number {
  const p = prog(s);
  let deepest = -1;
  for (let i = p.everBought.length - 1; i >= 0; i--) {
    if ((p.everBought[i] ?? 0) > 0 || (s.tiers[i]?.bought ?? 0) > 0) { deepest = i; break; }
  }
  return Math.min(scen(s).tiers.length, Math.max(deepest, 0) + 2);
}

// ---------- Draws ----------

/**
 * How much a tier's earned weight is worth once you already hold levels there.
 * Diminishing by design: you want fewer cards for a tier the deeper you are in
 * it, and without this the cost loop feeds itself (cheaper → bought more →
 * more weight → offered more → cheaper).
 */
export function tierDamp(s: GameState, tier: number): number {
  const row = prog(s).tableau[tier];
  const levels = row ? row.value + row.speed + row.cost : 0;
  return 1 / (1 + POOL_DAMP * levels);
}

/**
 * Every line that can be drawn: three stats on each tier the player has opened,
 * carrying the effective (damped) weight this run wrote to it. Lines at zero
 * are in the list ON PURPOSE — they are what the floor lands on, and they are
 * the reason a stat you have neglected is never quite off the table.
 * This is the SIGNAL. poolEntries below is the signal mapped to odds.
 */
export function poolSlots(s: GameState): Array<{ tier: number; stat: Stat; w: number; damp: number }> {
  const out: Array<{ tier: number; stat: Stat; w: number; damp: number }> = [];
  const n = scen(s).tiers.length;
  for (let tier = 0; tier < n; tier++) {
    const row = s.pool[tier];
    const wrote = row !== undefined && (row.value > 0 || row.speed > 0 || row.cost > 0);
    if (!wrote && !tierKnown(s, tier)) continue;
    const damp = tierDamp(s, tier);
    for (const stat of ["value", "speed", "cost"] as const) {
      out.push({ tier, stat, w: (row?.[stat] ?? 0) * damp, damp });
    }
  }
  return out;
}

/**
 * Signal → odds, the whole shaping step in one pure function: raise each weight
 * to POOL_ALPHA, normalise, then hand POOL_FLOOR of the mass back out flat.
 * Returns probabilities summing to 1.
 *
 * The knobs are arguments so the pacing sim can replay a captured pool at other
 * exponents without keeping a second copy of the formula. The sim's ALPHA SWEEP
 * table is this function, not a re-derivation of it.
 */
export function shapeWeights(
  ws: number[], alpha = POOL_ALPHA, floor = POOL_FLOOR, cap = POOL_CAP, basis?: number[],
): number[] {
  const n = ws.length;
  if (n === 0) return [];
  // The floor is shared out along `basis` (the per-tier damping) rather than
  // dead flat. A flat floor is a promise that never diminishes, and a promise
  // that never diminishes is a focus engine: pour every pick into one line and
  // the pool keeps handing it back at full odds forever. Damping the floor puts
  // it under the same law as every other weight — the deeper your stake in a
  // tier, the more the whole pool leans away from it, base slice included.
  const bs = basis && basis.length === n ? basis : ws.map(() => 1);
  const bTot = bs.reduce((a, b) => a + b, 0) || n;
  const shaped = ws.map((w) => (w > 0 ? Math.pow(w, alpha) : 0));
  const total = shaped.reduce((a, b) => a + b, 0);
  // Nothing written yet (a fresh run): the floor is all there is, so it is all
  // of it. Spread over what you know beats a hardcoded consolation card.
  if (!(total > 0)) return bs.map((b) => b / bTot);
  const p = shaped.map((x, i) => (1 - floor) * (x / total) + floor * (bs[i]! / bTot));
  // Ceiling, filled with water: whatever a line is holding above the cap is
  // poured out in equal measure over the lines still under it, repeatedly,
  // until nothing is above. Uniform spill and not proportional spill is the
  // whole point — proportional spill just hands a cost landslide back to the
  // next cost line down. A cap below uniform is not a cap, so it never is.
  const lid = Math.max(cap, 1) / n;
  for (let pass = 0; pass < 24; pass++) {
    let excess = 0, under = 0;
    for (const x of p) { if (x > lid + 1e-12) excess += x - lid; else under++; }
    if (excess <= 1e-12 || under === 0) break;
    const share = excess / under;
    for (let i = 0; i < n; i++) p[i] = p[i]! > lid + 1e-12 ? lid : p[i]! + share;
  }
  return p;
}

export interface PoolEntry {
  tier: number;
  stat: Stat;
  /** Probability this line wins any one card of the draw. Sums to 1. */
  w: number;
  /** The part of w this run earned, above the flat floor. */
  earned: number;
  /** The flat slice every known line gets. */
  floor: number;
  /** True when this line is pinned at the ceiling — it cannot buy more draw. */
  capped: boolean;
}

/**
 * The odds a card is ACTUALLY rolled against — shaping, floor and damping all
 * applied — because the RESET histogram draws straight off this. The instrument
 * never lies: if the bar says 12%, the roll says 12%.
 */
export function poolEntries(s: GameState): PoolEntry[] {
  const slots = poolSlots(s);
  const ps = shapeWeights(slots.map((e) => e.w), POOL_ALPHA, POOL_FLOOR, POOL_CAP, slots.map((e) => e.damp));
  const n = slots.length;
  const bTot = slots.reduce((a, e) => a + e.damp, 0) || n;
  const budget = slots.some((e) => e.w > 0) ? POOL_FLOOR : 1;
  const lid = n === 0 ? 1 : Math.max(POOL_CAP, 1) / n;
  return slots.map((e, i) => {
    const fl = n === 0 ? 0 : budget * (e.damp / bTot);
    return {
      tier: e.tier, stat: e.stat, w: ps[i]!,
      earned: Math.max(0, ps[i]! - fl), floor: fl,
      capped: ps[i]! >= lid - 1e-9 && e.w > 0,
    };
  });
}

export function rollDraw(s: GameState, rand: () => number): DrawOffer {
  const liquidated = liquidationValue(s);
  const finalRun = Decimal.min(D(NUM_CLAMP), s.runScore.plus(liquidated));
  const picks = picksFor(s, finalRun);
  const nCards = BASE_DRAW + s.bankedDraws;
  const slots = poolSlots(s);
  const ps = shapeWeights(slots.map((e) => e.w), POOL_ALPHA, POOL_FLOOR, POOL_CAP, slots.map((e) => e.damp));
  const cards: Card[] = [];
  const p = prog(s);
  // Without replacement. Three cards sampled independently from a skewed pool
  // were the SAME card about half the time, which spends the whole "choose from
  // N" premise on nothing. The bag holds every line still unoffered this hand;
  // it only refills once the hand has run through all of them, so a repeat is
  // impossible until a repeat is unavoidable.
  let bag = slots.map((_, i) => i);
  for (let k = 0; k < nCards; k++) {
    if (rand() < EXOTIC_CHANCE && cards.every((c) => c.kind === "stat")) {
      if (!p.flywheel && rand() < 0.5) {
        cards.push({ kind: "flywheel", tier: -1, stat: null, levels: 1, rarity: 2 });
        continue;
      }
      cards.push({ kind: "hotstart", tier: -1, stat: null, levels: HOTSTART_BONUS, rarity: 1 });
      continue;
    }
    if (slots.length === 0) {
      cards.push({ kind: "stat", tier: 0, stat: "value", levels: RARITY_LEVELS[0], rarity: 0 });
      continue;
    }
    if (bag.length === 0) bag = slots.map((_, i) => i);
    const totalW = bag.reduce((a, i) => a + ps[i]!, 0);
    let roll = rand() * totalW;
    let at = 0;
    for (; at < bag.length - 1; at++) { roll -= ps[bag[at]!]!; if (roll <= 0) break; }
    const chosen = slots[bag[at]!]!;
    bag.splice(at, 1);
    const rr = rand();
    const rarity: 0 | 1 | 2 = rr < RARITY_WEIGHT[2] ? 2 : rr < RARITY_WEIGHT[2] + RARITY_WEIGHT[1] ? 1 : 0;
    cards.push({ kind: "stat", tier: chosen.tier, stat: chosen.stat, levels: RARITY_LEVELS[rarity], rarity });
  }
  return { cards, picks, liquidated };
}

export function applyPick(s: GameState, card: Card): void {
  const p = prog(s);
  p.picks += 1;
  if (card.kind === "flywheel") { p.flywheel = true; return; }
  if (card.kind === "hotstart") { p.hotstart += card.levels; return; }
  if (card.tier < 0 || !card.stat) return;
  const row = (p.tableau[card.tier] ??= { value: 0, speed: 0, cost: 0 });
  row[card.stat] += card.levels;
}

/** Reset the run: destroys stock, bought, run pool. Phase survives. */
export function doReset(s: GameState, now = Date.now()): void {
  const p = prog(s);
  p.resets += 1;
  const defs = scen(s).tiers;
  s.tiers = s.tiers.map((t): TierState => ({ count: ZERO, bought: 0, phase: t.phase, cycles: 0 }));
  while (s.tiers.length < defs.length) s.tiers.push({ count: ZERO, bought: 0, phase: 0, cycles: 0 });
  s.runScore = ZERO;
  s.score = ZERO;
  s.pool = {};
  s.bankedDraws = 0;
  s.runStartedAt = now;
  // Every run begins with one tier 1 already on the wheel — held, not bought:
  // starting units never touch the price ladder or milestones. Hotstart stacks.
  const t0 = s.tiers[0];
  if (t0) t0.count = t0.count.plus(1 + p.hotstart);
  if (p.flywheel) {
    for (let i = 0; i < defs.length; i++) {
      const st = s.tiers[i];
      if (st) st.phase = 0.999;
    }
  }
}

export function switchScenario(s: GameState, id: string, now = Date.now()): void {
  s.scenario = id;
  const defs = scen(s).tiers;
  s.tiers = defs.map(() => ({ count: ZERO, bought: 0, phase: 0, cycles: 0 }));
  s.runScore = ZERO;
  s.pool = {};
  s.bankedDraws = 0;
  s.runStartedAt = now;
  const p = prog(s); // materialize
  s.score = ZERO;
  const t0 = s.tiers[0];
  if (t0) t0.count = t0.count.plus(1 + p.hotstart);
}
