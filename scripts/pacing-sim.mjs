// v3 pacing: greedy player against the cycle/pool/tableau model.
// Usage: node scripts/pacing-sim.mjs [hours] [resetPolicy: 1|2|3] [scenario]
//
// Beyond the pacing timeline this prints the DRAW INSTRUMENTATION: what the
// pool actually offered, phase by phase. A distribution you cannot see is a
// distribution you cannot tune, and every complaint about draws ("I only ever
// get tier 1", "I never see value") is a claim about these tables.
import { execSync } from "node:child_process";
execSync("npx esbuild scripts/sim-core.ts --bundle --outfile=.simtmp/core.js --format=esm --platform=node --log-level=error");
const C = await import("../.simtmp/core.js");

const HOURS = Number(process.argv[2] ?? 3);
const RESET_AT_PICKS = Number(process.argv[3] ?? 1);

let seed = 12345;
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

const s = C.freshState(0);
const SCEN = process.argv[4];
if (SCEN) C.switchScenario(s, SCEN, 0);
const log = [];
let resets = 0, picksTaken = 0, lastResetT = 0, firstPickT = null;
const resetDurations = [];

// ---------- draw instrumentation ----------
const STATS = ["value", "speed", "cost"];
const PHASES = [
  { name: "0-10m", lo: 0, hi: 600 },
  { name: "10-30m", lo: 600, hi: 1800 },
  { name: "30-60m", lo: 1800, hi: 3600 },
  { name: "1-2h", lo: 3600, hi: 7200 },
  { name: "2h+", lo: 7200, hi: Infinity },
];
/** One record per rollDraw: the odds it rolled against and what came out. */
const draws = [];
/** Pre-shaping effective weight per known (tier,stat) — the signal, before mapping. */
const slotsOf = C.poolSlots ? (st) => C.poolSlots(st) : (st) => C.poolEntries(st).map((e) => ({ ...e, w: e.w }));
const key = (t, st) => `${t}|${st}`;

function autoPick(offer) {
  // Veteran instinct: speed tier 0 until sub-second, then value tier 0, then deepest value, else best rarity.
  const period0 = C.period(s, 0);
  const by = (pred) => offer.cards.filter(pred).sort((a, b) => b.levels - a.levels)[0];
  const want = [
    ["t1 speed", () => period0 > 1 && by((c) => c.kind === "stat" && c.tier === 0 && c.stat === "speed")],
    ["t1 value", () => by((c) => c.kind === "stat" && c.tier === 0 && c.stat === "value")],
    ["hotstart", () => by((c) => c.kind === "hotstart")],
    ["any value", () => by((c) => c.kind === "stat" && c.stat === "value")],
    ["any stat", () => by((c) => c.kind === "stat")],
    ["whatever", () => offer.cards[0]],
  ];
  for (const [rank, get] of want) {
    const hit = get();
    if (hit) return { card: hit, rank };
  }
  return { card: offer.cards[0], rank: "whatever" };
}

/** Decimal has no toExponential; build it from mantissa/exponent. */
function fmtE(d) {
  const m = d.mantissa, e = d.exponent;
  if (!Number.isFinite(m) || !Number.isFinite(e)) return String(d);
  return `${m.toFixed(2)}e+${e}`;
}

function buyPass() {
  const vis = C.visibleTiers(s);
  for (let i = vis - 1; i >= 0; i--) {
    let guard = 0;
    while (guard++ < 500 && C.buyTier(s, i, 1)) {
      const next = i + 1 < vis ? C.tierCost(s, i + 1, 1) : null;
      // Decimal: Number.isFinite() on one is always false, which silently
      // disabled this guard and made the greedy player dump into tier 1.
      if (next && C.isFiniteD(next) && s.score.gt(next.times(0.4))) break; // save toward deeper
    }
  }
}

const seenTier = new Set();
const seenTierT = new Map();
const checkpoints = [];
let nextReport = 1800;
let beatenT = null;
let earlyBuys = 0;
for (let t = 0; t < HOURS * 3600; t++) {
  C.step(s, 1);
  buyPass();
  if (t < 180 && s.tiers[0].bought > earlyBuys) {
    log.push([t, `buy #${s.tiers[0].bought} of tier 1`]);
    earlyBuys = s.tiers[0].bought;
  }
  for (let i = 0; i < s.tiers.length; i++) {
    if (!seenTier.has(i) && s.tiers[i].bought > 0) {
      seenTier.add(i);
      seenTierT.set(i, t);
      log.push([t, `FIRST buy tier ${i + 1} (run ${resets + 1})`]);
    }
  }
  if (beatenT === null && C.prog(s).beaten) { beatenT = t; log.push([t, `GOAL ${C.scen(s).goal.toExponential(0)} reached in a single run`]); }
  const liq = C.liquidationValue(s);
  const finalRun = s.runScore.plus(liq);
  const picks = C.picksFor(s, finalRun);
  // Alternate like a veteran: mostly chain shallow, but every 25th reset is a
  // deliberate push (hold out for 2 picks, or 3 once the tableau is thick).
  const pushing = resets > 0 && resets % 25 === 24;
  const want = pushing ? Math.min(3, 1 + Math.floor(C.prog(s).picks / 60)) : RESET_AT_PICKS;
  if (picks >= want || (picks >= 1 && t - lastResetT > 40 * 60)) {
    if (firstPickT === null) { firstPickT = t; log.push([t, `first reset ready: run ${fmtE(s.runScore)} + liq ${fmtE(liq)}, picks ${picks}`]); }
    const slots = slotsOf(s).map((e) => ({ tier: e.tier, stat: e.stat, w: e.w, damp: e.damp ?? 1 }));
    const offer = C.rollDraw(s, rand);
    const rec = { t, slots, offered: offer.cards.map((c) => ({ kind: c.kind, tier: c.tier, stat: c.stat })), ranks: [] };
    draws.push(rec);
    for (let k = 0; k < offer.picks; k++) {
      const { card, rank } = autoPick(offer);
      rec.ranks.push(rank);
      C.applyPick(s, card);
      offer.cards.splice(offer.cards.indexOf(card), 1);
      picksTaken++;
    }
    C.doReset(s, t * 1000);
    resets++;
    resetDurations.push(t - lastResetT);
    t += 6; // human ceremony: reveal + choose
    lastResetT = t;
  }
  // Watermark, not `t % 1800`: the ceremony skip (`t += 6`) steps straight over
  // an exact multiple once runs get short, which silently dropped every
  // checkpoint from the log the moment the cadence tightened.
  if (t >= nextReport) {
    while (nextReport <= t) nextReport += 1800;
    const p = C.prog(s);
    const t0m = p.tableau[0] ?? { value: 0, speed: 0, cost: 0 };
    const line = `--- resets ${resets}, picks ${picksTaken}, t0 L[s${t0m.speed} v${t0m.value} c${t0m.cost}], best ${fmtE(p.bestRun)}, period0 ${C.period(s, 0).toFixed(2)}s, thresh1 ${C.pickThresholds(s)[0].toExponential(1)}, deepest ${Math.max(0, ...[...seenTier]) + 1}`;
    log.push([t, line]);
    checkpoints.push([t, line]);
  }
}
const late = resetDurations.slice(-8);
log.push([HOURS * 3600, `reset cadence last 8: ${late.map((d) => d + "s").join(", ")}`]);
const clock = (t) => `${String(Math.floor(t / 60)).padStart(3)}m${String(t % 60).padStart(2, "0")}s`;
for (const [t, msg] of log) console.log(`${clock(t)}  ${msg}`);

// The five lines the owner actually compares builds on, in one place.
console.log("\n=== HEADLINE ===");
console.log(`first reset ${clock(firstPickT ?? 0)}`);
console.log(`goal ${C.scen(s).goal.toExponential(0)} ${beatenT === null ? "not reached" : `reached ${clock(beatenT)}`}`);
for (const i of [...seenTierT.keys()].sort((a, b) => a - b)) {
  if (i > 0) console.log(`tier ${i + 1} first bought ${clock(seenTierT.get(i))}`);
}
for (const [t, line] of checkpoints) if (t <= 3700) console.log(`${clock(t)} ${line.slice(4)}`);

// ---------- tables ----------
const activePhases = PHASES.filter((ph) => draws.some((d) => d.t >= ph.lo && d.t < ph.hi));
const maxTier = Math.max(0, ...draws.flatMap((d) => d.offered.filter((c) => c.kind === "stat").map((c) => c.tier)));
const lines = [];
for (let i = 0; i <= maxTier; i++) for (const st of STATS) lines.push([i, st]);

function pct(x) { return `${(x * 100).toFixed(1)}%`; }
function pad(x, n) { return String(x).padStart(n); }
function rule(w) { return "-".repeat(w); }

function table(title, note, rowLabel, rows) {
  const w0 = Math.max(rowLabel.length, ...rows.map((r) => r[0].length)) + 1;
  const head = pad(rowLabel, w0) + activePhases.map((p) => pad(p.name, 9)).join("");
  console.log(`\n=== ${title} ===`);
  if (note) console.log(note);
  console.log(head);
  console.log(rule(head.length));
  for (const r of rows) console.log(pad(r[0], w0) + r[1].map((v) => pad(v, 9)).join(""));
}

// 1. share of the stat cards offered
{
  const rows = [];
  const counts = activePhases.map((ph) => {
    const m = new Map(); let n = 0;
    for (const d of draws) {
      if (d.t < ph.lo || d.t >= ph.hi) continue;
      for (const c of d.offered) { if (c.kind !== "stat") continue; m.set(key(c.tier, c.stat), (m.get(key(c.tier, c.stat)) ?? 0) + 1); n++; }
    }
    return { m, n };
  });
  for (const [i, st] of lines) {
    const vals = counts.map(({ m, n }) => (n ? pct((m.get(key(i, st)) ?? 0) / n) : "-"));
    if (vals.every((v) => v === "0.0%" || v === "-")) continue;
    rows.push([`t${i + 1} ${st}`, vals]);
  }
  rows.push(["", activePhases.map(() => "")]);
  for (let i = 0; i <= maxTier; i++) {
    const vals = counts.map(({ m, n }) => (n ? pct(STATS.reduce((a, st) => a + (m.get(key(i, st)) ?? 0), 0) / n) : "-"));
    rows.push([`TIER ${i + 1}`, vals]);
  }
  table("OFFER SHARE", "share of all stat cards offered in the phase", "line", rows);
}

// 2. how often a line shows up in a hand at all — the felt version of the same thing
{
  const rows = [];
  const counts = activePhases.map((ph) => {
    const m = new Map(); let n = 0;
    for (const d of draws) {
      if (d.t < ph.lo || d.t >= ph.hi) continue;
      n++;
      const seen = new Set(d.offered.filter((c) => c.kind === "stat").map((c) => key(c.tier, c.stat)));
      for (const k of seen) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return { m, n };
  });
  for (const [i, st] of lines) {
    const vals = counts.map(({ m, n }) => (n ? pct((m.get(key(i, st)) ?? 0) / n) : "-"));
    if (vals.every((v) => v === "0.0%" || v === "-")) continue;
    rows.push([`t${i + 1} ${st}`, vals]);
  }
  table("HAND PRESENCE", "% of hands containing this line at least once", "line", rows);
}

// 3. is a hand a real choice?
{
  const stat = activePhases.map((ph) => {
    const d = draws.filter((x) => x.t >= ph.lo && x.t < ph.hi);
    const n = d.length || 1;
    let cards = 0, distinct = 0, dupHands = 0, multiTier = 0, multiStat = 0;
    for (const x of d) {
      const sc = x.offered.filter((c) => c.kind === "stat");
      const uniq = new Set(sc.map((c) => key(c.tier, c.stat)));
      cards += sc.length; distinct += uniq.size;
      if (uniq.size < sc.length) dupHands++;
      if (new Set(sc.map((c) => c.tier)).size >= 2) multiTier++;
      if (new Set(sc.map((c) => c.stat)).size >= 2) multiStat++;
    }
    return { hands: d.length, cards: cards / n, distinct: distinct / n, waste: cards ? 1 - distinct / cards : 0, dup: dupHands / n, multiTier: multiTier / n, multiStat: multiStat / n };
  });
  table("HAND QUALITY", "a hand is only a choice if the cards differ", "metric", [
    ["hands", stat.map((x) => x.hands)],
    ["cards/hand", stat.map((x) => x.cards.toFixed(2))],
    ["distinct/hand", stat.map((x) => x.distinct.toFixed(2))],
    ["wasted cards", stat.map((x) => pct(x.waste))],
    ["hands w/ a dup", stat.map((x) => pct(x.dup))],
    ["hands >=2 tiers", stat.map((x) => pct(x.multiTier))],
    ["hands >=2 stats", stat.map((x) => pct(x.multiStat))],
  ]);
}

// 4. what the greedy player actually settled for
{
  const RANKS = ["t1 speed", "t1 value", "hotstart", "any value", "any stat", "whatever"];
  const stat = activePhases.map((ph) => {
    const r = draws.filter((x) => x.t >= ph.lo && x.t < ph.hi).flatMap((x) => x.ranks);
    const n = r.length || 1;
    const m = new Map();
    for (const x of r) m.set(x, (m.get(x) ?? 0) + 1);
    return { n: r.length, m };
  });
  table("PICK SATISFACTION", "which preference the veteran's pick came from", "got", [
    ...RANKS.map((k) => [k, stat.map((x) => (x.n ? pct((x.m.get(k) ?? 0) / x.n) : "-"))]),
    ["picks", stat.map((x) => x.n)],
  ]);
}

// 5. knob sweeps: replay the SAME captured pools through the shaping function
//    at other settings. Identical signal, different mapping — the whole bet in
//    one table. This calls the shipped shapeWeights, never a re-derivation.
if (C.shapeWeights) {
  const shareFor = (ph, pred, alpha, floor, cap) => {
    let acc = 0, n = 0;
    for (const d of draws) {
      if (d.t < ph.lo || d.t >= ph.hi || d.slots.length === 0) continue;
      const p = C.shapeWeights(d.slots.map((e) => e.w), alpha, floor, cap, d.slots.map((e) => e.damp ?? 1));
      acc += d.slots.reduce((a, e, k) => a + (pred(e) ? p[k] : 0), 0);
      n++;
    }
    return n ? acc / n : null;
  };
  const PROBES = [
    ["tier 1 (all stats)", (e) => e.tier === 0],
    ["t1 value only", (e) => e.tier === 0 && e.stat === "value"],
    ["all value stats", (e) => e.stat === "value"],
    ["all speed stats", (e) => e.stat === "speed"],
    ["all cost stats", (e) => e.stat === "cost"],
  ];
  const sweep = (title, note, settings) => {
    const rows = [];
    for (const [label, pred] of PROBES) {
      rows.push([label, activePhases.map(() => "")]);
      for (const [name, a, f, c] of settings) {
        rows.push([`  ${name}`, activePhases.map((ph) => {
          const v = shareFor(ph, pred, a, f, c);
          return v === null ? "-" : pct(v);
        })]);
      }
    }
    table(title, note, "", rows);
  };
  const F = C.POOL_FLOOR, A = C.POOL_ALPHA, K = C.POOL_CAP;
  const ALPHAS = [1, 0.8, 0.6, 0.5, 0.45, 0.35, 0.25];
  // Both rails are quoted in EVEN SPLITS, so "off" for the cap is a big
  // multiple, not 1 — a cap of one even split IS the uniform distribution.
  const OFF = 999;
  // The exponent ALONE, floor and cap switched off, so nothing else is
  // answering for it. This is the direct answer to "what does alpha do".
  sweep("ALPHA SWEEP · bare", "per-card odds from the exponent alone (floor 0, cap off)",
    ALPHAS.map((a) => [`alpha ${a.toFixed(2)}${a === A ? " *" : ""}`, a, 0, OFF]));
  sweep("ALPHA SWEEP · shipped", `per-card odds at other exponents (floor ${F}, cap ${K} held)`,
    ALPHAS.map((a) => [`alpha ${a.toFixed(2)}${a === A ? " *" : ""}`, a, F, K]));
  sweep("FLOOR/CAP SWEEP", `per-card odds at other rails, in even splits (alpha ${A} held)`, [
    ["floor 0.00 cap off ", A, 0, OFF],
    ["floor 0.25 cap off ", A, 0.25, OFF],
    ["floor 0.50 cap off ", A, 0.5, OFF],
    ["floor 0.00 cap 2.2 ", A, 0, 2.2],
    ["floor 0.15 cap 3.0 ", A, 0.15, 3],
    ["floor 0.25 cap 3.0 ", A, 0.25, 3],
    ["floor 0.25 cap 1.6 ", A, 0.25, 1.6],
    ["floor 0.45 cap 2.2 ", A, 0.45, 2.2],
    [`floor ${F} cap ${K} *`, A, F, K],
  ]);
}
