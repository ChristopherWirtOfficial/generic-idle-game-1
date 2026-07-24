import { describe, expect, it } from "vitest";
import {
  BANK_CAP, BANK_MS, BASE_DRAW, GLOW_PERIOD_S, LEVEL_POTENCY, NUM_CLAMP, POOL_DAMP, TRICKLE_S,
} from "./constants";
import {
  applyPick, buyTier, clampState, doReset, liquidationValue, maxAffordable, milestoneLevel,
  period, pickThresholds, picksFor, poolEntries, prog, rollDraw, scoreRate,
  step, switchScenario, tableauLevels, threshScale, tierCost, unitValue, visibleTiers,
} from "./logic";
import { fmtVal } from "./format";
import { freshState } from "./state";
import { D } from "./num";
import { applyOffline } from "./save";
import type { Card, GameState, Stat } from "./types";

function setLevels(s: GameState, tier: number, stat: Stat, L: number): void {
  const row = (prog(s).tableau[tier] ??= { value: 0, speed: 0, cost: 0 });
  row[stat] = L;
}
const lcg = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

describe("cycles: one formula, no piecewise", () => {
  it("pays count x cycles in the discrete regime, and the same ratio through glow", () => {
    const a = freshState(0);
    const t0 = a.tiers[0]!;
    t0.count = D(10); t0.bought = 10; t0.phase = 0; // absolute, replacing the starting unit
    step(a, 100);
    // base period 2s -> 50 completions x 10 held x value 1
    expect(a.runScore.toNumber()).toBeCloseTo(500, 5);

    const b = freshState(0);
    setLevels(b, 0, "speed", 24); // mult x25 -> period 0.08s, below GLOW
    const tb = b.tiers[0]!;
    tb.count = D(10); tb.bought = 10; tb.phase = 0;
    expect(period(b, 0)).toBeLessThan(GLOW_PERIOD_S);
    step(b, 100);
    // The whole point of the renderer-only glow line: xN speed still pays xN.
    expect(b.runScore.div(a.runScore).toNumber()).toBeCloseTo(1 + LEVEL_POTENCY * 24, 1);
  });
});

describe("unowned wheels freeze", () => {
  it("holds phase through step, and resumes from it", () => {
    const s = freshState(0);
    s.tiers[0]!.count = D(0);
    s.tiers[0]!.phase = 0.2;
    step(s, 3);
    expect(s.tiers[0]!.phase).toBeCloseTo(0.2, 9);
    s.tiers[0]!.count = D(1);
    step(s, 1.4); // period 2s: adv 0.7, total 0.9 — no completion yet
    expect(s.tiers[0]!.phase).toBeCloseTo(0.9, 9);
  });

  it("holds phase through time away", () => {
    const o = freshState(0);
    o.tiers[0]!.count = D(0);
    o.tiers[0]!.phase = 0.4;
    applyOffline(o, BANK_MS);
    expect(o.tiers[0]!.phase).toBeCloseTo(0.4, 9);
  });
});

describe("costs are bought-only", () => {
  it("produced units never touch price, hand-bought ones do", () => {
    const s = freshState(0);
    s.score = D(1e4);
    const c0 = tierCost(s, 0, 1);
    s.tiers[0]!.count = D(500); // produced
    expect(tierCost(s, 0, 1).eq(c0)).toBe(true);
    expect(buyTier(s, 0, 1)).toBe(true);
    expect(tierCost(s, 0, 1).gt(c0)).toBe(true);
  });
});

describe("milestones: doubling spans", () => {
  it.each([[0, 0], [24, 0], [25, 1], [74, 1], [75, 2], [174, 2], [175, 3]])(
    "bought %i -> level %i",
    (bought, want) => {
      const s = freshState(0);
      s.tiers[0]!.bought = bought;
      expect(milestoneLevel(s, 0)).toBe(want);
    },
  );

  it("level 1 doubles value", () => {
    const s = freshState(0);
    s.tiers[0]!.bought = 25;
    expect(unitValue(s, 0)).toBeCloseTo(2, 9);
  });
});

describe("pool sculpting", () => {
  it("writes cost weight per doubling of stake, with steep diminishing", () => {
    const s = freshState(0);
    s.score = D(1e9);
    buyTier(s, 0, 30); // also crosses the 25 milestone
    const pool0 = s.pool[0]!;
    expect(pool0.cost).toBeCloseTo(20 * Math.log2(31), 9);
    expect(pool0.value).toBeCloseTo(20, 9);

    const afterFirst = pool0.cost;
    buyTier(s, 0, 30);
    expect(pool0.cost - afterFirst).toBeLessThan(afterFirst / 2);
  });

  it("writes speed weight per second watched, not per completion", () => {
    const s = freshState(0);
    s.score = D(1e9);
    buyTier(s, 0, 1);
    s.tiers[0]!.phase = 0;
    step(s, 4);
    expect(s.pool[0]!.speed).toBeCloseTo(1, 9);

    // A 10s wheel is five times slower than tier 1 and must still earn the same
    // weight — per-completion starved the deep tiers to nothing.
    const slow = freshState(0);
    slow.score = D(1e9);
    buyTier(slow, 0, 1);
    slow.tiers[1]!.count = D(1);
    step(slow, 4);
    expect(slow.pool[1]!.speed).toBeCloseTo(1, 9);
  });

  it("closes its own speed spigot at glow", () => {
    const s = freshState(0);
    s.score = D(1e9);
    buyTier(s, 0, 1);
    setLevels(s, 0, "speed", 24);
    const before = s.pool[0]!.speed;
    step(s, 10);
    expect(s.pool[0]!.speed).toBeCloseTo(before, 9);
  });

  it("damps a tier's own weight by the levels already held there", () => {
    const s = freshState(0);
    s.score = D(1e12);
    buyTier(s, 0, 30);
    const raw = poolEntries(s).reduce((a, e) => a + e.w, 0);
    setLevels(s, 0, "cost", 50);
    const damped = poolEntries(s).reduce((a, e) => a + e.w, 0);
    expect(damped).toBeLessThan(raw);
    expect(damped).toBeCloseTo(raw / (1 + POOL_DAMP * 50), 9);
  });
});

describe("rising ladder", () => {
  it("thresholds ride the ladder as picks accumulate", () => {
    const s = freshState(0);
    const [t1a] = pickThresholds(s);
    expect(threshScale(s)).toBeCloseTo(1, 9);
    const card: Card = { kind: "stat", tier: 0, stat: "value", levels: 1, rarity: 0 };
    applyPick(s, card); applyPick(s, card);
    expect(threshScale(s)).toBeCloseTo(Math.pow(1 + 0.12 * 2, 2), 9);
    const [t1b] = pickThresholds(s);
    expect(t1b).toBeGreaterThan(t1a);
    expect(picksFor(s, t1b)).toBe(1);
    expect(picksFor(s, t1b - 1)).toBe(0);
  });
});

describe("liquidation telescopes", () => {
  it("fires everything once, top-down", () => {
    const s = freshState(0);
    s.tiers[0]!.count = D(100);
    s.tiers[1]!.count = D(7);
    // tier 2 fires: 7 -> tier 1. tier 1 fires: (100+7) x 1 -> score.
    expect(liquidationValue(s).toNumber()).toBeCloseTo(107, 9);
  });

  it("honours s4's dead link and half-rate bridge", () => {
    const s4 = freshState(0);
    switchScenario(s4, "s4", 0);
    s4.tiers[3]!.count = D(50); // dead link
    s4.tiers[4]!.count = D(10); // pays tier 3 (index 2) at 0.5
    s4.tiers[2]!.count = D(0);
    s4.tiers[1]!.count = D(0);
    s4.tiers[0]!.count = D(0);
    expect(liquidationValue(s4).toNumber()).toBeCloseTo(5, 9);
  });
});

describe("draws and picks", () => {
  it("draws base + banked, and picks add levels", () => {
    const s = freshState(0);
    s.score = D(1e9);
    buyTier(s, 0, 30);
    s.bankedDraws = 2;
    s.runScore = D(pickThresholds(s)[0]);
    const offer = rollDraw(s, lcg(7));
    expect(offer.cards).toHaveLength(BASE_DRAW + 2);
    expect(offer.picks).toBe(1);
    expect(offer.cards.every((c) => c.kind !== "stat" || (c.levels >= 1 && c.tier >= 0))).toBe(true);

    const stat = offer.cards.find((c) => c.kind === "stat")!;
    const before = tableauLevels(s, stat.tier, stat.stat!);
    applyPick(s, stat);
    expect(tableauLevels(s, stat.tier, stat.stat!)).toBe(before + stat.levels);
  });
});

describe("reset: phase stays, rest goes", () => {
  it("clears stock, buys and pool but keeps phase", () => {
    const s = freshState(0);
    s.score = D(1e9);
    buyTier(s, 0, 40);
    s.tiers[0]!.phase = 0.37;
    s.runScore = D(5e5);
    doReset(s, 1000);
    expect(s.tiers[0]!.bought).toBe(0);
    expect(s.tiers[0]!.count.toNumber()).toBe(1);
    expect(s.tiers[0]!.phase).toBeCloseTo(0.37, 9);
    expect(poolEntries(s)).toHaveLength(0);
    expect(s.score.toNumber()).toBeCloseTo(0, 9);
    expect(tierCost(s, 0, 1).toNumber()).toBe(5); // the gift never touched the ladder
    expect(prog(s).resets).toBe(1);
  });

  it("stacks hotstart as held-not-bought, and flywheel arms every wheel", () => {
    const s = freshState(0);
    applyPick(s, { kind: "hotstart", tier: -1, stat: null, levels: 5, rarity: 1 });
    applyPick(s, { kind: "flywheel", tier: -1, stat: null, levels: 1, rarity: 2 });
    doReset(s, 2000);
    expect(s.tiers[0]!.count.toNumber()).toBe(6);
    expect(s.tiers[0]!.bought).toBe(0);
    expect(s.tiers.every((t) => t.phase > 0.99)).toBe(true);
  });
});

describe("scenarios", () => {
  it("keeps a separate tableau per scenario", () => {
    const s = freshState(0);
    applyPick(s, { kind: "stat", tier: 0, stat: "value", levels: 3, rarity: 0 });
    switchScenario(s, "s2", 0);
    expect(s.tiers).toHaveLength(4);
    expect(tableauLevels(s, 0, "value")).toBe(0);
    switchScenario(s, "s1", 0);
    expect(tableauLevels(s, 0, "value")).toBe(3);
    expect(visibleTiers(s)).toBeGreaterThanOrEqual(1);
  });
});

describe("offline is preparation", () => {
  it("banks a draw per interval and trickles 60s of tier-1 rate", () => {
    const s = freshState(0);
    s.tiers[0]!.count = D(10); s.tiers[0]!.bought = 10;
    const rate = scoreRate(s);
    const rep = applyOffline(s, BANK_MS * 2 + 1000);
    expect(rep.bankedGained).toBe(2);
    expect(rep.trickle.toNumber()).toBeCloseTo(rate.times(TRICKLE_S).toNumber(), 9);
  });

  it("caps the bank", () => {
    const s = freshState(0);
    s.bankedDraws = BANK_CAP - 1;
    applyOffline(s, BANK_MS * 50);
    expect(s.bankedDraws).toBe(BANK_CAP);
  });
});

describe("clamp and affordability", () => {
  it("clamps infinities", () => {
    const s = freshState(0);
    s.score = D(Infinity);
    s.tiers[0]!.count = D(Infinity);
    clampState(s);
    expect(s.score.eq(NUM_CLAMP)).toBe(true);
    expect(s.tiers[0]!.count.eq(NUM_CLAMP)).toBe(true);
  });

  it("maxAffordable is affordable and maximal", () => {
    const t = freshState(0);
    t.score = D(1e4);
    const n = maxAffordable(t, 0);
    expect(tierCost(t, 0, n).lte(t.score)).toBe(true);
    expect(tierCost(t, 0, n + 1).gt(t.score)).toBe(true);
  });
});

describe("honest small-value formatting", () => {
  it.each([[1.75, "1.75"], [0.875, "0.875"], [2.5, "2.5"], [21, "21"]])(
    "fmtVal(%s) === %s",
    (n, want) => { expect(fmtVal(n as number)).toBe(want); },
  );
});
