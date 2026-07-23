import { TIERS } from "./constants";
import type { GameState } from "./types";

export function freshState(now = Date.now()): GameState {
  return {
    dust: 0,
    lifetimeDust: 0,
    runDust: 0,
    tiers: TIERS.map(() => ({ count: 0, bought: 0 })),
    upgrades: [],
    achievements: [],
    singularities: 0,
    crunches: 0,
    presses: 0,
    startedAt: now,
    lastSeen: now,
  };
}
