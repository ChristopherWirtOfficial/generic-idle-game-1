import { describe, expect, it } from "vitest";
import { SAVE_VERSION, migrateSave, saveVersion } from "./migrations";

/** The original shape: abbreviated stats, plain numbers, no version field. */
const v1 = () => ({
  scenario: "s1",
  score: 12345,
  runScore: 678,
  tiers: [{ count: 40, bought: 30, phase: 0.2, cycles: 3 }],
  progress: {
    s1: {
      tableau: { 0: { val: 7, spd: 4, cst: 2 } },
      bestRun: 5e7, totalScore: 9e7, everBought: [30],
    },
  },
  pool: { 0: { val: 11, spd: 5, cst: 9 } },
});

describe("version detection", () => {
  it("treats an unversioned save as v1", () => {
    expect(saveVersion(v1())).toBe(1);
  });

  it("leaves a save from the future alone rather than guessing", () => {
    const future = { version: SAVE_VERSION + 5 };
    const r = migrateSave(future);
    expect(r.from).toBe(SAVE_VERSION + 5);
    expect(r.changed).toBe(false);
  });
});

describe("walking v1 to current", () => {
  const { raw, from, to, changed } = migrateSave(v1());
  const out = raw as Record<string, any>;

  it("reports the walk", () => {
    expect(from).toBe(1);
    expect(to).toBe(SAVE_VERSION);
    expect(changed).toBe(true);
    expect(out.version).toBe(SAVE_VERSION);
  });

  it("spells out the stat keys in the tableau and drops the old ones", () => {
    const t = out.progress.s1.tableau[0];
    expect(t).toEqual({ value: 7, speed: 4, cost: 2 });
    expect("val" in t).toBe(false);
  });

  it("spells out the stat keys in the pool", () => {
    expect(out.pool[0]).toEqual({ value: 11, speed: 5, cost: 9 });
  });

  it("normalises unbounded quantities to strings", () => {
    expect(out.score).toBe("12345");
    expect(out.runScore).toBe("678");
    expect(out.tiers[0].count).toBe("40");
    expect(out.progress.s1.bestRun).toBe("50000000");
    expect(out.progress.s1.totalScore).toBe("90000000");
  });

  it("carries banked draws over as rerolls", () => {
    const { raw } = migrateSave({ ...v1(), bankedDraws: 4 });
    const o = raw as Record<string, any>;
    expect(o.rerolls).toBe(4);
    expect("bankedDraws" in o).toBe(false);
  });

  it("leaves bounded quantities as numbers", () => {
    expect(out.tiers[0].bought).toBe(30);
    expect(out.tiers[0].phase).toBe(0.2);
    expect(out.progress.s1.everBought).toEqual([30]);
  });
});

describe("totality", () => {
  it.each([
    ["null", null],
    ["a string", "nonsense"],
    ["an empty object", {}],
    ["missing progress", { scenario: "s1", score: 5 }],
    ["a half-broken tableau", { progress: { s1: { tableau: { 0: null } } } }],
    ["tiers that are not an array", { tiers: "no" }],
  ])("survives %s", (_label, input) => {
    expect(() => migrateSave(input)).not.toThrow();
  });

  it("is idempotent — re-running changes nothing", () => {
    const once = migrateSave(v1());
    const twice = migrateSave(once.raw);
    expect(twice.changed).toBe(false);
    expect(twice.raw).toEqual(once.raw);
  });
});
