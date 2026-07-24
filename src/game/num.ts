import Decimal from "break_infinity.js";

export { Decimal };

/**
 * Big numbers, and deliberately only where they are needed.
 *
 * Decimal is a mantissa/exponent pair — roughly 2.5x slower than a float for
 * arithmetic. That is irrelevant at 10Hz over 8 tiers, but it is NOT irrelevant
 * in the rAF loop, so the split matters:
 *
 * DECIMAL — quantities with no ceiling:
 *   score, runScore, held count, tier price, throughput, liquidation,
 *   bestRun, totalScore.
 *
 * NATIVE — quantities that are bounded by construction, and stay fast:
 *   phase (0..1), period (basePeriod / (1+levels)), unit value (milestoneMult
 *   ^ level, and level is log2 of hand-bought so it stays small), tableau
 *   levels, hand-bought counts, pool weights, pick thresholds.
 *
 * Held count is the one that surprises people: it is produced, not bought, and
 * the chain is hyperexponential, so it outruns float64 long before anything a
 * player types does.
 */
export type Num = Decimal;

/**
 * Coerce anything savable into a Decimal. Strings come from saves.
 *
 * Only NaN becomes zero. Infinity is deliberately passed through so that
 * `clampState` can pin it to NUM_CLAMP — a save that overflowed under the old
 * float economy should come back pinned at the ceiling, not wiped to nothing.
 */
export function D(v: Decimal | number | string | null | undefined): Decimal {
  if (v instanceof Decimal) return v;
  if (v === null || v === undefined) return new Decimal(0);
  if (typeof v === "number") return Number.isNaN(v) ? new Decimal(0) : new Decimal(v);
  const d = new Decimal(v);
  return Number.isNaN(d.mantissa) ? new Decimal(0) : d;
}

export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

/**
 * break_infinity has no isNaN/isFinite methods (that is decimal.js). It stores
 * a mantissa/exponent pair: NaN poisons both, and Infinity is pinned at the
 * library's own ceiling exponent. Guard on the representation.
 */
const INF_EXPONENT = 9e15;

export function isNanD(v: Decimal): boolean {
  return Number.isNaN(v.mantissa) || Number.isNaN(v.exponent);
}

export function isFiniteD(v: Decimal): boolean {
  return !isNanD(v) && v.exponent < INF_EXPONENT;
}

/**
 * Decimal -> number for the places that genuinely need a float: the renderer's
 * arc fraction, a ratio that is known to be small. Saturates rather than
 * returning Infinity, so a caller doing arithmetic on it cannot produce NaN.
 */
export function toNum(v: Decimal): number {
  const n = v.toNumber();
  return Number.isFinite(n) ? n : Number.MAX_VALUE;
}

/** Integer part, as a Decimal. Held units are whole: you can't hold 0.75. */
export function floorD(v: Decimal): Decimal {
  return v.floor();
}

/** Serialised form for saves. Round-trips exactly through D(). */
export function toSave(v: Decimal): string {
  return v.toString();
}
