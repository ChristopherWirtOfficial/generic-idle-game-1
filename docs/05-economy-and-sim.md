# Economy tuning and the pacing sim

## Methodology

`npm run sim [hours] [resetPolicy] [scenario]` bundles src/game via
sim-core.ts and runs a greedy player: buys deepest-affordable with a
save-toward-deeper heuristic, auto-picks like a veteran (speed t0 until
sub-second, then value), resets at the pick policy, and — crucially — models
6s of HUMAN CEREMONY per reset (a machine chains 1s resets; a person sits
through the reveal). Every 25th reset is a deliberate push (hold for 2–3
picks). Without the push phases the sim never attempts depth and
understates progression; without ceremony time it wildly overstates late
reset rates.

**Run the sim after ANY economy change.** It has caught every degeneracy so
far. Eyeball: opening buy cadence, tier-2 time, first reset, tier 3–6 era
times, picks/resets ratio (~1.07 = stratification holding), late cadence,
speed equilibrium period, bestRun trajectory vs goal.

## The three degeneracies (why the mechanisms exist)

1. **speed pool runaway → the spigot.** speed weight accrued per completion;
   completions/sec is a physics quantity that explodes as period shrinks →
   pool went ~100% speed → ×Infinity by 90 sim-minutes. Fix: speed weight only
   accrues while period ≥ GLOW (0.3s). The graduation closes the spigot;
   equilibrium lands just under the glow line (currently speed L8, 0.22s).

2. **Multiplicative tableau overflow → additive levels.** Thousands of
   ×1.5–×3 picks compounded to Infinity. Additive (mult = 1+L) decelerates
   naturally and never zeroes marginal value.

3. **Static thresholds → the rising ladder.** With fixed pickAt, the
   snowball trivialized all three thresholds (1s runs, 3 picks each, 3593
   resets/2h). Ladder ×(1+0.12P)² restores permanent stratification. The
   ~25s mid-game chained cadence EMERGES from ladder-vs-snowball
   equilibrium rather than hand-tuning — treat that emergence as a feature
   and re-verify it survives tuning changes.

Historical: v2-era sim hit float Infinity at 70 min under LINEAR milestone
spans — doubling spans is not optional.

## Current constants rationale (s1 baseline)

Tier 1: 2s / cost 5 / growth 1.16. Christopher's explicit spec ("start at
5… should be faster. Default is .2/s should be more like .5/s"). The 1.16
growth also de-duplicates integer price steps (5,6,7,8,10,11,13…); at 1.10
the ceil produced 4-4-4-5-5 stutter. Earlier versions: cost 10/growth 1.10
gave a 55s first-unit payback — the original sin (one decision per minute
in a decisions-per-minute game).

Tiers 2–8: periods 10/20/40/80/160/320/640s (the 2→10 gap is an open
question, see 04). Costs 1e2/1.5e4/1.2e6/3e8/2e11/3e14/1e18, growths
1.13→1.37. Deep tiers are gated behind push runs by design — eras measured
in completions, not minutes.

pickAt [2e4, 2e7, 2e10]; ladder A=0.12 B=2; potency 1; rarity levels 1/2/4
at 70/25/5%; exotic 6%; BANK 20min/cap 6; trickle 60s.

## Current validated arc (s1, 5h sim)

First buy 9s → cycle-locked cadence → tier 2 ~1m49 → first reset ~5m33 →
tier 3 ~24m → tier 4 ~42m → tier 5 ~53m → tier 6 ~62m → bestRun 2.6e14 by
3.5h. Goal 1e15 ≈ 6–8 veteran-hours ≈ days of normal play with offline
banking. Late chain: ~1s runs + ceremony, 1 pick each, ~1.07 picks/reset.

## Scenario table

s1 baseline (goal 1e15) — fully simmed. s2: 4 tiers, growths +~0.05, spans
50, goal 1e12 — spot-checked (first reset 18.5m). s3: milestones ×3, spans
75, costs ×10, thresholds ×10 — goal UNVERIFIED. s4: tier 4 dead
(baseValue 0), tier 5→tier 3 at 0.5 — goal UNVERIFIED (liquidation and
step handle it; smoke-tested mechanically). s5: periods ÷4, growths +0.06 —
goal UNVERIFIED.
