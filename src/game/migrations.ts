/**
 * Save migrations: a save is walked v -> v+1 until it is current, and written
 * back at its new version BEFORE anything else reads it.
 *
 * The point is that no other code in the codebase ever thinks about old saves.
 * `reviveState` assumes the latest shape, unconditionally. When the shape
 * changes, you add ONE step here and stop caring — rather than sprinkling
 * "or the old key" fallbacks through the revive path, which is what this
 * replaces and what was already starting to rot.
 *
 * Rules for a step:
 *  - It takes raw parsed JSON and returns raw parsed JSON. No Decimals, no
 *    GameState — those are the revive layer's job.
 *  - It is total: it must not throw on a partial, hand-edited, or already-half
 *    -broken save. Anything unrecognisable is left for revive to default.
 *  - It is never edited again once shipped. Write a new step instead; players
 *    hold saves at every version you have ever released.
 */

export const SAVE_VERSION = 3;

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * v1 -> v2: stats were abbreviated val/spd/cst and are now spelled out.
 * Applies to both the per-scenario tableau and the per-run pool.
 */
function v1_to_v2(raw: Raw): Raw {
  const RENAME: Array<[string, string]> = [["val", "value"], ["spd", "speed"], ["cst", "cost"]];

  const renameRow = (row: unknown): unknown => {
    if (!isObj(row)) return row;
    const out: Raw = { ...row };
    for (const [from, to] of RENAME) {
      if (from in out) {
        if (!(to in out)) out[to] = out[from];
        delete out[from];
      }
    }
    return out;
  };

  const renameByTier = (byTier: unknown): unknown => {
    if (!isObj(byTier)) return byTier;
    const out: Raw = {};
    for (const [tier, row] of Object.entries(byTier)) out[tier] = renameRow(row);
    return out;
  };

  if (isObj(raw.progress)) {
    const progress: Raw = {};
    for (const [id, p] of Object.entries(raw.progress)) {
      progress[id] = isObj(p) ? { ...p, tableau: renameByTier(p.tableau) } : p;
    }
    raw.progress = progress;
  }
  raw.pool = renameByTier(raw.pool);
  return raw;
}

/**
 * v2 -> v3: quantities with no ceiling became Decimals, which serialise as
 * strings. Numbers still parse, but normalising here means revive has exactly
 * one shape to think about.
 */
function v2_to_v3(raw: Raw): Raw {
  const toStr = (v: unknown): unknown =>
    typeof v === "number" && Number.isFinite(v) ? String(v) : v;

  raw.score = toStr(raw.score);
  raw.runScore = toStr(raw.runScore);

  if (Array.isArray(raw.tiers)) {
    raw.tiers = raw.tiers.map((t) => (isObj(t) ? { ...t, count: toStr(t.count) } : t));
  }

  if (isObj(raw.progress)) {
    const progress: Raw = {};
    for (const [id, p] of Object.entries(raw.progress)) {
      progress[id] = isObj(p)
        ? { ...p, bestRun: toStr(p.bestRun), totalScore: toStr(p.totalScore) }
        : p;
    }
    raw.progress = progress;
  }
  return raw;
}

/** Indexed by the version being migrated FROM. */
const STEPS: Record<number, (raw: Raw) => Raw> = {
  1: v1_to_v2,
  2: v2_to_v3,
};

/**
 * Saves predate versioning, so an absent version is v1 — the original shape.
 * A version from the future is left alone: refusing to guess is safer than
 * running steps that were written for a shape we have never seen.
 */
export function saveVersion(raw: unknown): number {
  if (!isObj(raw)) return SAVE_VERSION;
  const v = raw.version;
  return typeof v === "number" && Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1;
}

export interface MigrationResult {
  raw: unknown;
  from: number;
  to: number;
  changed: boolean;
}

/** Walk a raw save up to SAVE_VERSION. Total: never throws on bad input. */
export function migrateSave(input: unknown): MigrationResult {
  const from = saveVersion(input);
  if (!isObj(input)) return { raw: input, from, to: from, changed: false };

  let raw: Raw = { ...input };
  let v = from;
  while (v < SAVE_VERSION) {
    const step = STEPS[v];
    if (!step) break; // a gap means we cannot safely continue; revive defaults it
    try {
      raw = step(raw);
    } catch {
      break; // a step that cannot cope leaves the save where it is
    }
    v += 1;
  }
  raw.version = v;
  return { raw, from, to: v, changed: v !== from };
}
