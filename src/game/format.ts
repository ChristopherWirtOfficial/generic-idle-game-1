const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

/** Whole-number grouping under a million, suffixes after, scientific past Dc. */
export function fmt(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + fmt(-n);
  if (n < 1e6) {
    const whole = Math.floor(n);
    return whole.toLocaleString("en-US");
  }
  const tier = Math.min(Math.floor(Math.log10(n) / 3), SUFFIXES.length - 1);
  const suffix = SUFFIXES[tier];
  if (tier >= SUFFIXES.length - 1 && n >= Math.pow(10, SUFFIXES.length * 3)) {
    return n.toExponential(2).replace("+", "");
  }
  const scaled = n / Math.pow(10, tier * 3);
  const decimals = scaled >= 100 ? 1 : 2;
  return scaled.toFixed(decimals) + suffix;
}

/** Rates keep one decimal below 1000 so early progress is visible. */
export function fmtRate(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n > 0 && n < 1) {
    return n.toFixed(2).replace(/0$/, "");
  }
  if (n < 1000) {
    return n.toFixed(1);
  }
  return fmt(n);
}

export function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
