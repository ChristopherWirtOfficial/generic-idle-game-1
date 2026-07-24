// v3 pacing: greedy player against the cycle/pool/tableau model.
// Usage: node scripts/pacing-sim.mjs [hours] [resetPolicy: 1|2|3]
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

function autoPick(offer) {
  // Veteran instinct: speed tier 0 until sub-second, then value tier 0, then deepest value, else best rarity.
  const p = C.prog(s);
  const period0 = C.period(s, 0);
  const by = (pred) => offer.cards.filter(pred).sort((a, b) => b.levels - a.levels)[0];
  let pick =
    (period0 > 1 && by((c) => c.kind === "stat" && c.tier === 0 && c.stat === "spd")) ||
    by((c) => c.kind === "stat" && c.tier === 0 && c.stat === "val") ||
    by((c) => c.kind === "hotstart") ||
    by((c) => c.kind === "stat" && c.stat === "val") ||
    by((c) => c.kind === "stat") ||
    offer.cards[0];
  return pick;
}

function buyPass() {
  const vis = C.visibleTiers(s);
  for (let i = vis - 1; i >= 0; i--) {
    let guard = 0;
    while (guard++ < 500 && C.buyTier(s, i, 1)) {
      const next = i + 1 < vis ? C.tierCost(s, i + 1, 1) : Infinity;
      if (Number.isFinite(next) && s.score > next * 0.4) break; // save toward deeper
    }
  }
}

const seenTier = new Set();
for (let t = 0; t < HOURS * 3600; t++) {
  C.step(s, 1);
  buyPass();
  for (let i = 0; i < s.tiers.length; i++) {
    if (!seenTier.has(i) && s.tiers[i].bought > 0) {
      seenTier.add(i);
      log.push([t, `FIRST buy tier ${i + 1} (run ${resets + 1})`]);
    }
  }
  const liq = C.liquidationValue(s);
  const finalRun = s.runScore + liq;
  const picks = C.picksFor(s, finalRun);
  // Alternate like a veteran: mostly chain shallow, but every 25th reset is a
  // deliberate push (hold out for 2 picks, or 3 once the tableau is thick).
  const pushing = resets > 0 && resets % 25 === 24;
  const want = pushing ? Math.min(3, 1 + Math.floor(C.prog(s).picks / 60)) : RESET_AT_PICKS;
  if (picks >= want || (picks >= 1 && t - lastResetT > 40 * 60)) {
    if (firstPickT === null) { firstPickT = t; log.push([t, `first reset ready: run ${s.runScore.toExponential(2)} + liq ${liq.toExponential(2)}, picks ${picks}`]); }
    const offer = C.rollDraw(s, rand);
    for (let k = 0; k < offer.picks; k++) {
      const card = autoPick(offer);
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
  if (t % 1800 === 0 && t > 0) {
    const p = C.prog(s);
    const t0m = p.tableau[0] ?? { val: 0, spd: 0, cst: 0 };
    log.push([t, `--- resets ${resets}, picks ${picksTaken}, t0 L[s${t0m.spd} v${t0m.val} c${t0m.cst}], best ${C.prog(s).bestRun.toExponential(1)}, period0 ${C.period(s, 0).toFixed(2)}s, thresh1 ${C.pickThresholds(s)[0].toExponential(1)}, deepest ${Math.max(0, ...[...seenTier]) + 1}`]);
  }
}
const late = resetDurations.slice(-8);
log.push([HOURS * 3600, `reset cadence last 8: ${late.map((d) => d + "s").join(", ")}`]);
for (const [t, msg] of log) {
  console.log(`${String(Math.floor(t / 60)).padStart(3)}m${String(t % 60).padStart(2, "0")}s  ${msg}`);
}
