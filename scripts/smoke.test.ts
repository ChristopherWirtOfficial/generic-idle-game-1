/* v3 smoke: cycle math, sculpting, ladder, liquidation, resets, saves. */
import {
  BANK_CAP, BANK_MS, BASE_DRAW, GLOW_PERIOD_S, LEVEL_POTENCY, NUM_CLAMP, SAVE_KEY, TRICKLE_S,
} from "../src/game/constants";
import {
  applyPick, buyTier, clampState, doReset, liquidationValue, maxAffordable, milestoneLevel,
  period, pickThresholds, picksFor, poolEntries, prog, rollDraw, scoreRate,
  step, switchScenario, tableauLevels, threshScale, tierCost, unitValue, visibleTiers,
} from "../src/game/logic";
import { freshState } from "../src/game/state";
import { applyOffline, loadGame, persist } from "../src/game/save";
import type { Card, GameState, Stat } from "../src/game/types";

let failures = 0;
function ok(cond: boolean, msg: string): void {
  if (cond) { console.log("  ok  " + msg); return; }
  failures++;
  console.error("FAIL  " + msg);
}
function close(a: number, b: number, tol: number, msg: string): void {
  const rel = Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
  ok(rel <= tol, `${msg} (got ${a}, want ~${b}, rel ${rel.toFixed(4)})`);
}
function setLevels(s: GameState, tier: number, stat: Stat, L: number): void {
  const row = (prog(s).tableau[tier] ??= { val: 0, spd: 0, cst: 0 });
  row[stat] = L;
}
const lcg = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

console.log("— cycles: one formula, no piecewise —");
{
  const a = freshState(0);
  const t0 = a.tiers[0]!;
  t0.count = 10; t0.bought = 10; t0.phase = 0; // absolute, replacing the starting unit
  step(a, 100);
  // base period 2s → 50 completions × 10 held × value 1
  close(a.runScore, 500, 0.001, "discrete regime pays count × cycles");

  const b = freshState(0);
  setLevels(b, 0, "spd", 24); // mult ×19 → period ~0.263s, below GLOW
  const tb = b.tiers[0]!;
  tb.count = 10; tb.bought = 10; tb.phase = 0;
  ok(period(b, 0) < GLOW_PERIOD_S, "test tier is in glow regime");
  step(b, 100);
  close(b.runScore / a.runScore, 1 + LEVEL_POTENCY * 24, 0.02, "×19 speed pays ×19 across the glow boundary");
}

console.log("— unowned wheels freeze —");
{
  const s = freshState(0);
  s.tiers[0]!.count = 0; // empty the starting unit for this test
  s.tiers[0]!.phase = 0.2;
  step(s, 3);
  close(s.tiers[0]!.phase, 0.2, 1e-9, "empty tier holds its phase through step");
  s.tiers[0]!.count = 1;
  step(s, 1.4); // period 2s: adv 0.7, total 0.9 — resumes from 0.2, no completion yet
  close(s.tiers[0]!.phase, 0.9, 1e-9, "owned tier resumes from the frozen phase");
  const o = freshState(0);
  o.tiers[0]!.count = 0;
  o.tiers[0]!.phase = 0.4;
  applyOffline(o, BANK_MS);
  close(o.tiers[0]!.phase, 0.4, 1e-9, "empty tier holds its phase through time away");
}

console.log("— costs are bought-only —");
{
  const s = freshState(0);
  s.score = 1e4; // runs now open at score 0 — fund the test wallet
  const c0 = tierCost(s, 0, 1);
  s.tiers[0]!.count = 500; // produced units
  close(tierCost(s, 0, 1), c0, 1e-9, "produced units never touch price");
  ok(buyTier(s, 0, 1), "can buy first unit");
  ok(tierCost(s, 0, 1) > c0, "bought units do");
}

console.log("— milestones: doubling spans —");
{
  const s = freshState(0);
  const cases: Array<[number, number]> = [[0, 0], [24, 0], [25, 1], [74, 1], [75, 2], [174, 2], [175, 3]];
  for (const [bought, want] of cases) {
    s.tiers[0]!.bought = bought;
    ok(milestoneLevel(s, 0) === want, `bought ${bought} → level ${want}`);
  }
  s.tiers[0]!.bought = 25;
  close(unitValue(s, 0), 2, 1e-9, "milestone level 1 doubles value");
}

console.log("— pool sculpting —");
{
  const s = freshState(0);
  s.score = 1e9;
  buyTier(s, 0, 30); // crosses 25 milestone
  const pool0 = s.pool[0]!;
  close(pool0.cst, 30, 1e-9, "buys write cst weight 1:1");
  close(pool0.val, 20, 1e-9, "milestone crossing writes val weight");
  s.tiers[0]!.phase = 0;
  step(s, 4); // 2 completions at the 2s base period
  close(pool0.spd, 1, 1e-9, "discrete completions write spd weight 0.5 each");

  setLevels(s, 0, "spd", 24); // glow regime
  const spdBefore = pool0.spd;
  step(s, 10);
  close(pool0.spd, spdBefore, 1e-9, "glow closes the spd spigot");
}

console.log("— rising ladder —");
{
  const s = freshState(0);
  const [t1a] = pickThresholds(s);
  close(threshScale(s), 1, 1e-9, "ladder starts at ×1");
  const card: Card = { kind: "stat", tier: 0, stat: "val", levels: 1, rarity: 0 };
  applyPick(s, card); applyPick(s, card);
  close(threshScale(s), Math.pow(1 + 0.12 * 2, 2), 1e-9, "two picks raise the ladder");
  const [t1b] = pickThresholds(s);
  ok(t1b > t1a, "thresholds ride the ladder");
  ok(picksFor(s, t1b) === 1 && picksFor(s, t1b - 1) === 0, "picksFor honors scaled threshold");
}

console.log("— liquidation telescopes —");
{
  const s = freshState(0);
  s.tiers[0]!.count = 100;
  s.tiers[1]!.count = 7;
  // tier 2 fires: 7 → tier 1 (value 1). tier 1 fires: (100+7) × 1 → score.
  close(liquidationValue(s), 107, 1e-9, "everything fires once, top-down");

  const s4 = freshState(0);
  switchScenario(s4, "s4", 0);
  s4.tiers[3]!.count = 50; // dead link
  s4.tiers[4]!.count = 10; // pays tier 3 (index 2) at 0.5
  s4.tiers[2]!.count = 0;
  s4.tiers[1]!.count = 0;
  s4.tiers[0]!.count = 0;
  // t5 fires: 10 × 1 × 0.5 = 5 into tier index 2; t4 dead pays 0; t3 fires: 5; t2: 5; t1: 5.
  close(liquidationValue(s4), 5, 1e-9, "s4 dead link pays zero, bridge pays half");
}

console.log("— draws and picks —");
{
  const s = freshState(0);
  s.score = 1e9;
  buyTier(s, 0, 30);
  s.bankedDraws = 2;
  s.runScore = pickThresholds(s)[0];
  const offer = rollDraw(s, lcg(7));
  ok(offer.cards.length === BASE_DRAW + 2, "draw = base + banked");
  ok(offer.picks === 1, "one pick at first threshold");
  ok(offer.cards.every((c) => c.kind !== "stat" || (c.levels >= 1 && c.tier >= 0)), "stat cards carry levels");
  const stat = offer.cards.find((c) => c.kind === "stat")!;
  const before = tableauLevels(s, stat.tier, stat.stat!);
  applyPick(s, stat);
  ok(tableauLevels(s, stat.tier, stat.stat!) === before + stat.levels, "picks add levels");
}

console.log("— reset: phase stays, rest goes —");
{
  const s = freshState(0);
  s.score = 1e9;
  buyTier(s, 0, 40);
  s.tiers[0]!.phase = 0.37;
  s.runScore = 5e5;
  doReset(s, 1000);
  ok(s.tiers[0]!.bought === 0, "bought resets");
  ok(s.tiers[0]!.count === 1, "runs start holding one tier 1");
  close(s.tiers[0]!.phase, 0.37, 1e-9, "phase persists — warm wheels");
  ok(poolEntries(s).length === 0, "pool cleared");
  close(s.score, 0, 1e-9, "score restarts at zero");
  ok(tierCost(s, 0, 1) === 5, "starting unit never touched the price ladder");
  ok(prog(s).resets === 1, "reset counted");

  applyPick(s, { kind: "hotstart", tier: -1, stat: null, levels: 5, rarity: 1 });
  applyPick(s, { kind: "flywheel", tier: -1, stat: null, levels: 1, rarity: 2 });
  doReset(s, 2000);
  ok(s.tiers[0]!.count === 6, "hotstart stacks on the starting unit");
  ok(s.tiers[0]!.bought === 0, "gifts are held, not bought");
  ok(s.tiers.every((t) => t.phase > 0.99), "flywheel arms every wheel");
}

console.log("— scenarios —");
{
  const s = freshState(0);
  applyPick(s, { kind: "stat", tier: 0, stat: "val", levels: 3, rarity: 0 });
  switchScenario(s, "s2", 0);
  ok(s.tiers.length === 4, "s2 is a 4-tier chain");
  ok(tableauLevels(s, 0, "val") === 0, "tableau is per-scenario");
  switchScenario(s, "s1", 0);
  ok(tableauLevels(s, 0, "val") === 3, "switching back restores it");
  ok(visibleTiers(s) >= 1, "at least one tier visible");
}

console.log("— offline is preparation —");
{
  const s = freshState(0);
  s.tiers[0]!.count = 10; s.tiers[0]!.bought = 10;
  const rate = scoreRate(s);
  const rep = applyOffline(s, BANK_MS * 2 + 1000);
  ok(rep.bankedGained === 2, "20min banks one draw each");
  close(rep.trickle, rate * TRICKLE_S, 1e-9, "trickle is 60s of tier-1 rate");
  const s2 = freshState(0);
  s2.bankedDraws = BANK_CAP - 1;
  applyOffline(s2, BANK_MS * 50);
  ok(s2.bankedDraws === BANK_CAP, "bank caps");
}

console.log("— clamp and affordability —");
{
  const s = freshState(0);
  s.score = Infinity;
  s.tiers[0]!.count = Infinity;
  clampState(s);
  ok(s.score === NUM_CLAMP && s.tiers[0]!.count === NUM_CLAMP, "infinities clamp");

  const t = freshState(0);
  t.score = 1e4;
  const n = maxAffordable(t, 0);
  ok(tierCost(t, 0, n) <= t.score, "maxAffordable is affordable");
  ok(tierCost(t, 0, n + 1) > t.score, "and maximal");
}

console.log("— save round-trip —");
{
  const mem = new Map<string, string>();
  (globalThis as Record<string, unknown>).storage = {
    async get(k: string) { const v = mem.get(k); return v === undefined ? null : { value: v }; },
    async set(k: string, v: string) { mem.set(k, v); return null; },
    async delete(k: string) { mem.delete(k); return null; },
  };
  const s = freshState(0);
  s.score = 1e9;
  buyTier(s, 0, 30);
  applyPick(s, { kind: "stat", tier: 0, stat: "spd", levels: 4, rarity: 2 });
  s.tiers[0]!.phase = 0.61;
  await persist(s);
  ok(mem.has(SAVE_KEY), "persisted under v3 key");
  const { state: r } = await loadGame(Date.now());
  close(r.score, s.score, 1e-9, "score survives");
  ok(r.tiers[0]!.bought === 30, "bought survives");
  close(r.tiers[0]!.phase, 0.61, 1e-9, "phase survives");
  ok(tableauLevels(r, 0, "spd") === 4, "tableau survives");
  close(r.pool[0]!.cst, 30, 1e-9, "pool survives");
  const { state: fresh } = await (async () => { mem.set(SAVE_KEY, "{corrupt"); return loadGame(Date.now()); })();
  ok(fresh.score === 0 && fresh.tiers[0]!.count === 1, "corrupt save falls back fresh");
}

if (failures > 0) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log("\nall green");
