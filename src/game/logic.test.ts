import { describe, expect, it } from "vitest";
import {
  BANK_CAP, BANK_MS, BASE_DRAW, GLOW_PERIOD_S, LEVEL_POTENCY, NUM_CLAMP, POOL_ALPHA, POOL_CAP,
  COST_PER_DOUBLING, NEED_P, NEED_TIER_P, POOL_FLOOR, SPEED_PER_SEC, TRICKLE_S, VALUE_PER_MILESTONE,
} from "./constants";
import {
  applyPick, buyTier, clampState, doReset, liquidationValue, maxAffordable, milestoneLevel,
  period, pickThresholds, picksFor, poolEntries, poolSlots, prog, rollDraw, scoreRate,
  shapeWeights, step, switchScenario, tableauLevels, threshScale, tierCost, unitValue, visibleTiers,
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
    expect(pool0.cost).toBeCloseTo(COST_PER_DOUBLING * Math.log2(31), 9);
    expect(pool0.value).toBeCloseTo(VALUE_PER_MILESTONE, 9);

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
    expect(s.pool[0]!.speed).toBeCloseTo(4 * SPEED_PER_SEC, 9);

    // A 10s wheel is five times slower than tier 1 and must still earn the same
    // weight — per-completion starved the deep tiers to nothing.
    const slow = freshState(0);
    slow.score = D(1e9);
    buyTier(slow, 0, 1);
    slow.tiers[1]!.count = D(1);
    step(slow, 4);
    expect(slow.pool[1]!.speed).toBeCloseTo(4 * SPEED_PER_SEC, 9);
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
    s.tiers[1]!.count = D(1);
    step(s, 20); // give tier 2 some weight of its own to lean toward
    const raw = poolSlots(s).find((e) => e.tier === 0 && e.stat === "cost")!.w;
    setLevels(s, 0, "cost", 50);
    const damped = poolSlots(s).find((e) => e.tier === 0 && e.stat === "cost")!.w;
    // Both factors apply: gentle on the tier's total, sharp on this line's own.
    expect(damped).toBeCloseTo(raw / (Math.pow(51, NEED_TIER_P) * Math.pow(51, NEED_P)), 9);
    // ...and the damping reaches the floor slice too, or the floor would be an
    // undiminishing promise and so a free focus engine.
    const t0 = poolEntries(s).filter((e) => e.tier === 0);
    const t1 = poolEntries(s).filter((e) => e.tier === 1);
    expect(t0[0]!.floor).toBeLessThan(t1[0]!.floor);
  });
});

describe("shaping: signal in, odds out", () => {
  it("is a probability distribution, ordered like the signal", () => {
    const p = shapeWeights([100, 20, 2, 0]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(p[0]!).toBeGreaterThan(p[1]!);
    expect(p[1]!).toBeGreaterThan(p[2]!);
    expect(p[2]!).toBeGreaterThan(p[3]!);
  });

  it("compresses dominance: alpha<1 shrinks the loudest line's lead", () => {
    const ws = [400, 20, 2, 0];
    const raw = shapeWeights(ws, 1, 0, 99);
    const shaped = shapeWeights(ws, 0.45, 0, 99);
    expect(raw[0]! / raw[1]!).toBeGreaterThan(shaped[0]! / shaped[1]!);
    expect(shaped[0]!).toBeLessThan(raw[0]!);
  });

  it("floors every known line — a zero-weight line still has real odds", () => {
    const ws = [400, 0, 0, 0];
    expect(shapeWeights(ws, 0.45, 0, 99)[1]).toBe(0);
    const withFloor = shapeWeights(ws, 0.45, 0.25, 99);
    // Floor budget is quoted in even splits: F/n of the draw, at n lines.
    expect(withFloor[1]!).toBeCloseTo(0.25 / 4, 9);
  });

  it("caps every line at CAP even splits, spilling flat to the rest", () => {
    const p = shapeWeights([1e6, 1, 1, 1], 0.45, 0, 2.2);
    expect(p[0]!).toBeCloseTo(2.2 / 4, 9);
    // Flat spill, not proportional: the three starved lines end up equal.
    expect(p[2]!).toBeCloseTo(p[1]!, 9);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });

  it("never caps below an even split, and is uniform on an empty pool", () => {
    expect(shapeWeights([1e6, 1, 1], 0.45, 0, 0.1)[0]!).toBeCloseTo(1 / 3, 9);
    expect(shapeWeights([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it("shares the floor along the basis it is given", () => {
    const p = shapeWeights([0, 0], 0.45, 1, 99, [1, 3]);
    expect(p[0]!).toBeCloseTo(0.25, 9);
    expect(p[1]!).toBeCloseTo(0.75, 9);
  });

  it("poolEntries is the distribution the roll actually uses", () => {
    const s = freshState(0);
    s.score = D(1e12);
    buyTier(s, 0, 40);
    const entries = poolEntries(s);
    expect(entries.reduce((a, e) => a + e.w, 0)).toBeCloseTo(1, 9);
    const slots = poolSlots(s);
    const direct = shapeWeights(slots.map((e) => e.w), POOL_ALPHA, POOL_FLOOR, POOL_CAP, slots.map((e) => e.damp));
    expect(entries.map((e) => e.w)).toEqual(direct);
    // Every line the player has opened is on the table, three stats each.
    expect(entries).toHaveLength(3);
    expect(entries.every((e) => e.w > 0)).toBe(true);
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
  it("always draws BASE_DRAW — rerolls buy another hand, not a wider one", () => {
    const s = freshState(0);
    s.score = D(1e9);
    buyTier(s, 0, 30);
    s.rerolls = 2;
    s.runScore = D(pickThresholds(s)[0]);
    const offer = rollDraw(s, lcg(7));
    expect(offer.cards).toHaveLength(BASE_DRAW);
    expect(offer.picks).toBe(1);
    expect(offer.cards.every((c) => c.kind !== "stat" || (c.levels >= 1 && c.tier >= 0))).toBe(true);

    const stat = offer.cards.find((c) => c.kind === "stat")!;
    const before = tableauLevels(s, stat.tier, stat.stat!);
    applyPick(s, stat);
    expect(tableauLevels(s, stat.tier, stat.stat!)).toBe(before + stat.levels);
  });

  it("never offers the same line twice while a distinct one is left", () => {
    // Two tiers open -> six lines. Three cards must be three different lines,
    // whatever the pool looks like: a hand you cannot choose within is not a
    // hand. Independent sampling repeated a line in about half of all hands.
    const s = freshState(0);
    s.score = D(1e14);
    buyTier(s, 0, 300); // one landslide line to try to monopolise the draw
    s.tiers[1]!.count = D(1);
    buyTier(s, 1, 1);
    step(s, 30);
    for (let seed = 1; seed <= 60; seed++) {
      const cards = rollDraw(s, lcg(seed)).cards.filter((c) => c.kind === "stat");
      const lines = new Set(cards.map((c) => `${c.tier}|${c.stat}`));
      expect(lines.size).toBe(cards.length);
    }
  });

  it("refills the bag only once a hand has run out of distinct lines", () => {
    const s = freshState(0); // one tier open -> exactly three lines
    s.score = D(1e9);
    buyTier(s, 0, 30);
    s.rerolls = 3; // six cards against three lines
    const cards = rollDraw(s, lcg(11)).cards.filter((c) => c.kind === "stat");
    const counts = new Map<string, number>();
    for (const c of cards) counts.set(`${c.tier}|${c.stat}`, (counts.get(`${c.tier}|${c.stat}`) ?? 0) + 1);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });

  it("offers every stat on a fresh run rather than one consolation card", () => {
    const s = freshState(0);
    const stats = new Set(rollDraw(s, lcg(3)).cards.filter((c) => c.kind === "stat").map((c) => c.stat));
    expect(stats).toEqual(new Set(["value", "speed", "cost"]));
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
    // The run's writing is gone. The lines themselves stay on the table — you
    // still know tier 1 — so what a fresh pool offers is an even split, not
    // nothing and not a hardcoded card.
    expect(s.pool).toEqual({});
    expect(poolEntries(s).map((e) => e.w)).toEqual([1 / 3, 1 / 3, 1 / 3]);
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
    s.rerolls = BANK_CAP - 1;
    applyOffline(s, BANK_MS * 50);
    expect(s.rerolls).toBe(BANK_CAP);
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
