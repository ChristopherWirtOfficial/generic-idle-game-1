import { GENERATORS, SAVE_VERSION } from "./constants";
import type { GameState } from "./types";

export function initialState(now: number): GameState {
  return {
    v: SAVE_VERSION,
    points: 0,
    runEarned: 0,
    everEarned: 0,
    presses: 0,
    gens: GENERATORS.map(() => 0),
    upgrades: [],
    achievements: [],
    pp: 0,
    resets: 0,
    playedMs: 0,
    lastSeen: now,
  };
}
