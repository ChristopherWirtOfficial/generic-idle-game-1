import { beforeEach, describe, expect, it } from "vitest";
import { SAVE_KEY } from "./constants";
import { applyPick, buyTier, tableauLevels } from "./logic";
import { freshState } from "./state";
import { loadGame, persist } from "./save";

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  (globalThis as Record<string, unknown>).storage = {
    async get(k: string) { const v = mem.get(k); return v === undefined ? null : { value: v }; },
    async set(k: string, v: string) { mem.set(k, v); return null; },
    async delete(k: string) { mem.delete(k); return null; },
  };
});

describe("save round-trip", () => {
  it("survives score, bought, phase, tableau and pool", async () => {
    const s = freshState(0);
    s.score = 1e9;
    buyTier(s, 0, 30);
    applyPick(s, { kind: "stat", tier: 0, stat: "speed", levels: 4, rarity: 2 });
    s.tiers[0]!.phase = 0.61;
    await persist(s);
    expect(mem.has(SAVE_KEY)).toBe(true);

    const { state: r } = await loadGame(Date.now());
    expect(r.score).toBeCloseTo(s.score, 5);
    expect(r.tiers[0]!.bought).toBe(30);
    expect(r.tiers[0]!.phase).toBeCloseTo(0.61, 9);
    expect(tableauLevels(r, 0, "speed")).toBe(4);
    expect(r.pool[0]!.cost).toBeCloseTo(20 * Math.log2(31), 9);
  });

  it("falls back to fresh on a corrupt save", async () => {
    mem.set(SAVE_KEY, "{corrupt");
    const { state } = await loadGame(Date.now());
    expect(state.score).toBe(0);
    expect(state.tiers[0]!.count).toBe(1);
  });

  /**
   * Stats were once val/spd/cst. Saves are never mutated in place, so a save
   * written before the rename still carries the old keys. If revive stops
   * reading them, every tableau ever earned silently zeroes — which is
   * indistinguishable from a wipe to the player.
   */
  it("revives a pre-rename save's val/spd/cst keys", async () => {
    mem.set(SAVE_KEY, JSON.stringify({
      scenario: "s1", score: 500, runScore: 0, lastSeen: Date.now(),
      tiers: [{ count: 3, bought: 30, phase: 0.2, cycles: 0 }],
      progress: { s1: { tableau: { 0: { val: 7, spd: 4, cst: 2 } }, everBought: [30] } },
      pool: { 0: { val: 11, spd: 5, cst: 9 } },
    }));
    const { state } = await loadGame(Date.now());
    expect(tableauLevels(state, 0, "value")).toBe(7);
    expect(tableauLevels(state, 0, "speed")).toBe(4);
    expect(tableauLevels(state, 0, "cost")).toBe(2);
    expect(state.pool[0]!.value).toBeCloseTo(11, 9);
    expect(state.pool[0]!.cost).toBeCloseTo(9, 9);
  });
});
