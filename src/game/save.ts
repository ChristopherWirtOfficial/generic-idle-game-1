import { GENERATORS, OFFLINE_CAP_MS, OFFLINE_MIN_MS, SAVE_KEY } from "./constants";
import { pointsPerSecond } from "./logic";
import { initialState } from "./state";
import type { GameState } from "./types";

interface ArtifactStorage {
  get(key: string): Promise<{ value: string } | null>;
  set(key: string, value: string): Promise<unknown>;
  delete(key: string): Promise<unknown>;
}

declare global {
  interface Window {
    storage?: ArtifactStorage;
  }
}

/** Dev fallback so the game runs outside the artifact host too. */
let memoryFallback: string | null = null;

function host(): ArtifactStorage | null {
  if (typeof window !== "undefined" && window.storage) return window.storage;
  return null;
}

export async function persist(s: GameState): Promise<void> {
  const json = JSON.stringify(s);
  const h = host();
  if (!h) {
    memoryFallback = json;
    return;
  }
  try {
    await h.set(SAVE_KEY, json);
  } catch {
    // Saving is best-effort. The number continues regardless.
  }
}

export async function eraseSave(): Promise<void> {
  memoryFallback = null;
  const h = host();
  if (!h) return;
  try {
    await h.delete(SAVE_KEY);
  } catch {
    // Nothing to do about it.
  }
}

function reviveState(raw: string, now: number): GameState {
  const base = initialState(now);
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return base;
  const p = parsed as Partial<GameState>;
  const num = (x: unknown, fallback: number): number =>
    typeof x === "number" && isFinite(x) ? x : fallback;
  const strArr = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : [];
  const gens = GENERATORS.map((_, i) =>
    Array.isArray(p.gens) ? Math.max(0, Math.floor(num(p.gens[i], 0))) : 0
  );
  return {
    ...base,
    points: num(p.points, 0),
    runEarned: num(p.runEarned, 0),
    everEarned: num(p.everEarned, 0),
    presses: num(p.presses, 0),
    gens,
    upgrades: strArr(p.upgrades),
    achievements: strArr(p.achievements),
    pp: num(p.pp, 0),
    resets: num(p.resets, 0),
    playedMs: num(p.playedMs, 0),
    lastSeen: num(p.lastSeen, now),
  };
}

export interface LoadResult {
  state: GameState;
  /** Points accrued while away, when the away time was worth mentioning. */
  offline: { ms: number; gained: number } | null;
}

export async function load(now: number): Promise<LoadResult> {
  let raw: string | null = null;
  const h = host();
  if (h) {
    try {
      const res = await h.get(SAVE_KEY);
      raw = res?.value ?? null;
    } catch {
      raw = null; // Missing key throws in the artifact host. A fresh game, then.
    }
  } else {
    raw = memoryFallback;
  }
  if (raw === null) {
    return { state: initialState(now), offline: null };
  }
  let state: GameState;
  try {
    state = reviveState(raw, now);
  } catch {
    return { state: initialState(now), offline: null };
  }
  const awayMs = Math.max(0, now - state.lastSeen);
  const creditedMs = Math.min(awayMs, OFFLINE_CAP_MS);
  const gained = pointsPerSecond(state) * (creditedMs / 1000);
  state = {
    ...state,
    points: state.points + gained,
    runEarned: state.runEarned + gained,
    everEarned: state.everEarned + gained,
    lastSeen: now,
  };
  const worthMentioning = awayMs >= OFFLINE_MIN_MS && gained >= 1;
  return {
    state,
    offline: worthMentioning ? { ms: creditedMs, gained } : null,
  };
}
