import { BANK_CAP, BANK_MS, OFFLINE_MIN_MS, SAVE_KEY, TRICKLE_S, scenarioById } from "./constants";
import { clampState, prog, scoreRate } from "./logic";
import { freshState } from "./state";
import type { GameState, OfflineReport, ScenarioProgress, Stat, TierState } from "./types";

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

const posNum = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;

function reviveTier(raw: unknown): TierState {
  const t: TierState = { count: 0, bought: 0, phase: 0, cycles: 0 };
  if (typeof raw !== "object" || raw === null) return t;
  const r = raw as Record<string, unknown>;
  t.count = posNum(r.count) ?? 0;
  t.bought = Math.floor(posNum(r.bought) ?? 0);
  const ph = posNum(r.phase) ?? 0;
  t.phase = ph < 1 ? ph : 0;
  t.cycles = posNum(r.cycles) ?? 0;
  return t;
}

function reviveProgress(raw: unknown, tierCount: number): ScenarioProgress {
  const p: ScenarioProgress = {
    tableau: {}, hotstart: 0, flywheel: false, resets: 0, picks: 0,
    bestRun: 0, totalScore: 0, beaten: false,
    everBought: Array.from({ length: tierCount }, () => 0),
  };
  if (typeof raw !== "object" || raw === null) return p;
  const r = raw as Record<string, unknown>;
  p.hotstart = posNum(r.hotstart) ?? 0;
  p.flywheel = r.flywheel === true;
  p.resets = posNum(r.resets) ?? 0;
  p.picks = Math.floor(posNum(r.picks) ?? 0);
  p.bestRun = posNum(r.bestRun) ?? 0;
  p.totalScore = posNum(r.totalScore) ?? 0;
  p.beaten = r.beaten === true;
  if (Array.isArray(r.everBought)) {
    for (let i = 0; i < tierCount; i++) p.everBought[i] = Math.floor(posNum(r.everBought[i]) ?? 0);
  }
  if (typeof r.tableau === "object" && r.tableau !== null) {
    for (const [k, row] of Object.entries(r.tableau as Record<string, unknown>)) {
      const tier = Number(k);
      if (!Number.isInteger(tier) || typeof row !== "object" || row === null) continue;
      const rr = row as Record<string, unknown>;
      const out: Record<Stat, number> = { val: 0, spd: 0, cst: 0 };
      for (const stat of ["val", "spd", "cst"] as const) {
        const v = posNum(rr[stat]);
        if (v !== null) out[stat] = Math.floor(v);
      }
      p.tableau[tier] = out;
    }
  }
  return p;
}

function reviveState(raw: unknown): GameState {
  const s = freshState();
  if (typeof raw !== "object" || raw === null) return s;
  const r = raw as Record<string, unknown>;
  if (typeof r.scenario === "string") s.scenario = r.scenario;
  const def = scenarioById(s.scenario);
  s.scenario = def.id;
  s.score = posNum(r.score) ?? s.score;
  s.runScore = posNum(r.runScore) ?? 0;
  s.bankedDraws = Math.min(BANK_CAP, Math.floor(posNum(r.bankedDraws) ?? 0));
  s.startedAt = posNum(r.startedAt) ?? s.startedAt;
  s.lastSeen = posNum(r.lastSeen) ?? 0;
  s.runStartedAt = posNum(r.runStartedAt) ?? s.startedAt;
  s.tiers = def.tiers.map((_, i) => reviveTier(Array.isArray(r.tiers) ? r.tiers[i] : null));
  if (typeof r.progress === "object" && r.progress !== null) {
    for (const [id, p] of Object.entries(r.progress as Record<string, unknown>)) {
      s.progress[id] = reviveProgress(p, scenarioById(id).tiers.length);
    }
  }
  if (typeof r.pool === "object" && r.pool !== null) {
    for (const [k, row] of Object.entries(r.pool as Record<string, unknown>)) {
      const tier = Number(k);
      if (!Number.isInteger(tier) || typeof row !== "object" || row === null) continue;
      const rr = row as Record<string, unknown>;
      s.pool[tier] = {
        val: posNum(rr.val) ?? 0,
        spd: posNum(rr.spd) ?? 0,
        cst: posNum(rr.cst) ?? 0,
      };
    }
  }
  clampState(s);
  return s;
}

export async function persist(s: GameState): Promise<void> {
  s.lastSeen = Date.now();
  try { await backend().set(SAVE_KEY, JSON.stringify(s)); } catch { /* best effort */ }
}

export async function eraseSave(): Promise<void> {
  try { await backend().delete(SAVE_KEY); } catch { /* best effort */ }
}

/**
 * Away time is preparation, not production: it banks bonus draw options and
 * advances wheel phases, plus a token trickle of score. Decisions don't happen
 * while nobody is deciding.
 */
export function applyOffline(s: GameState, awayMs: number): OfflineReport {
  const before = s.bankedDraws;
  s.bankedDraws = Math.min(BANK_CAP, s.bankedDraws + Math.floor(awayMs / BANK_MS));
  const trickle = scoreRate(s) * TRICKLE_S;
  s.score += trickle;
  s.runScore += trickle;
  if (trickle > 0) prog(s).totalScore += trickle;
  for (let i = 0; i < s.tiers.length; i++) {
    const st = s.tiers[i];
    if (!st) continue;
    const T = scenarioById(s.scenario).tiers[i]?.basePeriod ?? 1;
    st.phase = (st.phase + (awayMs / 1000) / T) % 1;
  }
  clampState(s);
  return { awayMs, bankedGained: s.bankedDraws - before, trickle };
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
    if (report.bankedGained > 0 || report.trickle >= 1) offline = report;
  }
  state.lastSeen = now;
  return { state, offline };
}
