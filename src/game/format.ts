import { D, Decimal, isFiniteD, isNanD } from "./num";

const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

type Numeric = Decimal | number;

/**
 * The instrument never lies, and that includes at scale: past the named
 * suffixes we switch to explicit scientific notation rather than inventing
 * names nobody agrees on. Raw content, rich chrome — a number is a number.
 */
export function fmt(n: Numeric): string {
  const d = D(n);
  if (isNanD(d)) return "0";
  if (!isFiniteD(d)) return "∞";
  if (d.lt(0)) return `-${fmt(d.neg())}`;
  if (d.lt(1e6)) return Math.floor(d.toNumber()).toLocaleString("en-US");

  const exp = d.exponent;
  const bucket = Math.floor(exp / 3);
  if (bucket < SUFFIXES.length) {
    const v = d.div(Decimal.pow(10, bucket * 3)).toNumber();
    return `${v.toFixed(2)}${SUFFIXES[bucket]}`;
  }
  // e-notation, mantissa to 2dp: 1.23e1234
  return `${d.mantissa.toFixed(2)}e${exp}`;
}

/** Exact small values: 1.75 shows as 1.75, never floored to 1. */
export function fmtVal(n: Numeric): string {
  const d = D(n);
  if (d.gte(1e6)) return fmt(d);
  const v = d.toNumber();
  if (!Number.isFinite(v)) return fmt(d);
  if (Number.isInteger(v)) return v.toLocaleString("en-US");
  return v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function fmtRate(n: Numeric): string {
  const d = D(n);
  if (d.gte(1000)) return fmt(d);
  const v = d.toNumber();
  if (!Number.isFinite(v)) return fmt(d);
  if (v > 0 && v < 1) return v.toFixed(2).replace(/0$/, "");
  return v.toFixed(1);
}

export function fmtDuration(ms: number): string {
  if (!isFinite(ms) || ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}
