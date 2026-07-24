const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

export function fmt(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n < 0) return `-${fmt(-n)}`;
  if (n < 1e6) {
    const r = Math.floor(n);
    return r.toLocaleString("en-US");
  }
  const exp = Math.floor(Math.log10(n));
  const bucket = Math.floor(exp / 3);
  if (bucket < SUFFIXES.length) {
    const v = n / Math.pow(10, bucket * 3);
    return `${v.toFixed(2)}${SUFFIXES[bucket]}`;
  }
  return n.toExponential(2).replace("+", "");
}

/** Exact small values: 1.75 shows as 1.75, never floored to 1. */
export function fmtVal(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n >= 1e6) return fmt(n);
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function fmtRate(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n > 0 && n < 1) return n.toFixed(2).replace(/0$/, "");
  if (n < 1000) return n.toFixed(1);
  return fmt(n);
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
