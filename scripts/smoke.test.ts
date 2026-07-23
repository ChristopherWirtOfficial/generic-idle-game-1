import { strict as assert } from "node:assert";
import { fmt, fmtRate } from "../src/game/format";
import {
  buyGen,
  buyUpgrade,
  checkAchievements,
  doPrestige,
  genBulkCost,
  genCost,
  genMaxAffordable,
  metaMult,
  pendingPP,
  pointsPerSecond,
  press,
  pressValue,
  step,
} from "../src/game/logic";
import { initialState } from "../src/game/state";
import { load, persist } from "../src/game/save";
import type { GameState } from "../src/game/types";

const now = 1_000_000_000_000;

function fresh(): GameState {
  return initialState(now);
}

// ---- formatting ----
assert.equal(fmt(0), "0");
assert.equal(fmt(999_999), "999,999");
assert.equal(fmt(1_000_000), "1.00M");
assert.equal(fmt(1_234_567), "1.23M");
assert.equal(fmt(4.2e9), "4.20B");
assert.equal(fmtRate(0.1), "0.1");
assert.ok(fmt(1e40).includes("e"), "past Dc goes scientific: " + fmt(1e40));

// ---- costs ----
let s = fresh();
assert.equal(genCost(s, 0), 15);
assert.ok(Math.abs(genBulkCost(s, 0, 1) - 15) < 1e-9);
s = { ...s, points: genBulkCost(s, 0, 5) };
const maxN = genMaxAffordable(s, 0);
assert.ok(maxN === 5, "exact bulk cost should afford exactly 5, got " + maxN);

// ---- buying ----
s = { ...fresh(), points: 100 };
s = buyGen(s, 0, 1);
assert.equal(s.gens[0], 1);
assert.ok(Math.abs(s.points - 85) < 1e-9);
const before = s;
s = buyGen(s, 5, 1); // cannot afford a Conglomerate
assert.equal(s, before, "unaffordable buy must be a no-op");

// ---- production and step ----
s = { ...fresh(), points: 0, gens: [0, 1, 0, 0, 0, 0, 0, 0] };
assert.ok(Math.abs(pointsPerSecond(s) - 1) < 1e-9);
s = step(s, 1000, now + 1000);
assert.ok(Math.abs(s.points - 1) < 1e-6, "1s of one Machine = 1 point");
assert.equal(s.lastSeen, now + 1000);

// ---- pressing and upgrades ----
s = fresh();
assert.equal(pressValue(s), 1);
s = press(s);
assert.equal(s.presses, 1);
assert.equal(s.points, 1);
s = { ...s, points: 200, everEarned: 200 };
s = buyUpgrade(s, "press1");
assert.equal(pressValue(s), 2);
assert.ok(s.points === 100);
const dup = buyUpgrade(s, "press1");
assert.equal(dup, s, "double-purchase must be a no-op");

// ---- achievements ----
const ach = checkAchievements(s);
assert.ok(ach.includes("a-press1"));
assert.ok(ach.includes("a-pts100"));

// ---- prestige ----
s = { ...fresh(), runEarned: 4e6, points: 123, gens: [3, 0, 0, 0, 0, 0, 0, 0] };
assert.equal(pendingPP(s), 2);
const post = doPrestige(s);
assert.equal(post.pp, 2);
assert.equal(post.points, 0);
assert.equal(post.gens[0], 0);
assert.equal(post.resets, 1);
assert.ok(Math.abs(metaMult(post) - 1.2) < 1e-9, "2 PP = 1.2x");

// ---- save round-trip (memory fallback; no window here) ----
{
  const state = { ...fresh(), points: 42, gens: [2, 0, 0, 0, 0, 0, 0, 0], lastSeen: now };
  await persist(state);
  const back = await load(now + 1000); // 1s away: below the mention threshold
  assert.ok(Math.abs(back.state.points - (42 + 0.2)) < 1e-6, "1s of drift credited silently");
  assert.equal(back.offline, null);
}

// ---- offline progress ----
{
  const hourAgo = now - 3_600_000;
  const state = { ...fresh(), points: 0, gens: [0, 1, 0, 0, 0, 0, 0, 0], lastSeen: hourAgo };
  await persist(state);
  const back = await load(now);
  assert.ok(back.offline !== null, "an hour away is worth mentioning");
  assert.ok(Math.abs(back.offline.gained - 3600) < 1, "1/s for 1h = ~3600");
  assert.equal(back.offline.ms, 3_600_000);
  assert.ok(Math.abs(back.state.points - 3600) < 1);
}

console.log("smoke: all assertions passed");
