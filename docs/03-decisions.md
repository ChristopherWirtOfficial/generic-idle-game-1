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

Per-run draw weights written by play, reset clears. All three sources are
priced in the SAME currency, or one out-shouts the others by accident of
measurement:
- buys → cost weight, 20 per DOUBLING of hand-bought stake
- milestone crossings → value, 20 each (spans double, so already log-scaled)
- time watching an unglowed wheel → speed, 0.25/sec

Speed ONLY accrues while period ≥ GLOW threshold; the glow graduation closes
its own spigot. This self-limiting is load-bearing: without it the sim hit
speed ×Infinity (completions/sec is a physics quantity that feeds itself).

The units were originally cost +1/unit and speed +0.5/completion, and both
were wrong in the same way — they measured a thing that scales with how
CHEAP or how FAST a tier already is. Cost per unit meant a tier you had made
cheap got bought more, wrote more weight, and was offered more cost cards,
making it cheaper still: a 79%-cost monoculture by 180 sim-minutes. Speed
per completion scales as 1/period, so 2s tiers drowned in speed weight while
640s tiers got ~0 — speed was unofferable on exactly the tiers that needed
it (0.6% of offers). Per-doubling and per-second-watched are the same
quantities measured on a scale that doesn't self-amplify.

**Per-tier damping.** A tier's weight is divided by (1 + POOL_DAMP × levels
already held on that tier), POOL_DAMP 0.08 (was 0.02 — see shaping below).
The raw loop is positive feedback; this makes it negative, so the pool leans
elsewhere as your stake in a tier deepens — which is what you want, since
additive levels are worth progressively less to a tier you've already built.
Damping is per TIER, not per (tier,stat), so it never refuses to sell you the
specific line you're building.

Cost, honestly: damping is slower. Tier 3 24m→31m, tier 6 62m→78m, best run
at 150m 1.2e14→7.1e13. POOL_DAMP is the dial.

Visible as the RESET-tab histogram: IG1's folklore shallow-reset trick,
moved into the interface as the strategy surface.

## Shaping: the signal was right, the mapping was wrong

The three sources measure engagement honestly and then the draw squandered
it, because probability was taken PROPORTIONAL to weight. Cost weight is
20·log2(stake) and lands in the hundreds; speed weight is 0.25/s and a
chained run is eight seconds long, so it lands at two. Fifty to one becomes
"cost, always". Measured on the old build past two hours: 90% of every card
offered was a cost card, speed totalled 0.3%, and tier-1 value — one of the
largest income levers in the game — was 0.1% of cards and 0.4% of hands.
That is a dead stat and a dead line, in a game whose first law is that
there are none.

Three changes, all in the mapping, none in the sources:

- **Exponent.** Sample on w^POOL_ALPHA, alpha 0.45. Preserves the ORDER of
  the signal and kills the landslide. Measured alone: value cards roughly
  double at every stage, speed goes 1.7%→11% at 30–60m, cost 86%→67%.
  It does NOT reduce tier-1's share — tier 1 owns both the loudest line
  (t1 cost) and the quietest (t1 value ≈ 0), so compressing the range helps
  it as much as it hurts it. Alpha fixes the stat monoculture, not the tier
  skew, and it cannot touch a line at literal zero: w^alpha of 0 is 0.
- **Rails, quoted in EVEN SPLITS.** With n known lines an even split is 1/n;
  POOL_FLOOR 0.25 is the floor in those units and POOL_CAP 2.2 the ceiling.
  Quoting both this way makes the shape scale-free — the pool looks the same
  at three known lines and at twenty-one — and lets the histogram draw one
  tick and read the whole band off it. The floor is the only thing that can
  answer a zero. The cap's spill is FLAT, not proportional, or a cost
  landslide just gets handed to the next cost line down.
- **No replacement.** The hand is drawn from a bag that refills only once
  every line has been offered. Three independent samples from a skewed pool
  were the same line about half the time (48% of hands carried a duplicate,
  35% at the worst stage), which spends the whole "choose from N" premise on
  nothing. Now: 0% duplicates, and hands offering ≥2 different stats go
  33%→79%.

The floor damps. A flat floor is a promise that never diminishes, and a
promise that never diminishes is a focus engine — pour every pick into one
line and the pool keeps handing it back at full odds forever. The floor
slice is shared along per-tier damping like every other weight, and
POOL_DAMP went 0.02→0.08 so it bites hard enough to be felt against it.

Cost, honestly, and it is not small: giving the veteran the levers they were
asking for compounds through the chain. s1's 1e15 goal falls at ~2h25
against ~6h before. This was swept across alpha 0.25–1.0, floor 0–0.55, cap
1.6–off, damp 0.02–0.5, THRESH_A 0.12–0.75 and THRESH_B 2–4: the goal clock
never left 82–147 minutes. There is no draw-side dial that restores six
hours, because the compression is the fix working. If the arc matters more
than the draw, the compensator is the layer-2 dial — the scenario goal.

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
Chips show resulting multipliers (value L1 ×2) so levels are legible.

## Ceremony

Sized to reveal-and-choose, no longer — "the ceremony is the information,
not a fireworks show." Current: cash-out figure + card fan + KEEP.
Deliberately modest pending art direction.
