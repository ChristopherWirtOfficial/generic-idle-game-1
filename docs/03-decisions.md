# Settled decisions, with rationale

Each entry: the decision, why, and how it evolved. Constants live in
`src/game/constants.ts`; this explains them.

## Chassis: free-running chain, reset as governor

Tier N pays tier N−1; tier 1 pays score. Produced units are FULLY
productive and uncapped. The chain's hyperexponential escape is not a
balance failure — it's the run's fuse. "Escape velocity ends the run": when
it goes vertical, that's the victory lap into the next reset. Each run only
needs shape over its intended window; the meta re-tunes the next window;
scenarios deliberately re-tune exponents as content. (This replaced a
capacity-gating model that died hard — see 04.)

## Bought-count ledger (the Antimatter Dimensions trick)

Prices and milestones key off hand-bought count ONLY. Produced units never
touch either. This keeps buying and cost-reduction permanently meaningful
without gating flow. Milestones: first span 25 (scenario-variable), spans
double (25/75/175…), ×2 value each (×3 in s3). Doubling spans is
load-bearing: linear spans hit float Infinity at 70 minutes in the v2 sim.

## Cycles: one formula, no piecewise

Each tier has phase ∈ [0,1); progress accrues dt/period; whole completions
pay held(floor) × unitValue into the target; the fraction stays as phase.
Same formula in both regimes. GLOW_PERIOD_S = 0.3 exists ONLY in the
renderer (sweep vs glow). Speed divides the period with no floor, so ×N
speed pays ×N forever — there's a smoke test proving the ratio holds across
the glow boundary. This directly fixes IG1's dead speed stat while keeping
the graduation moment Christopher loves.

## Phase semantics: frozen heat

Phase persists through reset AND freezes when a tier holds nothing. "A
wheel with nothing on it does not turn." Evolution: originally phases
advanced always (warm wheels); Christopher hit tier 2 visibly cycling while
owning zero of it — the display implied production. Persist ≠ keep
spinning. Frozen wheels resume from their held phase when you own one.

## Pool sculpting (behavioral triad)

Per-run draw weights written by play, reset clears: buys → cst weight
(+1/unit), milestone crossings → val (+20 each), discrete cycle completions
→ spd (+0.5 each) — but spd ONLY accrues while period ≥ GLOW threshold. The
glow graduation closes its own spigot. This self-limiting is load-bearing:
without it the sim hit spd ×Infinity (completions/sec is a physics quantity
that feeds itself). Visible as the RESET-tab histogram: IG1's folklore
shallow-reset trick, moved into the interface as the strategy surface.

## Draws and the tableau

Reset rolls BASE_DRAW 3 + banked options, weighted by the pool; you take
`picks` of them. Picks are permanent per scenario, stored as additive
LEVELS: mult = 1 + L, rarity grants 1/2/4 levels at 70/25/5%. Additive
because multiplicative stacking overflowed (×1.5^thousands); additive gives
equal absolute chunks forever with naturally diminishing relative impact —
exactly the sanctioned "eh, at least it affects my bottom line" asymptote.
Potency is 1 (integer) because "you can't make .75 of a generator": all
unit-production multipliers are integers. Exotics at 6%: HOTSTART (+5 held
tier 1 per stack) and FLYWHEEL (unique; every wheel to phase 0.999 on
reset). Gifts are held-not-bought — hotstart's old bought+=5 silently
pushed prices ×1.16⁵, a hidden cost, removed.

## Rising pick ladder

Thresholds = pickAt[k] × (1 + 0.12·totalPicks)². Without it, static
thresholds trivialized: 1-second runs earning 3 picks by hour two. The
ladder keeps "how deep this run?" a live question forever. Cheat-granted
levels deliberately don't move the ladder. Late-game 1s-run chaining IS
allowed — the human floor is ceremony time, and ceremony-outlasting-runs is
celebrated (see 02).

## Liquidation

At reset every held unit fires once, telescoping top-down into the final
run score, which counts toward thresholds. Held stock has terminal value;
reset timing is a real micro-decision; the cascade is mechanically real,
not theater.

## Runs and layers

Layer 1 ends by player timing (sublinear yield makes overstaying felt — the
ladder + threshold spacing do this). Layer 2: five scenarios with explicit
reach goals ("as hard or as easy as we hope a specific scenario would be"),
presented as raw diff lines. s4 varies topology (dead tier 4; tier 5 → tier
3 at 0.5 efficiency — the TierDef target/efficiency fields exist for this).
Beat one to open the next. Per-scenario progress is fully separate
(tableau, exotics, resets, everBought). CUSTOM slot visible, locked "SOON"
(IG1's Game God analog).

## Offline = preparation, not production

"A management game where the activity is decisions shouldn't pretend
decisions happened while you slept." Away time banks +1 draw option per 20
min (cap 6) — widening the next draw's CHOICE, not its pick count — plus a
60s-of-tier-1 trickle and phase held frozen (owned wheels advance mod
period). Also applied on tab-visibility return ≥60s. Inspired by IG1's
offline-charges-prestige accident; also spares us simulating hypergrowth
offline.

## Opening

Runs start holding one tier 1 (held, not bought), score 0. First payout at
~2s, first buy ~10s, then cadence locks to the cycle. Tier 1: 2s period
(0.5/s per unit), cost 5, growth 1.16 — Christopher's explicit numbers
after playtesting two slower versions (a 55s first-unit payback, then a
4-4-4-5-5 rounded ladder; the fast growth is what de-duplicates integer
price steps).

## Honest instrument (display law)

Three separate playtest bugs were the display lying: prices shown floored
while charging fractions (fix: economy ceils, integer prices), 1.75
unit-value shown as "1" (fix: fmtVal, exact small values), sweeping wheels
on unowned tiers. The law: what the instrument shows is what is true.
Chips show resulting multipliers (val L1 ×2) so levels are legible.

## Ceremony

Sized to reveal-and-choose, no longer — "the ceremony is the information,
not a fireworks show." Current: cash-out figure + card fan + KEEP.
Deliberately modest pending art direction.
