# Generic Idle Game 1 — v3

A management idle game shipped as a single Claude artifact (React .jsx). The
repo is the source of truth; the artifact is compiled output.

## Full design context

`docs/` carries the complete handoff: history and the failure pattern that
produced the design law (01), the reference-game research this taste is
built on (02), every settled decision with rationale (03), rejected ideas
and open questions (04), sim methodology and tuning rationale (05), chrome
intent and the pending art-direction session (06), and collaboration
process (07). Read docs/00-INDEX.md before making design-level changes.

## Commands

- `npm run dev` — vite dev server
- `npm test` — typecheck + logic smoke + jsdom end-to-end
- `npm run sim [hours] [resetPolicy] [scenario]` — pacing simulation (greedy
  player, veteran auto-picks, chain/push alternation). Run this after ANY
  economy change; it has caught every degenerate loop so far.
- `npm run ship` — build, flatten to `dist-artifact/generic-idle-game-1.jsx`,
  SSR + dom smoke. The flattened file is what gets pasted/shipped as the
  artifact. `scripts/flatten.mjs` holds the FILES dependency order.

## Architecture

- `src/game/` — pure logic, no React. `constants.ts` is the tuning surface
  (scenario constitutions live here). `logic.ts` is the whole economy.
- `src/ui/` — instrument-skin components. `Rail.tsx` owns wheel arcs via rAF
  (economy ticks at 10Hz; animation extrapolates at display refresh).
- `scripts/` — flatten pipeline, pacing sim, smoke tests, jsdom e2e.
- Saves: `window.storage` key `gig1:save3`, hardened revive in `save.ts`.

## Design constitution (violate nothing here without discussion)

- **Raw content, rich chrome.** Content gets zero conceit: tiers are numbers
  1–8, currency is a bare score, no lore. Chrome may have a voice but never
  generates nouns. The instrument never lies: displayed prices are charged
  prices (integer ceil), a wheel only sweeps if it is actually producing.
- **No dead stats, no piecewise.** Every stat affects the bottom line forever.
  Speed divides the period with no floor; the discrete→glow switch at 0.3s
  lives ONLY in the renderer. The tableau is additive levels (mult = 1 + L):
  equal absolute chunks forever, naturally diminishing relative.
- **Unit production is integer.** You can't make 0.75 of a generator: every
  multiplier touching unit output is an integer (potency +1/level, milestones
  ×2/×3). Fractions appear only where a scenario's diff says so (s4's half-rate
  bridge), and small values display exactly (fmtVal), never floored.
- **Decisions per minute is the engagement currency.** No tap/press mechanic.
  If a change adds waiting without adding a pending decision, it's wrong.
- **Runs end by player timing** (layer 1); scenarios end at explicit reach
  goals (layer 2). Ceremony-longer-than-run chaining is a celebrated
  playstyle, not degeneracy.
- **Pool sculpting is behavioral**: buys → cst weight, milestone crossings →
  val weight, discrete completions → spd weight (the glow graduation closes
  the spd spigot itself — this self-limiting is load-bearing, keep it).
- **Pick thresholds ride a rising ladder** (×(1+0.12·picks)²) so run length
  stays a live choice as the tableau snowballs.
- **Offline is preparation, not production**: away time banks draw options
  and holds wheel phase; it never simulates decisions nobody made.
- **Starting units are held, not bought**: runs open with one tier 1 on the
  wheel; gifts never touch the price ladder or milestones.

## Current tuning state (sim-validated)

Opening: first buy ~10s, then cycle-locked cadence. Tier 2 ~2m, first reset
~5m45, tier 3 ~28m, tiers 4–6 across 51–91m via push runs, s1 goal 1e15 ≈
6–8 veteran-hours. Known wants: s3–s5 goals set with margin, not fully
sim-verified; CUSTOM scenario is a locked stub; chrome voice is deliberately
restrained pending a joint art-direction pass.
