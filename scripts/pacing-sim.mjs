// Greedy-player pacing simulation: every second, buy the best thing affordable.
// "Best" heuristic: cheapest upgrade first, else highest tier affordable, else tier with best payback.
import { execSync } from "node:child_process";
execSync("npx esbuild scripts/sim-core.ts --bundle --outfile=.simtmp/core.js --format=esm --platform=node --log-level=error", { stdio: "inherit" });
const { TIERS, UPGRADES } = await import("../.simtmp/core.js");
const { freshState } = await import("../.simtmp/core.js");
const L = await import("../.simtmp/core.js");

const s = freshState(0);
const events = [];
const seenTier = new Set();
const seenUp = new Set();
let handBought = 0;
let lastReport = 0;

const HOURS = 6;
for (let t = 0; t < HOURS * 3600; t++) {
  // Press 3x/sec while pressing still matters (< 20% would be idle-only).
  const pv = L.pressValue(s);
  if (pv > L.dustPerSecond(s) * 0.1) { for (let k = 0; k < 3; k++) L.press(s); }
  L.step(s, 1);
  L.checkAchievements(s);

  // Buy upgrades greedily.
  for (const u of UPGRADES) {
    if (!seenUp.has(u.id) && L.buyUpgrade(s, u.id)) {
      seenUp.add(u.id);
      events.push([t, `upgrade ${u.name} (${u.cost})`]);
    }
  }
  // Buy highest affordable tier, else best cheap tier, one at a time.
  for (let i = TIERS.length - 1; i >= 0; i--) {
    while (L.buyTier(s, i, 1)) {
      handBought++;
      if (!seenTier.has(i)) {
        seenTier.add(i);
        events.push([t, `FIRST ${TIERS[i].name} — dust/s ${L.dustPerSecond(s).toExponential(2)}`]);
      }
      if (i < TIERS.length - 1 && s.dust > L.tierCost(s, i + 1, 1) * 0.5) break; // save toward next tier
    }
  }
  if (t - lastReport >= 600) {
    lastReport = t;
    events.push([t, `--- dust/s ${L.dustPerSecond(s).toExponential(2)}, dust ${s.dust.toExponential(2)}, sing pending ${L.pendingSingularities(s)}`]);
  }
}
for (const [t, msg] of events) {
  const m = Math.floor(t / 60), sec = t % 60;
  console.log(`${String(m).padStart(3)}m${String(sec).padStart(2, "0")}s  ${msg}`);
}
console.log(`hand-bought units total: ${handBought}`);
