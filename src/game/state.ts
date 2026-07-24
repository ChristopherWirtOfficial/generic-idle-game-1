import { SCENARIOS } from "./constants";
import type { GameState } from "./types";

export function freshState(now = Date.now()): GameState {
  const first = SCENARIOS[0]!;
  const s: GameState = {
    scenario: first.id,
    score: 0,
    runScore: 0,
    tiers: first.tiers.map(() => ({ count: 0, bought: 0, phase: 0, cycles: 0 })),
    progress: {},
    pool: {},
    bankedDraws: 0,
    startedAt: now,
    lastSeen: now,
    runStartedAt: now,
  };
  const t0 = s.tiers[0];
  if (t0) t0.count = 1; // the machine is already breathing when you arrive
  return s;
}
