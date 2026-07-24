import { SCENARIOS } from "./constants";
import { ONE, ZERO } from "./num";
import type { GameState } from "./types";

export function freshState(now = Date.now()): GameState {
  const first = SCENARIOS[0]!;
  const s: GameState = {
    scenario: first.id,
    score: ZERO,
    runScore: ZERO,
    tiers: first.tiers.map(() => ({ count: ZERO, bought: 0, phase: 0, cycles: 0 })),
    progress: {},
    pool: {},
    bankedDraws: 0,
    startedAt: now,
    lastSeen: now,
    runStartedAt: now,
  };
  const t0 = s.tiers[0];
  if (t0) t0.count = ONE; // the machine is already breathing when you arrive
  return s;
}
