/* v3 invariant guards. Run: node scripts/run-tests.mjs */
import {
  BANK_CAP, GLOW_PERIOD_S, LEVEL_POTENCY, SCENARIOS, THRESH_A, THRESH_B,
} from "../src/game/constants";
import {
  applyPick, buyTier, doReset, liquidationValue, maxAffordable, milestoneLevel,
  period, pickThresholds, picksFor, prog, rollDraw, scen, startingScore, step,
  switchScenario, tableauLevels, tierCost, threshScale, unitValue, visibleTiers,
} from "../src/game/logic";
import { freshState } from "../src/game/state";
import { applyOffline } from "../src/game/save";
import type { Card, GameState } from "../src/game/types";

let failures = 0;
function check(name: string, cond: boolean, extra = ""): void {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name} ${extra}`); }
}
function approx(a: number, b: number, tol = 1e-9): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}
function seq(vals: number[]): () => number {
  let i = 0;
  return () => vals[Math.min(i++, vals.length - 1)]!;
}

// --- cycles: one formula, no piecewise, speed always proportional
{
  const mk = (spdLevels: number): GameState => {
    const s = freshState(0);
    s.tiers[0]!.count = 10;
    s.tiers[0]!.phase = 0;
    prog(s).tableau[0] = { val: 0, spd: spdLevels, cst: 0 };
    return s;
  };
  const base = mk(0);
  step(base, 5);
  check("one cycle pays count × unitValue", approx(base.score - startingScore(base), 10 * unitValue(base, 0)));
  check("phase wraps to ~0", base.tiers[0]!.phase < 1e-9);

  const slowMult = 1 + LEVEL_POTENCY * 4;
  const slow = mk(4);
  step(slow, 5);
  const slowGain = slow.score - startingScore(slow);

  const fast = mk(44); // period 5/(1+0.75·44) = 0.147s < GLOW: renderer glows, economy identical
  check("glow threshold crossed in test", period(fast, 0) < GLOW_PERIOD_S);
  step(fast, 5);
  const fastGain = fast.score - startingScore(fast);
  const fastMult = 1 + LEVEL_POTENCY * 44;
  check(
    "speed stays proportional across the glow boundary",
    approx(fastGain / slowGain, Math.floor(5 / (5 / fastMult)) / Math.floor(5 / (5 / slowMult)), 1e-6),
    `${fastGain / slowGain}`,
  );
}

// --- costs on bought only; produced units are free stock
{
  const s = freshState(0);
  s.score = 1e6;
  buyTier(s, 0, 3);
  const costAfter3 = tierCost(s, 0, 1);
  s.tiers[0]!.count += 500; // produced
  check("produced units don't move the price", approx(tierCost(s, 0, 1), costAfter3));
  const before = s.score;
  check("maxAffordable buys exactly affordable", buyTier(s, 0, maxAffordable(s, 0)) && s.score >= 0 && s.score < before);
}

// --- milestones: doubling spans, ×mult each
{
  const s = freshState(0);
  s.score = 1e30;
  const first = scen(s).milestoneFirst;
  buyTier(s, 0, first);
  check("milestone level 1 at first span", milestoneLevel(s, 0) === 1);
  buyTier(s, 0, first * 2);
  check("level 2 at 3×first (doubling spans)", milestoneLevel(s, 0) === 2, `${milestoneLevel(s, 0)}`);
  check("value doubles per level", approx(unitValue(s, 0), Math.pow(scen(s).milestoneMult, 2)));
}

// --- pool sculpting: buys→cst, milestones→val, discrete cycles→spd, spigot closes
{
  const s = freshState(0);
  s.score = 1e30;
  buyTier(s, 0, 30); // crosses 25
  check("buys write cst weight", approx(s.pool[0]!.cst, 30));
  check("milestone crossing writes val weight", approx(s.pool[0]!.val, 20));
  step(s, 5.01);
  check("discrete completion writes spd weight", approx(s.pool[0]!.spd, 0.5));
  prog(s).tableau[0] = { val: 0, spd: 100, cst: 0 }; // period ≪ glow
  const spdBefore = s.pool[0]!.spd;
  step(s, 5);
  check("spigot: continuous wheels write no spd weight", approx(s.pool[0]!.spd, spdBefore));
}

// --- ladder rises with picks taken
{
  const s = freshState(0);
  const [a0] = pickThresholds(s);
  check("ladder starts at base", approx(a0, scen(s).pickAt[0]));
  const card: Card = { kind: "stat", tier: 0, stat: "val", levels: 2, rarity: 1 };
  applyPick(s, card); applyPick(s, card); applyPick(s, card);
  check("tableau levels accumulate additively", tableauLevels(s, 0, "val") === 6);
  check("threshScale = (1+aP)^b", approx(threshScale(s), Math.pow(1 + THRESH_A * 3, THRESH_B)));
  check("picksFor uses scaled ladder", picksFor(s, scen(s).pickAt[0]) === 0 && picksFor(s, scen(s).pickAt[0] * threshScale(s)) === 1);
}

// --- liquidation telescopes; dead links stay dead; bridges discount
{
  const s = freshState(0);
  s.tiers[0]!.count = 5;
  s.tiers[1]!.count = 2;
  const v1 = unitValue(s, 1), v0 = unitValue(s, 0);
  check("liquidation telescopes top-down", approx(liquidationValue(s), Math.floor(5 + 2 * v1) * v0), `${liquidationValue(s)}`);

  const s4 = freshState(0);
  switchScenario(s4, "s4", 0);
  s4.tiers[3]!.count = 100; // dead tier
  check("dead link liquidates to nothing", approx(liquidationValue(s4), 0));
  s4.tiers[4]!.count = 2; // pays tier 3 (index 2) at 0.5
  const g4 = liquidationValue(s4);
  check("bridge pays its discounted target", approx(g4, Math.floor(2 * 0.5) * unitValue(s4, 2) * unitValue(s4, 1) * unitValue(s4, 0)), `${g4}`);
}

// --- draws: threshold picks, weighted cards, exotic uniqueness
{
  const s = freshState(0);
  s.score = 1e30;
  buyTier(s, 0, 30);
  s.runScore = scen(s).pickAt[1]; // 2 picks at fresh ladder
  const offer = rollDraw(s, seq([0.9, 0.5, 0.9, 0.5, 0.9, 0.5]));
  check("picks follow the ladder", offer.picks === 2, `${offer.picks}`);
  check("draw size is base 3", offer.cards.length === 3);
  check("stat cards carry levels", offer.cards.every((c) => c.kind !== "stat" || c.levels >= 1));

  const ex = rollDraw(s, seq([0.01, 0.3, 0.9, 0.5, 0.9, 0.5])); // first roll < EXOTIC_CHANCE, then <0.5 → flywheel
  check("exotic slot can roll flywheel", ex.cards.some((c) => c.kind === "flywheel"));
  prog(s).flywheel = true;
  const ex2 = rollDraw(s, seq([0.01, 0.3, 0.9, 0.5, 0.9, 0.5]));
  check("flywheel is unique — falls back to hotstart", ex2.cards.some((c) => c.kind === "hotstart") && !ex2.cards.some((c) => c.kind === "flywheel"));
}

// --- reset: destroys the run, keeps phase; hotstart & flywheel apply
{
  const s = freshState(0);
  s.score = 1e30;
  buyTier(s, 0, 40);
  step(s, 3.2);
  const phase = s.tiers[0]!.phase;
  applyPick(s, { kind: "hotstart", tier: -1, stat: null, levels: 5, rarity: 1 });
  applyPick(s, { kind: "stat", tier: 0, stat: "cst", levels: 4, rarity: 2 });
  doReset(s, 1000);
  check("reset keeps phase", approx(s.tiers[0]!.phase, phase));
  check("reset clears pool", Object.keys(s.pool).length === 0);
  check("reset applies hotstart", s.tiers[0]!.bought === 5 && s.tiers[0]!.count === 5);
  check("starting score honors cst tableau", approx(s.score, scen(s).tiers[0]!.baseCost / (1 + LEVEL_POTENCY * 4)));
  prog(s).flywheel = true;
  doReset(s, 2000);
  check("flywheel primes every wheel", s.tiers.every((t) => approx(t.phase, 0.999)));
}

// --- scenarios: separate progress, shapes hold
{
  const s = freshState(0);
  prog(s).resets = 7;
  switchScenario(s, "s2", 0);
  check("s2 has 4 tiers", s.tiers.length === 4 && scen(s).tiers.length === 4);
  check("progress is per-scenario", prog(s).resets === 0 && s.progress["s1"]!.resets === 7);
  switchScenario(s, "s1", 0);
  check("switching back restores tier count", s.tiers.length === 8);
  check("all scenario ids resolve", SCENARIOS.every((sc) => sc.tiers.length > 0));
}

// --- visibility follows the deepest ever bought
{
  const s = freshState(0);
  check("fresh game shows two tiers", visibleTiers(s) === 2, `${visibleTiers(s)}`);
  s.score = 1e30;
  buyTier(s, 0, 1); buyTier(s, 1, 1); buyTier(s, 2, 1);
  check("depth opens one past deepest", visibleTiers(s) === 4);
  doReset(s, 0);
  check("visibility survives reset via everBought", visibleTiers(s) === 4);
}

// --- offline: preparation, not production
{
  const s = freshState(0);
  s.tiers[0]!.count = 10;
  const rep = applyOffline(s, 65 * 60_000);
  check("away banks draws (20min each)", rep.bankedGained === 3 && s.bankedDraws === 3);
  const rep2 = applyOffline(s, 10 * 3600_000);
  check("banked draws cap", s.bankedDraws === BANK_CAP, `${s.bankedDraws}`);
  check("trickle is a token, not production", rep2.trickle <= 61 * (10 * unitValue(s, 0)) / period(s, 0));
}

// --- save round-trip
{
  const { persist, loadGame } = await import("../src/game/save");
  const mem = new Map<string, string>();
  (globalThis as Record<string, unknown>).storage = {
    async get(k: string) { const v = mem.get(k); return v === undefined ? null : { value: v }; },
    async set(k: string, v: string) { mem.set(k, v); return null; },
    async delete(k: string) { mem.delete(k); return null; },
  };
  const s = freshState(0);
  s.score = 1e9;
  buyTier(s, 0, 30);
  applyPick(s, { kind: "stat", tier: 0, stat: "spd", levels: 3, rarity: 1 });
  step(s, 2.5);
  await persist(s);
  const { state: r } = await loadGame(Date.now());
  check("round-trip: score", approx(r.score, s.score));
  check("round-trip: bought & count", r.tiers[0]!.bought === s.tiers[0]!.bought && approx(r.tiers[0]!.count, s.tiers[0]!.count));
  check("round-trip: phase", approx(r.tiers[0]!.phase, s.tiers[0]!.phase));
  check("round-trip: tableau levels", tableauLevels(r, 0, "spd") === 3);
  check("round-trip: pool", approx(r.pool[0]!.cst, s.pool[0]!.cst));
  const junk = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
  junk.score = "NaN"; (junk.tiers as unknown[])[0] = { count: -5, phase: 7 };
  mem.set("gig1:save3", JSON.stringify(junk));
  const { state: healed } = await loadGame(Date.now());
  check("hostile save heals", Number.isFinite(healed.score) && healed.tiers[0]!.count === 0 && healed.tiers[0]!.phase === 0);
}

if (failures > 0) { console.error(`\n${failures} FAILURES`); process.exit(1); }
console.log("\nall green");
