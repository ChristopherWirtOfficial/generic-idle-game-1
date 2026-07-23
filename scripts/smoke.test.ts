import assert from "node:assert/strict";
import {
  ACHIEVEMENTS, CRUNCH_LOG_RATE, CRUNCH_LOG_START, MILESTONE_FIRST, TIERS,
} from "../src/game/constants";
import {
  buyTier, buyUpgrade, checkAchievements, doCrunch, dustPerSecond, maxAffordable,
  milestoneLevel, nextMilestoneAt, pendingSingularities, press, pressValue, step, tierCost, tierOutput,
} from "../src/game/logic";
import { freshState } from "../src/game/state";
import { fmt, fmtDuration, fmtRate } from "../src/game/format";
import { applyOffline, eraseSave, loadGame, persist } from "../src/game/save";

// ---- formatting
assert.equal(fmt(0), "0");
assert.equal(fmt(999_999), "999,999");
assert.equal(fmt(1_500_000), "1.50M");
assert.ok(fmt(3e24).includes("Sp") || /e\+?24/.test(fmt(3e24)));
assert.equal(fmtRate(0.05), "0.05");
assert.ok(fmtDuration(3_700_000).includes("h"));

// ---- chain production: only tier 0 makes dust; tier i makes tier i-1
{
  const s = freshState(0);
  const t1 = s.tiers[1];
  assert.ok(t1);
  t1.count = 10; // 10 Comets, rate 0.05 -> 0.5 Motes/s
  assert.equal(dustPerSecond(s), 0);
  step(s, 2);
  // Top-down cascade: the 1.0 Motes formed this step already emitted dust this step.
  assert.ok(Math.abs((s.tiers[0]?.count ?? 0) - 1) < 1e-9);
  assert.ok(Math.abs(s.dust - 1.2) < 1e-9, `dust ${s.dust}`);
  step(s, 1);
  assert.ok(Math.abs((s.tiers[0]?.count ?? 0) - 1.5) < 1e-9);
  assert.ok(Math.abs(s.dust - 2.1) < 1e-9, `dust ${s.dust}`);
}

// ---- costs: growth on bought only; produced units never raise price
{
  const s = freshState(0);
  const t0 = s.tiers[0];
  assert.ok(t0);
  const def = TIERS[0];
  assert.ok(def);
  assert.equal(tierCost(s, 0, 1), def.baseCost);
  t0.count = 500; // produced, not bought
  assert.equal(tierCost(s, 0, 1), def.baseCost);
  s.dust = def.baseCost;
  assert.ok(buyTier(s, 0, 1));
  assert.ok(Math.abs(tierCost(s, 0, 1) - def.baseCost * def.costGrowth) < 1e-9);
  assert.ok(!buyTier(s, 0, 1)); // broke now
}

// ---- maxAffordable buys exactly what dust allows
{
  const s = freshState(0);
  s.dust = 10_000;
  const n = maxAffordable(s, 0);
  assert.ok(n > 0);
  const cost = tierCost(s, 0, n);
  assert.ok(cost <= 10_000);
  assert.ok(tierCost(s, 0, n + 1) > 10_000);
  assert.ok(buyTier(s, 0, n));
}

// ---- milestones: 25, 75, 175 boundaries; doubling spans
{
  const s = freshState(0);
  const t0 = s.tiers[0];
  assert.ok(t0);
  t0.bought = 24; assert.equal(milestoneLevel(s, 0), 0);
  t0.bought = 25; assert.equal(milestoneLevel(s, 0), 1);
  assert.equal(nextMilestoneAt(s, 0), MILESTONE_FIRST * 3); // 75
  t0.bought = 75; assert.equal(milestoneLevel(s, 0), 2);
  t0.bought = 174; assert.equal(milestoneLevel(s, 0), 2);
  t0.bought = 175; assert.equal(milestoneLevel(s, 0), 3);
  // level 1 doubles output
  t0.bought = 25; t0.count = 10;
  const base = 10 * (TIERS[0]?.baseRate ?? 0);
  assert.ok(Math.abs(tierOutput(s, 0) - base * 2) < 1e-9);
}

// ---- press: base 1, ×3 upgrade, +2% of dust/s
{
  const s = freshState(0);
  assert.equal(pressValue(s), 1);
  s.dust = 250;
  assert.ok(buyUpgrade(s, "u-press2"));
  assert.equal(pressValue(s), 3);
  const t0 = s.tiers[0];
  assert.ok(t0);
  t0.count = 1000; t0.bought = 0; // 600 dust/s
  s.dust = 20_000;
  assert.ok(buyUpgrade(s, "u-presspct"));
  assert.ok(Math.abs(pressValue(s) - (3 + 0.02 * dustPerSecond(s))) < 1e-9);
  const before = s.dust;
  press(s);
  assert.ok(s.dust > before);
  assert.ok(!buyUpgrade(s, "u-press2")); // no repurchase
}

// ---- achievements
{
  const s = freshState(0);
  press(s);
  const fresh = checkAchievements(s);
  assert.ok(fresh.includes("a-press"));
  assert.equal(checkAchievements(s).length, 0);
  assert.ok(ACHIEVEMENTS.length === 12);
}

// ---- crunch: log thresholds, monotonic totals, reset keeps singularities
{
  const s = freshState(0);
  s.lifetimeDust = Math.pow(10, CRUNCH_LOG_START); // exactly at start -> 0
  assert.equal(pendingSingularities(s), 0);
  s.lifetimeDust = Math.pow(10, CRUNCH_LOG_START + 2 / CRUNCH_LOG_RATE + 1e-9);
  assert.equal(pendingSingularities(s), 2);
  s.dust = 5;
  const t0 = s.tiers[0];
  assert.ok(t0);
  t0.count = 50; t0.bought = 30;
  s.upgrades.push("u-press2");
  const gained = doCrunch(s);
  assert.equal(gained, 2);
  assert.equal(s.singularities, 2);
  assert.equal(s.dust, 0);
  assert.equal(s.tiers[0]?.count, 0);
  assert.equal(s.upgrades.length, 0);
  assert.equal(pendingSingularities(s), 0); // same lifetime -> nothing new
  // singularity mult on dust output: ×1.3
  const t0b = s.tiers[0];
  assert.ok(t0b);
  t0b.count = 10;
  assert.ok(Math.abs(tierOutput(s, 0) - 10 * 0.6 * 1.3) < 1e-9);
}

// ---- offline: chained sim credits polynomial growth, respects cap
{
  const s = freshState(0);
  const t1 = s.tiers[1];
  assert.ok(t1);
  t1.count = 100; // 5 Motes/s -> quadratic dust
  const rep = applyOffline(s, 3600_000);
  assert.equal(rep.creditedMs, 3600_000);
  // Exact integral: dust = 0.6 * 5 * t^2 / 2 = 1.5*t^2 at t=3600 -> 1.944e7. Coarse sim slightly under.
  assert.ok(rep.dustGained > 1.8e7 && rep.dustGained < 2.0e7, `got ${rep.dustGained}`);
  const s2 = freshState(0);
  const rep2 = applyOffline(s2, 100 * 3600_000);
  assert.equal(rep2.creditedMs, 8 * 3600_000);
}

// ---- save round-trip via memory backend
{
  const s = freshState(1000);
  s.dust = 42; s.singularities = 3;
  const t2 = s.tiers[2];
  assert.ok(t2);
  t2.count = 7.5; t2.bought = 6;
  s.upgrades.push("u-mote2");
  s.achievements.push("a-press");
  await persist(s);
  const { state: loaded } = await loadGame(s.lastSeen + 1000); // 1s later: no offline modal
  assert.equal(loaded.dust, 42);
  assert.equal(loaded.singularities, 3);
  assert.equal(loaded.tiers[2]?.count, 7.5);
  assert.equal(loaded.tiers[2]?.bought, 6);
  assert.deepEqual(loaded.upgrades, ["u-mote2"]);
  await eraseSave();
  const { state: wiped } = await loadGame();
  assert.equal(wiped.dust, 0);
}

console.log("smoke: all assertions passed");
