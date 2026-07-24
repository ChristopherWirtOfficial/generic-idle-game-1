import {
  BASE_DRAW, EXOTIC_CHANCE, GLOW_PERIOD_S, THRESH_A, THRESH_B, HOTSTART_BONUS, LEVEL_POTENCY, NUM_CLAMP,
  RARITY_LEVELS, RARITY_WEIGHT, scenarioById,
} from "./constants";
import type { BuyAmount, Card, DrawOffer, GameState, ScenarioDef, ScenarioProgress, Stat, TierState } from "./types";

export function scen(s: GameState): ScenarioDef {
  return scenarioById(s.scenario);
}

export function prog(s: GameState): ScenarioProgress {
  let p = s.progress[s.scenario];
  if (!p) {
    p = {
      tableau: {}, hotstart: 0, flywheel: false,
      resets: 0, picks: 0, bestRun: 0, totalScore: 0, beaten: false,
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

/** Units still needed to cross the next milestone (never less than 1). */
export function toMilestone(s: GameState, i: number): number {
  const st = s.tiers[i];
  if (!st) return 1;
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

/** Value paid per unit per cycle, all multipliers in. */
export function unitValue(s: GameState, i: number): number {
  const def = scen(s).tiers[i];
  if (!def) return 0;
  return def.baseValue
    * def.efficiency
    * Math.pow(scen(s).milestoneMult, milestoneLevel(s, i))
    * tableauMult(s, i, "val");
}

/** Effective seconds per cycle. Speed divides the period — no floor, ever. */
export function period(s: GameState, i: number): number {
  const def = scen(s).tiers[i];
  if (!def) return Infinity;
  return def.basePeriod / tableauMult(s, i, "spd");
}

/** Average output per second (used for display and the offline trickle). */
export function throughput(s: GameState, i: number): number {
  const st = s.tiers[i];
  if (!st || st.count < 1) return 0;
  return (Math.floor(st.count) * unitValue(s, i)) / period(s, i);
}

/** Score per second from tier 0, averaged over its cycle. */
export function scoreRate(s: GameState): number {
  const def = scen(s).tiers[0];
  return def && def.target === -1 ? throughput(s, 0) : 0;
}

/** Prices are integers: what the slab shows is exactly what it charges. */
export function tierCost(s: GameState, i: number, n = 1): number {
  const def = scen(s).tiers[i];
  const st = s.tiers[i];
  if (!def || !st || n <= 0) return Infinity;
  const g = def.costGrowth;
  const first = (def.baseCost / tableauMult(s, i, "cst")) * Math.pow(g, st.bought);
  const total = (first * (Math.pow(g, n) - 1)) / (g - 1);
  return Number.isFinite(total) ? Math.ceil(total) : Infinity;
}

export function maxAffordable(s: GameState, i: number): number {
  const def = scen(s).tiers[i];
  const st = s.tiers[i];
  if (!def || !st) return 0;
  const g = def.costGrowth;
  const first = (def.baseCost / tableauMult(s, i, "cst")) * Math.pow(g, st.bought);
  if (s.score < Math.ceil(first)) return 0;
  let n = Math.max(1, Math.floor(Math.log((s.score * (g - 1)) / first + 1) / Math.log(g)));
  while (n > 0 && tierCost(s, i, n) > s.score) n--;
  while (tierCost(s, i, n + 1) <= s.score) n++;
  return n;
}

export function buyTier(s: GameState, i: number, n: number): boolean {
  const st = s.tiers[i];
  if (!st) return false;
  const cost = tierCost(s, i, n);
  if (n <= 0 || !Number.isFinite(cost) || s.score < cost) return false;
  const lvlBefore = milestoneLevel(s, i);
  s.score -= cost;
  st.count += n;
  st.bought += n;
  noteMilestones(s, i, lvlBefore);
  const p = prog(s);
  const ever = p.everBought[i] ?? 0;
  if (st.bought > ever) p.everBought[i] = st.bought;
  // Sculpting: engaging the price curve writes cost-card weight.
  addPool(s, i, "cst", n);
  return true;
}

export function addPool(s: GameState, tier: number, stat: Stat, w: number): void {
  const row = (s.pool[tier] ??= { val: 0, spd: 0, cst: 0 });
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
    const held = Math.floor(st.count);
    // A wheel with nothing on it does not turn. Its phase is heat it keeps:
    // frozen through resets and idle stretches, resumed the moment you own one.
    if (held < 1) continue;
    const T = period(s, i);
    const adv = dtSec / T;
    const total = st.phase + adv;
    const completions = Math.floor(total);
    st.phase = total - completions;
    if (completions <= 0) continue;
    st.cycles += completions;
    // Sculpting: watching a wheel turn writes speed weight — but only while it is
    // still a wheel. Once it graduates to glow, the spigot closes itself.
    if (T >= GLOW_PERIOD_S) addPool(s, i, "spd", completions * 0.5);
    const pay = held * unitValue(s, i) * completions;
    deposit(s, def.target, pay);
  }
  clampState(s);
}

function deposit(s: GameState, target: number, amount: number): void {
  if (amount <= 0) return;
  if (target < 0) {
    s.score += amount;
    s.runScore += amount;
    const p = prog(s);
    p.totalScore += amount;
    if (s.runScore > p.bestRun) p.bestRun = s.runScore;
    if (s.runScore >= scen(s).goal) p.beaten = true;
  } else {
    const st = s.tiers[target];
    if (st) st.count += amount;
  }
}

export function clampState(s: GameState): void {
  if (!Number.isFinite(s.score) || s.score > NUM_CLAMP) s.score = NUM_CLAMP;
  if (!Number.isFinite(s.runScore) || s.runScore > NUM_CLAMP) s.runScore = NUM_CLAMP;
  for (const st of s.tiers) {
    if (!Number.isFinite(st.count) || st.count > NUM_CLAMP) st.count = NUM_CLAMP;
  }
}

/** Milestone crossings write value-card weight. */
function noteMilestones(s: GameState, i: number, before: number): void {
  const after = milestoneLevel(s, i);
  if (after > before) addPool(s, i, "val", (after - before) * 20);
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

export function picksFor(s: GameState, runScore: number): number {
  const [a, b, c] = pickThresholds(s);
  if (runScore >= c) return 3;
  if (runScore >= b) return 2;
  if (runScore >= a) return 1;
  return 0;
}

/** One-shot: every held unit fires once, cascading top-down into the score. */
export function liquidationValue(s: GameState): number {
  const defs = scen(s).tiers;
  const virtual = s.tiers.map((t) => Math.floor(t.count));
  let gained = 0;
  for (let i = defs.length - 1; i >= 0; i--) {
    const def = defs[i];
    const held = virtual[i] ?? 0;
    if (!def || held < 1) continue;
    const pay = held * unitValue(s, i);
    if (def.target < 0) gained += pay;
    else virtual[def.target] = (virtual[def.target] ?? 0) + pay;
  }
  return gained;
}

/** A tier you have ever bought (this scenario) or currently hold. */
export function tierKnown(s: GameState, i: number): boolean {
  const st = s.tiers[i];
  return (prog(s).everBought[i] ?? 0) > 0 || (st !== undefined && (st.bought > 0 || st.count >= 1));
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

export function poolEntries(s: GameState): Array<{ tier: number; stat: Stat; w: number }> {
  const out: Array<{ tier: number; stat: Stat; w: number }> = [];
  for (const [tierStr, row] of Object.entries(s.pool)) {
    const tier = Number(tierStr);
    for (const stat of ["val", "spd", "cst"] as const) {
      if (row[stat] > 0) out.push({ tier, stat, w: row[stat] });
    }
  }
  return out;
}

export function rollDraw(s: GameState, rand: () => number): DrawOffer {
  const liquidated = liquidationValue(s);
  const finalRun = Math.min(NUM_CLAMP, s.runScore + liquidated);
  const picks = picksFor(s, finalRun);
  const nCards = BASE_DRAW + s.bankedDraws;
  const entries = poolEntries(s);
  const cards: Card[] = [];
  const p = prog(s);
  for (let k = 0; k < nCards; k++) {
    if (rand() < EXOTIC_CHANCE && cards.every((c) => c.kind === "stat")) {
      if (!p.flywheel && rand() < 0.5) {
        cards.push({ kind: "flywheel", tier: -1, stat: null, levels: 1, rarity: 2 });
        continue;
      }
      cards.push({ kind: "hotstart", tier: -1, stat: null, levels: HOTSTART_BONUS, rarity: 1 });
      continue;
    }
    const totalW = entries.reduce((a, e) => a + e.w, 0);
    if (totalW <= 0 || entries.length === 0) {
      cards.push({ kind: "stat", tier: 0, stat: "val", levels: RARITY_LEVELS[0], rarity: 0 });
      continue;
    }
    let roll = rand() * totalW;
    let chosen = entries[0]!;
    for (const e of entries) { roll -= e.w; if (roll <= 0) { chosen = e; break; } }
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
  const row = (p.tableau[card.tier] ??= { val: 0, spd: 0, cst: 0 });
  row[card.stat] += card.levels;
}

/** Reset the run: destroys stock, bought, run pool. Phase survives. */
export function doReset(s: GameState, now = Date.now()): void {
  const p = prog(s);
  p.resets += 1;
  const defs = scen(s).tiers;
  s.tiers = s.tiers.map((t): TierState => ({ count: 0, bought: 0, phase: t.phase, cycles: 0 }));
  while (s.tiers.length < defs.length) s.tiers.push({ count: 0, bought: 0, phase: 0, cycles: 0 });
  s.runScore = 0;
  s.score = 0;
  s.pool = {};
  s.bankedDraws = 0;
  s.runStartedAt = now;
  // Every run begins with one tier 1 already on the wheel — held, not bought:
  // starting units never touch the price ladder or milestones. Hotstart stacks.
  const t0 = s.tiers[0];
  if (t0) t0.count += 1 + p.hotstart;
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
  s.tiers = defs.map(() => ({ count: 0, bought: 0, phase: 0, cycles: 0 }));
  s.runScore = 0;
  s.pool = {};
  s.bankedDraws = 0;
  s.runStartedAt = now;
  const p = prog(s); // materialize
  s.score = 0;
  const t0 = s.tiers[0];
  if (t0) t0.count += 1 + p.hotstart;
}
