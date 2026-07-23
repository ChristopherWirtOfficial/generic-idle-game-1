import { OFFLINE_CAP_MS, OFFLINE_MIN_MS, OFFLINE_SIM_STEPS, SAVE_KEY, TIERS } from "./constants";
import { step } from "./logic";
import { freshState } from "./state";
import type { GameState, OfflineReport } from "./types";

interface StorageLike {
  get(key: string): Promise<{ value: string } | null>;
  set(key: string, value: string): Promise<unknown>;
  delete(key: string): Promise<unknown>;
}

const memory = new Map<string, string>();
const memoryStorage: StorageLike = {
  async get(k) { const v = memory.get(k); return v === undefined ? null : { value: v }; },
  async set(k, v) { memory.set(k, v); return null; },
  async delete(k) { memory.delete(k); return null; },
};

function backend(): StorageLike {
  const w = globalThis as { storage?: StorageLike };
  if (typeof w.storage?.get === "function") return w.storage;
  return memoryStorage;
}

function reviveState(raw: unknown): GameState {
  const s = freshState();
  if (typeof raw !== "object" || raw === null) return s;
  const r = raw as Record<string, unknown>;
  const num = (k: keyof GameState) => {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) (s[k] as number) = v;
  };
  num("dust"); num("lifetimeDust"); num("runDust"); num("singularities");
  num("crunches"); num("presses"); num("startedAt"); num("lastSeen");
  if (Array.isArray(r.tiers)) {
    for (let i = 0; i < TIERS.length; i++) {
      const t = r.tiers[i] as Record<string, unknown> | undefined;
      const st = s.tiers[i];
      if (!t || !st) continue;
      if (typeof t.count === "number" && Number.isFinite(t.count) && t.count >= 0) st.count = t.count;
      if (typeof t.bought === "number" && Number.isFinite(t.bought) && t.bought >= 0) st.bought = Math.floor(t.bought);
    }
  }
  if (Array.isArray(r.upgrades)) s.upgrades = r.upgrades.filter((x): x is string => typeof x === "string");
  if (Array.isArray(r.achievements)) s.achievements = r.achievements.filter((x): x is string => typeof x === "string");
  return s;
}

export async function persist(s: GameState): Promise<void> {
  s.lastSeen = Date.now();
  try { await backend().set(SAVE_KEY, JSON.stringify(s)); } catch { /* best effort */ }
}

export async function eraseSave(): Promise<void> {
  try { await backend().delete(SAVE_KEY); } catch { /* best effort */ }
}

/** Simulate time away in coarse steps — chained production is polynomial, so a single multiply would undercredit. */
export function applyOffline(s: GameState, awayMs: number): OfflineReport {
  const creditedMs = Math.min(Math.max(0, awayMs), OFFLINE_CAP_MS);
  const before = s.dust;
  const dt = creditedMs / 1000 / OFFLINE_SIM_STEPS;
  for (let i = 0; i < OFFLINE_SIM_STEPS; i++) step(s, dt);
  return { awayMs, creditedMs, dustGained: s.dust - before };
}

export async function loadGame(now = Date.now()): Promise<{ state: GameState; offline: OfflineReport | null }> {
  let state = freshState(now);
  try {
    const found = await backend().get(SAVE_KEY);
    if (found?.value) state = reviveState(JSON.parse(found.value));
  } catch { /* fresh */ }
  let offline: OfflineReport | null = null;
  const away = now - state.lastSeen;
  if (state.lastSeen > 0 && away >= OFFLINE_MIN_MS) {
    const report = applyOffline(state, away);
    if (report.dustGained >= 1) offline = report;
  }
  state.lastSeen = now;
  return { state, offline };
}
